import React from "react";
import { Terminal, Trash2, ShieldAlert } from "lucide-react";
import { BotLog } from "../types";

interface LogsConsoleProps {
  logs: BotLog[];
  onClearLogs: () => void;
}

export default function LogsConsole({ logs, onClearLogs }: LogsConsoleProps) {
  return (
    <div className="bg-theme-panel border border-theme-border rounded p-5 shadow-2xl flex flex-col h-[350px]">
      <div className="flex items-center justify-between border-b border-theme-border pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-theme-accent" />
          <h2 className="text-[10px] font-black text-white uppercase tracking-widest font-mono">
            TACTICAL BOT LOG
          </h2>
        </div>
        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-theme-input rounded cursor-pointer"
            title="Clear Tactical Bot Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 space-y-1.5 font-mono uppercase tracking-tight">
          <ShieldAlert className="w-6 h-6 animate-pulse text-gray-700" />
          <span className="text-xs">Console memory buffer empty.</span>
          <span className="text-[10px] text-gray-600">Awaiting scheduling triggers or portfolio deployments...</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[10.5px] leading-relaxed select-text custom-scrollbar">
          {logs.map((log, idx) => {
            const levelColors = {
              SUCCESS: "text-emerald-400 font-medium",
              INFO: "text-gray-400",
              WARNING: "text-amber-400 font-bold",
              ERROR: "text-rose-500 font-bold animate-pulse",
            };

            const stamp = new Date(log.timestamp).toLocaleTimeString();

            return (
              <div key={idx} className="flex items-start gap-2.5">
                <span className="text-gray-600 shrink-0 select-none">[{stamp}]</span>
                <span className={`${levelColors[log.level]} break-all`}>
                  {log.message}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
