"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { BookOpen, FileText, Shuffle, Sparkle } from "@phosphor-icons/react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://studybuddy-production-7776.up.railway.app";

const MODES = [
  {
    id:    "textbook",
    icon:  "📚",
    label: "Textbook Questions",
    color: "#0E6655",
    bg:    "#E1F5EE",
    desc:  "From ICMAI Exercise sections",
  },
  {
    id:    "previous",
    icon:  "📄",
    label: "Previous Papers",
    color: "#E67E22",
    bg:    "#FFF7ED",
    desc:  "Past exam questions",
  },
  {
    id:    "tweaked",
    icon:  "🔄",
    label: "Tweaked",
    color: "#185FA5",
    bg:    "#DBEAFE",
    desc:  "Same concept, new scenarios",
  },
  {
    id:    "ai",
    icon:  "🤖",
    label: "AI Generated",
    color: "#6B6560",
    bg:    "#F5F0E8",
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

  const [mode,       setMode]       = useState(initMode || "textbook");
  const [subType,    setSubType]    = useState("all");
  const [started,    setStarted]    = useState(false);
  const [questions,  setQuestions]  = useState<any[]>([]);
  const [current,    setCurrent]    = useState(0);
  const [answers,    setAnswers]    = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [loading,    setLoading]    = useState(false);

  const longTabDisabled = mode === "textbook" || mode === "previous";

  const startQuiz = () => {
    setStarted(true);
    loadQuestions(mode, subType);
  };

  // Reload when subType tab changes during active quiz
  useEffect(() => {
    if (started) {
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
      if (selectedMode === "previous") {
        const res  = await fetch(`${API}/questions/previous_paper/${namespace}`);
        const data = await res.json();
        setQuestions(data.has_questions ? data.questions : []);

      } else if (selectedMode === "textbook") {
        const typeParam = selectedSubType !== "all" ? `&q_type=${selectedSubType}` : "";
        const url = chapter
          ? `${API}/questions/textbook?course=${course}&paper=${paper}&chapter=${chapter}${typeParam}`
          : `${API}/questions/textbook?course=${course}&paper=${paper}${typeParam}`;
        const res  = await fetch(url);
        const data = await res.json();
        setQuestions(data.has_questions && data.questions.length > 0
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

  const modeIcons: Record<string, JSX.Element> = {
    textbook: <BookOpen size={16} weight="duotone" color="#0E6655" />,
    previous: <FileText size={16} weight="duotone" color="#E67E22" />,
    tweaked:  <Shuffle   size={16} weight="duotone" color="#185FA5" />,
    ai:       <Sparkle   size={16} weight="duotone" color="#7C3AED" />,
  };

  // ── MODE SELECTION ──
  if (!started) {
    return (
      <div className="app-shell">
        <div style={{ background:"linear-gradient(135deg, #0A2E28 0%, #0A4A3C 100%)", padding:"18px 24px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <button onClick={() => router.back()}
              style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
              ← Back
            </button>
          </div>
          <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#fff", marginBottom:2 }}>
            Practice — {concept}
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>{subject}</div>
        </div>
        <div style={{ flex:1, padding:"16px 20px 40px", display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{
            background:"#fff", borderRadius:16,
            border:"0.5px solid rgba(0,0,0,0.08)",
            overflow:"hidden", margin:"0 0 4px",
          }}>
            <div style={{ padding:"12px 16px 8px" }}>
              <div style={{ fontSize:11, color:"#A89880", fontWeight:400 }}>
                Select question type
              </div>
            </div>
            {[
              { mode:"textbook", label:"Textbook Questions", sub:"From ICMAI Exercise sections", bg:"#E1F5EE", color:"#0E6655" },
              { mode:"previous", label:"Previous Papers",    sub:"Past exam questions",           bg:"#FFF7ED", color:"#E67E22" },
              { mode:"tweaked",  label:"Tweaked",            sub:"Same concept, new scenarios",   bg:"#DBEAFE", color:"#185FA5" },
              { mode:"ai",       label:"AI Generated",       sub:"Fresh questions every time",    bg:"#F5F3FF", color:"#7C3AED" },
            ].map((item) => (
              <button key={item.mode}
                onClick={() => setMode(item.mode)}
                style={{
                  width:"100%", padding:"12px 16px",
                  display:"flex", alignItems:"center", gap:12,
                  background: mode === item.mode ? item.bg : "transparent",
                  border:"none",
                  borderTop:"0.5px solid rgba(0,0,0,0.06)",
                  cursor:"pointer", textAlign:"left",
                }}>
                <div style={{
                  width:32, height:32, borderRadius:8,
                  background: item.bg,
                  display:"flex", alignItems:"center",
                  justifyContent:"center", flexShrink:0,
                }}>
                  {modeIcons[item.mode]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{
                    fontSize:13,
                    fontWeight: mode === item.mode ? 600 : 500,
                    color: mode === item.mode ? item.color : "#1A1208",
                  }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize:11, color:"#A89880" }}>{item.sub}</div>
                </div>
                {mode === item.mode && (
                  <span style={{ color: item.color, fontSize:14 }}>✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Start button */}
          <motion.button whileTap={{ scale:0.97 }}
            onClick={startQuiz}
            style={{ width:"100%", padding:"16px", borderRadius:16, background:"#0A2E28", color:"#fff", fontSize:15, fontWeight:700, border:"none", cursor:"pointer", marginTop:4 }}>
            Start Quiz →
          </motion.button>
        </div>
      </div>
    );
  }

  // ── LOADING ──
  if (loading) {
    return (
      <div className="app-shell" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", padding:24 }}>
          <div style={{ fontSize:40, marginBottom:16 }}>
            {mode === "tweaked" ? "🔄" : mode === "ai" ? "🤖" : mode === "previous" ? "📄" : "📖"}
          </div>
          <div style={{ fontSize:15, fontWeight:700, color:"#0A2E28", marginBottom:8 }}>
            {mode === "tweaked"
              ? "Creating tweaked questions..."
              : mode === "ai"
              ? "Mama is reading ICAI content line by line..."
              : "Loading questions..."}
          </div>
          <div style={{ fontSize:12, color:"#A89880", lineHeight:1.6, marginBottom:16 }}>
            {mode === "tweaked"
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
                style={{ width:8, height:8, borderRadius:"50%", background:"#0A2E28" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── NO QUESTIONS ──
  if (!loading && questions.length === 0) {
    return (
      <div className="app-shell">
        <div style={{ background:"linear-gradient(135deg, #0A2E28 0%, #0A4A3C 100%)", padding:"18px 24px 16px" }}>
          <button onClick={() => setStarted(false)}
            style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
            ← Back
          </button>
          <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#fff", marginTop:10 }}>
            {selectedMode?.label}
          </div>
        </div>
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:16 }}>📭</div>
            <div style={{ fontSize:15, fontWeight:700, color:"#1A1208", marginBottom:8 }}>No questions yet</div>
            <div style={{ fontSize:12, color:"#6B6560", lineHeight:1.6, marginBottom:20 }}>
              {longTabDisabled && subType === "long"
                ? "ICMAI textbook has no long questions — switch to AI Generated or Tweaked mode."
                : mode === "previous"
                ? "Previous paper questions for this concept have not been seeded yet."
                : "Could not load questions. Try again or choose another mode."}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {longTabDisabled && subType === "long" ? (
                <motion.button whileTap={{ scale:0.97 }}
                  onClick={() => { setMode("ai"); setSubType("long"); }}
                  style={{ padding:"12px 24px", borderRadius:14, background:"#0A2E28", color:"#fff", fontSize:13, fontWeight:600, border:"none", cursor:"pointer" }}>
                  Generate AI Long Questions →
                </motion.button>
              ) : (
                <motion.button whileTap={{ scale:0.97 }}
                  onClick={() => loadQuestions(mode, subType)}
                  style={{ padding:"12px 24px", borderRadius:14, background:"#0A2E28", color:"#fff", fontSize:13, fontWeight:600, border:"none", cursor:"pointer" }}>
                  Try Again →
                </motion.button>
              )}
              <motion.button whileTap={{ scale:0.97 }}
                onClick={() => setStarted(false)}
                style={{ padding:"12px 24px", borderRadius:14, background:"#F5F0E8", color:"#1A1208", fontSize:13, fontWeight:600, border:"none", cursor:"pointer" }}>
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
      <div className="app-shell">
        <div style={{ background:"linear-gradient(135deg, #0A2E28 0%, #0A4A3C 100%)", padding:"18px 24px" }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#fff" }}>Results</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:2 }}>
            {selectedMode?.label} · {concept}
          </div>
        </div>
        <div style={{ flex:1, padding:"20px 20px 40px", display:"flex", flexDirection:"column", gap:14, overflowY:"auto" }}>
          <div style={{ background: passed ? "linear-gradient(135deg,#F0FDF4,#DCFCE7)" : "linear-gradient(135deg,#FEF9C3,#FFEDD5)", borderRadius:20, padding:24, textAlign:"center" }}>
            <div style={{ fontFamily:"Georgia,serif", fontSize:56, fontWeight:700, color: passed ? "#16a34a" : "#E67E22", marginBottom:4 }}>{pct}%</div>
            <div style={{ fontSize:14, fontWeight:600, color:"#1A1208" }}>{score} of {questions.length} correct</div>
          </div>
          <div style={{ background:"linear-gradient(135deg,#0A2E28,#0A4A3C)", borderRadius:16, padding:14 }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginBottom:4 }}>MAMA SAYS</div>
            <div style={{ fontSize:12, color:"#fff", lineHeight:1.6 }}>
              {pct >= 80
                ? '"Outstanding! You have mastered this concept! 🎉"'
                : pct >= 60
                ? '"Good work! Review the wrong answers once and try again."'
                : '"Don\'t worry — study the lesson once more. Mama is here!"'}
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => { setCurrent(0); setAnswers({}); setShowResult(false); }}
              style={{ flex:1, padding:"14px", borderRadius:16, background:"#0A2E28", color:"#fff", fontSize:13, fontWeight:700, border:"none", cursor:"pointer" }}>
              Try Again
            </motion.button>
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => setStarted(false)}
              style={{ flex:1, padding:"14px", borderRadius:16, background:"#F5F0E8", color:"#1A1208", fontSize:13, fontWeight:700, border:"none", cursor:"pointer" }}>
              Other Modes
            </motion.button>
          </div>
          <motion.button whileTap={{ scale:0.97 }}
            onClick={() => router.back()}
            style={{ padding:"14px", borderRadius:16, background:"#fff", color:"#0A2E28", fontSize:13, fontWeight:600, border:"1.5px solid rgba(10,46,40,0.15)", cursor:"pointer" }}>
            Back to Lesson
          </motion.button>
        </div>
      </div>
    );
  }

  // ── QUIZ ──
  const q = currentQ;
  return (
    <div className="app-shell">
      <div style={{ background:"linear-gradient(135deg, #0A2E28 0%, #0A4A3C 100%)", padding:"14px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <button onClick={() => setStarted(false)}
            style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
            ← Exit
          </button>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", fontWeight:600 }}>
            {selectedMode?.icon} {current+1} / {questions.length}
          </div>
        </div>
        <div style={{ height:3, background:"rgba(255,255,255,0.15)", borderRadius:2, overflow:"hidden" }}>
          <div style={{ width:`${((current+1)/questions.length)*100}%`, height:"100%", background:"#E67E22", borderRadius:2, transition:"width 0.3s" }} />
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4 }}>
          {concept} · {selectedMode?.label}
        </div>
      </div>

      {/* Sub-type filter tabs */}
      <div style={{ padding:"8px 16px 0", display:"flex", gap:6, overflowX:"auto", background:"#fff", borderBottom:"0.5px solid rgba(0,0,0,0.06)" }}>
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
              style={{ padding:"6px 12px", borderRadius:20, fontSize:11, fontWeight:active?700:500,
                background: active ? "#0E6655" : "transparent",
                color: disabled ? "#C5B9A8" : active ? "#fff" : "#6B6560",
                border: active ? "none" : "1px solid #E5E0D8",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                whiteSpace:"nowrap", marginBottom:8 }}>
              {disabled ? "Long (0)" : t.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex:1, padding:"14px 20px 120px", display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>

        {/* Question type badge + Question text */}
        {(() => {
          const qType = getQType(q);
          const badgeMap: Record<string, { bg: string; color: string; label: string }> = {
            mcq:        { bg: "#DBEAFE", color: "#185FA5", label: "MCQ" },
            true_false: { bg: "#FFF7ED", color: "#E67E22", label: "TRUE / FALSE" },
            fill_blank: { bg: "#EDE9FE", color: "#7C3AED", label: "FILL IN THE BLANK" },
            short:      { bg: "#FEF2F2", color: "#DC2626", label: "SHORT ANSWER" },
            long:       { bg: "#450a0a", color: "#fff",    label: "LONG ANSWER" },
          };
          const badge = badgeMap[qType] || badgeMap.mcq;
          return (
            <div style={{ background:"#fff", borderRadius:16, padding:16, border:"0.5px solid rgba(0,0,0,0.06)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <span style={{ fontSize:9, fontWeight:700, color:badge.color, background:badge.bg, padding:"3px 8px", borderRadius:6, letterSpacing:"0.06em" }}>
                  {badge.label}
                </span>
              </div>
              <div style={{ fontSize:14, fontWeight:600, color:"#1A1208", lineHeight:1.6 }}>
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

          let bg = "#fff", border = "0.5px solid rgba(0,0,0,0.06)", color = "#1A1208";
          let badgeBg = "#E6F1FB", badgeColor = "#185FA5";

          if (isAnswered) {
            if (isCorrect)        { bg="#f0fdf4"; border="1.5px solid #16a34a"; color="#14532d"; badgeBg="#16a34a"; badgeColor="#fff"; }
            else if (isSelected)  { bg="#fef2f2"; border="1.5px solid #ef4444"; color="#991b1b"; badgeBg="#ef4444"; badgeColor="#fff"; }
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
              {isAnswered && isCorrect  && <span style={{ fontSize:9, color:"#16a34a", background:"#dcfce7", padding:"2px 8px", borderRadius:20, fontWeight:700 }}>✓</span>}
              {isAnswered && isSelected && !isCorrect && <span style={{ fontSize:9, color:"#dc2626", background:"#fee2e2", padding:"2px 8px", borderRadius:20, fontWeight:700 }}>✗</span>}
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
              {[{opt:"A", label:"✅ True", baseColor:"#0E6655", baseBg:"#E1F5EE"}, {opt:"B", label:"❌ False", baseColor:"#DC2626", baseBg:"#FEF2F2"}].map(({ opt, label, baseColor, baseBg }) => {
                const isCorrect = opt === correctOpt;
                const isSelected = answers[qKey] === opt;
                let bg = baseBg, border = `2px solid ${baseColor}33`, color = baseColor;
                if (isAnswered && isCorrect) { bg="#f0fdf4"; border="2px solid #16a34a"; color="#14532d"; }
                else if (isAnswered && isSelected && !isCorrect) { bg="#fef2f2"; border="2px solid #ef4444"; color="#991b1b"; }
                return (
                  <motion.button key={opt}
                    whileTap={!isAnswered ? { scale:0.95 } : {}}
                    onClick={() => handleAnswer(opt)}
                    style={{ flex:1, padding:"20px 16px", borderRadius:16, background:bg, border, cursor:isAnswered?"default":"pointer", fontSize:16, fontWeight:700, color, textAlign:"center" }}>
                    {label}
                    {isAnswered && isCorrect && <span style={{ marginLeft:8, fontSize:12 }}>✓</span>}
                    {isAnswered && isSelected && !isCorrect && <span style={{ marginLeft:8, fontSize:12 }}>✗</span>}
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
                    style={{ padding:"14px 16px", borderRadius:14, border:"2px solid #7C3AED33", background:"#FAFAF8", fontSize:14, color:"#1A1208", outline:"none" }} />
                  <motion.button whileTap={{ scale:0.97 }} onClick={handleFillSubmit}
                    disabled={!fillInput.trim()}
                    style={{ padding:"14px", borderRadius:14, background:fillInput.trim()?"#7C3AED":"#E5E0D8", color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor:fillInput.trim()?"pointer":"default" }}>
                    Submit Answer
                  </motion.button>
                </>
              ) : (
                <>
                  <div style={{ background:"#EDE9FE", borderRadius:14, padding:"12px 16px", border:"1.5px solid #7C3AED33" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#7C3AED", marginBottom:4 }}>YOUR ANSWER</div>
                    <div style={{ fontSize:14, color:"#1A1208" }}>{answers[qKey]}</div>
                  </div>
                  <div style={{ background:"#F0FDF4", borderRadius:14, padding:"12px 16px", border:"1.5px solid #16a34a33" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#16a34a", marginBottom:4 }}>CORRECT ANSWER</div>
                    <div style={{ fontSize:14, color:"#14532d", fontWeight:600 }}>{correctAnswer}</div>
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
                    style={{ padding:"14px 16px", borderRadius:14, border:"2px solid #DC262633", background:"#FAFAF8", fontSize:14, color:"#1A1208", outline:"none", resize:"vertical", fontFamily:"inherit", lineHeight:1.6 }} />
                  <motion.button whileTap={{ scale:0.97 }} onClick={handleShortSubmit}
                    disabled={!shortInput.trim() || evaluating}
                    style={{ padding:"14px", borderRadius:14, background:shortInput.trim() && !evaluating?"#DC2626":"#E5E0D8", color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor:shortInput.trim() && !evaluating?"pointer":"default" }}>
                    {evaluating ? "Evaluating..." : "Submit Answer"}
                  </motion.button>
                </>
              ) : evalResult ? (
                <>
                  {/* Score badge */}
                  <div style={{ background:"linear-gradient(135deg,#F0FDF4,#DCFCE7)", borderRadius:16, padding:16, textAlign:"center", border:"1.5px solid rgba(14,102,85,0.2)" }}>
                    <div style={{ fontSize:32, fontWeight:700, color:"#0E6655", marginBottom:4 }}>{evalResult.score}</div>
                    <div style={{ fontSize:12, color:"#6B9B8A" }}>{evalResult.grade}</div>
                  </div>
                  {/* Good points */}
                  {evalResult.good_points && evalResult.good_points.length > 0 && (
                    <div style={{ background:"#F0FDF4", borderRadius:12, padding:"10px 14px" }}>
                      <div style={{ fontSize:9, fontWeight:700, color:"#16a34a", letterSpacing:"0.06em", marginBottom:6 }}>GOOD POINTS</div>
                      {evalResult.good_points.map((p: string, i: number) => (
                        <div key={i} style={{ fontSize:12, color:"#14532d", lineHeight:1.6, paddingLeft:12 }}>✅ {p}</div>
                      ))}
                    </div>
                  )}
                  {/* Missing points */}
                  {evalResult.missing_points && evalResult.missing_points.length > 0 && (
                    <div style={{ background:"#FFF7ED", borderRadius:12, padding:"10px 14px" }}>
                      <div style={{ fontSize:9, fontWeight:700, color:"#E67E22", letterSpacing:"0.06em", marginBottom:6 }}>MISSING POINTS</div>
                      {evalResult.missing_points.map((p: string, i: number) => (
                        <div key={i} style={{ fontSize:12, color:"#9a3412", lineHeight:1.6, paddingLeft:12 }}>⚠️ {p}</div>
                      ))}
                    </div>
                  )}
                  {/* Feedback */}
                  {evalResult.feedback && (
                    <div style={{ background:"#fff", borderRadius:12, padding:"10px 14px", border:"0.5px solid rgba(0,0,0,0.06)" }}>
                      <div style={{ fontSize:12, color:"#1A1208", lineHeight:1.6 }}>{evalResult.feedback}</div>
                    </div>
                  )}
                  {/* Model answer */}
                  {(q.model_answer || q.explanation) && (
                    <div style={{ background:"#E1F5EE", borderRadius:12, padding:"10px 14px", border:"1px solid rgba(14,102,85,0.12)" }}>
                      <div style={{ fontSize:9, fontWeight:700, color:"#0E6655", letterSpacing:"0.06em", marginBottom:6 }}>MODEL ANSWER</div>
                      <div style={{ fontSize:12, color:"#085041", lineHeight:1.6 }}>{q.model_answer || q.explanation}</div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign:"center", padding:20, color:"#A89880" }}>Evaluating your answer...</div>
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
                    style={{ padding:"14px 16px", borderRadius:14, border:"2px solid #450a0a33", background:"#FAFAF8", fontSize:14, color:"#1A1208", outline:"none", resize:"vertical", fontFamily:"inherit", lineHeight:1.7, minHeight:200 }} />
                  <div style={{ fontSize:11, color: wordCount >= 200 ? "#0E6655" : wordCount >= 100 ? "#E67E22" : "#A89880", fontWeight:600 }}>
                    Words: {wordCount} / 200 minimum
                  </div>
                  <motion.button whileTap={{ scale:0.97 }} onClick={handleLongSubmit}
                    disabled={wordCount < 20 || evaluating}
                    style={{ padding:"14px", borderRadius:14, background: wordCount >= 20 && !evaluating ? "#450a0a" : "#E5E0D8", color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor: wordCount >= 20 && !evaluating ? "pointer" : "default" }}>
                    {evaluating ? "Evaluating with Sonnet..." : "Submit Answer"}
                  </motion.button>
                </>
              ) : evalResult ? (
                <>
                  <div style={{ background:"linear-gradient(135deg,#F0FDF4,#DCFCE7)", borderRadius:16, padding:16, textAlign:"center", border:"1.5px solid rgba(14,102,85,0.2)" }}>
                    <div style={{ fontSize:32, fontWeight:700, color:"#0E6655", marginBottom:4 }}>{evalResult.score}</div>
                    <div style={{ fontSize:12, color:"#6B9B8A" }}>{evalResult.grade}</div>
                    {evalResult.word_count_feedback && (
                      <div style={{ fontSize:10, color:"#A89880", marginTop:4 }}>{evalResult.word_count_feedback}</div>
                    )}
                  </div>
                  {evalResult.good_points?.length > 0 && (
                    <div style={{ background:"#F0FDF4", borderRadius:12, padding:"10px 14px" }}>
                      <div style={{ fontSize:9, fontWeight:700, color:"#16a34a", letterSpacing:"0.06em", marginBottom:6 }}>GOOD POINTS</div>
                      {evalResult.good_points.map((p: string, i: number) => (
                        <div key={i} style={{ fontSize:12, color:"#14532d", lineHeight:1.6, paddingLeft:12 }}>✅ {p}</div>
                      ))}
                    </div>
                  )}
                  {evalResult.missing_points?.length > 0 && (
                    <div style={{ background:"#FFF7ED", borderRadius:12, padding:"10px 14px" }}>
                      <div style={{ fontSize:9, fontWeight:700, color:"#E67E22", letterSpacing:"0.06em", marginBottom:6 }}>MISSING POINTS</div>
                      {evalResult.missing_points.map((p: string, i: number) => (
                        <div key={i} style={{ fontSize:12, color:"#9a3412", lineHeight:1.6, paddingLeft:12 }}>⚠️ {p}</div>
                      ))}
                    </div>
                  )}
                  {evalResult.icmai_terms_used?.length > 0 && (
                    <div style={{ background:"#DBEAFE", borderRadius:12, padding:"10px 14px" }}>
                      <div style={{ fontSize:9, fontWeight:700, color:"#185FA5", letterSpacing:"0.06em", marginBottom:6 }}>ICMAI TERMS USED</div>
                      <div style={{ fontSize:12, color:"#185FA5", lineHeight:1.6 }}>{evalResult.icmai_terms_used.join(", ")}</div>
                    </div>
                  )}
                  {evalResult.structure_feedback && (
                    <div style={{ background:"#fff", borderRadius:12, padding:"10px 14px", border:"0.5px solid rgba(0,0,0,0.06)" }}>
                      <div style={{ fontSize:9, fontWeight:700, color:"#6B6560", letterSpacing:"0.06em", marginBottom:4 }}>STRUCTURE</div>
                      <div style={{ fontSize:12, color:"#1A1208", lineHeight:1.6 }}>{evalResult.structure_feedback}</div>
                    </div>
                  )}
                  {evalResult.feedback && (
                    <div style={{ background:"#fff", borderRadius:12, padding:"10px 14px", border:"0.5px solid rgba(0,0,0,0.06)" }}>
                      <div style={{ fontSize:12, color:"#1A1208", lineHeight:1.6 }}>{evalResult.feedback}</div>
                    </div>
                  )}
                  {(q.model_answer || q.explanation) && (
                    <div style={{ background:"#E1F5EE", borderRadius:12, padding:"10px 14px", border:"1px solid rgba(14,102,85,0.12)" }}>
                      <div style={{ fontSize:9, fontWeight:700, color:"#0E6655", letterSpacing:"0.06em", marginBottom:6 }}>MODEL ANSWER</div>
                      <div style={{ fontSize:12, color:"#085041", lineHeight:1.6 }}>{q.model_answer || q.explanation}</div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign:"center", padding:20, color:"#A89880" }}>Evaluating your answer with Claude Sonnet...</div>
              )}
            </div>
          );
        })()}

        {/* Explanation */}
        {answered && getQType(q) !== "short" && getQType(q) !== "long" && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            style={{ background:"#fff", borderRadius:16, padding:14, border:"0.5px solid #E1F5EE" }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#A89880", letterSpacing:"0.06em", marginBottom:6 }}>EXPLANATION</div>
            <div style={{ fontSize:12, color:"#1A1208", lineHeight:1.6 }}>{q.explanation}</div>
            {q.icai_reference && (
              <div style={{ fontSize:10, color:"#6B9B8A", marginTop:8, fontStyle:"italic" }}>
                📖 Source: {q.icai_reference}
              </div>
            )}
          </motion.div>
        )}

      </div>

      {/* Bottom */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#fff", borderTop:"0.5px solid rgba(0,0,0,0.06)", padding:"12px 20px 24px", zIndex:99 }}>
        {answered ? (
          <motion.button whileTap={{ scale:0.97 }} onClick={handleNext}
            style={{ width:"100%", padding:"14px", borderRadius:16, background:"#0A2E28", color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor:"pointer" }}>
            {isLast ? "See Results →" : "Next Question →"}
          </motion.button>
        ) : (
          <div style={{ display:"flex", gap:10 }}>
            <motion.button whileTap={{ scale:0.97 }} onClick={handleNext}
              style={{ flex:1, padding:"14px", borderRadius:16, background:"#F5F0E8", color:"#6B6560", fontSize:13, fontWeight:500, border:"none", cursor:"pointer" }}>
              Skip →
            </motion.button>
            <div style={{ flex:2, padding:"14px", borderRadius:16, background:"#E5E0D8", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:12, color:"#A89880" }}>Tap an option to answer</span>
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
      <div className="app-shell" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:"#0A2E28" }}>Loading quiz...</div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}