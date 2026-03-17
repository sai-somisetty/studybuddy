"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const chapters = [
  { id:1, title:"Introduction to Accounting",  concepts:6, progress:100, status:"done"   },
  { id:2, title:"Theory Base of Accounting",   concepts:8, progress:62,  status:"active" },
  { id:3, title:"Accounting Procedures",       concepts:7, progress:0,   status:"locked" },
  { id:4, title:"Bank Reconciliation",         concepts:5, progress:0,   status:"locked" },
  { id:5, title:"Depreciation",               concepts:6, progress:0,   status:"locked" },
  { id:6, title:"Bills of Exchange",           concepts:5, progress:0,   status:"locked" },
  { id:7, title:"Financial Statements",        concepts:8, progress:0,   status:"locked" },
  { id:8, title:"Partnership Accounts",        concepts:7, progress:0,   status:"locked" },
];

function BottomNav({ active }: { active: string }) {
  const router = useRouter();
  const items = [
    { label:"Home",     path:"/home"     },
    { label:"Study",    path:"/lesson"   },
    { label:"Quiz",     path:"/quiz"     },
    { label:"Progress", path:"/progress" },
  ];
  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#fff", borderTop:"0.5px solid rgba(0,0,0,0.06)", padding:"10px 20px 20px", display:"flex", justifyContent:"space-around", zIndex:100 }}>
      {items.map((item) => (
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

export default function Subject() {
  const router = useRouter();
  return (
    <div className="app-shell">
      <div style={{ background:"#0A2E28", padding:"18px 24px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <button onClick={() => router.back()}
            style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
            ← Back
          </button>
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>CA Foundation</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📊</div>
          <div>
            <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#fff" }}>Accounting</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>8 chapters · 48 concepts</div>
          </div>
        </div>
        <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"10px 12px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>Overall progress</span>
            <span style={{ fontSize:10, fontWeight:700, color:"#E67E22" }}>68%</span>
          </div>
          <div style={{ height:5, background:"rgba(255,255,255,0.15)", borderRadius:3, overflow:"hidden" }}>
            <div style={{ width:"68%", height:"100%", background:"#E67E22", borderRadius:3 }} />
          </div>
        </div>
      </div>

      <div style={{ flex:1, padding:"16px 20px 100px", display:"flex", flexDirection:"column", gap:10, overflowY:"auto" }}>
        <div style={{ fontSize:12, fontWeight:600, color:"#6B6560", marginBottom:2 }}>All Chapters</div>
        {chapters.map((ch,i) => (
          <motion.div key={ch.id}
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:i*0.05 }}
            whileTap={{ scale:0.98 }}
            onClick={() => router.push("/chapter/" + ch.id)}
            style={{ background:"#fff", borderRadius:16, padding:"14px 16px",
              border: ch.status==="active" ? "1.5px solid rgba(230,126,34,0.3)" : "0.5px solid rgba(0,0,0,0.06)",
              display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
            <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14,
              background: ch.status==="done"?"#E1F5EE":ch.status==="active"?"#FFF7ED":"#F5F0E8",
              color: ch.status==="done"?"#0E6655":ch.status==="active"?"#E67E22":"#A89880" }}>
              {ch.id}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#1A1208", marginBottom:2 }}>{ch.title}</div>
              <div style={{ fontSize:10, color:"#A89880", marginBottom:6 }}>
                {ch.concepts} concepts · {ch.status==="done"?"Completed":ch.status==="active"?"In progress":"Not started"}
              </div>
              <div style={{ height:3, background:"rgba(0,0,0,0.06)", borderRadius:2, overflow:"hidden" }}>
                <div style={{ width:ch.progress+"%", height:"100%", borderRadius:2, background:ch.status==="done"?"#0E6655":"#E67E22" }} />
              </div>
            </div>
            <div style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
              <span style={{ fontSize:11, fontWeight:700, color:ch.status==="done"?"#0E6655":ch.status==="active"?"#E67E22":"#A89880" }}>{ch.progress}%</span>
              {ch.status==="done"&&<div style={{ width:18, height:18, borderRadius:"50%", background:"#0E6655", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff" }}>✓</div>}
              {ch.status==="active"&&<div style={{ background:"#E67E22", color:"#fff", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>Go</div>}
            </div>
          </motion.div>
        ))}
      </div>

      <BottomNav active="Study" />
    </div>
  );
}