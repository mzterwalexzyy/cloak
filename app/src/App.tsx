import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { RegistryPage } from "./pages/RegistryPage";
import { PairPage } from "./pages/PairPage";
import { FaucetPage } from "./pages/FaucetPage";
import { AboutPage } from "./pages/AboutPage";
import { DispersePage } from "./pages/DispersePage";
import { AirdropPage } from "./pages/AirdropPage";
import { ClaimPage } from "./pages/ClaimPage";
import { HistoryPage } from "./pages/HistoryPage";
import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<RegistryPage />} />
        <Route path="app" element={<PairPage />} />
        <Route path="pair/:address" element={<PairPage />} />
        <Route path="faucet" element={<FaucetPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="disperse" element={<DispersePage />} />
        <Route path="airdrop" element={<AirdropPage />} />
        <Route path="claim" element={<ClaimPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="*" element={<RegistryPage />} />
      </Route>
    </Routes>
  );
}
