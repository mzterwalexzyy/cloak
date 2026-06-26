import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const steps = [
  { tone: "gold", icon: "🛡️", title: "Wrap", body: "Turn any public ERC-20 into its confidential ERC-7984 twin. One click handles the approval and the wrap." },
  { tone: "violet", icon: "🕶️", title: "Send privately", body: "Transfer with the amount encrypted via FHE. The transfer is visible on-chain; the amount is not." },
  { tone: "green", icon: "🔓", title: "Decrypt", body: "Reveal your own confidential balance with a single EIP-712 signature. Nobody else can ever read it." },
];

export function AboutPage() {
  return (
    <div className="page docs-page">
      <div className="page-head center">
        <div className="docs-eyebrow">Docs · How it works</div>
        <h1 className="docs-title">Confidential by design.</h1>
        <p className="docs-lead">
          The official Zama Wrappers Registry lists every ERC-20 ↔ ERC-7984 pair. This app turns that
          registry into a product: discover a pair, then wrap, unwrap, decrypt or send — all confidential.
        </p>
      </div>

      <div className="how">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            className={`how-card how-${s.tone}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <div className="how-glow" />
            <div className="how-icon">{s.icon}</div>
            <div className="how-title">{s.title}</div>
            <div className="how-body">{s.body}</div>
          </motion.div>
        ))}
      </div>

      <div className="panel prose">
        <h3>What stays private?</h3>
        <p>
          Confidential (ERC-7984) balances are stored <strong>encrypted</strong> on-chain. Anyone can see that a
          transfer happened and between which addresses — but <strong>not the amount</strong>. It's amount-confidential,
          not anonymous: great for hiding salaries, holdings and payment sizes, not for untraceable transfers.
        </p>
        <h3>Trust model</h3>
        <p>
          Decryption uses Zama's threshold KMS via an EIP-712 signature — a different trust model than a self-contained
          ZK proof. Wrapping a public token reveals that amount at wrap-time; privacy applies to subsequent confidential balances and transfers.
        </p>
        <div className="prose-cta">
          <Link className="btn btn-primary btn-lg" to="/">Explore the registry →</Link>
        </div>
      </div>
    </div>
  );
}
