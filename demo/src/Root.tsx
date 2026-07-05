import React from "react";
import { Composition } from "remotion";
import { CloakDemo } from "./CloakDemo";

export function Root() {
  return (
    <Composition
      id="CloakDemo"
      component={CloakDemo}
      durationInFrames={5400}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}
