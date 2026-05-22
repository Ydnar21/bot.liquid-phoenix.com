import React from "react";
import { Calendar, AlertCircle, Coins, Flame, Info, Sparkles, Clock, Globe } from "lucide-react";
import { StoredEvent } from "../types";

interface CalendarPanelProps {
  events?: StoredEvent[];
}

export default function CalendarPanel({ events = [] }: CalendarPanelProps) {
  // Sort events by date ascending
  const sortedEvents = [...events].sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T12:00:00");
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const getDaysRemaining = (dateStr: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(dateStr + "T12:00:00");
      target.setHours(0, 0, 0, 0);
      
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return { label: "TODAY", isCritical: true };
      if (diffDays === 1) return { label: "TOMORROW", isCritical: true };
      if (diffDays < 0) return { label: "PASSED", isCritical: false };
      return { label: `IN ${diffDays} DAYS`, isCritical: diffDays <= 2 };
    } catch {
      return { label: dateStr, isCritical: false };
    }
  };

  const getBadgeStyles = (source: string) => {
    switch (source) {
      case "FOMC":
        return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      case "CPI":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "EARNINGS":
        return "bg-sky-500/10 border-sky-500/20 text-sky-400";
      case "CATALYST":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      default:
        return "bg-slate-500/10 border-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="bg-theme-panel border border-theme-border rounded p-6 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-theme-border pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-theme-accent" />
          <h2 className="text-md font-bold text-white uppercase tracking-tight font-display">Upcoming Events Calendar</h2>
        </div>
        <span className="text-[9px] font-mono bg-theme-input border border-theme-border px-2.5 py-1 rounded text-gray-400 uppercase font-bold">
          Active Events: {sortedEvents.length}
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-4 leading-relaxed font-sans">
        AI-synchronized market-moving catalyst dates and report releases tracked by Gemini. Risk parameters are evaluated dynamically against this schedule.
      </p>

      {sortedEvents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
          <Clock className="w-8 h-8 text-gray-600 mb-2 animate-pulse" />
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">No Scheduled Events</h4>
          <p className="text-[11px] text-gray-500 max-w-xs mt-1 font-sans">
            Events populate automatically when the screening scanner triggers or when active trades are deployed.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[360px] custom-scrollbar">
          {sortedEvents.map((item) => {
            const countdown = getDaysRemaining(item.eventDate);
            return (
              <div 
                key={item.id} 
                className="bg-theme-input/40 border border-theme-border hover:border-theme-border-hover rounded p-3 transition-colors flex items-start gap-3"
              >
                <div className={`p-2 rounded border font-mono text-center min-w-[54px] ${getBadgeStyles(item.source)}`}>
                  <div className="text-[8px] font-black tracking-widest uppercase">{item.source}</div>
                  <div className="text-xs font-black mt-1">{item.symbol || "GLOB"}</div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-tight break-words whitespace-normal leading-snug">
                      {item.eventName}
                    </span>
                    <span className={`text-[9px] font-mono font-bold whitespace-nowrap px-1.5 py-0.5 rounded border self-start ${
                      countdown.isCritical 
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse" 
                        : "bg-slate-500/10 border-slate-500/20 text-slate-300"
                    }`}>
                      {countdown.label}
                    </span>
                  </div>

                  <p className="text-[10px] text-gray-400 mt-1.5 break-words whitespace-normal font-mono leading-relaxed">
                    {item.details || "Discovered by Gemini AI News Sentry"}
                  </p>

                  <div className="flex items-center gap-1.5 mt-2 text-[9px] text-gray-500 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>Report Scheduled: {formatDate(item.eventDate)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
