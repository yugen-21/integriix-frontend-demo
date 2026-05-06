import { useEffect, useMemo, useState } from "react";
import { Player } from "@remotion/player";
import { DailyBriefVideo } from "../../../remotion/DailyBriefVideo";
import {
  dailyBriefNarrative,
  getDailyBriefDurationInFrames,
  DAILY_BRIEF_FPS,
  DAILY_BRIEF_WIDTH,
  DAILY_BRIEF_HEIGHT,
  DAILY_BRIEF_VOICEOVER_EXIT_FRAMES,
  DAILY_BRIEF_VOICEOVER_START_FRAME,
} from "../../../remotion/narrativeBuilder";
import {
  fetchSceneVoiceovers,
  releaseSceneVoiceovers,
} from "../../../services/ttsAudio";

function DailyBriefVideoPlaceholder() {
  const [audioBySceneId, setAudioBySceneId] = useState({});
  const [narrative, setNarrative] = useState(dailyBriefNarrative);
  const [audioState, setAudioState] = useState("loading");
  const [audioError, setAudioError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let generatedAudio = {};

    fetchSceneVoiceovers(dailyBriefNarrative, controller.signal)
      .then((sceneAudio) => {
        generatedAudio = sceneAudio;
        setAudioBySceneId(sceneAudio);
        setNarrative(
          getNarrativeWithAudioDurations(dailyBriefNarrative, sceneAudio),
        );
        setAudioState("ready");
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setAudioState("error");
        setAudioError(error.message);
      });

    return () => {
      controller.abort();
      releaseSceneVoiceovers(generatedAudio);
    };
  }, []);

  const isAudioReady =
    audioState === "ready" &&
    narrative.every((scene) => audioBySceneId[scene.id]);

  const audioUrlsBySceneId = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(audioBySceneId).map(([sceneId, audio]) => [
          sceneId,
          audio.url,
        ]),
      ),
    [audioBySceneId],
  );

  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 max-[520px]:p-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-cyan-700">
            Daily Brief Video
          </p>
          <h2 className="mt-1.5 text-lg font-semibold leading-tight text-slate-900">
            Executive video briefing
          </h2>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
          {audioState === "loading" && "Generating voiceover"}
          {audioState === "ready" && "Audio ready"}
          {audioState === "error" && "Audio unavailable"}
        </div>
      </div>

      {audioState === "error" && (
        <div className="mx-5 mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 max-[520px]:mx-4">
          {audioError}
        </div>
      )}

      <div className="mx-5 mb-5 min-w-0 overflow-hidden rounded-xl border border-slate-200 max-[520px]:mx-4 max-[520px]:mb-4">
        <Player
          component={DailyBriefVideo}
          inputProps={{
            narrative,
            audioBySceneId: audioUrlsBySceneId,
          }}
          durationInFrames={getDailyBriefDurationInFrames(narrative)}
          compositionWidth={DAILY_BRIEF_WIDTH}
          compositionHeight={DAILY_BRIEF_HEIGHT}
          fps={DAILY_BRIEF_FPS}
          style={{ width: "100%" }}
          controls
          autoPlay={false}
          clickToPlay={isAudioReady}
        />
      </div>
    </section>
  );
}

function getNarrativeWithAudioDurations(baseNarrative, sceneAudio) {
  return baseNarrative.map((scene) => {
    const audio = sceneAudio[scene.id];

    if (
      !audio?.durationInSeconds ||
      !Number.isFinite(audio.durationInSeconds)
    ) {
      return scene;
    }

    const audioDurationInFrames = Math.ceil(
      audio.durationInSeconds * DAILY_BRIEF_FPS,
    );
    const fittedDurationInFrames =
      DAILY_BRIEF_VOICEOVER_START_FRAME +
      audioDurationInFrames +
      DAILY_BRIEF_VOICEOVER_EXIT_FRAMES;

    return {
      ...scene,
      durationInFrames: Math.max(
        scene.durationInFrames,
        fittedDurationInFrames,
      ),
    };
  });
}

export default DailyBriefVideoPlaceholder;
