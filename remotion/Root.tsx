import React from "react";
import { Composition } from "remotion";
import { NewsRundown, scenePlan, type NewsRundownProps } from "./NewsRundown";

const defaultProps: NewsRundownProps = {
  region: "middle-east",
  category: "economy-political",
  stories: [
    {
      id: "preview-story",
      title: "عنوان تجريبي للخبر",
      brief: "ملخص قصير يظهر لو مفيش ميديا.",
      media: { kind: "image", url: "" },
    },
  ],
  script: {
    language: "ar",
    hook: "يلا نعدّي بسرعة على أهم الأخبار.",
    outro: "ده الملخص. نكمّل في الفيديو اللي بعده.",
    beats: [
      {
        storyId: "preview-story",
        onScreen: "عنوان على الشاشة",
        spoken: "النص المنطوق يظهر تحت العنوان لحد ما يتوصل التعليق الصوتي.",
        estimatedSeconds: 8,
      },
    ],
  },
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="NewsRundown"
      component={NewsRundown}
      durationInFrames={300}
      fps={30}
      width={1280}
      height={720}
      defaultProps={defaultProps}
      calculateMetadata={({ props }) => {
        const plan = scenePlan(props);
        return {
          durationInFrames: Math.max(1, plan.totalFrames),
          fps: 30,
          width: 1280,
          height: 720,
        };
      }}
    />
  );
};
