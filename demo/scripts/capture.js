/**
 * Puppeteer screenshot capture script.
 * Run with: node scripts/capture.js
 * Outputs PNG screenshots to public/screenshots/
 */
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = "https://cloak-mzterwalexzyys-projects.vercel.app";
const OUT = path.join(__dirname, "../public/screenshots");

fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  // Support system chromium on Codespaces/CI via env var
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
  if (executablePath) console.log(`  Using browser: ${executablePath}`);

  console.log("Launching browser…");
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
    ],
    defaultViewport: { width: 1920, height: 1080 },
  });
  const page = await browser.newPage();

  // ── 1. Home page ──────────────────────────────────────────────────────────
  console.log("\n[Home]");
  await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });
  await wait(1500);
  await shot(page, "home");

  // Scroll down to show registry
  await page.evaluate(() => window.scrollBy(0, 300));
  await wait(600);
  await shot(page, "home_registry");

  // ── 2. Faucet page ────────────────────────────────────────────────────────
  console.log("\n[Faucet]");
  await page.goto(`${BASE_URL}/faucet`, { waitUntil: "networkidle2" });
  await wait(1000);
  await shot(page, "faucet");

  // ── 3. Pair page (wrap console) ───────────────────────────────────────────
  console.log("\n[Pair — Wrap tab]");
  // Navigate to first pair if exists, otherwise go to root to get pair link
  await page.goto(BASE_URL, { waitUntil: "networkidle2" });
  await wait(2000);
  // Try clicking first pair card
  try {
    await page.click(".glow-card");
    await wait(1500);
    await shot(page, "pair_wrap");

    // Click Decrypt tab
    const tabs = await page.$$(".pair-tab");
    for (const tab of tabs) {
      const text = await tab.evaluate((el) => el.textContent);
      if (text && text.trim() === "Decrypt") {
        await tab.click();
        await wait(500);
        break;
      }
    }
    await shot(page, "pair_decrypt");

    // Click Send tab
    for (const tab of tabs) {
      const text = await tab.evaluate((el) => el.textContent);
      if (text && text.trim() === "Send") {
        await tab.click();
        await wait(500);
        break;
      }
    }
    await shot(page, "pair_send");

    // Click Faucet tab
    for (const tab of tabs) {
      const text = await tab.evaluate((el) => el.textContent);
      if (text && text.trim() === "Faucet") {
        await tab.click();
        await wait(500);
        break;
      }
    }
    await shot(page, "pair_faucet");
  } catch (e) {
    console.log("  ⚠ No pair card found, using home screenshot for pair pages");
    fs.copyFileSync(path.join(OUT, "home.png"), path.join(OUT, "pair_wrap.png"));
    fs.copyFileSync(path.join(OUT, "home.png"), path.join(OUT, "pair_decrypt.png"));
    fs.copyFileSync(path.join(OUT, "home.png"), path.join(OUT, "pair_send.png"));
    fs.copyFileSync(path.join(OUT, "faucet.png"), path.join(OUT, "pair_faucet.png"));
  }

  // ── 4. Disperse page ──────────────────────────────────────────────────────
  console.log("\n[Disperse]");
  await page.goto(`${BASE_URL}/disperse`, { waitUntil: "networkidle2" });
  await wait(1000);
  await shot(page, "disperse_empty");

  // Type some recipients into the textarea
  try {
    const textarea = await page.$(".dc-textarea, textarea");
    if (textarea) {
      await textarea.click();
      await page.keyboard.type(
        "0x1aB2c3D4e5F6a7B8c9D0e1F2a3b4C5d6E7F8a9B0 250\n" +
        "0x9F8e7D6c5B4a3C2d1E0f9A8b7C6d5E4f3A2b1C0d 180\n" +
        "0x3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d 320\n" +
        "0xA1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0 90",
        { delay: 12 }
      );
      await wait(800);
      await shot(page, "disperse_filled");
    } else {
      fs.copyFileSync(path.join(OUT, "disperse_empty.png"), path.join(OUT, "disperse_filled.png"));
    }
  } catch {
    fs.copyFileSync(path.join(OUT, "disperse_empty.png"), path.join(OUT, "disperse_filled.png"));
  }

  // ── 5. Airdrop page ───────────────────────────────────────────────────────
  console.log("\n[Airdrop]");
  await page.goto(`${BASE_URL}/airdrop`, { waitUntil: "networkidle2" });
  await wait(1000);
  await shot(page, "airdrop");

  // Try opening new campaign form
  try {
    const newBtn = await page.$('button');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.evaluate(el => el.textContent);
      if (text && text.includes("New campaign")) {
        await btn.click();
        await wait(800);
        break;
      }
    }
    await shot(page, "airdrop_form");
  } catch {
    fs.copyFileSync(path.join(OUT, "airdrop.png"), path.join(OUT, "airdrop_form.png"));
  }

  // ── 6. Home with search typed ─────────────────────────────────────────────
  console.log("\n[Home — search]");
  await page.goto(BASE_URL, { waitUntil: "networkidle2" });
  await wait(1500);
  try {
    const search = await page.$('input[type="text"], .app-search input, input[placeholder*="Search"]');
    if (search) {
      await search.click();
      await page.keyboard.type("USDC", { delay: 80 });
      await wait(600);
      await shot(page, "home_search");
      // Clear
      await page.keyboard.down("Control");
      await page.keyboard.press("a");
      await page.keyboard.up("Control");
      await page.keyboard.press("Backspace");
      await wait(400);
      await shot(page, "home_cleared");
    } else {
      fs.copyFileSync(path.join(OUT, "home_registry.png"), path.join(OUT, "home_search.png"));
      fs.copyFileSync(path.join(OUT, "home_registry.png"), path.join(OUT, "home_cleared.png"));
    }
  } catch {
    fs.copyFileSync(path.join(OUT, "home_registry.png"), path.join(OUT, "home_search.png"));
    fs.copyFileSync(path.join(OUT, "home_registry.png"), path.join(OUT, "home_cleared.png"));
  }

  await browser.close();
  console.log(`\n✅ All screenshots saved to public/screenshots/`);
  console.log("   Now run: npm start");
})().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
