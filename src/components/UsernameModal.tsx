import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw, X } from "lucide-react";

interface UsernameModalProps {
  isOpen: boolean;
  userId: string;
  currentUsername: string;
  forcePrompt: boolean;
  onSaveSuccess: (username: string) => void;
  onClose?: () => void;
}

export default function UsernameModal({
  isOpen,
  userId,
  currentUsername,
  forcePrompt,
  onSaveSuccess,
  onClose,
}: UsernameModalProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (currentUsername) {
      setUsername(currentUsername);
    }
  }, [currentUsername, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter a username.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/save-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username: username.trim() }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onSaveSuccess(username.trim());
        if (onClose && !forcePrompt) {
          onClose();
        }
      } else {
        setError(data.error || "Failed to update username.");
      }
    } catch (err: any) {
      setError("Network or server communication error. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateAiUsernames = async () => {
    setAiLoading(true);
    setError("");
    try {
      const response = await fetch("/api/generate-usernames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (response.ok && data.success && Array.isArray(data.usernames)) {
        setSuggestions(data.usernames);
      } else {
        setError("Could not generate suggestions at this time.");
      }
    } catch (err) {
      setError("AI model engine is busy, using local generation formulas.");
      // Fallback local mock generators in case of severe server load
      const suffixes = ["Trader", "Sentry", "Phoenix", "Alpha", "Sovereign"];
      const randSuff = suffixes[Math.floor(Math.random() * suffixes.length)];
      const randNum = Math.floor(100 + Math.random() * 900);
      setSuggestions([
        `Sentry_${randSuff}`,
        `Phoenix_${randSuff}`,
        `Alpha_${randSuff}_${randNum}`
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div 
        className="bg-theme-panel border border-theme-border rounded-xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative"
        id="username-setup-modal"
      >
        {onClose && !forcePrompt && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col items-center text-center gap-4 mb-6">
          <div className="w-12 h-12 bg-theme-accent/10 border border-theme-accent/20 rounded-xl flex items-center justify-center text-theme-accent shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight uppercase text-white font-display">
              {forcePrompt ? "Configure Sentry User ID" : "Modify Sentry User ID"}
            </h2>
            <p className="text-[10px] text-theme-accent font-mono tracking-widest uppercase">
              Autonomous Identity Protocols
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center leading-relaxed mb-6 font-medium">
          Create a unique trading alias. Your custom identity aligns real-time swing setups, synchronizes cloud terminals, and secures copy logs.
        </p>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-bold">
                Unique Username
              </label>
              <button
                type="button"
                onClick={generateAiUsernames}
                disabled={aiLoading}
                className="text-[10px] text-theme-accent hover:text-orange-400 font-mono font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {aiLoading ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>Have AI Create It</span>
              </button>
            </div>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_\-]/g, ""))}
              placeholder="e.g. SentryTrader-99"
              maxLength={25}
              disabled={loading}
              className="w-full bg-theme-input border border-theme-border rounded px-4 py-3 text-sm text-white font-mono focus:border-theme-accent focus:outline-none transition-colors"
              required
            />
          </div>

          {suggestions.length > 0 && (
            <div className="bg-theme-input/40 border border-theme-border/60 p-3.5 rounded-lg space-y-2.5">
              <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider block font-bold">
                ✦ AI Suggested Identities (Click to choose):
              </span>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setUsername(sug)}
                    className="bg-theme-input hover:bg-theme-border border border-theme-border rounded-full px-3 py-1.5 text-xs text-theme-accent font-mono transition-colors font-bold cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10.5px] p-3 rounded flex items-start gap-2.5 font-mono uppercase leading-normal">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black hover:bg-gray-100 transition-all font-black uppercase tracking-wider py-3.5 rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? "Validating Uniqueness..." : "Establish Secure User ID"}</span>
            </button>

            <div className="flex items-start gap-2 text-[9.5px] text-gray-500 font-mono tracking-wide leading-relaxed bg-theme-input/20 p-2.5 rounded border border-theme-border/50">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Rules:</strong> No two traders can possess duplicate names. You may alter your username exactly <strong>once per calendar month</strong>.
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
