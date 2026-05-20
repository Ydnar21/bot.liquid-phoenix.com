import React from "react";
import { History, TrendingUp, Calendar, ArrowRightLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";
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

  return (
    <div className="bg-theme-panel border border-theme-border rounded p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-theme-border pb-4 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-theme-accent" />
            <h2 className="text-md font-bold text-white uppercase tracking-tight font-display">Closed Trades Journal</h2>
          </div>
          <p className="text-xs text-gray-450 font-mono">AUDITED OUTCOMES OF COMPLETED PORTFOLIO RUNS</p>
        </div>

        {/* Rapid summary statistics cards */}
        {totalTrades > 0 && (
          <div className="flex items-center gap-4 text-[10px] font-mono">
            <div className="bg-theme-input px-2.5 py-1 rounded border border-theme-border uppercase">
              <span className="text-gray-500">Win Ratio: </span>
              <span className="text-emerald-400 font-bold">{winRate.toFixed(0)}%</span>
            </div>
            <div className="bg-theme-input px-2.5 py-1 rounded border border-theme-border uppercase">
              <span className="text-gray-500">Net Realized: </span>
              <span className={`font-bold ${totalProfitLossList >= 0 ? "text-emerald-400" : "text-rose-450"}`}>
                {totalProfitLossList >= 0 ? "+" : ""}${totalProfitLossList.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-10 flex flex-col items-center justify-center text-gray-550 font-mono uppercase tracking-tight">
          <Calendar className="w-7 h-7 text-gray-700 mb-2.5 animate-pulse" />
          <h3 className="text-xs font-bold text-gray-400">Journal empty</h3>
          <p className="text-[10px] text-gray-500 mt-1 max-w-sm font-sans normal-case">
            Once positions are liquidated at resistance targets, analyst windows, or earnings dates, the transactions appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-theme-border text-gray-500 font-mono font-bold text-[9px] uppercase tracking-wider">
                <th className="py-2">Stock Asset Ticker</th>
                <th className="py-2 text-center">Liquidation Trigger</th>
                <th className="py-2 text-center">Duration (Buy &rarr; Sell)</th>
                <th className="py-2 text-center">Cost Basis &rarr; Fill</th>
                <th className="py-2 text-right">Net Return</th>
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
                    <td className="py-3 font-mono font-bold text-white text-sm">
                      {trade.symbol}
                      <span className="text-[10px] text-gray-500 block font-sans font-normal">
                        {trade.companyName}
                      </span>
                    </td>

                    {/* Exit triggers reasons color highlights */}
                    <td className="py-3 text-center">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-tight ${
                        trade.exitReason === "TECHNICAL_RESISTANCE_HIT" || trade.exitReason?.includes("RESISTANCE")
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                          : trade.exitReason === "EARNINGS_PRE_EXIT" || trade.exitReason?.includes("EARNINGS")
                          ? "bg-indigo-950/40 text-indigo-400 border border-indigo-500/20"
                          : trade.exitReason === "CATALYST_DAY_SELLING" || trade.exitReason?.includes("CATALYST")
                          ? "bg-amber-950/40 text-amber-400 border border-amber-500/20"
                          : "bg-theme-input text-gray-450 border border-theme-border"
                      }`}>
                        {trade.exitReason}
                      </span>
                    </td>

                    {/* Timeline dates info */}
                    <td className="py-3 text-center font-mono text-gray-400 text-[10.5px]">
                      {buyDate} &rarr; {sellDate}
                    </td>

                    {/* Entry cost / fill metrics */}
                    <td className="py-3 text-center font-mono text-gray-300">
                      ${trade.entryPrice.toFixed(2)} &rarr; ${trade.exitPrice.toFixed(2)}
                      <span className="text-[9.5px] text-gray-550 block uppercase text-center font-bold">
                        Qty: {trade.qty} ({trade.symbol.toUpperCase()})
                      </span>
                    </td>

                    {/* P&L dollars and percentage audits */}
                    <td className="py-3 text-right">
                      <div className={`font-mono font-black text-sm flex items-center justify-end gap-1 ${
                        isPlProfit ? "text-emerald-400" : "text-rose-450"
                      }`}>
                        {isPlProfit ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-450" />}
                        <span>{isPlProfit ? "+" : ""}{trade.plPct.toFixed(2)}%</span>
                      </div>
                      <span className={`font-mono text-[10px] ${isPlProfit ? "text-emerald-500/80" : "text-rose-450/80"}`}>
                        {isPlProfit ? "+" : ""}${trade.pl.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
