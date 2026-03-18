"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

const attempts = [
  { name:"May 2024",  year:2024, month:"May",  questions:40 },
  { name:"Nov 2023",  year:2023, month:"Nov",  questions:40 },
  { name:"May 2023",  year:2023, month:"May",  questions:40 },
  { name:"Nov 2022",  year:2022, month:"Nov",  questions:40 },
  { name:"May 2022",  year:2022, month:"May",  questions:40 },
  { name:"Nov 2021",  year:2021, month:"Nov",  questions:40 },
];

const subjects = ["Accounting","Law","Maths","Economics"];

export default function PreviousPapers() {
  const router  = useRouter();
  const [subject,  setSubject]  = useState("Accounting");
  const [selected, setSelected] = useState("");
  const [mode,     setMode]     = useState<""|"chapter"|"full">("");

  return (
    <div className="app-shell">
      <div style={{ background:"#0A2E28", padding:"18px 24px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <button onClick={() => router.back()}
            style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
            ← Back
          </button>
        </div>
        <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#fff", marginBottom:3 }}>Previous Papers</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>6 attempts · Chapter wise or full paper</div>
      </div>

      <div style={{ flex:1, padding:"16px 20px 100px", display:"flex", flexDirection:"column", gap:12 }}>

        {/* Subject selector */}
        <div style={{ fontSize:12, fontWeight:600, color:"#6B6560" }}>Subject</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {subjects.map(s => (
            <motion.div key={s} whileTap={{ scale:0.97 }}
              onClick={() => setSubject(s)}
              style={{ padding:"8px 16px", borderRadius:20, background: subject===s?"#0A2E28":"#fff", border: subject===s?"none":"0.5px solid rgba(0,0,0,0.1)", cursor:"pointer" }}>
              <div style={{ fontSize:12, fontWeight:600, color: subject===s?"#fff":"#1A1208" }}>{s}</div>
            </motion.div>
          ))}
        </div>

        {/* Attempts list */}
        <div style={{ fontSize:12, fontWeight:600, color:"#6B6560" }}>Select attempt</div>
        {attempts.map((a, i) => (
          <motion.div key={a.name}
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:i*0.05 }}
            onClick={() => { setSelected(a.name); setMode(""); }}
            style={{ background:"#fff", borderRadius:16, padding:16, border: selected===a.name?"1.5px solid rgba(230,126,34,0.3)":"0.5px solid rgba(0,0,0,0.06)", cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: selected===a.name?12:0 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:"#1A1208" }}>{a.name}</div>
                <div style={{ fontSize:11, color:"#A89880", marginTop:2 }}>{a.questions} questions · {subject}</div>
              </div>
              <div style={{ fontSize:12, color: selected===a.name?"#E67E22":"#A89880", fontWeight:600 }}>
                {selected===a.name ? "Selected ✓" : "→"}
              </div>
            </div>

            {selected===a.name && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{ display:"flex", gap:10 }}>
                <motion.button whileTap={{ scale:0.97 }}
                  onClick={(e) => { e.stopPropagation(); setMode("chapter"); }}
                  style={{ flex:1, padding:"10px", borderRadius:12, background: mode==="chapter"?"#0A2E28":"#E1F5EE", color: mode==="chapter"?"#fff":"#0A2E28", fontSize:12, fontWeight:600, border:"none", cursor:"pointer" }}>
                  📖 Chapter Wise
                </motion.button>
                <motion.button whileTap={{ scale:0.97 }}
                  onClick={(e) => { e.stopPropagation(); setMode("full"); }}
                  style={{ flex:1, padding:"10px", borderRadius:12, background: mode==="full"?"#0A2E28":"#E1F5EE", color: mode==="full"?"#fff":"#0A2E28", fontSize:12, fontWeight:600, border:"none", cursor:"pointer" }}>
                  ⏱️ Full Paper
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        ))}

        {selected && mode && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            style={{ background:"linear-gradient(135deg,#0A2E28,#0A4A3C)", borderRadius:16, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginBottom:4 }}>
              {selected} · {subject}
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginBottom:12 }}>
              {mode==="full" ? "40 questions · 60 mins timed · Real exam simulation" : "Browse chapter wise · Practice specific chapters"}
            </div>
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => {
                if (mode==="full") {
                  router.push(`/exams/take?type=previous&subject=${subject}&attempt=${selected}&paper=1`);
                } else {
                  router.push(`/exams/previous/${encodeURIComponent(selected)}?subject=${subject}`);
                }
              }}
              style={{ width:"100%", padding:"14px", borderRadius:14, background:"#E67E22", color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor:"pointer" }}>
              {mode==="full" ? "Start Timed Paper →" : "View Chapter Wise →"}
            </motion.button>
          </motion.div>
        )}

      </div>
    </div>
  );
}