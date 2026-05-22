import React from "react";
import { History, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ClosedTrade } from "../types";

interface PerformanceHistoryProps {
  history: ClosedTrade[];
}

export default function PerformanceHistory({ history }: PerformanceHistoryProps) {
  // Compute basic stats
  const totalTrades = history.length;
  const profitableTrades = history.filter((t) => t.pl > 0);
  const losingTrades = history.filter((t) => t.pl <= 0);
  
  const winRate = totalTrades > 0 ? (profitableTrades.length / totalTrades) * 100 : 0;
  const totalProfitLossList = history.reduce((acc, t) => acc + t.pl, 0);

  // Advanced P&L analytics
  const grossProfit = profitableTrades.reduce((acc, t) => acc + t.pl, 0);
  const grossLoss = losingTrades.reduce((acc, t) => acc + t.pl, 0);
  const averageProfitPct = totalTrades > 0 ? history.reduce((acc, t) => acc + t.plPct, 0) / totalTrades : 0;
  const averageProfitUsd = totalTrades > 0 ? totalProfitLossList / totalTrades : 0;
  
  // Find extreme trades
  const bestTrade = totalTrades > 0 ? [...history].sort((a, b) => b.pl - a.pl)[0] : null;
  const worstTrade = totalTrades > 0 ? [...history].sort((a, b) => a.pl - b.pl)[0] : null;

  const getBadgeStyle = (reason: string) => {
    const r = reason || "";
    if (r === "TECHNICAL_RESISTANCE_HIT" || r.includes("RESISTANCE")) {
      return "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20";
    }
    if (r === "EARNINGS_PRE_EXIT" || r.includes("EARNINGS")) {
      return "bg-indigo-950/40 text-indigo-400 border border-indigo-500/20";
    }
    if (r === "CATALYST_DAY_SELLING" || r.includes("CATALYST")) {
      return "bg-amber-950/40 text-amber-400 border border-amber-500/20";
    }
    if (r.includes("STOP_LOSS") || r.includes("EMERGENCY") || r.includes("PANIC") || r.includes("KILL")) {
      return "bg-rose-950/40 text-rose-400 border border-rose-500/20";
    }
    return "bg-theme-input text-gray-400 border border-theme-border";
  };

  const formatReason = (reason: string) => {
    if (!reason) return "N/A";
    return reason.replace(/_/g, " ");
  };

  const formatDateTime = (isoString: string) => {
    if (!isoString) return { date: "N/A", time: "" };
    const date = new Date(isoString);
    const dStr = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const tStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return { date: dStr, time: tStr };
  };

  return (
    <div className="bg-theme-panel border border-theme-border rounded p-6 shadow-xl space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-theme-border pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-theme-accent" />
            <h2 className="text-md font-bold text-white uppercase tracking-tight font-display">Closed Trades Journal</h2>
          </div>
          <p className="text-xs text-gray-400 font-mono">AUDITED OUTCOMES OF COMPLETED PORTFOLIO RUNS</p>
        </div>

        {totalTrades > 0 && (
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <div className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/20 uppercase font-bold">
              Wins: {profitableTrades.length}
            </div>
            <div className="bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded border border-rose-500/20 uppercase font-bold">
              Losses: {losingTrades.length}
            </div>
          </div>
        )}
      </div>

      {totalTrades > 0 && (
        <div className="bg-theme-input/20 border border-theme-border/60 rounded-lg p-5">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono mb-3.5 text-center sm:text-left">
            Profit &amp; Loss Performance Matrix
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Net Realized PL */}
            <div className="bg-theme-input/40 border border-theme-border/30 rounded p-3">
              <span className="text-[10px] text-gray-500 block uppercase font-mono tracking-wider">Net Realized P&amp;L</span>
              <span className={`text-lg font-black font-mono block mt-1 ${totalProfitLossList >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {totalProfitLossList >= 0 ? "+" : ""}${totalProfitLossList.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-gray-400 block mt-0.5 font-mono">
                Across {totalTrades} closed assets
              </span>
            </div>

            {/* Stat 2: Win Ratio */}
            <div className="bg-theme-input/40 border border-theme-border/30 rounded p-3">
              <span className="text-[10px] text-gray-500 block uppercase font-mono tracking-wider">Win Ratio &amp; Success</span>
              <span className="text-lg font-black font-mono text-white block mt-1">
                {winRate.toFixed(1)}%
              </span>
              <span className="text-[9px] text-gray-400 block mt-0.5 font-mono">
                {profitableTrades.length} W / {losingTrades.length} L
              </span>
            </div>

            {/* Stat 3: Gross Breakdown */}
            <div className="bg-theme-input/40 border border-theme-border/30 rounded p-3">
              <span className="text-[10px] text-gray-500 block uppercase font-mono tracking-wider">Gross Profit/Loss</span>
              <span className="text-xs font-mono font-bold block mt-1.5 text-emerald-400">
                Gross +: ${grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-mono font-bold block text-rose-400 mt-0.5">
                Gross -: ${grossLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Stat 4: Averages */}
            <div className="bg-theme-input/40 border border-theme-border/30 rounded p-3">
              <span className="text-[10px] text-gray-500 block uppercase font-mono tracking-wider">Average Trade Return</span>
              <span className={`text-lg font-black font-mono block mt-1 ${averageProfitUsd >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {averageProfitUsd >= 0 ? "+" : ""}${averageProfitUsd.toFixed(2)}
              </span>
              <span className={`text-[9px] block font-mono ${averageProfitPct >= 0 ? "text-emerald-500/80" : "text-rose-400/80"}`}>
                {averageProfitPct >= 0 ? "+" : ""}{averageProfitPct.toFixed(2)}% avg change
              </span>
            </div>
          </div>

          {/* Quick extremes showcase */}
          {(bestTrade || worstTrade) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-theme-border/30 text-[11px] font-mono">
              {bestTrade && (
                <div className="flex items-center justify-between text-gray-400">
                  <span className="uppercase text-[9px] text-gray-500">🏆 Top Performing Run</span>
                  <span className="text-emerald-400 font-bold uppercase">
                    {bestTrade.symbol}: +${bestTrade.pl.toFixed(2)} ({bestTrade.plPct.toFixed(2)}%)
                  </span>
                </div>
              )}
              {worstTrade && (
                <div className="flex items-center justify-between text-gray-400">
                  <span className="uppercase text-[9px] text-gray-500">⚠️ Underperforming Run</span>
                  <span className="text-rose-400 font-bold uppercase">
                    {worstTrade.symbol}: ${worstTrade.pl.toFixed(2)} ({worstTrade.plPct.toFixed(2)}%)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {history.length === 0 ? (
        <div className="text-center py-10 flex flex-col items-center justify-center text-gray-400 font-mono uppercase tracking-tight">
          <Calendar className="w-7 h-7 text-gray-700 mb-2.5 animate-pulse" />
          <h3 className="text-xs font-bold text-gray-400">Journal empty</h3>
          <p className="text-[10px] text-gray-500 mt-1 max-w-sm font-sans normal-case text-center">
            Once positions are liquidated at resistance targets, analyst windows, or earnings dates, the transactions appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
            Transaction Manifest
          </h3>

          {/* MOBILE VIEWS - Beautiful stack card layouts for touch screens */}
          <div className="block md:hidden space-y-4">
            {history.map((trade) => {
              const isPlProfit = trade.pl >= 0;
              const entryDT = formatDateTime(trade.enteredAt);
              const exitDT = formatDateTime(trade.exitedAt);

              return (
                <div key={trade.id} className="bg-theme-input/40 border border-theme-border rounded-lg p-4 space-y-4 hover:border-theme-border/80 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-mono text-sm font-bold text-white flex items-center flex-wrap gap-1">
                        <span>{trade.symbol}</span>
                        <span className="text-[10px] text-gray-400 font-normal font-sans">
                          &bull; {trade.qty} SHARES
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 truncate max-w-[180px] font-sans">
                        {trade.companyName}
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <div className={`font-mono text-xs font-bold flex items-center justify-end gap-0.5 ${isPlProfit ? "text-emerald-400" : "text-rose-400"}`}>
                        {isPlProfit ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        <span>{isPlProfit ? "+" : ""}{trade.plPct.toFixed(2)}%</span>
                      </div>
                      <div className={`font-mono text-[10px] ${isPlProfit ? "text-emerald-500/80" : "text-rose-400/80"}`}>
                        {isPlProfit ? "+" : ""}${trade.pl.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-theme-border/40 pt-3 flex-wrap text-xs">
                    <div>
                      <span className="text-[8px] text-gray-500 block font-mono uppercase tracking-wider">Liquidation Trigger</span>
                      <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-tight block w-fit mt-1 ${getBadgeStyle(trade.exitReason)}`}>
                        {formatReason(trade.exitReason)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="text-[8px] text-gray-500 block uppercase tracking-wider">Entry Buy Order</span>
                        <span className="text-gray-300 block font-bold">${trade.entryPrice.toFixed(2)}</span>
                        <span className="text-[9px] text-gray-400 block leading-tight">{entryDT.date}</span>
                        <span className="text-[8px] text-gray-500 block leading-none">{entryDT.time}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-500 block uppercase tracking-wider">Exit Sell Order</span>
                        <span className="text-gray-300 block font-bold">${trade.exitPrice.toFixed(2)}</span>
                        <span className="text-[9px] text-gray-400 block leading-tight">{exitDT.date}</span>
                        <span className="text-[8px] text-gray-500 block leading-none">{exitDT.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP VIEW - Gorgeous, high-contrast, scroll-safe table */}
          <div className="hidden md:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs min-w-[850px]">
              <thead>
                <tr className="border-b border-theme-border text-gray-400 font-mono font-bold text-[9px] uppercase tracking-wider">
                  <th className="py-3 px-3 w-[20%] min-w-[130px]">Stock Asset</th>
                  <th className="py-3 px-3 w-[18%] min-w-[140px] text-center">Liquidation Trigger</th>
                  <th className="py-3 px-3 w-[26%] min-w-[180px] text-center">Execution Log (Dates &amp; Times)</th>
                  <th className="py-3 px-3 w-[20%] min-w-[150px] text-center">Cost Basis &rarr; Fill</th>
                  <th className="py-3 px-3 w-[16%] min-w-[110px] text-right">Net Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {history.map((trade) => {
                  const isPlProfit = trade.pl >= 0;
                  const entryDT = formatDateTime(trade.enteredAt);
                  const exitDT = formatDateTime(trade.exitedAt);

                  return (
                    <tr key={trade.id} className="hover:bg-theme-input/20 transition-colors">
                      {/* Ticker name */}
                      <td className="py-3 px-3 font-mono font-bold text-white text-sm">
                        {trade.symbol}
                        <span className="text-[10px] text-gray-500 block font-sans font-normal">
                          {trade.companyName}
                        </span>
                      </td>

                      {/* Exit triggers reasons color highlights */}
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-tight inline-block ${getBadgeStyle(trade.exitReason)}`}>
                          {formatReason(trade.exitReason)}
                        </span>
                      </td>

                      {/* Timeline dates & times info */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] whitespace-nowrap text-gray-400">
                        <div className="flex justify-center items-center gap-4 text-left">
                          <div>
                            <span className="text-[8px] text-gray-500 uppercase block tracking-wider leading-none">BUY</span>
                            <span className="text-gray-300 font-semibold">{entryDT.date}</span>
                            <span className="text-[9px] text-gray-500 block leading-tight font-light">{entryDT.time}</span>
                          </div>
                          <span className="text-gray-600 font-bold font-sans">&rarr;</span>
                          <div>
                            <span className="text-[8px] text-gray-500 uppercase block tracking-wider leading-none">SELL</span>
                            <span className="text-gray-300 font-semibold">{exitDT.date}</span>
                            <span className="text-[9px] text-gray-500 block leading-tight font-light">{exitDT.time}</span>
                          </div>
                        </div>
                      </td>

                      {/* Entry cost / fill metrics */}
                      <td className="py-3 px-3 text-center font-mono text-gray-300">
                        <div className="whitespace-nowrap">
                          ${trade.entryPrice.toFixed(2)} &rarr; ${trade.exitPrice.toFixed(2)}
                        </div>
                        <span className="text-[9.5px] text-gray-400 block uppercase font-bold mt-0.5">
                          Qty: {trade.qty} ({trade.symbol.toUpperCase()})
                        </span>
                      </td>

                      {/* P&L dollars and percentage audits */}
                      <td className="py-3 px-3 text-right">
                        <div className={`font-mono font-black text-sm flex items-center justify-end gap-1 ${
                          isPlProfit ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {isPlProfit ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />}
                          <span>{isPlProfit ? "+" : ""}{trade.plPct.toFixed(2)}%</span>
                        </div>
                        <span className={`font-mono text-[10px] block mt-0.5 ${isPlProfit ? "text-emerald-500/80" : "text-rose-400/80"}`}>
                          {isPlProfit ? "+" : ""}${trade.pl.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
