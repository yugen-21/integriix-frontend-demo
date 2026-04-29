const DEFAULT_TTS_API_URL = "http://localhost:8000/api/tts";

const TTS_API_URL =
  import.meta.env.VITE_TTS_API_URL?.trim() || DEFAULT_TTS_API_URL;

export async function fetchSceneVoiceovers(narrative, signal) {
  const audioEntries = await Promise.all(
    narrative.map(async (scene) => {
      const response = await fetch(TTS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: scene.voiceover,
        }),
        signal,
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`TTS failed for ${scene.id}: ${detail}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const durationInSeconds = await getAudioDuration(url);

      return [scene.id, { durationInSeconds, url }];
    }),
  );

  return Object.fromEntries(audioEntries);
}

export function releaseSceneVoiceovers(audioBySceneId) {
  Object.values(audioBySceneId).forEach((audio) => {
    URL.revokeObjectURL(audio.url);
  });
}

function getAudioDuration(url) {
  return new Promise((resolve, reject) => {
    const audio = new window.Audio();

    audio.preload = "metadata";
    audio.src = url;

    audio.onloadedmetadata = () => {
      resolve(audio.duration);
      audio.removeAttribute("src");
      audio.load();
    };

    audio.onerror = () => {
      reject(new Error("Unable to read generated audio duration"));
      audio.removeAttribute("src");
      audio.load();
    };
  });
}
