import React from "react";
import { Play, Pause, Activity, TrendingUp, AlertTriangle, Cpu } from "lucide-react";
import { BotState, BotConfig } from "../types";

interface HeaderProps {
  botState: BotState;
  botConfig: BotConfig;
  onToggleBot: () => void;
  onTriggerScan: () => void;
  isScanning: boolean;
  currentUser: any;
  username?: string;
  onOpenUsernameSetup?: () => void;
  onSignOut: () => void;
  alpacaAccount?: any;
}

export default function Header({
  botState,
  botConfig,
  onToggleBot,
  onTriggerScan,
  isScanning,
  currentUser,
  username,
  onOpenUsernameSetup,
  onSignOut,
  alpacaAccount,
}: HeaderProps) {
  const isAnyActive = botConfig.isConnectionActive;

  return (
    <header className="border-b border-theme-border bg-theme-panel sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Brand identity - High Density Style */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-theme-accent rounded flex items-center justify-center font-bold text-black text-base shrink-0">
            S-A
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight uppercase text-white flex items-center gap-2">
              Liquid Phoenix Swing Trading Portal <span className="text-theme-accent text-[9px] border border-theme-accent px-1.5 py-0.5 rounded font-mono">v1.0.4</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Autonomous Market Agent</p>
          </div>
        </div>

        {/* State details */}
        <div className="flex flex-wrap items-center justify-start lg:justify-end gap-3 w-full lg:w-auto">
          {/* Market Regime */}
          {isAnyActive && (
            <div className="flex items-center gap-2 bg-theme-input border border-theme-border px-3 py-1.5 rounded text-xs font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-gray-500 uppercase font-black text-[10px]">Regime:</span>
              <span className={`font-mono font-bold ${
                botState.marketRegime === "NORMAL" 
                  ? "text-emerald-400" 
                  : botState.marketRegime === "STRICT_VOLUME" 
                  ? "text-amber-400" 
                  : "text-rose-400"
              }`}>
                {botState.marketRegime}
              </span>
              {botState.spyPrice > 0 && (
                <span className="text-gray-400">
                  (SPY ${botState.spyPrice.toFixed(1)})
                </span>
              )}
            </div>
          )}

          {/* FOMC/CPI Status */}
          {isAnyActive && (
            botState.fomcBlackout ? (
              <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded text-[10px] text-rose-400 font-bold font-mono uppercase">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>BLACKOUT ACTIVATED</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-theme-input border border-theme-border px-3 py-1.5 rounded text-[10px] text-emerald-400 font-bold font-mono">
                <span>● NO BLACKOUT DETECTED</span>
              </div>
            )
          )}

          {/* Market Session Status Badge */}
          {isAnyActive && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded border text-[10px] font-mono font-bold ${
              botState.isMarketOpen 
                ? "bg-indigo-500/15 border-indigo-500/35 text-indigo-400" 
                : "bg-amber-500/15 border-amber-500/35 text-amber-400"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${botState.isMarketOpen ? "bg-indigo-400 animate-pulse" : "bg-amber-500"}`} />
              <span>{botState.isMarketOpen ? "MARKET HOURS" : "MARKET CLOSED"}</span>
            </div>
          )}

          {/* Cloud State Preservation Status Badge */}
          {botConfig.isBotRunning && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-purple-500/35 bg-purple-500/10 text-purple-400 text-[10px] font-mono font-bold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>24/7 CLOUD SYNCED</span>
            </div>
          )}

          {/* Active / Offline Status Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded border text-[10px] font-mono font-bold ${
            isAnyActive 
              ? (alpacaAccount && (alpacaAccount.status === "connected" || alpacaAccount.status === "success")
                ? (botConfig.isBotRunning && !botState.isMarketOpen
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                  : alpacaAccount.broker === "ROBINHOOD"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-[#00c805]"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                )
                : "bg-amber-500/10 border-amber-500/30 text-amber-500")
              : "bg-theme-input border-theme-border text-gray-500"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isAnyActive 
                ? (alpacaAccount && (alpacaAccount.status === "connected" || alpacaAccount.status === "success")
                  ? (botConfig.isBotRunning && !botState.isMarketOpen
                    ? "bg-amber-500 animate-pulse"
                    : alpacaAccount.broker === "ROBINHOOD"
                    ? "bg-[#00c805] animate-pulse"
                    : "bg-emerald-400 animate-pulse")
                  : "bg-amber-500 animate-pulse")
                : "bg-white/20"
            }`} />
            <span>
              {!botConfig.isConnectionActive
                ? "● DISCONNECTED"
                : botConfig.isBotRunning
                ? (botState.isMarketOpen 
                  ? (alpacaAccount?.broker === "ROBINHOOD" ? "● ROBINHOOD ACTIVE (SWING BOT ACTIVE)" : "● ALPACA CONNECTED (SWING BOT ACTIVE)")
                  : (alpacaAccount?.broker === "ROBINHOOD" ? "● ROBINHOOD ACTIVE (BOT SLEEPING)" : "● ALPACA CONNECTED (BOT SLEEPING)")
                )
                : (alpacaAccount && (alpacaAccount.status === "connected" || alpacaAccount.status === "success")
                  ? (alpacaAccount.broker === "ROBINHOOD" ? "● ROBINHOOD ACTIVE" : "● ALPACA CONNECTED") 
                  : alpacaAccount?.broker === "ROBINHOOD" ? "● ROBINHOOD STANDBY" : "● ALPACA STANDBY")
              }
            </span>
          </div>

          {/* Live Alpaca Account Balance & Cash Badges */}
          {isAnyActive && alpacaAccount && (alpacaAccount.status === "connected" || alpacaAccount.status === "success") && (
            <div className={`flex items-center gap-1.5 bg-theme-input border ${alpacaAccount.broker === "ROBINHOOD" ? "border-emerald-500/30" : "border-theme-accent/50"} px-3 py-1.5 rounded text-[10px] font-mono`}>
              <span className="text-gray-400 uppercase font-black">
                {alpacaAccount.broker === "ROBINHOOD" ? "MCP PORT BAL:" : alpacaAccount.isPaper ? "PAPER BAL:" : "LIVE BAL:"}
              </span>
              <span className={`font-black ${alpacaAccount.broker === "ROBINHOOD" ? "text-[#00c805]" : "text-theme-accent"}`}>
                ${alpacaAccount.equity?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-400 uppercase font-black">BUYING POWER:</span>
              <span className="text-white font-bold">
                ${alpacaAccount.buying_power?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {isAnyActive && alpacaAccount && alpacaAccount.status === "error" && (
            <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded text-[10px] text-rose-400 font-bold font-mono uppercase">
              <span>{alpacaAccount.broker === "ROBINHOOD" ? "Robinhood MCP Revoked" : "Alpaca Access Revoked"}</span>
            </div>
          )}

          {isAnyActive && (!alpacaAccount || alpacaAccount.status === "unconfigured" || alpacaAccount.status === "bot_paused") && (
            <div className="flex items-center gap-1.5 bg-theme-input border border-theme-border px-3 py-1.5 rounded text-[10px] text-amber-500 font-bold font-mono uppercase">
              <span>CONNECTING...</span>
            </div>
          )}



          <button
            onClick={onToggleBot}
            disabled={!botConfig.isConnectionActive}
            className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded shadow-sm transition-all duration-150 border cursor-pointer ${
              !botConfig.isConnectionActive
                ? "opacity-40 cursor-not-allowed bg-theme-input border-theme-border text-gray-500"
                : botConfig.isBotRunning
                ? "bg-amber-600 text-white border-amber-500 hover:bg-amber-700"
                : "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700"
            }`}
          >
            {botConfig.isBotRunning ? (
              <>
                <Cpu className="w-3.5 h-3.5 animate-spin" />
                <span>Pause Swing Bot</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5" />
                <span>Start Swing Bot</span>
              </>
            )}
          </button>

          <button
            onClick={onTriggerScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded bg-theme-input hover:bg-theme-border/30 border border-theme-border text-gray-300 disabled:opacity-50 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
          >
            <Activity className={`w-3.5 h-3.5 ${isScanning ? "animate-spin text-theme-accent" : ""}`} />
            <span>{isScanning ? "Scanning..." : "Scan Markets Now"}</span>
          </button>

          {currentUser && (
            <div className="flex items-center gap-3 pl-3 border-l border-theme-border bg-theme-panel pt-1 lg:pt-0">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full border border-theme-accent"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-theme-border flex items-center justify-center font-mono text-[9px] text-gray-400">
                  {currentUser.email?.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="text-left leading-tight">
                <button
                  type="button"
                  onClick={onOpenUsernameSetup}
                  className="text-gray-100 font-mono text-[10px] font-bold max-w-[140px] truncate hover:text-theme-accent transition-colors flex items-center gap-1.5 cursor-pointer text-left focus:outline-none"
                  title="Change Username / User ID"
                >
                  <span>@{username || "no_username"}</span>
                  <span className="text-[8px] text-theme-accent font-black border border-theme-accent/20 px-1 py-0.2 rounded font-sans uppercase">edit</span>
                </button>
                <button
                  onClick={onSignOut}
                  className="text-rose-400 hover:text-rose-300 transition-colors font-mono font-bold text-[9px] uppercase cursor-pointer block hover:underline mt-0.5 text-left"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
