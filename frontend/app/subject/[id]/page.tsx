"use client";
import React, { use, useEffect, useState, Suspense } from "react";
import { SomiIcons } from "@/components/SomiIcons";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getSubjects } from "@/lib/syllabus";
import FloatingNav from "@/components/FloatingNav";

const C = { navy:"#071739",gold:"#E3C39D",goldLight:"#F0DCC4",steel:"#4B6382",silver:"#A4B5C4",sand:"#A68868",bg:"#FAFAF8" };

const chapterNameMap: Record<string,Record<number,string>> = {
  cma_f_law:{1:"Introduction to Business Laws",2:"Indian Contracts Act 1872",3:"Sale of Goods Act 1930",4:"Negotiable Instruments Act 1881",5:"Business Communication"},
  cma_f_acc:{1:"Accounting Fundamentals",2:"Accounting for Special Transactions",3:"Preparation of Final Accounts",4:"Fundamentals of Cost Accounting"},
  cma_f_maths:{1:"Arithmetic",2:"Algebra",3:"Calculus Application",4:"Statistical Representation",5:"Central Tendency & Dispersion",6:"Correlation & Regression",7:"Probability",8:"Index Numbers & Time Series"},
  cma_f_eco:{1:"Basic Concepts of Economics",2:"Forms of Market",3:"Money & Banking",4:"Economic & Business Environment",5:"Fundamentals of Management"},
  ca_f_acc:{1:"Introduction & Standards",2:"Journal, Ledger & Trial Balance",3:"Bank Reconciliation",4:"Depreciation",5:"Bills of Exchange",6:"Final Accounts",7:"Partnership",8:"Company Accounts"},
  ca_f_law:{1:"Indian Contract Act",2:"Sale of Goods Act",3:"Negotiable Instruments",4:"Partnership Act",5:"LLP Act",6:"Companies Act"},
  ca_f_maths:{1:"Ratio & Proportion",2:"Indices & Logarithms",3:"Interest",4:"Permutations",5:"Sets & Functions",6:"Limits",7:"Calculus"},
  ca_f_eco:{1:"Introduction",2:"Demand & Supply",3:"Production & Cost",4:"Market Structures",5:"National Income"},
};

// Page Jumper component
function PageJumper({show,onClose}:{show:boolean;onClose:()=>void}){
  const [val,setVal]=useState("");
  const [feedback,setFeedback]=useState("");
  const [fbColor,setFbColor]=useState(C.gold);

  const jumpToPage = async () => {
    if (!val) return;
    setFbColor(C.gold);
    setFeedback("Looking up page "+val+"...");
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "https://studybuddy-production-7776.up.railway.app";
      const subKey = localStorage.getItem("somi_course") === "ca" ? "ca_f" : "cma_f";
      const res = await fetch(`${API}/jump?page=${val}&namespace_prefix=${subKey}`);
      const data = await res.json();
      if (data.found && data.has_content) {
        setFbColor(C.gold);
        setFeedback("→ " + data.concept);
        setTimeout(() => {
          onClose();
          window.location.href = `/lesson?namespace=${encodeURIComponent(data.namespace)}&concept=${encodeURIComponent(data.concept)}&subject=&chapter=Chapter%20${data.chapter_num}&page=${data.book_page}`;
        }, 600);
      } else {
        setFbColor(C.steel);
        setFeedback("Page " + val + " — concept not loaded yet. Coming soon!");
      }
    } catch {
      setFbColor(C.steel);
      setFeedback("Page " + val + " — concept not loaded yet. Coming soon!");
    }
  };

  return(
    <AnimatePresence>
      {show&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          onClick={onClose}
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
              <input value={val} onChange={e=>{setVal(e.target.value);setFeedback("")}}
                onKeyDown={e=>{if(e.key==="Enter")jumpToPage();}}
                type="number" inputMode="numeric" placeholder="189" autoFocus
                style={{flex:1,height:48,borderRadius:12,border:"2px solid rgba(7,23,57,0.1)",background:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:24,color:C.navy,textAlign:"center",outline:"none",WebkitAppearance:"none"}}/>
            </div>
            <button disabled={!val} onClick={jumpToPage}
              style={{width:"100%",height:44,borderRadius:10,background:C.navy,color:C.gold,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,opacity:val?1:0.3}}>Jump to Page</button>
            <div style={{fontSize:11,opacity:0.3,marginTop:10}}>Paper 1 · Pages 1 — 420</div>
            {feedback&&<div style={{marginTop:10,fontSize:12,color:fbColor}}>{feedback}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SubjectContent({pageId}:{pageId:string}){
  const router=useRouter();
  const [subject,setSubject]=useState<any>(null);
  const [ready,setReady]=useState(false);
  const [showJumper,setShowJumper]=useState(false);

  useEffect(()=>{
    const c=localStorage.getItem("somi_course")||"cma";
    const l=localStorage.getItem("somi_level")||"foundation";
    const g=parseInt(localStorage.getItem("somi_group")||"0");
    const subjects=getSubjects(c,l,g||1);
    const found=subjects.find((s:any)=>s.id===pageId)||subjects.find((s:any)=>s.id===pageId.replace(/-/g,"_"))||subjects[0];
    setSubject(found);setReady(true);
  },[pageId]);

  if(!ready||!subject) return(<div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:C.navy,fontSize:14}}>Loading...</span></div>);

  const subjectKey=(subject.id||pageId).replace(/-/g,"_");
  const chapters=Array.from({length:subject.chapters||5},(_,i)=>({
    number:i+1,title:chapterNameMap[subjectKey]?.[i+1]||`Chapter ${i+1}`,
    progress:i===0?100:i===1?40:0,concepts:[4,10,6,5,6,8,7,8][i]||5,
  }));
  const totalConcepts=chapters.reduce((a,c)=>a+c.concepts,0);
  const overallProgress=Math.round(chapters.reduce((a,c)=>a+c.progress,0)/chapters.length);
  const currentChIdx=chapters.findIndex(c=>c.progress>0&&c.progress<100);

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif"}}>
      <PageJumper show={showJumper} onClose={()=>setShowJumper(false)}/>

      {/* NAVY HEADER */}
      <div style={{background:C.navy,paddingTop:"max(env(safe-area-inset-top,20px),20px)",paddingBottom:0,position:"relative",overflow:"hidden"}}>
        <span style={{position:"absolute",top:-20,right:-10,fontFamily:"'DM Serif Display',serif",fontWeight:900,fontSize:"clamp(120px,20vw,200px)",color:"#fff",opacity:0.03,lineHeight:1,userSelect:"none",pointerEvents:"none"}}>{String((subject.code?.match(/\d+/)?.[0] || "01")).padStart(2,"0")}</span>
        <div style={{maxWidth:720,margin:"0 auto",padding:"0 20px",position:"relative",zIndex:1}}>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
            <motion.button whileTap={{scale:0.9}} onClick={()=>router.back()}
              style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.06)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </motion.button>
            <span style={{fontSize:11,color:C.gold,opacity:0.6,letterSpacing:"0.12em",fontWeight:600}}>{subject.code} · CMA FOUNDATION</span>
          </motion.div>
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.08}}
            style={{display:"flex",alignItems:"flex-start",gap:16,paddingBottom:24}}>
            <div style={{flex:1}}>
              <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(22px,5vw,28px)",fontWeight:400,color:"#fff",lineHeight:1.2,marginBottom:8}}>{subject.title}</h1>
              <div style={{fontSize:12,color:C.silver,opacity:0.6}}>{chapters.length} chapters · {totalConcepts} concepts</div>
            </div>
            <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <svg width="56" height="56" style={{transform:"rotate(-90deg)"}}><circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/><circle cx="28" cy="28" r="24" fill="none" stroke={C.gold} strokeWidth="3" strokeDasharray="150.8" strokeDashoffset={150.8-(150.8*overallProgress/100)} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s ease"}}/></svg>
              <span style={{fontSize:11,color:C.gold,opacity:0.6}}>{overallProgress}%</span>
            </div>
          </motion.div>
        </div>
        <div style={{maxWidth:720,margin:"0 auto",padding:"0 20px"}}>
          <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden",marginBottom:12}}>
            <div style={{width:`${overallProgress}%`,height:"100%",background:C.gold,borderRadius:2}}/>
          </div>
        </div>
        {/* Page jump button */}
        <div style={{maxWidth:720,margin:"0 auto",padding:"0 20px 16px"}}>
          <button onClick={()=>setShowJumper(true)} style={{background:"rgba(255,255,255,0.06)",border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:11,color:C.gold,opacity:0.5,display:"inline-flex",alignItems:"center",gap:4}}><SomiIcons.BookOpen size={14} color="rgba(227,195,157,0.9)" />Jump to textbook page →</span>
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{maxWidth:720,margin:"0 auto",padding:"20px 20px max(110px, calc(88px + env(safe-area-inset-bottom, 0px)))"}}>
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.16}}
          style={{display:"flex",borderRadius:12,border:`1px solid ${C.navy}0D`,overflow:"hidden",marginBottom:24}}>
          {[{v:String(chapters.filter(c=>c.progress===100).length),l:"Complete"},{v:String(chapters.filter(c=>c.progress>0&&c.progress<100).length),l:"In Progress"},{v:String(chapters.filter(c=>c.progress===0).length),l:"Not Started"}].map((s,i)=>(
            <div key={i} style={{flex:1,padding:"14px 0",textAlign:"center",borderRight:i<2?`1px solid ${C.navy}0A`:"none"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:C.navy,lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:10,color:C.navy,opacity:0.35,marginTop:3,letterSpacing:"0.08em",textTransform:"uppercase" as const}}>{s.l}</div>
            </div>
          ))}
        </motion.div>

        <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:C.navy,opacity:0.4,marginBottom:14}}>Chapters</div>

        {chapters.map((ch,i)=>{
          const isCurrent=i===currentChIdx;
          const isDone=ch.progress===100;
          const isLocked=false;
          return(
            <motion.div key={ch.number} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.24+i*0.04}}
              whileTap={!isLocked?{scale:0.98}:{}}
              onClick={()=>!isLocked&&router.push(`/chapter/${subject.id}?chapter=${ch.number}&subject=${encodeURIComponent(subject.title)}&subjectId=${subject.id}`)}
              style={{display:"flex",gap:16,alignItems:"flex-start",padding:18,background:"#fff",borderRadius:14,border:isCurrent?`1.5px solid ${C.gold}`:`1px solid ${C.navy}0A`,boxShadow:isCurrent?`0 0 16px ${C.gold}1A`:"none",marginBottom:12,cursor:isLocked?"default":"pointer",opacity:1}}>
              <span style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:isCurrent?C.gold:C.navy,opacity:isCurrent?0.5:0.12,lineHeight:1,minWidth:32,paddingTop:2}}>{ch.number}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,lineHeight:1.35,color:C.navy,marginBottom:4}}>{ch.title}</div>
                <div style={{fontSize:12,color:C.navy,opacity:0.4,marginBottom:10}}>{ch.concepts} concepts</div>
                {ch.progress>0&&(<><div style={{height:3,background:`${C.navy}0D`,borderRadius:2,overflow:"hidden",marginBottom:4}}><div style={{width:`${ch.progress}%`,height:"100%",background:C.gold,borderRadius:2}}/></div><div style={{fontSize:11,color:C.navy,opacity:0.35,fontWeight:500}}>{isDone?"100% complete":`${Math.round(ch.progress*ch.concepts/100)} of ${ch.concepts} done`}</div></>)}
                {isDone&&<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:600,padding:"3px 10px",borderRadius:20,background:`${C.navy}0A`,color:C.navy,opacity:0.5,marginTop:8}}><SomiIcons.Check size={10} />Complete</span>}
                {isCurrent&&<span style={{display:"inline-block",fontSize:10,fontWeight:600,padding:"3px 10px",borderRadius:20,background:C.gold,color:C.navy,marginTop:8}}>Continue →</span>}
              </div>
              <span style={{fontSize:14,color:isCurrent?C.gold:C.navy,opacity:isCurrent?0.5:0.15,alignSelf:"center"}}>›</span>
            </motion.div>
          );
        })}
      </div>
      <FloatingNav active="Study" subjectPath={`/subject/${subject.id}`} />
    </div>
  );
}

export default function SubjectPage({params}:{params:Promise<{id:string}>}){
  const {id}=use(params);
  return(<Suspense fallback={<div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:C.navy}}>Loading...</span></div>}><SubjectContent key={id} pageId={id}/></Suspense>);
}
