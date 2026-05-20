import React, { useState, useEffect } from "react";
import { Key, ShieldCheck, Database, HelpCircle, Save, Settings as SettingsIcon } from "lucide-react";
import { BotConfig } from "../types";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface SettingsProps {
  config: BotConfig;
  onSaveConfig: (updated: Partial<BotConfig>) => void;
  currentUser: any;
}

export default function Settings({ config, onSaveConfig, currentUser }: SettingsProps) {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://paper-api.alpaca.markets");
  const [newsKey, setNewsKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

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
          setApiKey(data.ALPACA_API_KEY || "");
          setApiSecret(data.ALPACA_SECRET_KEY || "");
          setBaseUrl(data.ALPACA_BASE_URL || "https://paper-api.alpaca.markets");
        }
      } catch (err: any) {
        console.error("Failed to load user credentials from Firestore:", err.message);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (currentUser) {
        // Securely sync private keys directly to Firestore
        const credRef = doc(db, "users", currentUser.uid, "private", "credentials");
        await setDoc(credRef, {
          ALPACA_API_KEY: apiKey,
          ALPACA_SECRET_KEY: apiSecret,
          ALPACA_BASE_URL: baseUrl,
          updatedAt: new Date().toISOString(),
        });
      }

      // Sync global news configuration updates
      onSaveConfig({
        NEWSAPI_KEY: newsKey,
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
    <div className="bg-theme-panel border border-theme-border rounded p-6 shadow-xl h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="w-5 h-5 text-theme-accent" />
          <h2 className="text-md font-bold tracking-tight text-white uppercase font-display">Connection Settings</h2>
        </div>
        <p className="text-[11px] text-gray-400 mb-6 font-mono uppercase tracking-tight">
          PASTE YOUR ALPACA CREDENTIALS TO RUN THE SCANNER, MANAGE LIVE NEWS GUARDS, AND DEPLOY ACTIVE TRADES.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alpaca API Key */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Key className="w-3 h-3 text-theme-accent" /> Alpaca API Key ID
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="e.g. PKX****************Y"
              className="w-full bg-theme-input border border-theme-border rounded px-3 py-1.5 text-xs text-theme-accent font-mono focus:outline-none focus:border-theme-accent"
            />
          </div>

          {/* Alpaca Secret Key */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-theme-accent" /> Alpaca Secret Key
            </label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="e.g. ************************************"
              className="w-full bg-theme-input border border-theme-border rounded px-3 py-1.5 text-xs text-theme-accent font-mono focus:outline-none focus:border-theme-accent"
            />
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

          {/* Optional News API Key */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Key className="w-3 h-3 text-gray-500" /> NewsAPI Key (Optional)
            </label>
            <input
              type="text"
              value={newsKey}
              onChange={(e) => setNewsKey(e.target.value)}
              placeholder="Headline sentiment verification"
              className="w-full bg-theme-input border border-theme-border rounded px-3 py-1.5 text-xs text-theme-accent font-mono focus:outline-none focus:border-theme-accent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-theme-accent hover:bg-blue-600 disabled:opacity-50 text-black px-4 py-2.5 rounded text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:cursor-wait"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{loading ? "Syncing..." : isSaved ? "Saved Successfully!" : "Save and Sync Keys"}</span>
          </button>
        </form>
      </div>

      <div className="mt-6 pt-4 border-t border-theme-border text-[11px] text-gray-450 space-y-2">
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
