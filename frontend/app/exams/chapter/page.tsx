"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

const subjects = [
  { id:"accounting", label:"Accounting",  chapters:8 },
  { id:"law",        label:"Law",          chapters:6 },
  { id:"maths",      label:"Maths",        chapters:7 },
  { id:"economics",  label:"Economics",    chapters:5 },
];

export default function ChapterExam() {
  const router = useRouter();
  const [subject,  setSubject]  = useState("");
  const [chapter,  setChapter]  = useState(0);

  const selected = subjects.find(s => s.id === subject);

  const handleStart = () => {
    if (!subject || !chapter) return;
    router.push(`/exams/take?type=chapter&subject=${subject}&chapters=${chapter}&paper=1`);
  };

  return (
    <div className="app-shell">
      <div style={{ background:"#0A2E28", padding:"18px 24px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <button onClick={() => router.back()}
            style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
            ← Back
          </button>
        </div>
        <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#fff", marginBottom:3 }}>Chapter Exam</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>20 questions · 30 minutes · All 4 question types</div>
      </div>

      <div style={{ flex:1, padding:"20px 20px 100px", display:"flex", flexDirection:"column", gap:14 }}>

        <div style={{ fontSize:12, fontWeight:600, color:"#6B6560" }}>Select subject</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {subjects.map(s => (
            <motion.div key={s.id} whileTap={{ scale:0.97 }}
              onClick={() => { setSubject(s.id); setChapter(0); }}
              style={{ background: subject===s.id?"#0A2E28":"#fff", borderRadius:14, padding:14, border: subject===s.id?"2px solid #0A2E28":"0.5px solid rgba(0,0,0,0.06)", cursor:"pointer", textAlign:"center" }}>
              <div style={{ fontSize:13, fontWeight:600, color: subject===s.id?"#fff":"#1A1208" }}>{s.label}</div>
              <div style={{ fontSize:10, color: subject===s.id?"rgba(255,255,255,0.6)":"#A89880", marginTop:2 }}>{s.chapters} chapters</div>
            </motion.div>
          ))}
        </div>

        {selected && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:"#6B6560", marginBottom:10 }}>Select chapter</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {Array.from({ length: selected.chapters }, (_, i) => i+1).map(ch => (
                <motion.div key={ch} whileTap={{ scale:0.98 }}
                  onClick={() => setChapter(ch)}
                  style={{ background: chapter===ch?"linear-gradient(135deg,#E1F5EE,#DCFCE7)":"#fff", borderRadius:14, padding:"12px 16px", border: chapter===ch?"1.5px solid rgba(14,102,85,0.3)":"0.5px solid rgba(0,0,0,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
                  <div style={{ fontSize:13, fontWeight: chapter===ch?600:400, color: chapter===ch?"#085041":"#1A1208" }}>
                    Chapter {ch}
                  </div>
                  {chapter===ch && <div style={{ fontSize:12, color:"#0E6655", fontWeight:700 }}>Selected ✓</div>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {subject && chapter > 0 && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            style={{ background:"linear-gradient(135deg,#0A2E28,#0A4A3C)", borderRadius:16, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginBottom:4 }}>Ready to start</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginBottom:12 }}>
              {selected?.label} · Chapter {chapter} · 20 questions · 30 mins
            </div>
            <motion.button whileTap={{ scale:0.97 }} onClick={handleStart}
              style={{ width:"100%", padding:"14px", borderRadius:14, background:"#E67E22", color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor:"pointer" }}>
              Start Exam →
            </motion.button>
          </motion.div>
        )}

      </div>
    </div>
  );
}