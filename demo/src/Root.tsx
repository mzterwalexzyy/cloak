import React from "react";
import { Composition } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { CloakDemo } from "./CloakDemo";

// Load Inter font for all scenes
loadFont();

export function Root() {
  return (
    <Composition
      id="CloakDemo"
      component={CloakDemo}
      durationInFrames={5400}
      fps={30}
      width={1280}
      height={720}
    />
  );
}
