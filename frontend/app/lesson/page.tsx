"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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

export default function Lesson() {
  const router = useRouter();
  return (
    <div className="app-shell">
      <div style={{ background:"#0A2E28", padding:"18px 24px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <button onClick={() => router.back()}
            style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
            ← Back
          </button>
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Ch 1 · AS-1</span>
        </div>
        <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#fff", marginBottom:3 }}>Going Concern</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>Accounting Standards · Page 12</div>
        <div style={{ height:4, background:"rgba(255,255,255,0.15)", borderRadius:2, overflow:"hidden" }}>
          <div style={{ width:"35%", height:"100%", background:"#E67E22", borderRadius:2 }} />
        </div>
        <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", marginTop:4 }}>2 of 6 concepts</div>
      </div>

      <div style={{ flex:1, padding:"16px 20px 160px", display:"flex", flexDirection:"column", gap:12 }}>
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          style={{ background:"#fff", borderRadius:16, padding:16, border:"0.5px solid #E1F5EE" }}>
          <div style={{ background:"#E1F5EE", color:"#085041", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, display:"inline-block", marginBottom:8 }}>ICAI Definition</div>
          <div style={{ fontSize:13, fontWeight:500, color:"#1A1208", lineHeight:1.6 }}>The enterprise is viewed as a going concern — it will continue in operation for the foreseeable future.</div>
          <div style={{ fontSize:10, color:"#A89880", marginTop:8 }}>Chapter 1 · Page 12 · Para 3.1</div>
        </motion.div>

        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          style={{ background:"linear-gradient(135deg,#FFF7ED,#FFEDD5)", borderRadius:16, padding:14, border:"0.5px solid rgba(230,126,34,0.15)" }}>
          <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
            <div style={{ width:32, height:32, borderRadius:10, background:"#E67E22", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:9, fontWeight:700, color:"#fff" }}>K</span>
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:"#9a3412", marginBottom:3 }}>Kitty asks</div>
              <div style={{ fontSize:12, color:"#431407", lineHeight:1.5 }}>"Mama — Going Concern ante business ki chala concerns untaaya?"</div>
              <div style={{ fontSize:10, color:"#9a3412", marginTop:4, fontStyle:"italic" }}>Does Going Concern mean the business has many worries?</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18 }}
          style={{ background:"linear-gradient(135deg,#F0FDF4,#DCFCE7)", borderRadius:16, padding:14, border:"0.5px solid rgba(22,101,52,0.15)" }}>
          <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
            <div style={{ width:32, height:32, borderRadius:10, background:"#0A2E28", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:9, fontWeight:700, color:"#fff" }}>M</span>
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:"#14532d", marginBottom:3 }}>Mama explains</div>
              <div style={{ fontSize:12, color:"#14532d", lineHeight:1.6 }}>"Kitty — Appa flour mill chuso. Machine ni ₹5 lakhs cost price lo record chestadu. Endukante mill continue avutundi. Aa assumption = Going Concern!"</div>
              <div style={{ fontSize:10, color:"#16a34a", marginTop:4, fontStyle:"italic" }}>Assets at cost — not liquidation value.</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.24 }}
          style={{ background:"#0A2E28", borderRadius:16, padding:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginBottom:2 }}>Test yourself</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>3 questions · 2 mins</div>
          </div>
          <motion.button whileTap={{ scale:0.97 }} onClick={() => router.push("/quiz")}
            style={{ background:"#E67E22", color:"#fff", padding:"8px 16px", borderRadius:12, fontSize:12, fontWeight:600, border:"none", cursor:"pointer" }}>
            Start Quiz →
          </motion.button>
        </motion.div>
      </div>

      {/* Ask Mama input — sits above bottom nav */}
      <div style={{ position:"fixed", bottom:68, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, padding:"10px 20px", background:"#fff", borderTop:"0.5px solid rgba(0,0,0,0.06)", zIndex:99 }}>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <input placeholder="Ask Mama anything..."
            style={{ flex:1, padding:"12px 16px", borderRadius:50, border:"0.5px solid #C8C0B4", background:"#FAFAF8", fontSize:13, color:"#1A1208", outline:"none" }} />
          <div style={{ width:40, height:40, borderRadius:"50%", background:"#0A2E28", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
            <span style={{ color:"#fff", fontSize:14 }}>→</span>
          </div>
        </div>
      </div>

      <BottomNav active="Study" />
    </div>
  );
}