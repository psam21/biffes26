"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, Check, Download, X } from "lucide-react";
import { useWatchlist } from "@/lib/watchlist-context";

export function ShareWatchlist() {
  const { syncCode, generateSyncCode, loadFromSyncCode, watchlist } = useWatchlist();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"share" | "import">("share");
  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerateCode = async () => {
    setGenerating(true);
    await generateSyncCode();
    setGenerating(false);
  };

  const handleCopy = async () => {
    if (syncCode) {
      await navigator.clipboard.writeText(syncCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImport = async () => {
    if (!importCode.trim()) return;
    
    setImporting(true);
    setImportError(null);
    setImportSuccess(false);
    
    const success = await loadFromSyncCode(importCode.trim().toUpperCase());
    
    if (success) {
      setImportSuccess(true);
      setImportCode("");
      setTimeout(() => {
        setImportSuccess(false);
        setIsOpen(false);
      }, 1500);
    } else {
      setImportError("Invalid code or code expired");
    }
    
    setImporting(false);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-colors"
      >
        <Share2 className="w-4 h-4 text-blue-400" />
        <span className="text-sm text-white">Share</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <h3 className="text-lg font-semibold text-white">Share Watchlist</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-zinc-800">
                <button
                  onClick={() => setActiveTab("share")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "share"
                      ? "text-blue-400 border-b-2 border-blue-400"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Share My List
                </button>
                <button
                  onClick={() => setActiveTab("import")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "import"
                      ? "text-green-400 border-b-2 border-green-400"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Import List
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {activeTab === "share" ? (
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-400">
                      Generate a 6-character code to share your watchlist with friends or access it on another device.
                    </p>

                    {watchlist.length === 0 ? (
                      <div className="text-center py-6">
                        <span className="text-4xl mb-2 block">📝</span>
                        <p className="text-zinc-500 text-sm">Add some films first to share your watchlist</p>
                      </div>
                    ) : syncCode ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-zinc-800 rounded-lg px-4 py-3 font-mono text-2xl text-center tracking-widest text-white">
                            {syncCode}
                          </div>
                          <button
                            onClick={handleCopy}
                            className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                          >
                            {copied ? (
                              <Check className="w-5 h-5 text-green-400" />
                            ) : (
                              <Copy className="w-5 h-5 text-zinc-400" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-zinc-500 text-center">
                          Code expires in 30 days • {watchlist.length} films
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={handleGenerateCode}
                        disabled={generating}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {generating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Share2 className="w-4 h-4" />
                            Generate Share Code
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-400">
                      Enter a share code to import someone else's watchlist or restore your own from another device.
                    </p>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={importCode}
                        onChange={(e) => {
                          setImportCode(e.target.value.toUpperCase().slice(0, 6));
                          setImportError(null);
                        }}
                        placeholder="Enter 6-character code"
                        maxLength={6}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-center font-mono text-xl tracking-widest text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />

                      {importError && (
                        <p className="text-red-400 text-sm text-center">{importError}</p>
                      )}

                      {importSuccess && (
                        <p className="text-green-400 text-sm text-center flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" />
                          Watchlist imported successfully!
                        </p>
                      )}

                      <button
                        onClick={handleImport}
                        disabled={importing || importCode.length !== 6}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {importing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Import Watchlist
                          </>
                        )}
                      </button>

                      <p className="text-xs text-zinc-500 text-center">
                        This will merge with your existing watchlist
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
