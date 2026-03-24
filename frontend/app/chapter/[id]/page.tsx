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
    1:["1.1 Sources of Law","1.2 Legislative Process in India","1.3 Legal Method and Court System in India","1.4 Primary and Subordinate Legislation"],
    2:["2.1 Essential elements of a Contract Types of Contract Offer and Acceptance","2.2 Void and Voidable Agreements No Consideration No Contract","2.3 Consideration Legality of Object and Consideration","2.4 Capacity of Parties Free Consent","2.5 Quasi and Contingent Contracts","2.6 Performance of Contracts","2.7 Meaning of Indemnity Guarantee Pledge Agent","2.8 E-Contracts and E-Signature Meanings and Requirements","2.9 Discharge of Contracts","2.10 Breach of Contract and Remedies for Breach of Contract"],
    3:["3.1 Definition","3.2 Transfer of Ownership","3.3 Essential Conditions of a Contract of Sale","3.4 Conditions and Warranties","3.5 Performance of the Contract of Sale","3.6 Rights of Unpaid Seller"],
    4:["4.1 Characteristics of Negotiable Instruments","4.2 Definitions of Promissory Note Bill of Exchange and Cheque","4.3 Difference between Promissory Note Bill of Exchange and Cheque","4.4 Crossing Meaning Definition and Types of Crossing","4.5 Dishonour of Cheques Section 138"],
    5:["5.1 Introduction to Business Communication","5.2 Features of Effective Business Communication","5.3 Process of Communication","5.4 Types of Business Communication","5.5 Internet Based Business Communication","5.6 Dos and Donts of Communication through Social Media","5.7 Writing and Drafting for Business Audiences","5.8 Intercultural and International Business Communication","5.9 Barriers to Business Communication","5.10 Legal Aspects of Business Communication","5.11 Use of Graphics and References for Business Communication"],
  },
  cma_f_acc: {
    1:["1.1 Understanding of Four Frameworks of Accounting and Forms of Organisation","1.2 Accounting Principles Concepts and Conventions","1.3 Capital and Revenue Transactions","1.4 Accounting Cycle","1.5 Journal and Ledger","1.6 Cash Book Bank Book Petty Cash Book Bank Reconciliation Statement","1.7 Trial Balance","1.8 Adjustment Entries and Rectification of Errors","1.9 Depreciation Straight Line and Diminishing Balance methods","1.10 Accounting Treatment of Bad Debts and Provision for Doubtful Debts"],
    2:["2.1 Consignment","2.2 Joint Venture","2.3 Bills of Exchange excluding Accommodation Bill Insolvency"],
    3:["3.1 Preparation of Financial Statements of Sole Proprietorship","3.2 Preparation of Financial Statements of a Not-for-Profit Organisation"],
    4:["4.1 Meaning Definition Significance of Cost Accounting its Relationship with Financial Accounting","4.2 Application of Cost Accounting for Business Decisions","4.3 Definition of Cost Cost Centre Cost Unit and Cost Drivers","4.4 Classification of Costs with reference to Cost Accounting Standard 1","4.5 Ascertainment of Cost and Preparation of Statement of Cost and Profit"],
  },
  cma_f_maths: {
    1:["1.1 Ratios Variations and Proportions","1.2 Time Value of Money and Annuity Simple and Compound Interest","1.3 Arithmetic Progression and Geometric Progression","1.4 Time and Distance"],
    2:["2.1 Set Theory Venn Diagram","2.2 Indices and Logarithms Basic Concepts","2.3 Permutation and Combinations Basic Concepts","2.4 Quadratic Equation Basic Concepts"],
    3:["3.1 Concept of Calculus and its Application in Business","3.2 Revenue and Cost Function","3.3 Optimization Techniques Basic Concepts"],
    4:["4.1 Diagrammatic Representation of Data","4.2 Frequency Distribution","4.3 Graphical representation of Frequency Distribution Histogram Frequency Polygon Curve Ogive Pie-chart"],
    5:["5.1 Mean Median Mode Mean Deviation","5.2 Range Quartiles and Quartile Deviation","5.3 Standard Deviation","5.4 Coefficient of Variation","5.5 Karl Pearson and Bowleys Coefficient of Skewness"],
    6:["6.1 Scatter Diagram","6.2 Karl Pearsons Coefficient of Correlation","6.3 Regression Analysis"],
    7:["7.1 Concepts and Terminologies","7.2 Primary applications of Probability Theorems"],
    8:["8.1 Uses of Index Numbers Methods of Construction of Index Number","8.2 Components of Time Series and Calculation of Trend by Moving Average Method"],
  },
  cma_f_eco: {
    1:["1.1 The Fundamentals of Economics","1.2 Utility Wealth Production","1.3 Theory of Demand and Supply Equilibrium","1.4 Theory of Production","1.5 Cost of Production","1.6 Means of Production"],
    2:["2.1 Pricing of Products and Services in various Forms of Markets Perfect Competition Duopoly Oligopoly Monopoly Monopolistic Competition","2.2 Price Discrimination"],
    3:["3.1 Money Types Features and Functions","3.2 Banking Definition Functions Utility Principles","3.3 Commercial Banks Central Bank","3.4 Measures of Credit Control and Money Market"],
    4:["4.1 PESTEL Analysis","4.2 Emerging Dimensions of VUCAFU"],
    5:["5.1 Introduction to Management","5.2 Stewardship Theory and Agency Theory of Management","5.3 Planning Organizing Staffing and Leading","5.4 Communication Coordination Collaboration Monitoring and Control","5.5 Organisation Structure Responsibility Accountability and Delegation of Authority","5.6 Leadership and Motivation Concepts and Theories","5.7 Decision-making Types and Process"],
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
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
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
                      padding:      "8px 12px",
                      fontSize:     11,
                      fontWeight:   600,
                      cursor:       "pointer",
                      whiteSpace:   "nowrap",
                    }}>
                    {done ? "Review" : "Study →"}
                  </motion.button>
                  <motion.button whileTap={{ scale:0.95 }}
                    onClick={() => router.push(
                      `/quiz?namespace=${encodeURIComponent(namespace)}`+
                      `&concept=${encodeURIComponent(concept)}`+
                      `&mode=textbook`+
                      `&subject=${encodeURIComponent(subjectTitle)}`+
                      `&course=cma&paper=1`
                    )}
                    style={{
                      background:   "transparent",
                      color:        "#0E6655",
                      border:       "1.5px solid #0E6655",
                      borderRadius: 10,
                      padding:      "7px 10px",
                      fontSize:     11,
                      fontWeight:   600,
                      cursor:       "pointer",
                      whiteSpace:   "nowrap",
                    }}>
                    Quiz 📝
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Chapter Quiz — textbook exercises */}
        <motion.button whileTap={{ scale:0.97 }}
          onClick={() => router.push(
            `/quiz?chapter=${chapterNum}&course=cma&paper=1&mode=textbook&subject=${encodeURIComponent(subjectTitle)}`
          )}
          style={{ width:"100%", padding:"14px 16px", borderRadius:16, background:"#0E6655", color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor:"pointer", textAlign:"center", marginTop:4 }}>
          Take Chapter {chapterNum} Quiz 📝
        </motion.button>

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