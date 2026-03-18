"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, Suspense } from "react";

// Sample questions — replace with API call
const sampleQuestions = [
  {
    id:"q1", concept:"Going Concern", source_type:"previous_paper",
    question_text:"The Going Concern assumption implies that the enterprise will continue in operation for:",
    option_a:"1 year", option_b:"5 years",
    option_c:"Foreseeable future", option_d:"Indefinite period",
    correct_option:"C",
    explanation:"Going Concern means the enterprise is assumed to continue for the foreseeable future — not a fixed period.",
    icai_reference:"ICAI Study Material · Ch 1 · Page 12 · Para 3.1",
  },
  {
    id:"q2", concept:"Minor's Contract", source_type:"textbook_exact",
    question_text:"A contract with a minor is:",
    option_a:"Valid", option_b:"Voidable",
    option_c:"Void ab initio", option_d:"Unenforceable",
    correct_option:"C",
    explanation:"A minor's contract is void ab initio — void from the very beginning. Section 11, ICA 1872.",
    icai_reference:"ICA 1872 · Ch 1 · Page 45 · Section 11",
  },
  {
    id:"q3", concept:"Accrual Concept", source_type:"tweaked",
    question_text:"Under Accrual concept, expenses are recognised when:",
    option_a:"Cash is paid", option_b:"They are incurred",
    option_c:"Invoice is received", option_d:"Cheque is issued",
    correct_option:"B",
    explanation:"Accrual concept — expenses recognised when incurred, not when cash paid.",
    icai_reference:"ICAI Study Material · Ch 1 · Page 15 · Para 3.3",
  },
  {
    id:"q4", concept:"Going Concern", source_type:"ai_generated",
    question_text:"Which of the following is NOT an implication of the Going Concern assumption?",
    option_a:"Assets valued at cost", option_b:"Long-term liabilities classified separately",
    option_c:"Assets valued at liquidation value", option_d:"Business expected to continue",
    correct_option:"C",
    explanation:"Going Concern means assets are valued at COST — not liquidation value. Option C is the trap.",
    icai_reference:"ICAI Study Material · Ch 1 · Page 12",
  },
  {
    id:"q5", concept:"Consistency", source_type:"textbook_exact",
    question_text:"Consistency concept means:",
    option_a:"Same method used every year", option_b:"Different methods for different assets",
    option_c:"Method changed annually", option_d:"Method decided by auditor",
    correct_option:"A",
    explanation:"Consistency — same accounting method used from year to year for comparability.",
    icai_reference:"ICAI Study Material · Ch 1 · Page 18 · Para 3.4",
  },
];

const sourceColors: Record<string, { bg: string; color: string; label: string }> = {
  previous_paper: { bg:"#FFF7ED", color:"#E67E22", label:"Previous Paper" },
  textbook_exact: { bg:"#E1F5EE", color:"#0E6655", label:"Textbook Exact" },
  tweaked:        { bg:"#EEF2FF", color:"#185FA5", label:"Tweaked"        },
  ai_generated:   { bg:"#F5F0E8", color:"#6B6560", label:"AI Generated"   },
};

function ExamContent() {
  const router     = useRouter();
  const params     = useSearchParams();
  const examType   = params.get("type")    || "chapter";
  const subject    = params.get("subject") || "Accounting";
  const timeLimit  = examType==="full" ? 5400 : examType==="half" ? 3600 : examType==="combined" ? 2400 : 1800;

  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState<Record<string, string>>({});
  const [selected,  setSelected]  = useState<string|null>(null);
  const [timeLeft,  setTimeLeft]  = useState(timeLimit);
  const [finished,  setFinished]  = useState(false);
  const [flagged,   setFlagged]   = useState<Set<string>>(new Set());
  const timerRef = useRef<any>(null);

  const questions = sampleQuestions;
  const question  = questions[current];
  const isLast    = current === questions.length - 1;

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setFinished(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const timerColor = timeLeft < 300 ? "#DC2626" : timeLeft < 600 ? "#E67E22" : "#fff";

  const handleSelect = (opt: string) => {
    if (answers[question.id]) return;
    setSelected(opt);
    setAnswers(prev => ({ ...prev, [question.id]: opt }));
  };

  const handleNext = () => {
    if (isLast) {
      clearInterval(timerRef.current);
      setFinished(true);
    } else {
      setCurrent(current + 1);
      setSelected(answers[questions[current+1]?.id] || null);
    }
  };

  const handleFlag = () => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(question.id)) next.delete(question.id);
      else next.add(question.id);
      return next;
    });
  };

  if (finished) {
    const score = questions.filter(q => answers[q.id] === q.correct_option).length;
    const pct   = Math.round((score / questions.length) * 100);
    router.push(`/exams/results?score=${score}&total=${questions.length}&pct=${pct}&type=${examType}&subject=${subject}`);
    return null;
  }

  const sourceInfo = sourceColors[question.source_type] || sourceColors.ai_generated;

  return (
    <div className="app-shell">

      {/* Header with timer */}
      <div style={{ background:"#0A2E28", padding:"14px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>{subject} · {examType}</div>
            <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>Q{current+1} of {questions.length}</div>
          </div>
          {/* Timer */}
          <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:12, padding:"8px 16px", textAlign:"center" }}>
            <div style={{ fontSize:20, fontWeight:700, color:timerColor, fontFamily:"Georgia,serif" }}>
              {formatTime(timeLeft)}
            </div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>remaining</div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height:3, background:"rgba(255,255,255,0.15)", borderRadius:2, overflow:"hidden" }}>
          <div style={{ width:`${((current+1)/questions.length)*100}%`, height:"100%", background:"#E67E22", borderRadius:2, transition:"width 0.3s" }} />
        </div>
        {/* Question dots */}
        <div style={{ display:"flex", gap:3, marginTop:6, flexWrap:"wrap" }}>
          {questions.map((q, i) => (
            <div key={i} onClick={() => { setCurrent(i); setSelected(answers[questions[i].id]||null); }}
              style={{ width:16, height:16, borderRadius:4, cursor:"pointer", fontSize:8, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700,
                background: flagged.has(q.id) ? "#E67E22" : answers[q.id] ? "#0E6655" : i===current ? "#fff" : "rgba(255,255,255,0.2)",
                color: i===current ? "#0A2E28" : "#fff"
              }}>
              {i+1}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex:1, padding:"14px 20px 120px", display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>

        {/* Question card */}
        <div style={{ background:"#fff", borderRadius:16, padding:16, border:"0.5px solid rgba(0,0,0,0.06)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ background:sourceInfo.bg, color:sourceInfo.color, fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>
              {sourceInfo.label}
            </div>
            <motion.div whileTap={{ scale:0.9 }} onClick={handleFlag}
              style={{ fontSize:16, cursor:"pointer", opacity: flagged.has(question.id) ? 1 : 0.4 }}>
              🚩
            </motion.div>
          </div>
          <div style={{ fontSize:14, fontWeight:600, color:"#1A1208", lineHeight:1.5 }}>
            {question.question_text}
          </div>
        </div>

        {/* Options */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {(["A","B","C","D"] as const).map((opt) => {
            const optKey = `option_${opt.toLowerCase()}` as keyof typeof question;
            const optText = question[optKey] as string;
            const answered   = !!answers[question.id];
            const isCorrect  = opt === question.correct_option;
            const isSelected = answers[question.id] === opt;
            let bg     = "#fff";
            let border = "0.5px solid rgba(0,0,0,0.06)";
            let color  = "#1A1208";
            let badgeBg = "#E6F1FB", badgeColor = "#185FA5";
            if (answered && isCorrect)          { bg="#f0fdf4"; border="1.5px solid #16a34a"; color="#14532d"; badgeBg="#16a34a"; badgeColor="#fff"; }
            else if (answered && isSelected)    { bg="#fef2f2"; border="1.5px solid #ef4444"; color="#991b1b"; badgeBg="#ef4444"; badgeColor="#fff"; }
            return (
              <motion.button key={opt} whileTap={{ scale:0.98 }}
                onClick={() => handleSelect(opt)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 14px", borderRadius:14, background:bg, border, cursor: answered?"default":"pointer", textAlign:"left", width:"100%" }}>
                <div style={{ width:26, height:26, borderRadius:8, background:badgeBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:badgeColor, flexShrink:0 }}>
                  {opt}
                </div>
                <span style={{ fontSize:13, fontWeight:500, color, flex:1 }}>{optText}</span>
                {answered && isCorrect && <span style={{ fontSize:9, fontWeight:700, color:"#16a34a", background:"#dcfce7", padding:"2px 8px", borderRadius:20 }}>✓</span>}
              </motion.button>
            );
          })}
        </div>

        {/* Explanation — shown after answering */}
        {answers[question.id] && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            style={{ background:"#fff", borderRadius:16, padding:14, border:"0.5px solid #E1F5EE" }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#A89880", letterSpacing:"0.06em", marginBottom:6 }}>EXPLANATION</div>
            <div style={{ fontSize:12, color:"#1A1208", lineHeight:1.6 }}>{question.explanation}</div>
            <div style={{ fontSize:10, color:"#A89880", marginTop:6 }}>{question.icai_reference}</div>
          </motion.div>
        )}

      </div>

      {/* Bottom bar */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#fff", borderTop:"0.5px solid rgba(0,0,0,0.06)", padding:"12px 20px 24px", zIndex:99 }}>
        <div style={{ display:"flex", gap:10 }}>
          {current > 0 && (
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => { setCurrent(current-1); setSelected(answers[questions[current-1].id]||null); }}
              style={{ flex:1, padding:"14px", borderRadius:16, background:"#F5F0E8", color:"#1A1208", fontSize:14, fontWeight:600, border:"none", cursor:"pointer" }}>
              ← Prev
            </motion.button>
          )}
          {answers[question.id] && (
            <motion.button whileTap={{ scale:0.97 }} onClick={handleNext}
              style={{ flex:2, padding:"14px", borderRadius:16, background:"#0A2E28", color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor:"pointer" }}>
              {isLast ? "Submit Exam →" : "Next →"}
            </motion.button>
          )}
          {!answers[question.id] && (
            <motion.button whileTap={{ scale:0.97 }} onClick={handleNext}
              style={{ flex:1, padding:"14px", borderRadius:16, background:"#F5F0E8", color:"#6B6560", fontSize:13, fontWeight:500, border:"none", cursor:"pointer" }}>
              Skip →
            </motion.button>
          )}
        </div>
      </div>

    </div>
  );
}

export default function ExamTake() {
  return (
    <Suspense fallback={<div className="app-shell" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}><div style={{ color:"#0A2E28", fontSize:16 }}>Loading exam...</div></div>}>
      <ExamContent />
    </Suspense>
  );
}