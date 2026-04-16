"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

export default function HalfExam() {
  const router   = useRouter();
  const [subject, setSubject] = useState("Accounting");
  const [half,    setHalf]    = useState<"A"|"B"|"">("");
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
        <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#fff", marginBottom:3 }}>Half Portion Exam</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>40 questions · 60 mins · 5 unique papers</div>
      </div>

      <div style={{ flex:1, padding:"16px 20px 100px", display:"flex", flexDirection:"column", gap:14 }}>

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

        <div style={{ fontSize:12, fontWeight:600, color:"#4B6382" }}>Which half?</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            { id:"A", label:"Part A", sub:"First half of syllabus", chapters:"Ch 1 — Ch 4" },
            { id:"B", label:"Part B", sub:"Second half of syllabus", chapters:"Ch 5 — Ch 8" },
          ].map(h => (
            <motion.div key={h.id} whileTap={{ scale:0.97 }}
              onClick={() => setHalf(h.id as "A"|"B")}
              style={{ background:half===h.id?"#071739":"#fff", borderRadius:16, padding:16, border:half===h.id?"2px solid #071739":"0.5px solid rgba(0,0,0,0.06)", cursor:"pointer", textAlign:"center" }}>
              <div style={{ fontSize:15, fontWeight:700, color:half===h.id?"#fff":"#071739", marginBottom:4 }}>{h.label}</div>
              <div style={{ fontSize:11, color:half===h.id?"rgba(255,255,255,0.7)":"#A4B5C4", marginBottom:2 }}>{h.sub}</div>
              <div style={{ fontSize:11, color:half===h.id?"rgba(255,255,255,0.5)":"#4B6382" }}>{h.chapters}</div>
            </motion.div>
          ))}
        </div>

        {half && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:"#4B6382", marginBottom:10 }}>Select paper (1–5)</div>
            <div style={{ display:"flex", gap:8 }}>
              {[1,2,3,4,5].map(p => (
                <motion.div key={p} whileTap={{ scale:0.97 }}
                  onClick={() => setPaper(p)}
                  style={{ flex:1, padding:"12px 0", borderRadius:12, background:paper===p?"#071739":"#fff", border:paper===p?"none":"0.5px solid rgba(0,0,0,0.1)", cursor:"pointer", textAlign:"center" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:paper===p?"#fff":"#071739" }}>P{p}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {half && paper > 0 && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            style={{ background:"#071739", borderRadius:16, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginBottom:4 }}>Ready to start</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginBottom:12 }}>
              {subject} · Part {half} · Paper {paper} · 40 questions · 60 mins
            </div>
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => router.push(`/exams/take?type=half&subject=${subject}&half=${half}&paper=${paper}`)}
              style={{ width:"100%", padding:"14px", borderRadius:14, background:"#E3C39D", color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor:"pointer" }}>
              Start Half Portion Exam →
            </motion.button>
          </motion.div>
        )}

      </div>
    </div>
  );
}