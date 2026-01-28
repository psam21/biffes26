"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Download, X, Ticket, Film, Clapperboard } from "lucide-react";
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

  // Auto-generate code when modal opens and no code exists
  useEffect(() => {
    if (isOpen && activeTab === "share" && !syncCode && watchlist.length > 0) {
      setGenerating(true);
      generateSyncCode().finally(() => setGenerating(false));
    }
  }, [isOpen, activeTab, syncCode, watchlist.length, generateSyncCode]);

  const getShareUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}?watchlist=${syncCode}`;
  };

  const handleShare = async () => {
    if (!syncCode) return;
    
    const shareUrl = getShareUrl();
    
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "🎬 My BIFFes 2026 Watchlist",
          text: `Check out my film watchlist for BIFFes 2026! ${watchlist.length} films curated just for you.`,
          url: shareUrl,
        });
        return;
      } catch (e) {
        // User cancelled or not supported, fall back to clipboard
      }
    }
    
    // Fallback to clipboard
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
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
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-600/20 to-orange-600/20 hover:from-amber-600/30 hover:to-orange-600/30 border border-amber-500/30 rounded-lg transition-all"
      >
        <Ticket className="w-4 h-4 text-amber-400" />
        <span className="text-sm text-white">Share</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop with film grain effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Modal - Movie Ticket Style */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50 px-4"
            >
              {/* Ticket Container */}
              <div className="relative">
                {/* Ticket perforations - top */}
                <div className="absolute -top-2 left-0 right-0 flex justify-between px-4">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-3 h-3 bg-black rounded-full" />
                  ))}
                </div>

                <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-2 border-amber-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(251,191,36,0.15)]">
                  {/* Header - Cinema marquee style */}
                  <div className="relative bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 p-4">
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)`,
                      }} />
                    </div>
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Film className="w-6 h-6 text-zinc-900" />
                        <h3 className="text-lg font-bold text-zinc-900 tracking-wide">WATCHLIST PASS</h3>
                      </div>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-black/20 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5 text-zinc-900" />
                      </button>
                    </div>
                    
                    <div className="relative mt-1 text-xs font-medium text-zinc-800 tracking-widest">
                      BIFFes 2026 • BANGALORE
                    </div>
                  </div>

                  {/* Tabs - styled as film strip */}
                  <div className="flex bg-zinc-950/50">
                    <button
                      onClick={() => setActiveTab("share")}
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        activeTab === "share"
                          ? "text-amber-400 bg-amber-500/10 border-b-2 border-amber-400"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <Ticket className="w-4 h-4" />
                      Share
                    </button>
                    <button
                      onClick={() => setActiveTab("import")}
                      className={`flex-1 px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        activeTab === "import"
                          ? "text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-400"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      Import
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {activeTab === "share" ? (
                      <div className="space-y-5">
                        {watchlist.length === 0 ? (
                          <div className="text-center py-8">
                            <Clapperboard className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                            <p className="text-zinc-500 text-sm">Your watchlist is empty</p>
                            <p className="text-zinc-600 text-xs mt-1">Add films to create your shareable pass</p>
                          </div>
                        ) : generating ? (
                          <div className="text-center py-8">
                            <div className="w-10 h-10 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-zinc-400 text-sm">Creating your pass...</p>
                          </div>
                        ) : syncCode ? (
                          <>
                            {/* Admit One Style Code Display */}
                            <div className="relative bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                              <div className="absolute top-2 left-3 text-[10px] font-bold text-zinc-600 tracking-widest">
                                ADMIT ONE
                              </div>
                              <div className="absolute top-2 right-3 text-[10px] font-bold text-zinc-600 tracking-widest">
                                #{watchlist.length} FILMS
                              </div>
                              
                              <div className="pt-4 text-center">
                                <div className="font-mono text-3xl font-bold tracking-[0.3em] text-amber-400 mb-1">
                                  {syncCode}
                                </div>
                                <div className="text-[10px] text-zinc-600 tracking-wider">
                                  PASS CODE • VALID 30 DAYS
                                </div>
                              </div>

                              {/* Decorative film strip holes */}
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-900 rounded-full border border-zinc-800" />
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-zinc-900 rounded-full border border-zinc-800" />
                            </div>

                            {/* Share Button */}
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleShare}
                              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-900 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                            >
                              {copied ? (
                                <>
                                  <Check className="w-5 h-5" />
                                  Link Copied!
                                </>
                              ) : (
                                <>
                                  <Ticket className="w-5 h-5" />
                                  Share Watchlist Link
                                </>
                              )}
                            </motion.button>

                            <p className="text-xs text-zinc-600 text-center">
                              Share this link with friends to let them see your picks
                            </p>
                          </>
                        ) : null}
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <p className="text-sm text-zinc-400 text-center">
                          Got a pass code? Enter it below to import a watchlist
                        </p>

                        <div className="space-y-4">
                          <div className="relative">
                            <input
                              type="text"
                              value={importCode}
                              onChange={(e) => {
                                setImportCode(e.target.value.toUpperCase().slice(0, 6));
                                setImportError(null);
                              }}
                              placeholder="XXXXXX"
                              maxLength={6}
                              className="w-full bg-zinc-950 border-2 border-zinc-700 focus:border-emerald-500 rounded-xl px-4 py-4 text-center font-mono text-2xl tracking-[0.3em] text-white placeholder:text-zinc-700 focus:outline-none transition-colors"
                            />
                            <div className="absolute top-1 left-3 text-[10px] font-bold text-zinc-600 tracking-widest">
                              PASS CODE
                            </div>
                          </div>

                          {importError && (
                            <motion.p 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg"
                            >
                              {importError}
                            </motion.p>
                          )}

                          {importSuccess && (
                            <motion.p 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-emerald-400 text-sm text-center flex items-center justify-center gap-2 bg-emerald-500/10 py-2 rounded-lg"
                            >
                              <Check className="w-4 h-4" />
                              Watchlist imported!
                            </motion.p>
                          )}

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleImport}
                            disabled={importing || importCode.length !== 6}
                            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white disabled:text-zinc-500 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:shadow-none"
                          >
                            {importing ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Importing...
                              </>
                            ) : (
                              <>
                                <Download className="w-5 h-5" />
                                Import Watchlist
                              </>
                            )}
                          </motion.button>

                          <p className="text-xs text-zinc-600 text-center">
                            Films will be added to your existing watchlist
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ticket perforations - bottom */}
                <div className="absolute -bottom-2 left-0 right-0 flex justify-between px-4">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-3 h-3 bg-black rounded-full" />
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
