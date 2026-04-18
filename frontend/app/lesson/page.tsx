"use client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import MamaAgent from "@/components/MamaAgent";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { SomiIcons } from "@/components/SomiIcons";

const API = process.env.NEXT_PUBLIC_API_URL || "https://studybuddy-production-7776.up.railway.app";

const PDFViewer = dynamic(() => import('./PDFViewer'), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", justifyContent: "center", padding: 40, color: "#071739" }}>
      Loading PDF...
    </div>
  )
});

// ─── TYPES ───────────────────────────────────────────────────────────────────
type ExplanationTab = "quick" | "example" | "deepdive";
type FailureReason = "concept" | "silly" | "misread";
type ConfidenceLevel = "low" | "medium" | "high";

interface MamaLine {
  text: string;
  /** Replacement image when textbook figure was not describable as text */
  image_url?: string | null;
  heading?: string;
  is_key_concept: boolean;
  english?: string | null;
  english_variation_2?: string | null;
  english_variation_3?: string | null;
  tenglish: string;
  tenglish_variation_2?: string;
  tenglish_variation_3?: string;
  kitty_question?: string;
  mama_kitty_answer?: string;
  check_question: string;
  check_options: string[];
  check_answer: number;
  check_explanation: string;
  mama_response_correct: string;
  mama_response_wrong: string;
  mamas_tip?: string;
  concept_title?: string;
  order_index?: number;
}

interface LessonPage {
  id: string;
  namespace: string;
  concept: string;
  mama_lines: MamaLine[];
  book_page: number;
  pdf_page: number;
  is_verified: boolean;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getStudentName(): string {
  if (typeof window === "undefined") return "Student";
  return localStorage.getItem("somi_student_name") || "Student";
}

function haptic() {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(30);
  }
}

function isParaStarred(pageId: string | undefined, paraIdx: number): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = JSON.parse(localStorage.getItem("somi_starred") || "[]");
    const arr = Array.isArray(raw) ? raw : [];
    return arr.some((s: { key: string }) => s.key === `${pageId}_${paraIdx}`);
  } catch {
    return false;
  }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
function LessonContent() {
  const router = useRouter();
  const params = useSearchParams();

  const namespace = params.get("namespace") || "cma_f_law_ch1_s1";
  const concept   = params.get("concept")   || "Sources of Law";
  const subject   = params.get("subject")   || "Business Laws";
  const chapter   = params.get("chapter")   || "Chapter 1";

  // ── Core state ──
  const [pages, setPages]                     = useState<LessonPage[]>([]);
  const [currentPageIdx, setCurrentPageIdx]   = useState(0);
  const [currentParaIdx, setCurrentParaIdx]   = useState(0);
  const [loading, setLoading]                 = useState(true);

  // ── Student personalization ──
  const [studentName, setStudentName]         = useState("Student");

  // ── Explanation tab ──
  const [activeTab, setActiveTab]             = useState<ExplanationTab>("quick");

  // ── MCQ state ──
  const [showMCQ, setShowMCQ]                 = useState(false);
  const [selectedAnswer, setSelectedAnswer]   = useState<number | null>(null);
  const [attempts, setAttempts]               = useState(0);
  const [gaveUp, setGaveUp]                   = useState(false);

  // ── Post-MCQ intelligence ──
  const [showFailureReason, setShowFailureReason] = useState(false);
  const [failureReason, setFailureReason]         = useState<FailureReason | null>(null);
  const [showConfidence, setShowConfidence]       = useState(false);
  const [confidence, setConfidence]               = useState<ConfidenceLevel | null>(null);

  // ── ICMAI accordion ──
  const [icmaiExpanded, setIcmaiExpanded]     = useState(false);

  // ── Chapter map drawer ──
  const [showDrawer, setShowDrawer]           = useState(false);

  // ── Active zone (Mama / PDF) ──
  const [activeZone, setActiveZone]           = useState<"mama" | "icmai">("mama");

  const [lang, setLang] = useState<"tenglish" | "english">(() => {
    if (typeof window === "undefined") return "tenglish";
    const v = localStorage.getItem("somi_lang");
    return v === "english" ? "english" : "tenglish";
  });

  function getContent(para: MamaLine | undefined, variation: "v1" | "v2" | "v3"): string {
    if (!para) return "";
    if (variation === "v1") {
      const masterContent = lang === "english"
        ? (para.english_variation_3 || para.tenglish_variation_3 || para.english || para.tenglish || "")
        : (para.tenglish_variation_3 || para.english_variation_3 || para.tenglish || para.english || "");
      return masterContent.split("\n\n").slice(0, 3).join("\n\n").trim();
    }
    if (variation === "v2") {
      if (lang === "english") return (para.english_variation_2 || para.tenglish_variation_2 || "").trim();
      return (para.tenglish_variation_2 || para.english_variation_2 || "").trim();
    }
    if (lang === "english") return (para.english_variation_3 || para.tenglish_variation_3 || "").trim();
    return (para.tenglish_variation_3 || para.english_variation_3 || "").trim();
  }

  // Re-read somi_starred after toggle (localStorage does not trigger React)
  const [paraImportantTick, setParaImportantTick] = useState(0);

  // ── Touch ──
  const [touchStartX, setTouchStartX]         = useState<number | null>(null);
  const [touchStartY, setTouchStartY]         = useState<number | null>(null);

  const [conceptDone, setConceptDone]         = useState(false);
  const [showTestYourself, setShowTestYourself] = useState(false);
  const [testIdx, setTestIdx]                 = useState(0);
  const [testAnswers, setTestAnswers]         = useState<{ [key: number]: number }>({});
  const [testComplete, setTestComplete]       = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  // Derived
  const currentPage  = pages[currentPageIdx];
  const paragraphs   = currentPage?.mama_lines || [];
  const currentPara  = paragraphs[currentParaIdx];
  const isLastPara   = currentParaIdx === paragraphs.length - 1;
  const isLastPage   = currentPageIdx === pages.length - 1;
  const isCorrect    = selectedAnswer === currentPara?.check_answer;
  const hasExample   = true;
  const hasDeepDive  = true;
  const paraKey      = `${currentPageIdx}-${currentParaIdx}`;

  const paraIsStarred = useMemo(
    () => isParaStarred(currentPage?.id, currentParaIdx),
    [currentPage?.id, currentParaIdx, paraImportantTick]
  );

  // ── Load student prefs ──
  useEffect(() => {
    setStudentName(getStudentName());
  }, []);

  // ── Fetch pages ──
  useEffect(() => {
    async function fetchPages() {
      setLoading(true);
      try {
        const res  = await fetch(`${API}/lesson/smart?namespace=${namespace}`);
        const data = await res.json();
        if (data.pages?.length > 0) setPages(data.pages);
      } catch (e) {
        console.error("Fetch failed:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPages();
  }, [namespace]);

  // ── Reset on para change ──
  const resetParaState = useCallback(() => {
    setConceptDone(false);
    setShowTestYourself(false);
    setTestIdx(0);
    setTestAnswers({});
    setTestComplete(false);
    setSelectedAnswer(null);
    setAttempts(0);
    setGaveUp(false);
    setShowMCQ(false);
    setShowFailureReason(false);
    setFailureReason(null);
    setShowConfidence(false);
    setConfidence(null);
    setActiveTab("quick");
    setIcmaiExpanded(false);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ── Navigation ──
  const goNextPara = useCallback(() => {
    haptic();
    if (!isLastPara) {
      setCurrentParaIdx(p => p + 1);
      resetParaState();
    } else if (!isLastPage) {
      setCurrentPageIdx(p => p + 1);
      setCurrentParaIdx(0);
      resetParaState();
    } else {
      // Last concept of last page — show complete
      setConceptDone(true);
    }
  }, [isLastPara, isLastPage, resetParaState]);

  const goPrevPara = useCallback(() => {
    if (currentParaIdx > 0) {
      setCurrentParaIdx(p => p - 1);
    } else if (currentPageIdx > 0) {
      setCurrentPageIdx(p => p - 1);
      setCurrentParaIdx(0);
    }
    resetParaState();
  }, [currentParaIdx, currentPageIdx, resetParaState]);

  // ── MCQ handling ──
  const handleAnswer = (idx: number) => {
    if (gaveUp || (selectedAnswer !== null && isCorrect)) return;
    setSelectedAnswer(idx);
    setAttempts(p => p + 1);

    if (idx === currentPara.check_answer) {
      haptic();
      // Show confidence after correct
      setTimeout(() => setShowConfidence(true), 1200);
    } else {
      // Show failure reason after wrong
      setTimeout(() => setShowFailureReason(true), 1000);
    }
  };

  const handleGiveUp = () => {
    setGaveUp(true);
    setSelectedAnswer(currentPara?.check_answer);
    setShowFailureReason(true);
  };

  const handleConfidence = (level: ConfidenceLevel) => {
    setConfidence(level);
    haptic();
    // Auto advance after 600ms
    setTimeout(() => goNextPara(), 600);
  };

  // Collect all check questions from all pages
  const allQuestions = pages.flatMap(p =>
    (p.mama_lines || []).filter(l => l.check_question)
  );
  const testCorrectTotal = allQuestions.reduce(
    (n, q, i) => n + (testAnswers[i] === q.check_answer ? 1 : 0),
    0
  );

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><SomiIcons.BookOpen size={40} /></div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#071739", marginBottom: 8 }}>
            Mama is preparing your lesson...
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                style={{ width: 8, height: 8, borderRadius: "50%", background: "#071739" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NO CONTENT
  // ─────────────────────────────────────────────────────────────────────────
  if (!loading && pages.length === 0) {
    return (
      <div className="app-shell">
        <div style={{ background: "#071739", padding: "14px 20px" }}>
          <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>← Back</button>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 700, color: "#fff", marginTop: 10 }}>{concept}</div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><SomiIcons.Pray size={48} /></div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#071739", marginBottom: 8 }}>
              Mama inkaa prepare chestundi {studentName}!
            </div>
            <div style={{ fontSize: 12, color: "#A4B5C4", lineHeight: 1.6 }}>
              This chapter's content is being verified.<br />Check back soon!
            </div>
            <button onClick={() => router.back()} style={{ marginTop: 20, padding: "10px 24px", borderRadius: 20, background: "#071739", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN UI
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell" style={{ position: "relative" }}>

      {/* ── CHAPTER MAP DRAWER ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100 }} />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{
                position: "fixed", top: 0, left: 0, bottom: 0, width: "80%", maxWidth: 300,
                background: "#fff", zIndex: 101, overflowY: "auto", padding: "20px 0"
              }}>
              <div style={{ padding: "0 20px 16px", borderBottom: "1px solid rgba(7,23,57,0.08)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#071739", display: "flex", alignItems: "center", gap: 6 }}><SomiIcons.Pin size={14} />Chapter Map</div>
                <div style={{ fontSize: 10, color: "#4B6382", marginTop: 2 }}>{subject} · {chapter}</div>
              </div>
              {pages.map((page, pi) => {
                const isActivePage = pi === currentPageIdx;
                const conceptName =
                  page.mama_lines[0]?.concept_title ||
                  page.concept ||
                  `Concept ${pi + 1}`;
                const paraCount = page.mama_lines.length;
                const keyCount = page.mama_lines.filter((l) => l.is_key_concept).length;

                return (
                  <button
                    key={page.id || `page-${pi}`}
                    type="button"
                    onClick={() => {
                      setCurrentPageIdx(pi);
                      setCurrentParaIdx(0);
                      resetParaState();
                      setShowDrawer(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 20px",
                      textAlign: "left",
                      background: isActivePage ? "rgba(7,23,57,0.05)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      borderLeft: isActivePage ? "3px solid #071739" : "3px solid transparent",
                      borderBottom: "1px solid rgba(7,23,57,0.04)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: isActivePage ? 700 : 500,
                        color: "#071739",
                        lineHeight: 1.35,
                      }}
                    >
                      {conceptName}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#4B6382",
                        marginTop: 3,
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <span>Page {page.book_page}</span>
                      <span>·</span>
                      <span>{paraCount} sections</span>
                      {keyCount > 0 && (
                        <span>
                          · <span style={{ display: "inline-flex", alignItems: "center", gap: 2, verticalAlign: "middle" }}><SomiIcons.Key size={12} />{keyCount}</span>
                        </span>
                      )}
                    </div>
                    {isActivePage && (
                      <div
                        style={{
                          fontSize: 9,
                          color: "#E3C39D",
                          marginTop: 4,
                          fontWeight: 600,
                        }}
                      >
                        Currently on section {currentParaIdx + 1}/{paraCount}
                      </div>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{ background: "#071739", padding: "14px 20px 10px", flexShrink: 0, position: "relative", overflow: "hidden" }}>
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: -28,
            right: -8,
            fontFamily: "'DM Serif Display', serif",
            fontWeight: 900,
            fontSize: "clamp(72px, 16vw, 140px)",
            color: "#fff",
            opacity: 0.04,
            lineHeight: 1,
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          {String(currentPage?.book_page ?? "")}
        </span>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, position: "relative", zIndex: 1 }}>
          {/* Left — hamburger + back (hidden on desktop — sidebar nav) */}
          <div data-mobile-nav="true" style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setShowDrawer(true)}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 14, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SomiIcons.Menu size={16} color="#fff" />
            </button>
            <button onClick={() => router.back()}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
              ← Back
            </button>
          </div>

          {/* Right — language + zone toggle */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => {
                const next = lang === "tenglish" ? "english" : "tenglish";
                setLang(next);
                localStorage.setItem("somi_lang", next);
              }}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {lang === "tenglish" ? "ENG" : "తెలు"}
            </button>
            <button type="button" onClick={() => setActiveZone(z => z === "mama" ? "icmai" : "mama")}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {activeZone === "mama" ? <SomiIcons.BookOpen size={14} color="rgba(255,255,255,0.85)" /> : <SomiIcons.Brain size={14} color="rgba(255,255,255,0.85)" />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden", marginBottom: 6, position: "relative", zIndex: 1 }}>
          <motion.div
            animate={{ width: `${paragraphs.length > 0 ? ((currentParaIdx + 1) / paragraphs.length) * 100 : 0}%` }}
            style={{ height: "100%", background: "#E3C39D", borderRadius: 2 }} />
        </div>

        {/* Title + progress label */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>{concept}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{subject} · {chapter}</div>
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textAlign: "right" }}>
            <div>Concept {currentParaIdx + 1}/{paragraphs.length}</div>
            <div>Page {currentPageIdx + 1}/{pages.length}</div>
          </div>
        </div>
      </div>

      {/* ── MAMA ZONE ──────────────────────────────────────────────────── */}
      {activeZone === "mama" && (
        <div
          ref={contentRef}
          style={{ flex: 1, overflowY: "auto", padding: "14px 20px 140px" }}
          onTouchStart={e => {
            setTouchStartX(e.touches[0].clientX);
            setTouchStartY(e.touches[0].clientY);
          }}
          onTouchEnd={e => {
            if (touchStartX === null || touchStartY === null) return;
            const dx = touchStartX - e.changedTouches[0].clientX;
            const dy = touchStartY - e.changedTouches[0].clientY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
              // dx > 0: swipe left → open ICMAI PDF
              if (dx > 0) setActiveZone("icmai");
            }
            setTouchStartX(null);
            setTouchStartY(null);
          }}
        >
          {currentPara ? (
            <AnimatePresence mode="wait">
              <motion.div key={paraKey}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {currentPara.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentPara.image_url}
                    alt={currentPara.concept_title || "Concept image"}
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      marginBottom: 12,
                      border: "1px solid rgba(7,23,57,0.06)",
                    }}
                  />
                ) : null}

                {/* ── BLOCK 1: ICMAI accordion (collapsed by default — MAMA first) ── */}
                <motion.div
                  style={{
                    background: "rgba(7,23,57,0.05)", borderRadius: 16,
                    border: "1px solid rgba(7,23,57,0.08)", overflow: "hidden"
                  }}>
                  <button
                    type="button"
                    aria-expanded={icmaiExpanded}
                    onClick={() => setIcmaiExpanded(e => !e)}
                    style={{
                      width: "100%", padding: "12px 16px", background: "transparent",
                      border: "none", cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "space-between", gap: 8
                    }}>
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: "#071739",
                      display: "inline-flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0,
                    }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span aria-hidden>📖</span>
                        <span style={{ fontSize: 11, fontWeight: 700 }}>ICMAI</span>
                      </span>
                      <span style={{ fontSize: 11, color: "#4B6382", fontWeight: 500 }}>
                        · Page {currentPage?.book_page ?? "—"}
                      </span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "#071739" }} aria-hidden>
                        {icmaiExpanded ? "▲" : "▼"}
                      </span>
                    </span>
                  </button>
                  <AnimatePresence>
                    {icmaiExpanded && (
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                        style={{ overflow: "hidden" }}>
                        <div style={{ padding: "0 16px 14px", fontSize: 13, color: "#071739", lineHeight: 1.8, fontFamily: "Georgia,serif", fontStyle: "italic", whiteSpace: "pre-wrap" }}>
                          {(currentPara.text || "")
                            .replace(/```mermaid[\s\S]*?```/g, "[Diagram — see above]")
                            .trim()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {currentPara?.text?.includes("```mermaid") && (
                  <div style={{ margin: "12px 0" }}>
                    <MarkdownRenderer
                      content={
                        currentPara.text.match(/```mermaid[\s\S]*?```/)?.[0] || ""
                      }
                    />
                  </div>
                )}

                {/* ── BLOCK 2: Explanation Tabs ── */}
                <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
                  {/* Tab bar */}
                  <div style={{ display: "flex", borderBottom: "1px solid #F0EDE8" }}>
                    {([
                      { id: "quick" as const,    label: (<><span style={{ display: "inline-flex", marginRight: 4, verticalAlign: "middle" }}><SomiIcons.Bolt size={14} color={activeTab === "quick" ? "#fff" : "#4B6382"} /></span>Quick</>),   available: true },
                      { id: "example" as const,  label: (<><span style={{ display: "inline-flex", marginRight: 4, verticalAlign: "middle" }}><SomiIcons.Pen size={14} color={activeTab === "example" ? "#fff" : "#4B6382"} /></span>Revise</>),  available: hasExample },
                      { id: "deepdive" as const, label: (<><span style={{ display: "inline-flex", marginRight: 4, verticalAlign: "middle" }}><SomiIcons.BookOpen size={14} color={activeTab === "deepdive" ? "#fff" : "#4B6382"} /></span>Master</>),  available: hasDeepDive },
                    ] as const).map(tab => (
                      <button key={tab.id}
                        onClick={() => setActiveTab(tab.id as ExplanationTab)}
                        style={{
                          flex: 1, padding: "10px 4px", fontSize: 10, fontWeight: activeTab === tab.id ? 700 : 500,
                          background: activeTab === tab.id ? "#071739" : "transparent",
                          color: activeTab === tab.id ? "#fff" : tab.available ? "#4B6382" : "#A4B5C4",
                          border: "none", cursor: tab.available ? "pointer" : "default"
                        }}>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: "#071739", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 7, fontWeight: 800, color: "#E3C39D" }}>MAMA</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#071739", flex: 1, minWidth: 0 }}>
                        {activeTab === "quick"    ? `Mama explains, ${studentName}...` :
                         activeTab === "example"  ? `Revise with Mama, ${studentName}...` :
                                                    `Master the depth, ${studentName}...`}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto", flexShrink: 0 }}>
                        {currentPage?.is_verified ? (
                          <span style={{ fontSize: 8, background: "rgba(7,23,57,0.05)", color: "#071739", padding: "2px 6px", borderRadius: 20, fontWeight: 600 }}>✓ Verified</span>
                        ) : (
                          <span style={{ fontSize: 8, background: "rgba(227,195,157,0.08)", color: "#E3C39D", padding: "2px 6px", borderRadius: 20, fontWeight: 600 }}>AI Draft</span>
                        )}
                        {/* ── Important + Report icons ── */}
                        <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => {
                              const key = `${currentPage?.id}_${currentParaIdx}`;
                              const stored: any[] = JSON.parse(localStorage.getItem("somi_starred") || "[]");
                              const exists = stored.findIndex((s) => s.key === key);

                              if (exists >= 0) {
                                stored.splice(exists, 1);
                              } else {
                                stored.push({
                                  key,
                                  pageId: currentPage?.id,
                                  paraIdx: currentParaIdx,
                                  namespace,
                                  concept,
                                  subject,
                                  chapter,
                                  title: currentPara?.concept_title || currentPara?.text?.slice(0, 60) || concept,
                                  bookPage: currentPage?.book_page,
                                  quickContent: getContent(currentPara, "v1"),
                                  reviseContent: getContent(currentPara, "v2"),
                                  starredAt: new Date().toISOString(),
                                });
                              }
                              localStorage.setItem("somi_starred", JSON.stringify(stored));

                              const impKey = `imp_${currentPage?.id}_${currentParaIdx}`;
                              if (exists >= 0) localStorage.removeItem(impKey);
                              else localStorage.setItem(impKey, "1");

                              haptic();
                              setParaImportantTick((t) => t + 1);
                            }}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: paraIsStarred ? "rgba(227,195,157,0.15)" : "transparent",
                              border: paraIsStarred
                                ? "1.5px solid #E3C39D"
                                : "1.5px solid rgba(7,23,57,0.06)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              padding: 0,
                            }}
                          >
                            {paraIsStarred ? <SomiIcons.Star size={14} /> : <SomiIcons.StarOutline size={14} />}
                          </motion.button>

                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => {
                              const reason = window.prompt(
                                "Somisetty, em issue kanipinchindi?\n\n" +
                                  "1. Wrong answer/explanation\n" +
                                  "2. Spelling/grammar error\n" +
                                  "3. Content doesn't match textbook\n" +
                                  "4. Other\n\n" +
                                  "Type 1-4 or describe the issue:"
                              );
                              if (reason) {
                                fetch(`${API}/report`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    page_id: currentPage?.id,
                                    para_index: currentParaIdx,
                                    concept: concept,
                                    namespace: namespace,
                                    reason: reason,
                                    student: studentName,
                                    timestamp: new Date().toISOString(),
                                  }),
                                }).catch(console.error);
                                alert("Report sent! MAMA team will fix this. Thanks!");
                                haptic();
                              }
                            }}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: "transparent",
                              border: "1.5px solid rgba(7,23,57,0.06)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              padding: 0,
                              color: "#071739",
                              opacity: 0.35,
                            }}
                          >
                            <SomiIcons.Flag size={12} />
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div key={activeTab}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}>
                        <MarkdownRenderer
                          content={
                            (activeTab === "quick"    ? getContent(currentPara, "v1") :
                             activeTab === "example"  ? getContent(currentPara, "v2") :
                                                        getContent(currentPara, "v3")
                            ).replace(/\bthe student\b/gi, studentName)
                             .replace(/\{name\}/gi, studentName)
                          }
                        />
                        {activeTab === "deepdive" && !hasDeepDive && (
                          <div style={{ fontSize: 12, color: "#A4B5C4", fontStyle: "italic" }}>
                            Master tab inkaa generate kaaledhu. Quick tab chuddu!
                          </div>
                        )}
                        {activeTab === "example" && !hasExample && (
                          <div style={{ fontSize: 12, color: "#A4B5C4", fontStyle: "italic" }}>
                            Revise tab inkaa ready kaaledhu.
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {/* Mama's Exam Tip — Master tab */}
                    {activeTab === "deepdive" && currentPara?.mamas_tip && (
                      <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(227,195,157,0.08)", borderRadius: 10, border: "1px solid rgba(227,195,157,0.15)" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#E3C39D", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><SomiIcons.Lightbulb size={14} />MAMA&apos;S EXAM TIP</div>
                        <div style={{ fontSize: 12, color: "#071739", lineHeight: 1.6 }}>{currentPara.mamas_tip}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── BLOCK 4: Student Action Buttons ── */}
                {!showMCQ && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={goNextPara}
                      style={{ flex: 1, padding: "11px 16px", borderRadius: 10, background: "transparent", color: "#071739", border: "1.5px solid rgba(7,23,57,0.12)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                      Got it, Next →
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => { setShowMCQ(true); haptic(); }}
                      style={{ flex: 1, padding: "11px 16px", borderRadius: 10, background: "#071739", color: "#E3C39D", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                      Test Me
                    </motion.button>
                  </div>
                )}

                {/* ── BLOCK 5: MCQ ── */}
                <AnimatePresence>
                  {showMCQ && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1px solid rgba(7,23,57,0.06)", boxShadow: "0 2px 8px rgba(7,23,57,0.04)" }}>

                      <div style={{ fontSize: 10, fontWeight: 700, color: "#185FA5", letterSpacing: "0.08em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                        <SomiIcons.Target size={14} color="#185FA5" />
                        QUICK CHECK — {studentName.toUpperCase()}!
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#071739", lineHeight: 1.6, marginBottom: 14 }}>
                        {currentPara?.check_question}
                      </div>

                      {currentPara?.check_options?.map((opt: string, idx: number) => {
                        const isAnswered   = selectedAnswer !== null;
                        const isThisRight  = idx === currentPara.check_answer;
                        const isSelected   = selectedAnswer === idx;
                        let bg = "#FAFAF8", border = "1px solid rgba(7,23,57,0.08)", color = "#071739";
                        if (isAnswered && isThisRight)              { bg = "#F0FDF4"; border = "1.5px solid #16a34a"; color = "#071739"; }
                        else if (isAnswered && isSelected && !isThisRight) { bg = "#FEF2F2"; border = "1.5px solid #ef4444"; color = "#991b1b"; }
                        return (
                          <motion.button key={idx}
                            whileTap={!isAnswered ? { scale: 0.98 } : {}}
                            onClick={() => handleAnswer(idx)}
                            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 14px", marginBottom: 8, borderRadius: 12, background: bg, border, color, cursor: isAnswered ? "default" : "pointer", textAlign: "left" }}>
                            <span style={{ fontWeight: 700, flexShrink: 0 }}>{String.fromCharCode(65 + idx)}.</span>
                            <span style={{ fontSize: 13, flex: 1 }}>{opt}</span>
                            {isAnswered && isThisRight  && <SomiIcons.Check size={12} color="#16a34a" />}
                            {isAnswered && isSelected && !isThisRight && <SomiIcons.X size={12} color="#ef4444" />}
                          </motion.button>
                        );
                      })}

                      {/* Give up */}
                      {selectedAnswer === null || (!isCorrect && !gaveUp && attempts >= 1) ? (
                        !gaveUp && attempts >= 1 && (
                          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            onClick={handleGiveUp}
                            style={{ width: "100%", marginTop: 4, padding: "10px", borderRadius: 12, background: "transparent", border: "1px solid #ef4444", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}><SomiIcons.Flag size={14} />Mama, chupinchu answer</span>
                          </motion.button>
                        )
                      ) : null}

                      {/* Result */}
                      <AnimatePresence>
                        {selectedAnswer !== null && (
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                            {/* Explanation */}
                            <div style={{ background: "rgba(7,23,57,0.04)", borderRadius: 10, padding: "10px 14px", marginTop: 8, marginBottom: 10 }}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: "#4B6382", letterSpacing: "0.06em", marginBottom: 4 }}>EXPLANATION</div>
                              <div style={{ fontSize: 12, color: "#071739", lineHeight: 1.6 }}>{currentPara?.check_explanation}</div>
                            </div>

                            {/* Mama response */}
                            <div style={{ background: isCorrect ? "#F0FDF4" : gaveUp ? "#FEF2F2" : "rgba(227,195,157,0.08)", borderRadius: 12, padding: "12px 14px", border: `1px solid ${isCorrect ? "#16a34a33" : gaveUp ? "#ef444433" : "#E3C39D33"}`, marginBottom: 10 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                <div style={{ width: 26, height: 26, borderRadius: 8, background: "#071739", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <span style={{ fontSize: 7, fontWeight: 800, color: "#E3C39D" }}>MAMA</span>
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: isCorrect ? "#071739" : "#A68868", display: "inline-flex", alignItems: "center", gap: 6 }}>
                                  {isCorrect ? (<><SomiIcons.Celebration size={16} />Correct {studentName}!</>) : gaveUp ? "Parledu! Next time pakka!" : `Try again ${studentName}!`}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, lineHeight: 1.6, color: "#071739" }}>
                                {isCorrect ? currentPara?.mama_response_correct : gaveUp ? (<><span>Parledu {studentName} — next time pakka chestav!</span> <SomiIcons.Strong size={16} /></>) : currentPara?.mama_response_wrong}
                              </div>
                            </div>

                            {/* ── FAILURE INTELLIGENCE ── */}
                            <AnimatePresence>
                              {showFailureReason && !isCorrect && (
                                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                  style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(7,23,57,0.08)", marginBottom: 10 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "#4B6382", marginBottom: 10 }}>
                                    {studentName}, enduku wrong ayyindi?
                                  </div>
                                  {([
                                    { id: "concept" as const, label: "Concept ne ardham kaaledu", Icon: SomiIcons.Brain },
                                    { id: "silly" as const,   label: "Silly mistake chesa",       Icon: SomiIcons.Facepalm },
                                    { id: "misread" as const, label: "Question misread chesanu",  Icon: SomiIcons.Eye },
                                  ] as const).map((r) => {
                                    const FailIcon = r.Icon;
                                    return (
                                    <button key={r.id}
                                      type="button"
                                      onClick={() => {
                                        setFailureReason(r.id as FailureReason);
                                        // Could save to DB here for analytics
                                      }}
                                      style={{
                                        display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px",
                                        marginBottom: 6, borderRadius: 10, textAlign: "left",
                                        background: failureReason === r.id ? "rgba(7,23,57,0.06)" : "#FAFAF8",
                                        border: failureReason === r.id ? "1.5px solid #071739" : "1.5px solid rgba(7,23,57,0.06)",
                                        cursor: "pointer", fontSize: 12, color: "#071739"
                                      }}>
                                      <FailIcon size={16} />{r.label}
                                    </button>
                                    );
                                  })}
                                  {failureReason && (
                                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                      onClick={goNextPara}
                                      style={{ width: "100%", marginTop: 6, padding: "10px", borderRadius: 10, background: "#E3C39D", color: "#071739", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, boxShadow: "0 0 12px rgba(227,195,157,0.2)" }}>
                                      Next Concept →
                                    </motion.button>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* ── CONFIDENCE RATING ── */}
                            <AnimatePresence>
                              {showConfidence && isCorrect && (
                                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                  style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(7,23,57,0.08)", marginBottom: 10 }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#071739", marginBottom: 10 }}>
                                    {studentName}, idi ela feel ayyindi?
                                  </div>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    {([
                                      { id: "low" as const,    label: "Not sure",    Icon: SomiIcons.Unsure },
                                      { id: "medium" as const, label: "Okay okay", Icon: SomiIcons.Okay },
                                      { id: "high" as const,   label: "Crystal!",   Icon: SomiIcons.Strong },
                                    ] as const).map((c) => {
                                      const ConfIcon = c.Icon;
                                      return (
                                      <button key={c.id} type="button"
                                        onClick={() => handleConfidence(c.id as ConfidenceLevel)}
                                        style={{ flex: 1, padding: "10px 6px", borderRadius: 10, background: confidence === c.id ? "rgba(7,23,57,0.06)" : "#FAFAF8", border: confidence === c.id ? "1.5px solid #071739" : "1.5px solid rgba(7,23,57,0.06)", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#071739", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                        <ConfIcon size={16} />{c.label}
                                      </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Next button (if no confidence shown yet) */}
                            {isCorrect && !showConfidence && (
                              <motion.button whileTap={{ scale: 0.97 }}
                                onClick={goNextPara}
                                style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#E3C39D", color: "#071739", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, boxShadow: "0 0 12px rgba(227,195,157,0.2)" }}>
                                Next Concept →
                              </motion.button>
                            )}

                            {gaveUp && !showFailureReason && (
                              <motion.button whileTap={{ scale: 0.97 }}
                                onClick={goNextPara}
                                style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#E3C39D", color: "#071739", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, boxShadow: "0 0 12px rgba(227,195,157,0.2)" }}>
                                Next Concept →
                              </motion.button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── BLOCK 7: Section complete + Test Yourself ── */}
                {((isLastPara && isLastPage && selectedAnswer !== null) || conceptDone) ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.08)", overflow: "hidden" }}>

                    {!showTestYourself && !testComplete && (
                      <>
                        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 4 }}><SomiIcons.Celebration size={20} /></div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: "#1C1C1E", marginBottom: 2 }}>
                            Section Complete, {studentName}!
                          </div>
                          <div style={{ fontSize: 12, color: "#8E8E93" }}>
                            Ready to test what you learned?
                          </div>
                        </div>
                        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                          <motion.button whileTap={{ scale: 0.97 }}
                            onClick={() => { setShowTestYourself(true); setTestIdx(0); }}
                            style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#071739", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}><SomiIcons.Pen size={14} color="#fff" />Test Yourself ({allQuestions.length} questions)</span>
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.97 }}
                            onClick={() => router.back()}
                            style={{ width: "100%", padding: "12px", borderRadius: 12, background: "rgba(7,23,57,0.04)", color: "#4B6382", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                            → Back to Chapters
                          </motion.button>
                        </div>
                      </>
                    )}

                    {showTestYourself && !testComplete && allQuestions[testIdx] && (
                      <div style={{ padding: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#A4B5C4", marginBottom: 4 }}>
                          Question {testIdx + 1} of {allQuestions.length}
                        </div>
                        <div style={{ height: 3, background: "rgba(7,23,57,0.08)", borderRadius: 2, marginBottom: 14 }}>
                          <div style={{ width: `${((testIdx + 1) / allQuestions.length) * 100}%`, height: "100%", background: "#071739", borderRadius: 2, transition: "width 0.3s" }} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#071739", lineHeight: 1.6, marginBottom: 14 }}>
                          {allQuestions[testIdx].check_question}
                        </div>
                        {allQuestions[testIdx].check_options?.map((opt: string, idx: number) => {
                          const answered = testAnswers[testIdx] !== undefined;
                          const isRight = idx === allQuestions[testIdx].check_answer;
                          const isSelected = testAnswers[testIdx] === idx;
                          let bg = "#FAFAF8", border = "1px solid rgba(7,23,57,0.08)", color = "#071739";
                          if (answered && isRight) { bg = "#F0FDF4"; border = "1.5px solid #16a34a"; color = "#071739"; }
                          else if (answered && isSelected && !isRight) { bg = "#FEF2F2"; border = "1.5px solid #ef4444"; color = "#991b1b"; }
                          return (
                            <motion.button key={idx}
                              whileTap={!answered ? { scale: 0.98 } : {}}
                              onClick={() => {
                                if (answered) return;
                                setTestAnswers(prev => ({ ...prev, [testIdx]: idx }));
                                haptic();
                              }}
                              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", marginBottom: 8, borderRadius: 12, background: bg, border, color, cursor: answered ? "default" : "pointer", textAlign: "left" }}>
                              <span style={{ fontWeight: 700, flexShrink: 0 }}>{String.fromCharCode(65 + idx)}.</span>
                              <span style={{ fontSize: 12, flex: 1 }}>{opt}</span>
                              {answered && isRight && <SomiIcons.Check size={12} color="#16a34a" />}
                              {answered && isSelected && !isRight && <SomiIcons.X size={12} color="#ef4444" />}
                            </motion.button>
                          );
                        })}
                        {testAnswers[testIdx] !== undefined && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ background: "rgba(7,23,57,0.04)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#071739", lineHeight: 1.6 }}>
                              {allQuestions[testIdx].check_explanation}
                            </div>
                            <motion.button whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                if (testIdx < allQuestions.length - 1) {
                                  setTestIdx(p => p + 1);
                                } else {
                                  setTestComplete(true);
                                }
                              }}
                              style={{ width: "100%", padding: "11px", borderRadius: 12, background: "#071739", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                              {testIdx < allQuestions.length - 1 ? "Next Question →" : (<span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>See Results <SomiIcons.Target size={14} color="#fff" /></span>)}
                            </motion.button>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {testComplete && (
                      <div style={{ padding: 20, textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                          {testCorrectTotal === allQuestions.length ? <SomiIcons.Trophy size={32} /> : <SomiIcons.Strong size={32} />}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#071739", marginBottom: 6 }}>
                          {testCorrectTotal} / {allQuestions.length} Correct!
                        </div>
                        <div style={{ fontSize: 12, color: "#8E8E93", marginBottom: 16 }}>
                          {testCorrectTotal === allQuestions.length
                            ? (<><span>Perfect score {studentName}! Section mastered!</span> <SomiIcons.Celebration size={16} /></>)
                            : `Good effort ${studentName}! Review the Master tab for weak concepts.`}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <motion.button whileTap={{ scale: 0.97 }}
                            onClick={() => { setTestIdx(0); setTestAnswers({}); setTestComplete(false); setShowTestYourself(true); }}
                            style={{ width: "100%", padding: "11px", borderRadius: 12, background: "rgba(7,23,57,0.05)", color: "#071739", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}><SomiIcons.Refresh size={14} />Retry Test</span>
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.97 }}
                            onClick={() => router.back()}
                            style={{ width: "100%", padding: "11px", borderRadius: 12, background: "rgba(7,23,57,0.04)", color: "#4B6382", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                            → Back to Chapters
                          </motion.button>
                        </div>
                      </div>
                    )}

                  </motion.div>
                ) : null}

              </motion.div>
            </AnimatePresence>
          ) : null}

        {/* ── MAMA AGENT (always accessible) ── */}
        <MamaAgent
          mode="concept"
          studentName={studentName}
          namespace={namespace}
          concept={concept}
          subject={subject}
          chapter={chapter}
          conceptId={currentPage?.id}
        />
        </div>
      )}

      {/* ── ICMAI / PDF ZONE ───────────────────────────────────────────── */}
      {activeZone === "icmai" && (
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
          onTouchStart={e => {
            setTouchStartX(e.touches[0].clientX);
            setTouchStartY(e.touches[0].clientY);
          }}
          onTouchEnd={e => {
            if (touchStartX === null || touchStartY === null) return;
            const dx = touchStartX - e.changedTouches[0].clientX;
            const dy = touchStartY - e.changedTouches[0].clientY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
              // dx < 0: swipe right → back to Mama
              if (dx < 0) setActiveZone("mama");
            }
            setTouchStartX(null);
            setTouchStartY(null);
          }}
        >
          <PDFViewer
            pageNumber={currentPage?.pdf_page || 11}
            onPrev={() => setCurrentPageIdx(Math.max(0, currentPageIdx - 1))}
            onNext={() => setCurrentPageIdx(Math.min(pages.length - 1, currentPageIdx + 1))}
            canGoPrev={currentPageIdx > 0}
            canGoNext={currentPageIdx < pages.length - 1}
            bookPage={currentPage?.book_page || 1}
            totalPages={pages.length}
          />
        </div>
      )}
    </div>
  );
}

// ─── PAGE EXPORT ──────────────────────────────────────────────────────────────
export default function LessonPage() {
  return (
    <Suspense fallback={
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#071739" }}>Loading lesson...</div>
      </div>
    }>
      <LessonContent />
    </Suspense>
  );
}