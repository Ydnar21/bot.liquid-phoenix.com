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
      <div className="bg-theme-panel border border-theme-border rounded p-8 text-center flex flex-col items-center justify-center h-full min-h-[250px]">
        <Activity className="w-8 h-8 text-theme-accent mb-3 animate-pulse" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">No Active Position Deployed</h3>
        <p className="text-xs text-gray-450 mt-1 max-w-sm font-sans">
          The autonomous market agent is in hunt mode. Once a high-probability pullback setup matches all technical and Gemini sentiment filters, it will reflect here.
        </p>
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
    <div className="bg-theme-active-panel border border-theme-accent rounded p-6 shadow-xl h-full flex flex-col justify-between relative overflow-hidden">
      {/* Decorative vertical color accent indicator */}
      <div className="absolute top-0 left-0 w-1 h-full bg-theme-accent" />

      <div className="pl-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-theme-border pb-4 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white tracking-tight font-mono">{position.symbol}</span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-400">{position.companyName}</span>
              <span className="text-[10px] text-theme-accent font-mono font-bold uppercase tracking-wider">Active Portfolio Trade</span>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xl font-bold font-mono ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
              {isProfit ? "+" : ""}{plPct.toFixed(2)}%
            </div>
            <div className={`text-xs font-mono font-semibold ${isProfit ? "text-emerald-500" : "text-rose-500"}`}>
              {isProfit ? "+" : ""}${position.unrealizedPl.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Trade Details Cards - Grid style */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-mono text-xs">
          <div className="bg-theme-input border border-theme-border p-3 rounded">
            <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider">Qty Size</span>
            <span className="font-bold text-white">{position.qty} SHARES</span>
          </div>
          <div className="bg-theme-input border border-theme-border p-3 rounded">
            <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider">Entry basis</span>
            <span className="font-bold text-white">${position.entryPrice.toFixed(2)}</span>
          </div>
          <div className="bg-theme-input border border-theme-border p-3 rounded">
            <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider">Market Price</span>
            <span className="font-bold text-emerald-400 animate-pulse">${position.currentPrice.toFixed(2)}</span>
          </div>
          <div className="bg-theme-input border border-theme-border p-3 rounded">
            <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider">Current Value</span>
            <span className="font-bold text-white">${position.currentValue.toFixed(2)}</span>
          </div>
        </div>

        {/* Dynamic target tracking progress bar */}
        <div className="my-6 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-rose-400 font-semibold flex items-center gap-1">
              Support Line: ${position.supportLevel.toFixed(2)}
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              Target Peak: ${position.targetPrice.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-3 bg-black/60 border border-theme-border rounded overflow-hidden relative">
            <div
              className={`h-full tracking-wide rounded-r transition-all duration-500 bg-theme-accent`}
              style={{ width: `${progressPercent}%` }}
            />
            <div className="absolute top-0 bottom-0 w-0.5 bg-white/75" style={{ left: `${progressPercent}%` }} />
          </div>
          <div className="text-[10px] text-gray-500 text-center uppercase font-mono tracking-wider">
            S-A Sentry Progress: {progressPercent.toFixed(0)}% to Resistance Target Area
          </div>
        </div>

        {/* Critical Rule Schedules */}
        <div className="space-y-2 border-t border-theme-border pt-4 text-xs font-mono">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 uppercase">Pre-Earnings Sell Day:</span>
            <span className="text-gray-300">{position.earningsDate || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 uppercase">Estimated Catalyst Event:</span>
            <span className="text-theme-accent max-w-[200px] truncate text-right font-bold uppercase">
              {position.catalystEvent}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 uppercase">Catalyst Date Deadline:</span>
            <span className="text-gray-300">{position.catalystDate || "N/A"}</span>
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
              <p className="text-[11px] text-gray-300 leading-relaxed font-sans italic">
                "{position.aiCommentary}"
              </p>
            ) : (
              <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                Reviewing news wires for Taiwanese tensions, regulatory blocks, or management turnover alerts...
              </p>
            )}
            <div className="text-[10px] text-rose-350 bg-black/40 p-2 rounded border border-rose-500/10 uppercase font-mono text-center">
              Recommends: <span className="text-rose-400 font-bold">{position.aiCommentary?.includes("SELL") ? "SELL EXIT" : "HOLD TRACKING"}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pl-2">
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
