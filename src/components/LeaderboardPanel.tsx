import React, { useEffect, useState } from "react";
import { Trophy, Award, Calendar, DollarSign, TrendingUp, Sparkles, User, RefreshCw } from "lucide-react";

interface LeaderboardPanelProps {
  currentUserId?: string;
}

interface TraderRank {
  userId: string;
  username: string;
  profitPct: number;
  moneyMade: number;
  daysActive: number;
  isCurrentUser?: boolean;
  isRegistered?: boolean;
  isCommunity?: boolean;
}

interface LeaderboardData {
  alpaca_paper: TraderRank[];
  alpaca_live: TraderRank[];
  robinhood_live: TraderRank[];
}

export default function LeaderboardPanel({ currentUserId }: LeaderboardPanelProps) {
  const [ranking, setRanking] = useState<LeaderboardData>({
    alpaca_paper: [],
    alpaca_live: [],
    robinhood_live: [],
  });
  const [activeBoard, setActiveBoard] = useState<"alpaca_paper" | "alpaca_live" | "robinhood_live" >("alpaca_paper");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = currentUserId ? `/api/leaderboard?userId=${currentUserId}` : "/api/leaderboard";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to load competitive leaderboard rankings");
      }
      const data = await res.json();
      if (data.success && data.ranking) {
        setRanking({
          alpaca_paper: data.ranking.alpaca_paper || [],
          alpaca_live: data.ranking.alpaca_live || [],
          robinhood_live: data.ranking.robinhood_live || [],
        });
      } else {
        throw new Error("Invalid leaderboard structure response");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown retrieval exception");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [currentUserId]);

  const activeList = ranking[activeBoard] || [];

  return (
    <div className="bg-theme-panel border border-theme-border rounded p-6 shadow-xl space-y-6" id="leaderboard-workspace">
      {/* Table Header block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-theme-border pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-md font-bold text-white uppercase tracking-tight font-display">Tactical Bot Leaderboard</h2>
          </div>
          <p className="text-xs text-gray-400 font-mono text-left">PROFITABILITY OVERVIEW OF REGISTERED USERS AND COMMUNITY ALGORITHMIC TRADERS</p>
        </div>
        
        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-theme-input hover:bg-neutral-800 text-xs font-bold font-mono text-gray-400 hover:text-white border border-theme-border cursor-pointer transition-colors active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-theme-accent" : ""}`} />
          <span>RELOAD RANKS</span>
        </button>
      </div>

      {/* Board Toggles */}
      <div className="flex flex-wrap items-center gap-2 border-b border-theme-border/40 pb-4" id="leaderboard-board-tabs">
        <button
          type="button"
          onClick={() => setActiveBoard("alpaca_paper")}
          className={`px-3 py-1.5 text-[10px] font-bold uppercase font-mono tracking-wider rounded border transition-all cursor-pointer ${
            activeBoard === "alpaca_paper"
              ? "bg-[#00c805]/10 border-[#00c805]/50 text-[#00c805]"
              : "bg-theme-input sm:bg-transparent border-theme-border text-gray-400 hover:text-white hover:border-gray-500"
          }`}
        >
          Alpaca Paper Account
        </button>
        <button
          type="button"
          onClick={() => setActiveBoard("alpaca_live")}
          className={`px-3 py-1.5 text-[10px] font-bold uppercase font-mono tracking-wider rounded border transition-all cursor-pointer ${
            activeBoard === "alpaca_live"
              ? "bg-theme-accent/15 border-theme-accent text-theme-accent"
              : "bg-theme-input sm:bg-transparent border-theme-border text-gray-400 hover:text-white hover:border-gray-500"
          }`}
        >
          Alpaca Real Live USD
        </button>
        <button
          type="button"
          onClick={() => setActiveBoard("robinhood_live")}
          className={`px-3 py-1.5 text-[10px] font-bold uppercase font-mono tracking-wider rounded border transition-all cursor-pointer ${
            activeBoard === "robinhood_live"
              ? "bg-[#00c805]/10 border-emerald-500/30 text-emerald-400"
              : "bg-theme-input sm:bg-transparent border-theme-border text-gray-400 hover:text-white hover:border-gray-500"
          }`}
        >
          Robinhood Live (Soon)
        </button>
      </div>

      {activeBoard === "robinhood_live" ? (
        <div className="bg-[#0b170e]/80 border border-emerald-500/25 rounded-md p-8 text-center space-y-4 font-mono select-none my-3 animate-fade-in" id="robinhood-leaderboard-in-dev">
          <div className="w-12 h-12 bg-emerald-950/40 border border-emerald-500/30 rounded-full flex items-center justify-center text-[#00c805]/95 text-[11px] font-black mx-auto animate-pulse">
            MCP
          </div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Robinhood Competitive Board In Progress</h4>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
            We are actively implementing the secure telemetry streaming gateway to index other active community MCP agents. Once online, live Robinhood accounts will compile on this synchronized global ledger.
          </p>
          <div className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold uppercase tracking-wider">
            IN DEVELOPMENT
          </div>
        </div>
      ) : loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center space-y-3" id="leaderboard-loading">
          <div className="w-8 h-8 rounded-full border-2 border-theme-accent border-t-transparent animate-spin"></div>
          <p className="text-xs text-gray-500 font-mono uppercase">Retrieving secure network profiles...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-red-950/10 border border-red-500/10 rounded p-6 space-y-2" id="leaderboard-error">
          <p className="text-xs text-red-400 font-mono font-bold uppercase">Retrieval Discrepancy</p>
          <p className="text-xs text-gray-400 font-sans max-w-sm mx-auto">{error}</p>
        </div>
      ) : activeList.length === 0 ? (
        <div className="text-center py-16 text-gray-500" id="leaderboard-empty">
          <User className="w-8 h-8 mx-auto mb-2 text-gray-600" />
          <p className="text-xs font-mono uppercase">No trading profiles compiled for this board</p>
        </div>
      ) : (
        <div className="overflow-x-auto" id="leaderboard-container">
          <table className="w-full text-left text-xs font-mono border-collapse" id="leaderboard-table">
            <thead>
              <tr className="border-b border-theme-border/50 text-[10px] text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 pb-3 font-semibold text-center w-12">Rank</th>
                <th className="py-2.5 pb-3 font-semibold">Trader Username</th>
                <th className="py-2.5 pb-3 font-semibold text-center">Active Tenure</th>
                <th className="py-2.5 pb-3 font-semibold text-right">Yield (% Growth)</th>
                <th className="py-2.5 pb-3 font-semibold text-right pr-4">Total Earnings ($)</th>
              </tr>
            </thead>
            <tbody>
              {activeList.map((trader, index) => {
                const rankNum = index + 1;
                const isTop1 = rankNum === 1;
                const isTop3 = rankNum <= 3;
                
                // Color mapping for profitability
                const profitColor = trader.profitPct > 0 
                  ? "text-emerald-400" 
                  : trader.profitPct < 0 
                  ? "text-rose-400" 
                  : "text-zinc-500";

                const rowBg = trader.isCurrentUser
                  ? "bg-theme-accent/5 border border-theme-accent/30 font-bold"
                  : "border-b border-theme-border/20 hover:bg-neutral-900/20";

                const badgeText = trader.isCurrentUser 
                  ? "YOU (ACTIVE)" 
                  : trader.isCommunity 
                  ? "COMMUNITY AI" 
                  : "REGISTERED";

                return (
                  <tr 
                    key={trader.userId + "-" + trader.username} 
                    className={`transition-all ${rowBg}`}
                    id={`leaderboard-row-${trader.userId}`}
                  >
                    {/* Rank column */}
                    <td className="py-3.5 text-center font-bold">
                      {isTop3 ? (
                        <div className="flex items-center justify-center">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                            isTop1 
                              ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20" 
                              : rankNum === 2 
                              ? "bg-zinc-300 text-black" 
                              : "bg-amber-700 text-white"
                          }`}>
                            {rankNum}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-center block">{rankNum}</span>
                      )}
                    </td>

                    {/* Username and status code badges */}
                    <td className="py-3.5 font-sans">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs uppercase font-medium ${trader.isCurrentUser ? "text-theme-accent font-black tracking-tight" : "text-white"}`}>
                          {trader.username}
                        </span>
                        
                        <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded tracking-wider ${
                          trader.isCurrentUser 
                            ? "bg-theme-accent/20 border border-theme-accent/30 text-theme-accent" 
                            : trader.isCommunity 
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                            : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                        }`}>
                          {badgeText}
                        </span>
                      </div>
                    </td>

                    {/* Days Active Tenure */}
                    <td className="py-3.5 text-center text-gray-300 font-mono">
                      <div className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span>{trader.daysActive} {trader.daysActive === 1 ? "day" : "days"}</span>
                      </div>
                    </td>

                    {/* Percentage Return Ratio */}
                    <td className={`py-3.5 text-right font-bold font-mono ${profitColor}`}>
                      <span>
                        {trader.profitPct > 0 ? "+" : ""}
                        {trader.profitPct.toFixed(2)}%
                      </span>
                    </td>

                    {/* Dollar balance earnings column */}
                    <td className="py-3.5 text-right pr-4 font-mono font-bold text-white">
                      <div className="inline-flex items-center justify-end gap-0.5">
                        <span className={`${trader.moneyMade > 0 ? "text-emerald-500" : trader.moneyMade < 0 ? "text-rose-500" : "text-zinc-500"}`}>
                          {trader.moneyMade >= 0 ? "+" : "-"}
                        </span>
                        <span>${Math.abs(trader.moneyMade).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Leaderboard Tips footnote */}
      <div className="border border-theme-border/50 bg-[#00c805]/5 rounded p-4 text-[11px] leading-relaxed text-zinc-400 font-mono flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-[#00c805] shrink-0 mt-0.5 animate-pulse" />
        <div>
          <span className="text-[#00c805] font-bold uppercase block mb-0.5">Algorithmic Rank Rules Policy</span>
          Leaderboard yields are synchronized in real-time under a <span className="text-zinc-100 font-semibold">$100,000.00 standard portfolio</span> benchmark. 
          To improve your score or advance your rank, register your custom Username in the upper right header and execute profitable swing setups through Alpaca or Robinhood MCP modules!
        </div>
      </div>
    </div>
  );
}
