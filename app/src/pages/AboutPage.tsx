import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const HOW_STEPS = [
  {
    num: "1",
    title: "Wrap",
    body: "Approve & deposit an ERC-20 into its FHE wrapper contract. Your balance becomes encrypted.",
  },
  {
    num: "2",
    title: "Own privately",
    body: "Your balance is encrypted on-chain. No one, not even a node, can read it.",
  },
  {
    num: "3",
    title: "Decrypt & send",
    body: "Authorize a view in your wallet to read your balance and transfer confidentially.",
  },
];

const FEATURES = [
  {
    icon: "⬡",
    color: "gold",
    title: "ERC-7984 standard",
    body: "Standard interface for FHE-wrapped tokens.",
    href: "https://eips.ethereum.org/EIPS/eip-7984",
  },
  {
    icon: "🔐",
    color: "violet",
    title: "Zama FHE protocol",
    body: "Encryption & decryption without revealing data.",
    href: "https://docs.zama.org/protocol",
  },
  {
    icon: "📋",
    color: "cyan",
    title: "Registry contract",
    body: "Official Zama registry of wrappers and pairs.",
    href: "https://sepolia.etherscan.io/address/0x2f0750Bbb0A246059d80e94c454586a7F27a128e",
  },
  {
    icon: "🛡",
    color: "green",
    title: "Security considerations",
    body: "Audits, threats, and best practices.",
    href: "https://docs.zama.org/protocol",
  },
];

export function AboutPage() {
  return (
    <div className="docs-page-new">
      <motion.div
        className="docs-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1>How Cloak works</h1>
        <p>
          FHE token wrapping on Ethereum Sepolia using the official Zama Wrapper Registry.
        </p>
      </motion.div>

      <div className="docs-steps">
        {HOW_STEPS.map((s, i) => (
          <motion.div
            key={s.num}
            className="docs-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="docs-step-num">{s.num}</div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </motion.div>
        ))}
      </div>

      <div className="docs-features-wrap">
        <div className="docs-features">
          {FEATURES.map((f, i) => (
            <motion.a
              key={f.title}
              className={`docs-feature docs-feature-${f.color}`}
              href={f.href}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="docs-feature-icon">{f.icon}</div>
              <h4>{f.title}</h4>
              <p>{f.body}</p>
              <span className="docs-feature-link">Learn more →</span>
            </motion.a>
          ))}
        </div>

        <motion.div
          className="docs-cube"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
          <div className="cube-glow" />
          <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cg1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00d97e" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.4"/>
              </linearGradient>
              <linearGradient id="cg2" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d97e" stopOpacity="0.5"/>
                <stop offset="100%" stopColor="#052514" stopOpacity="0.8"/>
              </linearGradient>
              <linearGradient id="cg3" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#052514" stopOpacity="0.9"/>
              </linearGradient>
            </defs>
            {/* Top face */}
            <polygon points="80,20 140,52 80,84 20,52" fill="url(#cg1)" stroke="rgba(0,217,126,0.6)" strokeWidth="1"/>
            {/* Left face */}
            <polygon points="20,52 80,84 80,140 20,108" fill="url(#cg2)" stroke="rgba(0,217,126,0.35)" strokeWidth="1"/>
            {/* Right face */}
            <polygon points="140,52 80,84 80,140 140,108" fill="url(#cg3)" stroke="rgba(52,211,153,0.35)" strokeWidth="1"/>
            {/* Inner edges */}
            <line x1="80" y1="84" x2="80" y2="52" stroke="rgba(0,217,126,0.4)" strokeWidth="0.8" strokeDasharray="4 3"/>
            <line x1="80" y1="52" x2="20" y2="52" stroke="rgba(0,217,126,0.25)" strokeWidth="0.8" strokeDasharray="4 3"/>
            <line x1="80" y1="52" x2="140" y2="52" stroke="rgba(52,211,153,0.25)" strokeWidth="0.8" strokeDasharray="4 3"/>
          </svg>
        </motion.div>
      </div>

      <motion.div
        className="docs-trust"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <h3>What stays private?</h3>
        <p>
          Confidential (ERC-7984) balances are stored <strong>encrypted</strong> on-chain. Anyone can see that a
          transfer happened and between which addresses, but <strong>not the amount</strong>. It's amount-confidential,
          not anonymous.
        </p>
        <h3>Trust model</h3>
        <p>
          Decryption uses Zama's threshold KMS via an EIP-712 signature. Wrapping a public token reveals
          that amount at wrap-time; privacy applies to subsequent confidential balances and transfers.
        </p>
        <Link className="btn btn-primary" to="/">Explore the registry →</Link>
      </motion.div>
    </div>
  );
}
