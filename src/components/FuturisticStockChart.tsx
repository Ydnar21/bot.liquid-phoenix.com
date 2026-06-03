import React, { useState, useEffect, useRef } from "react";
import { TrendingUp, Zap, HelpCircle, Eye, EyeOff, Activity, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";

interface DataPoint {
  x: number;
  y: number;
  price: number;
  time: string;
  label?: string;
  isDip?: boolean;
}

export default function FuturisticStockChart() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showAnomalies, setShowAnomalies] = useState<boolean>(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0.8); // Holds simulated draw progress
  const [livePrice, setLivePrice] = useState<number>(1000.00);
  const [liveChange, setLiveChange] = useState<number>(12.45);
  const [activeTab, setActiveTab] = useState<"1D" | "1W" | "1M">("1M");

  // Highly-crafted clean line points: ascending with volatile, spiky highs and sharp dips
  const dataPoints: DataPoint[] = [
    { x: 0, y: 200, price: 1000, time: "09:30 AM", label: "Market Start" },
    { x: 45, y: 185, price: 2500, time: "09:42 AM" },
    { x: 80, y: 195, price: 1500, time: "09:55 AM", isDip: true },
    { x: 110, y: 160, price: 7000, time: "10:10 AM" },
    { x: 140, y: 175, price: 4500, time: "10:25 AM", isDip: true },
    { x: 190, y: 150, price: 11000, time: "10:50 AM" },
    { x: 230, y: 140, price: 13000, time: "11:10 AM" },
    { x: 260, y: 165, price: 8000, time: "11:25 AM", isDip: true },
    { x: 310, y: 130, price: 19000, time: "11:50 AM" },
    { x: 350, y: 120, price: 22000, time: "12:10 PM" },
    { x: 390, y: 145, price: 15000, time: "12:30 PM", isDip: true },
    { x: 440, y: 100, price: 30000, time: "01:00 PM" },
    { x: 480, y: 90, price: 34000, time: "01:20 PM" },
    { x: 520, y: 115, price: 25000, time: "01:40 PM", isDip: true },
    { x: 570, y: 70, price: 42000, time: "02:10 PM" },
    { x: 610, y: 60, price: 46000, time: "02:30 PM" },
    { x: 650, y: 80, price: 38000, time: "02:50 PM", isDip: true },
    { x: 700, y: 20, price: 60000, time: "03:15 PM", label: "Market Summit" }
  ];

  // Highly accelerated live fluctuating noise effect for a frantic, spiky futuristic stock asset vibe
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setLivePrice((prev) => {
        // High frequency volatile jumps
        const variance = (Math.random() - 0.45) * 50.0; 
        const nextPrice = prev + variance;
        const changePct = ((nextPrice - 1000.0) / 1000.0) * 100;
        setLiveChange(Math.round(changePct * 100) / 100);
        return Math.round(nextPrice * 100) / 100;
      });

      // Quick-draw progress indicator loop
      setProgress((prev) => {
        if (prev >= 1) return 0.05; // restart preview cycle loop
        return prev + 0.01; // Slower speed
      });
    }, 300); // Speed up tick response to 60ms for vibrant continuous update

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Construct STRAIGHT vector paths for spiky, high-speed movement without bezier smoothing
  const generateSvgPath = (points: DataPoint[], maxIndex: number) => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i <= maxIndex; i++) {
      const p1 = points[i];
      d += ` L ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const visibleCount = Math.max(1, Math.min(dataPoints.length, Math.ceil(progress * dataPoints.length)));
  const visiblePoints = dataPoints.slice(0, visibleCount);
  const mainPath = generateSvgPath(dataPoints, visibleCount - 1);

  // Generate fill under path
  const fillPath = mainPath 
    ? `${mainPath} L ${dataPoints[visibleCount - 1].x} 220 L 0 220 Z`
    : "";

  const activePoint = hoverIndex !== null ? dataPoints[hoverIndex] : dataPoints[visibleCount - 1];

  return (
    <div className="bg-theme-panel/80 border border-theme-border/80 rounded-xl p-5 sm:p-6 shadow-2xl space-y-5 antialiased flex flex-col justify-between">
      
      {/* Header Panel */}
      <div className="flex justify-between items-start border-b border-theme-border/60 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-black font-mono uppercase tracking-widest text-white flex items-center gap-1">
              Interactive Market Sentry Simulator <Sparkles className="w-3 h-3 text-emerald-400 inline" />
            </span>
          </div>
          <p className="text-[9px] text-gray-400 font-mono">MODELING SECURE SWING CRITERIA ACROSS MULTIPLE VOLATILITY DIPS</p>
        </div>
        
        <div className="flex items-center gap-1.5 bg-black/40 border border-theme-border p-1 rounded-lg">
          {(["1D", "1W", "1M"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 text-[9px] font-bold font-mono rounded transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-emerald-500 text-black font-black"
                  : "text-gray-500 hover:text-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Futuristic HUD Statistics - Green theme */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-theme-input/50 border border-theme-border/40 rounded-lg p-2.5 text-center">
          <p className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">Dynamic Market Index</p>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <span className="text-sm font-bold text-white font-mono">${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <span className="text-[9px] font-mono font-bold text-emerald-400 flex items-center justify-center gap-0.5">
            <ArrowUpRight className="w-3 h-3 inline animate-bounce" /> +{liveChange}%
          </span>
        </div>

        <div className="bg-theme-input/50 border border-theme-border/40 rounded-lg p-2.5 text-center">
          <p className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">S-A Entry Confidence</p>
          <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">97.8%</p>
          <span className="text-[9px] font-mono text-gray-400">HIGH CONFORMITY</span>
        </div>

        <div className="bg-theme-input/50 border border-theme-border/40 rounded-lg p-2.5 text-center">
          <p className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">Simulated Sentry Status</p>
          <p className="text-sm font-bold text-white font-mono mt-0.5 flex items-center justify-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0 inline animate-pulse" /> SCANNING
          </p>
          <span className="text-[9px] font-mono text-emerald-400">OPTIMIZED DIP SEEKER</span>
        </div>
      </div>

      {/* Chart Canvas/SVG Grid Area */}
      <div className="relative bg-black/50 border border-theme-border rounded-xl p-2 h-[240px] flex flex-col justify-between overflow-hidden group">
        
        {/* Futurist HUD Scanlines and Watermark Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Flowing Grid Scan Light Overlay */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400/20 animate-bounce pointer-events-none" style={{ animationDuration: '4s' }} />

        {/* Floating details overlay on hover */}
        {activePoint && (
          <div className="absolute top-3 left-3 z-10 bg-black/85 backdrop-blur-md border border-theme-border p-3 rounded-lg font-mono text-[9px] tracking-wide space-y-1 text-gray-300 pointer-events-none max-w-[240px] shadow-2xl animate-fade-in inline-block">
            <div className="flex justify-between items-center gap-2 border-b border-theme-border/60 pb-1">
              <span className="text-white font-bold">{activePoint.time}</span>
              <span className={`px-1 rounded-sm text-[8px] font-bold ${activePoint.isDip ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                {activePoint.isDip ? 'S-A DIP ENTRY' : 'ALIGNMENT OK'}
              </span>
            </div>
            <div>Simulated Quote: <span className="text-white font-bold">${activePoint.price.toFixed(2)}</span></div>
            {activePoint.label && (
              <div className="pt-1 text-gray-400 italic">
                Trigger: <span className="text-emerald-400 not-italic font-bold">{activePoint.label}</span>
              </div>
            )}
          </div>
        )}

        {/* Primary Chart Canvas */}
        <svg 
          viewBox="0 0 700 220" 
          className="w-full h-full overflow-visible mt-2"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Neon Glow Filters */}
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Reference Grid lines */}
          <line x1="0" y1="50" x2="700" y2="50" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="0" y1="110" x2="700" y2="110" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="0" y1="170" x2="700" y2="170" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="4,4" />

          {/* Fill under the trend path */}
          {fillPath && (
            <path d={fillPath} fill="url(#chartGradient)" className="transition-all duration-300" />
          )}

          {/* Main Stock Trend Path (Green and Spiky) */}
          {mainPath && (
            <path
              d={mainPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              className="transition-all duration-300"
              filter="url(#glow)"
            />
          )}

          {/* Plotting points - showcasing the dips and breakout checkpoints */}
          {dataPoints.map((pt, idx) => {
            if (idx >= visibleCount) return null;
            const isLatest = idx === visibleCount - 1;
            const isHovered = hoverIndex === idx;

            // highlight standard dips with pulsing golden nodes & breakouts with standard emerald rings
            return (
              <g key={idx}>
                {/* Micro-interactive hover detection areas */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="14"
                  fill="transparent"
                  className="cursor-crosshair pointer-events-auto"
                  onMouseEnter={() => setHoverIndex(idx)}
                />

                {pt.isDip && showAnomalies && (
                  <g>
                    {/* Ring aura for dip highlight */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="7.5"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="1.2"
                      className="animate-ping"
                      style={{ animationDuration: '3s' }}
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="#fbbf24"
                      className="cursor-crosshair"
                    />
                  </g>
                )}

                {/* Draw dynamic highlight for point currently being highlighted or main latest marker */}
                {(isHovered || (isLatest && hoverIndex === null)) && (
                  <g>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="10"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      className="animate-pulse"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill="#ffffff"
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Visual Labels embedded directly inside the clean chart canvas */}
        <div className="absolute bottom-2.5 right-3 text-[9px] text-gray-500 font-mono flex gap-3 select-none">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span>Market Summit Trend</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            <span>Optimal Pullback Dip Entries</span>
          </div>
        </div>
      </div>

      {/* Realistic Simulator Player / Parameter Panel Controls */}
      <div className="flex justify-between items-center bg-theme-input p-3.5 rounded-lg border border-theme-border/60">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAnomalies(!showAnomalies)}
            className={`text-[10px] font-mono font-bold px-3 py-1 rounded transition-colors flex items-center gap-1.5 uppercase ${
              showAnomalies 
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" 
                : "bg-theme-input text-gray-500 border border-theme-border"
            }`}
          >
            {showAnomalies ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Highlight Entry Dips</span>
          </button>
        </div>

        <div className="hidden sm:flex flex-col items-end text-right font-sans">
          <span className="text-[10px] text-white font-bold font-mono">LIVE CLOUD SIMULATOR FEED</span>
          <span className="text-[9px] text-gray-500">Auto-looping at 60ms rendering cycles</span>
        </div>
      </div>
    </div>
  );
}
