import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import LiveScanner from "./components/LiveScanner";
import ScanHistory from "./components/ScanHistory";
import HowItWorks from "./components/HowItWorks";
import Footer from "./components/Footer";
import { APIS } from "./services/apis";

const App = () => {
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [history, setHistory] = useState([]);
  const [serverOnline, setServerOnline] = useState(false);

  // Check server health on mount
  useEffect(() => {
    checkServerHealth();
    loadHistory();
  }, []);

  const checkServerHealth = async () => {
    try {
      const res = await fetch(APIS.HEALTH_API);
      if (res.ok) setServerOnline(true);
    } catch {
      setServerOnline(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(APIS.LOAD_HISTORY_API);
      const data = await res.json();
      setHistory(data);
    } catch {
      // Server offline
    }
  };

  // Manual URL scan from the dashboard
  const handleScan = async (url) => {
    if (!url.trim()) return;
    setScanning(true);
    setScanResult(null);

    try {
      const res = await fetch(APIS.ANAYLZE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, content: "" }),
      });
      const result = await res.json();
      setScanResult(result);
      // Refresh history
      loadHistory();
    } catch (error) {
      setScanResult({
        url,
        risk_level: "error",
        final_score: 0,
        reasons: [
          "Backend server is not running. Start it with: cd Server && npm start",
        ],
        error: true,
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header serverOnline={serverOnline} />
      <main>
        <HeroSection />
        <LiveScanner
          onScan={handleScan}
          result={scanResult}
          scanning={scanning}
          serverOnline={serverOnline}
        />
        <ScanHistory history={history} />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};

export default App;
