import React, { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, Coins, Flame, HeartHandshake, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { StockSetup } from "../types";

interface ScreenerPanelProps {
  setups: StockSetup[];
  onDeploy: (symbol: string) => void;
  isDeploying: boolean;
  hasActivePosition: boolean;
}

export default function ScreenerPanel({
  setups,
  onDeploy,
  isDeploying,
  hasActivePosition,
}: ScreenerPanelProps) {
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  const toggleExpand = (symbol: string) => {
    setExpandedSymbol(expandedSymbol === symbol ? null : symbol);
  };

  return (
    <div className="bg-theme-panel border border-theme-border rounded p-6 shadow-xl h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-theme-border pb-4 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-theme-accent" />
            <h2 className="text-md font-bold text-white uppercase tracking-tight font-display">Setup Scanner proposals</h2>
          </div>
          <p className="text-xs text-gray-400 font-mono">PULLBACK CONDITIONS SCRAPING S&P 500 AND NASDAQ 100 LISTS</p>
        </div>
        <div className="text-[10px] font-mono bg-theme-input border border-theme-border px-3 py-1.5 rounded text-gray-400 uppercase font-bold">
          Candidates Filtered: <span className="text-theme-accent font-black">{setups.length}</span>
        </div>
      </div>

      {setups.length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center justify-center">
          <Sparkles className="w-8 h-8 text-theme-accent/50 mb-3 animate-pulse" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">No active proposals available</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1 font-sans">
            Trigger a manual "Scan Markets Now" command or update active connection profiles.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {setups.map((setup) => {
            const isExpanded = expandedSymbol === setup.symbol;
            const isBlocked = setup.blockersFound.length > 0;
            const sentimentColor =
              setup.sentimentScore > 0.3
                ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20"
                : setup.sentimentScore < -0.1
                ? "bg-rose-950/40 text-rose-400 border-rose-500/20"
                : "bg-amber-950/40 text-amber-400 border-amber-500/20";

            return (
              <div
                key={setup.symbol}
                className={`border rounded transition-all duration-150 ${
                  isBlocked
                    ? "bg-black/20 border-rose-950 opacity-60"
                    : "bg-theme-input/40 border-theme-border hover:border-theme-accent/50"
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(setup.symbol)}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-base font-black text-white font-mono tracking-tight bg-theme-input px-2.5 py-1 rounded border border-theme-border">
                      {setup.symbol}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-tight font-sans">{setup.companyName}</h4>
                      <p className="text-[10px] text-gray-500 font-mono">
                        RSI(14): <span className="text-theme-accent font-bold">{setup.rsi}</span> | Price: ${setup.price.toFixed(2)} | RS VS SPY: {setup.relativeStrengthRatio > 0 ? "+" : ""}{(setup.relativeStrengthRatio * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Blocked vs Sentiment badge / status tag */}
                    {isBlocked ? (
                      <span className="flex items-center gap-1 text-[9px] bg-rose-950/60 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded font-mono font-bold tracking-tight">
                        <ShieldAlert className="w-3 h-3 text-rose-400" />
                        AI BLOCKED
                      </span>
                    ) : (
                      <span className={`text-[9px] border px-2 py-0.5 rounded font-mono font-bold tracking-tight uppercase ${sentimentColor}`}>
                        SENTRY SCORE: {setup.sentimentScore > 0 ? "+" : ""}{setup.sentimentScore.toFixed(2)}
                      </span>
                    )}

                    <div className="text-[9px] bg-theme-input text-gray-400 border border-theme-border px-2.5 py-0.5 rounded font-mono uppercase font-bold tracking-tight">
                      CATALYST: {setup.catalystDate}
                    </div>

                    <button className="text-gray-500 hover:text-white transition-colors p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Specifications Panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-theme-border bg-black/40 rounded-b space-y-4">
                    {/* Setup Story Paragraph */}
                    <p className="text-xs text-gray-300 leading-relaxed font-sans italic">
                      🎯 {setup.reason}
                    </p>

                    {/* All 8 Fundamental rules indicators mapping */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="bg-theme-input p-2.5 rounded border border-theme-border space-y-0.5">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">P/E (&lt; 100x)</span>
                        <span className="font-bold text-white">{setup.pe}x</span>
                      </div>
                      <div className="bg-theme-input p-2.5 rounded border border-theme-border space-y-0.5">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Revenue (&gt; 5%)</span>
                        <span className="font-bold text-emerald-400">+{setup.revenueGrowth}%</span>
                      </div>
                      <div className="bg-theme-input p-2.5 rounded border border-theme-border space-y-0.5">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Gross M. (&gt; 40%)</span>
                        <span className="font-bold text-emerald-400">{setup.grossMargin}%</span>
                      </div>
                      <div className="bg-theme-input p-2.5 rounded border border-theme-border space-y-0.5">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Net M. (&gt; 0%)</span>
                        <span className="font-bold text-emerald-400">+{setup.netMargin}%</span>
                      </div>
                      <div className="bg-theme-input p-2.5 rounded border border-theme-border space-y-0.5">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Debt/Eq (&lt; 1.5)</span>
                        <span className="font-bold text-white">{setup.debtToEquity}</span>
                      </div>
                      <div className="bg-theme-input p-2.5 rounded border border-theme-border space-y-0.5">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Market Cap</span>
                        <span className="font-bold text-white">${setup.marketCapBillion}B</span>
                      </div>
                      <div className="bg-theme-input p-2.5 rounded border border-theme-border space-y-0.5">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">FCF POSITIVE</span>
                        <span className="font-bold text-emerald-400">YES</span>
                      </div>
                      <div className="bg-theme-input p-2.5 rounded border border-theme-border space-y-0.5">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Golden Trend</span>
                        <span className="font-bold text-emerald-400">50 &gt; 200 SMA</span>
                      </div>
                    </div>

                    {/* Vol Trends Block */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-theme-input p-3 rounded border border-theme-border text-xs text-gray-400 font-mono">
                      <div>
                        <span className="text-gray-500 block text-[9px] uppercase font-bold">Volume Trend (10d-avg &gt; 30d-avg)</span>
                        <span className="text-white font-bold">{setup.volumeTrendRatio}x INCREASING VOLUME</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[9px] uppercase font-bold">Current heavy volume surge</span>
                        <span className="text-theme-accent font-bold">{setup.entryVolumeRatio}x HEAVY SURGE BAR</span>
                      </div>
                    </div>

                    {/* Gemini Sentinel Findings */}
                    <div className="bg-theme-input border border-theme-border rounded p-4 space-y-2">
                      <div className="text-[10px] font-bold text-theme-accent flex items-center gap-1 uppercase font-mono">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gemini Sentry Context Findings</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed font-sans">
                        "{setup.sentimentReason}"
                      </p>

                      {/* Hard Blocks List */}
                      {isBlocked && (
                        <div className="mt-2 p-2.5 bg-rose-950/40 border border-rose-500/20 text-rose-400 rounded text-xs space-y-1 font-mono">
                          <span className="font-black flex items-center gap-1 text-[10px] uppercase">
                            <AlertCircle className="w-3.5 h-3.5" /> Sentry Hard Blocks Triggered:
                          </span>
                          <ul className="list-disc pl-5 text-[11px] text-rose-400">
                            {setup.blockersFound.map((b, idx) => (
                              <li key={idx}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="text-[10px] font-mono text-gray-500 pt-1 uppercase">
                        Catalyst Window Scheduled: <span className="text-amber-300 font-bold">{setup.catalystEvent}</span> on <span className="text-white font-bold">{setup.catalystDate}</span>
                      </div>
                    </div>

                    {/* Deployment button inside row */}
                    {!isBlocked && (
                      <div className="flex items-center justify-between border-t border-theme-border pt-4">
                        <div className="text-xs font-mono text-rose-400 uppercase">
                          Predefined Support Floor: ${setup.supportLevel.toFixed(2)}
                        </div>
                        <button
                          disabled={hasActivePosition || isDeploying}
                          onClick={() => onDeploy(setup.symbol)}
                          className={`flex items-center gap-1.5 px-5 py-2.5 rounded text-xs font-black uppercase font-mono transition-colors cursor-pointer ${
                            hasActivePosition
                              ? "bg-theme-input text-gray-500 border border-theme-border cursor-not-allowed"
                              : "bg-theme-accent text-black hover:bg-blue-600 shadow"
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>{isDeploying ? "Deploying..." : hasActivePosition ? "Limit reached (1 position max)" : "Deploy 100% Portfolio"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
