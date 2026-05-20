import React, { useState, useEffect } from "react";
import { Cpu, Terminal, RefreshCw, Layers, ShieldCheck, HeartHandshake, AlertCircle, Sparkles } from "lucide-react";
import { BotConfig, BotState, ActivePosition, ClosedTrade, BotLog, StockSetup } from "./types";
import Header from "./components/Header";
import Settings from "./components/Settings";
import ActivePositionPanel from "./components/ActivePositionPanel";
import ScreenerPanel from "./components/ScreenerPanel";
import LogsConsole from "./components/LogsConsole";
import PerformanceHistory from "./components/PerformanceHistory";

export default function App() {
  const [config, setConfig] = useState<BotConfig>({
    ALPACA_API_KEY: "",
    ALPACA_SECRET_KEY: "",
    ALPACA_BASE_URL: "https://paper-api.alpaca.markets",
    GEMINI_API_KEY: "",
    NEWSAPI_KEY: "",
    isPaper: true,
    isBotRunning: false,
    scanIntervalMinutes: 5,
  });

  const [botState, setBotState] = useState<BotState>({
    isActive: false,
    lastScanTime: null,
    nextScanTime: null,
    marketRegime: "NORMAL",
    spySma50: 0,
    spySma200: 0,
    spyPrice: 0,
    fomcBlackout: false,
  });

  const [position, setPosition] = useState<ActivePosition | null>(null);
  const [history, setHistory] = useState<ClosedTrade[]>([]);
  const [setups, setSetups] = useState<StockSetup[]>([]);
  const [logs, setLogs] = useState<BotLog[]>([]);

  const [isScanning, setIsScanning] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Status Notification Banner
  const [banner, setBanner] = useState<{ message: string; type: "success" | "error" | null }>({
    message: "",
    type: null,
  });

  const triggerBanner = (message: string, type: "success" | "error") => {
    setBanner({ message, type });
    setTimeout(() => {
      setBanner({ message: "", type: null });
    }, 5000);
  };

  // API Call Fetchers
  const fetchAllStates = async () => {
    try {
      const [configRes, stateRes, posRes, histRes, setupsRes, logsRes] = await Promise.all([
        fetch("/api/config").then((r) => r.json()),
        fetch("/api/state").then((r) => r.json()),
        fetch("/api/position").then((r) => r.json().catch(() => null)),
        fetch("/api/history").then((r) => r.json()),
        fetch("/api/setups").then((r) => r.json()),
        fetch("/api/logs").then((r) => r.json()),
      ]);

      setConfig(configRes);
      setBotState(stateRes);
      setPosition(posRes);
      setHistory(histRes);
      setSetups(setupsRes);
      setLogs(logsRes);
    } catch (err: any) {
      console.error("Dashboard failed background state sync:", err.message);
    }
  };

  useEffect(() => {
    fetchAllStates();
    // Poll updates every 10 seconds to render logs, real-time prices & executions
    const interval = setInterval(() => {
      fetchAllStates();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveConfig = async (updated: Partial<BotConfig>) => {
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        triggerBanner("API Configurations saved and synchronized successfully.", "success");
        fetchAllStates();
      } else {
        triggerBanner("Unable to update configurations on the server.", "error");
      }
    } catch (err: any) {
      triggerBanner(`Fail: ${err.message}`, "error");
    }
  };

  const handleToggleBot = async () => {
    const nextRunningStatus = !config.isBotRunning;

    // Guard: Enforce API credentials check
    if (nextRunningStatus && (!config.ALPACA_API_KEY || !config.ALPACA_SECRET_KEY)) {
      triggerBanner("Credentials Required. Fill in Alpaca API Key & Secret before starting trading.", "error");
      return;
    }

    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBotRunning: nextRunningStatus }),
      });
      const data = await res.json();
      if (data.success) {
        triggerBanner(
          nextRunningStatus ? "Autonomous swing trading bot scheduled 24/7!" : "Bot activity paused.",
          "success"
        );
        fetchAllStates();
      }
    } catch (err: any) {
      triggerBanner(`Failed: ${err.message}`, "error");
    }
  };

  const handleTriggerScan = async () => {
    // Guard: Enforce key requirement for historical bars scanner access
    if (!config.ALPACA_API_KEY || !config.ALPACA_SECRET_KEY) {
      triggerBanner("Alpaca credentials are required to carry out scan calls.", "error");
      return;
    }

    setIsScanning(true);
    triggerBanner("Starting stock universe scanner across S&P 500 + Nasdaq 100...", "success");

    try {
      const res = await fetch("/api/scan", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        // Await 3 seconds while server starts scan, then pull initial list
        setTimeout(async () => {
          await fetchAllStates();
          setIsScanning(false);
          triggerBanner("Scanning loop completed! Check setups dashboard below.", "success");
        }, 4000);
      }
    } catch (err: any) {
      triggerBanner(`Scan triggers failed: ${err.message}`, "error");
      setIsScanning(false);
    }
  };

  const handleDeployProposal = async (symbol: string) => {
    setIsDeploying(true);
    triggerBanner(`Initializing portfolio deployment: Buying 100% equity setup for ${symbol}...`, "success");

    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      const data = await res.json();
      if (data.success) {
        triggerBanner(`Successfully deployed portfolio setup! Bought ${symbol}.`, "success");
        await fetchAllStates();
      } else {
        triggerBanner(`Deployment transaction rejected. See bot terminal activity output.`, "error");
      }
    } catch (err: any) {
      triggerBanner(`Deployment crash: ${err.message}`, "error");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleExitPosition = async (symbol: string, reason: string) => {
    setIsExiting(true);
    triggerBanner(`Transmitting sell execution order for ${symbol}...`, "success");

    try {
      const res = await fetch("/api/exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, reason }),
      });
      const data = await res.json();
      if (data.success) {
        triggerBanner(`Fully liquidated position in ${symbol}. Transaction committed.`, "success");
        await fetchAllStates();
      } else {
        triggerBanner(`Alpaca exit order aborted.`, "error");
      }
    } catch (err: any) {
      triggerBanner(`Exit failure: ${err.message}`, "error");
    } finally {
      setIsExiting(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch("/api/clear-logs", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        triggerBanner("System activity logs cleared.", "success");
        setLogs([]);
      }
    } catch (err: any) {
      triggerBanner(`logs clear failed: ${err.message}`, "error");
    }
  };

  return (
    <div className="bg-theme-bg min-h-screen text-theme-text-primary font-sans antialiased relative overflow-x-hidden border-[12px] border-theme-input selection:bg-theme-accent/20 selection:text-theme-accent">
      {/* Subtle styling grids */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-theme-border/50" />

      {/* Main header navbar with running states handles */}
      <Header
        botState={botState}
        botConfig={config}
        onToggleBot={handleToggleBot}
        onTriggerScan={handleTriggerScan}
        isScanning={isScanning}
      />

      {/* Dynamic Floating Toast Alerts */}
      {banner.message && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-slide-in">
          <div className={`p-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-start gap-3 ${
            banner.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300"
              : "bg-rose-950/90 border-rose-500/30 text-rose-300"
          }`}>
            <AlertCircle className={`w-5 h-5 shrink-0 ${banner.type === "success" ? "text-emerald-400" : "text-rose-400"}`} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider font-mono">System Intel Feedback</p>
              <p className="text-xs leading-normal mt-0.5 font-sans font-medium">{banner.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard workspace bento grids layout */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        
        {/* Core Quick Rule Highlights banner */}
        <div className="bg-theme-panel border border-theme-border rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white/90 uppercase tracking-tight">Autonomous Risk Rules Loaded</h3>
              <p className="text-[11px] text-gray-400 font-mono">LONG ONLY | MAX 1 POSITION | 100% PORTFOLIO EQUITY TRIGGER | AUTO-EXIT 1D BEFORE EARNINGS</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-gray-500">
            <span>Last Scan: {botState.lastScanTime ? new Date(botState.lastScanTime).toLocaleTimeString() : "Never"}</span>
            <span className="text-theme-border">|</span>
            <span>Next Evaluator: {botState.nextScanTime ? new Date(botState.nextScanTime).toLocaleTimeString() : "No active intervals scheduled"}</span>
          </div>
        </div>

        {/* Bento Grid Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Sidebar Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Settings config={config} onSaveConfig={handleSaveConfig} />
            <LogsConsole logs={logs} onClearLogs={handleClearLogs} />
          </div>

          {/* Active Positions & Screener proposals workspace */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              <div className="md:col-span-2">
                <ActivePositionPanel
                  position={position}
                  onExitPosition={handleExitPosition}
                  isExiting={isExiting}
                />
              </div>
            </div>

            <ScreenerPanel
              setups={setups}
              onDeploy={handleDeployProposal}
              isDeploying={isDeploying}
              hasActivePosition={!!position}
            />
          </div>
        </div>

        {/* Historic trades ledger table element */}
        <div className="w-full">
          <PerformanceHistory history={history} />
        </div>
      </main>

      {/* Humble Footer signature */}
      <footer className="border-t border-theme-border bg-theme-panel py-6 text-center text-[10px] text-gray-500 font-mono tracking-wider uppercase mt-12 flex flex-col sm:flex-row items-center justify-between px-6 gap-2">
        <span>Alpaca Swing Brokerage Bot System &bull; Secured with Gemini Sentry Guard</span>
        <div className="flex gap-4">
          <span className="text-theme-accent">GEMINI-3.5-FLASH</span>
          <span className="text-theme-border">|</span>
          <span className="text-gray-400">ALPACA-PAPER-V2</span>
        </div>
      </footer>
    </div>
  );
}
