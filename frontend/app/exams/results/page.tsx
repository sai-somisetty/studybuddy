"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense } from "react";

function ResultsContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const score   = parseInt(params.get("score")   || "0");
  const total   = parseInt(params.get("total")   || "5");
  const pct     = parseInt(params.get("pct")     || "0");
  const type    = params.get("type")    || "chapter";
  const subject = params.get("subject") || "Accounting";

  const passed  = pct >= 40;
  const color   = pct >= 80 ? "#16a34a" : pct >= 60 ? "#E3C39D" : pct >= 40 ? "#185FA5" : "#DC2626";
  const bg      = pct >= 80 ? "linear-gradient(135deg,#F0FDF4,#DCFCE7)" : pct >= 40 ? "linear-gradient(135deg,rgba(227,195,157,0.08),#FFEDD5)" : "linear-gradient(135deg,#FEF2F2,#FEE2E2)";

  const mamaMessage = pct >= 80
    ? "Outstanding! You are exam ready. Mama is proud! 🎉"
    : pct >= 60
    ? "Good attempt! Review the questions you got wrong. Try again tomorrow."
    : pct >= 40
    ? "Passing score! Focus on weak concepts and try the next paper."
    : "Do not worry. Review the lesson once more. Mama will explain differently.";

  return (
    <div className="app-shell">
      <div style={{ background:"#071739", padding:"20px 24px" }}>
        <div style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:700, color:"#fff" }}>Exam Results</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:4 }}>{subject} · {type} exam</div>
      </div>

      <div style={{ flex:1, padding:"20px 20px 100px", display:"flex", flexDirection:"column", gap:14, overflowY:"auto" }}>

        {/* Score card */}
        <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
          style={{ background:bg, borderRadius:20, padding:24, textAlign:"center", border:`1.5px solid ${color}33` }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:64, fontWeight:700, color, marginBottom:4 }}>{pct}%</div>
          <div style={{ fontSize:16, fontWeight:600, color:"#071739", marginBottom:4 }}>{score} of {total} correct</div>
          <div style={{ fontSize:13, color:"#4B6382" }}>
            {passed ? "✅ Passed" : "❌ Below passing marks (40%)"}
          </div>
        </motion.div>

        {/* Stats grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {[
            { val:score,       label:"Correct",  color:"#071739" },
            { val:total-score, label:"Wrong",    color:"#DC2626" },
            { val:total,       label:"Total",    color:"#071739" },
          ].map((s,i) => (
            <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
              style={{ background:"#fff", borderRadius:14, padding:12, border:"0.5px solid rgba(0,0,0,0.06)", textAlign:"center" }}>
              <div style={{ fontFamily:"Georgia,serif", fontSize:24, fontWeight:700, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:10, color:"#A4B5C4", marginTop:2 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Question type breakdown */}
        <div style={{ background:"#fff", borderRadius:16, padding:14, border:"0.5px solid rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#071739", marginBottom:10 }}>By question type</div>
          {[
            { label:"Previous Papers",   color:"#E3C39D" },
            { label:"Textbook Exact",    color:"#071739" },
            { label:"Tweaked",           color:"#185FA5" },
            { label:"AI Generated",      color:"#4B6382" },
          ].map((t) => (
            <div key={t.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ fontSize:12, color:t.color, fontWeight:500 }}>{t.label}</span>
              <span style={{ fontSize:12, color:"#A4B5C4" }}>Coming soon</span>
            </div>
          ))}
        </div>

        {/* Mama feedback */}
        <div style={{ background:"#071739", borderRadius:16, padding:14, display:"flex", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:"rgba(255,255,255,0.1)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:9, fontWeight:700, color:"#fff" }}>M</span>
          </div>
          <div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginBottom:3 }}>Mama says</div>
            <div style={{ fontSize:12, color:"#fff", lineHeight:1.6 }}>"{mamaMessage}"</div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display:"flex", gap:10 }}>
          <motion.button whileTap={{ scale:0.97 }}
            onClick={() => router.push("/exams")}
            style={{ flex:1, padding:"14px", borderRadius:16, background:"#071739", color:"#fff", fontSize:13, fontWeight:700, border:"none", cursor:"pointer" }}>
            Try Another
          </motion.button>
          <motion.button whileTap={{ scale:0.97 }}
            onClick={() => router.push("/home")}
            style={{ flex:1, padding:"14px", borderRadius:16, background:"#fff", color:"#071739", fontSize:13, fontWeight:700, border:"1.5px solid rgba(7,23,57,0.08)", cursor:"pointer" }}>
            Home
          </motion.button>
        </div>

        {/* Bug report */}
        <div style={{ textAlign:"center" }}>
          <span style={{ fontSize:11, color:"#A4B5C4", cursor:"pointer" }}
            onClick={() => router.push("/profile")}>
            🚩 Report an issue with this exam
          </span>
        </div>

      </div>
    </div>
  );
}

export default function ExamResults() {
  return (
    <Suspense fallback={<div className="app-shell" />}>
      <ResultsContent />
    </Suspense>
  );
}