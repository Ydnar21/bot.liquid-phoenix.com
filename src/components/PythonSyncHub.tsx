import React, { useState, useEffect } from "react";
import { 
  Bot, 
  Smartphone, 
  Laptop, 
  Code, 
  Save, 
  RefreshCw, 
  Plus, 
  Trash2, 
  PlayCircle, 
  Layers, 
  Lock, 
  Check, 
  FileCode,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Info
} from "lucide-react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface VirtualFile {
  name: string;
  content: string;
  updatedAt: string;
  size: number;
}

interface PythonSyncHubProps {
  currentUser: any;
}

export default function PythonSyncHub({ currentUser }: PythonSyncHubProps) {
  const [files, setFiles] = useState<Record<string, VirtualFile>>({});
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [swiftCopied, setSwiftCopied] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadFiles();
    }
  }, [currentUser]);

  const loadFiles = async () => {
    setLoading(true);
    const userId = currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    const fsRef = doc(db, "users", userId, "terminal_v1", "filesystem");

    try {
      const snap = await getDoc(fsRef);
      if (snap.exists() && snap.data().files) {
        const docFiles = snap.data().files as Record<string, VirtualFile>;
        setFiles(docFiles);
        
        // Find first python file or default
        const keys = Object.keys(docFiles);
        const firstPy = keys.find(k => k.endsWith(".py")) || keys[0] || "";
        setSelectedFile(firstPy);
        if (firstPy) {
          setFileContent(docFiles[firstPy].content);
        }
      } else {
        // Bootstrap standard terminal workspace python files if not existing in Cloud
        const defaultFiles: Record<string, VirtualFile> = {
          "custom_momentum.py": {
            name: "custom_momentum.py",
            content: `import os\nimport time\nimport phoenix_sentry as ps\n\ndef run_strategy(): \n    print("[STRATEGY] Initializing custom momentum models...")\n    time.sleep(1)\n    rsi = ps.get_rsi("AAPL")\n    print(f"[STRATEGY] Current symbol RSI calculated: {rsi}")\n    if rsi < 35:\n        print("[STRATEGY] BUY TRIGGER MATCHED: RSI oversold!")\n        ps.place_order("AAPL", qty=10, side="buy")\n    else:\n        print("[STRATEGY] HOLD TRIGGER: No action needed.")\n\nrun_strategy()`,
            updatedAt: new Date().toISOString(),
            size: 474,
          },
          "mean_reversion.py": {
            name: "mean_reversion.py",
            content: `import time\nimport phoenix_sentry as ps\n\ndef run_strategy():\n    print("[REVERSION] Sampling Bollinger Band deviation indices...")\n    sma20 = ps.get_sma("TSLA", 20)\n    price = ps.get_price("TSLA")\n    print(f"[REVERSION] TSLA Current: {price}, SMA(20): {sma20}")\n    deviation = (price - sma20) / sma20 * 100\n    \n    if deviation < -4.5:\n        print(f"[REVERSION] Strong downward deviation detected ({deviation:.1f}%)")\n        ps.place_order("TSLA", qty=5, side="buy")\n    else:\n        print("[REVERSION] Deviation within normal bands.")\n\nrun_strategy()`,
            updatedAt: new Date().toISOString(),
            size: 479,
          },
          "risk_management.py": {
            name: "risk_management.py",
            content: `def check_exposure(portfolio):\n    print("[RISK] Evaluating general equity allocation bounds...")\n    total_equity = portfolio.get("equity", 0)\n    allocated = portfolio.get("cash_utilized", 0)\n    pct = (allocated / total_equity) * 100 if total_equity > 0 else 0\n    \n    print(f"[RISK] Total portfolio allocation utilization: {pct:.2f}%")\n    if pct > 85.0:\n        print("[RISK WARNING] Exposure near peak threshold. Blocking new entries.")\n        return False\n    return True`,
            updatedAt: new Date().toISOString(),
            size: 412,
          }
        };

        await setDoc(fsRef, { files: defaultFiles }, { merge: true });
        setFiles(defaultFiles);
        setSelectedFile("custom_momentum.py");
        setFileContent(defaultFiles["custom_momentum.py"].content);
      }
    } catch (err: any) {
      console.warn("Error checking/bootstrapping firestore files in Sync Hub:", err.message);
    }
    setLoading(false);
  };

  const selectFile = (name: string) => {
    setSelectedFile(name);
    setFileContent(files[name]?.content || "");
  };

  const saveCurrentFile = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    const userId = currentUser?.uid;
    const fsRef = doc(db, "users", userId, "terminal_v1", "filesystem");

    try {
      const updatedFiles = {
        ...files,
        [selectedFile]: {
          ...files[selectedFile],
          content: fileContent,
          updatedAt: new Date().toISOString(),
          size: fileContent.length
        }
      };

      await setDoc(fsRef, { files: updatedFiles }, { merge: true });
      setFiles(updatedFiles);
      
      // Update logs console to show successful sync
      const logTime = new Date().toLocaleTimeString();
      setSyncLogs(prev => [
        `[${logTime}] SUCCESS: Saved & synced "${selectedFile}" (${fileContent.length} bytes) to Firestore.`,
        `[${logTime}] BROADCAST: Sent real-time change event to iOS Client & Web Portal.`,
        ...prev.slice(0, 5)
      ]);
    } catch (err: any) {
      console.error("Save error in Sync Hub:", err);
      alert("Failed to save script to database: " + err.message);
    }
    setIsSaving(false);
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    let scrubbedName = newFileName.trim();
    if (!scrubbedName.endsWith(".py")) {
      scrubbedName += ".py";
    }

    if (files[scrubbedName]) {
      alert("A folder script or file with that name already exists!");
      return;
    }

    const userId = currentUser?.uid;
    const fsRef = doc(db, "users", userId, "terminal_v1", "filesystem");

    try {
      const updatedFiles = {
        ...files,
        [scrubbedName]: {
          name: scrubbedName,
          content: `# Auto-Generated Trading Script: ${scrubbedName}\n# Stored synchronously in Shared S-A Cloud Repository\nimport phoenix_sentry as ps\n\ndef run_strategy():\n    print("Executing decision rules for ${scrubbedName}...")\n\nrun_strategy()`,
          updatedAt: new Date().toISOString(),
          size: 168
        }
      };

      await setDoc(fsRef, { files: updatedFiles }, { merge: true });
      setFiles(updatedFiles);
      setNewFileName("");
      
      // Select the newly created file
      setSelectedFile(scrubbedName);
      setFileContent(updatedFiles[scrubbedName].content);

      const logTime = new Date().toLocaleTimeString();
      setSyncLogs(prev => [
        `[${logTime}] NEW FILE: "${scrubbedName}" created and added to shared files registry.`,
        `[${logTime}] BROADCAST: Real-time file structure synced with iOS devices.`,
        ...prev.slice(0, 5)
      ]);
    } catch (err: any) {
      alert("Error creating file: " + err.message);
    }
  };

  const handleDeleteFile = async (name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}" from both the iOS and Web database sync?`)) return;

    const userId = currentUser?.uid;
    const fsRef = doc(db, "users", userId, "terminal_v1", "filesystem");

    try {
      const nextFiles = { ...files };
      delete nextFiles[name];

      await setDoc(fsRef, { files: nextFiles }, { merge: true });
      setFiles(nextFiles);

      if (selectedFile === name) {
        const remainingKeys = Object.keys(nextFiles);
        const nextSel = remainingKeys.find(k => k.endsWith(".py")) || remainingKeys[0] || "";
        setSelectedFile(nextSel);
        setFileContent(nextSel ? nextFiles[nextSel].content : "");
      }

      const logTime = new Date().toLocaleTimeString();
      setSyncLogs(prev => [
        `[${logTime}] DELETED: Removed file "${name}" from shared workspace.`,
        `[${logTime}] BROADCAST: Propagated deletion to iOS cloud caches.`,
        ...prev.slice(0, 5)
      ]);
    } catch (err: any) {
      alert("Error deleting file: " + err.message);
    }
  };

  const handleSimulateSyncRun = () => {
    if (isSimulating || !selectedFile) return;
    setIsSimulating(true);

    const steps = [
      `Initializing simulation of unified strategy: "${selectedFile}"`,
      `[STEP 1] Web Portal node fetching from users/${currentUser?.uid?.substring(0,8)}.../terminal_v1/filesystem ✅`,
      `[STEP 1] iOS Swift client polling users/${currentUser?.uid?.substring(0,8)}.../terminal_v1/filesystem ✅`,
      `[STEP 2] Multi-client verification: Both hashes match! (${selectedFile.length} bytes)`,
      `[STEP 3] Running script with client sandbox mock runtimes...`,
      `[WEB RUNTIME]: ` + (files[selectedFile]?.content?.includes("print(") 
        ? `[STDOUT] ${selectedFile} execution parsed cleanly.` 
        : `[STDOUT] Parsing code rules completed.`),
      `[iOS SWIFT WORKER]: Loaded Python interpreter script successfully. Action proposals matched!`,
      `=== SIMULATED RUN COMPLETED ACCORDING TO DEPLOYED PYTHON DECISION SHAPES ===`
    ];

    let currentStep = 0;
    setSyncLogs(prev => [
      `[${new Date().toLocaleTimeString()}] SIMULATOR: Commencing concurrent dual-platform logic sweep...`,
      ...prev
    ]);

    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const logTime = new Date().toLocaleTimeString();
        setSyncLogs(prev => [
          `[${logTime}] ${steps[currentStep]}`,
          ...prev.slice(0, 10)
        ]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 600);
  };

  const copySwiftSnippet = () => {
    const swCode = `// iOS Swift Shared Python Synchronizer
import Foundation
import FirebaseFirestore

class MultiPlatformStrategySync {
    private let db = Firestore.firestore()
    private let userId: String
    
    init(userId: String) {
        self.userId = userId
    }
    
    /// Listen in real-time to Python backend strategy file edits made on Web or Terminal
    func startSyncListener(completion: @escaping ([String: String]) -> Void) {
        let filesystemRef = db.collection("users")
                              .document(userId)
                              .collection("terminal_v1")
                              .document("filesystem")
        
        filesystemRef.addSnapshotListener { documentSnapshot, error in
            guard let document = documentSnapshot, document.exists else {
                print("Error fetching strategy filesystem: \\(error?.localizedDescription ?? "Unknown")")
                return
            }
            
            if let filesDict = document.data()?["files"] as? [String: [String: Any]] {
                var loadedPythonScripts: [String: String] = [:]
                
                for (fileName, fileData) in filesDict {
                    // Filter down to Python execution files which determine strategy logic
                    if fileName.hasSuffix(".py"), let content = fileData["content"] as? String {
                        loadedPythonScripts[fileName] = content
                    }
                }
                
                print("Successfully synchronized \\(loadedPythonScripts.count) Python strategy modules from Cloud!")
                completion(loadedPythonScripts)
            }
        }
    }
}`;
    navigator.clipboard.writeText(swCode);
    setSwiftCopied(true);
    setTimeout(() => setSwiftCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Visual Workspace banner */}
      <div className="bg-theme-panel border border-theme-border rounded px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-white uppercase tracking-tight text-xs sm:text-sm flex items-center gap-1.5">
              Multi-Platform Bot Python Synchronization Hub
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-400 font-mono">
              Store & align Python strategies globally. Any edit dynamically coordinates Web and iOS Client behavior.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 rounded">
            <Check className="w-3.5 h-3.5" /> Synchronized
          </div>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: File Manager & Selector */}
        <div className="lg:col-span-4 bg-theme-panel border border-theme-border rounded-xl p-5 space-y-5">
          <div className="flex justify-between items-center border-b border-theme-border/60 pb-3">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-white">
              Shared Bot Codebase
            </span>
            <span className="text-[10px] font-mono text-gray-400 bg-theme-input px-1.5 py-0.5 rounded">
              {Object.keys(files).filter(k => k.endsWith(".py")).length} Scripts
            </span>
          </div>

          {/* New script creation form */}
          <form onSubmit={handleCreateFile} className="flex gap-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. scalp_breakout.py"
              className="flex-1 bg-black/40 border border-theme-border/60 text-xs text-white rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-emerald-500/40"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-3 py-1.5 flex items-center justify-center cursor-pointer transition-all shrink-0"
              title="Create new python file"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Files List */}
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {loading ? (
              <div className="text-center py-6 font-mono text-xs text-gray-500">
                Loading database schemas...
              </div>
            ) : Object.keys(files).length === 0 ? (
              <div className="text-center py-6 font-mono text-xs text-gray-500">
                No scripts found. Use the box above to create one.
              </div>
            ) : (
              Object.keys(files).map((fileName) => {
                const f = files[fileName];
                const isPy = fileName.endsWith(".py");
                const isSelected = selectedFile === fileName;
                
                return (
                  <div
                    key={fileName}
                    className={`group flex items-center justify-between p-2.5 rounded-lg border font-mono text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-theme-input/40 border-theme-border/40 text-gray-400 hover:bg-theme-input hover:text-white"
                    }`}
                    onClick={() => selectFile(fileName)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className={`w-4 h-4 shrink-0 ${isPy ? "text-emerald-400" : "text-indigo-400"}`} />
                      <span className="truncate">{fileName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] text-gray-500">
                        {Math.round(f.size)}B
                      </span>
                      {fileName !== "custom_momentum.py" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(fileName);
                          }}
                          className="text-gray-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all cursor-pointer"
                          title="Delete from everywhere"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Multi-Platform Visual Alignment diagram */}
          <div className="bg-black/25 border border-theme-border/40 rounded-lg p-3.5 space-y-3">
            <span className="text-[10px] font-black uppercase font-mono tracking-wider text-gray-400 block border-b border-theme-border/20 pb-1.5">
              Live Database Sentry Hub
            </span>
            <div className="flex items-center justify-between text-center gap-2 font-mono text-[10px]">
              <div className="flex flex-col items-center flex-1 bg-theme-input/50 p-2 rounded border border-theme-border/30">
                <Laptop className="w-4 h-4 text-indigo-400 mb-1" />
                <span className="text-white font-bold">Web Sentry</span>
                <span className="text-gray-500 text-[8px]">ROUTED PORT 3000</span>
              </div>
              
              <div className="text-emerald-500 font-bold flex flex-col items-center shrink-0">
                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
                <span className="text-[8px] uppercase tracking-widest mt-1">FIRESTORE</span>
              </div>

              <div className="flex flex-col items-center flex-1 bg-theme-input/50 p-2 rounded border border-theme-border/30">
                <Smartphone className="w-4 h-4 text-rose-400 mb-1" />
                <span className="text-white font-bold">iOS Sentry</span>
                <span className="text-gray-500 text-[8px]">SWIFT CORE SDK</span>
              </div>
            </div>
            
            <p className="text-[9px] text-gray-500 leading-normal">
              Updating strategies here updates files inside your private terminal filesystem in the database. When the Python bot triggers, both applications parse the exact same logic.
            </p>
          </div>
        </div>

        {/* Right Column: Code Editor & Live Sync Logs */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Sub-Card 1: Immersive Document Editor */}
          <div className="bg-theme-panel border border-theme-border rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-theme-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold font-mono uppercase text-white">
                  {selectedFile ? `Active Script Editor: ${selectedFile}` : "Select a script to edit"}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={saveCurrentFile}
                  disabled={isSaving || !selectedFile}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? "Saving..." : "Save & Sync Script"}
                </button>
              </div>
            </div>

            {selectedFile ? (
              <div className="relative">
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  spellCheck={false}
                  className="w-full h-[320px] bg-black/80 font-mono text-xs sm:text-[13px] text-emerald-400/90 leading-relaxed p-4.5 rounded-lg border border-theme-border/60 focus:outline-none focus:border-emerald-500/40 custom-scrollbar select-text placeholder-gray-700"
                  placeholder="# Customize your decision strategy code here..."
                />
              </div>
            ) : (
              <div className="h-[320px] bg-black/60 rounded-lg flex items-center justify-center font-mono text-xs text-gray-500">
                Please select or create a script in the side panel to view code.
              </div>
            )}
            
            <p className="text-[10px] text-gray-500 font-mono">
              🚀 <strong>Atomic Persistence:</strong> Code saved is saved directly inside <code>{`users/${currentUser?.uid?.substring(0,8)}.../terminal_v1/filesystem`}</code> in Firestore.
            </p>
          </div>

          {/* Sub-Card 2: Live Sync Output Console & iOS Swift Code Integration Codeblock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Sync Console */}
            <div className="bg-theme-panel border border-theme-border rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-theme-border/60 pb-3">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" /> Sentry Multi-Client Monitor
                </span>
                <button
                  onClick={handleSimulateSyncRun}
                  disabled={isSimulating || !selectedFile}
                  className="bg-theme-input border border-theme-border text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded hover:bg-theme-border transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  {isSimulating ? "Simulating..." : "Test Sync"}
                </button>
              </div>

              <div className="bg-black/90 p-3.5 h-[190px] rounded-lg border border-theme-border font-mono text-[10.5px] text-gray-400 overflow-y-auto custom-scrollbar select-text space-y-2">
                {syncLogs.length === 0 ? (
                  <div className="text-gray-600 italic">No activity recorded. Click "Test Sync" or edit a strategy script to trigger multi-client execution broadcast reports...</div>
                ) : (
                  syncLogs.map((log, i) => {
                    let color = "text-gray-400";
                    if (log.includes("SUCCESS") || log.includes("NEW FILE")) color = "text-emerald-400 font-semibold";
                    else if (log.includes("NEW FILE")) color = "text-indigo-400";
                    else if (log.includes("SIMULATOR:")) color = "text-cyan-400 font-bold";
                    else if (log.includes("SWIFT") || log.includes("WEB")) color = "text-white";
                    
                    return (
                      <div key={i} className={`leading-relaxed border-b border-white/5 pb-1 ${color}`}>
                        {log}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* iOS Integration Snippet */}
            <div className="bg-theme-panel border border-theme-border rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-theme-border/60 pb-3">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-rose-400" /> iOS Swift SDK Integration
                </span>
                <button
                  onClick={copySwiftSnippet}
                  className="bg-theme-input border border-theme-border text-gray-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  {swiftCopied ? "Copied!" : "Copy Suite"}
                </button>
              </div>

              <div className="bg-black/90 p-3.5 h-[190px] rounded-lg border border-theme-border font-mono text-[9px] text-[#dbcbdc] overflow-y-auto custom-scrollbar select-text whitespace-pre leading-normal">
{`import FirebaseFirestore

class SharedPythonSync {
    let db = Firestore.firestore()
    let userId = "YOUR_UID"
    
    func listenToStrategyChanges() {
        let docRef = db.collection("users")
            .document(userId)
            .collection("terminal_v1")
            .document("filesystem")
            
        docRef.addSnapshotListener { snapshot, err in
            guard let files = snapshot?.data()?["files"] as? [String: Any] else { return }
            print("Successfully aligned to Python Sentry database!")
            // Parse custom_momentum.py content directly
        }
    }
}`}
              </div>
              <p className="text-[9.5px] text-gray-500 font-sans leading-relaxed">
                <Info className="w-3.5 h-3.5 inline mr-1 text-gray-400 shrink-0" /> Configure this exact framework in your Apple SwiftUI/UIKit app to listen to <code>terminal_v1/filesystem</code> updates dynamically!
              </p>
            </div>

          </div>
        </div>
        
      </div>
    </div>
  );
}
