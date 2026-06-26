import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The Zama web relayer runs FHE in a Web Worker backed by WASM. Cross-origin
// isolation (COOP/COEP) lets it use SharedArrayBuffer/threads where available.
const crossOriginIsolation = {
  name: "cross-origin-isolation",
  configureServer(server: { middlewares: { use: (fn: (req: unknown, res: { setHeader: (k: string, v: string) => void }, next: () => void) => void) => void } }) {
    server.middlewares.use((_req, res, next) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      // `credentialless` keeps cross-origin isolation (SharedArrayBuffer) while
      // still allowing the SDK's cross-origin WASM/key fetches from the Zama
      // relayer/CDN. `require-corp` blocks those and breaks SDK init.
      res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
      next();
    });
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), crossOriginIsolation],
  // Ensure a single React instance — framer-motion + react-router must share it,
  // otherwise hooks throw "Invalid hook call".
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "framer-motion", "react-router-dom"],
    // The SDK ships its own prebuilt WASM/worker bundle — don't let esbuild
    // try to pre-bundle the relayer internals.
    exclude: ["@zama-fhe/relayer-sdk"],
  },
});
