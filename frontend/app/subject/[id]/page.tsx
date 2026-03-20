"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState, Suspense } from "react";
import { getSubjects } from "@/lib/syllabus";

const chapterNameMap: Record<string, Record<number, string>> = {
  cma_f_law:   {1:"Indian Contract Act 1872",2:"Sale of Goods Act 1930",3:"Negotiable Instruments Act",4:"Partnership Act 1932",5:"Companies Act 2013",6:"Business Communication",7:"Consumer Protection Act",8:"IT Act"},
  cma_f_acc:   {1:"Fundamentals of Accounting",2:"Journal, Ledger & Trial Balance",3:"Bank Reconciliation",4:"Depreciation",5:"Bills of Exchange",6:"Final Accounts",7:"Cost Accounting",8:"Marginal Costing",9:"Budgeting"},
  cma_f_maths: {1:"Ratio, Proportion & Indices",2:"Equations & Matrices",3:"Differentiation",4:"Integration",5:"Central Tendency",6:"Dispersion",7:"Probability",8:"Correlation & Regression"},
  cma_f_eco:   {1:"Introduction to Economics",2:"Theory of Demand",3:"Theory of Supply",4:"Theory of Production",5:"Cost Analysis",6:"Market Structures",7:"National Income"},
  ca_f_acc:    {1:"Introduction & Accounting Standards",2:"Journal, Ledger & Trial Balance",3:"Bank Reconciliation",4:"Depreciation AS10",5:"Bills of Exchange",6:"Final Accounts",7:"Partnership Accounts",8:"Company Accounts"},
  ca_f_law:    {1:"Indian Contract Act",2:"Sale of Goods Act",3:"Negotiable Instruments",4:"Partnership Act",5:"LLP Act",6:"Companies Act"},
  ca_f_maths:  {1:"Ratio & Proportion",2:"Indices & Logarithms",3:"Simple & Compound Interest",4:"Permutations & Combinations",5:"Sets & Functions",6:"Limits & Continuity",7:"Differential Calculus"},
  ca_f_eco:    {1:"Introduction to Economics",2:"Demand & Supply",3:"Production & Cost",4:"Market Structures",5:"National Income"},
};

function BottomNav({ active }: { active: string }) {
  const router = useRouter();
  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#fff", borderTop:"0.5px solid rgba(0,0,0,0.06)", padding:"10px 20px 20px", display:"flex", justifyContent:"space-around", zIndex:100 }}>
      {[
        { label:"Home",     path:"/home"      },
        { label:"Study",    path:"/subject/cma_f_law" },
        { label:"Exams",    path:"/exams"     },
        { label:"Progress", path:"/progress"  },
      ].map(item => (
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

function SubjectContent({ pageId }: { pageId: string }) {
  const router = useRouter();
  const [subject, setSubject] = useState<any>(null);

  useEffect(() => {
    const c = localStorage.getItem("somi_course")  || "cma";
    const l = localStorage.getItem("somi_level")   || "foundation";
    const g = parseInt(localStorage.getItem("somi_group") || "0");
    const subjects = getSubjects(c, l, g || 1);

    // Find by exact id match first, then by index
    const found = subjects.find((s: any) => s.id === pageId)
                || subjects.find((s: any) => s.id === pageId.replace(/-/g,"_"))
                || subjects[parseInt(pageId) - 1]
                || subjects[0];
    setSubject(found);
  }, [pageId]);

  if (!subject) return (
    <div className="app-shell" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:"#0A2E28", fontSize:16 }}>Loading...</div>
    </div>
  );

  const subjectKey = (subject.id || pageId).replace(/-/g, "_");
  const chapters   = Array.from({ length: subject.chapters || 8 }, (_, i) => ({
    number:   i + 1,
    title:    chapterNameMap[subjectKey]?.[i+1] || `Chapter ${i+1}`,
    progress: 0,
  }));

  return (
    <div className="app-shell">
      {/* Header */}
      <div style={{ background:"#0A2E28", padding:"18px 24px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <button onClick={() => router.back()}
            style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
            ← Back
          </button>
        </div>
        <div style={{ fontSize:22, marginBottom:4 }}>{subject.icon}</div>
        <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#fff", marginBottom:2 }}>{subject.title}</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>{subject.code} · {subject.chapters} chapters</div>
        <div style={{ marginTop:10, height:3, background:"rgba(255,255,255,0.15)", borderRadius:2 }}>
          <div style={{ width:"0%", height:"100%", background:"#E67E22", borderRadius:2 }} />
        </div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:4 }}>0% complete</div>
      </div>

      {/* Chapter list */}
      <div style={{ flex:1, padding:"16px 20px 100px", display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ fontSize:12, fontWeight:600, color:"#6B6560" }}>All Chapters</div>

        {chapters.map((ch, i) => (
          <motion.div key={ch.number}
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:i*0.04 }}
            whileTap={{ scale:0.98 }}
            onClick={() => router.push(
              `/chapter/${subject.id}?chapter=${ch.number}&subject=${encodeURIComponent(subject.title)}&subjectId=${subject.id}`
            )}
            style={{ background:"#fff", borderRadius:16, padding:"14px 16px", border:"0.5px solid rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}>
            <div style={{ width:36, height:36, borderRadius:10,
              background: ch.progress===100?"#E1F5EE": i===0?"#FFF7ED":"#F5F0E8",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:13, fontWeight:700,
                color: ch.progress===100?"#0E6655": i===0?"#E67E22":"#A89880" }}>
                {ch.progress===100 ? "✓" : ch.number}
              </span>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#1A1208", marginBottom:2 }}>
                Ch {ch.number} — {ch.title}
              </div>
              <div style={{ fontSize:11, color:"#A89880" }}>
                {ch.progress > 0 ? `${ch.progress}% complete` : "Not started"}
              </div>
              {ch.progress > 0 && (
                <div style={{ height:2, background:"#E5E0D8", borderRadius:1, marginTop:4, overflow:"hidden" }}>
                  <div style={{ width:`${ch.progress}%`, height:"100%", background:"#0E6655", borderRadius:1 }} />
                </div>
              )}
            </div>
            <div style={{ fontSize:12, color:"#A89880" }}>→</div>
          </motion.div>
        ))}
      </div>

      <BottomNav active="Study" />
    </div>
  );
}

export default function SubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense fallback={
      <div className="app-shell" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:"#0A2E28", fontSize:16 }}>Loading...</div>
      </div>
    }>
      <SubjectContent pageId={id} />
    </Suspense>
  );
}