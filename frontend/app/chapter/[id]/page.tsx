"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const chapterNames: Record<string, Record<number, string>> = {
  cma_f_law: {
    1:"Indian Contract Act 1872",
    2:"Sale of Goods Act 1930",
    3:"Negotiable Instruments Act 1881",
    4:"Partnership Act 1932",
    5:"Companies Act 2013 — Introduction",
    6:"Business Communication",
    7:"Consumer Protection Act",
    8:"Information Technology Act",
  },
  cma_f_acc: {
    1:"Fundamentals of Accounting",
    2:"Journal, Ledger and Trial Balance",
    3:"Bank Reconciliation Statement",
    4:"Depreciation Accounting",
    5:"Bills of Exchange",
    6:"Final Accounts",
    7:"Cost Accounting — Introduction",
    8:"Marginal Costing",
    9:"Budgeting",
  },
  cma_f_maths: {
    1:"Ratio, Proportion and Indices",
    2:"Equations and Matrices",
    3:"Calculus — Differentiation",
    4:"Calculus — Integration",
    5:"Measures of Central Tendency",
    6:"Measures of Dispersion",
    7:"Probability",
    8:"Correlation and Regression",
  },
  cma_f_eco: {
    1:"Introduction to Economics",
    2:"Theory of Demand",
    3:"Theory of Supply",
    4:"Theory of Production",
    5:"Cost Analysis",
    6:"Market Structures",
    7:"National Income",
  },
  ca_f_acc: {
    1:"Introduction and Accounting Standards",
    2:"Journal, Ledger and Trial Balance",
    3:"Bank Reconciliation Statement",
    4:"Depreciation — AS 10",
    5:"Bills of Exchange",
    6:"Final Accounts",
    7:"Partnership Accounts",
    8:"Company Accounts",
  },
  ca_f_law: {
    1:"Indian Contract Act 1872",
    2:"Sale of Goods Act 1930",
    3:"Negotiable Instruments Act",
    4:"Partnership Act 1932",
    5:"LLP Act 2008",
    6:"Companies Act 2013",
  },
  ca_f_maths: {
    1:"Ratio and Proportion",
    2:"Indices and Logarithms",
    3:"Simple and Compound Interest",
    4:"Permutations and Combinations",
    5:"Sets, Functions and Relations",
    6:"Limits and Continuity",
    7:"Differential Calculus",
  },
  ca_f_eco: {
    1:"Introduction to Economics",
    2:"Theory of Demand and Supply",
    3:"Theory of Production and Cost",
    4:"Market Structures",
    5:"National Income",
  },
};

const conceptMap: Record<string, Record<number, string[]>> = {
  cma_f_law: {
    1:["Definition of Contract","Offer and Acceptance","Consideration","Capacity to Contract","Free Consent","Void and Voidable Agreements","Quasi Contracts"],
    2:["Sale vs Agreement to Sell","Transfer of Property","Conditions and Warranties","Rights of Unpaid Seller","Rights of Buyer"],
    3:["Negotiable Instruments — Introduction","Promissory Note","Bill of Exchange","Cheque","Crossing of Cheque","Dishonour of Cheque"],
    4:["Definition of Partnership","Rights and Duties of Partners","Implied Authority","Dissolution of Partnership","Reconstitution of Firm"],
    5:["Types of Companies","Memorandum of Association","Articles of Association","Prospectus","Directors"],
    6:["Business Letters","Report Writing","Oral Communication","Non-Verbal Communication"],
    7:["Consumer Rights","District Forum","State Commission","National Commission"],
    8:["Digital Signatures","Electronic Contracts","Cyber Crimes","IT Amendments"],
  },
  cma_f_acc: {
    1:["Meaning and Scope of Accounting","Accounting Concepts","Accounting Conventions","Double Entry System","Accounting Standards"],
    2:["Journal Entries","Ledger Posting","Trial Balance","Errors and Rectification","Suspense Account"],
    3:["Need for BRS","Causes of Difference","Preparation of BRS","Adjusted Cash Book"],
    4:["Meaning of Depreciation","SLM Method","WDV Method","Change in Method","AS 10"],
    5:["Bills of Exchange — Introduction","Promissory Notes","Accommodation Bills","Retiring a Bill","Dishonour of Bill"],
    6:["Trading Account","Profit and Loss Account","Balance Sheet","Adjustments","Marshalling"],
    7:["Elements of Cost","Prime Cost","Factory Cost","Cost of Production","Cost Sheet"],
    8:["Marginal Cost","Contribution","P/V Ratio","Break Even Analysis","Margin of Safety"],
    9:["Meaning of Budget","Fixed and Flexible Budgets","Cash Budget","Sales Budget","Production Budget"],
  },
  cma_f_maths: {
    1:["Ratio","Proportion","Indices","Laws of Indices","Logarithms","Laws of Logarithms"],
    2:["Linear Equations","Quadratic Equations","Simultaneous Equations","Matrices","Determinants"],
    3:["Limits","Continuity","Differentiation","Rules of Differentiation","Applications of Differentiation"],
    4:["Integration — Introduction","Indefinite Integral","Definite Integral","Applications of Integration"],
    5:["Arithmetic Mean","Geometric Mean","Harmonic Mean","Median","Mode","Weighted Mean"],
    6:["Range","Quartile Deviation","Mean Deviation","Standard Deviation","Variance","Coefficient of Variation"],
    7:["Basic Concepts of Probability","Addition Theorem","Multiplication Theorem","Conditional Probability","Bayes Theorem"],
    8:["Correlation — Karl Pearson","Spearman Rank Correlation","Regression Lines","Regression Equations"],
  },
  cma_f_eco: {
    1:["Meaning of Economics","Micro vs Macro Economics","Basic Economic Problems","Economic Systems"],
    2:["Law of Demand","Demand Curve","Elasticity of Demand","Demand Forecasting","Determinants of Demand"],
    3:["Law of Supply","Supply Curve","Elasticity of Supply","Market Equilibrium","Price Mechanism"],
    4:["Production Function","Law of Variable Proportions","Returns to Scale","Isoquants","Producer Equilibrium"],
    5:["Short Run Costs","Long Run Costs","Cost Curves","Revenue Concepts","Profit Maximisation"],
    6:["Perfect Competition","Monopoly","Monopolistic Competition","Oligopoly","Price Discrimination"],
    7:["National Income — Definition","GDP and GNP","NNP and NI","Methods of Measurement","Limitations"],
  },
  ca_f_acc: {
    1:["Meaning of Accounting","Going Concern","Accrual Concept","Consistency","Accounting Standards"],
    2:["Journal Entries","Ledger","Trial Balance","Errors","Suspense Account"],
    3:["Bank Reconciliation Statement","Causes of Difference","Preparation"],
    4:["Depreciation — AS 10","SLM","WDV","Comparison of Methods"],
    5:["Bills of Exchange","Promissory Notes","Accommodation Bills"],
    6:["Trading Account","Profit and Loss Account","Balance Sheet","Adjustments"],
    7:["Partnership — Admission","Retirement","Death of Partner"],
    8:["Share Capital","Issue of Shares","Debentures","Redemption"],
  },
  ca_f_law: {
    1:["Definition of Contract","Offer","Acceptance","Consideration","Capacity","Free Consent","Void Agreements"],
    2:["Sale of Goods","Transfer of Property","Conditions","Warranties","Rights of Parties"],
    3:["Promissory Note","Bill of Exchange","Cheque","Crossing","Dishonour"],
    4:["Partnership Definition","Rights and Duties","Dissolution"],
    5:["LLP Formation","LLP Management","LLP vs Partnership"],
    6:["Types of Companies","MOA","AOA","Prospectus","Directors"],
  },
  ca_f_maths: {
    1:["Ratio","Proportion","Variation"],
    2:["Indices","Logarithms","Laws"],
    3:["Simple Interest","Compound Interest","Annuity"],
    4:["Permutations","Combinations","Applications"],
    5:["Sets","Functions","Relations"],
    6:["Limits","Continuity"],
    7:["Differentiation","Applications"],
  },
  ca_f_eco: {
    1:["Nature of Economics","Micro vs Macro","Economic Problems"],
    2:["Demand","Supply","Equilibrium","Elasticity"],
    3:["Production Function","Cost Curves","Revenue"],
    4:["Perfect Competition","Monopoly","Oligopoly"],
    5:["National Income","GDP","GNP","Measurement"],
  },
};

function ChapterContent({ pageId }: { pageId: string }) {
  const router       = useRouter();
  const params       = useSearchParams();
  const chapterNum   = parseInt(params.get("chapter") || "1");
  const subjectTitle = params.get("subject") || "Business Laws";
  const subjectKey   = (pageId || "cma_f_law").replace(/-/g, "_").toLowerCase();

  const chapterTitle    = chapterNames[subjectKey]?.[chapterNum] || `Chapter ${chapterNum}`;
  const chapterConcepts = conceptMap[subjectKey]?.[chapterNum]   || ["Introduction","Key Concepts","Definitions"];
  const namespace       = `${subjectKey}_ch${chapterNum}_s1`;

  const [rings, setRings] = useState<Record<string, boolean[]>>({});

  useEffect(() => {
    const saved = localStorage.getItem(`rings_${subjectKey}_ch${chapterNum}`);
    if (saved) setRings(JSON.parse(saved));
  }, [subjectKey, chapterNum]);

  const getRingColor = (concept: string, idx: number) => {
    const colors = ["#E67E22","#0E6655","#185FA5","#6B6560"];
    const done   = (rings[concept] || [false,false,false,false])[idx];
    return done ? colors[idx] : "#E5E0D8";
  };

  const allDone = (concept: string) =>
    (rings[concept] || [false,false,false,false]).every(Boolean);

  const completedCount = chapterConcepts.filter(c => allDone(c)).length;
  const progressPct    = Math.round((completedCount / chapterConcepts.length) * 100);

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
        <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#fff", marginBottom:2 }}>
          Ch {chapterNum} — {chapterTitle}
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>
          {subjectTitle} · {chapterConcepts.length} concepts · {completedCount} completed
        </div>
        <div style={{ height:3, background:"rgba(255,255,255,0.15)", borderRadius:2, overflow:"hidden" }}>
          <div style={{ width:`${progressPct}%`, height:"100%", background:"#E67E22", borderRadius:2 }} />
        </div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:4 }}>{progressPct}% complete</div>
      </div>

      <div style={{ flex:1, padding:"16px 20px 100px", display:"flex", flexDirection:"column", gap:10 }}>

        {/* Ring legend */}
        <div style={{ background:"#fff", borderRadius:14, padding:"10px 14px", border:"0.5px solid rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#6B6560", marginBottom:6 }}>
            COMPLETE ALL 4 QUIZ MODES PER CONCEPT
          </div>
          <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
            {[
              { icon:"📄", label:"Previous Papers", color:"#E67E22" },
              { icon:"📖", label:"Textbook Exact",  color:"#0E6655" },
              { icon:"🔄", label:"Tweaked",         color:"#185FA5" },
              { icon:"🤖", label:"AI Generated",    color:"#6B6560" },
            ].map(r => (
              <div key={r.label} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:12 }}>{r.icon}</span>
                <span style={{ fontSize:10, color:r.color, fontWeight:500 }}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize:12, fontWeight:600, color:"#6B6560" }}>
          {chapterConcepts.length} Concepts
        </div>

        {chapterConcepts.map((concept, i) => {
          const done = allDone(concept);
          return (
            <motion.div key={concept}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:i*0.04 }}
              style={{
                background:   "#fff",
                borderRadius: 16,
                padding:      "14px 16px",
                border:       done
                  ? "1.5px solid rgba(14,102,85,0.25)"
                  : "0.5px solid rgba(0,0,0,0.06)",
              }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:done?"#0E6655":"#1A1208", marginBottom:8 }}>
                    {done && <span style={{ marginRight:4 }}>✓</span>}
                    {concept}
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    {[0,1,2,3].map(idx => (
                      <div key={idx} style={{ flex:1, height:5, borderRadius:3, background:getRingColor(concept,idx), transition:"background 0.3s" }} />
                    ))}
                  </div>
                </div>
                <motion.button whileTap={{ scale:0.95 }}
                  onClick={() => router.push(
                    `/lesson?namespace=${encodeURIComponent(namespace)}`+
                    `&concept=${encodeURIComponent(concept)}`+
                    `&subject=${encodeURIComponent(subjectTitle)}`+
                    `&chapter=${encodeURIComponent(`Chapter ${chapterNum} — ${chapterTitle}`)}`+
                    `&page=1`
                  )}
                  style={{
                    background:   done ? "#E1F5EE" : "#0A2E28",
                    color:        done ? "#0E6655" : "#fff",
                    border:       "none",
                    borderRadius: 10,
                    padding:      "8px 14px",
                    fontSize:     12,
                    fontWeight:   600,
                    cursor:       "pointer",
                    flexShrink:   0,
                    whiteSpace:   "nowrap",
                  }}>
                  {done ? "Review" : "Study →"}
                </motion.button>
              </div>
            </motion.div>
          );
        })}

        {/* Chapter exam */}
        <motion.div whileTap={{ scale:0.98 }}
          onClick={() => router.push(`/exams/chapter`)}
          style={{ background:"linear-gradient(135deg,#0A2E28,#0A4A3C)", borderRadius:16, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", marginTop:4 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>Chapter {chapterNum} Exam</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:2 }}>
              20 questions · 30 mins · All 4 types
            </div>
          </div>
          <div style={{ fontSize:16, color:"#E67E22" }}>→</div>
        </motion.div>

      </div>
    </div>
  );
}

export default function ChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense fallback={
      <div className="app-shell" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:"#0A2E28" }}>Loading...</div>
      </div>
    }>
      <ChapterContent pageId={id} />
    </Suspense>
  );
}