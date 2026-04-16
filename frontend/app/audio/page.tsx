"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { SomiIcons } from "@/components/SomiIcons";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const C = { navy:"#071739",gold:"#E3C39D",goldLight:"#F0DCC4",steel:"#4B6382",silver:"#A4B5C4",sand:"#A68868",bg:"#FAFAF8" };
const API = process.env.NEXT_PUBLIC_API_URL || "https://studybuddy-production-7776.up.railway.app";

interface AudioConcept {
  id: string;
  concept: string;
  bookPage: number;
  quickContent: string;
  reviseContent: string;
  namespace: string;
}

interface ChapterInfo {
  namespace: string;
  subjectTitle: string;
  chapterTitle: string;
  concepts: AudioConcept[];
}

// ── MAIN PAGE ──
export default function AudioLibrary() {
  const router = useRouter();
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState<ChapterInfo | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [contentMode, setContentMode] = useState<"quick" | "revise">("quick");
  const [progress, setProgress] = useState(0);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load available chapters from localStorage course info
  useEffect(() => {
    loadChapters();
  }, []);

  async function loadChapters() {
    setLoading(true);
    try {
      const course = localStorage.getItem("somi_course") || "cma";
      const level = localStorage.getItem("somi_level") || "foundation";

      // Fetch from known namespaces
      const namespaces = [
        "cma_f_law_ch1_s1", "cma_f_law_ch2_s1", "cma_f_law_ch3_s1",
        "cma_f_acc_ch1_s1", "cma_f_acc_ch2_s1",
        "cma_f_eco_ch1_s1",
      ];

      const loaded: ChapterInfo[] = [];
      for (const ns of namespaces) {
        try {
          const res = await fetch(`${API}/lesson/smart?namespace=${ns}`);
          const data = await res.json();
          if (data.pages && data.pages.length > 0) {
            const concepts: AudioConcept[] = data.pages.flatMap((p: any) =>
              (p.mama_lines || []).map((line: any, i: number) => ({
                id: `${p.id}_${i}`,
                concept: line.concept_title || p.concept || `Concept ${i + 1}`,
                bookPage: p.book_page,
                quickContent: line.tenglish || "",
                reviseContent: line.tenglish_variation_2 || line.tenglish || "",
                namespace: ns,
              }))
            ).filter((c: AudioConcept) => c.quickContent.length > 10);

            if (concepts.length > 0) {
              // Parse chapter info from namespace
              const parts = ns.split("_");
              const chNum = parts.find(p => p.startsWith("ch"))?.replace("ch", "") || "1";
              const subKey = ns.split("_ch")[0];

              loaded.push({
                namespace: ns,
                subjectTitle: subKey.includes("law") ? "Business Laws" :
                  subKey.includes("acc") ? "Financial & Cost Accounting" :
                    subKey.includes("eco") ? "Business Economics" :
                      subKey.includes("math") ? "Mathematics & Statistics" : "Subject",
                chapterTitle: `Chapter ${chNum}`,
                concepts,
              });
            }
          }
        } catch { /* skip failed fetches */ }
      }

      setChapters(loaded);
    } catch (e) {
      console.error("Failed to load audio content:", e);
    } finally {
      setLoading(false);
    }
  }

  // ── TTS Controls ──
  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const clean = text
      .replace(/\*\*/g, "")
      .replace(/[|]/g, ", ")
      .replace(/[#>•\-]/g, " ")
      .replace(/\n+/g, ". ")
      .replace(/\s+/g, " ")
      .trim();

    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = speed;
    utter.pitch = 1;
    utter.lang = "en-IN";

    // Try to find an Indian English voice
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v => v.lang === "en-IN") ||
      voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("india")) ||
      voices.find(v => v.lang.startsWith("en"));
    if (indianVoice) utter.voice = indianVoice;

    utter.onend = () => {
      // Auto-advance to next concept
      if (activeChapter && currentIdx < activeChapter.concepts.length - 1) {
        setCurrentIdx(i => i + 1);
      } else {
        setPlaying(false);
        setProgress(100);
      }
    };

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setPlaying(true);
  }, [speed, activeChapter, currentIdx]);

  // Play current concept when idx changes
  useEffect(() => {
    if (activeChapter && playing) {
      const concept = activeChapter.concepts[currentIdx];
      if (concept) {
        const content = contentMode === "quick" ? concept.quickContent : concept.reviseContent;
        speak(content);
      }
    }
  }, [currentIdx, activeChapter, contentMode]);

  // Update progress while playing
  useEffect(() => {
    if (playing && activeChapter) {
      intervalRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          // Approximate progress
          setProgress(prev => Math.min(prev + 0.5, 95));
        }
      }, 100);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, activeChapter]);

  const pause = () => {
    window.speechSynthesis.pause();
    setPlaying(false);
  };

  const resume = () => {
    window.speechSynthesis.resume();
    setPlaying(true);
  };

  const togglePlay = () => {
    if (playing) {
      pause();
    } else if (window.speechSynthesis.paused) {
      resume();
    } else if (activeChapter) {
      const concept = activeChapter.concepts[currentIdx];
      const content = contentMode === "quick" ? concept.quickContent : concept.reviseContent;
      speak(content);
    }
  };

  const next = () => {
    if (activeChapter && currentIdx < activeChapter.concepts.length - 1) {
      window.speechSynthesis.cancel();
      setCurrentIdx(i => i + 1);
      setProgress(0);
    }
  };

  const prev = () => {
    if (currentIdx > 0) {
      window.speechSynthesis.cancel();
      setCurrentIdx(i => i - 1);
      setProgress(0);
    }
  };

  const startChapter = (ch: ChapterInfo) => {
    window.speechSynthesis.cancel();
    setActiveChapter(ch);
    setCurrentIdx(0);
    setProgress(0);
    setPlaying(false);
  };

  const stopPlayback = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setActiveChapter(null);
    setCurrentIdx(0);
    setProgress(0);
  };

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><SomiIcons.Headphones size={40} /></div>
          <div style={{ fontSize: 14, color: C.navy }}>Loading audio library...</div>
        </div>
      </div>
    );
  }

  // ── PLAYER VIEW ──
  if (activeChapter) {
    const current = activeChapter.concepts[currentIdx];
    const totalConcepts = activeChapter.concepts.length;

    return (
      <div style={{ minHeight: "100vh", background: C.navy, fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "max(env(safe-area-inset-top, 20px), 20px) 20px 16px", maxWidth: 640, margin: "0 auto", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={stopPlayback}
              style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </motion.button>
            <span style={{ fontSize: 11, color: C.gold, opacity: 0.5, letterSpacing: "0.12em", fontWeight: 600 }}>AUDIO LIBRARY</span>
          </div>
        </div>

        {/* Album art area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 40px", maxWidth: 640, margin: "0 auto", width: "100%" }}>
          {/* Big icon */}
          <motion.div
            animate={{ scale: playing ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: playing ? Infinity : 0, duration: 2 }}
            style={{
              width: 140, height: 140, borderRadius: 28,
              background: "rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 32, border: `2px solid rgba(227,195,157,0.1)`,
            }}>
            <SomiIcons.Headphones size={56} color="#fff" />
          </motion.div>

          {/* Concept info */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: C.gold, opacity: 0.5, letterSpacing: "0.1em", marginBottom: 6 }}>
              {activeChapter.subjectTitle} · {activeChapter.chapterTitle}
            </div>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif", fontSize: "clamp(20px, 5vw, 26px)",
              fontWeight: 400, color: "#fff", lineHeight: 1.3, marginBottom: 6,
            }}>
              {current?.concept || "Loading..."}
            </h2>
            <div style={{ fontSize: 12, color: C.silver, opacity: 0.5 }}>
              {currentIdx + 1} of {totalConcepts} · Page {current?.bookPage}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ width: "100%", marginBottom: 24 }}>
            <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
              <motion.div animate={{ width: `${progress}%` }}
                style={{ height: "100%", background: C.gold, borderRadius: 2 }} />
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
            {/* Prev */}
            <motion.button whileTap={{ scale: 0.85 }} onClick={prev}
              style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: currentIdx === 0 ? 0.3 : 1 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M19 20L9 12l10-8v16zM7 19V5H5v14h2z" /></svg>
            </motion.button>

            {/* Play/Pause */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay}
              style={{
                width: 64, height: 64, borderRadius: 20,
                background: C.gold, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 24px ${C.gold}33`,
              }}>
              {playing ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill={C.navy}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill={C.navy}><path d="M8 5v14l11-7z" /></svg>
              )}
            </motion.button>

            {/* Next */}
            <motion.button whileTap={{ scale: 0.85 }} onClick={next}
              style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: currentIdx >= totalConcepts - 1 ? 0.3 : 1 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M5 4l10 8-10 8V4zm11 1v14h2V5h-2z" /></svg>
            </motion.button>
          </div>

          {/* Speed + Mode controls */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[0.75, 1, 1.25, 1.5, 2].map(s => (
              <button key={s} onClick={() => setSpeed(s)}
                style={{
                  padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: speed === s ? "rgba(255,255,255,0.12)" : "transparent",
                  color: speed === s ? C.gold : "rgba(255,255,255,0.3)",
                  fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                }}>{s}x</button>
            ))}
          </div>

          {/* Content mode toggle */}
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 3 }}>
            {(["quick", "revise"] as const).map(m => (
              <button key={m} type="button" onClick={() => setContentMode(m)}
                style={{
                  padding: "6px 16px", borderRadius: 6, border: "none", cursor: "pointer",
                  background: contentMode === m ? "rgba(255,255,255,0.1)" : "transparent",
                  color: contentMode === m ? C.gold : "rgba(255,255,255,0.3)",
                  fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                {m === "quick" ? <><SomiIcons.Bolt size={14} color={contentMode === m ? C.gold : "rgba(255,255,255,0.3)"} />Quick</> : <><SomiIcons.Pen size={14} color={contentMode === m ? C.gold : "rgba(255,255,255,0.3)"} />Revise</>}
              </button>
            ))}
          </div>
        </div>

        {/* Mini playlist */}
        <div style={{ maxWidth: 640, margin: "0 auto", width: "100%", padding: "16px 20px", paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}>
          <div style={{ fontSize: 10, color: C.gold, opacity: 0.4, letterSpacing: "0.1em", fontWeight: 600, marginBottom: 8 }}>UP NEXT</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 140, overflowY: "auto" }}>
            {activeChapter.concepts.slice(currentIdx + 1, currentIdx + 5).map((c, i) => (
              <button key={c.id} onClick={() => { window.speechSynthesis.cancel(); setCurrentIdx(currentIdx + 1 + i); setProgress(0); }}
                style={{
                  display: "flex", gap: 10, alignItems: "center", padding: "8px 12px",
                  background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "none",
                  cursor: "pointer", textAlign: "left", width: "100%", fontFamily: "'DM Sans', sans-serif",
                }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", minWidth: 16 }}>{currentIdx + 2 + i}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.concept}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── LIBRARY VIEW ──
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: C.navy, paddingTop: "max(env(safe-area-inset-top, 20px), 20px)", paddingBottom: 28, position: "relative", overflow: "hidden" }}>
        <span style={{ position: "absolute", top: -16, right: -8, lineHeight: 1, userSelect: "none", pointerEvents: "none", opacity: 0.06, display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden>
          <SomiIcons.Headphones size={160} color="#fff" />
        </span>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px", position: "relative", zIndex: 1 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
              style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
            </motion.button>
            <span style={{ fontSize: 11, color: C.gold, opacity: 0.6, letterSpacing: "0.12em", fontWeight: 600 }}>AUDIO LIBRARY</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(24px, 5.5vw, 32px)", fontWeight: 400, color: "#fff", lineHeight: 1.2, marginBottom: 6 }}>
              Listen & Learn
            </h1>
            <div style={{ fontSize: 13, color: C.silver, opacity: 0.6 }}>
              MAMA explains concepts — listen while travelling
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 20px 100px" }}>
        {chapters.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><SomiIcons.Headphones size={48} /></div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: C.navy, marginBottom: 8 }}>No audio content yet</div>
            <div style={{ fontSize: 13, color: C.steel }}>Complete some lessons first — audio becomes available for chapters with loaded content</div>
          </div>
        ) : (
          chapters.map((ch, ci) => (
            <motion.div key={ch.namespace}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.06 }}
              style={{
                background: "#fff", borderRadius: 14, border: `1px solid ${C.navy}0A`,
                padding: 18, marginBottom: 12, cursor: "pointer",
              }}
              onClick={() => startChapter(ch)}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: C.navy,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                }}><SomiIcons.Headphones size={22} color="#fff" /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: C.steel, marginBottom: 2 }}>{ch.subjectTitle}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, lineHeight: 1.3, marginBottom: 4 }}>{ch.chapterTitle}</div>
                  <div style={{ fontSize: 12, color: C.steel, opacity: 0.7 }}>
                    {ch.concepts.length} concepts · ~{Math.max(1, Math.round(ch.concepts.length * 0.8))} min
                  </div>
                </div>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: C.gold,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={C.navy}><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
