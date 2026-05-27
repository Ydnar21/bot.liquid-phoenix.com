import React, { useState, useEffect } from "react";
import { Cpu, Terminal, RefreshCw, Layers, ShieldCheck, HeartHandshake, AlertCircle, Sparkles, X } from "lucide-react";
import { BotConfig, BotState, ActivePosition, ClosedTrade, BotLog, StockSetup } from "./types";
import Header from "./components/Header";
import Settings from "./components/Settings";
import CalendarPanel from "./components/CalendarPanel";
import ActivePositionPanel from "./components/ActivePositionPanel";
import ScreenerPanel from "./components/ScreenerPanel";
import LogsConsole from "./components/LogsConsole";
import PerformanceHistory from "./components/PerformanceHistory";
import { auth, googleProvider, signInWithPopup, signOut, db, switchToDefaultClientDb } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // User Consent Agreements for Financial Disclaimers & Liability Waiver
  const [consentedTerms, setConsentedTerms] = useState(false);
  const [consentedRisk, setConsentedRisk] = useState(false);
  const [showModal, setShowModal] = useState<"terms" | "privacy" | null>(null);
  const [showConsentError, setShowConsentError] = useState(false);

  const [config, setConfig] = useState<BotConfig>({
    ALPACA_API_KEY: "",
    ALPACA_SECRET_KEY: "",
    ALPACA_BASE_URL: "https://paper-api.alpaca.markets",
    GEMINI_API_KEY: "",
    NEWSAPI_KEY: "",
    isPaper: true,
    isBotRunning: false,
    isConnectionActive: false,
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
  const [alpacaAccount, setAlpacaAccount] = useState<any>(null);

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

  // Auth Status sync listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const userRef = doc(db, "users", u.uid);
          await setDoc(userRef, {
            uid: u.uid,
            email: u.email || "",
            displayName: u.displayName || "Anonymous",
            photoURL: u.photoURL || "",
            lastLogin: new Date().toISOString()
          }, { merge: true });
        } catch (e: any) {
          console.error("Firestore user profile sync error:", e.message);
          if (e.message && (e.message.toLowerCase().includes("not-found") || e.message.toLowerCase().includes("database") || e.message.toLowerCase().includes("not_found"))) {
            try {
              switchToDefaultClientDb();
              const userRef = doc(db, "users", u.uid);
              await setDoc(userRef, {
                uid: u.uid,
                email: u.email || "",
                displayName: u.displayName || "Anonymous",
                photoURL: u.photoURL || "",
                lastLogin: new Date().toISOString()
              }, { merge: true });
              console.log("Successfully synced user profile to default database fallback");
            } catch (retryError: any) {
              console.error("Firestore user profile sync fallback error:", retryError.message);
            }
          }
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const safeFetchJson = async <T,>(url: string, currentVal: T): Promise<T> => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        return currentVal;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.toLowerCase().includes("application/json")) {
        return currentVal;
      }
      const data = await res.json();
      return data as T;
    } catch (err: any) {
      const errMsg = (err instanceof Error ? err.message : String(err)) || "";
      const lowerMsg = errMsg.toLowerCase();
      if (
        lowerMsg.includes("load failed") ||
        lowerMsg.includes("the string did not match the expected pattern") ||
        lowerMsg.includes("aborted") ||
        lowerMsg.includes("failed to fetch")
      ) {
        return currentVal;
      }
      console.warn(`Safe fetch failure for ${url}:`, errMsg);
      return currentVal;
    }
  };

  // API Call Fetchers
  const fetchAllStates = async () => {
    if (!auth.currentUser) return; // Secure state fetch guard
    try {
      const [configRes, stateRes, posRes, histRes, setupsRes, logsRes, accountRes] = await Promise.all([
        safeFetchJson<BotConfig>("/api/config", config),
        safeFetchJson<BotState>("/api/state", botState),
        safeFetchJson<ActivePosition | null>("/api/position", position),
        safeFetchJson<ClosedTrade[]>("/api/history", history),
        safeFetchJson<StockSetup[]>("/api/setups", setups),
        safeFetchJson<BotLog[]>("/api/logs", logs),
        safeFetchJson<any>(`/api/account?userId=${auth.currentUser.uid}`, alpacaAccount || { status: "unconfigured" }),
      ]);

      setConfig(configRes);
      setBotState(stateRes);
      setPosition(posRes);
      setHistory(histRes);
      setSetups(setupsRes);
      setLogs(logsRes);
      setAlpacaAccount(accountRes);
    } catch (err: any) {
      const errMsg = (err instanceof Error ? err.message : String(err)) || "";
      const lowerMsg = errMsg.toLowerCase();
      if (
        lowerMsg.includes("load failed") ||
        lowerMsg.includes("the string did not match the expected pattern") ||
        lowerMsg.includes("failed to fetch") ||
        lowerMsg.includes("aborted")
      ) {
        // Gracefully ignore or log as warning transient network states during hot-reloads / restarts
        console.warn("Cabinet background sync paused: expected network reload event.");
      } else {
        console.error("Dashboard failed background state sync:", errMsg);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllStates();
      // Poll updates every 10 seconds to render logs, real-time prices & executions
      const interval = setInterval(() => {
        fetchAllStates();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

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

    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBotRunning: nextRunningStatus }),
      });
      const data = await res.json();
      if (data.success) {
        triggerBanner(
          nextRunningStatus ? "Autonomous swing trading bot active and scheduled!" : "Bot activity paused.",
          "success"
        );
        fetchAllStates();
      }
    } catch (err: any) {
      triggerBanner(`Failed: ${err.message}`, "error");
    }
  };

  const handleToggleConnection = async () => {
    const nextConnectionStatus = !config.isConnectionActive;

    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isConnectionActive: nextConnectionStatus }),
      });
      const data = await res.json();
      if (data.success) {
        triggerBanner(
          nextConnectionStatus ? "Alpaca API Connection online! Dashboard updated." : "Alpaca integration disconnected.",
          "success"
        );
        fetchAllStates();
      }
    } catch (err: any) {
      triggerBanner(`Failed: ${err.message}`, "error");
    }
  };

  const handleTriggerScan = async () => {
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

  if (authLoading) {
    return (
      <div className="bg-theme-bg min-h-screen flex items-center justify-center border-[12px] border-theme-input">
        <div className="flex flex-col items-center gap-4 text-center">
          <RefreshCw className="w-8 h-8 text-theme-accent animate-spin" />
          <div className="font-mono text-xs text-gray-400 uppercase tracking-widest">Verifying connection to security clusters...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-theme-bg min-h-screen flex items-center justify-center relative overflow-hidden border-[12px] border-theme-input px-4 sm:px-6 py-12 antialiased">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
        
        <div className="max-w-md w-full relative z-10 my-auto">
          <div className="bg-theme-panel border border-theme-border rounded-xl p-6 sm:p-8 lg:p-10 shadow-2xl space-y-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-theme-accent/10 border border-theme-accent/20 rounded-2xl flex items-center justify-center text-theme-accent shadow-inner">
                <Cpu className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold tracking-tight uppercase text-white font-display">Liquid Phoenix Swing Trading Portal</h1>
                <p className="text-[10px] text-theme-accent font-mono tracking-widest uppercase">Autonomous Copy Portfolio Sentry</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center leading-relaxed font-sans font-medium">
              A professional decentralized cloud trading terminal. Connect and execute same-size swing metrics across multiple secure portfolio environments automatically.
            </p>

            {/* Terms of Service & Privacy Risk Consent Agreement Controls */}
            <div className="space-y-3 bg-theme-input/50 border border-theme-border p-4 rounded-lg">
              <p className="text-[9.5px] text-gray-400 font-mono uppercase tracking-wider font-bold border-b border-theme-border/50 pb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-theme-accent" /> Legal Agreement & Consent Node
              </p>
              
              <label className="flex items-start gap-2.5 cursor-pointer select-none group text-[11px] text-gray-300">
                <input
                  type="checkbox"
                  checked={consentedTerms}
                  onChange={(e) => {
                    setConsentedTerms(e.target.checked);
                    if (e.target.checked && consentedRisk) setShowConsentError(false);
                  }}
                  className="mt-0.5 accent-theme-accent h-3.5 w-3.5 rounded bg-black/40 border-theme-border focus:ring-0 cursor-pointer shrink-0"
                />
                <span className="leading-normal">
                  I agree to the{" "}
                  <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); setShowModal("terms"); }}
                    className="text-theme-accent hover:underline font-bold focus:outline-none"
                  >
                    Terms of Service (ToS)
                  </button>{" "}
                  and{" "}
                  <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); setShowModal("privacy"); }}
                    className="text-theme-accent hover:underline font-bold focus:outline-none"
                  >
                    Privacy Policy
                  </button>.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none group text-[11px] text-gray-300">
                <input
                  type="checkbox"
                  checked={consentedRisk}
                  onChange={(e) => {
                    setConsentedRisk(e.target.checked);
                    if (e.target.checked && consentedTerms) setShowConsentError(false);
                  }}
                  className="mt-0.5 accent-theme-accent h-3.5 w-3.5 rounded bg-black/40 border-theme-border focus:ring-0 cursor-pointer shrink-0"
                />
                <span className="leading-normal">
                  I acknowledge <strong>this system is never guaranteed to make money for me</strong>, and I hold developers <strong>absolutely not liable</strong> for any bad trades or capital loss.
                </span>
              </label>
            </div>

            {/* Error messaging inside the login container */}
            {showConsentError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10.5px] p-3 rounded-lg flex items-start gap-2.5 font-mono uppercase leading-normal">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>Consent Required: Please read and check both validation boxes before connecting.</span>
              </div>
            )}

            <div className="pt-1">
              <button
                onClick={async () => {
                  if (!consentedTerms || !consentedRisk) {
                    setShowConsentError(true);
                    triggerBanner("Consent to the critical ToS & Liability Waiver is required to proceed.", "error");
                    return;
                  }
                  setShowConsentError(false);
                  try {
                    await signInWithPopup(auth, googleProvider);
                    triggerBanner("Successfully signed in with Google auth node.", "success");
                  } catch (err: any) {
                    triggerBanner(`Auth failed: ${err.message}`, "error");
                  }
                }}
                className={`w-full transition-all duration-150 py-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-3 cursor-pointer shadow-lg active:scale-98 ${
                  consentedTerms && consentedRisk 
                    ? "bg-white text-black hover:bg-gray-100" 
                    : "bg-gray-600/30 text-gray-500 border border-gray-600/20 cursor-not-allowed"
                }`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill={consentedTerms && consentedRisk ? "#EA4335" : "#6b7280"}
                    d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.6-6.887 4.6-4.33 0-7.859-3.58-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.243-3.12C18.425 2.05 15.635 1 12.24 1 5.922 1 .8 6.122.8 12.4s5.122 11.4 11.44 11.4c6.6 0 11-4.635 11-11.19 0-.75-.08-1.32-.18-1.885H12.24z"
                  />
                </svg>
                <span>Authorize with Google</span>
              </button>
            </div>

            <div className="p-3.5 rounded border border-theme-border bg-theme-input flex items-start gap-2.5">
              <HeartHandshake className="w-4 h-4 text-theme-accent shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-300 font-bold uppercase font-mono tracking-wider">Multi-Studio Alignment</p>
                <p className="text-[9px] text-gray-500 font-sans leading-relaxed">
                  Log in with the same email across Google ecosystems to automatically sync positions, settings, and credentials safely. No local keys saved on servers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Overlay Disclosures Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-theme-panel border border-theme-border rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
              <div className="flex justify-between items-center bg-theme-input p-4 border-b border-theme-border">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-theme-accent" />
                  {showModal === "terms" ? "Terms of Service & Liability Waiver" : "S-A Sentry Privacy Directive"}
                </h3>
                <button 
                  onClick={() => setShowModal(null)}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto font-sans text-xs text-gray-300 space-y-4 leading-relaxed custom-scrollbar bg-theme-panel">
                {showModal === "terms" ? (
                  <>
                    <p className="text-rose-400 font-bold uppercase tracking-wider border-b border-rose-900/40 pb-2 flex items-center gap-1.5 font-mono text-[10px]">
                      ⚠️ STRICT DISCLAIMER: NO FINANCIAL REMEDIES & COMPLETELY DISCLAIMED LIABILITY
                    </p>
                    <div className="space-y-4 text-gray-300">
                      <div>
                        <h4 className="font-bold text-white mb-1">1. Experimental Software Suite - Under No Circumstances Make Guarantees</h4>
                        <p>
                          This platform operates solely as a personalized automated testing and execution interface. Under no circumstances does this application guarantee profitable trading outcomes, positive capital returns, or specific portfolio results.
                        </p>
                      </div>
                      
                      <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-lg text-rose-300 font-medium">
                        <span className="font-bold uppercase text-[10px] block mb-1 font-mono text-white">Full Consent & Clear Affirmation:</span>
                        You expressly declare and fully agree that you are <strong className="text-white underline">NOT trusting this software to make money for you</strong> with any level of certainty or probability. You understand that automated trading models are susceptible to massive drawdowns, technical failures, and rapid loss of capital.
                      </div>

                      <div>
                        <h4 className="font-bold text-white mb-1">2. Absolute Absence of Liability for "Bad Trades"</h4>
                        <p>
                          The developers, hosts, authors, and operators of this software are entirely held harmless from your trading outcomes. We hold zero liability for "bad trades", technical execution bugs, unexpected software crashes, API response latencies, market slippage, broker errors, incorrect data feeds, or manual execution errors.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-white mb-1">3. Speculative Financial Jeopardy Statement</h4>
                        <p>
                          Financial asset trading is highly speculative. Never input API values, access codes, or credentials connected to live funds that you are not fully prepared to lose in their entirety.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-theme-accent font-bold uppercase tracking-wider border-b border-theme-border/60 pb-2 flex items-center gap-1.5 font-mono text-[10px]">
                      🔒 SECURITY & DATA PROTECTION PROTOCOLS
                    </p>
                    <div className="space-y-4 text-gray-300">
                      <div>
                        <h4 className="font-bold text-white mb-1">1. Client-to-Broker Encryption Standard</h4>
                        <p>
                          Your connection details, including key identifiers and sandbox/live credentials, are strictly processed through secure backend instances directly to the designated broker REST nodes. No plain text secrets are saved in your browser files.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-white mb-1">2. Identity Alignment</h4>
                        <p>
                          Your Google Profile identity (authorized email and unique token) is utilized solely to authorize database-bound security records so we can safely align configurations across user spaces.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-white mb-1">3. Privacy Ethics Code</h4>
                        <p>
                          We never sell, rent, disclose, or share telemetry data, private system settings, transaction statistics, or emails to external commercial advertisers or brokers.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="p-4 bg-theme-input/60 border-t border-theme-border flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showModal === "terms") {
                      setConsentedTerms(true);
                      setConsentedRisk(true);
                    }
                    setShowModal(null);
                  }}
                  className="bg-white hover:bg-gray-100 text-black px-4.5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-lg active:scale-97"
                >
                  {showModal === "terms" ? "I Accept Policies & Acknowledge Risk" : "Understood"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-theme-bg min-h-screen text-theme-text-primary font-sans antialiased relative overflow-x-hidden border-[12px] border-theme-input selection:bg-theme-accent/20 selection:text-theme-accent">
      {/* Subtle styling grids */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-theme-border/50" />

      {/* Main header navbar with running states handles */}
      <Header
        botState={botState}
        botConfig={config}
        onToggleBot={handleToggleBot}
        onToggleConnection={handleToggleConnection}
        onTriggerScan={handleTriggerScan}
        isScanning={isScanning}
        currentUser={user}
        onSignOut={() => signOut(auth)}
        alpacaAccount={alpacaAccount}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Settings Sidebar Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Settings config={config} onSaveConfig={handleSaveConfig} currentUser={user} />
            <CalendarPanel events={botState.storedEvents || []} />
          </div>

          {/* Active Positions & Screener proposals workspace */}
          <div className="lg:col-span-2 space-y-6">
            {!config.isConnectionActive ? (
              <div className="bg-theme-panel border border-theme-border rounded p-8 text-center flex flex-col items-center justify-center min-h-[400px] gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-amber-500/50" />
                
                {/* Visual Standby Indicator */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-12 h-12 bg-amber-500/10 rounded-full animate-ping" />
                  <div className="w-12 h-12 bg-theme-input border border-amber-500/30 rounded-full flex items-center justify-center text-amber-500 font-bold font-mono">
                    💤
                  </div>
                </div>

                <div className="max-w-md mx-auto space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                    Sentry Bot Connection Standby
                  </h3>
                  <p className="text-xs text-gray-400 font-sans leading-relaxed">
                    Alpaca integration channels are currently offline. In this state, actual Alpaca account equity, connected trade lists, real-time SPY pricing nodes, and AI swing screening matrices are fully suspended.
                  </p>
                  
                  <div className="pt-4 border-t border-theme-border/50 text-left space-y-2">
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">How to activate connection:</p>
                    <ul className="text-xs text-gray-400 space-y-1.5 list-disc pl-4 font-sans">
                      <li>Ensure your Alpaca credentials are configured under Connection Settings.</li>
                      <li>Click the <span className="text-theme-accent font-semibold uppercase">"Connect Alpaca"</span> trigger in the header panel.</li>
                      <li>This connects to REST APIs, polls balances, and activates your live terminal view without starting autonomous swing cycles.</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {!config.isBotRunning && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded p-4 text-xs font-mono text-amber-400 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      <span><strong>Terminal Mode Active &bull; Swing Scheduler Paused:</strong> Real-time balances and tracking panels are connected, but autonomous automated scans and buy/sell execution sequences are currently offline.</span>
                    </div>
                    <button
                      onClick={handleToggleBot}
                      className="bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded font-black uppercase text-[10px] transition-colors cursor-pointer shrink-0 text-center"
                    >
                      Activate Trading
                    </button>
                  </div>
                )}

                {config.isBotRunning && !botState.isMarketOpen && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded p-4 text-xs font-mono text-amber-500 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      <span><strong>US Market is CLOSED &bull; Bot is in On-Duty Standby:</strong> The Swing trading bot is active, healthy, and synced 24/7. However, active scans and trading actions are currently paused because the US stock market is closed. Tracking and automated sweeps will fully resume when pre-market or standard hours open.</span>
                    </div>
                  </div>
                )}

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
              </>
            )}
          </div>
        </div>

        {/* Historic trades ledger table element */}
        <div className="w-full">
          <PerformanceHistory history={history} />
        </div>

        {/* Tactical Bot Flight Monitor Logs console */}
        <div className="w-full">
          <LogsConsole logs={logs} onClearLogs={handleClearLogs} />
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
