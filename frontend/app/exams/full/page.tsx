"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

export default function FullExam() {
  const router   = useRouter();
  const [subject, setSubject] = useState("Accounting");
  const [paper,   setPaper]   = useState(0);

  return (
    <div className="app-shell">
      <div style={{ background:"#071739", padding:"18px 24px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <button onClick={() => router.back()}
            style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
            ← Back
          </button>
        </div>
        <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#fff", marginBottom:3 }}>Full Portion Exam</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>60 questions · 90 mins · 10 unique papers</div>
      </div>

      <div style={{ flex:1, padding:"16px 20px 100px", display:"flex", flexDirection:"column", gap:14 }}>

        <div style={{ background:"linear-gradient(135deg,rgba(227,195,157,0.15),#FFEDD5)", borderRadius:14, padding:12, border:"0.5px solid rgba(227,195,157,0.15)" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#A68868", marginBottom:4 }}>⚠️ Use in final 4 weeks</div>
          <div style={{ fontSize:11, color:"#071739", lineHeight:1.5 }}>Full portion exams simulate real CA/CMA exam conditions. 60 questions, 90 minutes, full syllabus coverage.</div>
        </div>

        <div style={{ fontSize:12, fontWeight:600, color:"#4B6382" }}>Subject</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {["Accounting","Law","Maths","Economics"].map(s => (
            <motion.div key={s} whileTap={{ scale:0.97 }}
              onClick={() => setSubject(s)}
              style={{ padding:"8px 16px", borderRadius:20, background:subject===s?"#071739":"#fff", border:subject===s?"none":"0.5px solid rgba(0,0,0,0.1)", cursor:"pointer" }}>
              <div style={{ fontSize:12, fontWeight:600, color:subject===s?"#fff":"#071739" }}>{s}</div>
            </motion.div>
          ))}
        </div>

        <div style={{ fontSize:12, fontWeight:600, color:"#4B6382" }}>Select paper (1–10)</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
          {Array.from({length:10},(_,i)=>i+1).map(p => (
            <motion.div key={p} whileTap={{ scale:0.97 }}
              onClick={() => setPaper(p)}
              style={{ padding:"12px 0", borderRadius:12, background:paper===p?"#071739":"#fff", border:paper===p?"none":"0.5px solid rgba(0,0,0,0.1)", cursor:"pointer", textAlign:"center" }}>
              <div style={{ fontSize:13, fontWeight:700, color:paper===p?"#fff":"#071739" }}>P{p}</div>
            </motion.div>
          ))}
        </div>

        {paper > 0 && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            style={{ background:"#071739", borderRadius:16, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginBottom:4 }}>Ready to start</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginBottom:12 }}>
              {subject} · Full Syllabus · Paper {paper} · 60 questions · 90 mins
            </div>
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => router.push(`/exams/take?type=full&subject=${subject}&paper=${paper}`)}
              style={{ width:"100%", padding:"14px", borderRadius:14, background:"#E3C39D", color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor:"pointer" }}>
              Start Full Exam →
            </motion.button>
          </motion.div>
        )}

      </div>
    </div>
  );
}