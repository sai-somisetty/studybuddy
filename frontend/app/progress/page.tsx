"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const stats = [
  { val:"68%", label:"Overall",    color:"#071739" },
  { val:"7",   label:"Day streak", color:"#E3C39D" },
  { val:"142", label:"Questions",  color:"#071739" },
  { val:"78%", label:"Accuracy",   color:"#D4A017" },
];
const subjects = [
  { title:"Accounting", progress:72, color:"#071739" },
  { title:"Law",        progress:45, color:"#D4A017" },
  { title:"Maths",      progress:28, color:"#E3C39D" },
];

export default function Progress() {
  const router = useRouter();
  return (
    <div className="app-shell">
      <div style={{ background:"#071739", padding:"20px 24px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:700, color:"#fff" }}>Progress</span>
          <div style={{ background:"rgba(14,102,85,0.3)", color:"#2ECC9E", fontSize:10, fontWeight:700, padding:"4px 12px", borderRadius:20 }}>On track</div>
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:4 }}>CA Foundation · Nov 2026</div>
      </div>
      <div style={{ flex:1, padding:"20px 20px 100px", display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {stats.map((s,i) => (
            <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
              style={{ background:"#fff", borderRadius:16, padding:16, border:"0.5px solid rgba(0,0,0,0.06)", textAlign:"center" }}>
              <div style={{ fontFamily:"Georgia,serif", fontSize:24, fontWeight:700, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:10, color:"#A4B5C4", marginTop:2 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
        <div style={{ fontSize:12, fontWeight:600, color:"#4B6382" }}>Subjects</div>
        {subjects.map((s,i) => (
          <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1+i*0.06 }}
            style={{ background:"#fff", borderRadius:16, padding:14, border:"0.5px solid rgba(0,0,0,0.06)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:13, fontWeight:500, color:"#071739" }}>{s.title}</span>
              <span style={{ fontSize:12, fontWeight:700, color:s.color }}>{s.progress}%</span>
            </div>
            <div style={{ height:5, background:"rgba(0,0,0,0.06)", borderRadius:3, overflow:"hidden" }}>
              <div style={{ width:s.progress+"%", height:"100%", background:s.color, borderRadius:3 }} />
            </div>
          </motion.div>
        ))}
        <div style={{ fontSize:12, fontWeight:600, color:"#4B6382" }}>Needs attention</div>
        <div style={{ background:"#fff", borderRadius:16, padding:14, border:"0.5px solid rgba(220,38,38,0.2)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#071739", marginBottom:2 }}>Depreciation — AS 10</div>
              <div style={{ fontSize:10, color:"#A4B5C4" }}>Quiz accuracy: 42%</div>
            </div>
            <motion.button whileTap={{ scale:0.97 }} onClick={() => router.push("/lesson")}
              style={{ background:"rgba(14,102,85,0.08)", color:"#071739", padding:"6px 12px", borderRadius:20, fontSize:11, fontWeight:600, border:"none", cursor:"pointer" }}>
              Study →
            </motion.button>
          </div>
        </div>
        <div style={{ background:"#071739", borderRadius:16, padding:14, display:"flex", gap:10, alignItems:"flex-start" }}>
          <div style={{ width:32, height:32, borderRadius:10, background:"rgba(255,255,255,0.1)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:9, fontWeight:700, color:"#fff" }}>M</span>
          </div>
          <div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginBottom:3 }}>Mama says</div>
            <div style={{ fontSize:12, color:"#fff", lineHeight:1.6 }}>"Depreciation chapter concentrate cheyyi. Strong ayite accounting lo 80% complete."</div>
          </div>
        </div>
      </div>
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#fff", borderTop:"0.5px solid rgba(0,0,0,0.06)", padding:"10px 20px 20px", display:"flex", justifyContent:"space-around" }}>
        {[
          { label:"Home",     active:false, path:"/home"     },
          { label:"Study",    active:false, path:"/lesson"   },
          { label:"Exams",    active:false, path:"/exams"     },
          { label:"Progress", active:true,  path:"/progress" },
        ].map((item) => (
          <motion.div key={item.label} whileTap={{ scale:0.9 }}
            onClick={() => router.push(item.path)}
            style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
            <div style={{ width:20, height:20, borderRadius:6, background:item.active?"#071739":"rgba(7,23,57,0.08)" }} />
            <div style={{ fontSize:10, fontWeight:item.active?700:400, color:item.active?"#071739":"#A4B5C4" }}>{item.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}