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
  const winRate = totalTrades > 0 ? (profitableTrades.length / totalTrades) * 100 : 0;
  const totalProfitLossList = history.reduce((acc, t) => acc + t.pl, 0);

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

  return (
    <div className="bg-theme-panel border border-theme-border rounded p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-theme-border pb-4 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-theme-accent" />
            <h2 className="text-md font-bold text-white uppercase tracking-tight font-display">Closed Trades Journal</h2>
          </div>
          <p className="text-xs text-gray-400 font-mono">AUDITED OUTCOMES OF COMPLETED PORTFOLIO RUNS</p>
        </div>

        {/* Rapid summary statistics cards */}
        {totalTrades > 0 && (
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <div className="bg-theme-input px-2.5 py-1.5 rounded border border-theme-border uppercase">
              <span className="text-gray-500">Win Ratio: </span>
              <span className="text-emerald-400 font-bold">{winRate.toFixed(0)}%</span>
            </div>
            <div className="bg-theme-input px-2.5 py-1.5 rounded border border-theme-border uppercase">
              <span className="text-gray-500">Net Realized: </span>
              <span className={`font-bold ${totalProfitLossList >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {totalProfitLossList >= 0 ? "+" : ""}${totalProfitLossList.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-10 flex flex-col items-center justify-center text-gray-400 font-mono uppercase tracking-tight">
          <Calendar className="w-7 h-7 text-gray-700 mb-2.5 animate-pulse" />
          <h3 className="text-xs font-bold text-gray-400">Journal empty</h3>
          <p className="text-[10px] text-gray-500 mt-1 max-w-sm font-sans normal-case">
            Once positions are liquidated at resistance targets, analyst windows, or earnings dates, the transactions appear here.
          </p>
        </div>
      ) : (
        <div>
          {/* MOBILE VIEWS - Beautiful stack card layouts for touch screens */}
          <div className="block md:hidden space-y-4">
            {history.map((trade) => {
              const isPlProfit = trade.pl >= 0;
              const buyDate = new Date(trade.enteredAt).toLocaleDateString();
              const sellDate = new Date(trade.exitedAt).toLocaleDateString();

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

                  <div className="flex flex-col gap-3 border-t border-theme-border/40 pt-3 flex-wrap">
                    <div>
                      <span className="text-[8px] text-gray-500 block font-mono uppercase tracking-wider">Liquidation Trigger</span>
                      <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-tight block w-fit mt-1 ${getBadgeStyle(trade.exitReason)}`}>
                        {formatReason(trade.exitReason)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10.5px] font-mono">
                      <div>
                        <span className="text-[8px] text-gray-500 block uppercase tracking-wider">Duration</span>
                        <span className="text-gray-300 whitespace-nowrap">{buyDate} → {sellDate}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-500 block uppercase tracking-wider">Entry &rarr; Exit</span>
                        <span className="text-gray-300 whitespace-nowrap">${trade.entryPrice.toFixed(2)} → ${trade.exitPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP VIEW - Gorgeous, high-contrast, scroll-safe table */}
          <div className="hidden md:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs min-w-[750px]">
              <thead>
                <tr className="border-b border-theme-border text-gray-400 font-mono font-bold text-[9px] uppercase tracking-wider">
                  <th className="py-3 px-3 w-[22%] min-w-[150px]">Stock Asset Ticker</th>
                  <th className="py-3 px-3 w-[24%] min-w-[180px] text-center">Liquidation Trigger</th>
                  <th className="py-3 px-3 w-[22%] min-w-[160px] text-center">Duration (Buy &rarr; Sell)</th>
                  <th className="py-3 px-3 w-[18%] min-w-[150px] text-center">Cost Basis &rarr; Fill</th>
                  <th className="py-3 px-3 w-[14%] min-w-[110px] text-right">Net Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {history.map((trade) => {
                  const isPlProfit = trade.pl >= 0;
                  const buyDate = new Date(trade.enteredAt).toLocaleDateString();
                  const sellDate = new Date(trade.exitedAt).toLocaleDateString();

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

                      {/* Timeline dates info */}
                      <td className="py-3 px-3 text-center font-mono text-gray-400 text-[11px] whitespace-nowrap">
                        {buyDate} &rarr; {sellDate}
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
