"use client";
// SOMI Home Screen
// Reads course/level/group from localStorage
// Shows correct subjects dynamically for CA/CMA/CS

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getSubjects } from "@/lib/syllabus";

export default function Home() {
  const router = useRouter();
  const [name,     setName]     = useState("Student");
  const [course,   setCourse]   = useState("ca");
  const [level,    setLevel]    = useState("foundation");
  const [group,    setGroup]    = useState(0);
  const [attempt,  setAttempt]  = useState("Nov 2026");
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    const c = localStorage.getItem("somi_course")  || "ca";
    const l = localStorage.getItem("somi_level")   || "foundation";
    const g = parseInt(localStorage.getItem("somi_group") || "0");
    const a = localStorage.getItem("somi_attempt") || "Nov 2026";
    const n = localStorage.getItem("somi_name")    || "Student";
    setCourse(c); setLevel(l); setGroup(g);
    setAttempt(a); setName(n);
    setSubjects(getSubjects(c, l, g || 1));
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const levelDisplay = level.charAt(0).toUpperCase() + level.slice(1);
  const groupDisplay = group > 0 ? ` · Group ${group}` : "";

  return (
    <div className="app-shell">

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg, #0A2E28 0%, #0A4A3C 100%)", padding:"20px 24px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
          <span style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:700, color:"#fff" }}>SOMI</span>
          <motion.div whileTap={{ scale:0.9 }}
            onClick={() => router.push("/profile")}
            style={{ width:36, height:36, borderRadius:10, background:"#E67E22", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", border:"2px solid rgba(255,255,255,0.2)" }}>
            <span style={{ fontSize:14, fontWeight:700, color:"#fff", fontFamily:"Georgia,serif" }}>
              {name.charAt(0).toUpperCase()}
            </span>
          </motion.div>
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>
          {course.toUpperCase()} {levelDisplay}{groupDisplay} · {attempt}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:"20px 20px 100px", display:"flex", flexDirection:"column", gap:14 }}>

        {/* Greeting + streak */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          style={{ background:"linear-gradient(135deg,#0A2E28,#0A4A3C)", borderRadius:20, padding:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginBottom:4 }}>{getGreeting()}</div>
              <div style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:700, color:"#fff", marginBottom:12 }}>
                Hi {name} 👋
              </div>
            </div>
            {/* Streak */}
            <div style={{ background:"rgba(230,126,34,0.2)", borderRadius:12, padding:"8px 12px", textAlign:"center" }}>
              <div style={{ fontSize:20 }}>🔥</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#E67E22", fontFamily:"Georgia,serif" }}>1</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)" }}>day streak</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:5, marginBottom:6 }}>
            {["M","T","W","T","F","S","S"].map((_,i) => (
              <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<1?"#E67E22":"rgba(255,255,255,0.2)" }} />
            ))}
          </div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>Day 1 of 7 this week</div>
        </motion.div>

        {/* Mama card */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }}
          style={{ background:"linear-gradient(135deg,#FEF9C3,#FFEDD5)", borderRadius:20, padding:16, border:"0.5px solid rgba(230,126,34,0.15)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:"#E67E22", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid rgba(255,255,255,0.4)" }}>
              <span style={{ fontSize:10, fontWeight:700, color:"#fff" }}>MAMA</span>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#431407", marginBottom:2 }}>Ready to continue?</div>
              <div style={{ fontSize:11, color:"#9a3412", marginBottom:10 }}>
                {subjects[0]?.title || "Select a subject"} · Ch 1
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <motion.button whileTap={{ scale:0.97 }} onClick={() => router.push("/lesson")}
                  style={{ background:"rgba(10,46,40,0.1)", color:"#0A2E28", padding:"7px 14px", borderRadius:20, fontSize:12, fontWeight:600, border:"none", cursor:"pointer" }}>
                  Continue →
                </motion.button>
                <span style={{ fontSize:11, color:"#9a3412", fontWeight:500, cursor:"pointer" }}>Ask Mama</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Subjects label */}
        <div style={{ fontSize:12, fontWeight:600, color:"#6B6560" }}>
          Your subjects — {course.toUpperCase()} {levelDisplay}{groupDisplay}
        </div>

        {/* Dynamic subject grid */}
        {subjects.length === 0 ? (
          <div style={{ background:"#fff", borderRadius:16, padding:20, border:"0.5px solid rgba(0,0,0,0.06)", textAlign:"center" }}>
            <div style={{ fontSize:13, color:"#A89880", marginBottom:8 }}>No subjects found</div>
            <motion.button whileTap={{ scale:0.97 }} onClick={() => router.push("/onboarding")}
              style={{ background:"#0A2E28", color:"#fff", padding:"10px 20px", borderRadius:12, fontSize:12, fontWeight:600, border:"none", cursor:"pointer" }}>
              Set up your course →
            </motion.button>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns: subjects.length > 2 ? "1fr 1fr" : "1fr", gap:10 }}>
            {subjects.map((s: any, i: number) => (
              <motion.div key={s.id}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:0.1+i*0.06 }}
                whileTap={{ scale:0.97 }}
                onClick={() => router.push("/subject/"+s.id)}
                style={{ background:s.bg, borderRadius:18, padding:14, cursor:"pointer" }}>
                <div style={{ fontSize:11, color:s.color, opacity:0.7, marginBottom:2 }}>{s.code}</div>
                <div style={{ fontSize:12, fontWeight:600, color:s.color, marginBottom:4, lineHeight:1.3 }}>{s.title}</div>
                <div style={{ height:4, background:"rgba(255,255,255,0.5)", borderRadius:2, overflow:"hidden", marginBottom:4 }}>
                  <div style={{ width:"0%", height:"100%", background:s.color, borderRadius:2 }} />
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:s.color }}>0%</div>
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* Bottom nav */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#fff", borderTop:"0.5px solid rgba(0,0,0,0.06)", padding:"10px 20px 20px", display:"flex", justifyContent:"space-around", zIndex:100 }}>
        {[
          { label:"Home",     active:true,  path:"/home"      },
          { label:"Study",    active:false, path:"/subject/cma_f_law" },
          { label:"Exams",    active:false, path:"/exams"     },
          { label:"Progress", active:false, path:"/progress"  },
        ].map((item) => (
          <motion.div key={item.label} whileTap={{ scale:0.9 }}
            onClick={() => router.push(item.path)}
            style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
            <div style={{ width:20, height:20, borderRadius:6, background:item.active?"#0E6655":"#E5E0D8" }} />
            <div style={{ fontSize:10, fontWeight:item.active?700:400, color:item.active?"#0E6655":"#A89880" }}>{item.label}</div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}