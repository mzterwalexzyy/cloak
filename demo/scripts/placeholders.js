/**
 * Creates 1x1 transparent PNGs as placeholders so Remotion doesn't crash
 * before real screenshots are captured. Run once after npm install.
 * Real screenshots from `npm run capture` will overwrite these.
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "../public/screenshots");
fs.mkdirSync(OUT, { recursive: true });

// Minimal valid 1x1 black PNG (base64)
const BLACK_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

const NEEDED = [
  "home",
  "home_registry",
  "home_search",
  "home_cleared",
  "faucet",
  "pair_wrap",
  "pair_decrypt",
  "pair_send",
  "pair_faucet",
  "disperse_empty",
  "disperse_filled",
  "airdrop",
  "airdrop_form",
];

let created = 0;
for (const name of NEEDED) {
  const p = path.join(OUT, `${name}.png`);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, BLACK_PNG);
    created++;
  }
}

console.log(`✓ ${created} placeholder(s) created in public/screenshots/`);
console.log("  Run `npm run capture` to replace them with real screenshots.");
