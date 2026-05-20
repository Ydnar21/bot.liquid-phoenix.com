export interface BotConfig {
  ALPACA_API_KEY: string;
  ALPACA_SECRET_KEY: string;
  ALPACA_BASE_URL: string;
  GEMINI_API_KEY: string;
  NEWSAPI_KEY: string;
  isPaper: boolean;
  isBotRunning: boolean;
  scanIntervalMinutes: number;
}

export interface StockSetup {
  symbol: string;
  companyName: string;
  price: number;
  rsi: number;
  sma50: number;
  sma200: number;
  pe: number;
  revenueGrowth: number;
  grossMargin: number;
  netMargin: number;
  debtToEquity: number;
  fcfPositive: boolean;
  marketCapBillion: number;
  reason: string;
  volumeTrendRatio: number;
  entryVolumeRatio: number;
  supportLevel: number;
  targetPrice: number;
  sentimentScore: number; // -1 to +1
  sentimentReason: string;
  blockersFound: string[];
  catalystEvent: string;
  catalystDate: string;
  relativeStrengthRatio: number; // vs SPY
}

export interface ActivePosition {
  symbol: string;
  companyName: string;
  qty: number;
  entryPrice: number;
  currentPrice: number;
  entryValue: number;
  currentValue: number;
  unrealizedPl: number;
  unrealizedPlPct: number;
  supportLevel: number;
  targetPrice: number;
  catalystDate: string;
  catalystEvent: string;
  earningsDate: string;
  status: 'NORMAL' | 'REVIEW' | 'WARNING';
  reviewReason?: string;
  aiCommentary?: string;
  enteredAt: string;
}

export interface ClosedTrade {
  id: string;
  symbol: string;
  companyName: string;
  entryPrice: number;
  exitPrice: number;
  qty: number;
  pl: number;
  plPct: number;
  enteredAt: string;
  exitedAt: string;
  exitReason: string;
}

export interface BotLog {
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
}

export interface BotState {
  isActive: boolean;
  lastScanTime: string | null;
  nextScanTime: string | null;
  marketRegime: string; // 'NORMAL', 'STRICT_VOLUME', 'STANDBY'
  spySma50: number;
  spySma200: number;
  spyPrice: number;
  fomcBlackout: boolean;
  fomcDetails?: string;
  isMarketOpen?: boolean;
}
