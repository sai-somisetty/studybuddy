"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

function BottomNav({ active }: { active: string }) {
  const router = useRouter();
  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#fff", borderTop:"0.5px solid rgba(0,0,0,0.06)", padding:"10px 20px 20px", display:"flex", justifyContent:"space-around", zIndex:100 }}>
      {[
        { label:"Home",     path:"/home"     },
        { label:"Study",    path:"/subject/cma_f_law"},
        { label:"Exams",    path:"/exams"    },
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

const examTypes = [
  {
    id:"chapter",
    icon:"📝",
    title:"Chapter Exam",
    sub:"One chapter · 20 questions · 30 mins",
    desc:"Test everything from a single chapter. Best for concept-by-concept practice.",
    color:"#185FA5", bg:"#DBEAFE",
    path:"/exams/chapter",
  },
  {
    id:"combined",
    icon:"📚",
    title:"Combined Exam",
    sub:"3 chapters · 30 questions · 40 mins",
    desc:"Pick any 3 chapters. Mixed questions test your retention across topics.",
    color:"#3B6D11", bg:"#DCFCE7",
    path:"/exams/combined",
  },
  {
    id:"half",
    icon:"📋",
    title:"Half Portion",
    sub:"Half syllabus · 40 questions · 60 mins",
    desc:"5 unique papers per subject. Tests first or second half of syllabus.",
    color:"#854F0B", bg:"#FEF9C3",
    path:"/exams/half",
  },
  {
    id:"full",
    icon:"📄",
    title:"Full Portion",
    sub:"Full syllabus · 60 questions · 90 mins",
    desc:"10 unique papers. Closest to real CA/CMA exam. Use in final 4 weeks.",
    color:"#0A2E28", bg:"#E1F5EE",
    path:"/exams/full",
  },
  {
    id:"previous",
    icon:"🗂️",
    title:"Previous Papers",
    sub:"6 attempts · Chapter wise",
    desc:"May 2024, Nov 2023, May 2023... View chapter wise or take full timed paper.",
    color:"#E67E22", bg:"#FFF7ED",
    path:"/exams/previous",
  },
];

export default function ExamsHome() {
  const router = useRouter();
  return (
    <div className="app-shell">
      <div style={{ background:"#0A2E28", padding:"20px 24px" }}>
        <div style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:700, color:"#fff", marginBottom:4 }}>Exams</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>CA Foundation · Choose exam type</div>
      </div>

      <div style={{ flex:1, padding:"20px 20px 100px", display:"flex", flexDirection:"column", gap:12 }}>

        {/* Question levels info */}
        <div style={{ background:"linear-gradient(135deg,#0A2E28,#0A4A3C)", borderRadius:16, padding:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#fff", marginBottom:8 }}>Every exam has 4 question types</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {[
              { icon:"📄", label:"Previous Papers",    color:"#E67E22" },
              { icon:"📖", label:"Textbook Exact",      color:"#2ECC9E" },
              { icon:"🔄", label:"Tweaked Questions",   color:"#D4A017" },
              { icon:"🤖", label:"AI Generated",        color:"#A89880" },
            ].map((t) => (
              <div key={t.label} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:14 }}>{t.icon}</span>
                <span style={{ fontSize:12, color:t.color, fontWeight:500 }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize:12, fontWeight:600, color:"#6B6560" }}>Choose exam type</div>

        {examTypes.map((e, i) => (
          <motion.div key={e.id}
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:i*0.06 }}
            whileTap={{ scale:0.98 }}
            onClick={() => router.push(e.path)}
            style={{ background:"#fff", borderRadius:18, padding:16, border:"0.5px solid rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}>
            <div style={{ width:48, height:48, borderRadius:14, background:e.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
              {e.icon}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:e.color, marginBottom:2 }}>{e.title}</div>
              <div style={{ fontSize:11, color:"#A89880", marginBottom:4 }}>{e.sub}</div>
              <div style={{ fontSize:11, color:"#6B6560", lineHeight:1.4 }}>{e.desc}</div>
            </div>
            <div style={{ fontSize:16, color:"#A89880", flexShrink:0 }}>→</div>
          </motion.div>
        ))}

      </div>
      <BottomNav active="Exams" />
    </div>
  );
}