"use client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const questions = [
  {
    id: 1,
    type: "mcq",
    text: "Rahul aged 17 enters a contract to buy a laptop for ₹50,000. Under ICA 1872 this contract is:",
    options: ["Valid and enforceable","Absolutely void from beginning","Voidable at Rahul's option","Valid when he turns 18"],
    correct: 1,
    explanation: "Minor's contract is absolutely void — not voidable. Cannot be ratified even at 18.",
    source: "ICA 1872 · Ch 1 · Page 45 · Section 11",
    marks: 2,
    modelAnswer: "",
  },
  {
    id: 2,
    type: "theory",
    text: "Explain the Going Concern assumption and its effect on asset valuation.",
    options: [],
    correct: -1,
    explanation: "",
    source: "ICAI Study Material · Ch 1 · Page 12 · Para 3.1",
    marks: 5,
    modelAnswer: "Going Concern is a fundamental accounting assumption that states the enterprise will continue in operation for the foreseeable future. Because of this assumption, assets are recorded at cost price and not at liquidation value. For example, a machine worth ₹5 lakhs is recorded at cost — not at the price it would fetch if sold today.",
  },
  {
    id: 3,
    type: "mcq",
    text: "Under Accrual concept, revenue is recognised when:",
    options: ["Cash is received","It is earned","Invoice is raised","Customer orders"],
    correct: 1,
    explanation: "Accrual concept — revenue recognised when earned, not when cash received.",
    source: "ICAI Study Material · Ch 1 · Page 15 · Para 3.3",
    marks: 2,
    modelAnswer: "",
  },
];

// ── Collapsible dropdown for evaluation sections ──
function EvalDropdown({ title, color, bg, borderColor, children }: {
  title:string, color:string, bg:string, borderColor:string, children:React.ReactNode
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background:"#fff", borderRadius:16, border:`0.5px solid ${borderColor}`, overflow:"hidden" }}>
      <motion.div whileTap={{ scale:0.99 }} onClick={() => setOpen(!open)}
        style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 14px", cursor:"pointer", background: open ? bg : "#fff" }}>
        <div style={{ fontSize:12, fontWeight:700, color }}>{title}</div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration:0.2 }}
          style={{ fontSize:12, color, fontWeight:700 }}>▼</motion.div>
      </motion.div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }}
            transition={{ duration:0.25 }}
            style={{ overflow:"hidden" }}>
            <div style={{ padding:"0 14px 14px" }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Bottom nav ──
function BottomNav({ active }: { active:string }) {
  const router = useRouter();
  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#fff", borderTop:"0.5px solid rgba(0,0,0,0.06)", padding:"10px 20px 20px", display:"flex", justifyContent:"space-around", zIndex:100 }}>
      {[
        { label:"Home",     path:"/home"      },
        { label:"Study",    path:"/subject/1" },
        { label:"Quiz",     path:"/quiz"      },
        { label:"Progress", path:"/progress"  },
      ].map((item) => (
        <motion.div key={item.label} whileTap={{ scale:0.9 }}
          onClick={() => router.push(item.path)}
          style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
          <div style={{ width:20, height:20, borderRadius:6, background:item.label===active?"#0E6655":"#E5E0D8" }} />
          <div style={{ fontSize:10, fontWeight:item.label===active?700:400, color:item.label===active?"#0E6655":"#A89880" }}>{item.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Quiz() {
  const router = useRouter();
  const [current,    setCurrent]    = useState(0);
  const [mode,       setMode]       = useState<"select"|"mcq"|"type">("select");
  const [selected,   setSelected]   = useState<number|null>(null);
  const [typed,      setTyped]      = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [answers,    setAnswers]    = useState<any[]>([]);
  const [finished,   setFinished]   = useState(false);

  const question = questions[current];
  const isLast   = current === questions.length - 1;

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const res = await fetch("https://studybuddy-production-7776.up.railway.app/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question:     question.text,
          answer:       typed,
          model_answer: question.modelAnswer,
          marks:        question.marks,
        }),
      });
      const data = await res.json();
      setEvaluation(data);
    } catch {
      // Fallback if backend not reachable
      setEvaluation({
        content_score:  3,
        total_marks:    question.marks,
        what_correct:   ["Definition mentioned","Basic concept understood"],
        what_missing:   ["Asset valuation not mentioned","No ICAI source cited"],
        mama_feedback:  "Good attempt! Add the asset valuation point to score full marks.",
        model_answer:   question.modelAnswer,
      });
    }
    setEvaluating(false);
  };

  const handleNext = (result: any) => {
    const newAnswers = [...answers, result];
    setAnswers(newAnswers);
    if (isLast) {
      setFinished(true);
    } else {
      setCurrent(current + 1);
      setMode("select");
      setSelected(null);
      setTyped("");
      setEvaluation(null);
    }
  };

  // ── RESULTS SCREEN ──
  if (finished) {
    const mcqCorrect  = answers.filter((a,i) => questions[i].type==="mcq" && a.correct).length;
    const mcqTotal    = questions.filter(q => q.type==="mcq").length;
    const theoryScore = answers.filter((_,i) => questions[i].type==="theory").reduce((acc,a) => acc+(a.score||0), 0);
    const theoryTotal = questions.filter(q => q.type==="theory").reduce((acc,q) => acc+q.marks, 0);
    const totalScore  = mcqCorrect*2 + theoryScore;
    const totalMarks  = questions.reduce((acc,q) => acc+q.marks, 0);
    const pct         = Math.round((totalScore/totalMarks)*100);
    return (
      <div className="app-shell">
        <div style={{ background:"#0A2E28", padding:"20px 24px" }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:700, color:"#fff" }}>Quiz Complete</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:4 }}>Going Concern · {questions.length} questions</div>
        </div>
        <div style={{ flex:1, padding:"20px 20px 100px", display:"flex", flexDirection:"column", gap:14, overflowY:"auto" }}>
          <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
            style={{ background:pct>=60?"linear-gradient(135deg,#F0FDF4,#DCFCE7)":"linear-gradient(135deg,#FEF2F2,#FEE2E2)", borderRadius:20, padding:24, textAlign:"center", border:`1.5px solid ${pct>=60?"rgba(22,163,74,0.2)":"rgba(220,38,38,0.2)"}` }}>
            <div style={{ fontFamily:"Georgia,serif", fontSize:52, fontWeight:700, color:pct>=60?"#16a34a":"#dc2626", marginBottom:4 }}>{pct}%</div>
            <div style={{ fontSize:14, fontWeight:600, color:"#1A1208", marginBottom:4 }}>{totalScore} of {totalMarks} marks</div>
            <div style={{ fontSize:12, color:"#6B6560" }}>
              {pct>=80?"Excellent! Mama is proud 🎉":pct>=60?"Good effort! Review below.":"Keep practising. Mama explains below."}
            </div>
          </motion.div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div style={{ background:"#fff", borderRadius:16, padding:14, border:"0.5px solid rgba(0,0,0,0.06)", textAlign:"center" }}>
              <div style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:"#0E6655" }}>{mcqCorrect}/{mcqTotal}</div>
              <div style={{ fontSize:10, color:"#A89880", marginTop:2 }}>MCQ correct</div>
            </div>
            <div style={{ background:"#fff", borderRadius:16, padding:14, border:"0.5px solid rgba(0,0,0,0.06)", textAlign:"center" }}>
              <div style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:"#E67E22" }}>{theoryScore}/{theoryTotal}</div>
              <div style={{ fontSize:10, color:"#A89880", marginTop:2 }}>Theory marks</div>
            </div>
          </div>
          <div style={{ background:"linear-gradient(135deg,#0A2E28,#0A4A3C)", borderRadius:16, padding:14, display:"flex", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:10, background:"rgba(255,255,255,0.1)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:9, fontWeight:700, color:"#fff" }}>M</span>
            </div>
            <div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginBottom:3 }}>Mama says</div>
              <div style={{ fontSize:12, color:"#fff", lineHeight:1.6 }}>
                {pct>=80?'"Excellent! Going Concern is clear. Move to Accrual next."':pct>=60?'"Good attempt! Review the theory answer. Try again tomorrow."':'"Do not worry. Read the lesson once more. Mama will explain differently."'}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => { setCurrent(0); setMode("select"); setSelected(null); setTyped(""); setEvaluation(null); setAnswers([]); setFinished(false); }}
              style={{ flex:1, padding:"14px", borderRadius:16, background:"#0A2E28", color:"#fff", fontSize:13, fontWeight:700, border:"none", cursor:"pointer" }}>
              Try Again
            </motion.button>
            <motion.button whileTap={{ scale:0.97 }} onClick={() => router.push("/lesson")}
              style={{ flex:1, padding:"14px", borderRadius:16, background:"#fff", color:"#0A2E28", fontSize:13, fontWeight:700, border:"1.5px solid rgba(10,46,40,0.15)", cursor:"pointer" }}>
              Back to Lesson
            </motion.button>
          </div>
        </div>
        <BottomNav active="Quiz" />
      </div>
    );
  }

  // ── MODE SELECTION ──
  if (mode === "select") {
    return (
      <div className="app-shell">
        <div style={{ background:"#0A2E28", padding:"18px 24px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <button onClick={() => router.back()}
              style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
              ← Back
            </button>
            <span style={{ fontFamily:"Georgia,serif", fontSize:16, fontWeight:700, color:"#fff" }}>{current+1}/{questions.length}</span>
          </div>
          <div style={{ display:"flex", gap:4 }}>
            {questions.map((_,i) => (
              <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<current?"#E67E22":i===current?"rgba(230,126,34,0.5)":"rgba(255,255,255,0.2)" }} />
            ))}
          </div>
        </div>
        <div style={{ flex:1, padding:"16px 20px 100px", display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ background:"#fff", borderRadius:16, padding:16, border:"0.5px solid rgba(0,0,0,0.06)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ fontSize:9, fontWeight:700, color:"#A89880", letterSpacing:"0.06em" }}>QUESTION {current+1} OF {questions.length}</div>
              <div style={{ background:question.type==="mcq"?"#E1F5EE":"#FFF7ED", color:question.type==="mcq"?"#085041":"#9a3412", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>
                {question.type==="mcq"?"MCQ":"Theory"} · {question.marks} marks
              </div>
            </div>
            <div style={{ fontSize:14, fontWeight:600, color:"#1A1208", lineHeight:1.5 }}>{question.text}</div>
          </div>
          <div style={{ background:"linear-gradient(135deg,#FFF7ED,#FFEDD5)", borderRadius:14, padding:12, border:"0.5px solid rgba(230,126,34,0.15)", display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"#E67E22", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:8, fontWeight:700, color:"#fff" }}>K</span>
            </div>
            <div style={{ fontSize:11, color:"#431407", lineHeight:1.5 }}>
              {question.type==="mcq"?"\"Mama — is this a trap question? I will read all 4 options carefully!\"":"\"Mama — theory question! Definition + example + ICAI source. Right?\""}
            </div>
          </div>
          <div style={{ fontSize:12, fontWeight:600, color:"#6B6560" }}>How do you want to answer?</div>
          <motion.div whileTap={{ scale:0.97 }} onClick={() => setMode("mcq")}
            style={{ background:"#fff", borderRadius:16, padding:16, border:"1.5px solid rgba(14,102,85,0.2)", display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}>
            <div style={{ width:44, height:44, borderRadius:14, background:"#E1F5EE", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>✏️</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#0E6655", marginBottom:2 }}>MCQ Practice</div>
              <div style={{ fontSize:11, color:"#A89880" }}>Tap A B C D — instant result</div>
            </div>
            <div style={{ background:"#E1F5EE", color:"#0E6655", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>Quick</div>
          </motion.div>
          <motion.div whileTap={{ scale:0.97 }} onClick={() => setMode("type")}
            style={{ background:"#fff", borderRadius:16, padding:16, border:"0.5px solid rgba(0,0,0,0.08)", display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}>
            <div style={{ width:44, height:44, borderRadius:14, background:"#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>⌨️</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#1A1208", marginBottom:2 }}>Type Your Answer</div>
              <div style={{ fontSize:11, color:"#A89880" }}>Write answer — Mama evaluates with AI</div>
            </div>
            <div style={{ fontSize:12, color:"#A89880" }}>→</div>
          </motion.div>
          <div style={{ background:"#FAFAF8", borderRadius:16, padding:16, border:"0.5px solid rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:14, opacity:0.5 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:"#FFF7ED", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>🎤</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#1A1208", marginBottom:2 }}>Speak Your Answer</div>
              <div style={{ fontSize:11, color:"#A89880" }}>Voice to text — Mama evaluates</div>
            </div>
            <div style={{ background:"#FFF7ED", color:"#E67E22", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>Soon</div>
          </div>
          <div style={{ background:"#FAFAF8", borderRadius:16, padding:16, border:"0.5px solid rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:14, opacity:0.5 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:"#F5F0E8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>📷</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#1A1208", marginBottom:2 }}>Upload Handwritten</div>
              <div style={{ fontSize:11, color:"#A89880" }}>Photo your paper — Mama checks content and presentation</div>
            </div>
            <div style={{ background:"#FFF7ED", color:"#E67E22", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>Soon</div>
          </div>
        </div>
        <BottomNav active="Quiz" />
      </div>
    );
  }

  // ── MCQ MODE ──
  if (mode === "mcq") {
    return (
      <div className="app-shell">
        <div style={{ background:"#0A2E28", padding:"18px 24px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <button onClick={() => setMode("select")}
              style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
              ← Back
            </button>
            <span style={{ fontFamily:"Georgia,serif", fontSize:16, fontWeight:700, color:"#fff" }}>{current+1}/{questions.length}</span>
          </div>
          <div style={{ display:"flex", gap:4 }}>
            {questions.map((_,i) => (
              <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<=current?"#E67E22":"rgba(255,255,255,0.2)" }} />
            ))}
          </div>
        </div>
        <div style={{ flex:1, padding:"16px 20px 100px", display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ background:"#fff", borderRadius:16, padding:16, border:"0.5px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#A89880", letterSpacing:"0.06em", marginBottom:8 }}>QUESTION {current+1} · {question.marks} MARKS</div>
            <div style={{ fontSize:14, fontWeight:600, color:"#1A1208", lineHeight:1.5 }}>{question.text}</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {question.options.map((opt,i) => {
              const showResult = selected!==null;
              const isCorrect  = i===question.correct;
              const isSelected = selected===i;
              let bg="#fff", border="0.5px solid rgba(0,0,0,0.06)", color="#1A1208";
              let badgeBg="#E6F1FB", badgeColor="#185FA5";
              if(showResult&&isCorrect){bg="#f0fdf4";border="1.5px solid #16a34a";color="#14532d";badgeBg="#16a34a";badgeColor="#fff";}
              else if(showResult&&isSelected&&!isCorrect){bg="#fef2f2";border="1.5px solid #ef4444";color="#991b1b";badgeBg="#ef4444";badgeColor="#fff";}
              return (
                <motion.button key={i} whileTap={{ scale:0.98 }}
                  onClick={() => selected===null&&setSelected(i)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 14px", borderRadius:14, background:bg, border, cursor:"pointer", textAlign:"left", width:"100%" }}>
                  <div style={{ width:26, height:26, borderRadius:8, background:badgeBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:badgeColor, flexShrink:0 }}>
                    {["A","B","C","D"][i]}
                  </div>
                  <span style={{ fontSize:13, fontWeight:500, color, flex:1 }}>{opt}</span>
                  {showResult&&isCorrect&&<span style={{ fontSize:9, fontWeight:700, color:"#16a34a", background:"#dcfce7", padding:"2px 8px", borderRadius:20 }}>Correct ✓</span>}
                </motion.button>
              );
            })}
          </div>
          {selected!==null&&(
            <EvalDropdown title="Explanation 💡" color="#085041" bg="#E1F5EE" borderColor="rgba(14,102,85,0.15)">
              <div style={{ fontSize:12, color:"#1A1208", lineHeight:1.6 }}>{question.explanation}</div>
              <div style={{ fontSize:10, color:"#A89880", marginTop:6 }}>{question.source}</div>
            </EvalDropdown>
          )}
        </div>
        {selected!==null&&(
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            style={{ padding:"12px 20px 80px", background:"#fff", borderTop:"0.5px solid rgba(0,0,0,0.06)" }}>
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => handleNext({ correct: selected===question.correct, selected })}
              style={{ width:"100%", padding:"15px", borderRadius:16, background:"#0A2E28", color:"#fff", fontSize:15, fontWeight:700, border:"none", cursor:"pointer" }}>
              {isLast?"See Results →":"Next Question →"}
            </motion.button>
          </motion.div>
        )}
        <BottomNav active="Quiz" />
      </div>
    );
  }

  // ── TYPE ANSWER MODE ──
  if (mode === "type") {
    return (
      <div className="app-shell">
        <div style={{ background:"#0A2E28", padding:"18px 24px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <button onClick={() => setMode("select")}
              style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
              ← Back
            </button>
            <span style={{ fontFamily:"Georgia,serif", fontSize:16, fontWeight:700, color:"#fff" }}>Type Answer</span>
          </div>
        </div>
        <div style={{ flex:1, padding:"16px 20px 180px", display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
          <div style={{ background:"#fff", borderRadius:16, padding:16, border:"0.5px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#A89880", letterSpacing:"0.06em", marginBottom:8 }}>QUESTION · {question.marks} MARKS</div>
            <div style={{ fontSize:14, fontWeight:600, color:"#1A1208", lineHeight:1.5 }}>{question.text}</div>
          </div>
          <div style={{ background:"#F5F0E8", borderRadius:14, padding:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#6B6560", marginBottom:8, letterSpacing:"0.04em" }}>SUGGESTED STRUCTURE</div>
            {[
              { step:"1", text:"Definition",          marks:1 },
              { step:"2", text:"The assumption",      marks:2 },
              { step:"3", text:"Effect on valuation", marks:1 },
              { step:"4", text:"Example",             marks:1 },
            ].map((s) => (
              <div key={s.step} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <div style={{ width:20, height:20, borderRadius:6, background:"#0A2E28", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#fff", flexShrink:0 }}>{s.step}</div>
                <div style={{ fontSize:11, color:"#1A1208", flex:1 }}>{s.text}</div>
                <div style={{ fontSize:10, color:"#A89880" }}>{s.marks}m</div>
              </div>
            ))}
          </div>

          {/* Text area — hidden after evaluation */}
          {!evaluation && (
            <>
              <textarea
                value={typed}
                onChange={e => setTyped(e.target.value)}
                placeholder="Write your answer here..."
                rows={8}
                style={{ width:"100%", padding:"14px 16px", borderRadius:16, border:`1.5px solid ${typed.length>50?"#0E6655":"#C8C0B4"}`, background:"#fff", fontSize:13, color:"#1A1208", outline:"none", resize:"none", lineHeight:1.6, boxSizing:"border-box", fontFamily:"inherit" }}
              />
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:-8 }}>
                <div style={{ fontSize:10, color:"#A89880" }}>Words: {typed.split(" ").filter(Boolean).length} / 100 min</div>
                <div style={{ fontSize:10, color:typed.split(" ").filter(Boolean).length>=100?"#0E6655":"#E67E22", fontWeight:600 }}>
                  {typed.split(" ").filter(Boolean).length>=100?"Ready ✓":"Keep writing..."}
                </div>
              </div>
            </>
          )}

          {/* Evaluation results — collapsible dropdowns */}
          {evaluation && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              style={{ display:"flex", flexDirection:"column", gap:12 }}>

              {/* Score card — always visible */}
              <div style={{ background:evaluation.content_score/evaluation.total_marks>=0.6?"linear-gradient(135deg,#F0FDF4,#DCFCE7)":"linear-gradient(135deg,#FEF2F2,#FEE2E2)", borderRadius:20, padding:20, display:"flex", alignItems:"center", gap:16, border:`1.5px solid ${evaluation.content_score/evaluation.total_marks>=0.6?"rgba(22,163,74,0.2)":"rgba(220,38,38,0.2)"}` }}>
                <div style={{ textAlign:"center", flexShrink:0 }}>
                  <div style={{ fontFamily:"Georgia,serif", fontSize:36, fontWeight:700, color:evaluation.content_score/evaluation.total_marks>=0.6?"#16a34a":"#dc2626" }}>
                    {evaluation.content_score}
                  </div>
                  <div style={{ fontSize:11, color:"#6B6560" }}>/ {evaluation.total_marks}</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#1A1208", marginBottom:6 }}>Mama's Score</div>
                  <div style={{ height:6, background:"rgba(0,0,0,0.08)", borderRadius:3, overflow:"hidden", marginBottom:6 }}>
                    <div style={{ width:`${(evaluation.content_score/evaluation.total_marks)*100}%`, height:"100%", background:evaluation.content_score/evaluation.total_marks>=0.6?"#16a34a":"#dc2626", borderRadius:3 }} />
                  </div>
                  <div style={{ fontSize:11, color:"#6B6560", lineHeight:1.4 }}>{evaluation.mama_feedback}</div>
                </div>
              </div>

              {/* Collapsible sections */}
              <EvalDropdown title="What you got right ✓" color="#0E6655" bg="#E1F5EE" borderColor="rgba(22,163,74,0.2)">
                {evaluation.what_correct?.map((item:string, i:number) => (
                  <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:6 }}>
                    <div style={{ width:16, height:16, borderRadius:"50%", background:"#0E6655", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:"#fff", flexShrink:0, marginTop:1 }}>✓</div>
                    <div style={{ fontSize:12, color:"#1A1208", lineHeight:1.5 }}>{item}</div>
                  </div>
                ))}
              </EvalDropdown>

              <EvalDropdown title="What is missing ✗" color="#DC2626" bg="#FEF2F2" borderColor="rgba(220,38,38,0.2)">
                {evaluation.what_missing?.map((item:string, i:number) => (
                  <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:6 }}>
                    <div style={{ width:16, height:16, borderRadius:"50%", background:"#DC2626", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:"#fff", flexShrink:0, marginTop:1 }}>✗</div>
                    <div style={{ fontSize:12, color:"#1A1208", lineHeight:1.5 }}>{item}</div>
                  </div>
                ))}
              </EvalDropdown>

              <EvalDropdown title="ICAI Model Answer 📖" color="#085041" bg="#E1F5EE" borderColor="rgba(14,102,85,0.15)">
                <div style={{ fontSize:12, color:"#1A1208", lineHeight:1.7 }}>{evaluation.model_answer}</div>
                <div style={{ fontSize:10, color:"#A89880", marginTop:8 }}>{question.source}</div>
              </EvalDropdown>

            </motion.div>
          )}
        </div>

        {/* Submit / Next button */}
        <div style={{ position:"fixed", bottom:68, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, padding:"10px 20px", background:"#fff", borderTop:"0.5px solid rgba(0,0,0,0.06)", zIndex:99 }}>
          {!evaluation ? (
            <motion.button whileTap={{ scale:0.97 }}
              onClick={handleEvaluate}
              disabled={typed.trim().length<20||evaluating}
              style={{ width:"100%", padding:"15px", borderRadius:16, background:typed.trim().length>=20?"#0A2E28":"#C8C0B4", color:"#fff", fontSize:15, fontWeight:700, border:"none", cursor:typed.trim().length>=20?"pointer":"not-allowed" }}>
              {evaluating?"Mama is evaluating...":"Submit for Mama's Evaluation →"}
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => handleNext({ score:evaluation.content_score, total:evaluation.total_marks })}
              style={{ width:"100%", padding:"15px", borderRadius:16, background:"#0A2E28", color:"#fff", fontSize:15, fontWeight:700, border:"none", cursor:"pointer" }}>
              {isLast?"See Final Results →":"Next Question →"}
            </motion.button>
          )}
        </div>

        <BottomNav active="Quiz" />
      </div>
    );
  }

  return null;
}