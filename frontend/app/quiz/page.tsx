"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";

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
  const initMode  = params.get("mode")      || "";

  const [mode,       setMode]       = useState(initMode || "textbook");
  const [started,    setStarted]    = useState(false);
  const [questions,  setQuestions]  = useState<any[]>([]);
  const [current,    setCurrent]    = useState(0);
  const [answers,    setAnswers]    = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [loading,    setLoading]    = useState(false);

  const startQuiz = () => {
    setStarted(true);
    loadQuestions(mode);
  };

  const loadQuestions = async (selectedMode: string) => {
    setQuestions([]);
    setCurrent(0);
    setAnswers({});
    setShowResult(false);
    setLoading(true);

    try {
      if (selectedMode === "previous") {
        // Previous papers — from Supabase
        const res  = await fetch(`${API}/questions/previous_paper/${namespace}`);
        const data = await res.json();
        setQuestions(data.has_questions ? data.questions : []);

      } else if (selectedMode === "textbook") {
        // Textbook exercise questions from ICMAI book
        const res  = await fetch(`${API}/questions/textbook?course=cma&paper=1&limit=10`);
        const data = await res.json();
        setQuestions(data.has_questions && data.questions.length > 0
          ? data.questions
          : textbookFallback
        );

      } else if (selectedMode === "tweaked") {
        // Tweaked — similar to textbook but changed names/numbers
        // Check cache first, generate if not cached
        const res  = await fetch(`${API}/questions/ai-generate`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            namespace,
            concept,
            count: 5,
            seed:  1,
            mode:  "tweaked",
            // seed=1 means same questions served from cache after first generation
          }),
        });
        const data = await res.json();
        setQuestions(data.questions && data.questions.length > 0
          ? data.questions
          : []
        );

      } else if (selectedMode === "ai") {
        // AI Generated — reads ICAI content line by line
        // Tests every key point — application not just memory
        const res  = await fetch(`${API}/questions/ai-generate`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            namespace,
            concept,
            count: 5,
            seed:  Date.now(), // fresh seed = checks cache, generates new only if needed
            mode:  "ai",
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

  const handleAnswer = (opt: string) => {
    const q = questions[current];
    const key = q.id || String(current);
    if (answers[key]) return;
    setAnswers(prev => ({ ...prev, [key]: opt }));
  };

  const handleNext = () => {
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

  // ── MODE SELECTION ──
  if (!started) {
    return (
      <div className="app-shell">
        <div style={{ background:"#0A2E28", padding:"18px 24px 16px" }}>
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
          <div style={{ fontSize:12, fontWeight:600, color:"#6B6560" }}>Select question type</div>

          {/* 2x2 Grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {MODES.map((m, i) => {
              const selected = mode === m.id;
              return (
                <motion.div key={m.id}
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:i*0.05 }}
                  whileTap={{ scale:0.97 }}
                  onClick={() => setMode(m.id)}
                  style={{
                    background: selected ? "#E1F5EE" : "#fff",
                    borderRadius: 16,
                    padding: "16px 14px",
                    border: selected ? "2px solid #0E6655" : "1px solid rgba(0,0,0,0.06)",
                    cursor: "pointer",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}>
                  <div style={{ fontSize:28 }}>{m.icon}</div>
                  <div style={{ fontSize:13, fontWeight:700, color: selected ? "#0E6655" : m.color }}>{m.label}</div>
                  <div style={{ fontSize:10, color: selected ? "#0E6655" : "#A89880", lineHeight:1.4 }}>{m.desc}</div>
                </motion.div>
              );
            })}
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
        <div style={{ background:"#0A2E28", padding:"18px 24px 16px" }}>
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
              {mode === "previous"
                ? "Previous paper questions for this concept have not been seeded yet."
                : "Could not load questions. Try again or choose another mode."}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <motion.button whileTap={{ scale:0.97 }}
                onClick={() => loadQuestions(mode)}
                style={{ padding:"12px 24px", borderRadius:14, background:"#0A2E28", color:"#fff", fontSize:13, fontWeight:600, border:"none", cursor:"pointer" }}>
                Try Again →
              </motion.button>
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
        <div style={{ background:"#0A2E28", padding:"18px 24px" }}>
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
      <div style={{ background:"#0A2E28", padding:"14px 20px" }}>
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

      <div style={{ flex:1, padding:"14px 20px 120px", display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>

        {/* Question */}
        <div style={{ background:"#fff", borderRadius:16, padding:16, border:"0.5px solid rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:9, fontWeight:700, color:selectedMode?.color, letterSpacing:"0.06em", marginBottom:8 }}>
            {selectedMode?.icon} {selectedMode?.label.toUpperCase()}
          </div>
          <div style={{ fontSize:14, fontWeight:600, color:"#1A1208", lineHeight:1.6 }}>
            {q.question_text}
          </div>
        </div>

        {/* Options */}
        {["A","B","C","D"].map(opt => {
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

        {/* Explanation */}
        {answered && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            style={{ background:"#fff", borderRadius:16, padding:14, border:"0.5px solid #E1F5EE" }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#A89880", letterSpacing:"0.06em", marginBottom:6 }}>EXPLANATION</div>
            <div style={{ fontSize:12, color:"#1A1208", lineHeight:1.6 }}>{q.explanation}</div>
            {q.icai_reference && (
              <div style={{ fontSize:10, color:"#A89880", marginTop:6 }}>📖 {q.icai_reference}</div>
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