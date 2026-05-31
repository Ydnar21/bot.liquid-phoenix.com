import React, { useState, useEffect } from "react";
import { Key, ShieldCheck, Database, HelpCircle, Save, Settings as SettingsIcon, Eye, EyeOff } from "lucide-react";
import { BotConfig } from "../types";
import { db, switchToDefaultClientDb } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface SettingsProps {
  config: BotConfig;
  onSaveConfig: (updated: Partial<BotConfig>) => void;
  currentUser: any;
}

export default function Settings({ config, onSaveConfig, currentUser }: SettingsProps) {
  const [brokerType, setBrokerType] = useState<"ALPACA" | "ROBINHOOD">("ALPACA");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://paper-api.alpaca.markets");
  const [robinhoodApiKey, setRobinhoodApiKey] = useState("");
  const [robinhoodPrivateKey, setRobinhoodPrivateKey] = useState("");
  const [robinhoodAccountNumber, setRobinhoodAccountNumber] = useState("");
  const [robinhoodMcpUrl, setRobinhoodMcpUrl] = useState("https://agent.robinhood.com/mcp/trading");

  // Custom User LLM API keys & chosen engine support
  const [robinhoodLlmProvider, setRobinhoodLlmProvider] = useState<"GEMINI" | "CLAUDE" | "OPENAI">("GEMINI");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");

  const [newsKey, setNewsKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showRhPrivateKey, setShowRhPrivateKey] = useState(false);

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [storedDate, setStoredDate] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Load private credentials from current user's Firestore path if logged in
  useEffect(() => {
    let active = true;
    async function loadUserCreds() {
      if (!currentUser) return;
      setLoading(true);
      try {
        const credRef = doc(db, "users", currentUser.uid, "private", "credentials");
        const snap = await getDoc(credRef);
        if (snap.exists() && active) {
          const data = snap.data();
          setBrokerType(data.brokerType || "ALPACA");
          setApiKey(data.ALPACA_API_KEY || "");
          setApiSecret(data.ALPACA_SECRET_KEY || "");
          setBaseUrl(data.ALPACA_BASE_URL || "https://paper-api.alpaca.markets");
          setRobinhoodApiKey(data.ROBINHOOD_API_KEY || "");
          setRobinhoodPrivateKey(data.ROBINHOOD_PRIVATE_KEY || "");
          setRobinhoodAccountNumber(data.ROBINHOOD_ACCOUNT_NUMBER || "");
          setRobinhoodMcpUrl(data.ROBINHOOD_MCP_URL || "https://agent.robinhood.com/mcp/trading");
          setRobinhoodLlmProvider(data.ROBINHOOD_LLM_PROVIDER || "GEMINI");
          setGeminiApiKey(data.GEMINI_API_KEY || "");
          setClaudeApiKey(data.CLAUDE_API_KEY || "");
          setOpenaiApiKey(data.OPENAI_API_KEY || "");
          
          const hasCreds = data.ALPACA_API_KEY || data.ROBINHOOD_API_KEY || data.ROBINHOOD_PRIVATE_KEY;
          if (hasCreds && data.updatedAt) {
            setStoredDate(data.updatedAt);
          } else {
            setStoredDate(null);
          }
        }
      } catch (err: any) {
        console.error("Failed to load user credentials from Firestore:", err.message);
        if (err.message && (err.message.toLowerCase().includes("not-found") || err.message.toLowerCase().includes("database") || err.message.toLowerCase().includes("not_found"))) {
          try {
            switchToDefaultClientDb();
            const credRef = doc(db, "users", currentUser.uid, "private", "credentials");
            const snap = await getDoc(credRef);
            if (snap.exists() && active) {
              const data = snap.data();
              setBrokerType(data.brokerType || "ALPACA");
              setApiKey(data.ALPACA_API_KEY || "");
              setApiSecret(data.ALPACA_SECRET_KEY || "");
              setBaseUrl(data.ALPACA_BASE_URL || "https://paper-api.alpaca.markets");
              setRobinhoodApiKey(data.ROBINHOOD_API_KEY || "");
              setRobinhoodPrivateKey(data.ROBINHOOD_PRIVATE_KEY || "");
              setRobinhoodAccountNumber(data.ROBINHOOD_ACCOUNT_NUMBER || "");
              setRobinhoodMcpUrl(data.ROBINHOOD_MCP_URL || "https://agent.robinhood.com/mcp/trading");
              setRobinhoodLlmProvider(data.ROBINHOOD_LLM_PROVIDER || "GEMINI");
              setGeminiApiKey(data.GEMINI_API_KEY || "");
              setClaudeApiKey(data.CLAUDE_API_KEY || "");
              setOpenaiApiKey(data.OPENAI_API_KEY || "");
              
              const hasCredsFallback = data.ALPACA_API_KEY || data.ROBINHOOD_API_KEY || data.ROBINHOOD_PRIVATE_KEY;
              if (hasCredsFallback && data.updatedAt) {
                setStoredDate(data.updatedAt);
              } else {
                setStoredDate(null);
              }
            }
          } catch (retryErr: any) {
            console.error("Fallback load user credentials from Firestore also failed:", retryErr.message);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUserCreds();
    return () => {
      active = false;
    };
  }, [currentUser]);

  // Load fallback global news scale keys
  useEffect(() => {
    setNewsKey(config.NEWSAPI_KEY || "");
  }, [config]);

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      // Pause connection and suspend the scanner session
      onSaveConfig({
        isConnectionActive: false,
        isBotRunning: false,
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error("Failed to disconnect connection:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCredentials = async () => {
    setLoading(true);
    try {
      // 1. Wipe React States and reset confirmation
      setApiKey("");
      setApiSecret("");
      setRobinhoodApiKey("");
      setRobinhoodPrivateKey("");
      setRobinhoodAccountNumber("");
      setGeminiApiKey("");
      setClaudeApiKey("");
      setOpenaiApiKey("");
      setStoredDate(null);
      setShowConfirmDelete(false);

      // 2. Clear stored credentials in Firestore
      if (currentUser) {
        const payload = {
          brokerType,
          ALPACA_API_KEY: "",
          ALPACA_SECRET_KEY: "",
          ALPACA_BASE_URL: baseUrl,
          ROBINHOOD_API_KEY: "",
          ROBINHOOD_PRIVATE_KEY: "",
          ROBINHOOD_ACCOUNT_NUMBER: "",
          ROBINHOOD_MCP_URL: "https://agent.robinhood.com/mcp/trading",
          GEMINI_API_KEY: "",
          CLAUDE_API_KEY: "",
          OPENAI_API_KEY: "",
          ROBINHOOD_LLM_PROVIDER: robinhoodLlmProvider,
          updatedAt: "",
        };

        try {
          const credRef = doc(db, "users", currentUser.uid, "private", "credentials");
          await setDoc(credRef, payload);
        } catch (e: any) {
          if (e.message && (e.message.toLowerCase().includes("not-found") || e.message.toLowerCase().includes("database") || e.message.toLowerCase().includes("not_found"))) {
            switchToDefaultClientDb();
            const credRef = doc(db, "users", currentUser.uid, "private", "credentials");
            await setDoc(credRef, payload);
          } else {
            throw e;
          }
        }

        // Sync local storage / backup deletion to Node server controller
        try {
          await fetch("/api/save-credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: currentUser.uid,
              ...payload,
            }),
          });
        } catch (errFallback) {
          console.warn("Secure local fallback deletion error:", errFallback);
        }
      }

      // 3. Update the bot configurations
      onSaveConfig({
        isConnectionActive: false,
        isBotRunning: false,
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error("Failed to delete stored credentials:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const timestamp = new Date().toISOString();

    try {
      if (currentUser) {
        const payload = {
          brokerType,
          ALPACA_API_KEY: apiKey,
          ALPACA_SECRET_KEY: apiSecret,
          ALPACA_BASE_URL: baseUrl,
          ROBINHOOD_API_KEY: robinhoodApiKey,
          ROBINHOOD_PRIVATE_KEY: robinhoodPrivateKey,
          ROBINHOOD_ACCOUNT_NUMBER: robinhoodAccountNumber,
          ROBINHOOD_MCP_URL: robinhoodMcpUrl,
          GEMINI_API_KEY: geminiApiKey,
          CLAUDE_API_KEY: claudeApiKey,
          OPENAI_API_KEY: openaiApiKey,
          ROBINHOOD_LLM_PROVIDER: robinhoodLlmProvider,
          updatedAt: timestamp,
        };

        try {
          // Securely sync private keys directly to Firestore
          const credRef = doc(db, "users", currentUser.uid, "private", "credentials");
          await setDoc(credRef, payload);
        } catch (e: any) {
          if (e.message && (e.message.toLowerCase().includes("not-found") || e.message.toLowerCase().includes("database") || e.message.toLowerCase().includes("not_found"))) {
            switchToDefaultClientDb();
            const credRef = doc(db, "users", currentUser.uid, "private", "credentials");
            await setDoc(credRef, payload);
          } else {
            throw e;
          }
        }

        // Sync secure localized backup fallback to server
        try {
          await fetch("/api/save-credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: currentUser.uid,
              ...payload,
            }),
          });
        } catch (errFallback) {
          console.warn("Secure local fallback registration error:", errFallback);
        }
      }

      // Update storedDate with newly set timestamp instantly
      setStoredDate(timestamp);

      // Clear the input fields where users enter credentials in case they need to enter new ones
      setApiKey("");
      setApiSecret("");
      setRobinhoodApiKey("");
      setRobinhoodPrivateKey("");
      setRobinhoodAccountNumber("");
      setGeminiApiKey("");
      setClaudeApiKey("");
      setOpenaiApiKey("");

      // Sync global news configuration updates & activate connection state
      onSaveConfig({
        NEWSAPI_KEY: newsKey,
        isConnectionActive: true,
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error("Failed to save Connection settings:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-theme-panel border border-theme-border rounded p-6 shadow-xl h-auto flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="w-5 h-5 text-theme-accent" />
          <h2 className="text-md font-bold tracking-tight text-white uppercase font-display">Connection Settings</h2>
        </div>
        <p className="text-[11px] text-gray-400 mb-4 font-mono uppercase tracking-tight">
          {brokerType === "ALPACA" 
            ? "Configure Alpaca credentials to run the scanner and submit live simulated orders." 
            : "Configure custom Robinhood Agentic MCP credentials for secure direct cloud routing."}
        </p>

        {/* Broker Provider Selector segmented switch */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-900 border border-theme-border rounded-lg mb-4">
          <button
            type="button"
            onClick={() => setBrokerType("ALPACA")}
            className={`py-2 text-[10px] font-mono font-bold rounded-md uppercase tracking-wider relative transition-all cursor-pointer ${
              brokerType === "ALPACA"
                ? "bg-theme-accent text-black font-extrabold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Alpaca API Keys
          </button>
          <button
            type="button"
            onClick={() => setBrokerType("ROBINHOOD")}
            className={`py-2 text-[10px] font-mono font-bold rounded-md uppercase tracking-wider relative transition-all cursor-pointer ${
              brokerType === "ROBINHOOD"
                ? "bg-[#00c805] text-black font-extrabold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Robinhood MCP Pro
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {storedDate && (
            <div className="bg-neutral-900 border border-emerald-950/60 rounded p-3 text-[11px] font-mono space-y-1.5" id="credentials-stored-banner">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00c805]" />
                <span>Secure Credentials Retained</span>
              </div>
              <p className="text-zinc-400 text-[10px] leading-relaxed">
                Credentials stored on <span className="text-[#00c805] font-semibold">{new Date(storedDate).toLocaleString()}</span>. You can use these credentials whenever you want, or permanently remove them from the cloud database.
              </p>
              <div className="pt-0.5">
                {!showConfirmDelete ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setShowConfirmDelete(true)}
                    className="text-[9px] text-red-500 hover:text-red-400 font-bold uppercase tracking-wider underline cursor-pointer disabled:opacity-50 transition-colors"
                    id="btn-delete-credentials"
                  >
                    Delete Stored Credentials
                  </button>
                ) : (
                  <div className="bg-red-950/20 border border-red-900/40 rounded p-2.5 mt-1 space-y-2 animate-fade-in" id="delete-credentials-confirm-section">
                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-wide">
                      Are you sure you want to permanently delete these credentials?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleDeleteCredentials}
                        className="bg-red-600 hover:bg-red-500 text-white font-mono text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-wider cursor-pointer"
                        id="btn-confirm-delete-yes"
                      >
                        Yes, Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmDelete(false)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-wider cursor-pointer"
                        id="btn-confirm-delete-no"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {brokerType === "ALPACA" ? (
            <>
              {/* Alpaca API Key */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Key className="w-3 h-3 text-theme-accent" /> Alpaca API Key ID
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="e.g. PKX****************Y"
                    className="w-full bg-theme-input border border-theme-border rounded pl-3 pr-10 py-1.5 text-xs text-theme-accent font-mono focus:outline-none focus:border-theme-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 px-1.5 py-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title={showApiKey ? "Hide Key ID" : "Show Key ID"}
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Alpaca Secret Key */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-theme-accent" /> Alpaca Secret Key
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showApiSecret ? "text" : "password"}
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="e.g. ************************************"
                    className="w-full bg-theme-input border border-theme-border rounded pl-3 pr-10 py-1.5 text-xs text-theme-accent font-mono focus:outline-none focus:border-theme-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiSecret(!showApiSecret)}
                    className="absolute right-2 px-1.5 py-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title={showApiSecret ? "Hide Secret" : "Show Secret"}
                  >
                    {showApiSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Base URL (Paper vs Live) */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-theme-accent" /> Routing Environment
                </label>
                <select
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full bg-theme-input border border-theme-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-theme-accent cursor-pointer"
                >
                  <option value="https://paper-api.alpaca.markets">
                    Paper Trading (Simulated Environment)
                  </option>
                  <option value="https://api.alpaca.markets">
                    Live Brokerage (REAL FUNDS INVOLVED)
                  </option>
                </select>
              </div>
            </>
          ) : (
            <>
              {/* Robinhood MCP URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 block uppercase font-mono tracking-wider flex items-center gap-1.5 font-bold">
                  <Database className="w-3 h-3 text-[#00c805]" /> Model Context Protocol Gateway
                </label>
                <input
                  type="text"
                  value={robinhoodMcpUrl}
                  onChange={(e) => setRobinhoodMcpUrl(e.target.value)}
                  placeholder="https://agent.robinhood.com/mcp/trading"
                  className="w-full bg-[#0a170c] border border-emerald-950/40 rounded px-3 py-1.5 text-xs text-[#00c805] font-mono focus:outline-none"
                />
              </div>

              {/* LLM Engine Provider Select */}
              <div className="space-y-1.5 pt-2 border-t border-theme-border/20">
                <label className="text-[10px] text-zinc-400 block uppercase font-mono tracking-wider flex items-center gap-1.5 font-bold">
                  <SettingsIcon className="w-3 h-3 text-emerald-400" /> Active LLM Coordinator
                </label>
                <select
                  value={robinhoodLlmProvider}
                  onChange={(e) => setRobinhoodLlmProvider(e.target.value as any)}
                  className="w-full bg-[#0a170c] border border-emerald-950/40 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="GEMINI">Google Gemini Pro (Default)</option>
                  <option value="CLAUDE">Anthropic Claude Sonnet</option>
                  <option value="OPENAI">OpenAI ChatGPT GPT-4o</option>
                </select>
                <p className="text-[9px] text-zinc-500 leading-tight">
                  The coordinated LLM translates indicators into standard MCP transactional buy/sell actions dynamically.
                </p>
              </div>

              {/* Gemini API Key input */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 block uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Key className="w-3 h-3 text-[#00c805]" /> User Gemini API Key
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showGeminiKey ? "text" : "password"}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="Provide your Gemini API Key..."
                    className="w-full bg-[#0a170c] border border-emerald-950/40 rounded pl-3 pr-10 py-1.5 text-xs text-[#00c805] font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-2 px-1.5 py-1 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Claude API Key input */}
              <div className="space-y-1.5 font-mono">
                <label className="text-[10px] text-zinc-400 block uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Key className="w-3 h-3 text-[#00c805]" /> User Claude API Key
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showClaudeKey ? "text" : "password"}
                    value={claudeApiKey}
                    onChange={(e) => setClaudeApiKey(e.target.value)}
                    placeholder="Provide your Anthropic API Key..."
                    className="w-full bg-[#0a170c] border border-emerald-950/40 rounded pl-3 pr-10 py-1.5 text-xs text-[#00c805] font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClaudeKey(!showClaudeKey)}
                    className="absolute right-2 px-1.5 py-1 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {showClaudeKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* OpenAI API Key input */}
              <div className="space-y-1.5 font-mono">
                <label className="text-[10px] text-zinc-400 block uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Key className="w-3 h-3 text-[#00c805]" /> User OpenAI API Key
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showOpenaiKey ? "text" : "password"}
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="Provide your OpenAI API Key..."
                    className="w-full bg-[#0a170c] border border-emerald-950/40 rounded pl-3 pr-10 py-1.5 text-xs text-[#00c805] font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    className="absolute right-2 px-1.5 py-1 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {showOpenaiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Optional News API Key */}
          <div className="space-y-1.5 opacity-80 pt-2 border-t border-theme-border/20">
            <label className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider flex items-center gap-1.5 font-bold">
              <Key className="w-3 h-3 text-emerald-400" /> News Catalyst Intelligence
            </label>
            <input
              type="text"
              readOnly
              value="ACTIVE (Unified AI Multi-Source Catalysts)"
              className="w-full bg-emerald-950/20 border border-emerald-500/30 rounded px-3 py-1.5 text-xs text-emerald-400 font-mono focus:outline-none"
            />
            <p className="text-[9px] text-gray-500 leading-tight">
              News catalyst intelligence streams automatically from integrated real-time sources to verify ticker catalysts before trade executions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            {config.isConnectionActive ? (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={loading}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-red-500 border border-red-950/50 hover:border-red-500/50 disabled:opacity-50 px-4 py-2.5 rounded text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-wait"
                id="btn-disconnect-settings"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-950/50 hover:border-emerald-500/50 disabled:opacity-50 px-4 py-2.5 rounded text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-wait font-bold"
                id="btn-connect-settings"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Connect</span>
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full disabled:opacity-50 text-black px-4 py-2.5 rounded text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg disabled:cursor-wait ${
                brokerType === "ROBINHOOD" 
                  ? "bg-[#00c805] hover:bg-[#00b004]"
                  : "bg-theme-accent hover:bg-orange-600"
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? "Syncing..." : isSaved ? "Saved!" : "Save & Sync"}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 pt-4 border-t border-theme-border text-[11px] text-gray-400 space-y-2">
        <h4 className="font-semibold text-gray-400 flex items-center gap-1 uppercase font-mono text-[10px] tracking-wider">
          <HelpCircle className="w-3.5 h-3.5 text-theme-accent" /> Strategy Config
        </h4>
        <div className="space-y-1 text-xs text-gray-400 font-mono">
          <div className="flex justify-between">
            <span>Max Positions</span>
            <span className="text-white">1 Trade Only</span>
          </div>
          <div className="flex justify-between">
            <span>Position Size</span>
            <span className="text-white">100% Equity</span>
          </div>
          <div className="flex justify-between">
            <span>Direction</span>
            <span className="text-emerald-400 font-bold">Long Only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
