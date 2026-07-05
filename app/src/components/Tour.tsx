import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BRAND } from "../lib/brand";

type Step = { sel?: string; welcome?: boolean; title: string; body: string };

const STEPS: Step[] = [
  {
    welcome: true,
    title: `Welcome to ${BRAND}`,
    body: `${BRAND} turns the official Zama Wrappers Registry into a usable product — wrap any token into a confidential ERC-7984 version, decrypt only for yourself, and send hidden amounts. Here's a 30-second tour.`,
  },
  {
    sel: '[data-tour="connect"]',
    title: "1 · Connect your wallet",
    body: "First, connect a wallet on the Sepolia testnet. You can browse without it, but wrapping, decrypting and sending need a connection.",
  },
  {
    sel: '[data-tour="faucet"]',
    title: "2 · Get test tokens",
    body: "New here? Mint free mock tokens from the Faucet — you'll need them before you can wrap anything.",
  },
  {
    sel: '[data-tour="console"]',
    title: "3 · Wrap right here",
    body: "Pick a token, enter an amount, and wrap your public balance into its confidential ERC-7984 version — straight from the home screen.",
  },
  {
    sel: '[data-tour="start"]',
    title: "4 · Do more",
    body: "Open the full console to unwrap, decrypt your private balance, and send hidden amounts — all for any pair from one screen.",
  },
  {
    sel: '[data-tour="disperse"]',
    title: "5 · Disperse to many",
    body: "Send FHE-encrypted tokens to multiple addresses at once — paste or upload a CSV list, preview amounts, and batch-send in one session.",
  },
  {
    sel: '[data-tour="airdrop"]',
    title: "6 · Airdrop campaigns",
    body: "Create saved campaigns with named recipient lists. Use Send-Now mode to push directly, or deploy a Claim-Link contract your community claims from.",
  },
  {
    sel: '[data-tour="history"]',
    title: "7 · Transaction history",
    body: "View all your recent on-chain activity — wraps, sends, disperses and more — fetched live from Etherscan Sepolia.",
  },
  {
    sel: '[data-tour="about"]',
    title: "8 · How privacy works",
    body: "Visit About to understand what stays private (amounts & balances) and what doesn't (sender & recipient addresses).",
  },
  {
    sel: '[data-tour="pairs"]',
    title: "9 · Supported pairs",
    body: "Every ERC-20 ↔ ERC-7984 pair from the registry, loaded live. Click any card to open its wrap / unwrap / decrypt / send screen.",
  },
];

const KEY = "cloak-tour-done";
const TIP_W = 340;

export function Tour() {
  const [active, setActive] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) {
      const t = setTimeout(() => setActive(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const h = () => {
      setI(0);
      setActive(true);
    };
    window.addEventListener("cloak:start-tour", h);
    return () => window.removeEventListener("cloak:start-tour", h);
  }, []);

  const measure = useCallback(() => {
    const step = STEPS[i];
    if (step.welcome || !step.sel) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.sel);
    const r = el?.getBoundingClientRect();
    setRect(r && r.width > 0 ? r : null);
  }, [i]);

  // When a step targets an off-screen element (e.g. the pairs list), scroll it
  // into view first, then measure.
  useLayoutEffect(() => {
    if (!active) return;
    const step = STEPS[i];
    if (step.sel) {
      const el = document.querySelector(step.sel);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    const t = setTimeout(measure, 320);
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, i, measure]);

  if (!active) return null;

  const finish = () => {
    localStorage.setItem(KEY, "1");
    setActive(false);
    setI(0);
  };
  const step = STEPS[i];
  const first = i === 0;
  const last = i === STEPS.length - 1;
  const nextLabel = first ? "Get started" : last ? "Done" : "Next";

  const tipTop = step.welcome
    ? Math.max(window.innerHeight / 2 - 130, 24)
    : rect
      ? Math.min(rect.bottom + 14, window.innerHeight - 220)
      : window.innerHeight / 2 - 110;
  const tipLeft = step.welcome
    ? window.innerWidth / 2 - TIP_W / 2
    : rect
      ? Math.min(Math.max(rect.left, 12), window.innerWidth - TIP_W - 12)
      : window.innerWidth / 2 - TIP_W / 2;

  return createPortal(
    <div className="tour-root">
      {step.welcome || !rect ? <div className="tour-dim" /> : null}
      {rect && (
        <motion.div
          className="tour-ring"
          initial={false}
          animate={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          className={`tour-tip ${step.welcome ? "tour-welcome" : ""}`}
          style={{ top: tipTop, left: tipLeft, width: TIP_W }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {step.welcome ? (
            <div className="tour-badge">🔒</div>
          ) : (
            <div className="tour-step">Step {i} of {STEPS.length - 1}</div>
          )}
          <h4>{step.title}</h4>
          <p>{step.body}</p>
          {step.welcome && (
            <div className="tour-warn">⚠️ Use a <strong>burner wallet only</strong> — this is experimental testnet software.</div>
          )}
          <div className="tour-actions">
            <button className="tour-skip" onClick={finish}>Skip tour</button>
            <div className="tour-nav">
              {i > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setI((n) => n - 1)}>Back</button>
              )}
              <button className="btn btn-primary btn-sm" onClick={() => (last ? finish() : setI((n) => n + 1))}>
                {nextLabel}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  );
}
