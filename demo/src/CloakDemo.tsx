import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Hook } from "./scenes/Hook";
import { Registry } from "./scenes/Registry";
import { WrapFlow } from "./scenes/WrapFlow";
import { SendFlow } from "./scenes/SendFlow";
import { Disperse } from "./scenes/Disperse";
import { Airdrop } from "./scenes/Airdrop";
import { Close } from "./scenes/Close";

// Total: 5400 frames @ 30fps = 3:00
// Scene timing:
//   Hook     0   – 600   (0:00–0:20)
//   Registry 600 – 1500  (0:20–0:50)
//   WrapFlow 1500– 2400  (0:50–1:20)
//   SendFlow 2400– 3150  (1:20–1:45)
//   Disperse 3150– 4050  (1:45–2:15)
//   Airdrop  4050– 5100  (2:15–2:50)
//   Close    5100– 5400  (2:50–3:00)

export function CloakDemo() {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={600}>
        <Hook />
      </Sequence>
      <Sequence from={600} durationInFrames={900}>
        <Registry />
      </Sequence>
      <Sequence from={1500} durationInFrames={900}>
        <WrapFlow />
      </Sequence>
      <Sequence from={2400} durationInFrames={750}>
        <SendFlow />
      </Sequence>
      <Sequence from={3150} durationInFrames={900}>
        <Disperse />
      </Sequence>
      <Sequence from={4050} durationInFrames={1050}>
        <Airdrop />
      </Sequence>
      <Sequence from={5100} durationInFrames={300}>
        <Close />
      </Sequence>
    </AbsoluteFill>
  );
}
