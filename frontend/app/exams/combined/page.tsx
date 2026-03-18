"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

const subjectChapters: Record<string, number> = {
  Accounting: 8, Law: 6, Maths: 7, Economics: 5
};

export default function CombinedExam() {
  const router   = useRouter();
  const [subject,  setSubject]  = useState("Accounting");
  const [selected, setSelected] = useState<number[]>([]);

  const chapters = subjectChapters[subject] || 8;

  const toggle = (ch: number) => {
    setSelected(prev =>
      prev.includes(ch)
        ? prev.filter(c => c !== ch)
        : prev.length < 3 ? [...prev, ch] : prev
    );
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
        <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#fff", marginBottom:3 }}>Combined Exam</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>Select any 3 chapters · 30 questions · 40 mins</div>
      </div>

      <div style={{ flex:1, padding:"16px 20px 100px", display:"flex", flexDirection:"column", gap:14 }}>

        {/* Subject */}
        <div style={{ fontSize:12, fontWeight:600, color:"#6B6560" }}>Subject</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {Object.keys(subjectChapters).map(s => (
            <motion.div key={s} whileTap={{ scale:0.97 }}
              onClick={() => { setSubject(s); setSelected([]); }}
              style={{ padding:"8px 16px", borderRadius:20, background: subject===s?"#0A2E28":"#fff", border: subject===s?"none":"0.5px solid rgba(0,0,0,0.1)", cursor:"pointer" }}>
              <div style={{ fontSize:12, fontWeight:600, color: subject===s?"#fff":"#1A1208" }}>{s}</div>
            </motion.div>
          ))}
        </div>

        {/* Chapter selection */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:12, fontWeight:600, color:"#6B6560" }}>Select chapters</div>
          <div style={{ fontSize:11, color: selected.length===3?"#0E6655":"#A89880", fontWeight:600 }}>
            {selected.length}/3 selected
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {Array.from({ length: chapters }, (_, i) => i+1).map(ch => {
            const isSelected = selected.includes(ch);
            const disabled   = !isSelected && selected.length >= 3;
            return (
              <motion.div key={ch} whileTap={!disabled ? { scale:0.97 } : {}}
                onClick={() => !disabled && toggle(ch)}
                style={{ background: isSelected?"#0A2E28": disabled?"#FAFAF8":"#fff", borderRadius:14, padding:14, border: isSelected?"2px solid #0A2E28":"0.5px solid rgba(0,0,0,0.06)", cursor: disabled?"not-allowed":"pointer", textAlign:"center", opacity: disabled?0.5:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color: isSelected?"#fff":disabled?"#A89880":"#1A1208" }}>
                  Chapter {ch}
                </div>
                {isSelected && <div style={{ fontSize:10, color:"rgba(255,255,255,0.7)", marginTop:2 }}>✓ Selected</div>}
              </motion.div>
            );
          })}
        </div>

        {selected.length === 3 && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            style={{ background:"linear-gradient(135deg,#0A2E28,#0A4A3C)", borderRadius:16, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginBottom:4 }}>Ready to start</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginBottom:12 }}>
              {subject} · Chapters {selected.sort().join(", ")} · 30 questions · 40 mins
            </div>
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => router.push(`/exams/take?type=combined&subject=${subject}&chapters=${selected.join(",")}&paper=1`)}
              style={{ width:"100%", padding:"14px", borderRadius:14, background:"#E67E22", color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor:"pointer" }}>
              Start Combined Exam →
            </motion.button>
          </motion.div>
        )}

      </div>
    </div>
  );
}