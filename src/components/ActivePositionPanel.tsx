import React, { useState } from "react";
import { ShieldCheck, Crosshair, AlertOctagon, TrendingUp, HelpCircle, Activity, X } from "lucide-react";
import { ActivePosition } from "../types";

interface ActivePositionPanelProps {
  position: ActivePosition | null;
  onExitPosition: (symbol: string, reason: string) => void;
  isExiting: boolean;
}

export default function ActivePositionPanel({
  position,
  onExitPosition,
  isExiting,
}: ActivePositionPanelProps) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  if (!position) {
    return (
      <div className="bg-theme-panel border border-theme-border rounded p-6 sm:p-10 text-center flex flex-col items-center justify-center h-full min-h-[220px] gap-3">
        <Activity className="w-8 h-8 text-theme-accent animate-pulse shrink-0" />
        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-display leading-snug">
            No Active Position Deployed
          </h3>
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            The autonomous market agent is in hunt mode. Once a high-probability pullback setup matches all technical and Gemini sentiment filters, it will reflect here.
          </p>
        </div>
      </div>
    );
  }

  const plPct = position.unrealizedPlPct;
  const isProfit = plPct >= 0;

  // Calculate percentage progress between support and resistance target
  const range = position.targetPrice - position.supportLevel;
  const progressPercent = Math.max(
    0,
    Math.min(100, ((position.currentPrice - position.supportLevel) / (range || 1)) * 100)
  );

  return (
    <div className="bg-theme-active-panel border border-theme-accent rounded p-5 sm:p-6 shadow-xl h-full flex flex-col justify-between relative overflow-hidden">
      {/* Decorative vertical color accent indicator */}
      <div className="absolute top-0 left-0 w-1 h-full bg-theme-accent" />

      <div className="pl-1 sm:pl-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-theme-border pb-4 mb-5 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono shrink-0">
              {position.symbol}
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-semibold text-gray-200 truncate pr-2">
                {position.companyName}
              </span>
              <span className="text-[9px] sm:text-[10px] text-theme-accent font-mono font-bold uppercase tracking-wider">
                Active Portfolio Trade
              </span>
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <div className={`text-xl sm:text-2xl font-black font-mono leading-none ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
              {isProfit ? "+" : ""}{plPct.toFixed(2)}%
            </div>
            <div className={`text-xs sm:text-sm font-mono font-semibold mt-1.5 leading-none ${isProfit ? "text-emerald-500" : "text-rose-500"}`}>
              {isProfit ? "+" : ""}${position.unrealizedPl.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Trade Details Cards - Grid style */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6 font-mono text-xs">
          <div className="bg-theme-input border border-theme-border p-3 rounded">
            <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider mb-0.5">Qty Size</span>
            <span className="font-bold text-white text-xs sm:text-sm break-all">{position.qty} SHARES</span>
          </div>
          <div className="bg-theme-input border border-theme-border p-3 rounded">
            <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider mb-0.5">Entry basis</span>
            <span className="font-bold text-white text-xs sm:text-sm">${position.entryPrice.toFixed(2)}</span>
          </div>
          <div className="bg-theme-input border border-theme-border p-3 rounded">
            <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider mb-0.5">Market Price</span>
            <span className="font-bold text-emerald-400 animate-pulse text-xs sm:text-sm">${position.currentPrice.toFixed(2)}</span>
          </div>
          <div className="bg-theme-input border border-theme-border p-3 rounded">
            <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider mb-0.5">Current Value</span>
            <span className="font-bold text-white text-xs sm:text-sm">${position.currentValue.toFixed(2)}</span>
          </div>
        </div>

        {/* Technical Highlights for Active Position */}
        {(position.rsiStatus || position.hasBullishFVG || position.demandZone) && (
          <div className="mb-4 p-3 bg-black/40 border border-theme-border rounded-lg space-y-1 text-[11px] font-mono">
            <div className="text-[9px] text-theme-accent font-bold uppercase tracking-wider">
              Technical Metrics At Entrance
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-gray-300">
                RSI: <span className="text-white font-bold">{position.rsiStatus || "NEUTRAL"}</span>
              </span>
              {position.isSMAPullback && (
                <span className="text-indigo-400 font-bold">
                  &bull; SMA(50) Pullback Test: ${position.sma50Price}
                </span>
              )}
              {position.demandZone && (
                <span className="text-gray-300">
                  &bull; Demand Floor: <span className="text-white font-semibold">${position.demandZone}</span>
                </span>
              )}
              {position.supplyZone && (
                <span className="text-gray-300">
                  &bull; Supply Ceiling: <span className="text-white font-semibold">${position.supplyZone}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Dynamic target tracking progress bar */}
        <div className="my-6 space-y-2 bg-theme-input/40 border border-theme-border/40 p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono gap-1.5">
            <span className="text-rose-400 font-semibold flex items-center gap-1">
              Support Line: ${position.supportLevel.toFixed(2)}
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1 sm:text-right">
              Target Peak: ${position.targetPrice.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-3 bg-black/60 border border-theme-border/60 rounded-full overflow-hidden relative">
            <div
              className={`h-full tracking-wide rounded-full transition-all duration-500 bg-theme-accent`}
              style={{ width: `${progressPercent}%` }}
            />
            <div className="absolute top-0 bottom-0 w-0.5 bg-white/75" style={{ left: `${progressPercent}%` }} />
          </div>
          <div className="text-[9.5px] text-gray-400 text-center uppercase font-mono tracking-wider">
            S-A Sentry Progress: {progressPercent.toFixed(0)}% to Resistance Target Area
          </div>
        </div>

        {/* Critical Rule Schedules - Completely responsive stacking elements */}
        <div className="border-t border-theme-border pt-4 mt-6 text-xs font-mono space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 border-b border-theme-border/20 last:border-0">
            <span className="text-gray-500 uppercase font-bold text-[10px]">Pre-Earnings Sell Day:</span>
            <span className="text-gray-300 font-semibold text-right">{position.earningsDate || "N/A"}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 border-b border-theme-border/20 last:border-0">
            <span className="text-gray-500 uppercase font-bold text-[10px]">Estimated Catalyst Event:</span>
            <span className="text-theme-accent font-bold uppercase truncate max-w-full sm:max-w-[260px] text-left sm:text-right" title={position.catalystEvent}>
              {position.catalystEvent || "None Detected"}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 last:border-0">
            <span className="text-gray-500 uppercase font-bold text-[10px]">Catalyst Date Deadline:</span>
            <span className="text-gray-300 font-semibold text-right">{position.catalystDate || "N/A"}</span>
          </div>
        </div>

        {/* Threat Audit AI Area for breachers */}
        {position.status === "REVIEW" && (
          <div className="mt-5 p-4 bg-rose-950/20 border border-rose-500/20 rounded space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs font-mono uppercase">
              <AlertOctagon className="w-4 h-4 animate-pulse" />
              <span>Support Trigger: AI RISK REVIEW UNDERWAY</span>
            </div>
            {position.aiCommentary ? (
              <p className="text-[11px] text-gray-200 leading-relaxed font-sans italic">
                "{position.aiCommentary}"
              </p>
            ) : (
              <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                Reviewing news wires for Taiwanese tensions, regulatory blocks, or management turnover alerts...
              </p>
            )}
            <div className="text-[10px] text-rose-400 bg-black/40 p-2 rounded border border-rose-500/10 uppercase font-mono text-center">
              Recommends: <span className="text-rose-400 font-bold">{position.aiCommentary?.includes("SELL") ? "SELL EXIT" : "HOLD TRACKING"}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pl-1 sm:pl-2">
        {!showExitConfirm ? (
          <button
            onClick={() => setShowExitConfirm(true)}
            className="w-full bg-rose-500 hover:bg-rose-600 text-black py-2.5 rounded text-xs font-black uppercase tracking-wider transition-colors cursor-pointer text-center block"
          >
            Emergency Kill Close Position
          </button>
        ) : (
          <div className="p-4 bg-rose-950/30 border border-rose-500/20 rounded space-y-3">
            <p className="text-center text-xs text-gray-300 font-mono uppercase tracking-tight">
              ARE YOU SURE YOU WANT TO TRIGGER EMERGENCY LIQUIDATE EXIT? THIS WILL EXECUTE AN IMMEDIATE MARKET ORDER.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onExitPosition(position.symbol, "EMERGENCY_PANIC_EXIT")}
                disabled={isExiting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 rounded transition-all cursor-pointer text-center uppercase font-mono"
              >
                {isExiting ? "Exiting..." : "CONFIRM EMERGENCY KILL"}
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="bg-theme-input hover:bg-theme-border/30 text-gray-300 font-bold text-xs py-2 rounded transition-all cursor-pointer text-center uppercase font-mono"
              >
                ABORT LIQUIDATION
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
