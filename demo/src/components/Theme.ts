export const C = {
  bg:        "#03080f",
  bg2:       "#050b14",
  surface:   "#080f1a",
  surface2:  "#0d1520",
  surface3:  "#111d2c",
  border:    "rgba(0,217,126,0.08)",
  borderStr: "rgba(0,217,126,0.18)",
  primary:   "#00d97e",
  primary2:  "#34d399",
  text:      "#eef4ff",
  muted:     "#6a8090",
  faint:     "#3d5060",
  bad:       "#f87171",
  warn:      "#fbbf24",
  conf:      "#6ee7b7",
};

export const FONT = `"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif`;
export const MONO = `"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace`;

export const glow = (color = C.primary, blur = 40, opacity = 0.18) =>
  `0 0 ${blur}px ${opacity > 0 ? color.replace(")", `,${opacity})`) : color}`;
