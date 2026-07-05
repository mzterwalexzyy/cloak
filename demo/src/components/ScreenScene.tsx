import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { MouseCursor, Waypoint } from "./MouseCursor";
import { ZoomWrapper } from "./ZoomWrapper";
import { Subtitle } from "./Subtitle";
import { SectionLabel } from "./Subtitle";
import { C, FONT } from "./Theme";

interface Props {
  /** Filename without extension, relative to public/screenshots/ */
  screenshot: string;
  waypoints: Waypoint[];
  subtitle?: string;
  subtitleStart?: number;
  subtitleEnd?: number;
  sectionLabel?: string;
  /** Optional overlay element rendered on top of screenshot (e.g. highlight box) */
  overlay?: React.ReactNode;
  totalFrames: number;
}

export function ScreenScene({
  screenshot,
  waypoints,
  subtitle,
  subtitleStart = 10,
  subtitleEnd,
  sectionLabel,
  overlay,
  totalFrames,
}: Props) {
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <ZoomWrapper waypoints={waypoints}>
        <AbsoluteFill>
          <Img
            src={staticFile(`screenshots/${screenshot}.png`)}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left" }}
          />
          {overlay}
          <MouseCursor waypoints={waypoints} totalFrames={totalFrames} />
        </AbsoluteFill>
      </ZoomWrapper>

      {sectionLabel && <SectionLabel text={sectionLabel} frame={0} />}
      {subtitle && (
        <Subtitle
          text={subtitle}
          startFrame={subtitleStart}
          endFrame={subtitleEnd ?? totalFrames - 10}
        />
      )}
    </AbsoluteFill>
  );
}
