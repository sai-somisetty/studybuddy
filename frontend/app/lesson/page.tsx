"use client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const API = process.env.NEXT_PUBLIC_API_URL || "https://studybuddy-production-7776.up.railway.app";

const PDFViewer = dynamic(
  () => import('./PDFViewer'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        display: "flex", justifyContent: "center",
        padding: 40, color: "#0A2E28"
      }}>
        Loading PDF...
      </div>
    )
  }
);

function LessonContent() {
  const router = useRouter();
  const params = useSearchParams();

  const namespace = params.get("namespace") || "cma_f_law_ch1_s1";
  const concept   = params.get("concept")   || "Contract";
  const subject   = params.get("subject")   || "Business Laws";
  const chapter   = params.get("chapter")   || "Chapter 1";

  const [activeZone, setActiveZone]           = useState<"mama" | "icmai">("mama");
  const [pages, setPages]                     = useState<any[]>([]);
  const [currentPageIdx, setCurrentPageIdx]   = useState(0);
  const [currentParaIdx, setCurrentParaIdx]   = useState(0);
  const [selectedAnswer, setSelectedAnswer]   = useState<number | null>(null);
  const [attempts, setAttempts]               = useState(0);
  const [gaveUp, setGaveUp]                   = useState(false);
  const [showKitty, setShowKitty]             = useState(false);
  const [kittyAnswered, setKittyAnswered]     = useState(false);
  const [isLocked, setIsLocked]               = useState(true);
  const [touchStartX, setTouchStartX]         = useState<number | null>(null);
  const [touchStartY, setTouchStartY]         = useState<number | null>(null);
  const [inputFocused, setInputFocused]       = useState(false);
  const [studentQuestion, setStudentQuestion] = useState("");
  const [studentMessages, setStudentMessages] = useState<any[]>([]);
  const [mamaTyping, setMamaTyping]           = useState(false);
  const [missedConcepts, setMissedConcepts]   = useState<string[]>([]);
  const [loading, setLoading]                 = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentPage  = pages[currentPageIdx];
  const paragraphs   = currentPage?.mama_lines || [];
  const currentPara  = paragraphs[currentParaIdx];
  const isLastPara   = currentParaIdx === paragraphs.length - 1;
  const isLastPage   = currentPageIdx === pages.length - 1;
  const isCorrect    = selectedAnswer === currentPara?.check_answer;

  // Fetch on mount
  useEffect(() => {
    async function fetchPages() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/lesson/smart?namespace=${namespace}`);
        const data = await res.json();
        if (data.pages?.length > 0) {
          setPages(data.pages);
        }
      } catch (e) {
        console.error("Fetch failed:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPages();
  }, [namespace]);

  // Kitty auto-show + lock control
  useEffect(() => {
    if (!currentPara?.is_key_concept) {
      setIsLocked(false);
      return;
    }
    setIsLocked(true);
    const t = setTimeout(() => setShowKitty(true), 2000);
    return () => clearTimeout(t);
  }, [currentParaIdx, currentPageIdx]);

  // Navigation helpers
  const resetParaState = () => {
    setSelectedAnswer(null);
    setAttempts(0);
    setGaveUp(false);
    setShowKitty(false);
    setKittyAnswered(false);
    setIsLocked(true);
    setStudentMessages([]);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNextPara = () => {
    if (isLocked) return;
    if (!isLastPara) {
      setCurrentParaIdx(prev => prev + 1);
      resetParaState();
    } else if (!isLastPage) {
      setCurrentPageIdx(prev => prev + 1);
      setCurrentParaIdx(0);
      resetParaState();
    }
  };

  const goPrevPara = () => {
    if (currentParaIdx > 0) {
      setCurrentParaIdx(prev => prev - 1);
      setSelectedAnswer(null);
      setAttempts(0);
      setGaveUp(false);
      setShowKitty(false);
      setKittyAnswered(false);
      setStudentMessages([]);
      setIsLocked(false);
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentPageIdx > 0) {
      setCurrentPageIdx(prev => prev - 1);
      setCurrentParaIdx(0);
      setSelectedAnswer(null);
      setAttempts(0);
      setGaveUp(false);
      setShowKitty(false);
      setKittyAnswered(false);
      setStudentMessages([]);
      setIsLocked(false);
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleAnswer = (idx: number) => {
    if (gaveUp) return;
    if (selectedAnswer !== null && isCorrect) return;
    setSelectedAnswer(idx);
    setAttempts(prev => prev + 1);
    if (idx === currentPara.check_answer) {
      setTimeout(() => {
        setIsLocked(false);
        setTimeout(() => goNextPara(), 800);
      }, 1500);
    }
  };

  const handleGiveUp = () => {
    setGaveUp(true);
    setSelectedAnswer(currentPara?.check_answer);
    setIsLocked(false);
    setMissedConcepts(prev => [
      ...prev,
      currentPara?.text?.slice(0, 60) || "Unknown"
    ]);
    setTimeout(() => goNextPara(), 2500);
  };

  // ── LOADING ──
  if (loading) {
    return (
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📖</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0A2E28", marginBottom: 8 }}>
            Mama is preparing your lesson...
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                style={{ width: 8, height: 8, borderRadius: "50%", background: "#0A2E28" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── NO CONTENT ──
  if (!loading && pages.length === 0) {
    return (
      <div className="app-shell">
        <div style={{ background: "linear-gradient(135deg, #0A2E28 0%, #0A4A3C 100%)", padding: "14px 20px" }}>
          <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>← Back</button>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 700, color: "#fff", marginTop: 10 }}>{concept}</div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📖</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0A2E28", marginBottom: 8 }}>
              Content coming soon!
            </div>
            <div style={{ fontSize: 12, color: "#A89880" }}>
              Mama is preparing this chapter...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN UI ──
  return (
    <div className="app-shell">
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0A2E28 0%, #0A4A3C 100%)", padding: "14px 20px 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>← Back</button>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
            Page {currentPageIdx + 1}/{pages.length} · Para {currentParaIdx + 1}/{paragraphs.length}
          </div>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
          <motion.div
            animate={{ width: `${paragraphs.length > 0 ? ((currentParaIdx + 1) / paragraphs.length) * 100 : 0}%` }}
            style={{ height: "100%", background: "#E67E22", borderRadius: 2 }} />
        </div>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>{concept}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{subject} · {chapter}</div>
      </div>

      {/* Zone toggle */}
      <div style={{ display: "flex", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
        {[
          { id: "mama",  icon: "🧠", label: "Mama Zone",  bg: "#0A2E28" },
          { id: "icmai", icon: "📖", label: "ICMAI Zone", bg: "#0E6655" },
        ].map(z => (
          <button key={z.id}
            onClick={() => setActiveZone(z.id as "mama" | "icmai")}
            style={{
              flex: 1, padding: "10px", fontSize: 11,
              fontWeight: activeZone === z.id ? 700 : 500,
              background: activeZone === z.id ? z.bg : "transparent",
              color: activeZone === z.id ? "#fff" : "#6B6560",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 4
            }}>
            {z.icon} {z.label}
          </button>
        ))}
      </div>

      {/* ════ MAMA ZONE ════ */}
      {activeZone === "mama" && (
        <div
          ref={contentRef}
          style={{ flex: 1, overflowY: "auto", padding: "14px 20px 120px" }}
          onTouchStart={(e) => {
            setTouchStartX(e.touches[0].clientX);
            setTouchStartY(e.touches[0].clientY);
          }}
          onTouchEnd={(e) => {
            if (inputFocused) return; // disable swipe when typing
            if (touchStartX === null || touchStartY === null) return;
            const dx = touchStartX - e.changedTouches[0].clientX;
            const dy = touchStartY - e.changedTouches[0].clientY;
            if (Math.abs(dx) > Math.abs(dy)) {
              if (Math.abs(dx) > 50) {
                setActiveZone(dx > 0 ? "icmai" : "mama");
              }
            } else {
              if (dy > 80 && !isLocked) goNextPara();
              if (dy < -80) goPrevPara();
            }
            setTouchStartX(null);
            setTouchStartY(null);
          }}
        >
          {currentPara ? (
            <AnimatePresence mode="wait">
              <motion.div key={`${currentPageIdx}-${currentParaIdx}`}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* BLOCK 1 — Progress */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    fontSize: 10, color: "#A89880", marginBottom: 6,
                    display: "flex", justifyContent: "space-between"
                  }}>
                    <span>Book Page {currentPage?.book_page}</span>
                    <span>{currentParaIdx + 1} / {paragraphs.length}</span>
                  </div>
                  <div style={{ height: 3, background: "#E5E0D8", borderRadius: 2 }}>
                    <div style={{
                      width: `${((currentParaIdx + 1) / paragraphs.length) * 100}%`,
                      height: "100%", background: "#E67E22", borderRadius: 2,
                      transition: "width 0.3s"
                    }} />
                  </div>
                </div>

                {/* BLOCK 2 — Official text */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: "#E1F5EE", borderRadius: 16, padding: 16,
                    border: "1px solid rgba(14,102,85,0.15)", marginBottom: 12
                  }}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, color: "#0E6655",
                    letterSpacing: "0.08em", marginBottom: 8
                  }}>
                    📖 ICMAI TEXTBOOK
                  </div>
                  <div style={{
                    fontSize: 13, color: "#085041", lineHeight: 1.8,
                    fontFamily: "Georgia,serif", fontStyle: "italic"
                  }}>
                    {currentPara?.text}
                  </div>
                </motion.div>

                {/* BLOCK 3 — Mama explains */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  style={{
                    background: "#fff", borderRadius: 16, padding: 16,
                    border: "0.5px solid rgba(0,0,0,0.06)", marginBottom: 12
                  }}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    gap: 8, marginBottom: 10
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 10,
                      background: "#0A2E28", display: "flex",
                      alignItems: "center", justifyContent: "center"
                    }}>
                      <span style={{ fontSize: 8, fontWeight: 800, color: "#fff" }}>MAMA</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0A2E28" }}>
                      Mama explains
                    </span>
                    {currentPage?.is_verified ? (
                      <span style={{
                        fontSize: 9, background: "#E1F5EE", color: "#0E6655",
                        padding: "2px 8px", borderRadius: 20, fontWeight: 600
                      }}>✓ Verified</span>
                    ) : (
                      <span style={{
                        fontSize: 9, background: "#FFF7ED", color: "#E67E22",
                        padding: "2px 8px", borderRadius: 20, fontWeight: 600
                      }}>AI Draft</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "#1A1208", lineHeight: 1.7 }}>
                    {currentPara?.tenglish}
                  </div>
                </motion.div>

                {/* BLOCK 4 — Kitty asks */}
                <AnimatePresence>
                  {currentPara?.is_key_concept && showKitty && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", damping: 20 }}
                      style={{
                        background: "linear-gradient(135deg,#FEF9C3,#FFEDD5)",
                        borderRadius: 16, padding: 14, marginBottom: 12,
                        border: "1px solid rgba(230,126,34,0.15)"
                      }}>
                      <div style={{
                        display: "flex", alignItems: "center",
                        gap: 8, marginBottom: 8
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: "#E67E22", display: "flex",
                          alignItems: "center", justifyContent: "center"
                        }}>
                          <span style={{ fontSize: 7, fontWeight: 800, color: "#fff" }}>KITTY</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#9a3412" }}>
                          Kitty asks...
                        </span>
                      </div>
                      <div style={{
                        fontSize: 13, color: "#431407",
                        lineHeight: 1.6, fontStyle: "italic", marginBottom: 10
                      }}>
                        &quot;{currentPara?.kitty_question}&quot;
                      </div>
                      {!kittyAnswered && (
                        <motion.button whileTap={{ scale: 0.97 }}
                          onClick={() => setKittyAnswered(true)}
                          style={{
                            width: "100%", padding: "10px", borderRadius: 12,
                            background: "#E67E22", color: "#fff",
                            border: "none", cursor: "pointer",
                            fontSize: 12, fontWeight: 700
                          }}>
                          Mama — cheppu! 👆
                        </motion.button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* BLOCK 5 — Mama answers Kitty */}
                <AnimatePresence>
                  {kittyAnswered && currentPara?.mama_kitty_answer && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      style={{
                        background: "#fff", borderRadius: 16, padding: 16,
                        border: "0.5px solid rgba(0,0,0,0.06)", marginBottom: 12
                      }}>
                      <div style={{
                        display: "flex", alignItems: "center",
                        gap: 8, marginBottom: 10
                      }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 10,
                          background: "#0A2E28", display: "flex",
                          alignItems: "center", justifyContent: "center"
                        }}>
                          <span style={{ fontSize: 8, fontWeight: 800, color: "#fff" }}>MAMA</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#0A2E28" }}>
                          Mama answers Kitty
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "#1A1208", lineHeight: 1.7 }}>
                        {currentPara?.mama_kitty_answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* BLOCK 6 — Check question */}
                <AnimatePresence>
                  {(!currentPara?.is_key_concept || kittyAnswered) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      style={{
                        background: "#fff", borderRadius: 16, padding: 16,
                        border: "1.5px solid rgba(10,46,40,0.1)",
                        marginBottom: 12
                      }}>
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: "#185FA5",
                        letterSpacing: "0.08em", marginBottom: 10
                      }}>
                        🎯 QUICK CHECK KITTY!
                      </div>
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: "#1A1208",
                        lineHeight: 1.6, marginBottom: 14
                      }}>
                        {currentPara?.check_question}
                      </div>

                      {currentPara?.check_options?.map((opt: string, idx: number) => {
                        const isAnswered = selectedAnswer !== null;
                        const isThisCorrect = idx === currentPara.check_answer;
                        const isSelected = selectedAnswer === idx;
                        let bg = "#FAFAF8", border = "1px solid #E5E0D8", color = "#1A1208";
                        if (isAnswered && isThisCorrect) {
                          bg = "#F0FDF4"; border = "1.5px solid #16a34a"; color = "#14532d";
                        } else if (isAnswered && isSelected && !isThisCorrect) {
                          bg = "#FEF2F2"; border = "1.5px solid #ef4444"; color = "#991b1b";
                        }
                        return (
                          <motion.button key={idx}
                            whileTap={!isAnswered ? { scale: 0.98 } : {}}
                            onClick={() => handleAnswer(idx)}
                            style={{
                              display: "flex", alignItems: "center", gap: 10,
                              width: "100%", padding: "12px 14px",
                              marginBottom: 8, borderRadius: 12,
                              background: bg, border, color,
                              cursor: isAnswered ? "default" : "pointer",
                              textAlign: "left"
                            }}>
                            <span style={{ fontWeight: 700, flexShrink: 0 }}>
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            <span style={{ fontSize: 13, flex: 1 }}>{opt}</span>
                            {isAnswered && isThisCorrect &&
                              <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>}
                            {isAnswered && isSelected && !isThisCorrect &&
                              <span style={{ color: "#ef4444", fontWeight: 700 }}>✗</span>}
                          </motion.button>
                        );
                      })}

                      <AnimatePresence>
                        {selectedAnswer !== null && (
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                            {/* Explanation */}
                            <div style={{
                              background: "#F5F0E8", borderRadius: 10,
                              padding: "10px 14px", marginTop: 8, marginBottom: 10
                            }}>
                              <div style={{
                                fontSize: 9, fontWeight: 700, color: "#6B6560",
                                letterSpacing: "0.06em", marginBottom: 4
                              }}>EXPLANATION</div>
                              <div style={{ fontSize: 12, color: "#1A1208", lineHeight: 1.6 }}>
                                {currentPara?.check_explanation}
                              </div>
                            </div>

                            {/* Mama personal response */}
                            <div style={{
                              background: isCorrect ? "#F0FDF4" :
                                gaveUp ? "#FEF2F2" : "#FFF7ED",
                              borderRadius: 12, padding: "12px 14px",
                              border: `1px solid ${isCorrect ? "#16a34a33" :
                                gaveUp ? "#ef444433" : "#E67E2233"}`
                            }}>
                              <div style={{
                                display: "flex", alignItems: "center",
                                gap: 6, marginBottom: 6
                              }}>
                                <div style={{
                                  width: 24, height: 24, borderRadius: 8,
                                  background: isCorrect ? "#0A2E28" : "#E67E22",
                                  display: "flex", alignItems: "center",
                                  justifyContent: "center"
                                }}>
                                  <span style={{ fontSize: 6, fontWeight: 800, color: "#fff" }}>MAMA</span>
                                </div>
                                <span style={{
                                  fontSize: 10, fontWeight: 700,
                                  color: isCorrect ? "#0A2E28" : "#9a3412"
                                }}>
                                  {isCorrect ? "🎉 Correct!" :
                                    gaveUp ? "Parledu! Next time pakka!" : "Try again!"}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, lineHeight: 1.6, color: "#1A1208" }}>
                                {isCorrect
                                  ? currentPara?.mama_response_correct
                                  : gaveUp
                                  ? "Parledu Kitty — idi missed concepts lo save chesanu. Next time pakka chestav! 💪"
                                  : currentPara?.mama_response_wrong}
                              </div>
                            </div>

                            {/* Give up button */}
                            {!isCorrect && !gaveUp && attempts >= 1 && (
                              <motion.button
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleGiveUp}
                                style={{
                                  width: "100%", marginTop: 10, padding: "10px",
                                  borderRadius: 12, background: "transparent",
                                  border: "1px solid #ef4444", color: "#ef4444",
                                  fontSize: 12, fontWeight: 600, cursor: "pointer"
                                }}>
                                Mama, I give up! Show me the answer 🏳️
                              </motion.button>
                            )}

                            {/* Swipe hint when unlocked */}
                            {!isLocked && (
                              <motion.div
                                animate={{ y: [0, -4, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                style={{
                                  textAlign: "center", marginTop: 16,
                                  fontSize: 11, color: "#A89880"
                                }}>
                                {isLastPara && !isLastPage
                                  ? `🎉 Page ${currentPage?.book_page} complete! Swipe up for next page`
                                  : isLastPara && isLastPage
                                  ? "🏆 Chapter complete!"
                                  : "↑ Swipe up for next paragraph"}
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* BLOCK 7 — Ask Mama */}
                {selectedAnswer !== null && (
                  <div style={{
                    background: "#fff", borderRadius: 16, padding: 14,
                    border: "0.5px solid rgba(0,0,0,0.06)", marginBottom: 12
                  }}>
                    <div style={{ fontSize: 10, color: "#A89880", marginBottom: 8 }}>
                      💬 Oka doubt unte adugu Kitty...
                    </div>
                    {studentMessages.map((msg, i) => (
                      <div key={i} style={{
                        marginBottom: 8, display: "flex",
                        justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
                      }}>
                        <div style={{
                          maxWidth: "85%", padding: "8px 12px", borderRadius: 12,
                          background: msg.role === "user" ? "#0A2E28" : "#F5F0E8",
                          color: msg.role === "user" ? "#fff" : "#1A1208",
                          fontSize: 12, lineHeight: 1.6
                        }}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {mamaTyping && (
                      <div style={{ display: "flex", gap: 4, padding: "8px 12px" }}>
                        {[0, 1, 2].map(i => (
                          <motion.div key={i}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                            style={{ width: 6, height: 6, borderRadius: "50%", background: "#0A2E28" }} />
                        ))}
                      </div>
                    )}
                    <div style={{ 
                      display: "flex", 
                      gap: 8, 
                      marginTop: 8,
                      alignItems: "center"
                    }}>
                      <input
                        value={studentQuestion}
                        onChange={e => setStudentQuestion(e.target.value)}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        onKeyDown={async e => {
                          if (e.key === "Enter" && studentQuestion.trim()) {
                            const q = studentQuestion.trim();
                            setStudentQuestion("");
                            setStudentMessages(prev => [...prev, { role: "user", text: q }]);
                            setMamaTyping(true);
                            try {
                              const res = await fetch(
                                `${API}/ask?question=${encodeURIComponent(q)}&namespace=${namespace}&student_name=Kitty`
                              );
                              const data = await res.json();
                              setStudentMessages(prev => [...prev, { role: "mama", text: data.answer }]);
                            } catch {
                              setStudentMessages(prev => [...prev, { role: "mama", text: "Sorry, try again!" }]);
                            } finally {
                              setMamaTyping(false);
                            }
                          }
                        }}
                        placeholder="Type and press Enter..."
                        style={{
                          flex: 1, padding: "10px 12px", borderRadius: 20,
                          border: "1.5px solid #E5E0D8", background: "#FAFAF8",
                          fontSize: 12, color: "#1A1208", outline: "none"
                        }}
                      />
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                          if (!studentQuestion.trim() || mamaTyping) return;
                          const q = studentQuestion.trim();
                          setStudentQuestion("");
                          (document.activeElement as HTMLElement)?.blur();
                          setStudentMessages(prev => [...prev, { role: "user", text: q }]);
                          setMamaTyping(true);
                          try {
                            const res = await fetch(
                              `${API}/ask?question=${encodeURIComponent(q)}&namespace=${namespace}&student_name=Kitty`
                            );
                            const data = await res.json();
                            setStudentMessages(prev => [...prev, { role: "mama", text: data.answer }]);
                          } catch {
                            setStudentMessages(prev => [...prev, { role: "mama", text: "Sorry, try again!" }]);
                          } finally {
                            setMamaTyping(false);
                          }
                        }}
                        disabled={!studentQuestion.trim() || mamaTyping}
                        style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: studentQuestion.trim() && !mamaTyping ? "#0A2E28" : "#E5E0D8",
                          border: "none", 
                          cursor: studentQuestion.trim() && !mamaTyping ? "pointer" : "default",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0
                        }}>
                        <span style={{ color: "#fff", fontSize: 14 }}>↑</span>
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* BLOCK 8 — Chapter complete */}
                {isLastPara && isLastPage && selectedAnswer !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: "#FFFEF9",
                      borderRadius: 16,
                      border: "1px solid rgba(0,0,0,0.08)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Header */}
                    <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>🎉</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#1C1C1E", marginBottom: 2 }}>
                        Chapter Complete!
                      </div>
                      <div style={{ fontSize: 12, color: "#8E8E93", lineHeight: 1.4 }}>
                        Proud of you, Kitty! Pick your next challenge.
                      </div>
                    </div>

                    {/* iOS-style list menu */}
                    <div style={{ padding: "6px 0" }}>
                      {[
                        { icon: "📄", label: "Previous Papers", sublabel: "Past exam questions", mode: "previous" },
                        { icon: "📚", label: "Textbook Quiz",    sublabel: "Straight from the book",  mode: "textbook" },
                        { icon: "🔄", label: "Tweaked Questions", sublabel: "Same concepts, new angles", mode: "tweaked" },
                        { icon: "🤖", label: "AI-Generated Quiz", sublabel: "Fresh questions just for you", mode: "ai" },
                      ].map((q, i, arr) => (
                        <motion.button
                          key={q.mode}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => router.push(
                            `/quiz?namespace=${namespace}&concept=${encodeURIComponent(concept)}&mode=${q.mode}&subject=${encodeURIComponent(subject)}`
                          )}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 16px",
                            background: "transparent",
                            border: "none",
                            borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {/* Icon */}
                          <span style={{
                            fontSize: 20,
                            width: 32,
                            height: 32,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#F5F0E8",
                            borderRadius: 8,
                            flexShrink: 0,
                          }}>
                            {q.icon}
                          </span>

                          {/* Labels */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: "#1C1C1E", lineHeight: 1.3 }}>
                              {q.label}
                            </div>
                            <div style={{ fontSize: 11, color: "#8E8E93", marginTop: 1 }}>
                              {q.sublabel}
                            </div>
                          </div>

                          {/* Chevron */}
                          <span style={{ fontSize: 12, color: "#C7C7CC", flexShrink: 0 }}>›</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>
      )}

      {/* ════ ICMAI ZONE ════ */}
      {activeZone === "icmai" && (
        <PDFViewer
          pageNumber={currentPage?.pdf_page || currentPage?.page_ref || 11}
          onPrev={() => setCurrentPageIdx(Math.max(0, currentPageIdx - 1))}
          onNext={() => setCurrentPageIdx(Math.min(pages.length - 1, currentPageIdx + 1))}
          canGoPrev={currentPageIdx > 0}
          canGoNext={currentPageIdx < pages.length - 1}
          bookPage={currentPage?.book_page || 1}
          totalPages={pages.length}
        />
      )}
    </div>
  );
}

export default function LessonPage() {
  return (
    <Suspense fallback={
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#0A2E28" }}>Loading lesson...</div>
      </div>
    }>
      <LessonContent />
    </Suspense>
  );
}
