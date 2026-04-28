import { useCallback, useEffect, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { DailyBriefVideo } from "../../../remotion/DailyBriefVideo";
import {
  dailyBriefNarrative,
  getDailyBriefDurationInFrames,
  DAILY_BRIEF_FPS,
  DAILY_BRIEF_WIDTH,
  DAILY_BRIEF_HEIGHT,
} from "../../../remotion/narrativeBuilder";

/* ── helpers ─────────────────────────────────────────────── */

function getSceneAtFrame(narrative, frame) {
  let cum = 0;
  for (const s of narrative) {
    if (frame < cum + s.durationInFrames) return s;
    cum += s.durationInFrames;
  }
  return narrative.at(-1);
}

/* ── component ───────────────────────────────────────────── */

function DailyBriefVideoPlaceholder() {
  const playerRef = useRef(null);
  const pollRef = useRef(null);
  const sceneIdRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);

  // Load voices (some browsers load async)
  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) setVoiceReady(true);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const speakingRef = useRef(false);
  const pendingSceneRef = useRef(null);

  const speakText = useCallback((text, onDone) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    utter.pitch = 1;
    utter.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const pick =
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("Samantha")) ||
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google")) ||
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("Daniel")) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (pick) utter.voice = pick;
    speakingRef.current = true;
    utter.onend = () => {
      speakingRef.current = false;
      if (onDone) onDone();
    };
    utter.onerror = () => {
      speakingRef.current = false;
      if (onDone) onDone();
    };
    window.speechSynthesis.speak(utter);
  }, []);

  // When speech finishes and there's a pending scene, start it
  const advanceToNextScene = useCallback(() => {
    const player = playerRef.current;
    const next = pendingSceneRef.current;
    if (!player || !next) return;
    pendingSceneRef.current = null;
    sceneIdRef.current = next.id;
    player.play();
    setPlaying(true);
    speakText(next.voiceover, advanceToNextScene);
  }, [speakText]);

  // Poll the player's frame to detect scene changes
  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;

      const frame = player.getCurrentFrame();
      const scene = getSceneAtFrame(dailyBriefNarrative, frame);

      if (scene && scene.id !== sceneIdRef.current) {
        if (speakingRef.current) {
          // Voice still going — pause video and queue next scene
          pendingSceneRef.current = scene;
          player.pause();
          // Don't cancel speech; let it finish naturally
        } else {
          // Voice done — start next scene immediately
          sceneIdRef.current = scene.id;
          speakText(scene.voiceover, advanceToNextScene);
        }
      }

      // Chrome bug: speechSynthesis pauses after ~15s. Resume it.
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        // keep alive
      } else if (window.speechSynthesis.paused && speakingRef.current) {
        window.speechSynthesis.resume();
      }
    }, 250);
  }, [speakText, advanceToNextScene]);

  const stopPolling = useCallback(() => {
    clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      window.speechSynthesis.cancel();
    };
  }, [stopPolling]);

  // User-gesture-driven play (required by browsers for speechSynthesis)
  const handlePlayBriefing = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (playing) {
      // Pause
      player.pause();
      window.speechSynthesis.pause();
      stopPolling();
      setPlaying(false);
    } else {
      // Play
      player.play();
      if (window.speechSynthesis.paused && speakingRef.current) {
        // Resume paused speech
        window.speechSynthesis.resume();
      } else {
        // Speak the current scene immediately (user gesture context)
        const frame = player.getCurrentFrame();
        const scene = getSceneAtFrame(dailyBriefNarrative, frame);
        if (scene) {
          sceneIdRef.current = scene.id;
          speakText(scene.voiceover, advanceToNextScene);
        }
      }
      startPolling();
      setPlaying(true);
    }
  }, [playing, speakText, startPolling, stopPolling, advanceToNextScene]);

  const handleRestart = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    window.speechSynthesis.cancel();
    sceneIdRef.current = null;
    stopPolling();
    player.seekTo(0);
    player.pause();
    setPlaying(false);
  }, [stopPolling]);

  return (
    <section className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4 p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-normal text-cyan-700">
            Daily Brief Video
          </p>
          <h2 className="mt-3 text-2xl font-black leading-tight text-slate-950">
            Executive video briefing
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRestart}
            className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
          >
            ↺ Restart
          </button>
          <button
            onClick={handlePlayBriefing}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${
              playing
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-cyan-600 text-white hover:bg-cyan-700"
            }`}
          >
            {playing ? (
              <>
                <span className="flex gap-0.5">
                  <span className="h-3.5 w-1 rounded-sm bg-red-500" />
                  <span className="h-3.5 w-1 rounded-sm bg-red-500" />
                </span>
                Pause Briefing
              </>
            ) : (
              <>
                <span className="text-base">▶</span>
                Play Briefing
              </>
            )}
          </button>
          {voiceReady && (
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-bold text-emerald-600">Voice ready</span>
            </span>
          )}
        </div>
      </div>

      <div className="mx-6 mb-6 overflow-hidden rounded-2xl border border-slate-200">
        <Player
          ref={playerRef}
          component={DailyBriefVideo}
          inputProps={{ narrative: dailyBriefNarrative }}
          durationInFrames={getDailyBriefDurationInFrames()}
          compositionWidth={DAILY_BRIEF_WIDTH}
          compositionHeight={DAILY_BRIEF_HEIGHT}
          fps={DAILY_BRIEF_FPS}
          style={{ width: "100%" }}
          controls
          autoPlay={false}
        />
      </div>
    </section>
  );
}

export default DailyBriefVideoPlaceholder;
