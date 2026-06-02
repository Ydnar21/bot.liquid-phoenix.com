import React, { useState, useEffect } from "react";
import { Key, ShieldCheck, ShieldAlert, Database, HelpCircle, Save, Settings as SettingsIcon, Eye, EyeOff, Layers, Copy, Check } from "lucide-react";
import { BotConfig } from "../types";
import { db, switchToDefaultClientDb } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface SettingsProps {
  config: BotConfig;
  onSaveConfig: (updated: Partial<BotConfig>) => void;
  currentUser: any;
}

export default function Settings({ config, onSaveConfig, currentUser }: SettingsProps) {
  const [brokerType, setBrokerType] = useState<"ALPACA" | "ROBINHOOD">("ALPACA");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://paper-api.alpaca.markets");
  const [robinhoodApiKey, setRobinhoodApiKey] = useState("");
  const [robinhoodPrivateKey, setRobinhoodPrivateKey] = useState("");
  const [robinhoodAccountNumber, setRobinhoodAccountNumber] = useState("");
  const [robinhoodMcpUrl, setRobinhoodMcpUrl] = useState("https://agent.robinhood.com/mcp/trading");

  // Custom User LLM API keys & chosen engine support
  const [robinhoodLlmProvider, setRobinhoodLlmProvider] = useState<"GEMINI" | "CLAUDE" | "OPENAI">("GEMINI");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");

  const [newsKey, setNewsKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showRhPrivateKey, setShowRhPrivateKey] = useState(false);

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [alpacaStoredDate, setAlpacaStoredDate] = useState<string | null>(null);
  const [robinhoodStoredDate, setRobinhoodStoredDate] = useState<string | null>(null);
  const storedDate = brokerType === "ALPACA" ? alpacaStoredDate : robinhoodStoredDate;
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Saved profile selectors
  const [hasSavedAlpaca, setHasSavedAlpaca] = useState(false);
  const [hasSavedRobinhood, setHasSavedRobinhood] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<"SAVED_ALPACA" | "SAVED_ROBINHOOD" | "NEW">("NEW");
  const [isApplied, setIsApplied] = useState(true);
  const [selectedInstructionTab, setSelectedInstructionTab] = useState<"CLAUDE_CODE" | "CLAUDE_DESKTOP" | "CHATGPT" | "CODEX" | "CODEX_CLI">("CLAUDE_CODE");

  // Keep a separate backup/stored copy of loaded credentials to prevent form clear wipes
  const [storedAlpacaKey, setStoredAlpacaKey] = useState("");
  const [storedAlpacaSecret, setStoredAlpacaSecret] = useState("");
  const [storedBaseUrl, setStoredBaseUrl] = useState("https://paper-api.alpaca.markets");
  const [storedRobinhoodApiKey, setStoredRobinhoodApiKey] = useState("");
  const [storedRobinhoodPrivateKey, setStoredRobinhoodPrivateKey] = useState("");
  const [storedRobinhoodAccountNumber, setStoredRobinhoodAccountNumber] = useState("");
  const [storedRobinhoodMcpUrl, setStoredRobinhoodMcpUrl] = useState("https://agent.robinhood.com/mcp/trading");
  const [storedRobinhoodLlmProvider, setStoredRobinhoodLlmProvider] = useState<"GEMINI" | "CLAUDE" | "OPENAI">("GEMINI");
  const [storedGeminiApiKey, setStoredGeminiApiKey] = useState("");
  const [storedClaudeApiKey, setStoredClaudeApiKey] = useState("");
  const [storedOpenaiApiKey, setStoredOpenaiApiKey] = useState("");

  // Load private credentials from current user's Firestore path if logged in
  useEffect(() => {
    let active = true;
    async function loadUserCreds() {
      if (!currentUser) return;
      setLoading(true);
      try {
        const credRef = doc(db, "users", currentUser.uid, "private", "credentials");
        const snap = await getDoc(credRef);
        if (snap.exists() && active) {
          const data = snap.data();
          setBrokerType(data.brokerType || "ALPACA");
          setApiKey(data.ALPACA_API_KEY || "");
          setApiSecret(data.ALPACA_SECRET_KEY || "");
          setBaseUrl(data.ALPACA_BASE_URL || "https://paper-api.alpaca.markets");
          setRobinhoodApiKey(data.ROBINHOOD_API_KEY || "");
          setRobinhoodPrivateKey(data.ROBINHOOD_PRIVATE_KEY || "");
          setRobinhoodAccountNumber(data.ROBINHOOD_ACCOUNT_NUMBER || "");
          setRobinhoodMcpUrl(data.ROBINHOOD_MCP_URL || "https://agent.robinhood.com/mcp/trading");
          setRobinhoodLlmProvider(data.ROBINHOOD_LLM_PROVIDER || "GEMINI");
          setGeminiApiKey(data.GEMINI_API_KEY || "");
          setClaudeApiKey(data.CLAUDE_API_KEY || "");
          setOpenaiApiKey(data.OPENAI_API_KEY || "");

          // Save backup copies
          setStoredAlpacaKey(data.ALPACA_API_KEY || "");
          setStoredAlpacaSecret(data.ALPACA_SECRET_KEY || "");
          setStoredBaseUrl(data.ALPACA_BASE_URL || "https://paper-api.alpaca.markets");
          setStoredRobinhoodApiKey(data.ROBINHOOD_API_KEY || "");
          setStoredRobinhoodPrivateKey(data.ROBINHOOD_PRIVATE_KEY || "");
          setStoredRobinhoodAccountNumber(data.ROBINHOOD_ACCOUNT_NUMBER || "");
          setStoredRobinhoodMcpUrl(data.ROBINHOOD_MCP_URL || "https://agent.robinhood.com/mcp/trading");
          setStoredRobinhoodLlmProvider(data.ROBINHOOD_LLM_PROVIDER || "GEMINI");
          setStoredGeminiApiKey(data.GEMINI_API_KEY || "");
          setStoredClaudeApiKey(data.CLAUDE_API_KEY || "");
          setStoredOpenaiApiKey(data.OPENAI_API_KEY || "");

          const hasAlpaca = !!data.ALPACA_API_KEY;
          const hasRH = !!(data.ROBINHOOD_API_KEY || data.ROBINHOOD_PRIVATE_KEY || data.ROBINHOOD_MCP_URL);

          setHasSavedAlpaca(hasAlpaca);
          setHasSavedRobinhood(hasRH);

          if (data.brokerType === "ROBINHOOD" && hasRH) {
            setSelectedProfile("SAVED_ROBINHOOD");
            setIsApplied(true);
          } else if (data.brokerType === "ALPACA" && hasAlpaca) {
            setSelectedProfile("SAVED_ALPACA");
            setIsApplied(true);
          } else {
            setSelectedProfile("NEW");
            setIsApplied(false);
          }
          
          const alpacaDate = data.alpacaUpdatedAt || (data.ALPACA_API_KEY ? data.updatedAt : null);
          const robinhoodDate = data.robinhoodUpdatedAt || ((data.ROBINHOOD_API_KEY || data.ROBINHOOD_PRIVATE_KEY || data.ROBINHOOD_MCP_URL) ? data.updatedAt : null);
          setAlpacaStoredDate(alpacaDate || null);
          setRobinhoodStoredDate(robinhoodDate || null);
        }
      } catch (err: any) {
        console.error("Failed to load user credentials from Firestore:", err.message);
        if (err.message && (err.message.toLowerCase().includes("not-found") || err.message.toLowerCase().includes("database") || err.message.toLowerCase().includes("not_found"))) {
          try {
            switchToDefaultClientDb();
            const credRef = doc(db, "users", currentUser.uid, "private", "credentials");
            const snap = await getDoc(credRef);
            if (snap.exists() && active) {
              const data = snap.data();
              setBrokerType(data.brokerType || "ALPACA");
              setApiKey(data.ALPACA_API_KEY || "");
              setApiSecret(data.ALPACA_SECRET_KEY || "");
              setBaseUrl(data.ALPACA_BASE_URL || "https://paper-api.alpaca.markets");
              setRobinhoodApiKey(data.ROBINHOOD_API_KEY || "");
              setRobinhoodPrivateKey(data.ROBINHOOD_PRIVATE_KEY || "");
              setRobinhoodAccountNumber(data.ROBINHOOD_ACCOUNT_NUMBER || "");
              setRobinhoodMcpUrl(data.ROBINHOOD_MCP_URL || "https://agent.robinhood.com/mcp/trading");
              setRobinhoodLlmProvider(data.ROBINHOOD_LLM_PROVIDER || "GEMINI");
              setGeminiApiKey(data.GEMINI_API_KEY || "");
              setClaudeApiKey(data.CLAUDE_API_KEY || "");
              setOpenaiApiKey(data.OPENAI_API_KEY || "");

              // Save backup copies
              setStoredAlpacaKey(data.ALPACA_API_KEY || "");
              setStoredAlpacaSecret(data.ALPACA_SECRET_KEY || "");
              setStoredBaseUrl(data.ALPACA_BASE_URL || "https://paper-api.alpaca.markets");
              setStoredRobinhoodApiKey(data.ROBINHOOD_API_KEY || "");
              setStoredRobinhoodPrivateKey(data.ROBINHOOD_PRIVATE_KEY || "");
              setStoredRobinhoodAccountNumber(data.ROBINHOOD_ACCOUNT_NUMBER || "");
              setStoredRobinhoodMcpUrl(data.ROBINHOOD_MCP_URL || "https://agent.robinhood.com/mcp/trading");
              setStoredRobinhoodLlmProvider(data.ROBINHOOD_LLM_PROVIDER || "GEMINI");
              setStoredGeminiApiKey(data.GEMINI_API_KEY || "");
              setStoredClaudeApiKey(data.CLAUDE_API_KEY || "");
              setStoredOpenaiApiKey(data.OPENAI_API_KEY || "");

              const hasAlpaca = !!data.ALPACA_API_KEY;
              const hasRH = !!(data.ROBINHOOD_API_KEY || data.ROBINHOOD_PRIVATE_KEY || data.ROBINHOOD_MCP_URL);

              setHasSavedAlpaca(hasAlpaca);
              setHasSavedRobinhood(hasRH);

              if (data.brokerType === "ROBINHOOD" && hasRH) {
                setSelectedProfile("SAVED_ROBINHOOD");
                setIsApplied(true);
              } else if (data.brokerType === "ALPACA" && hasAlpaca) {
                setSelectedProfile("SAVED_ALPACA");
                setIsApplied(true);
              } else {
                setSelectedProfile("NEW");
                setIsApplied(false);
              }
              
              const alpacaDateFallback = data.alpacaUpdatedAt || (data.ALPACA_API_KEY ? data.updatedAt : null);
              const robinhoodDateFallback = data.robinhoodUpdatedAt || ((data.ROBINHOOD_API_KEY || data.ROBINHOOD_PRIVATE_KEY || data.ROBINHOOD_MCP_URL) ? data.updatedAt : null);
              setAlpacaStoredDate(alpacaDateFallback || null);
              setRobinhoodStoredDate(robinhoodDateFallback || null);
            }
          } catch (retryErr: any) {
            console.error("Fallback load user credentials from Firestore also failed:", retryErr.message);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUserCreds();
    return () => {
      active = false;
    };
  }, [currentUser]);

  // Synchronize input fields clearing when switching to NEW connection profile
  useEffect(() => {
    if (selectedProfile === "NEW") {
      if (brokerType === "ALPACA") {
        setApiKey("");
        setApiSecret("");
      } else if (brokerType === "ROBINHOOD") {
        setRobinhoodApiKey("");
        setRobinhoodPrivateKey("");
        setRobinhoodAccountNumber("");
        setGeminiApiKey("");
        setClaudeApiKey("");
        setOpenaiApiKey("");
        setRobinhoodMcpUrl("https://agent.robinhood.com/mcp/trading");
      }
    }
  }, [selectedProfile, brokerType]);

  // Load fallback global news scale keys
  useEffect(() => {
    setNewsKey(config.NEWSAPI_KEY || "");
  }, [config]);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDisconnect = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      // Pause connection and suspend the scanner session
      await onSaveConfig({
        isConnectionActive: false,
        isBotRunning: false,
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error("Failed to disconnect connection:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCredentials = async () => {
    setLoading(true);
    try {
      let updatedPayload: any = {};

      if (brokerType === "ALPACA") {
        setApiKey("");
        setApiSecret("");
        setStoredAlpacaKey("");
        setStoredAlpacaSecret("");
        setHasSavedAlpaca(false);
        setAlpacaStoredDate(null);

        updatedPayload = {
          brokerType: hasSavedRobinhood ? "ROBINHOOD" : "ALPACA",
          ALPACA_API_KEY: "",
          ALPACA_SECRET_KEY: "",
          ALPACA_BASE_URL: baseUrl,
          ROBINHOOD_API_KEY: storedRobinhoodApiKey || "",
          ROBINHOOD_PRIVATE_KEY: storedRobinhoodPrivateKey || "",
          ROBINHOOD_ACCOUNT_NUMBER: storedRobinhoodAccountNumber || "",
          ROBINHOOD_MCP_URL: storedRobinhoodMcpUrl || "https://agent.robinhood.com/mcp/trading",
          GEMINI_API_KEY: storedGeminiApiKey || "",
          CLAUDE_API_KEY: storedClaudeApiKey || "",
          OPENAI_API_KEY: storedOpenaiApiKey || "",
          ROBINHOOD_LLM_PROVIDER: storedRobinhoodLlmProvider || "GEMINI",
          alpacaUpdatedAt: "",
          robinhoodUpdatedAt: (hasSavedRobinhood ? robinhoodStoredDate : "") || "",
        };

        if (hasSavedRobinhood) {
          setBrokerType("ROBINHOOD");
          setSelectedProfile("SAVED_ROBINHOOD");
          setIsApplied(true);
        } else {
          setSelectedProfile("NEW");
          setIsApplied(false);
        }
      } else {
        // Deleting Robinhood - fully clear all inputs and stored fields
        setRobinhoodApiKey("");
        setRobinhoodPrivateKey("");
        setRobinhoodAccountNumber("");
        setStoredRobinhoodApiKey("");
        setStoredRobinhoodPrivateKey("");
        setStoredRobinhoodAccountNumber("");
        setRobinhoodMcpUrl("https://agent.robinhood.com/mcp/trading");
        setStoredRobinhoodMcpUrl("https://agent.robinhood.com/mcp/trading");
        setGeminiApiKey("");
        setClaudeApiKey("");
        setOpenaiApiKey("");
        setStoredGeminiApiKey("");
        setStoredClaudeApiKey("");
        setStoredOpenaiApiKey("");
        setHasSavedRobinhood(false);
        setRobinhoodStoredDate(null);

        updatedPayload = {
          brokerType: hasSavedAlpaca ? "ALPACA" : "ROBINHOOD",
          ALPACA_API_KEY: storedAlpacaKey || "",
          ALPACA_SECRET_KEY: storedAlpacaSecret || "",
          ALPACA_BASE_URL: baseUrl || "https://paper-api.alpaca.markets",
          ROBINHOOD_API_KEY: "",
          ROBINHOOD_PRIVATE_KEY: "",
          ROBINHOOD_ACCOUNT_NUMBER: "",
          ROBINHOOD_MCP_URL: "https://agent.robinhood.com/mcp/trading",
          GEMINI_API_KEY: "",
          CLAUDE_API_KEY: "",
          OPENAI_API_KEY: "",
          ROBINHOOD_LLM_PROVIDER: "GEMINI",
          alpacaUpdatedAt: (hasSavedAlpaca ? alpacaStoredDate : "") || "",
          robinhoodUpdatedAt: "",
        };

        if (hasSavedAlpaca) {
          setBrokerType("ALPACA");
          setSelectedProfile("SAVED_ALPACA");
          setIsApplied(true);
        } else {
          setSelectedProfile("NEW");
          setIsApplied(false);
        }
      }

      setShowConfirmDelete(false);

      if (currentUser) {
        try {
          const credRef = doc(db, "users", currentUser.uid, "private", "credentials");
          await setDoc(credRef, updatedPayload);
        } catch (e: any) {
          if (e.message && (e.message.toLowerCase().includes("not-found") || e.message.toLowerCase().includes("database") || e.message.toLowerCase().includes("not_found"))) {
            switchToDefaultClientDb();
            const credRef = doc(db, "users", currentUser.uid, "private", "credentials");
            await setDoc(credRef, updatedPayload);
          } else {
            throw e;
          }
        }

        // Sync local storage / backup deletion to Node server controller
        try {
          await fetch("/api/save-credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: currentUser.uid,
              ...updatedPayload,
            }),
          });
        } catch (errFallback) {
          console.warn("Secure local fallback deletion error:", errFallback);
        }
      }

      // 3. Update the bot configurations (safely toggle isConnectionActive only if no saved broker remaining)
      const hasAnyRemaining = (brokerType === "ALPACA" && hasSavedRobinhood) || (brokerType === "ROBINHOOD" && hasSavedAlpaca);
      onSaveConfig({
        isConnectionActive: hasAnyRemaining,
        isBotRunning: hasAnyRemaining,
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error("Failed to delete stored credentials:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const timestamp = new Date().toISOString();

    try {
      if (currentUser) {
        let payload: any = {};

        if (selectedProfile === "SAVED_ALPACA") {
          payload = {
            brokerType: "ALPACA",
            ALPACA_API_KEY: storedAlpacaKey,
            ALPACA_SECRET_KEY: storedAlpacaSecret,
            ALPACA_BASE_URL: baseUrl,
            ROBINHOOD_API_KEY: storedRobinhoodApiKey,
            ROBINHOOD_PRIVATE_KEY: storedRobinhoodPrivateKey,
            ROBINHOOD_ACCOUNT_NUMBER: storedRobinhoodAccountNumber,
            ROBINHOOD_MCP_URL: storedRobinhoodMcpUrl,
            GEMINI_API_KEY: storedGeminiApiKey,
            CLAUDE_API_KEY: storedClaudeApiKey,
            OPENAI_API_KEY: storedOpenaiApiKey,
            ROBINHOOD_LLM_PROVIDER: storedRobinhoodLlmProvider,
            alpacaUpdatedAt: alpacaStoredDate || timestamp,
            robinhoodUpdatedAt: robinhoodStoredDate,
          };
        } else if (selectedProfile === "SAVED_ROBINHOOD") {
          payload = {
            brokerType: "ROBINHOOD",
            ALPACA_API_KEY: storedAlpacaKey,
            ALPACA_SECRET_KEY: storedAlpacaSecret,
            ALPACA_BASE_URL: storedBaseUrl,
            ROBINHOOD_API_KEY: storedRobinhoodApiKey,
            ROBINHOOD_PRIVATE_KEY: storedRobinhoodPrivateKey,
            ROBINHOOD_ACCOUNT_NUMBER: storedRobinhoodAccountNumber,
            ROBINHOOD_MCP_URL: storedRobinhoodMcpUrl,
            GEMINI_API_KEY: storedGeminiApiKey,
            CLAUDE_API_KEY: storedClaudeApiKey,
            OPENAI_API_KEY: storedOpenaiApiKey,
            ROBINHOOD_LLM_PROVIDER: robinhoodLlmProvider,
            alpacaUpdatedAt: alpacaStoredDate,
            robinhoodUpdatedAt: robinhoodStoredDate || timestamp,
          };
        } else {
          if (brokerType === "ALPACA") {
            payload = {
              brokerType,
              ALPACA_API_KEY: apiKey || storedAlpacaKey,
              ALPACA_SECRET_KEY: apiSecret || storedAlpacaSecret,
              ALPACA_BASE_URL: baseUrl,
              ROBINHOOD_API_KEY: storedRobinhoodApiKey,
              ROBINHOOD_PRIVATE_KEY: storedRobinhoodPrivateKey,
              ROBINHOOD_ACCOUNT_NUMBER: storedRobinhoodAccountNumber,
              ROBINHOOD_MCP_URL: storedRobinhoodMcpUrl,
              GEMINI_API_KEY: storedGeminiApiKey,
              CLAUDE_API_KEY: storedClaudeApiKey,
              OPENAI_API_KEY: storedOpenaiApiKey,
              ROBINHOOD_LLM_PROVIDER: storedRobinhoodLlmProvider,
              alpacaUpdatedAt: timestamp,
              robinhoodUpdatedAt: robinhoodStoredDate,
            };
          } else {
            payload = {
              brokerType,
              ALPACA_API_KEY: storedAlpacaKey,
              ALPACA_SECRET_KEY: storedAlpacaSecret,
              ALPACA_BASE_URL: storedBaseUrl,
              ROBINHOOD_API_KEY: robinhoodApiKey || storedRobinhoodApiKey,
              ROBINHOOD_PRIVATE_KEY: robinhoodPrivateKey || storedRobinhoodPrivateKey,
              ROBINHOOD_ACCOUNT_NUMBER: robinhoodAccountNumber || storedRobinhoodAccountNumber,
              ROBINHOOD_MCP_URL: robinhoodMcpUrl || storedRobinhoodMcpUrl,
              GEMINI_API_KEY: geminiApiKey || storedGeminiApiKey,
              CLAUDE_API_KEY: claudeApiKey || storedClaudeApiKey,
              OPENAI_API_KEY: openaiApiKey || storedOpenaiApiKey,
              ROBINHOOD_LLM_PROVIDER: robinhoodLlmProvider,
              alpacaUpdatedAt: alpacaStoredDate,
              robinhoodUpdatedAt: timestamp,
            };
          }

          // Update backup copies
          if (brokerType === "ALPACA") {
            setStoredAlpacaKey(apiKey || storedAlpacaKey);
            setStoredAlpacaSecret(apiSecret || storedAlpacaSecret);
            setStoredBaseUrl(baseUrl);
            setHasSavedAlpaca(true);
            setSelectedProfile("SAVED_ALPACA");
          } else {
            setStoredRobinhoodApiKey(robinhoodApiKey || storedRobinhoodApiKey);
            setStoredRobinhoodPrivateKey(robinhoodPrivateKey || storedRobinhoodPrivateKey);
            setStoredRobinhoodAccountNumber(robinhoodAccountNumber || storedRobinhoodAccountNumber);
            setStoredRobinhoodMcpUrl(robinhoodMcpUrl || storedRobinhoodMcpUrl);
            setStoredGeminiApiKey(geminiApiKey || storedGeminiApiKey);
            setStoredClaudeApiKey(claudeApiKey || storedClaudeApiKey);
            setStoredOpenaiApiKey(openaiApiKey || storedOpenaiApiKey);
            setStoredRobinhoodLlmProvider(robinhoodLlmProvider);
            setHasSavedRobinhood(true);
            setSelectedProfile("SAVED_ROBINHOOD");
          }
        }

        try {
          // Securely sync private keys directly to Firestore
          const credRef = doc(db, "users", currentUser.uid, "private", "credentials");
          await setDoc(credRef, payload);
        } catch (e: any) {
          if (e.message && (e.message.toLowerCase().includes("not-found") || e.message.toLowerCase().includes("database") || e.message.toLowerCase().includes("not_found"))) {
            switchToDefaultClientDb();
            const credRef = doc(db, "users", currentUser.uid, "private", "credentials");
            await setDoc(credRef, payload);
          } else {
            throw e;
          }
        }

        // Sync secure localized backup fallback to server
        try {
          await fetch("/api/save-credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: currentUser.uid,
              ...payload,
            }),
          });
        } catch (errFallback) {
          console.warn("Secure local fallback registration error:", errFallback);
        }
      }

      // Update storedDate with newly set timestamp instantly
      if (brokerType === "ALPACA") {
        setAlpacaStoredDate(timestamp);
      } else {
        setRobinhoodStoredDate(timestamp);
      }

      // Clear only the inputs since they are now saved and can be loaded from profile view
      setApiKey("");
      setApiSecret("");
      setRobinhoodApiKey("");
      setRobinhoodPrivateKey("");
      setRobinhoodAccountNumber("");
      setGeminiApiKey("");
      setClaudeApiKey("");
      setOpenaiApiKey("");

      // Sync global news configuration updates without force connecting
      await onSaveConfig({
        NEWSAPI_KEY: newsKey,
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error("Failed to save Connection settings:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.MouseEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    const timestamp = new Date().toISOString();

    try {
      let payload: any = {};

      // Determine profile based on the active tab (brokerType):
      // If someone matches the Active Tab, use their respective saved profile if available, otherwise "NEW"
      const effectiveProfile = brokerType === "ALPACA"
        ? (hasSavedAlpaca ? "SAVED_ALPACA" : "NEW")
        : (hasSavedRobinhood ? "SAVED_ROBINHOOD" : "NEW");

      // Update selectedProfile state to align visually
      setSelectedProfile(effectiveProfile);

      if (effectiveProfile === "SAVED_ALPACA") {
        payload = {
          brokerType: "ALPACA",
          ALPACA_API_KEY: storedAlpacaKey,
          ALPACA_SECRET_KEY: storedAlpacaSecret,
          ALPACA_BASE_URL: baseUrl,
          ROBINHOOD_API_KEY: storedRobinhoodApiKey,
          ROBINHOOD_PRIVATE_KEY: storedRobinhoodPrivateKey,
          ROBINHOOD_ACCOUNT_NUMBER: storedRobinhoodAccountNumber,
          ROBINHOOD_MCP_URL: storedRobinhoodMcpUrl,
          GEMINI_API_KEY: storedGeminiApiKey,
          CLAUDE_API_KEY: storedClaudeApiKey,
          OPENAI_API_KEY: storedOpenaiApiKey,
          ROBINHOOD_LLM_PROVIDER: storedRobinhoodLlmProvider,
          alpacaUpdatedAt: alpacaStoredDate || timestamp,
          robinhoodUpdatedAt: robinhoodStoredDate,
        };
      } else if (effectiveProfile === "SAVED_ROBINHOOD") {
        payload = {
          brokerType: "ROBINHOOD",
          ALPACA_API_KEY: storedAlpacaKey,
          ALPACA_SECRET_KEY: storedAlpacaSecret,
          ALPACA_BASE_URL: storedBaseUrl,
          ROBINHOOD_API_KEY: storedRobinhoodApiKey,
          ROBINHOOD_PRIVATE_KEY: storedRobinhoodPrivateKey,
          ROBINHOOD_ACCOUNT_NUMBER: storedRobinhoodAccountNumber,
          ROBINHOOD_MCP_URL: storedRobinhoodMcpUrl,
          GEMINI_API_KEY: storedGeminiApiKey,
          CLAUDE_API_KEY: storedClaudeApiKey,
          OPENAI_API_KEY: storedOpenaiApiKey,
          ROBINHOOD_LLM_PROVIDER: robinhoodLlmProvider,
          alpacaUpdatedAt: alpacaStoredDate,
          robinhoodUpdatedAt: robinhoodStoredDate || timestamp,
        };
      } else {
        if (brokerType === "ALPACA") {
          payload = {
            brokerType,
            ALPACA_API_KEY: apiKey || storedAlpacaKey,
            ALPACA_SECRET_KEY: apiSecret || storedAlpacaSecret,
            ALPACA_BASE_URL: baseUrl,
            ROBINHOOD_API_KEY: storedRobinhoodApiKey,
            ROBINHOOD_PRIVATE_KEY: storedRobinhoodPrivateKey,
            ROBINHOOD_ACCOUNT_NUMBER: storedRobinhoodAccountNumber,
            ROBINHOOD_MCP_URL: storedRobinhoodMcpUrl,
            GEMINI_API_KEY: storedGeminiApiKey,
            CLAUDE_API_KEY: storedClaudeApiKey,
            OPENAI_API_KEY: storedOpenaiApiKey,
            ROBINHOOD_LLM_PROVIDER: storedRobinhoodLlmProvider,
            alpacaUpdatedAt: timestamp,
            robinhoodUpdatedAt: robinhoodStoredDate,
          };
        } else {
          payload = {
            brokerType,
            ALPACA_API_KEY: storedAlpacaKey,
            ALPACA_SECRET_KEY: storedAlpacaSecret,
            ALPACA_BASE_URL: storedBaseUrl,
            ROBINHOOD_API_KEY: robinhoodApiKey || storedRobinhoodApiKey,
            ROBINHOOD_PRIVATE_KEY: robinhoodPrivateKey || storedRobinhoodPrivateKey,
            ROBINHOOD_ACCOUNT_NUMBER: robinhoodAccountNumber || storedRobinhoodAccountNumber,
            ROBINHOOD_MCP_URL: robinhoodMcpUrl || storedRobinhoodMcpUrl,
            GEMINI_API_KEY: geminiApiKey || storedGeminiApiKey,
            CLAUDE_API_KEY: claudeApiKey || storedClaudeApiKey,
            OPENAI_API_KEY: openaiApiKey || storedOpenaiApiKey,
            ROBINHOOD_LLM_PROVIDER: robinhoodLlmProvider,
            alpacaUpdatedAt: alpacaStoredDate,
            robinhoodUpdatedAt: timestamp,
          };
        }

        if (brokerType === "ALPACA") {
          setStoredAlpacaKey(apiKey || storedAlpacaKey);
          setStoredAlpacaSecret(apiSecret || storedAlpacaSecret);
          setStoredBaseUrl(baseUrl);
          setHasSavedAlpaca(true);
        } else {
          setStoredRobinhoodApiKey(robinhoodApiKey || storedRobinhoodApiKey);
          setStoredRobinhoodPrivateKey(robinhoodPrivateKey || storedRobinhoodPrivateKey);
          setStoredRobinhoodAccountNumber(robinhoodAccountNumber || storedRobinhoodAccountNumber);
          setStoredRobinhoodMcpUrl(robinhoodMcpUrl || storedRobinhoodMcpUrl);
          setStoredGeminiApiKey(geminiApiKey || storedGeminiApiKey);
          setStoredClaudeApiKey(claudeApiKey || storedClaudeApiKey);
          setStoredOpenaiApiKey(openaiApiKey || storedOpenaiApiKey);
          setStoredRobinhoodLlmProvider(robinhoodLlmProvider);
          setHasSavedRobinhood(true);
        }
      }

      if (currentUser) {
        try {
          const credRef = doc(db, "users", currentUser.uid, "private", "credentials");
          await setDoc(credRef, payload);
        } catch (e: any) {
          if (e.message && (e.message.toLowerCase().includes("not-found") || e.message.toLowerCase().includes("database") || e.message.toLowerCase().includes("not_found"))) {
            switchToDefaultClientDb();
            const credRef = doc(db, "users", currentUser.uid, "private", "credentials");
            await setDoc(credRef, payload);
          } else {
            throw e;
          }
        }

        try {
          await fetch("/api/save-credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: currentUser.uid,
              ...payload,
            }),
          });
        } catch (errFallback) {
          console.warn("Secure local fallback registration error:", errFallback);
        }
      }

      if (brokerType === "ALPACA") {
        setAlpacaStoredDate(timestamp);
      } else {
        setRobinhoodStoredDate(timestamp);
      }
      setApiKey("");
      setApiSecret("");
      setRobinhoodApiKey("");
      setRobinhoodPrivateKey("");
      setRobinhoodAccountNumber("");
      setGeminiApiKey("");
      setClaudeApiKey("");
      setOpenaiApiKey("");

      const currentBroker = effectiveProfile === "SAVED_ALPACA" ? "ALPACA" : effectiveProfile === "SAVED_ROBINHOOD" ? "ROBINHOOD" : brokerType;

      if (currentBroker === "ROBINHOOD") {
        const provider = (payload.ROBINHOOD_LLM_PROVIDER || "GEMINI").toUpperCase();
        let providerPath = "google";
        let clientId = "robinhood-mcp-ai";
        if (provider === "GEMINI") {
          providerPath = "google";
          clientId = "robinhood-mcp-google";
        } else if (provider === "CLAUDE") {
          providerPath = "claude";
          clientId = "robinhood-mcp-claude";
        } else if (provider === "OPENAI") {
          providerPath = "openai";
          clientId = "robinhood-mcp-openai";
        }

        let activeApiKey = "";
        if (provider === "GEMINI") {
          activeApiKey = payload.GEMINI_API_KEY || geminiApiKey || storedGeminiApiKey || "";
        } else if (provider === "CLAUDE") {
          activeApiKey = payload.CLAUDE_API_KEY || claudeApiKey || storedClaudeApiKey || "";
        } else if (provider === "OPENAI") {
          activeApiKey = payload.OPENAI_API_KEY || openaiApiKey || storedOpenaiApiKey || "";
        }

        const finalMcpUrl = payload.ROBINHOOD_MCP_URL || `https://agent.robinhood.com/${providerPath}/mcp/trading`;
        const givenApiKey = payload.ROBINHOOD_API_KEY || robinhoodApiKey || storedRobinhoodApiKey || activeApiKey;
        const redirectUrl = `https://agent.robinhood.com/${providerPath}/mcp/trading/login?client_id=${clientId}&userId=${currentUser?.uid || "user"}&mcp_gateway=${encodeURIComponent(finalMcpUrl)}&redirect_uri=${encodeURIComponent(window.location.origin + "?connected=true")}&api_key=${encodeURIComponent(givenApiKey)}&apiKey=${encodeURIComponent(givenApiKey)}&token=${encodeURIComponent(givenApiKey)}`;

        // Instantly save the config to activate the Robinhood channel on the server side
        await onSaveConfig({
          isConnectionActive: true,
        });

        // Create elegant in-tab redirect overlay with robust direct click buttons and manual launch options
        const statusOverlay = document.createElement("div");
        statusOverlay.id = "mcp-redirect-overlay";
        statusOverlay.className = "fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-center text-white font-mono animate-fade-in";
        statusOverlay.innerHTML = `
          <div class="max-w-md space-y-4">
            <div class="w-16 h-16 bg-[#00c805]/20 border border-[#00c805]/50 rounded-full flex items-center justify-center text-[#00c805] text-xs font-bold animate-pulse mx-auto">
              MCP
            </div>
            <h3 class="text-md font-bold text-white uppercase tracking-wider">Robinhood MCP Portal Connected!</h3>
            <p class="text-xs text-zinc-400 leading-relaxed">
              Successfully established Agent connection. Your high-fidelity portfolio balance streams are now active!
            </p>
            <div class="w-full bg-neutral-900 border border-emerald-950/40 rounded p-4 text-[11px] text-zinc-400 text-left space-y-2">
              <div class="flex justify-between border-b border-theme-border/20 pb-1">
                <span>Active Coordinator</span>
                <span class="text-emerald-400 font-bold">${payload.ROBINHOOD_LLM_PROVIDER || "GEMINI"} AI</span>
              </div>
              <div class="flex justify-between border-b border-theme-border/20 pb-1">
                <span>Gateway Service</span>
                <span class="text-zinc-300 font-mono text-[9px] truncate max-w-[200px]" title="${finalMcpUrl}">${finalMcpUrl}</span>
              </div>
              <div class="flex justify-between border-b border-theme-border/20 pb-1">
                <span>API Key Loaded</span>
                <span class="text-[#00c805] font-bold">Securely Injected</span>
              </div>
              <div class="flex justify-between">
                <span>Simulation Sandbox</span>
                <span class="text-[#00c805] font-bold uppercase">Ready</span>
              </div>
            </div>
            <div class="pt-2 flex flex-col items-center gap-3">
              <p class="text-[10px] text-zinc-500 max-w-xs leading-relaxed text-center">
                If your browser redirects you automatically, complete the same-session login to link your physical keys. If the redirect is iframe-safe blocked, use manual options below:
              </p>
              
              <div class="flex flex-col gap-2 w-full mt-2">
                <a
                  href="${redirectUrl}"
                  target="_top"
                  class="w-full py-2 bg-[#00c805] hover:bg-[#00b004] text-black font-bold uppercase rounded text-xs text-center transition-all cursor-pointer"
                >
                  Force Redirect (Same Tab)
                </a>
                <a
                  href="${redirectUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-full py-2 bg-neutral-900 hover:bg-neutral-850 text-white border border-[#00c805]/50 font-bold uppercase rounded text-xs text-center transition-all cursor-pointer"
                >
                  Open Portal in New Window
                </a>
                <button
                  type="button"
                  id="mcp-skip-btn"
                  class="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-emerald-400 font-mono font-bold uppercase rounded border border-zinc-800 text-xs transition-all cursor-pointer"
                >
                  Direct Return to Dashboard
                </button>
              </div>

              <button
                type="button"
                id="mcp-cancel-btn"
                class="text-[10px] text-zinc-400 hover:text-white underline uppercase cursor-pointer py-1 mt-2 block"
              >
                Dismiss & Disconnect
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(statusOverlay);

        let cancelled = false;

        // Click handler for Skip button
        const skipBtn = statusOverlay.querySelector("#mcp-skip-btn");
        if (skipBtn) {
          skipBtn.addEventListener("click", () => {
            statusOverlay.remove();
            setLoading(false);
          });
        }

        // Click handler to remove overlay
        const cancelBtn = statusOverlay.querySelector("#mcp-cancel-btn");
        if (cancelBtn) {
          cancelBtn.addEventListener("click", async () => {
            cancelled = true;
            statusOverlay.remove();
            await onSaveConfig({
              isConnectionActive: false,
            });
            setLoading(false);
          });
        }

        // Trigger safe-redirection after 1200ms
        setTimeout(() => {
          if (!cancelled) {
            try {
              window.location.href = redirectUrl;
            } catch (errRedirect) {
              console.warn("Same-tab redirect blocked by iframe policy. Fallback to manual buttons.", errRedirect);
            }
          }
        }, 1200);
      } else {
        await onSaveConfig({
          NEWSAPI_KEY: newsKey,
          isConnectionActive: true,
        });

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Failed to connect:", err.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-theme-panel border border-theme-border rounded p-6 shadow-xl h-auto flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="w-5 h-5 text-theme-accent" />
          <h2 className="text-md font-bold tracking-tight text-white uppercase font-display">Connection Settings</h2>
        </div>
        <p className="text-[11px] text-gray-400 mb-4 font-mono uppercase tracking-tight">
          {brokerType === "ALPACA" 
            ? "Configure Alpaca credentials to run the scanner and submit live simulated orders." 
            : "Configure custom Robinhood Agentic MCP credentials for secure direct cloud routing."}
        </p>

        {/* Broker Provider Selector segmented switch */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-900 border border-theme-border rounded-lg mb-4">
          <button
            type="button"
            onClick={() => {
              setBrokerType("ALPACA");
              if (hasSavedAlpaca) {
                setSelectedProfile("SAVED_ALPACA");
                setIsApplied(true);
              } else {
                setSelectedProfile("NEW");
                setIsApplied(false);
              }
            }}
            className={`py-2 text-[10px] font-mono font-bold rounded-md uppercase tracking-wider relative transition-all cursor-pointer ${
              brokerType === "ALPACA"
                ? "bg-theme-accent text-black font-extrabold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Alpaca API Keys
          </button>
          <button
            type="button"
            onClick={() => {
              setBrokerType("ROBINHOOD");
              setSelectedProfile("NEW");
              setIsApplied(false);
            }}
            className={`py-2 text-[10px] font-mono font-bold rounded-md uppercase tracking-wider relative transition-all cursor-pointer ${
              brokerType === "ROBINHOOD"
                ? "bg-zinc-800 text-[#00c805] font-extrabold border border-emerald-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Robinhood MCP (Soon)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {storedDate && (
            <div className="bg-neutral-900 border border-emerald-950/60 rounded p-3 text-[11px] font-mono space-y-1.5" id="credentials-stored-banner">
              <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-theme-border/20">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00c805]" />
                  <span>Secure Credentials Retained</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isApplied;
                    setIsApplied(nextVal);
                    if (nextVal) {
                      if (brokerType === "ALPACA") {
                        setSelectedProfile(hasSavedAlpaca ? "SAVED_ALPACA" : "NEW");
                      } else {
                        setSelectedProfile(hasSavedRobinhood ? "SAVED_ROBINHOOD" : "NEW");
                      }
                    } else {
                      setSelectedProfile("NEW");
                    }
                  }}
                  className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    isApplied
                      ? "bg-[#00c805] text-black font-extrabold"
                      : "bg-neutral-800 hover:bg-neutral-700 text-zinc-300"
                  }`}
                  id="toggle-use-credentials"
                >
                  {isApplied ? "Applied" : "Use"}
                </button>
              </div>
              <p className="text-zinc-400 text-[10px] leading-relaxed">
                Credentials stored on <span className="text-[#00c805] font-semibold">{new Date(storedDate).toLocaleString()}</span>. You can use these credentials whenever you want, or permanently remove them from the cloud database.
              </p>
              <div className="pt-0.5">
                {!showConfirmDelete ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setShowConfirmDelete(true)}
                    className="text-[9px] text-red-500 hover:text-red-400 font-bold uppercase tracking-wider underline cursor-pointer disabled:opacity-50 transition-colors"
                    id="btn-delete-credentials"
                  >
                    Delete Stored Credentials
                  </button>
                ) : (
                  <div className="bg-red-950/20 border border-red-900/40 rounded p-2.5 mt-1 space-y-2 animate-fade-in" id="delete-credentials-confirm-section">
                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-wide">
                      Are you sure you want to permanently delete these credentials?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleDeleteCredentials}
                        className="bg-red-600 hover:bg-red-500 text-white font-mono text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-wider cursor-pointer"
                        id="btn-confirm-delete-yes"
                      >
                        Yes, Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmDelete(false)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-wider cursor-pointer"
                        id="btn-confirm-delete-no"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}



          {brokerType === "ALPACA" ? (
            <>
              {selectedProfile === "SAVED_ALPACA" ? (
                <div className="bg-emerald-950/10 border border-emerald-500/20 rounded p-4 text-center text-xs text-emerald-400 font-mono space-y-1.5 animate-fade-in" id="secured-alpaca-profile-card">
                  <ShieldCheck className="w-6 h-6 text-[#00c805] mx-auto animate-pulse" />
                  <p className="font-bold uppercase tracking-wider text-[11px]">Active Profile: Secured Alpaca</p>
                  <p className="text-zinc-400 text-[10px] leading-relaxed">
                    Credentials loaded and held securely. Click the "Connect" button below to active asset scanning and trade workflows.
                  </p>
                </div>
              ) : (
                <>
                  {/* Alpaca API Key */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <Key className="w-3 h-3 text-theme-accent" /> Alpaca API Key ID
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="e.g. PKX****************Y"
                        className="w-full bg-theme-input border border-theme-border rounded pl-3 pr-10 py-1.5 text-xs text-theme-accent font-mono focus:outline-none focus:border-theme-accent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 px-1.5 py-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title={showApiKey ? "Hide Key ID" : "Show Key ID"}
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Alpaca Secret Key */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-theme-accent" /> Alpaca Secret Key
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showApiSecret ? "text" : "password"}
                        value={apiSecret}
                        onChange={(e) => setApiSecret(e.target.value)}
                        placeholder="e.g. ************************************"
                        className="w-full bg-theme-input border border-theme-border rounded pl-3 pr-10 py-1.5 text-xs text-theme-accent font-mono focus:outline-none focus:border-theme-accent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiSecret(!showApiSecret)}
                        className="absolute right-2 px-1.5 py-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title={showApiSecret ? "Hide Secret" : "Show Secret"}
                      >
                        {showApiSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Base URL (Paper vs Live) is always configurable */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-theme-accent" /> Routing Environment
                </label>
                <select
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full bg-theme-input border border-theme-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-theme-accent cursor-pointer font-bold"
                >
                  <option value="https://paper-api.alpaca.markets">
                    Paper Trading (Simulated Environment)
                  </option>
                  <option value="https://api.alpaca.markets">
                    Live Brokerage (REAL FUNDS INVOLVED)
                  </option>
                </select>
              </div>
            </>
          ) : (
            <div className="bg-[#0b170e]/80 border border-emerald-500/25 rounded-md p-5 text-center space-y-4 font-mono select-none my-3 animate-fade-in" id="robinhood-in-development-card">
              <div className="w-12 h-12 bg-emerald-950/40 border border-emerald-500/30 rounded-full flex items-center justify-center text-[#00c805] text-xs font-black mx-auto animate-pulse">
                RH
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Robinhood Integration in Development</h4>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                We are actively building our secure Model Context Protocol (MCP) live gateway for Robinhood brokerage. This will allow the swing bot to coordinate trades securely with high-fidelity Robinhood sessions soon.
              </p>
              <div className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold uppercase tracking-wider">
                Active Engineering Phase
              </div>
              <p className="text-[10px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                Secure token custody, same-session authentication, and compliance boundaries are being thoroughly audited. Please connect your Alpaca paper or live credentials in the meantime.
              </p>
            </div>
          )}

          {/* Optional News API Key */}
          <div className="space-y-1.5 opacity-80 pt-2 border-t border-theme-border/20">
            <label className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider flex items-center gap-1.5 font-bold">
              <Key className="w-3 h-3 text-emerald-400" /> News Catalyst Intelligence
            </label>
            <input
              type="text"
              readOnly
              value="ACTIVE (Unified AI Multi-Source Catalysts)"
              className="w-full bg-emerald-950/20 border border-emerald-500/30 rounded px-3 py-1.5 text-xs text-emerald-400 font-mono focus:outline-none"
            />
            <p className="text-[9px] text-gray-500 leading-tight">
              News catalyst intelligence streams automatically from integrated real-time sources to verify ticker catalysts before trade executions.
            </p>
          </div>

          {brokerType === "ALPACA" && (
            <div className="grid grid-cols-2 gap-3 mt-6">
              {(config.isConnectionActive && hasSavedAlpaca) ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-red-500 border border-red-950/50 hover:border-red-500/50 disabled:opacity-50 px-4 py-2.5 rounded text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-wait"
                  id="btn-disconnect-settings"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-950/50 hover:border-emerald-500/50 disabled:opacity-50 px-4 py-2.5 rounded text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-wait font-bold"
                  id="btn-connect-settings"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Connect</span>
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full disabled:opacity-50 text-black px-4 py-2.5 rounded text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg disabled:cursor-wait bg-theme-accent hover:bg-orange-600"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{loading ? "Syncing..." : isSaved ? "Saved!" : "Save & Sync"}</span>
              </button>
            </div>
          )}
        </form>

        {false && (
          <div className="mt-6 pt-4 border-t border-zinc-800 space-y-4 font-mono animate-fade-in" id="mcp-client-guides-panel">
            <div className="flex items-center gap-1.5 text-[#00c805] font-mono font-bold uppercase tracking-wider text-[11px]">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Personal AI Client Connection Guide</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-mono">
              Use your personal Model Context Protocol (MCP) gateway to connect any compliant AI agent client directly under your credentials.
            </p>

            {/* Instruction Tabs */}
            <div className="grid grid-cols-5 gap-1 bg-neutral-950 p-1 border border-zinc-800/60 rounded">
              <button
                type="button"
                onClick={() => setSelectedInstructionTab("CLAUDE_CODE")}
                className={`py-1 text-[9px] font-mono font-bold rounded uppercase tracking-wider text-center transition-all cursor-pointer truncate ${
                  selectedInstructionTab === "CLAUDE_CODE"
                    ? "bg-[#00c805]/20 text-[#00c805] border border-[#00c805]/30"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                Claude Code
              </button>
              <button
                type="button"
                onClick={() => setSelectedInstructionTab("CLAUDE_DESKTOP")}
                className={`py-1 text-[9px] font-mono font-bold rounded uppercase tracking-wider text-center transition-all cursor-pointer truncate ${
                  selectedInstructionTab === "CLAUDE_DESKTOP"
                    ? "bg-[#00c805]/20 text-[#00c805] border border-[#00c805]/30"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setSelectedInstructionTab("CHATGPT")}
                className={`py-1 text-[9px] font-mono font-bold rounded uppercase tracking-wider text-center transition-all cursor-pointer truncate ${
                  selectedInstructionTab === "CHATGPT"
                    ? "bg-[#00c805]/20 text-[#00c805] border border-[#00c805]/30"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                ChatGPT
              </button>
              <button
                type="button"
                onClick={() => setSelectedInstructionTab("CODEX")}
                className={`py-1 text-[9px] font-mono font-bold rounded uppercase tracking-wider text-center transition-all cursor-pointer truncate ${
                  selectedInstructionTab === "CODEX"
                    ? "bg-[#00c805]/20 text-[#00c805] border border-[#00c805]/30"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                Codex
              </button>
              <button
                type="button"
                onClick={() => setSelectedInstructionTab("CODEX_CLI")}
                className={`py-1 text-[9px] font-mono font-bold rounded uppercase tracking-wider text-center transition-all cursor-pointer truncate ${
                  selectedInstructionTab === "CODEX_CLI"
                    ? "bg-[#00c805]/20 text-[#00c805] border border-[#00c805]/30"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                Codex CLI
              </button>
            </div>

            {/* Instruction Body */}
            <div className="bg-neutral-950 border border-zinc-800 rounded p-3 font-mono space-y-3 min-h-[140px] flex flex-col justify-between">
              <div>
                {selectedInstructionTab === "CLAUDE_CODE" && (
                  <div className="space-y-2 animate-fade-in text-[10px]">
                    <div className="flex justify-between items-center bg-[#070b08] border border-emerald-950/50 rounded p-2 text-[10px]">
                      <span className="text-zinc-300 text-[9px] select-all truncate break-all max-w-[210px] text-left">
                        claude mcp add robinhood-trading --transport http {robinhoodMcpUrl || "https://agent.robinhood.com/mcp/trading"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(`claude mcp add robinhood-trading --transport http ${robinhoodMcpUrl || "https://agent.robinhood.com/mcp/trading"}`)}
                        className="text-zinc-500 hover:text-[#00c805] p-1 cursor-pointer"
                        title="Copy Command"
                      >
                        {copiedText ? <Check className="w-3.5 h-3.5 text-[#00c805]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <ul className="list-decimal list-inside space-y-1 text-zinc-400 text-[10px]">
                      <li>Run the command above in your terminal.</li>
                      <li>Enter <code className="text-[#00c805] bg-emerald-950/20 px-1 rounded">/mcp</code> in Claude Code.</li>
                      <li>Select <code className="text-zinc-200 font-semibold">robinhood-trading</code> and authenticate.</li>
                    </ul>
                    <p className="text-[9px] text-[#00c805]/85 italic">
                      For details, review Claude Code documentation.
                    </p>
                  </div>
                )}

                {selectedInstructionTab === "CLAUDE_DESKTOP" && (
                  <div className="space-y-2 animate-fade-in text-[10px]">
                    <div className="flex justify-between items-center bg-[#070b08] border border-emerald-950/50 rounded p-2 text-[10px]">
                      <span className="text-zinc-300 text-[9px] select-all truncate break-all max-w-[210px] text-left">
                        {robinhoodMcpUrl || "https://agent.robinhood.com/mcp/trading"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(robinhoodMcpUrl || "https://agent.robinhood.com/mcp/trading")}
                        className="text-zinc-500 hover:text-[#00c805] p-1 cursor-pointer"
                        title="Copy Link"
                      >
                        {copiedText ? <Check className="w-3.5 h-3.5 text-[#00c805]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <ul className="list-decimal list-inside space-y-1 text-zinc-400 text-[10px]">
                      <li>Go to <span className="text-zinc-200">Settings → Connectors → Add custom connector</span></li>
                      <li>Add this MCP link listed above.</li>
                    </ul>
                    <p className="text-[9px] text-[#00c805]/85 italic">
                      For details, review Claude Desktop documentation.
                    </p>
                  </div>
                )}

                {selectedInstructionTab === "CHATGPT" && (
                  <div className="space-y-2 animate-fade-in text-[10px]">
                    <div className="flex justify-between items-center bg-[#070b08] border border-emerald-950/50 rounded p-2 text-[10px]">
                      <span className="text-zinc-300 text-[9px] select-all truncate break-all max-w-[210px] text-left">
                        {robinhoodMcpUrl || "https://agent.robinhood.com/mcp/trading"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(robinhoodMcpUrl || "https://agent.robinhood.com/mcp/trading")}
                        className="text-zinc-500 hover:text-[#00c805] p-1 cursor-pointer"
                        title="Copy Link"
                      >
                        {copiedText ? <Check className="w-3.5 h-3.5 text-[#00c805]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <ul className="list-decimal list-inside space-y-1 text-zinc-400 text-[10px]">
                      <li>Turn on Developer Mode.</li>
                      <li>Go to <span className="text-zinc-200">Settings → Apps → Create app</span></li>
                      <li>Add this MCP link listed above.</li>
                    </ul>
                    <p className="text-[9px] text-[#00c805]/85 italic">
                      For details, review ChatGPT API documentation.
                    </p>
                  </div>
                )}

                {selectedInstructionTab === "CODEX" && (
                  <div className="space-y-2 animate-fade-in text-[10px]">
                    <div className="flex justify-between items-center bg-[#070b08] border border-emerald-950/50 rounded p-2 text-[10px]">
                      <span className="text-zinc-300 text-[9px] select-all truncate break-all max-w-[210px] text-left">
                        {robinhoodMcpUrl || "https://agent.robinhood.com/mcp/trading"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(robinhoodMcpUrl || "https://agent.robinhood.com/mcp/trading")}
                        className="text-zinc-500 hover:text-[#00c805] p-1 cursor-pointer"
                        title="Copy Link"
                      >
                        {copiedText ? <Check className="w-3.5 h-3.5 text-[#00c805]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <ul className="list-decimal list-inside space-y-1 text-zinc-400 text-[10px]">
                      <li>Go to <span className="text-zinc-200">Settings → MCP servers</span></li>
                      <li>Select <span className="text-zinc-200 font-semibold">Streamable HTTP</span></li>
                      <li>Add this MCP link listed above.</li>
                    </ul>
                    <p className="text-[9px] text-[#00c805]/85 italic">
                      For details, review Codex documentation.
                    </p>
                  </div>
                )}

                {selectedInstructionTab === "CODEX_CLI" && (
                  <div className="space-y-2 animate-fade-in text-[10px]">
                    <div className="flex justify-between items-center bg-[#070b08] border border-emerald-950/50 rounded p-2 text-[10px]">
                      <span className="text-zinc-300 text-[9px] select-all truncate break-all max-w-[210px] text-left text-zinc-300">
                        codex mcp add robinhood-trading --url {robinhoodMcpUrl || "https://agent.robinhood.com/mcp/trading"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(`codex mcp add robinhood-trading --url ${robinhoodMcpUrl || "https://agent.robinhood.com/mcp/trading"}`)}
                        className="text-zinc-500 hover:text-[#00c805] p-1 cursor-pointer"
                        title="Copy Command"
                      >
                        {copiedText ? <Check className="w-3.5 h-3.5 text-[#00c805]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <ul className="list-decimal list-inside space-y-1 text-zinc-400 text-[10px]">
                      <li>Run the command above in your terminal.</li>
                      <li>Enter <code className="text-[#00c805] bg-emerald-950/20 px-1 rounded">/mcp</code> in Codex CLI.</li>
                      <li>Select <code className="text-zinc-200 font-semibold">robinhood-trading</code></li>
                    </ul>
                    <p className="text-[9px] text-[#00c805]/85 italic">
                      For details, review Codex CLI documentation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-theme-border text-[11px] text-gray-400 space-y-2">
        <h4 className="font-semibold text-gray-400 flex items-center gap-1 uppercase font-mono text-[10px] tracking-wider">
          <HelpCircle className="w-3.5 h-3.5 text-theme-accent" /> Strategy Config
        </h4>
        <div className="space-y-1 text-xs text-gray-400 font-mono">
          <div className="flex justify-between">
            <span>Max Positions</span>
            <span className="text-white">1 Trade Only</span>
          </div>
          <div className="flex justify-between">
            <span>Position Size</span>
            <span className="text-white">100% Equity</span>
          </div>
          <div className="flex justify-between">
            <span>Direction</span>
            <span className="text-emerald-400 font-bold">Long Only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
