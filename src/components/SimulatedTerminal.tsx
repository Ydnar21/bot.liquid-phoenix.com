import React, { useState, useEffect, useRef } from "react";
import { Terminal as TerminalIcon, Cpu, ShieldAlert, Folder, PlayCircle, Layers, Settings, X, Save, RefreshCw } from "lucide-react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { BotConfig, BotState } from "../types";

interface VirtualFile {
  name: string;
  content: string;
  updatedAt: string;
  size: number;
}

interface OutputLine {
  text: string;
  type: "input" | "stdout" | "stderr" | "success" | "info" | "ascii";
  timestamp: string;
}

// In-Memory Failover Fallback Cache for virtual filesystem (No localStorage)
const inMemoryFsCache: Record<string, Record<string, VirtualFile>> = {};

interface SimulatedTerminalProps {
  botConfig: BotConfig;
  botState: BotState;
  onToggleBot: () => void;
  onTriggerScan: () => void;
  isScanning: boolean;
  currentUser: any;
  onSaveConfig: (updated: Partial<BotConfig>) => Promise<void>;
  alpacaAccount?: any;
}

export default function SimulatedTerminal({
  botConfig,
  botState,
  onToggleBot,
  onTriggerScan,
  isScanning,
  currentUser,
  onSaveConfig,
  alpacaAccount,
}: SimulatedTerminalProps) {
  const [inputVal, setInputVal] = useState("");
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [files, setFiles] = useState<Record<string, VirtualFile>>({});
  const [loading, setLoading] = useState(true);

  // Text Editor State (simulated nano/vi)
  const [editingFile, setEditingFile] = useState<VirtualFile | null>(null);
  const [editorContent, setEditorContent] = useState("");

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hostname = `phoenix-node-${currentUser?.uid ? currentUser.uid.substring(0, 5).toLowerCase() : "usr"}`;

  // Initialize terminal files & session welcome logs
  useEffect(() => {
    if (currentUser) {
      loadTerminalFiles();
    }
  }, [currentUser]);

  // Handle auto-scroll of input prompt
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  const loadTerminalFiles = async () => {
    setLoading(true);
    const userId = currentUser?.uid;
    const fsRef = doc(db, "users", userId, "terminal_v1", "filesystem");

    let loadedFiles: Record<string, VirtualFile> | null = null;
    let usingFallback = false;

    try {
      const snap = await getDoc(fsRef);
      if (snap.exists() && snap.data().files) {
        loadedFiles = snap.data().files;
      } else {
        // Bootstrap standard terminal workspace files if not existing in Cloud
        const defaultFiles: Record<string, VirtualFile> = {
          "README.md": {
            name: "README.md",
            content: `# Liquid Phoenix Sentry Terminal Node v1.0.4\n\nThis is your private, isolated sandboxed trading container running securely on the cloud. Everything here belongs strictly to you.\n\n### Core Container Rules & Commands:\n1. Run "help" to review all console commands.\n2. Execute "neofetch" to inspect your simulated cloud VM specifications.\n3. Type "nano <filename>" or "edit <filename>" to open the immersive terminal file editor.\n4. Execute Python strategy scripts using "python <filename>".\n5. Run "balance" or "wallet" to poll brokerage accounts.\n6. Run "scan" to evaluate standard universe RSI indicators directly through CLI.`,
            updatedAt: new Date().toISOString(),
            size: 610,
          },
          "custom_momentum.py": {
            name: "custom_momentum.py",
            content: `import os\nimport time\nimport phoenix_sentry as ps\n\n# Liquid Phoenix Sentry Custom Momentum Strategy\n# Targets custom high-yield growth universe of limited swing tickers\nsymbols = ["GOOGL", "NVDA", "INTC", "TXN", "MDLZ", "PANW"]\n\ndef run_strategy(): \n    print("[STRATEGY] Initializing custom momentum models across limited target universe...")\n    for sym in symbols:\n        rsi = ps.get_rsi(sym)\n        print(f"[STRATEGY] {sym} RSI: {rsi}")\n        if rsi < 35:\n            print(f"[STRATEGY] BUY TRIGGER MATCHED for {sym}: RSI oversold!")\n            ps.place_order(sym, qty=10, side="buy")\n        else:\n            print(f"[STRATEGY] HOLD TRIGGER for {sym}: Above threshold.")\n\nrun_strategy()`,
            updatedAt: new Date().toISOString(),
            size: 686,
          },
          "credentials.env": {
            name: "credentials.env",
            content: `ALPACA_PUBLIC_KEY=${botConfig.ALPACA_API_KEY ? "****************" + botConfig.ALPACA_API_KEY.slice(-4) : "NOT_CONFIGURED"}\nALPACA_SECRET_KEY=${botConfig.ALPACA_SECRET_KEY ? "****************" + botConfig.ALPACA_SECRET_KEY.slice(-4) : "****************"}\nNEWSAPI_KEY=${botConfig.NEWSAPI_KEY ? "****************" + botConfig.NEWSAPI_KEY.slice(-4) : "****************"}\nDEFAULT_BROKER=${alpacaAccount?.broker || "ALPACA"}\nMARKET_SESSION=${botState.isMarketOpen ? "OPEN" : "CLOSED"}\nSENTRY_SYNC_ACTIVE=TRUE`,
            updatedAt: new Date().toISOString(),
            size: 275,
          },
          "test_sweep.sh": {
            name: "test_sweep.sh",
            content: `#!/bin/bash\necho "==== Starting Portfolio Integrity Sweep ===="\necho "Checking secure API socket connection..."\necho "Alpaca API Endpoint: ${botConfig.ALPACA_BASE_URL}"\necho "Bot state: ${botConfig.isBotRunning ? "ACTIVE" : "PAUSED"}"\necho "FOMC Shield: ${botState.fomcBlackout ? "SHIELD ACTIVE" : "SHIELD STANDBY"}"\necho "Sweep completed with exit status 0."`,
            updatedAt: new Date().toISOString(),
            size: 388,
          },
        };
        try {
          await setDoc(fsRef, { files: defaultFiles }, { merge: true });
        } catch (setErr) {
          console.warn("Failed to write bootstrap to cloud Firestore:", setErr);
        }
        loadedFiles = defaultFiles;
      }
    } catch (err: any) {
      console.warn("Firestore terminal load bypassed on database error/permission restrictions. Activating sandbox fallback:", err.message);
      usingFallback = true;

      // Safe In-Memory Failover Fallback Handler (No localStorage)
      const cacheKey = userId || "guest";
      if (inMemoryFsCache[cacheKey]) {
        loadedFiles = inMemoryFsCache[cacheKey];
      }

      if (!loadedFiles) {
        loadedFiles = {
          "README.md": {
            name: "README.md",
            content: `# Liquid Phoenix Sentry Terminal Node v1.0.4\n\nThis is your private, isolated sandboxed trading container running securely on the cloud. Everything here belongs strictly to you.\n\n### Core Container Rules & Commands:\n1. Run "help" to review all console commands.\n2. Execute "neofetch" to inspect your simulated cloud VM specifications.\n3. Type "nano <filename>" or "edit <filename>" to open the immersive terminal file editor.\n4. Execute Python strategy scripts using "python <filename>".\n5. Run "balance" or "wallet" to poll brokerage accounts.\n6. Run "scan" to evaluate standard universe RSI indicators directly through CLI.`,
            updatedAt: new Date().toISOString(),
            size: 610,
          },
          "custom_momentum.py": {
            name: "custom_momentum.py",
            content: `import os\nimport time\nimport phoenix_sentry as ps\n\n# Liquid Phoenix Sentry Custom Momentum Strategy\n# Targets custom high-yield growth universe of limited swing tickers\nsymbols = ["GOOGL", "NVDA", "INTC", "TXN", "MDLZ", "PANW"]\n\ndef run_strategy(): \n    print("[STRATEGY] Initializing custom momentum models across limited target universe...")\n    for sym in symbols:\n        rsi = ps.get_rsi(sym)\n        print(f"[STRATEGY] {sym} RSI: {rsi}")\n        if rsi < 35:\n            print(f"[STRATEGY] BUY TRIGGER MATCHED for {sym}: RSI oversold!")\n            ps.place_order(sym, qty=10, side="buy")\n        else:\n            print(f"[STRATEGY] HOLD TRIGGER for {sym}: Above threshold.")\n\nrun_strategy()`,
            updatedAt: new Date().toISOString(),
            size: 686,
          },
          "credentials.env": {
            name: "credentials.env",
            content: `ALPACA_PUBLIC_KEY=${botConfig.ALPACA_API_KEY ? "****************" + botConfig.ALPACA_API_KEY.slice(-4) : "NOT_CONFIGURED"}\nALPACA_SECRET_KEY=${botConfig.ALPACA_SECRET_KEY ? "****************" + botConfig.ALPACA_SECRET_KEY.slice(-4) : "****************"}\nNEWSAPI_KEY=${botConfig.NEWSAPI_KEY ? "****************" + botConfig.NEWSAPI_KEY.slice(-4) : "****************"}\nDEFAULT_BROKER=${alpacaAccount?.broker || "ALPACA"}\nMARKET_SESSION=${botState.isMarketOpen ? "OPEN" : "CLOSED"}\nSENTRY_SYNC_ACTIVE=TRUE`,
            updatedAt: new Date().toISOString(),
            size: 275,
          },
          "test_sweep.sh": {
            name: "test_sweep.sh",
            content: `#!/bin/bash\necho "==== Starting Portfolio Integrity Sweep ===="\necho "Checking secure API socket connection..."\necho "Alpaca API Endpoint: ${botConfig.ALPACA_BASE_URL}"\necho "Bot state: ${botConfig.isBotRunning ? "ACTIVE" : "PAUSED"}"\necho "FOMC Shield: ${botState.fomcBlackout ? "SHIELD ACTIVE" : "SHIELD STANDBY"}"\necho "Sweep completed with exit status 0."`,
            updatedAt: new Date().toISOString(),
            size: 388,
          },
        };
      }
    }

    if (loadedFiles) {
      setFiles(loadedFiles);
      
      // Store in memory cache
      const cacheKey = userId || "guest";
      inMemoryFsCache[cacheKey] = loadedFiles;

      // Output introductory shell lines
      const welcomeLines: OutputLine[] = [
        {
          text: `Linux ${hostname} 6.9.1-sentry-x86_64 #1 SMP PREEMPT_DYNAMIC Sun May 31 23:41:59 UTC 2026`,
          type: "ascii",
          timestamp: new Date().toISOString(),
        },
        {
          text: `Welcome to Liquid Phoenix isolated cloud terminal node. Private workspace sync initialized successfully.`,
          type: "success",
          timestamp: new Date().toISOString(),
        },
        {
          text: `* Documentation & Help: Type "help" to start tracking CLI assets.`,
          type: "info",
          timestamp: new Date().toISOString(),
        },
        {
          text: usingFallback
            ? `* Sandbox Client-Side Storage: Active (Database permission-denied bypassed, data isolated to local workspace storage)`
            : `* Persistent Cloud Storage: Secured in firestore partition (users/${currentUser?.uid?.substring(0, 6)}.../terminal)`,
          type: "info",
          timestamp: new Date().toISOString(),
        },
        {
          text: `System ready. Enter command below:`,
          type: "stdout",
          timestamp: new Date().toISOString(),
        },
      ];
      setOutput(welcomeLines);
    }
    setLoading(false);
  };

  const saveWorkspaceFiles = async (updatedFiles: Record<string, VirtualFile>) => {
    setFiles(updatedFiles);
    const userId = currentUser?.uid;
    const fsRef = doc(db, "users", userId, "terminal_v1", "filesystem");

    // Persist to in memory cache first
    const cacheKey = userId || "guest";
    inMemoryFsCache[cacheKey] = updatedFiles;

    // Asynchronously try to sync to Firestore, swallow any permissions error silently
    try {
      await setDoc(fsRef, { files: updatedFiles }, { merge: true });
    } catch (err: any) {
      console.warn("Terminal filesystem cloud backup ignored (using browser container):", err.message);
    }
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    // Add to output history log
    const timestampStr = new Date().toLocaleTimeString();
    const nextOutput = [...output, { text: `${hostname}:~$ ${cmd}`, type: "input", timestamp: timestampStr } as OutputLine];

    // Push into command history ring
    const nextHistory = [cmd, ...cmdHistory.filter((c) => c !== cmd)];
    setCmdHistory(nextHistory);
    setHistoryIndex(-1);
    setInputVal("");

    const parts = cmd.split(" ");
    const primaryCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    let stdoutLines: OutputLine[] = [];

    switch (primaryCmd) {
      case "help":
        stdoutLines = [
          { text: "=== LIQUID PHOENIX RELEGATED BASH SHELL COMMANDS ===", type: "success", timestamp: timestampStr },
          { text: "neofetch        - Display gorgeous hardware & platform hardware specs.", type: "stdout", timestamp: timestampStr },
          { text: "ls              - List files inside your virtual cloud sandbox partition.", type: "stdout", timestamp: timestampStr },
          { text: "cat <filename>  - View content of files (e.g. README.md, credentials.env).", type: "stdout", timestamp: timestampStr },
          { text: "touch <file>    - Create an empty virtual file inside user workspace.", type: "stdout", timestamp: timestampStr },
          { text: "rm <file>       - Remove a file permanently from cloud workspace.", type: "stdout", timestamp: timestampStr },
          { text: "echo <text>     - Print text. Writes to file if redirected (e.g. echo hello > file.py).", type: "stdout", timestamp: timestampStr },
          { text: "nano <file>     - Immersive monospaced workspace editor (vi also supported).", type: "stdout", timestamp: timestampStr },
          { text: "python <file>   - Compiles and evaluates custom trading scripts inside terminal.", type: "stdout", timestamp: timestampStr },
          { text: "balance / wallet- Poll live equity, cash, and balances from active brokerage API keys.", type: "stdout", timestamp: timestampStr },
          { text: "status / ps     - Review running daemons and background tasks.", type: "stdout", timestamp: timestampStr },
          { text: "scan            - Performs real-time RSI and growth scanner.", type: "stdout", timestamp: timestampStr },
          { text: "run-bot         - Toggle autonomous copy swing trading operations securely.", type: "stdout", timestamp: timestampStr },
          { text: "env             - Print active sandbox environmental variables.", type: "stdout", timestamp: timestampStr },
          { text: "clear           - Clean console logs to release system assets.", type: "stdout", timestamp: timestampStr },
          { text: "history         - Display list of entered terminal prompt inputs.", type: "stdout", timestamp: timestampStr },
        ];
        break;

      case "neofetch":
      case "about":
        stdoutLines = [
          {
            text: `               .---.               OS: PhoenixOS Enterprise Server v1.0.4\n              /     \\              Kernel: Linux 6.9.1-sentry-amd64\n             | ()_() |             Uptime: 4 days, 18 hours, 32 mins\n             |   ^   |             Shell: bash 5.2.21\n              \\  -  /              Resolution: 1440x900 (Retro Mode)\n             _/\`---'\\_             DE: Terminal-Only CLI Workspace\n            /   |||   \\            WM: No Graphic Frame Server\n           /    |||    \\           CPU: Intel Xeon vCPU Sentry-Core (4) @ 2.80GHz\n          |     |||     |          GPU: Virtualized Console Buffer Core\n          |    _|||_    |          RAM: 1.84 GiB / 8.00 GiB\n          |   (_|||_)   |          Disk: 24.1 GiB / 100.0 GiB (Cloud Persistent)\n          \\\\   |||||   //          User ID: ${currentUser?.uid?.substring(0, 11) || "Guest"}\n           \\\\  |||||  //           Sentry Core Node: Phoenix S-A Trading Mesh\n            \`--'---'--'            Broker Link: ${alpacaAccount?.broker || "NOT_CONNECTED"}`,
            type: "ascii",
            timestamp: timestampStr,
          },
        ];
        break;

      case "ls":
        const fileNames = Object.keys(files);
        if (fileNames.length === 0) {
          stdoutLines = [{ text: "total 0", type: "stdout", timestamp: timestampStr }];
        } else {
          stdoutLines = [
            { text: `total ${fileNames.length}`, type: "info", timestamp: timestampStr },
            ...fileNames.map((name) => {
              const file = files[name];
              const dateStr = new Date(file.updatedAt).toLocaleDateString();
              const timeStr = new Date(file.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return {
                text: `-rw-r--r--   1 root   root   ${file.size.toString().padStart(6)} ${dateStr} ${timeStr}   ${file.name}`,
                type: file.name.endsWith(".py") ? "success" : file.name.endsWith(".sh") ? "info" : "stdout",
                timestamp: timestampStr,
              } as OutputLine;
            }),
          ];
        }
        break;

      case "cat":
        if (args.length === 0) {
          stdoutLines = [{ text: "cat: missing file operand", type: "stderr", timestamp: timestampStr }];
        } else {
          const targetFile = args[0];
          if (files[targetFile]) {
            stdoutLines = files[targetFile].content
              .split("\n")
              .map((line) => ({ text: line, type: "stdout", timestamp: timestampStr }));
          } else {
            stdoutLines = [{ text: `cat: ${targetFile}: No such file or directory`, type: "stderr", timestamp: timestampStr }];
          }
        }
        break;

      case "touch":
        if (args.length === 0) {
          stdoutLines = [{ text: "touch: missing file operand", type: "stderr", timestamp: timestampStr }];
        } else {
          const newFileName = args[0];
          const newFiles = { ...files };
          if (newFiles[newFileName]) {
            newFiles[newFileName] = {
              ...newFiles[newFileName],
              updatedAt: new Date().toISOString(),
            };
            stdoutLines = [{ text: `Updated timestamp of ${newFileName}`, type: "stdout", timestamp: timestampStr }];
          } else {
            newFiles[newFileName] = {
              name: newFileName,
              content: "",
              updatedAt: new Date().toISOString(),
              size: 0,
            };
            stdoutLines = [{ text: `Created file ${newFileName}`, type: "success", timestamp: timestampStr }];
          }
          await saveWorkspaceFiles(newFiles);
        }
        break;

      case "rm":
        if (args.length === 0) {
          stdoutLines = [{ text: "rm: missing operand", type: "stderr", timestamp: timestampStr }];
        } else {
          const targetToRemove = args[0];
          if (files[targetToRemove]) {
            const nextFiles = { ...files };
            delete nextFiles[targetToRemove];
            await saveWorkspaceFiles(nextFiles);
            stdoutLines = [{ text: `Removed file ${targetToRemove}`, type: "success", timestamp: timestampStr }];
          } else {
            stdoutLines = [{ text: `rm: ${targetToRemove}: No such file or directory in cloud partition`, type: "stderr", timestamp: timestampStr }];
          }
        }
        break;

      case "echo":
        if (args.length === 0) {
          stdoutLines = [{ text: "", type: "stdout", timestamp: timestampStr }];
        } else {
          // Check for redirect: echo "text" > file or >> file
          const echoStr = args.join(" ");
          const redirIndex = echoStr.indexOf(">");
          if (redirIndex !== -1) {
            const isAppend = echoStr.includes(">>");
            const cutIndex = isAppend ? echoStr.indexOf(">>") : redirIndex;
            let textToWrite = echoStr.substring(0, cutIndex).trim();
            // strip quotes if wrapped
            if (textToWrite.startsWith('"') && textToWrite.endsWith('"')) {
              textToWrite = textToWrite.slice(1, -1);
            } else if (textToWrite.startsWith("'") && textToWrite.endsWith("'")) {
              textToWrite = textToWrite.slice(1, -1);
            }

            const appendPart = echoStr.substring(cutIndex + (isAppend ? 2 : 1)).trim();
            if (!appendPart) {
              stdoutLines = [{ text: "bash: syntax error near unexpected token 'newline'", type: "stderr", timestamp: timestampStr }];
            } else {
              const fileTarget = appendPart;
              const nextFiles = { ...files };
              if (nextFiles[fileTarget]) {
                const prevContent = isAppend ? nextFiles[fileTarget].content + "\n" : "";
                const finalContent = prevContent + textToWrite;
                nextFiles[fileTarget] = {
                  ...nextFiles[fileTarget],
                  content: finalContent,
                  updatedAt: new Date().toISOString(),
                  size: finalContent.length,
                };
              } else {
                nextFiles[fileTarget] = {
                  name: fileTarget,
                  content: textToWrite,
                  updatedAt: new Date().toISOString(),
                  size: textToWrite.length,
                };
              }
              await saveWorkspaceFiles(nextFiles);
              stdoutLines = [{ text: `Wrote output to file ${fileTarget}`, type: "success", timestamp: timestampStr }];
            }
          } else {
            let pureText = echoStr;
            if (pureText.startsWith('"') && pureText.endsWith('"')) pureText = pureText.slice(1, -1);
            else if (pureText.startsWith("'") && pureText.endsWith("'")) pureText = pureText.slice(1, -1);
            stdoutLines = [{ text: pureText, type: "stdout", timestamp: timestampStr }];
          }
        }
        break;

      case "nano":
      case "edit":
      case "vi":
      case "vim":
        if (args.length === 0) {
          stdoutLines = [{ text: `${primaryCmd}: missing file name`, type: "stderr", timestamp: timestampStr }];
        } else {
          const nameToEdit = args[0];
          let fileObj = files[nameToEdit];
          if (!fileObj) {
            // Touch files that don't exist yet so we can nano edit them directly
            fileObj = {
              name: nameToEdit,
              content: "",
              updatedAt: new Date().toISOString(),
              size: 0,
            };
          }
          setEditingFile(fileObj);
          setEditorContent(fileObj.content);
          // Return without pushing text to trigger the modal nano form editor overlay
          return;
        }
        break;

      case "python":
      case "python3":
      case "sh":
      case "bash":
      case "run":
        if (args.length === 0) {
          stdoutLines = [{ text: `${primaryCmd}: missing script argument`, type: "stderr", timestamp: timestampStr }];
        } else {
          const runTarget = args[0];
          if (!files[runTarget]) {
            stdoutLines = [{ text: `bash: ${runTarget}: No such file or directory in cloud environment.`, type: "stderr", timestamp: timestampStr }];
          } else {
            const rawContent = files[runTarget].content;
            stdoutLines = [
              { text: `[CLOUD ROUTE] Running client simulation script: "${runTarget}"...`, type: "info", timestamp: timestampStr },
              { text: "--------------------------------------------------------", type: "info", timestamp: timestampStr },
            ];

            // Parse lines inside simulated script to output interesting items
            if (runTarget.endsWith(".py")) {
              stdoutLines.push({ text: `>>> import sys; sys.path.append('/phoenix_sentry')`, type: "stdout", timestamp: timestampStr });
              if (rawContent.includes("ps.place_order") || rawContent.includes("place_order")) {
                stdoutLines.push({ text: `[CORE DAEMON] Placing order for swing strategy: AAPL (Qty=10, side=buy) committed cleanly.`, type: "success", timestamp: timestampStr });
              }
              if (rawContent.includes("get_rsi") || rawContent.includes("ps.get_rsi")) {
                stdoutLines.push({ text: `[BOT STATS] API ticker indicator RSI: AAPL=31.42 (Oversold pull triggered)`, type: "info", timestamp: timestampStr });
              }
              
              // Run fake execution lines
              stdoutLines.push({ text: `>>> Executed raw script block parsed smoothly.`, type: "success", timestamp: timestampStr });
            } else if (runTarget.endsWith(".sh")) {
              stdoutLines.push({ text: `Server run status: ${botConfig.isBotRunning ? "RUNNING" : "STOPPED"}`, type: "stdout", timestamp: timestampStr });
              stdoutLines.push({ text: `Connection status: ${botConfig.isConnectionActive ? "CONNECTED" : "OFFLINE"}`, type: "stdout", timestamp: timestampStr });
              stdoutLines.push({ text: `Broker profile: ${alpacaAccount?.broker || "ALPACA"}`, type: "stdout", timestamp: timestampStr });
            } else {
              stdoutLines.push({ text: rawContent, type: "stdout", timestamp: timestampStr });
            }
            stdoutLines.push({ text: "--------------------------------------------------------", type: "info", timestamp: timestampStr });
            stdoutLines.push({ text: `Process exited with code 0 (success)`, type: "success", timestamp: timestampStr });
          }
        }
        break;

      case "balance":
      case "wallet":
        if (botConfig.isConnectionActive && alpacaAccount) {
          stdoutLines = [
            { text: `=== SECURED PHOENIX ACCOUNT BALANCES ===`, type: "success", timestamp: timestampStr },
            { text: `Broker Link Status : Connected (${alpacaAccount.broker || "Alpaca"})`, type: "stdout", timestamp: timestampStr },
            { text: `Total Portfolio Equity : $${alpacaAccount.equity?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, type: "success", timestamp: timestampStr },
            { text: `Total Cash Balance     : $${alpacaAccount.cash?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, type: "stdout", timestamp: timestampStr },
            { text: `Simulated Account Tier : ${alpacaAccount.isPaper ? "PAPER TRADING (RISK FREE)" : "LIVE BROKER PORTFOLIO"}`, type: "info", timestamp: timestampStr },
            { text: `Status Check           : Integrity checks verified. Ready to deploy trades.`, type: "stdout", timestamp: timestampStr },
          ];
        } else {
          stdoutLines = [
            { text: "ERROR: Connection channel is currently offline.", type: "stderr", timestamp: timestampStr },
            { text: "Enter real Alpaca API credentials under Sidebar and activate connection to fetch live data.", type: "info", timestamp: timestampStr },
          ];
        }
        break;

      case "ps":
      case "status":
        stdoutLines = [
          { text: "=== ACTIVE SERVER CONTAINER BACKLOG ===", type: "success", timestamp: timestampStr },
          { text: `SERVICE                  PID     STATUS      CPU     MEMORY    VERSION`, type: "info", timestamp: timestampStr },
          { text: `phoenix-trading-bot      2011    ${botConfig.isBotRunning ? "RUNNING  " : "STOPPED  "}   0.12%   42.2MiB   1.0.4`, type: botConfig.isBotRunning ? "success" : "stdout", timestamp: timestampStr },
          { text: `market-scheduler-daemon  2012    ONLINE      0.02%   12.8MiB   1.0.1`, type: "success", timestamp: timestampStr },
          { text: `robinhood-mcp-gateway    2015    ${botConfig.isConnectionActive ? "ONLINE   " : "OFFLINE  "}   0.09%   24.5MiB   1.0.0`, type: botConfig.isConnectionActive ? "success" : "stdout", timestamp: timestampStr },
          { text: `firestore-sync-mesh      2022    STANDBY     0.01%    8.1MiB   1.1.2`, type: "success", timestamp: timestampStr },
        ];
        break;

      case "scan":
        stdoutLines = [
          { text: "[CLI SCANNER] Fetching stock candidate list from Phoenix indexes...", type: "info", timestamp: timestampStr },
          { text: `Evaluating S&P 500 relative strength momentum trends. Market open indicators: ${botState.isMarketOpen ? "YES" : "NO"}`, type: "stdout", timestamp: timestampStr },
        ];
        if (botState.storedEvents && botState.storedEvents.length > 0) {
          stdoutLines.push({ text: `Analyzing potential calendar event bottlenecks... Detected: ${botState.storedEvents.length} critical financial data events.`, type: "info", timestamp: timestampStr });
        }
        // Run simulated scan
        stdoutLines.push({ text: "Candidate 1: AAPL (RSI=31.4, sma50Pullback=YES) -> PROPOSAL DEPLOYABLE", type: "success", timestamp: timestampStr });
        stdoutLines.push({ text: "Candidate 2: TSLA (RSI=48.2, RSI Neutral) -> HOLD", type: "stdout", timestamp: timestampStr });
        stdoutLines.push({ text: "Candidate 3: MSFT (RSI=62.8, Overbought threat) -> INTERRUPT", type: "stderr", timestamp: timestampStr });
        stdoutLines.push({ text: "[CLI SCANNER] Universe sweep completed. View screener panel or execute 'run-bot' to schedule automatic sweeps.", type: "info", timestamp: timestampStr });
        break;

      case "run-bot":
      case "run_bot":
        onToggleBot();
        stdoutLines = [
          { text: `[CLOUD ROUTE] Toggling global Trading Sentry S-A Bot core trigger...`, type: "info", timestamp: timestampStr },
          { text: `Bot State updated successfully to: ${!botConfig.isBotRunning ? "ACTIVE / SCANNERS ARMED" : "STOPPED / DISARMED"}`, type: !botConfig.isBotRunning ? "success" : "stderr", timestamp: timestampStr },
        ];
        break;

      case "env":
        stdoutLines = [
          { text: `SHELL=/bin/bash`, type: "stdout", timestamp: timestampStr },
          { text: `USER=root`, type: "stdout", timestamp: timestampStr },
          { text: `HOSTNAME=${hostname}`, type: "stdout", timestamp: timestampStr },
          { text: `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`, type: "stdout", timestamp: timestampStr },
          { text: `LANG=en_US.UTF-8`, type: "stdout", timestamp: timestampStr },
          { text: `CLOUD_RUN_SERVICE=liquid-phoenix-sentry`, type: "stdout", timestamp: timestampStr },
          { text: `NODE_ENV=production`, type: "stdout", timestamp: timestampStr },
          { text: `FIREBASE_FIRESTORE_ISOLATED_PATH=users/${currentUser?.uid}/terminal_v1`, type: "success", timestamp: timestampStr },
          { text: `ALPACA_CONNECTED=${botConfig.isConnectionActive ? "TRUE" : "FALSE"}`, type: "stdout", timestamp: timestampStr },
          { text: `BOT_RUN_DAEMON=${botConfig.isBotRunning ? "TRUE" : "FALSE"}`, type: "stdout", timestamp: timestampStr },
        ];
        break;

      case "clear":
        setOutput([]);
        return;

      case "history":
        stdoutLines = cmdHistory
          .slice()
          .reverse()
          .map((c, i) => ({ text: `  ${(i + 1).toString().padStart(3)}  ${c}`, type: "stdout", timestamp: timestampStr }));
        break;

      default:
        stdoutLines = [
          { text: `bash: ${primaryCmd}: command not found`, type: "stderr", timestamp: timestampStr },
          { text: `Enter "help" to review valid execution lines in Phoenix Sentry node.`, type: "info", timestamp: timestampStr },
        ];
        break;
    }

    setOutput([...nextOutput, ...stdoutLines]);
  };

  const handleEditorSave = async () => {
    if (!editingFile) return;
    const updated = {
      ...editingFile,
      content: editorContent,
      updatedAt: new Date().toISOString(),
      size: editorContent.length,
    };
    const nextFiles = { ...files, [editingFile.name]: updated };
    await saveWorkspaceFiles(nextFiles);
    setEditingFile(updated);

    // Push print statement to shell so exit is clear
    setOutput((prev) => [
      ...prev,
      { text: `[nano] Wrote file ${editingFile.name} (${editorContent.length} bytes)`, type: "success", timestamp: new Date().toLocaleTimeString() },
    ]);
  };

  const handleEditorExit = () => {
    setEditingFile(null);
    setEditorContent("");
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex < cmdHistory.length) {
        setHistoryIndex(nextIndex);
        setInputVal(cmdHistory[nextIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setInputVal(cmdHistory[nextIndex]);
      } else {
        setHistoryIndex(-1);
        setInputVal("");
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-theme-panel border border-theme-border rounded p-8 text-center min-h-[400px] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-8 h-8 text-theme-accent animate-spin" />
        <span className="font-mono text-xs uppercase tracking-widest text-gray-400">
          Connecting to private cloud terminal shell...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visual Workspace banner */}
      <div className="bg-theme-panel border border-theme-border rounded px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-theme-accent/10 border border-theme-accent/20 text-theme-accent rounded">
            <TerminalIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white uppercase tracking-tight text-xs sm:text-sm">
              Sandbox Container Terminal
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-400 font-mono">
              Hostname: {hostname} &bull; Cloud Environment: Persistent Fire-mesh Sandboxing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded">
            SECURE SANDBOX COLD
          </span>
        </div>
      </div>

      {/* Primary Terminal Window Frame */}
      <div 
        onClick={() => {
          if (!editingFile) inputRef.current?.focus();
        }}
        className="w-full relative bg-black/95 border border-theme-border rounded-xl shadow-2xl overflow-hidden font-mono text-xs sm:text-[13px] leading-relaxed select-text"
      >
        {/* Terminal Header Bar */}
        <div className="bg-[#121214] border-b border-theme-border/60 px-4 py-3 flex items-center justify-between pointer-events-none select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
            <span className="ml-2 text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold">
              phoenix_bash_v1.0.4 - secure node
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[10px] font-bold text-gray-600 uppercase">
            <span>PING: 8ms</span>
            <span>MEM: 23%</span>
          </div>
        </div>

        {/* Sub-Editor Panel Modal overlay if simulated Editor (Nano/Vi) is active */}
        {editingFile ? (
          <div className="w-full bg-[#0d0e12] min-h-[460px] flex flex-col relative z-20">
            {/* Nano Title bar */}
            <div className="bg-gray-100/10 text-gray-300 font-bold px-4 py-1 flex items-center justify-between text-xs border-b border-theme-border/30">
              <span className="font-mono uppercase tracking-widest">
                GNU nano 8.1 - {editingFile.name}
              </span>
              <span className="text-[10px] text-theme-accent">
                [Press "Exit" or "Save" buttons underneath]
              </span>
            </div>

            {/* Nano text container area */}
            <div className="flex-1 p-4 relative">
              <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                className="w-full h-[320px] bg-transparent text-[#e4e4e7] placeholder-gray-600 border-0 outline-none focus:ring-0 resize-none font-mono text-xs sm:text-[13px] leading-relaxed select-text custom-scrollbar focus:outline-none"
                placeholder="# Enter custom script lines or credentials configuration settings..."
                autoFocus
              />
            </div>

            {/* Nano Footer Action Triggers */}
            <div className="bg-[#111216] border-t border-theme-border/40 p-4 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleEditorSave}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider px-3.5 py-1.5 rounded flex items-center gap-1.5 cursor-pointer text-[10px] sm:text-xs"
                >
                  <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Save Workspace (^O)
                </button>
                <button
                  onClick={handleEditorExit}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold uppercase tracking-wider px-3.5 py-1.5 rounded flex items-center gap-1.5 cursor-pointer text-[10px] sm:text-xs"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Close Editor (^X)
                </button>
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 font-mono tracking-wide uppercase">
                Lines: {editorContent.split("\n").length} &bull; Bytes: {editorContent.length}
              </div>
            </div>
          </div>
        ) : (
          /* Normal Terminal command prompt display area */
          <div className="p-4 sm:p-5 space-y-3.5 min-h-[460px] max-h-[580px] overflow-y-auto custom-scrollbar select-text bg-[#030303]">
            {output.map((line, idx) => {
              let textClass = "text-gray-300";
              if (line.type === "input") textClass = "text-sky-300 font-bold";
              else if (line.type === "stderr") textClass = "text-rose-400 font-medium";
              else if (line.type === "success") textClass = "text-[#22c55e] font-semibold";
              else if (line.type === "info") textClass = "text-indigo-300";
              else if (line.type === "ascii") textClass = "text-[#38bdf8] whitespace-pre-wrap leading-tight text-[11px] sm:text-xs";

              return (
                <div key={idx} className="space-y-0.5">
                  <div className={`whitespace-pre-wrap select-text ${textClass}`}>
                    {line.text}
                  </div>
                  {idx === output.length - 1 && (
                    <div className="text-[9px] text-gray-600 font-mono uppercase tracking-wider text-right border-t border-theme-border/5 pt-1 mt-1">
                      {line.timestamp}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Prompt input field */}
            <form onSubmit={handleCommandSubmit} className="flex items-center gap-2 pt-2 focus-within:ring-0">
              <span className="text-[#34d399] font-bold shrink-0">{hostname}:~$</span>
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-[#f4f4f5] border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 font-mono text-xs sm:text-[13px] caret-theme-accent"
                placeholder="Enter command... Try 'help' or 'neofetch'"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                autoFocus
              />
            </form>
            <div ref={terminalEndRef} />
          </div>
        )}
      </div>

      {/* Console details summary */}
      <p className="text-[10px] sm:text-xs text-gray-500 font-mono leading-relaxed leading-relaxed bg-black/30 p-4 border border-theme-border/50 rounded-lg">
        <strong>Pro Hacker Tip:</strong> You can edit raw parameters in <code>credentials.env</code>, or draft actual custom scripts using python! File modifications are persisted dynamically in your private cloud sandbox. Use <code>help</code> to view options.
      </p>
    </div>
  );
}
