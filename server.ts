import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import {
  loadStateFromDisk,
  startFirestoreStateListener,
  getBotConfig,
  updateBotConfig,
  getBotState,
  getActivePosition,
  getClosedTrades,
  getBotLogs,
  getScannedSetups,
  scanForSetups,
  deployPortfolio,
  executeExit,
  clearLogs,
  restartCronEngine,
  addLog,
  getUserAccount,
  ensureUserCredentialsLoaded,
  syncActivePositionWithLiveTrades,
  generateAIOfferings,
  registerAndVerifyUsername,
  getRegisteredUsername,
  getLeaderboardRankings,
} from "./src/server_bot.js";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middleware
  app.use(express.json());

  // Auto-sync user credentials to memory whenever a request includes userId
  app.use(async (req, res, next) => {
    const userId = (req.query.userId || req.body?.userId) as string;
    if (userId) {
      try {
        await ensureUserCredentialsLoaded(userId);
      } catch (err: any) {
        console.warn(`[CREDENTIALS MIDDLEWARE] Auto-sync credentials failed for ${userId}:`, err.message);
      }
    }
    next();
  });

  // Bootstrap data on start
  await loadStateFromDisk();
  startFirestoreStateListener();
  restartCronEngine();

  addLog("INFO", "FastAPI-to-Node core port completed. Server state bootstrapped.");

  // API 1: Fetch config (Obfuscating secrets to client)
  app.get("/api/config", (req, res) => {
    const userId = req.query.userId as string | undefined;
    const config = getBotConfig(userId);
    const cleanConfig = {
      ...config,
      ALPACA_API_KEY: config.ALPACA_API_KEY
        ? `*${config.ALPACA_API_KEY.slice(-5)}`
        : "",
      ALPACA_SECRET_KEY: config.ALPACA_SECRET_KEY
        ? `*${config.ALPACA_SECRET_KEY.slice(-5)}`
        : "",
      GEMINI_API_KEY: config.GEMINI_API_KEY
        ? `*${config.GEMINI_API_KEY.slice(-5)}`
        : "",
      NEWSAPI_KEY: config.NEWSAPI_KEY ? `*${config.NEWSAPI_KEY.slice(-5)}` : "",
    };
    res.json(cleanConfig);
  });

  // API 2: Update configuration
  app.post("/api/config", async (req, res) => {
    const userId = (req.query.userId || req.body?.userId) as string | undefined;
    const prevRunning = getBotConfig(userId).isBotRunning;
    const body = req.body || {};

    // Do not overwrite obfuscated keys with stars
    const updatePayload: Record<string, any> = {};
    for (const key of Object.keys(body)) {
      const val = body[key];
      if (typeof val === "string" && val.startsWith("*")) {
        // Skip updating because it was obfuscated
        continue;
      }
      updatePayload[key] = val;
    }

    await updateBotConfig(updatePayload, userId);

    // If bot state toggled, restart cron schedules
    if (prevRunning !== getBotConfig(userId).isBotRunning) {
      restartCronEngine();
    }

    res.json({ success: true, config: getBotConfig(userId) });
  });

  // API 2.5: Securely save user credentials locally as a backup fallback
  app.post("/api/save-credentials", (req, res) => {
    const { 
      userId, 
      brokerType, 
      ALPACA_API_KEY, 
      ALPACA_SECRET_KEY, 
      ALPACA_BASE_URL,
      ROBINHOOD_API_KEY,
      ROBINHOOD_PRIVATE_KEY,
      ROBINHOOD_ACCOUNT_NUMBER,
      ROBINHOOD_MCP_URL,
      GEMINI_API_KEY,
      CLAUDE_API_KEY,
      OPENAI_API_KEY,
      ROBINHOOD_LLM_PROVIDER
    } = req.body || {};
    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }
    try {
      const filePath = path.resolve(`./private_creds_${userId}.json`);
      const payload = {
        brokerType: brokerType || "ALPACA",
        ALPACA_API_KEY,
        ALPACA_SECRET_KEY,
        ALPACA_BASE_URL: ALPACA_BASE_URL || "https://paper-api.alpaca.markets",
        ROBINHOOD_API_KEY,
        ROBINHOOD_PRIVATE_KEY,
        ROBINHOOD_ACCOUNT_NUMBER,
        ROBINHOOD_MCP_URL: ROBINHOOD_MCP_URL || "https://agent.robinhood.com/mcp/trading",
        GEMINI_API_KEY,
        CLAUDE_API_KEY,
        OPENAI_API_KEY,
        ROBINHOOD_LLM_PROVIDER: ROBINHOOD_LLM_PROVIDER || "GEMINI",
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
      addLog("SUCCESS", `[CONNECTION ENGINE] Secure offline-credentials backup registered for user ${userId} using ${payload.brokerType} mode.`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Failed to write offline credentials backup:", err.message);
      res.status(500).json({ error: "Failed to save backup: " + err.message });
    }
  });

  // API 3: Get current state metadata
  app.get("/api/state", (req, res) => {
    const userId = req.query.userId as string | undefined;
    res.json(getBotState(userId));
  });

  // API 4: Get active position (forces live synchronization first)
  app.get("/api/position", async (req, res) => {
    const userId = req.query.userId as string | undefined;
    if (userId) {
      await syncActivePositionWithLiveTrades(userId);
    }
    res.json(getActivePosition(userId));
  });

  // API 5: History logs
  app.get("/api/history", (req, res) => {
    const userId = req.query.userId as string | undefined;
    res.json(getClosedTrades(userId));
  });

  // API 6: Scanned setups
  app.get("/api/setups", async (req, res) => {
    try {
      const setups = await getScannedSetups();
      res.json(setups);
    } catch (err: any) {
      console.error("Failed to load scanned setups:", err.message);
      res.json([]);
    }
  });

  // API 7: Fetch bot log lines
  app.get("/api/logs", (req, res) => {
    const userId = req.query.userId as string | undefined;
    res.json(getBotLogs(userId));
  });

  // API 8: Manually trigger setup screening scanner
  app.post("/api/scan", async (req, res) => {
    // Run scan asynchronously to avoid blocking API responses
    scanForSetups();
    res.json({ success: true, message: "Scanner successfully initialized on server background." });
  });

  // API 9: Deploy portfolio (Buy custom symbol)
  app.post("/api/deploy", async (req, res) => {
    const { symbol } = req.body || {};
    const userId = (req.query.userId || req.body?.userId) as string | undefined;
    if (!symbol) {
      return res.status(400).json({ error: "Missing sym payload parameter." });
    }
    const result = await deployPortfolio(symbol, userId);
    res.json({ success: result });
  });

  // API 10: Exit active position (Sell symbol)
  app.post("/api/exit", async (req, res) => {
    const { symbol, reason } = req.body || {};
    const userId = (req.query.userId || req.body?.userId) as string | undefined;
    if (!symbol) {
      return res.status(400).json({ error: "Missing sym parameter." });
    }
    const result = await executeExit(symbol, reason || "MANUAL_DASHBOARD_CLICK", userId);
    res.json({ success: result });
  });

  // API 11: Clear bot log file
  app.post("/api/clear-logs", (req, res) => {
    const userId = (req.query.userId || req.body?.userId) as string | undefined;
    clearLogs(userId);
    res.json({ success: true });
  });

  // API 12: Fetch live Alpaca account details for a specific user
  app.get("/api/account", async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }
    const result = await getUserAccount(userId);
    res.json(result);
  });
  
  // API 13: Generate AI-based creative swing-trading usernames
  app.post("/api/generate-usernames", async (req, res) => {
    const { userId } = req.body || {};
    const usernames = await generateAIOfferings(userId);
    res.json({ success: true, usernames });
  });

  // API 14: Save, verify uniqueness, and enforce monthly limits for custom user ID / username
  app.post("/api/save-username", async (req, res) => {
    const { userId, username } = req.body || {};
    if (!userId || !username) {
      return res.status(400).json({ error: "Missing userId or username parameters" });
    }
    const result = await registerAndVerifyUsername(userId, username);
    res.json(result);
  });

  // API 15: Retrieve a user's registered username from either Firestore or secure local fallback registry
  app.get("/api/get-username", async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId query parameter" });
    }
    const username = await getRegisteredUsername(userId);
    res.json({ success: true, username });
  });

  // API 16: Retrieve the dynamic, profit-sorted competitive trader leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    const userId = req.query.userId as string;
    const ranking = await getLeaderboardRankings(userId);
    res.json({ success: true, ranking });
  });

  // Integrated Vite Dev Middleware Vs Production Client Serve
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched on http://localhost:${PORT} in env: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
