"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { SomiIcons } from "@/components/SomiIcons";

const API = process.env.NEXT_PUBLIC_API_URL || "https://studybuddy-production-7776.up.railway.app";

const C = {
  navy: "#071739",
  gold: "#E3C39D",
  steel: "#4B6382",
  silver: "#A4B5C4",
  bg: "#FAFAF8",
};

const sans = "'DM Sans', sans-serif";
const serif = "'DM Serif Display', serif";

const MODES = [
  {
    id:    "textbook",
    label: "Textbook Questions",
    color: "#071739",
    bg:    "rgba(7,23,57,0.05)",
    desc:  "From ICMAI Exercise sections",
  },
  {
    id:    "previous",
    label: "Previous Papers",
    color: "#E3C39D",
    bg:    "rgba(227,195,157,0.08)",
    desc:  "Past exam questions",
  },
  {
    id:    "tweaked",
    label: "Tweaked",
    color: "#071739",
    bg:    "rgba(227,195,157,0.12)",
    desc:  "Same concept, new scenarios",
  },
  {
    id:    "ai",
    label: "AI Generated",
    color: "#071739",
    bg:    "rgba(7,23,57,0.06)",
    desc:  "Fresh questions every time",
  },
];

// Local fallback questions for textbook mode
const textbookFallback = [
  {
    id:"tb1",
    question_text:"A contract is defined under which section of the Indian Contract Act 1872?",
    option_a:"Section 2(a)", option_b:"Section 2(e)",
    option_c:"Section 2(h)", option_d:"Section 2(i)",
    correct_option:"C",
    explanation:"Section 2(h) ICA 1872 defines contract as 'an agreement enforceable by law'.",
    icai_reference:"ICA 1872 · Section 2(h) · Page 8",
  },
  {
    id:"tb2",
    question_text:"Which of the following is an essential element of a valid contract?",
    option_a:"Written document", option_b:"Two witnesses",
    option_c:"Free consent of parties", option_d:"Registration",
    correct_option:"C",
    explanation:"Free consent is always essential. Other options are not always required.",
    icai_reference:"ICA 1872 · Chapter 1 · Page 12",
  },
  {
    id:"tb3",
    question_text:"An agreement enforceable by law is a:",
    option_a:"Promise", option_b:"Contract",
    option_c:"Offer",   option_d:"Proposal",
    correct_option:"B",
    explanation:"Contract = Agreement + Enforceability by law. Section 2(h) ICA 1872.",
    icai_reference:"ICA 1872 · Section 2(h)",
  },
];

function QuizContent() {
  const router    = useRouter();
  const params    = useSearchParams();
  const namespace = params.get("namespace") || "cma_f_law_ch1_s1";
  const concept   = params.get("concept")   || "Definition of Contract";
  const subject   = params.get("subject")   || "Business Laws";
  const chapter   = params.get("chapter")   || "";
  const course    = params.get("course")    || "cma";
  const paper     = params.get("paper")     || "1";
  const initMode  = params.get("mode")      || "";

  const isConceptCheck = initMode === "concept_check";

  const [mode,       setMode]       = useState(initMode || "textbook");
  const [subType,    setSubType]    = useState("all");
  const [started,    setStarted]    = useState(false);
  const [questions,  setQuestions]  = useState<any[]>([]);
  const [current,    setCurrent]    = useState(0);
  const [answers,    setAnswers]    = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [loading,    setLoading]    = useState(false);

  const longTabDisabled = mode === "textbook" || mode === "previous" || mode === "concept_check";

  // Auto-start for concept_check — skip mode selector
  useEffect(() => {
    if (isConceptCheck && !started) {
      setStarted(true);
      loadQuestions("concept_check", "all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startQuiz = () => {
    setStarted(true);
    loadQuestions(mode, subType);
  };

  // Reload when subType tab changes during active quiz
  useEffect(() => {
    if (started && !isConceptCheck) {
      setCurrent(0);
      setAnswers({});
      setShowResult(false);
      setFillInput("");
      setShortInput("");
      setLongInput("");
      loadQuestions(mode, subType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subType, mode]);

  const loadQuestions = async (selectedMode: string, selectedSubType: string) => {
    setQuestions([]);
    setCurrent(0);
    setAnswers({});
    setShowResult(false);
    setLoading(true);

    try {
      if (selectedMode === "concept_check") {
        const res  = await fetch(
          `${API}/lesson/check-questions?namespace=${encodeURIComponent(namespace)}&chapter=${chapter}&limit=10`
        );
        const data = await res.json();
        setQuestions(data.questions && data.questions.length > 0 ? data.questions : []);

      } else if (selectedMode === "previous") {
        const res  = await fetch(`${API}/questions/previous_paper/${namespace}`);
        const data = await res.json();
        setQuestions(data.has_questions ? data.questions : []);

      } else if (selectedMode === "textbook") {
        const typeParam = selectedSubType !== "all" ? `&q_type=${selectedSubType}` : "";
        const url = chapter
          ? `${API}/questions/textbook?course=${course}&chapter=${chapter}&limit=999${typeParam}`
          : `${API}/questions/textbook?course=${course}&limit=999${typeParam}`;
        const res  = await fetch(url);
        const data = await res.json();
        setQuestions(data.questions && data.questions.length > 0
          ? data.questions
          : textbookFallback
        );

      } else if (selectedMode === "tweaked") {
        const res  = await fetch(`${API}/questions/ai-generate`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            namespace, concept, seed: 1, mode: "tweaked",
            ...(selectedSubType !== "all" && { type: selectedSubType }),
          }),
        });
        const data = await res.json();
        setQuestions(data.questions && data.questions.length > 0
          ? data.questions
          : []
        );

      } else if (selectedMode === "ai") {
        const res  = await fetch(`${API}/questions/ai-generate`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            namespace, concept, seed: Date.now(), mode: "ai",
            type: selectedSubType === "all" ? "all" : selectedSubType,
          }),
        });
        const data = await res.json();
        setQuestions(data.questions && data.questions.length > 0
          ? data.questions
          : []
        );
      }
    } catch (e) {
      console.error("loadQuestions error:", e);
      setQuestions(selectedMode === "textbook" ? textbookFallback : []);
    } finally {
      setLoading(false);
    }
  };

  const [fillInput, setFillInput]       = useState("");
  const [shortInput, setShortInput]     = useState("");
  const [longInput, setLongInput]       = useState("");
  const [shortEval, setShortEval]       = useState<Record<string, any>>({});
  const [longEval, setLongEval]         = useState<Record<string, any>>({});
  const [evaluating, setEvaluating]     = useState(false);

  const handleAnswer = (opt: string) => {
    const q = questions[current];
    const key = q.id || String(current);
    if (answers[key]) return;
    setAnswers(prev => ({ ...prev, [key]: opt }));
  };

  const handleFillSubmit = () => {
    if (!fillInput.trim()) return;
    const q = questions[current];
    const key = q.id || String(current);
    if (answers[key]) return;
    setAnswers(prev => ({ ...prev, [key]: fillInput.trim() }));
  };

  const handleShortSubmit = async () => {
    if (!shortInput.trim() || evaluating) return;
    const q = questions[current];
    const key = q.id || String(current);
    if (answers[key]) return;
    setAnswers(prev => ({ ...prev, [key]: shortInput.trim() }));
    setEvaluating(true);
    try {
      const res = await fetch(`${API}/questions/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question_text,
          student_answer: shortInput.trim(),
          model_answer: q.model_answer || q.explanation || "",
          q_type: "short",
        }),
      });
      const data = await res.json();
      setShortEval(prev => ({ ...prev, [key]: data }));
    } catch {
      setShortEval(prev => ({ ...prev, [key]: { score: "?", percentage: 0, feedback: "Could not evaluate", grade: "Error" } }));
    } finally {
      setEvaluating(false);
    }
  };

  const handleLongSubmit = async () => {
    if (!longInput.trim() || evaluating) return;
    const q = questions[current];
    const key = q.id || String(current);
    if (answers[key]) return;
    setAnswers(prev => ({ ...prev, [key]: longInput.trim() }));
    setEvaluating(true);
    try {
      const res = await fetch(`${API}/questions/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question_text,
          student_answer: longInput.trim(),
          model_answer: q.model_answer || q.explanation || "",
          q_type: "long",
          marks: q.marks || 10,
        }),
      });
      const data = await res.json();
      setLongEval(prev => ({ ...prev, [key]: data }));
    } catch {
      setLongEval(prev => ({ ...prev, [key]: { score: "?", percentage: 0, feedback: "Could not evaluate", grade: "Error" } }));
    } finally {
      setEvaluating(false);
    }
  };

  const getQType = (q: any): string => {
    const qt = (q.q_type || "").toLowerCase();
    if (qt.includes("long")) return "long";
    if (qt.includes("true_false")) return "true_false";
    if (qt.includes("fill")) return "fill_blank";
    if (qt.includes("short")) return "short";
    return "mcq";
  };

  const handleNext = () => {
    setFillInput("");
    setShortInput("");
    setLongInput("");
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      setShowResult(true);
    }
  };

  const score    = questions.filter((q, i) => answers[q.id || i] === q.correct_option).length;
  const currentQ = questions[current];
  const answered = currentQ ? !!answers[currentQ.id || current] : false;
  const isLast   = current === questions.length - 1;
  const selectedMode = MODES.find(m => m.id === mode);

  const modeLabel: Record<string, string> = {
    concept_check: "Concept Check",
    textbook:      "Textbook Quiz",
    previous:      "Previous Papers",
    tweaked:       "Tweaked Quiz",
    ai:            "AI Quiz",
  };
  const modeTitle = modeLabel[mode] || selectedMode?.label || mode;

  const modeIcons: Record<string, React.ReactNode> = {
    concept_check: <SomiIcons.Check size={16} color={C.gold} />,
    textbook: <SomiIcons.BookOpen size={16} color={C.navy} />,
    previous: <SomiIcons.FileText size={16} color={C.navy} />,
    tweaked:  <SomiIcons.Refresh size={16} color={C.navy} />,
    ai:       <SomiIcons.Rocket size={16} color={C.navy} />,
  };

  // ── MODE SELECTION ── (skipped for concept_check)
  if (!started && !isConceptCheck) {
    return (
      <div className="app-shell" style={{ minHeight: "100vh", background: C.bg, fontFamily: sans }}>
        <div style={{ background: C.navy, padding: "18px 24px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <button type="button" onClick={() => router.back()}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", cursor: "pointer", fontFamily: sans }}>
              ← Back
            </button>
          </div>
          <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 2 }}>
            Practice — {concept}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{subject}</div>
        </div>
        <div style={{ flex: 1, padding: "16px 20px 40px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{
            background: "#fff", borderRadius: 16,
            border: "1px solid rgba(7,23,57,0.1)",
            overflow: "hidden", margin: "0 0 4px",
          }}>
            <div style={{ padding: "12px 16px 8px" }}>
              <div style={{ fontSize: 11, color: C.steel, fontWeight: 400 }}>
                Select question type
              </div>
            </div>
            {[
              { mode: "textbook", label: "Textbook Questions", sub: "From ICMAI Exercise sections", bg: "rgba(7,23,57,0.06)" },
              { mode: "previous", label: "Previous Papers", sub: "Past exam questions", bg: "rgba(227,195,157,0.14)" },
              { mode: "tweaked", label: "Tweaked", sub: "Same concept, new scenarios", bg: "rgba(7,23,57,0.05)" },
              { mode: "ai", label: "AI Generated", sub: "Fresh questions every time", bg: "rgba(227,195,157,0.1)" },
            ].map((item) => (
              <button type="button" key={item.mode}
                onClick={() => setMode(item.mode)}
                style={{
                  width: "100%", padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                  background: mode === item.mode ? "#fff" : "transparent",
                  border: "none",
                  borderTop: "1px solid rgba(7,23,57,0.06)",
                  boxShadow: mode === item.mode ? `inset 3px 0 0 0 ${C.gold}` : "none",
                  cursor: "pointer", textAlign: "left", fontFamily: sans,
                }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: item.bg,
                  display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                }}>
                  {modeIcons[item.mode]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: mode === item.mode ? 700 : 500,
                    color: mode === item.mode ? C.gold : C.navy,
                  }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 11, color: C.steel }}>{item.sub}</div>
                </div>
                {mode === item.mode && (
                  <SomiIcons.Check size={14} color={C.gold} />
                )}
              </button>
            ))}
          </div>

          <motion.button type="button" whileTap={{ scale: 0.97 }}
            onClick={startQuiz}
            style={{ width: "100%", padding: "16px", borderRadius: 16, background: C.navy, color: C.gold, fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", marginTop: 4, fontFamily: sans }}>
            Start Quiz →
          </motion.button>
        </div>
      </div>
    );
  }

  // ── LOADING ──
  if (loading) {
    return (
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: C.bg, fontFamily: sans }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            {mode === "concept_check" ? <SomiIcons.Check size={40} color={C.navy} /> : mode === "tweaked" ? <SomiIcons.Refresh size={40} /> : mode === "ai" ? <SomiIcons.Rocket size={40} /> : mode === "previous" ? <SomiIcons.FileText size={40} /> : <SomiIcons.BookOpen size={40} />}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 8, fontFamily: serif }}>
            {mode === "concept_check"
              ? "Loading Mama's quick check..."
              : mode === "tweaked"
              ? "Creating tweaked questions..."
              : mode === "ai"
              ? "Mama is reading ICAI content line by line..."
              : "Loading questions..."}
          </div>
          <div style={{ fontSize: 12, color: C.steel, lineHeight: 1.6, marginBottom: 16 }}>
            {mode === "concept_check"
              ? "Questions from Mama's lesson paragraphs."
              : mode === "tweaked"
              ? "Same concepts. Different scenarios. Tests real understanding."
              : mode === "ai"
              ? "One question per key point. Application over memory."
              : "Fetching from ICAI source..."}
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:6 }}>
            {[0,1,2].map(i => (
              <motion.div key={i}
                animate={{ y:[0,-6,0] }}
                transition={{ repeat:Infinity, duration:0.6, delay:i*0.15 }}
                style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── NO QUESTIONS ──
  if (!loading && questions.length === 0) {
    return (
      <div className="app-shell" style={{ minHeight: "100vh", background: C.bg, fontFamily: sans }}>
        <div style={{ background: C.navy, padding: "18px 24px 16px" }}>
          <button type="button" onClick={() => setStarted(false)}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", cursor: "pointer", fontFamily: sans }}>
            ← Back
          </button>
          <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: "#fff", marginTop: 10 }}>
            {modeTitle}
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><SomiIcons.StarOutline size={40} /></div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 8, fontFamily: serif }}>No questions yet</div>
            <div style={{ fontSize: 12, color: C.steel, lineHeight: 1.6, marginBottom: 20 }}>
              {longTabDisabled && subType === "long"
                ? "ICMAI textbook has no long questions — switch to AI Generated or Tweaked mode."
                : mode === "previous"
                ? "Previous paper questions for this concept have not been seeded yet."
                : "Could not load questions. Try again or choose another mode."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {longTabDisabled && subType === "long" ? (
                <motion.button type="button" whileTap={{ scale: 0.97 }}
                  onClick={() => { setMode("ai"); setSubType("long"); }}
                  style={{ padding: "12px 24px", borderRadius: 14, background: C.navy, color: C.gold, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: sans }}>
                  Generate AI Long Questions →
                </motion.button>
              ) : (
                <motion.button type="button" whileTap={{ scale: 0.97 }}
                  onClick={() => loadQuestions(mode, subType)}
                  style={{ padding: "12px 24px", borderRadius: 14, background: C.navy, color: C.gold, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: sans }}>
                  Try Again →
                </motion.button>
              )}
              <motion.button type="button" whileTap={{ scale: 0.97 }}
                onClick={() => setStarted(false)}
                style={{ padding: "12px 24px", borderRadius: 14, background: "#fff", color: C.navy, fontSize: 13, fontWeight: 600, border: `1.5px solid ${C.navy}`, cursor: "pointer", fontFamily: sans }}>
                Choose Another Mode
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS ──
  if (showResult) {
    const pct    = Math.round((score / questions.length) * 100);
    const passed = pct >= 60;
    return (
      <div className="app-shell" style={{ minHeight: "100vh", background: C.bg, fontFamily: sans }}>
        <div style={{ background: C.navy, padding: "18px 24px" }}>
          <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: "#fff" }}>Results</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
            {modeTitle} · {concept}
          </div>
        </div>
        <div style={{ flex: 1, padding: "20px 20px 40px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 24, textAlign: "center", border: `1px solid rgba(7,23,57,0.1)`, boxShadow: passed ? `inset 0 0 0 2px ${C.gold}` : undefined }}>
            <div style={{ fontFamily: serif, fontSize: 56, fontWeight: 600, color: C.navy, marginBottom: 4 }}>{pct}%</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{score} of {questions.length} correct</div>
          </div>
          <div style={{ background: C.navy, borderRadius: 16, padding: 14, borderLeft: `4px solid ${C.gold}` }}>
            <div style={{ fontSize: 10, color: C.gold, marginBottom: 6, fontWeight: 700, letterSpacing: "0.1em" }}>MAMA SAYS</div>
            <div style={{ fontSize: 12, color: "#fff", lineHeight: 1.6 }}>
              {pct >= 80
                ? '"Outstanding! You have mastered this concept!"'
                : pct >= 60
                ? '"Good work! Review the wrong answers once and try again."'
                : '"Don\'t worry — study the lesson once more. Mama is here!"'}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <motion.button type="button" whileTap={{ scale: 0.97 }}
              onClick={() => { setCurrent(0); setAnswers({}); setShowResult(false); }}
              style={{ flex: 1, padding: "14px", borderRadius: 16, background: C.navy, color: C.gold, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: sans }}>
              Try Again
            </motion.button>
            <motion.button type="button" whileTap={{ scale: 0.97 }}
              onClick={() => isConceptCheck ? router.back() : setStarted(false)}
              style={{ flex: 1, padding: "14px", borderRadius: 16, background: "#fff", color: C.navy, fontSize: 13, fontWeight: 700, border: `1.5px solid ${C.navy}`, cursor: "pointer", fontFamily: sans }}>
              {isConceptCheck ? "Back" : "Other Modes"}
            </motion.button>
          </div>
          <motion.button type="button" whileTap={{ scale: 0.97 }}
            onClick={() => router.back()}
            style={{ padding: "14px", borderRadius: 16, background: "#fff", color: C.navy, fontSize: 13, fontWeight: 600, border: `1.5px solid rgba(7,23,57,0.12)`, cursor: "pointer", fontFamily: sans }}>
            Back to Lesson
          </motion.button>
        </div>
      </div>
    );
  }

  // ── QUIZ ──
  const q = currentQ;
  return (
    <div className="app-shell" style={{ minHeight: "100vh", background: C.bg, fontFamily: sans }}>
      <div style={{ background: C.navy, padding: "14px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <button type="button" onClick={() => isConceptCheck ? router.back() : setStarted(false)}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", cursor: "pointer", fontFamily: sans }}>
            ← Exit
          </button>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
            {modeIcons[mode] ?? <SomiIcons.Check size={14} color="rgba(255,255,255,0.75)" />} {current+1} / {questions.length}
          </div>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${((current + 1) / questions.length) * 100}%`, height: "100%", background: C.gold, borderRadius: 2, transition: "width 0.3s" }} />
        </div>
        {isConceptCheck ? (
          <>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginTop:4 }}>Quick Check — {concept}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", marginTop:2 }}>10 questions from Mama&apos;s lesson</div>
          </>
        ) : (
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4 }}>
            {concept} · {modeTitle}
          </div>
        )}
      </div>

      {/* Sub-type filter tabs — hidden for concept_check (all MCQ) */}
      {!isConceptCheck && <div style={{ padding: "8px 16px 0", display: "flex", gap: 6, overflowX: "auto", background: "#fff", borderBottom: "1px solid rgba(7,23,57,0.08)" }}>
        {[
          { id:"all", label:"All" },
          { id:"mcq", label:"MCQ" },
          { id:"true_false", label:"T/F" },
          { id:"fill_blank", label:"Fill" },
          { id:"short", label:"Short" },
          { id:"long", label:"Long" },
        ].map(t => {
          const active = subType === t.id;
          const disabled = t.id === "long" && longTabDisabled;
          return (
            <button key={t.id}
              onClick={() => { if (!disabled) setSubType(t.id); }}
              style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: active ? 700 : 500,
                background: active ? C.navy : "transparent",
                color: disabled ? "rgba(7,23,57,0.35)" : active ? C.gold : C.steel,
                border: active ? "none" : `1px solid ${C.navy}`,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                whiteSpace: "nowrap", marginBottom: 8, fontFamily: sans }}>
              {disabled ? "Long (0)" : t.label}
            </button>
          );
        })}
      </div>}

      <div style={{ flex:1, padding:"14px 20px 120px", display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>

        {/* Question type badge + Question text */}
        {(() => {
          const qType = getQType(q);
          const badgeMap: Record<string, { bg: string; color: string; label: string }> = {
            mcq:        { bg: "rgba(7,23,57,0.08)", color: C.navy, label: "MCQ" },
            true_false: { bg: "rgba(227,195,157,0.15)", color: C.navy, label: "TRUE / FALSE" },
            fill_blank: { bg: "rgba(227,195,157,0.12)", color: C.navy, label: "FILL IN THE BLANK" },
            short:      { bg: "rgba(7,23,57,0.06)", color: C.navy, label: "SHORT ANSWER" },
            long:       { bg: C.navy, color: C.gold, label: "LONG ANSWER" },
          };
          const badge = badgeMap[qType] || badgeMap.mcq;
          return (
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, border: "1px solid rgba(7,23,57,0.1)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <span style={{ fontSize:9, fontWeight:700, color:badge.color, background:badge.bg, padding:"3px 8px", borderRadius:6, letterSpacing:"0.06em" }}>
                  {badge.label}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, lineHeight: 1.6 }}>
                {q.question_text}
              </div>
            </div>
          );
        })()}

        {/* MCQ Options */}
        {getQType(q) === "mcq" && ["A","B","C","D"].map(opt => {
          const optKey   = `option_${opt.toLowerCase()}` as keyof typeof q;
          const optText  = q[optKey] as string;
          if (!optText) return null;

          const qKey       = q.id || String(current);
          const isAnswered = !!answers[qKey];
          const isCorrect  = opt === q.correct_option;
          const isSelected = answers[qKey] === opt;

          let bg = "#fff", border = "1px solid rgba(7,23,57,0.1)", color = C.navy;
          let badgeBg = "rgba(7,23,57,0.08)", badgeColor = C.navy;

          if (isAnswered) {
            if (isCorrect)        { bg = "rgba(227,195,157,0.14)"; border = `1.5px solid ${C.gold}`; color = C.navy; badgeBg = C.navy; badgeColor = C.gold; }
            else if (isSelected)  { bg = "rgba(7,23,57,0.05)"; border = "1.5px solid rgba(7,23,57,0.25)"; color = C.navy; badgeBg = C.steel; badgeColor = "#fff"; }
          }

          return (
            <motion.button key={opt}
              whileTap={!isAnswered ? { scale:0.98 } : {}}
              onClick={() => handleAnswer(opt)}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 14px", borderRadius:14, background:bg, border, cursor: isAnswered ? "default" : "pointer", textAlign:"left", width:"100%" }}>
              <div style={{ width:28, height:28, borderRadius:8, background:badgeBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:badgeColor, flexShrink:0 }}>
                {opt}
              </div>
              <span style={{ fontSize:13, fontWeight:500, color, flex:1 }}>{optText}</span>
              {isAnswered && isCorrect  && <span style={{ fontSize: 9, color: C.navy, background: C.gold, padding: "2px 8px", borderRadius: 20, fontWeight: 700, display: "inline-flex", alignItems: "center" }}><SomiIcons.Check size={12} color={C.navy} /></span>}
              {isAnswered && isSelected && !isCorrect && <span style={{ fontSize: 9, color: "#fff", background: C.steel, padding: "2px 8px", borderRadius: 20, fontWeight: 700, display: "inline-flex", alignItems: "center" }}><SomiIcons.X size={12} color="#fff" /></span>}
            </motion.button>
          );
        })}

        {/* True/False Options */}
        {getQType(q) === "true_false" && (() => {
          const qKey = q.id || String(current);
          const isAnswered = !!answers[qKey];
          const correctOpt = q.correct_option;

          return (
            <div style={{ display:"flex", gap:12 }}>
              {([
                { opt: "A" as const, baseColor: C.navy, baseBg: "rgba(7,23,57,0.06)", content: (
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <SomiIcons.Check size={14} color={C.navy} /> True
                  </span>
                ) },
                { opt: "B" as const, baseColor: C.steel, baseBg: "rgba(7,23,57,0.04)", content: (
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <SomiIcons.X size={14} color="#ef4444" /> False
                  </span>
                ) },
              ]).map(({ opt, baseColor, baseBg, content }) => {
                const isCorrect = opt === correctOpt;
                const isSelected = answers[qKey] === opt;
                let bg = baseBg, border = `2px solid rgba(7,23,57,0.12)`, color = baseColor;
                if (isAnswered && isCorrect) { bg = "rgba(227,195,157,0.16)"; border = `2px solid ${C.gold}`; color = C.navy; }
                else if (isAnswered && isSelected && !isCorrect) { bg = "rgba(7,23,57,0.06)"; border = "2px solid rgba(7,23,57,0.28)"; color = C.navy; }
                return (
                  <motion.button key={opt} type="button"
                    whileTap={!isAnswered ? { scale:0.95 } : {}}
                    onClick={() => handleAnswer(opt)}
                    style={{ flex:1, padding:"20px 16px", borderRadius:16, background:bg, border, cursor:isAnswered?"default":"pointer", fontSize:16, fontWeight:700, color, textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    {content}
                  </motion.button>
                );
              })}
            </div>
          );
        })()}

        {/* Fill in the Blank */}
        {getQType(q) === "fill_blank" && (() => {
          const qKey = q.id || String(current);
          const isAnswered = !!answers[qKey];
          const correctAnswer = q.option_a || "See explanation";

          return (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {!isAnswered ? (
                <>
                  <input value={fillInput} onChange={e => setFillInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleFillSubmit()}
                    placeholder="Type your answer..."
                    style={{ padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(7,23,57,0.12)", background: "#fff", fontSize: 14, color: C.navy, outline: "none", fontFamily: sans }} />
                  <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={handleFillSubmit}
                    disabled={!fillInput.trim()}
                    style={{ padding: "14px", borderRadius: 14, background: fillInput.trim() ? C.navy : "rgba(7,23,57,0.08)", color: fillInput.trim() ? C.gold : C.steel, fontSize: 14, fontWeight: 700, border: "none", cursor: fillInput.trim() ? "pointer" : "default", fontFamily: sans }}>
                    Submit Answer
                  </motion.button>
                </>
              ) : (
                <>
                  <div style={{ background: "#fff", borderRadius: 14, padding: "12px 16px", border: "1px solid rgba(7,23,57,0.1)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.navy, marginBottom: 4 }}>YOUR ANSWER</div>
                    <div style={{ fontSize: 14, color: C.navy }}>{answers[qKey]}</div>
                  </div>
                  <div style={{ background: "rgba(227,195,157,0.12)", borderRadius: 14, padding: "12px 16px", border: `1px solid ${C.gold}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.navy, marginBottom: 4 }}>CORRECT ANSWER</div>
                    <div style={{ fontSize: 14, color: C.navy, fontWeight: 600 }}>{correctAnswer}</div>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* Short Answer */}
        {getQType(q) === "short" && (() => {
          const qKey = q.id || String(current);
          const isAnswered = !!answers[qKey];
          const evalResult = shortEval[qKey];

          return (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {!isAnswered ? (
                <>
                  <textarea value={shortInput} onChange={e => setShortInput(e.target.value)}
                    placeholder="Write your answer here..."
                    rows={5}
                    style={{ padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(7,23,57,0.12)", background: "#fff", fontSize: 14, color: C.navy, outline: "none", resize: "vertical", fontFamily: sans, lineHeight: 1.6 }} />
                  <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={handleShortSubmit}
                    disabled={!shortInput.trim() || evaluating}
                    style={{ padding: "14px", borderRadius: 14, background: shortInput.trim() && !evaluating ? C.navy : "rgba(7,23,57,0.08)", color: shortInput.trim() && !evaluating ? C.gold : C.steel, fontSize: 14, fontWeight: 700, border: "none", cursor: shortInput.trim() && !evaluating ? "pointer" : "default", fontFamily: sans }}>
                    {evaluating ? "Evaluating..." : "Submit Answer"}
                  </motion.button>
                </>
              ) : evalResult ? (
                <>
                  {/* Score badge */}
                  <div style={{ background: "#fff", borderRadius: 16, padding: 16, textAlign: "center", border: "1px solid rgba(7,23,57,0.1)", boxShadow: `inset 3px 0 0 0 ${C.gold}` }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: C.navy, marginBottom: 4 }}>{evalResult.score}</div>
                    <div style={{ fontSize: 12, color: C.steel }}>{evalResult.grade}</div>
                  </div>
                  {/* Good points */}
                  {evalResult.good_points && evalResult.good_points.length > 0 && (
                    <div style={{ background: "#fff", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(7,23,57,0.1)" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.navy, letterSpacing: "0.06em", marginBottom: 6 }}>GOOD POINTS</div>
                      {evalResult.good_points.map((p: string, i: number) => (
                        <div key={i} style={{ fontSize: 12, color: C.navy, lineHeight: 1.6, paddingLeft: 12, display: "flex", alignItems: "flex-start", gap: 6 }}><SomiIcons.Check size={14} color="#071739" /><span>{p}</span></div>
                      ))}
                    </div>
                  )}
                  {/* Missing points */}
                  {evalResult.missing_points && evalResult.missing_points.length > 0 && (
                    <div style={{ background:"rgba(227,195,157,0.08)", borderRadius:12, padding:"10px 14px" }}>
                      <div style={{ fontSize:9, fontWeight:700, color:"#E3C39D", letterSpacing:"0.06em", marginBottom:6 }}>MISSING POINTS</div>
                      {evalResult.missing_points.map((p: string, i: number) => (
                        <div key={i} style={{ fontSize: 12, color: C.steel, lineHeight: 1.6, paddingLeft: 12, display: "flex", alignItems: "flex-start", gap: 6 }}><SomiIcons.Warning size={14} /><span>{p}</span></div>
                      ))}
                    </div>
                  )}
                  {/* Feedback */}
                  {evalResult.feedback && (
                    <div style={{ background: "#fff", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(7,23,57,0.1)" }}>
                      <div style={{ fontSize: 12, color: C.navy, lineHeight: 1.6 }}>{evalResult.feedback}</div>
                    </div>
                  )}
                  {/* Model answer */}
                  {(q.model_answer || q.explanation) && (
                    <div style={{ background: "rgba(7,23,57,0.04)", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(7,23,57,0.1)" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.navy, letterSpacing: "0.06em", marginBottom: 6 }}>MODEL ANSWER</div>
                      <div style={{ fontSize: 12, color: C.navy, lineHeight: 1.6 }}>{q.model_answer || q.explanation}</div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: "center", padding: 20, color: C.silver }}>Evaluating your answer...</div>
              )}
            </div>
          );
        })()}

        {/* Long Answer */}
        {getQType(q) === "long" && (() => {
          const qKey = q.id || String(current);
          const isAnswered = !!answers[qKey];
          const evalResult = longEval[qKey];
          const wordCount = longInput.trim().split(/\s+/).filter(Boolean).length;

          return (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {!isAnswered ? (
                <>
                  <textarea value={longInput} onChange={e => setLongInput(e.target.value)}
                    placeholder="Write your detailed answer here (200-300 words)..."
                    rows={10}
                    style={{ padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(7,23,57,0.12)", background: "#fff", fontSize: 14, color: C.navy, outline: "none", resize: "vertical", fontFamily: sans, lineHeight: 1.7, minHeight: 200 }} />
                  <div style={{ fontSize: 11, color: wordCount >= 200 ? C.navy : wordCount >= 100 ? C.gold : C.silver, fontWeight: 600 }}>
                    Words: {wordCount} / 200 minimum
                  </div>
                  <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={handleLongSubmit}
                    disabled={wordCount < 20 || evaluating}
                    style={{ padding: "14px", borderRadius: 14, background: wordCount >= 20 && !evaluating ? C.navy : "rgba(7,23,57,0.08)", color: wordCount >= 20 && !evaluating ? C.gold : C.steel, fontSize: 14, fontWeight: 700, border: "none", cursor: wordCount >= 20 && !evaluating ? "pointer" : "default", fontFamily: sans }}>
                    {evaluating ? "Evaluating with Sonnet..." : "Submit Answer"}
                  </motion.button>
                </>
              ) : evalResult ? (
                <>
                  <div style={{ background: "#fff", borderRadius: 16, padding: 16, textAlign: "center", border: "1px solid rgba(7,23,57,0.1)", boxShadow: `inset 3px 0 0 0 ${C.gold}` }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: C.navy, marginBottom: 4 }}>{evalResult.score}</div>
                    <div style={{ fontSize: 12, color: C.steel }}>{evalResult.grade}</div>
                    {evalResult.word_count_feedback && (
                      <div style={{ fontSize: 10, color: C.silver, marginTop: 4 }}>{evalResult.word_count_feedback}</div>
                    )}
                  </div>
                  {evalResult.good_points?.length > 0 && (
                    <div style={{ background: "#fff", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(7,23,57,0.1)" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.navy, letterSpacing: "0.06em", marginBottom: 6 }}>GOOD POINTS</div>
                      {evalResult.good_points.map((p: string, i: number) => (
                        <div key={i} style={{ fontSize: 12, color: C.navy, lineHeight: 1.6, paddingLeft: 12, display: "flex", alignItems: "flex-start", gap: 6 }}><SomiIcons.Check size={14} color="#071739" /><span>{p}</span></div>
                      ))}
                    </div>
                  )}
                  {evalResult.missing_points?.length > 0 && (
                    <div style={{ background: "rgba(227,195,157,0.08)", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(7,23,57,0.08)" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.navy, letterSpacing: "0.06em", marginBottom: 6 }}>MISSING POINTS</div>
                      {evalResult.missing_points.map((p: string, i: number) => (
                        <div key={i} style={{ fontSize: 12, color: C.steel, lineHeight: 1.6, paddingLeft: 12, display: "flex", alignItems: "flex-start", gap: 6 }}><SomiIcons.Warning size={14} /><span>{p}</span></div>
                      ))}
                    </div>
                  )}
                  {evalResult.icmai_terms_used?.length > 0 && (
                    <div style={{ background: "rgba(227,195,157,0.1)", borderRadius: 12, padding: "10px 14px", border: `1px solid ${C.gold}` }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.navy, letterSpacing: "0.06em", marginBottom: 6 }}>ICMAI TERMS USED</div>
                      <div style={{ fontSize: 12, color: C.navy, lineHeight: 1.6 }}>{evalResult.icmai_terms_used.join(", ")}</div>
                    </div>
                  )}
                  {evalResult.structure_feedback && (
                    <div style={{ background: "#fff", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(7,23,57,0.1)" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.steel, letterSpacing: "0.06em", marginBottom: 4 }}>STRUCTURE</div>
                      <div style={{ fontSize: 12, color: C.navy, lineHeight: 1.6 }}>{evalResult.structure_feedback}</div>
                    </div>
                  )}
                  {evalResult.feedback && (
                    <div style={{ background: "#fff", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(7,23,57,0.1)" }}>
                      <div style={{ fontSize: 12, color: C.navy, lineHeight: 1.6 }}>{evalResult.feedback}</div>
                    </div>
                  )}
                  {(q.model_answer || q.explanation) && (
                    <div style={{ background: "rgba(7,23,57,0.04)", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(7,23,57,0.1)" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.navy, letterSpacing: "0.06em", marginBottom: 6 }}>MODEL ANSWER</div>
                      <div style={{ fontSize: 12, color: C.navy, lineHeight: 1.6 }}>{q.model_answer || q.explanation}</div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: "center", padding: 20, color: C.silver }}>Evaluating your answer with Claude Sonnet...</div>
              )}
            </div>
          );
        })()}

        {/* Explanation */}
        {answered && getQType(q) !== "short" && getQType(q) !== "long" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: "#fff", borderRadius: 16, padding: 14, border: "1px solid rgba(7,23,57,0.1)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.silver, letterSpacing: "0.06em", marginBottom: 6 }}>EXPLANATION</div>
            <div style={{ fontSize: 12, color: C.navy, lineHeight: 1.6 }}>{q.explanation}</div>
            {q.icai_reference && (
              <div style={{ fontSize: 10, color: C.steel, marginTop: 8, fontStyle: "italic", display: "flex", alignItems: "center", gap: 6 }}>
                <SomiIcons.BookOpen size={14} color={C.steel} />
                Source: {q.icai_reference}
              </div>
            )}
          </motion.div>
        )}

      </div>

      {/* Bottom */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid rgba(7,23,57,0.1)", padding: "12px 20px 24px", zIndex: 99, fontFamily: sans }}>
        {answered ? (
          <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={handleNext}
            style={{ width: "100%", padding: "14px", borderRadius: 16, background: C.navy, color: C.gold, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>
            {isLast ? "See Results →" : "Next Question →"}
          </motion.button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={handleNext}
              style={{ flex: 1, padding: "14px", borderRadius: 16, background: "#fff", color: C.navy, fontSize: 13, fontWeight: 600, border: `1.5px solid ${C.navy}`, cursor: "pointer" }}>
              Skip →
            </motion.button>
            <div style={{ flex: 2, padding: "14px", borderRadius: 16, background: "rgba(7,23,57,0.06)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(7,23,57,0.08)" }}>
              <span style={{ fontSize: 12, color: C.silver }}>Tap an option to answer</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: sans }}>
        <div style={{ color: C.navy }}>Loading quiz...</div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}