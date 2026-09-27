import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { EdgeTTS } from "node-edge-tts";

const VOICES = {
  "egyptian-light": { voice: "ar-EG-SalmaNeural", lang: "ar-EG" },
  "american-conversational": { voice: "en-US-AndrewNeural", lang: "en-US" },
  ar: { voice: "ar-EG-SalmaNeural", lang: "ar-EG" },
  en: { voice: "en-US-AndrewNeural", lang: "en-US" },
};

function textOf(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function linesFor(props) {
  const language = textOf(props.script?.language) || (props.region === "world" ? "en" : "ar");
  const hook = textOf(props.script?.hook) || (language === "ar" ? "ملخص سريع." : "Quick rundown.");
  const outro = textOf(props.script?.outro) || (language === "ar" ? "نكمّل في الفيديو اللي بعده." : "More after this.");
  const lines = [{ role: "intro", text: hook }];

  for (const story of props.stories || []) {
    const beat = (props.script?.beats || []).find((item) => item.storyId === story.id);
    lines.push({
      role: "story",
      storyId: story.id,
      text: textOf(beat?.spoken) || textOf(story.brief) || textOf(story.title),
    });
  }

  lines.push({ role: "outro", text: outro });
  return { language, lines };
}

async function fileDuration(audioSrc) {
  const info = await stat(audioSrc);
  // Edge default used below is 48 kbps mono MP3.
  return (info.size * 8) / 48000;
}

async function cuesFor(subtitlePath, duration, text) {
  try {
    const parts = JSON.parse(await readFile(subtitlePath, "utf8"));
    if (Array.isArray(parts) && parts.length) {
      return parts
        .map((part) => ({
          word: textOf(part.part),
          start: Number(part.start) / 1000,
          end: Number(part.end) / 1000,
          confidence: 1,
        }))
        .filter((word) => word.word);
    }
  } catch {
    // Fall through to an even split when Edge does not write cues.
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length || !duration) {
    return [];
  }

  const slice = duration / words.length;
  return words.map((word, index) => ({
    word,
    start: index * slice,
    end: (index + 1) * slice,
    confidence: 0.5,
  }));
}

export async function narrateProps(props, audioDir, onProgress) {
  const { language, lines } = linesFor(props);
  const voice = VOICES[textOf(props.script?.voice)] || VOICES[language] || VOICES.ar;
  const tts = new EdgeTTS({
    voice: voice.voice,
    lang: voice.lang,
    outputFormat: "audio-24khz-48kbitrate-mono-mp3",
    saveSubtitles: true,
    timeout: 30000,
    rate: "+5%",
  });
  const tracks = [];
  await mkdir(audioDir, { recursive: true });

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const audioSrc = path.join(audioDir, `${index}.mp3`);
    let duration = 0;
    let words = [];

    if (line.text) {
      try {
        await tts.ttsPromise(line.text, audioSrc);
        const fallback = await fileDuration(audioSrc);
        words = await cuesFor(`${audioSrc}.json`, fallback, line.text);
        const lastCue = words.length ? words[words.length - 1].end : 0;
        duration = lastCue > 0.2 ? lastCue : fallback;
      } catch (error) {
        console.error("[narrate]", error?.message || error);
        duration = 0;
        words = [];
      }
    }

    tracks.push({
      role: line.role,
      storyId: line.storyId || "",
      text: line.text,
      audioSrc: duration ? audioSrc : "",
      duration,
      words,
    });

    if (onProgress) {
      await onProgress(index + 1, lines.length);
    }
  }

  return tracks;
}
