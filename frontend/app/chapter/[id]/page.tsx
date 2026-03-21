"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const chapterNames: Record<string, Record<number, string>> = {
  cma_f_law: {
    1:"Introduction to Business Laws",
    2:"Indian Contracts Act 1872",
    3:"Sale of Goods Act 1930",
    4:"Negotiable Instruments Act 1881",
    5:"Business Communication",
  },
  cma_f_acc: {
    1:"Accounting Fundamentals",
    2:"Accounting for Special Transactions",
    3:"Preparation of Final Accounts",
    4:"Fundamentals of Cost Accounting",
  },
  cma_f_maths: {
    1:"Arithmetic",
    2:"Algebra",
    3:"Calculus Application in Business",
    4:"Statistical Representation of Data",
    5:"Measures of Central Tendency and Dispersion",
    6:"Correlation and Regression",
    7:"Probability",
    8:"Index Numbers and Time Series",
  },
  cma_f_eco: {
    1:"Basic Concepts of Economics",
    2:"Forms of Market",
    3:"Money and Banking",
    4:"Economic and Business Environment",
    5:"Fundamentals of Management",
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
    1:["Sources of Law","Legislative Process in India","Legal Method and Court System","Primary and Subordinate Legislation"],
    2:["Essential Elements Types Offer and Acceptance","Void and Voidable Agreements","Consideration and Legality of Object","Capacity of Parties and Free Consent","Quasi and Contingent Contracts","Performance of Contracts","Indemnity Guarantee Pledge and Agent","E-Contracts and E-Signature","Discharge of Contracts","Breach of Contract and Remedies"],
    3:["Definition of Sale of Goods","Transfer of Ownership","Essential Conditions of Contract of Sale","Conditions and Warranties","Performance of Contract of Sale","Rights of Unpaid Seller"],
    4:["Characteristics of Negotiable Instruments","Promissory Note Bill of Exchange and Cheque","Differences between the Three","Crossing Meaning and Types","Dishonour of Cheques Section 138"],
    5:["Introduction to Business Communication","Features of Effective Communication","Process of Communication","Types of Business Communication","Internet Based Communication","Social Media Dos and Donts","Writing and Drafting for Business","Intercultural Communication","Barriers to Communication","Legal Aspects of Communication","Graphics and References"],
  },
  cma_f_acc: {
    1:["Four Frameworks of Accounting","Accounting Principles Concepts and Conventions","Capital and Revenue Transactions","Accounting Cycle","Journal and Ledger","Cash Book Bank Book and BRS","Trial Balance","Adjustment Entries and Rectification of Errors","Depreciation SLM and WDV","Bad Debts and Provision for Doubtful Debts"],
    2:["Consignment Accounts","Joint Venture Accounts","Bills of Exchange"],
    3:["Income Statement of Sole Proprietorship","Balance Sheet of Sole Proprietorship","Receipts and Payments Account","Income and Expenditure Account","Balance Sheet of Not-for-Profit Organisation"],
    4:["Meaning and Significance of Cost Accounting","Application for Business Decisions","Cost Cost Centre Cost Unit and Cost Drivers","Classification of Costs CAS 1","Cost Sheet and Statement of Cost"],
  },
  cma_f_maths: {
    1:["Ratios Variations and Proportions","Simple and Compound Interest","Annuity","Arithmetic and Geometric Progression","Time and Distance"],
    2:["Set Theory and Venn Diagram","Indices and Logarithms","Permutation and Combinations","Quadratic Equations"],
    3:["Concept of Calculus","Revenue and Cost Function","Optimization Techniques"],
    4:["Diagrammatic Representation of Data","Frequency Distribution","Histogram Frequency Polygon Ogive Pie Chart"],
    5:["Mean Median and Mode","Mean Deviation","Range Quartiles and Quartile Deviation","Standard Deviation","Coefficient of Variation","Skewness Karl Pearson and Bowley"],
    6:["Scatter Diagram","Karl Pearsons Coefficient of Correlation","Regression Analysis"],
    7:["Concepts and Terminologies","Probability Theorems and Applications"],
    8:["Index Numbers Uses and Construction","Time Series Components and Moving Average"],
  },
  cma_f_eco: {
    1:["Fundamentals of Economics","Utility Wealth and Production","Theory of Demand","Theory of Supply and Equilibrium","Theory of Production","Cost of Production","Means of Production"],
    2:["Perfect Competition","Monopoly","Monopolistic Competition","Oligopoly and Duopoly","Price Discrimination"],
    3:["Money Types Features and Functions","Banking Definition and Functions","Commercial Banks","Central Bank RBI","Credit Control and Money Market"],
    4:["PESTEL Analysis","VUCAFU Analysis"],
    5:["Introduction to Management","Stewardship and Agency Theory","Planning Organizing Staffing and Leading","Communication Coordination and Control","Organisation Structure and Delegation","Leadership and Motivation","Decision Making"],
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
      <ChapterContent key={id} pageId={id} />
    </Suspense>
  );
}