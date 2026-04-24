"use client";
import React, { use, useEffect, useState, Suspense } from "react";
import { SomiIcons } from "@/components/SomiIcons";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import FloatingNav from "@/components/FloatingNav";

const C = { navy:"#071739",gold:"#E3C39D",goldLight:"#F0DCC4",steel:"#4B6382",silver:"#A4B5C4",sand:"#A68868",bg:"#FAFAF8" };

const API = process.env.NEXT_PUBLIC_API_URL || "https://studybuddy-production-7776.up.railway.app";

const chapterNames:Record<string,Record<number,string>>={
  cma_f_law:{1:"Introduction to Business Laws",2:"Indian Contracts Act 1872",3:"Sale of Goods Act 1930",4:"Negotiable Instruments Act 1881",5:"Business Communication"},
  cma_f_acc:{1:"Accounting Fundamentals",2:"Accounting for Special Transactions",3:"Preparation of Final Accounts",4:"Fundamentals of Cost Accounting"},
  cma_f_maths:{1:"Arithmetic",2:"Algebra",3:"Calculus Application",4:"Statistical Representation",5:"Central Tendency & Dispersion",6:"Correlation & Regression",7:"Probability",8:"Index Numbers & Time Series"},
  cma_f_eco:{1:"Basic Concepts of Economics",2:"Forms of Market",3:"Money & Banking",4:"Economic & Business Environment",5:"Fundamentals of Management"},
  ca_f_acc:{1:"Introduction & Standards",2:"Journal, Ledger & Trial Balance",3:"Bank Reconciliation",4:"Depreciation",5:"Bills of Exchange",6:"Final Accounts",7:"Partnership",8:"Company Accounts"},
  ca_f_law:{1:"Indian Contract Act",2:"Sale of Goods Act",3:"Negotiable Instruments",4:"Partnership Act",5:"LLP Act",6:"Companies Act"},
  ca_f_maths:{1:"Ratio & Proportion",2:"Indices & Logarithms",3:"Interest",4:"Permutations",5:"Sets & Functions",6:"Limits",7:"Calculus"},
  ca_f_eco:{1:"Introduction",2:"Demand & Supply",3:"Production & Cost",4:"Market Structures",5:"National Income"},
};

const paperMap: Record<string, number> = {
  cma_f_law: 1,
  cma_f_acc: 2,
  cma_f_maths: 3,
  cma_f_eco: 4,
};

const conceptMap:Record<string,Record<number,string[]>>={
  cma_f_law:{
    1:["1.1 Sources of Law","1.2 Legislative Process in India","1.3 Legal Method and Court System","1.4 Primary and Subordinate Legislation"],
    2:["2.1 Essential Elements & Types of Contract","2.2 Void and Voidable Agreements","2.3 Consideration & Legality","2.4 Capacity of Parties & Free Consent","2.5 Quasi & Contingent Contracts","2.6 Performance of Contracts","2.7 Indemnity, Guarantee, Pledge, Agent","2.8 E-Contracts & E-Signature","2.9 Discharge of Contracts","2.10 Breach & Remedies"],
    3:["3.1 Definition","3.2 Transfer of Ownership","3.3 Essential Conditions","3.4 Conditions & Warranties","3.5 Performance of Sale Contract","3.6 Rights of Unpaid Seller"],
    4:["4.1 Characteristics of NI","4.2 Promissory Note, Bill of Exchange, Cheque","4.3 Differences between PN, BOE, Cheque","4.4 Crossing — Types","4.5 Dishonour of Cheques S.138"],
    5:["5.1 Introduction","5.2 Effective Communication","5.3 Process","5.4 Types","5.5 Internet-Based","5.6 Social Media","5.7 Writing & Drafting","5.8 Intercultural","5.9 Barriers","5.10 Legal Aspects","5.11 Graphics & References"],
  },
  cma_f_acc:{
    1:["1.1 Frameworks & Forms","1.2 Principles & Conventions","1.3 Capital & Revenue","1.4 Accounting Cycle","1.5 Journal & Ledger","1.6 Cash Book & BRS","1.7 Trial Balance","1.8 Adjustments & Rectification","1.9 Depreciation Methods","1.10 Bad Debts & Provision"],
    2:["2.1 Consignment","2.2 Joint Venture","2.3 Bills of Exchange"],
    3:["3.1 Sole Proprietorship Financials","3.2 NPO Financials"],
    4:["4.1 Cost Accounting Meaning","4.2 Business Decisions","4.3 Cost Centre & Cost Unit","4.4 Classification of Costs","4.5 Cost Sheet Preparation"],
  },
};

function PageJumper({show,onClose}:{show:boolean;onClose:()=>void}){
  const [val,setVal]=useState("");
  const [feedback,setFeedback]=useState("");

  const jumpToPage = async () => {
    if (!val) return;
    setFeedback("Looking up page "+val+"...");
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "https://studybuddy-production-7776.up.railway.app";
      const subKey = localStorage.getItem("somi_course") === "ca" ? "ca_f" : "cma_f";
      const res = await fetch(`${API}/jump?page=${val}&namespace_prefix=${subKey}`);
      const data = await res.json();
      if (data.found && data.has_content) {
        setFeedback("→ " + data.concept);
        setTimeout(() => {
          onClose();
          window.location.href = `/lesson?namespace=${encodeURIComponent(data.namespace)}&concept=${encodeURIComponent(data.concept)}&subject=&chapter=Chapter%20${data.chapter_num}&page=${data.book_page}`;
        }, 600);
      } else {
        setFeedback("Page " + val + " — concept not loaded yet. Coming soon!");
      }
    } catch {
      setFeedback("Page " + val + " — concept not loaded yet. Coming soon!");
    }
  };

  return(
    <AnimatePresence>
      {show&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
          style={{position:"fixed",inset:0,zIndex:200,background:"rgba(7,23,57,0.35)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
            onClick={e=>e.stopPropagation()}
            style={{background:C.bg,borderRadius:20,padding:"28px 24px",width:"calc(100% - 48px)",maxWidth:320,boxShadow:"0 16px 48px rgba(7,23,57,0.2)",textAlign:"center",position:"relative"}}>
            <button onClick={onClose} style={{position:"absolute",top:12,right:12,width:28,height:28,borderRadius:8,background:"rgba(7,23,57,0.04)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#071739" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><SomiIcons.BookOpen size={32} /></div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,marginBottom:4}}>Go to Page</div>
            <div style={{fontSize:12,opacity:0.4,marginBottom:20}}>Enter your ICMAI textbook page number</div>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:16}}>
              <span style={{fontSize:14,fontWeight:600,color:C.navy,opacity:0.35,flexShrink:0}}>Page</span>
              <input value={val} onChange={e=>{setVal(e.target.value);setFeedback("")}} type="number" inputMode="numeric" placeholder="189" autoFocus
                onKeyDown={e=>{if(e.key==="Enter")jumpToPage();}}
                style={{flex:1,height:48,borderRadius:12,border:"2px solid rgba(7,23,57,0.1)",background:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:24,color:C.navy,textAlign:"center",outline:"none",WebkitAppearance:"none" as any}}/>
            </div>
            <button disabled={!val} onClick={jumpToPage}
              style={{width:"100%",height:44,borderRadius:10,background:C.navy,color:C.gold,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,opacity:val?1:0.3}}>Jump to Page</button>
            <div style={{fontSize:11,opacity:0.3,marginTop:10}}>Paper 1 · Pages 1 — 420</div>
            {feedback&&<div style={{marginTop:10,fontSize:12,color:C.gold}}>{feedback}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ChapterContent({pageId}:{pageId:string}){
  const router=useRouter();
  const params=useSearchParams();
  const chapterNum=parseInt(params.get("chapter")||"1");
  const subjectTitle=params.get("subject")||"Business Laws";
  const subjectKey=(pageId||"cma_f_law").replace(/-/g,"_").toLowerCase();
  const chapterTitle=chapterNames[subjectKey]?.[chapterNum]||`Chapter ${chapterNum}`;
  const paperNum=paperMap[subjectKey]||1;
  const namespace=`${subjectKey}_ch${chapterNum}_s1`;
  const [showJumper,setShowJumper]=useState(false);
  const [pageGroups,setPageGroups]=useState<{page:number;concepts:{concept:string;has_content:boolean;heading:string}[];has_content:boolean}[]>([]);
  const [totalConcepts,setTotalConcepts]=useState(0);
  const [pageRange,setPageRange]=useState<{start:number;end:number}|null>(null);
  const [loading,setLoading]=useState(true);
  const [pageSearch,setPageSearch]=useState("");
  const [expandedPage,setExpandedPage]=useState<number|null>(null);

  useEffect(()=>{
    async function fetchConcepts(){
      setLoading(true);
      try{
        const res=await fetch(`${API}/chapters/concepts?paper=${paperNum}&chapter=${chapterNum}`);
        const data=await res.json();
        if(data.pages?.length>0){
          setPageGroups(data.pages);
          setTotalConcepts(data.total_concepts);
          setPageRange(data.page_range);
        } else {
          setPageGroups([]);
          setTotalConcepts(0);
          setPageRange(null);
        }
      }catch(e){
        console.error("Failed to fetch concepts:", e);
        setPageGroups([]);
        setTotalConcepts(0);
        setPageRange(null);
      }finally{
        setLoading(false);
      }
    }
    fetchConcepts();
  },[subjectKey,chapterNum,paperNum]);

  const masteredCount=0;
  const progress=0;

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif"}}>
      <PageJumper show={showJumper} onClose={()=>setShowJumper(false)}/>

      {/* NAVY HEADER */}
      <div style={{background:C.navy,paddingTop:"max(env(safe-area-inset-top,16px),16px)",paddingBottom:0,position:"relative",overflow:"hidden"}}>
        {/* Ghost num = chapter index (two digits) */}
        <span style={{position:"absolute",top:-20,right:-10,fontFamily:"'DM Serif Display',serif",fontWeight:900,fontSize:"clamp(100px,18vw,180px)",color:"#fff",opacity:0.03,lineHeight:1,userSelect:"none",pointerEvents:"none"}}>{String(chapterNum).padStart(2,"0")}</span>
        <div style={{maxWidth:720,margin:"0 auto",padding:"0 20px",position:"relative",zIndex:1}}>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <motion.button whileTap={{scale:0.9}} onClick={()=>router.back()}
              style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.06)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </motion.button>
            <span style={{fontSize:10,color:C.gold,opacity:0.6,letterSpacing:"0.12em",fontWeight:600}}>{subjectTitle.toUpperCase().slice(0,30)}</span>
          </motion.div>
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.06}}
            style={{display:"flex",alignItems:"flex-start",gap:16,paddingBottom:20}}>
            <div style={{flex:1}}>
              <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(20px,4.5vw,26px)",fontWeight:400,color:"#fff",lineHeight:1.2,marginBottom:6}}>Chapter {chapterNum} — {chapterTitle}</h1>
              <div style={{fontSize:12,color:C.silver,opacity:0.5}}>{totalConcepts} concepts · {pageRange?`Pages ${pageRange.start}-${pageRange.end}`:""}</div>
            </div>
            <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <svg width="48" height="48" style={{transform:"rotate(-90deg)"}}><circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/><circle cx="24" cy="24" r="20" fill="none" stroke={C.gold} strokeWidth="3" strokeDasharray="125.66" strokeDashoffset={125.66-(125.66*progress/100)} strokeLinecap="round"/></svg>
              <span style={{fontSize:11,color:C.gold,opacity:0.6}}>{progress}%</span>
            </div>
          </motion.div>
        </div>
        <div style={{maxWidth:720,margin:"0 auto",padding:"0 20px"}}>
          <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden",marginBottom:12}}>
            <div style={{width:`${progress}%`,height:"100%",background:C.gold,borderRadius:2}}/>
          </div>
        </div>
        <div style={{maxWidth:720,margin:"0 auto",padding:"0 20px 16px"}}>
          <button onClick={()=>setShowJumper(true)} style={{background:"rgba(255,255,255,0.06)",border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:11,color:C.gold,opacity:0.5,display:"inline-flex",alignItems:"center",gap:4}}><SomiIcons.BookOpen size={14} color="rgba(227,195,157,0.9)" />Jump to textbook page →</span>
          </button>
        </div>
      </div>

      {/* CONCEPTS — PAGE GROUPED */}
      <div style={{maxWidth:720,margin:"0 auto",padding:"16px 20px 0"}}>

        {/* Sticky page search */}
        <div style={{position:"sticky",top:0,zIndex:10,background:C.bg,paddingBottom:12,paddingTop:4}}>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff",borderRadius:12,border:`1.5px solid ${C.navy}10`,padding:"0 14px",height:44}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2" opacity={0.3}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            <input
              value={pageSearch}
              onChange={e=>setPageSearch(e.target.value)}
              type="number"
              inputMode="numeric"
              placeholder={pageRange?`Jump to page (${pageRange.start}-${pageRange.end})`:"Enter page number..."}
              style={{flex:1,border:"none",outline:"none",background:"transparent",fontSize:14,color:C.navy,fontFamily:"'DM Sans',sans-serif"}}
            />
            {pageSearch&&(
              <button type="button" onClick={()=>setPageSearch("")} style={{background:"none",border:"none",cursor:"pointer",padding:4,opacity:0.3}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        </div>

        <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:C.navy,opacity:0.4,marginBottom:14}}>
          {loading?"Loading...":`${pageGroups.length} Pages · ${totalConcepts} Concepts`}
        </div>

        {loading&&(
          <div style={{textAlign:"center",padding:40}}>
            <div style={{fontSize:13,color:C.navy,opacity:0.4}}>Loading concepts...</div>
          </div>
        )}

        {!loading&&pageGroups.length===0&&(
          <div style={{textAlign:"center",padding:40,background:"#fff",borderRadius:14,border:`1px solid ${C.navy}0A`}}>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:C.navy,marginBottom:8}}>Coming Soon!</div>
            <div style={{fontSize:13,color:C.navy,opacity:0.4}}>Mama is preparing this chapter. Check back soon!</div>
          </div>
        )}

        {!loading&&pageGroups
          .filter(pg=>{
            if (!pageSearch) return true;
            return String(pg.page).includes(pageSearch);
          })
          .map((pg,i)=>{
            const isExpanded=expandedPage===pg.page;
            return(
              <motion.div key={pg.page} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:Math.min(i*0.02,0.5)}}
                style={{background:"#fff",borderRadius:14,border:isExpanded?`1.5px solid ${C.navy}15`:`1px solid ${C.navy}0A`,marginBottom:10,overflow:"hidden"}}>

                {/* Page header — tap to expand */}
                <div onClick={()=>setExpandedPage(isExpanded?null:pg.page)}
                  style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",cursor:"pointer"}}>
                  <span style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:C.navy,opacity:0.12,lineHeight:1,minWidth:40,textAlign:"right"}}>{pg.page}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600,color:C.navy}}>Page {pg.page}</div>
                    <div style={{fontSize:11,color:C.navy,opacity:0.4,marginTop:2}}>
                      {pg.concepts.length} concept{pg.concepts.length!==1?"s":""}
                      {pg.has_content?"":" · Coming soon"}
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {pg.has_content&&(
                      <motion.button type="button" whileTap={{scale:0.95}}
                        onClick={(e)=>{e.stopPropagation();router.push(`/lesson?namespace=${encodeURIComponent(namespace)}&concept=${encodeURIComponent(pg.concepts[0]?.concept||"")}&subject=${encodeURIComponent(subjectTitle)}&chapter=${encodeURIComponent(`Chapter ${chapterNum} — ${chapterTitle}`)}&page=${pg.page}`);}}
                        style={{padding:"6px 14px",borderRadius:8,background:C.navy,color:"#fff",border:"none",cursor:"pointer",fontSize:11,fontWeight:600}}>
                        Study
                      </motion.button>
                    )}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2" opacity={0.2}
                      style={{transform:isExpanded?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s ease"}}>
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>
                </div>

                {/* Expanded concept list */}
                {isExpanded&&(
                  <div style={{borderTop:`1px solid ${C.navy}08`,padding:"12px 18px 16px"}}>
                    {pg.concepts.map((c,j)=>(
                      <div key={j} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:j<pg.concepts.length-1?`1px solid ${C.navy}06`:"none"}}>
                        <span style={{fontSize:10,color:C.navy,opacity:0.25,minWidth:16,paddingTop:3,textAlign:"right"}}>{j+1}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,color:C.navy,lineHeight:1.4,opacity:c.has_content?1:0.4}}>{c.concept}</div>
                          {c.heading&&c.heading!=="None"&&(
                            <div style={{fontSize:10,color:C.steel,opacity:0.5,marginTop:2}}>{c.heading}</div>
                          )}
                        </div>
                        {c.has_content&&(
                          <motion.button type="button" whileTap={{scale:0.95}}
                            onClick={()=>router.push(`/lesson?namespace=${encodeURIComponent(namespace)}&concept=${encodeURIComponent(c.concept)}&subject=${encodeURIComponent(subjectTitle)}&chapter=${encodeURIComponent(`Chapter ${chapterNum} — ${chapterTitle}`)}&page=${pg.page}`)}
                            style={{padding:"4px 10px",borderRadius:6,background:`${C.navy}08`,color:C.navy,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,flexShrink:0}}>
                            Open
                          </motion.button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}

      </div>

      <div style={{height:20}}/>

      <div style={{maxWidth:720,margin:"0 auto",padding:"0 20px max(120px, calc(88px + env(safe-area-inset-bottom, 0px)))"}}>
        {/* CHAPTER ACTIONS */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.5}}
          style={{marginTop:20,background:C.navy,borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"16px 18px 10px",fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase" as const,color:C.gold,opacity:0.5}}>Chapter Actions</div>
          {[{title:`Chapter ${chapterNum} Quiz`,sub:`All concepts · ${totalConcepts} questions`,icon:<SomiIcons.Pen size={18} /> as React.ReactNode},{title:"Timed Mock Test",sub:"30 min · exam conditions",icon:<SomiIcons.Timer size={18} /> as React.ReactNode}].map((item,i)=>(
            <motion.button key={i} whileTap={{scale:0.98}} onClick={()=>router.push(`/quiz?namespace=${encodeURIComponent(namespace)}&mode=textbook&subject=${encodeURIComponent(subjectTitle)}&chapter=${chapterNum}&course=cma&paper=1`)}
              style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderTop:"1px solid rgba(255,255,255,0.06)",cursor:"pointer",background:"none",border:"none",borderTopStyle:"solid" as const,borderTopWidth:1,borderTopColor:"rgba(255,255,255,0.06)",width:"100%",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{item.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{item.title}</div>
                <div style={{fontSize:11,color:C.silver,opacity:0.5,marginTop:1}}>{item.sub}</div>
              </div>
              <span style={{fontSize:14,color:C.gold,opacity:0.3}}>›</span>
            </motion.button>
          ))}
        </motion.div>
      </div>
      <FloatingNav active="Study" subjectPath={`/subject/${pageId}`} />
    </div>
  );
}

export default function ChapterPage({params}:{params:Promise<{id:string}>}){
  const {id}=use(params);
  return(<Suspense fallback={<div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:C.navy}}>Loading...</span></div>}><ChapterContent key={id} pageId={id}/></Suspense>);
}
