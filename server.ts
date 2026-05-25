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
} from "./src/server_bot.js";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middleware
  app.use(express.json());

  // Bootstrap data on start
  await loadStateFromDisk();
  startFirestoreStateListener();
  restartCronEngine();

  addLog("INFO", "FastAPI-to-Node core port completed. Server state bootstrapped.");

  // API 1: Fetch config (Obfuscating secrets to client)
  app.get("/api/config", (req, res) => {
    const config = getBotConfig();
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
  app.post("/api/config", (req, res) => {
    const prevRunning = getBotConfig().isBotRunning;
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

    updateBotConfig(updatePayload);

    // If bot state toggled, restart cron schedules
    if (prevRunning !== getBotConfig().isBotRunning) {
      restartCronEngine();
    }

    res.json({ success: true, config: getBotConfig() });
  });

  // API 2.5: Securely save user credentials locally as a backup fallback
  app.post("/api/save-credentials", (req, res) => {
    const { userId, ALPACA_API_KEY, ALPACA_SECRET_KEY, ALPACA_BASE_URL } = req.body || {};
    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }
    try {
      const filePath = path.resolve(`./private_creds_${userId}.json`);
      const payload = {
        ALPACA_API_KEY,
        ALPACA_SECRET_KEY,
        ALPACA_BASE_URL: ALPACA_BASE_URL || "https://paper-api.alpaca.markets",
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
      addLog("SUCCESS", `[CONNECTION ENGINE] Secure offline-credentials backup registered for user ${userId}.`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Failed to write offline credentials backup:", err.message);
      res.status(500).json({ error: "Failed to save backup: " + err.message });
    }
  });

  // API 3: Get current state metadata
  app.get("/api/state", (req, res) => {
    res.json(getBotState());
  });

  // API 4: Get active position
  app.get("/api/position", (req, res) => {
    res.json(getActivePosition());
  });

  // API 5: History logs
  app.get("/api/history", (req, res) => {
    res.json(getClosedTrades());
  });

  // API 6: Scanned setups
  app.get("/api/setups", (req, res) => {
    res.json(getScannedSetups());
  });

  // API 7: Fetch bot log lines
  app.get("/api/logs", (req, res) => {
    res.json(getBotLogs());
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
    if (!symbol) {
      return res.status(400).json({ error: "Missing sym payload parameter." });
    }
    const result = await deployPortfolio(symbol);
    res.json({ success: result });
  });

  // API 10: Exit active position (Sell symbol)
  app.post("/api/exit", async (req, res) => {
    const { symbol, reason } = req.body || {};
    if (!symbol) {
      return res.status(400).json({ error: "Missing sym parameter." });
    }
    const result = await executeExit(symbol, reason || "MANUAL_DASHBOARD_CLICK");
    res.json({ success: result });
  });

  // API 11: Clear bot log file
  app.post("/api/clear-logs", (req, res) => {
    clearLogs();
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
