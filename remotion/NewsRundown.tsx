import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  staticFile,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getActiveWordIndex, getCaptionStyleCSS, getVisibleWords } from "./integrations/animated-captions";

export const FPS = 30;
const INTRO_SECONDS = 5;
const OUTRO_SECONDS = 4;

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  "economy-political": { ar: "السياسة والاقتصاد", en: "Politics & Economy" },
  sports: { ar: "الرياضة", en: "Sports" },
  trend: { ar: "الترند", en: "Trends" },
};

const COLORS = {
  ink: "#0a101c",
  paper: "#ecf1f8",
  muted: "#a8b4c6",
  gold: "#e8b84a",
  steel: "#9cb8dc",
};

export interface NewsBeat {
  storyId: string;
  spoken?: string;
  onScreen?: string;
  estimatedSeconds?: number;
}

export interface NewsStory {
  id: string;
  title?: string;
  brief?: string;
  media?: {
    kind?: string;
    url?: string;
  };
}

export interface NewsScript {
  language?: string;
  voice?: string;
  hook?: string;
  outro?: string;
  beats?: NewsBeat[];
}

export interface NarrationWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface NarrationTrack {
  role: "intro" | "story" | "outro";
  storyId?: string;
  text: string;
  audioSrc: string;
  duration: number;
  words: NarrationWord[];
}

export interface NewsRundownProps {
  region: string;
  category: string;
  stories: NewsStory[];
  script: NewsScript | null;
  tracks?: NarrationTrack[];
}

interface MediaRef {
  kind: "video" | "image" | "none";
  url: string;
}

interface PlannedScene {
  type: "intro" | "story" | "outro";
  seconds: number;
  frames: number;
  story?: NewsStory;
  beat?: NewsBeat;
  track?: NarrationTrack;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function textOf(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

export function categoryLabel(categoryId: string, language: string) {
  const labels = CATEGORY_LABELS[categoryId] || CATEGORY_LABELS["economy-political"];
  return language === "ar" ? labels.ar : labels.en;
}

function mediaOf(story?: NewsStory): MediaRef {
  const url = textOf(story?.media?.url);
  if (!url) {
    return { kind: "none", url: "" };
  }

  const kind =
    story?.media?.kind === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(url) ? "video" : "image";

  return { kind, url };
}

function secondsForBeat(beat?: NewsBeat) {
  const value = Number(beat?.estimatedSeconds);
  if (Number.isFinite(value) && value > 0) {
    return clamp(value, 6, 20);
  }

  return 8;
}

export function resolveLanguage(props: NewsRundownProps) {
  return textOf(props.script?.language) || (props.region === "world" ? "en" : "ar");
}

function findTrack(props: NewsRundownProps, role: NarrationTrack["role"], storyId?: string) {
  return (props.tracks || []).find((track) => {
    if (track.role !== role) {
      return false;
    }

    return role !== "story" || track.storyId === storyId;
  });
}

function timedSeconds(track: NarrationTrack | undefined, fallback: number) {
  const duration = Number(track?.duration);
  if (track?.audioSrc && Number.isFinite(duration) && duration > 0.3) {
    return duration + 0.45;
  }

  return fallback;
}

export function scenePlan(props: NewsRundownProps) {
  const language = resolveLanguage(props);
  const stories = Array.isArray(props.stories) ? props.stories : [];
  const beats = props.script?.beats || [];
  const introTrack = findTrack(props, "intro");
  const outroTrack = findTrack(props, "outro");
  const scenes: PlannedScene[] = [
    {
      type: "intro",
      seconds: timedSeconds(introTrack, INTRO_SECONDS),
      frames: Math.round(timedSeconds(introTrack, INTRO_SECONDS) * FPS),
      track: introTrack,
    },
  ];

  stories.forEach((story) => {
    const beat = beats.find((item) => item.storyId === story.id);
    const track = findTrack(props, "story", story.id);
    const seconds = timedSeconds(track, secondsForBeat(beat));
    scenes.push({
      type: "story",
      seconds,
      frames: Math.round(seconds * FPS),
      story,
      beat,
      track,
    });
  });

  scenes.push({
    type: "outro",
    seconds: timedSeconds(outroTrack, OUTRO_SECONDS),
    frames: Math.round(timedSeconds(outroTrack, OUTRO_SECONDS) * FPS),
    track: outroTrack,
  });

  return {
    language,
    scenes,
    totalFrames: scenes.reduce((sum, scene) => sum + scene.frames, 0),
  };
}

const fontFamily = '"Segoe UI", "Tahoma", "Arial", sans-serif';

function FadeIn({ children }: { children: React.ReactNode }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
}

function Backdrop() {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <div
        style={{
          position: "absolute",
          width: 720,
          height: 720,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,184,74,0.16) 0%, transparent 68%)",
          top: -220,
          right: -80,
        }}
      />
    </AbsoluteFill>
  );
}

function MediaFill({ media }: { media: MediaRef }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.06], {
    extrapolateRight: "clamp",
  });

  if (media.kind === "video") {
    return (
      <AbsoluteFill>
        <OffthreadVideo
          src={media.url}
          volume={0}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    );
  }

  if (media.kind === "image") {
    return (
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <Img src={media.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
    );
  }

  return <Backdrop />;
}

function StoryScene({
  story,
  beat,
  language,
  captioned,
}: {
  story: NewsStory;
  beat?: NewsBeat;
  language: string;
  captioned: boolean;
}) {
  const media = mediaOf(story);
  const headline = textOf(beat?.onScreen) || textOf(story.title) || "Story";
  const spoken = textOf(beat?.spoken) || textOf(story.brief);
  const align = language === "ar" ? "right" : "left";

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink, fontFamily }}>
      <MediaFill media={media} />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(10,16,28,0.15) 30%, rgba(10,16,28,0.92) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 56,
          right: 56,
          bottom: 48,
          direction: language === "ar" ? "rtl" : "ltr",
          textAlign: align,
        }}
      >
        <div
          style={{
            color: COLORS.paper,
            fontSize: 42,
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          {headline}
        </div>
        {spoken && spoken !== headline && !captioned ? (
          <div
            style={{
              marginTop: 16,
              color: COLORS.muted,
              fontSize: 24,
              lineHeight: 1.4,
              maxWidth: 980,
              marginLeft: language === "ar" ? "auto" : 0,
            }}
          >
            {spoken}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}

function IntroScene({
  language,
  category,
  hook,
}: {
  language: string;
  category: string;
  hook: string;
}) {
  const label = categoryLabel(category, language);
  const line = hook || (language === "ar" ? "ملخص سريع." : "Quick rundown.");

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Backdrop />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 88px",
          direction: language === "ar" ? "rtl" : "ltr",
          textAlign: language === "ar" ? "right" : "left",
        }}
      >
        <div style={{ width: 72, height: 4, background: COLORS.gold, marginBottom: 28 }} />
        <div style={{ color: COLORS.steel, fontSize: 28, fontWeight: 600 }}>{label}</div>
        <div
          style={{
            marginTop: 22,
            color: COLORS.paper,
            fontSize: 46,
            fontWeight: 700,
            lineHeight: 1.3,
            maxWidth: 980,
          }}
        >
          {line}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function OutroScene({ language, outro }: { language: string; outro: string }) {
  const line = outro || (language === "ar" ? "نكمّل في الفيديو اللي بعده." : "More after this.");

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Backdrop />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: language === "ar" ? "flex-end" : "flex-start",
          padding: "0 88px",
          direction: language === "ar" ? "rtl" : "ltr",
        }}
      >
        <div
          style={{
            color: COLORS.paper,
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.35,
            maxWidth: 900,
            textAlign: language === "ar" ? "right" : "left",
          }}
        >
          {line}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function CaptionBar({ words, language }: { words: NarrationWord[]; language: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const visible = getVisibleWords(words, time, language === "ar" ? 4 : 5);
  const activeIndex = getActiveWordIndex(words, time);

  if (!visible.length) {
    return null;
  }

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", pointerEvents: "none" }}>
      <div
        style={{
          marginBottom: 36,
          maxWidth: 1000,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          direction: language === "ar" ? "rtl" : "ltr",
          background: "rgba(10,16,28,0.55)",
          borderRadius: 16,
          padding: "10px 16px",
        }}
      >
        {visible.map((word) => {
          const index = words.indexOf(word);
          const style = getCaptionStyleCSS(
            {
              style: "tiktok",
              fontFamily,
              fontSize: language === "ar" ? 34 : 40,
              color: COLORS.paper,
              activeColor: COLORS.gold,
              shadow: true,
            },
            index === activeIndex
          );

          return (
            <span key={`${word.start}-${word.word}`} style={{ ...style, transition: "none" }}>
              {word.word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

export const NewsRundown: React.FC<NewsRundownProps> = (props) => {
  const plan = scenePlan(props);
  let cursor = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      {plan.scenes.map((scene, index) => {
        const from = cursor;
        cursor += scene.frames;
        const words = scene.track?.words || [];

        return (
          <Sequence key={`${scene.type}-${index}`} from={from} durationInFrames={scene.frames}>
            {scene.track?.audioSrc ? (
              <Audio src={/^https?:\/\//i.test(scene.track.audioSrc) ? scene.track.audioSrc : staticFile(scene.track.audioSrc)} />
            ) : null}
            <FadeIn>
              {scene.type === "intro" ? (
                <IntroScene
                  language={plan.language}
                  category={props.category}
                  hook={textOf(props.script?.hook)}
                />
              ) : null}
              {scene.type === "story" && scene.story ? (
                <StoryScene
                  story={scene.story}
                  beat={scene.beat}
                  language={plan.language}
                  captioned={words.length > 0}
                />
              ) : null}
              {scene.type === "outro" ? (
                <OutroScene language={plan.language} outro={textOf(props.script?.outro)} />
              ) : null}
            </FadeIn>
            <CaptionBar words={words} language={plan.language} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
