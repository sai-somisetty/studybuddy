"use client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://studybuddy-production-7776.up.railway.app";

function LessonContent() {
  const router = useRouter();
  const params = useSearchParams();

  const namespace = params.get("namespace") || "cma_f_law_ch1_s1";
  const concept   = params.get("concept")   || "Contract";
  const subject   = params.get("subject")   || "Business Laws";
  const chapter   = params.get("chapter")   || "Chapter 1";

  // State
  const [activeZone, setActiveZone]       = useState<"mama" | "icmai">("mama");
  const [pages, setPages]                 = useState<any[]>([]);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [currentParaIdx, setCurrentParaIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showKitty, setShowKitty]         = useState(false);
  const [kittyAnswered, setKittyAnswered] = useState(false);
  const [showCheck, setShowCheck]         = useState(false);
  const [touchStartX, setTouchStartX]     = useState<number | null>(null);
  const [studentQuestion, setStudentQuestion] = useState("");
  const [studentMessages, setStudentMessages] = useState<any[]>([]);
  const [askingMama, setAskingMama]       = useState(false);
  const [loading, setLoading]             = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentPage = pages[currentPageIdx];
  const paragraphs = currentPage?.mama_lines || [];
  const currentPara = paragraphs[currentParaIdx];
  const isLastPara = currentParaIdx === paragraphs.length - 1;
  const isLastPage = currentPageIdx === pages.length - 1;

  // Fetch on mount
  useEffect(() => {
    async function fetchPages() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/lesson/smart?namespace=${namespace}&concept=${encodeURIComponent(concept)}`);
        const data = await res.json();
        if (data.has_content && data.pages?.length > 0) {
          setPages(data.pages);
        }
      } catch (e) {
        console.error("Fetch failed:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPages();
  }, [namespace, concept]);

  // Show kitty after delay for key concepts
  useEffect(() => {
    if (!currentPara?.is_key_concept) return;
    const t = setTimeout(() => setShowKitty(true), 1500);
    return () => clearTimeout(t);
  }, [currentParaIdx, currentPageIdx, currentPara]);

  // Show check after kitty answered (or directly if not key concept)
  useEffect(() => {
    if (!currentPara) return;
    if (!currentPara.is_key_concept) {
      const t = setTimeout(() => setShowCheck(true), 500);
      return () => clearTimeout(t);
    }
    if (kittyAnswered) {
      const t = setTimeout(() => setShowCheck(true), 1000);
      return () => clearTimeout(t);
    }
  }, [kittyAnswered, currentPara, currentParaIdx]);

  // Scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [showKitty, kittyAnswered, showCheck, selectedAnswer, studentMessages]);

  // Ask Mama
  const askMama = async () => {
    if (!studentQuestion.trim() || askingMama) return;
    const q = studentQuestion.trim();
    setStudentQuestion("");
    setStudentMessages(prev => [...prev, { role: "student", text: q }]);
    setAskingMama(true);
    try {
      const res = await fetch(`${API}/ask?question=${encodeURIComponent(q)}&namespace=${namespace}&student_name=Kitty`);
      const data = await res.json();
      setStudentMessages(prev => [...prev, { role: "mama", text: data.answer, source: data.source }]);
    } catch {
      setStudentMessages(prev => [...prev, { role: "mama", text: "Sorry Kitty — try again!" }]);
    } finally {
      setAskingMama(false);
    }
  };

  // Navigate
  const goNextPara = () => {
    setCurrentParaIdx(prev => prev + 1);
    setSelectedAnswer(null);
    setShowKitty(false);
    setKittyAnswered(false);
    setShowCheck(false);
    setStudentMessages([]);
  };

  const goNextPage = () => {
    setCurrentPageIdx(prev => prev + 1);
    setCurrentParaIdx(0);
    setSelectedAnswer(null);
    setShowKitty(false);
    setKittyAnswered(false);
    setShowCheck(false);
    setStudentMessages([]);
  };

  // ── LOADING ──
  if (loading) {
    return (
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📖</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0A2E28", marginBottom: 8 }}>Mama is preparing your lesson...</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
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
        <div style={{ background: "#0A2E28", padding: "14px 20px" }}>
          <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>← Back</button>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 700, color: "#fff", marginTop: 10 }}>{concept}</div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📖</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1208", marginBottom: 8 }}>Mama is preparing this chapter...</div>
            <div style={{ fontSize: 12, color: "#6B6560" }}>Content coming soon!</div>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN UI ──
  return (
    <div className="app-shell">
      {/* Header */}
      <div style={{ background: "#0A2E28", padding: "14px 20px 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>← Back</button>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
            Page {currentPageIdx + 1}/{pages.length} · Para {currentParaIdx + 1}/{paragraphs.length}
          </div>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
          <motion.div animate={{ width: `${paragraphs.length > 0 ? ((currentParaIdx + 1) / paragraphs.length) * 100 : 0}%` }}
            style={{ height: "100%", background: "#E67E22", borderRadius: 2 }} />
        </div>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>{concept}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{subject} · {chapter}</div>
      </div>

      {/* Zone toggle */}
      <div style={{ display: "flex", background: "#F5F0E8", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
        <button onClick={() => setActiveZone("mama")} style={{ flex: 1, padding: "10px", fontSize: 12, fontWeight: activeZone === "mama" ? 700 : 500, background: activeZone === "mama" ? "#0A2E28" : "transparent", color: activeZone === "mama" ? "#fff" : "#6B6560", border: "none", cursor: "pointer" }}>
          🧠 Mama Zone
        </button>
        <button onClick={() => setActiveZone("icmai")} style={{ flex: 1, padding: "10px", fontSize: 12, fontWeight: activeZone === "icmai" ? 700 : 500, background: activeZone === "icmai" ? "#0E6655" : "transparent", color: activeZone === "icmai" ? "#fff" : "#6B6560", border: "none", cursor: "pointer" }}>
          📖 ICMAI Zone
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "14px 16px 140px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}
        onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => { if (touchStartX === null) return; const diff = touchStartX - e.changedTouches[0].clientX; if (Math.abs(diff) > 50) setActiveZone(diff > 0 ? "icmai" : "mama"); setTouchStartX(null); }}>

        {/* ════ MAMA ZONE ════ */}
        {activeZone === "mama" && currentPara && (
          <AnimatePresence mode="wait">
            <motion.div key={`${currentPageIdx}-${currentParaIdx}`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Heading */}
              {currentPara.heading && (
                <div style={{ fontSize: 9, fontWeight: 700, color: "#0E6655", letterSpacing: "0.08em", background: "#E1F5EE", padding: "6px 12px", borderRadius: 8 }}>
                  {currentPara.heading}
                </div>
              )}

              {/* ICMAI text */}
              <div style={{ background: "#E1F5EE", borderRadius: 14, padding: 14, border: "1px solid rgba(14,102,85,0.12)" }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: "#0E6655", letterSpacing: "0.08em", marginBottom: 6 }}>📖 ICMAI TEXTBOOK</div>
                <div style={{ fontSize: 13, color: "#085041", lineHeight: 1.7, fontFamily: "Georgia,serif", fontStyle: "italic" }}>
                  {currentPara.text}
                </div>
              </div>

              {/* Mama explains */}
              <div style={{ background: "#fff", borderRadius: 14, padding: 14, border: "0.5px solid rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: "#0A2E28", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 7, fontWeight: 800, color: "#fff" }}>MAMA</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#0A2E28" }}>Mama explains</span>
                </div>
                <div style={{ fontSize: 13, color: "#1A1208", lineHeight: 1.7 }}>{currentPara.tenglish}</div>
              </div>

              {/* Kitty interrupts */}
              {currentPara.is_key_concept && showKitty && !kittyAnswered && currentPara.kitty_question && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 20 }}
                  style={{ background: "linear-gradient(135deg,#FEF9C3,#FFEDD5)", borderRadius: 14, padding: 14, border: "1px solid rgba(230,126,34,0.15)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: "#E67E22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 6, fontWeight: 800, color: "#fff" }}>KITTY</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#9a3412" }}>Kitty asks</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#431407", lineHeight: 1.6, fontStyle: "italic", marginBottom: 10 }}>
                    &quot;{currentPara.kitty_question}&quot;
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setKittyAnswered(true)}
                    style={{ padding: "8px 16px", borderRadius: 10, background: "#E67E22", color: "#fff", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}>
                    Mama — cheppu! 👆
                  </motion.button>
                </motion.div>
              )}

              {/* Mama answers Kitty */}
              {kittyAnswered && currentPara.mama_kitty_answer && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: "#fff", borderRadius: 14, padding: 14, border: "0.5px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: "#0A2E28", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 6, fontWeight: 800, color: "#fff" }}>MAMA</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#0A2E28" }}>Mama answers Kitty</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#1A1208", lineHeight: 1.7 }}>{currentPara.mama_kitty_answer}</div>
                </motion.div>
              )}

              {/* Check question */}
              {showCheck && currentPara.check_question && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: "#fff", borderRadius: 14, padding: 14, border: "1.5px solid rgba(10,46,40,0.1)" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#185FA5", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Kitty — oka quick check! 🎯
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1208", lineHeight: 1.6, marginBottom: 12 }}>
                    {currentPara.check_question}
                  </div>
                  {(currentPara.check_options || []).map((opt: string, idx: number) => {
                    const answered = selectedAnswer !== null;
                    const isCorrect = idx === currentPara.check_answer;
                    const isSelected = selectedAnswer === idx;
                    let bg = "#FAFAF8", border = "1px solid #E5E0D8", color = "#1A1208";
                    if (answered && isCorrect) { bg = "#F0FDF4"; border = "1.5px solid #16a34a"; color = "#14532d"; }
                    else if (answered && isSelected) { bg = "#FEF2F2"; border = "1.5px solid #ef4444"; color = "#991b1b"; }
                    return (
                      <motion.button key={idx} whileTap={!answered ? { scale: 0.98 } : {}}
                        onClick={() => { if (!answered) setSelectedAnswer(idx); }}
                        style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", marginBottom: 6, borderRadius: 10, background: bg, border, color, fontSize: 12, fontWeight: 500, cursor: answered ? "default" : "pointer", lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700, marginRight: 6 }}>{String.fromCharCode(65 + idx)}.</span>{opt}
                        {answered && isCorrect && <span style={{ float: "right", color: "#16a34a" }}>✓</span>}
                        {answered && isSelected && !isCorrect && <span style={{ float: "right", color: "#ef4444" }}>✗</span>}
                      </motion.button>
                    );
                  })}

                  {/* Answer feedback */}
                  {selectedAnswer !== null && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div style={{ marginTop: 8, borderRadius: 10, padding: "10px 12px", background: selectedAnswer === currentPara.check_answer ? "#F0FDF4" : "#FFF7ED", border: selectedAnswer === currentPara.check_answer ? "1px solid #16a34a33" : "1px solid #E67E2233" }}>
                        <div style={{ fontSize: 12, color: selectedAnswer === currentPara.check_answer ? "#14532d" : "#9a3412", lineHeight: 1.6 }}>
                          {selectedAnswer === currentPara.check_answer ? currentPara.mama_response_correct : currentPara.mama_response_wrong}
                        </div>
                      </div>
                      {currentPara.check_explanation && (
                        <div style={{ marginTop: 6, fontSize: 11, color: "#6B6560", lineHeight: 1.5 }}>
                          {currentPara.check_explanation}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Student ask Mama */}
              {selectedAnswer !== null && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {studentMessages.map((msg, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: msg.role === "student" ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "85%", padding: "8px 12px", borderRadius: msg.role === "student" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: msg.role === "student" ? "#0A2E28" : "#fff", color: msg.role === "student" ? "#fff" : "#1A1208", fontSize: 12, lineHeight: 1.5, border: msg.role === "mama" ? "0.5px solid rgba(0,0,0,0.06)" : "none" }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 6 }}>
                    <input value={studentQuestion} onChange={e => setStudentQuestion(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && askMama()}
                      placeholder="Oka doubt unte adugu Kitty... 💬"
                      style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #E5E0D8", background: "#FAFAF8", fontSize: 12, outline: "none" }} />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={askMama} disabled={!studentQuestion.trim() || askingMama}
                      style={{ padding: "10px 14px", borderRadius: 10, background: studentQuestion.trim() ? "#0A2E28" : "#E5E0D8", color: "#fff", border: "none", fontSize: 12, cursor: studentQuestion.trim() ? "pointer" : "default" }}>↑</motion.button>
                  </div>
                </div>
              )}

              {/* Proceed */}
              {selectedAnswer !== null && !isLastPara && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileTap={{ scale: 0.97 }} onClick={goNextPara}
                  style={{ width: "100%", padding: "14px", borderRadius: 14, background: "#0A2E28", color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
                  Understood! Next paragraph →
                </motion.button>
              )}

              {selectedAnswer !== null && isLastPara && !isLastPage && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ background: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", borderRadius: 14, padding: 16, textAlign: "center", border: "1px solid rgba(14,102,85,0.15)" }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🎉</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0E6655", marginBottom: 4 }}>Chala baaga chesav Kitty!</div>
                  <div style={{ fontSize: 12, color: "#6B9B8A", marginBottom: 12 }}>Book Page {currentPage?.page_ref} complete!</div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={goNextPage}
                    style={{ padding: "12px 24px", borderRadius: 14, background: "#E67E22", color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
                    Next Page →
                  </motion.button>
                </motion.div>
              )}

              {selectedAnswer !== null && isLastPara && isLastPage && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ background: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", borderRadius: 14, padding: 16, textAlign: "center", border: "1.5px solid rgba(14,102,85,0.2)" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0E6655", marginBottom: 4 }}>Chapter complete! Amazing work Kitty!</div>
                  <div style={{ fontSize: 12, color: "#6B9B8A", marginBottom: 14 }}>Ready for quiz?</div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                    {[{ icon: "📚", label: "Textbook", mode: "textbook" }, { icon: "🔄", label: "Tweaked", mode: "tweaked" }, { icon: "🤖", label: "AI Quiz", mode: "ai" }].map(q => (
                      <motion.button key={q.mode} whileTap={{ scale: 0.95 }}
                        onClick={() => router.push(`/quiz?namespace=${namespace}&concept=${encodeURIComponent(concept)}&mode=${q.mode}&subject=${encodeURIComponent(subject)}`)}
                        style={{ padding: "8px 14px", borderRadius: 10, background: "#fff", border: "1px solid rgba(14,102,85,0.15)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        <span>{q.icon}</span>
                        <span style={{ fontSize: 11, color: "#0E6655", fontWeight: 600 }}>{q.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ════ ICMAI ZONE ════ */}
        {activeZone === "icmai" && currentPara && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: "#FFFEF9", borderRadius: 16, padding: 20, border: "1px solid rgba(14,102,85,0.15)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#0E6655", letterSpacing: "0.08em", marginBottom: 12 }}>
              📖 ICMAI OFFICIAL TEXT · PAGE {currentPage?.page_ref}
            </div>
            {currentPara.heading && (
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0A2E28", marginBottom: 10 }}>{currentPara.heading}</div>
            )}
            <div style={{ fontSize: 13, color: "#1A1208", lineHeight: 1.9, fontFamily: "Georgia,serif" }}>
              {currentPara.text}
            </div>
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "0.5px solid rgba(14,102,85,0.1)", fontSize: 10, color: "#6B9B8A", fontStyle: "italic" }}>
              Source: ICMAI Study Material · {chapter}
            </div>

            {/* Page navigation in ICMAI zone */}
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <button onClick={() => { if (currentParaIdx > 0) { setCurrentParaIdx(prev => prev - 1); setSelectedAnswer(null); setShowCheck(false); setShowKitty(false); setKittyAnswered(false); } }}
                disabled={currentParaIdx === 0}
                style={{ padding: "6px 14px", borderRadius: 20, background: currentParaIdx === 0 ? "#E5E0D8" : "#0E6655", color: "#fff", border: "none", fontSize: 11, cursor: currentParaIdx === 0 ? "default" : "pointer" }}>← Prev</button>
              <span style={{ fontSize: 11, color: "#A89880" }}>Para {currentParaIdx + 1}/{paragraphs.length}</span>
              <button onClick={() => { if (currentParaIdx < paragraphs.length - 1) goNextPara(); else if (!isLastPage) goNextPage(); }}
                disabled={isLastPara && isLastPage}
                style={{ padding: "6px 14px", borderRadius: 20, background: isLastPara && isLastPage ? "#E5E0D8" : "#0E6655", color: "#fff", border: "none", fontSize: 11, cursor: isLastPara && isLastPage ? "default" : "pointer" }}>Next →</button>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>
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
