"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const concepts = [
  { id:1, title:"Meaning and Scope",     page:8,  status:"done",   quiz:90 },
  { id:2, title:"Accounting Standards",  page:10, status:"done",   quiz:85 },
  { id:3, title:"Going Concern",         page:12, status:"active", quiz:null },
  { id:4, title:"Accrual Concept",       page:15, status:"locked", quiz:null },
  { id:5, title:"Consistency Concept",   page:18, status:"locked", quiz:null },
  { id:6, title:"Prudence Concept",      page:22, status:"locked", quiz:null },
  { id:7, title:"Materiality Concept",   page:26, status:"locked", quiz:null },
  { id:8, title:"Dual Aspect Concept",   page:30, status:"locked", quiz:null },
];

function BottomNav({ active }: { active:string }) {
  const router = useRouter();
  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#fff", borderTop:"0.5px solid rgba(0,0,0,0.06)", padding:"10px 20px 20px", display:"flex", justifyContent:"space-around", zIndex:100 }}>
      {[
        { label:"Home",     path:"/home"     },
        { label:"Study",    path:"/subject/1"},
        { label:"Exams",     path:"/exams"     },
        { label:"Progress", path:"/progress" },
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

export default function Chapter() {
  const router = useRouter();
  return (
    <div className="app-shell">

      {/* Header */}
      <div style={{ background:"#0A2E28", padding:"18px 24px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <button onClick={() => router.back()}
            style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
            ← Back
          </button>
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Chapter 2</span>
        </div>
        <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#fff", marginBottom:3 }}>
          Theory Base of Accounting
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>
          8 concepts · 2 done · 6 remaining
        </div>
        <div style={{ height:5, background:"rgba(255,255,255,0.15)", borderRadius:3, overflow:"hidden" }}>
          <div style={{ width:"25%", height:"100%", background:"#E67E22", borderRadius:3 }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>25% complete</span>
          <span style={{ fontSize:9, color:"#E67E22", fontWeight:600 }}>In progress</span>
        </div>
      </div>

      {/* Concepts list */}
      <div style={{ flex:1, padding:"16px 20px 160px", display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ fontSize:12, fontWeight:600, color:"#6B6560", marginBottom:4 }}>All Concepts</div>

        {concepts.map((c,i) => {
          const isDone   = c.status === "done";
          const isActive = c.status === "active";
          const isLocked = c.status === "locked";
          return (
            <motion.div key={c.id}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:i*0.05 }}
              whileTap={!isLocked ? { scale:0.98 } : {}}
              onClick={() => !isLocked && router.push("/lesson")}
              style={{
                borderRadius:14, padding:"13px 14px",
                display:"flex", alignItems:"center", gap:12,
                cursor: isLocked?"default":"pointer",
                background: isDone?"#E1F5EE": isActive?"linear-gradient(135deg,#FFF7ED,#FFEDD5)":"#fff",
                border: isDone?"0.5px solid rgba(14,102,85,0.15)": isActive?"1.5px solid rgba(230,126,34,0.3)":"0.5px solid rgba(0,0,0,0.06)",
              }}>

              {/* Status dot */}
              <div style={{ width:10, height:10, borderRadius:"50%", flexShrink:0,
                background: isDone?"#0E6655": isActive?"#E67E22":"#E5E0D8" }} />

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:1,
                  color: isDone?"#085041": isActive?"#431407":"#1A1208" }}>
                  {i+1}. {c.title}
                </div>
                <div style={{ fontSize:10,
                  color: isDone?"#0E6655": isActive?"#9a3412":"#A89880" }}>
                  {isDone
                    ? `Completed · Quiz: ${c.quiz}%`
                    : isActive
                    ? `In progress · Page ${c.page}`
                    : `Not started · Page ${c.page}`}
                </div>
              </div>

              {/* Right badge */}
              {isDone   && <div style={{ width:20, height:20, borderRadius:"50%", background:"#0E6655", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff", flexShrink:0 }}>✓</div>}
              {isActive && <div style={{ background:"#E67E22", color:"#fff", fontSize:10, fontWeight:700, padding:"4px 12px", borderRadius:20, flexShrink:0 }}>Go →</div>}
              {isLocked && <div style={{ fontSize:14, color:"#E5E0D8", flexShrink:0 }}>🔒</div>}

            </motion.div>
          );
        })}

        {/* Chapter quiz CTA */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
          style={{ background:"#0A2E28", borderRadius:16, padding:14, display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginBottom:2 }}>Chapter Quiz</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>Test all 8 concepts · 15 mins</div>
          </div>
          <motion.button whileTap={{ scale:0.97 }} onClick={() => router.push("/quiz")}
            style={{ background:"#E67E22", color:"#fff", padding:"8px 16px", borderRadius:12, fontSize:12, fontWeight:600, border:"none", cursor:"pointer" }}>
            Start →
          </motion.button>
        </motion.div>

      </div>

      <BottomNav active="Study" />
    </div>
  );
}