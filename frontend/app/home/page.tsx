"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getSubjects } from "@/lib/syllabus";
import MamaAgent from "@/components/MamaAgent";
import FloatingNav from "@/components/FloatingNav";
import { SomiIcons } from "@/components/SomiIcons";

const C = { navy:"#071739",gold:"#E3C39D",goldLight:"#F0DCC4",steel:"#4B6382",silver:"#A4B5C4",sand:"#A68868",bg:"#FAFAF8" };

/** Exam window end date for countdown (placeholder until official calendar is wired). */
function daysUntilExamFromAttempt(attempt: string): number {
  const examDateStr = attempt.includes("Nov")
    ? attempt.includes("2027")
      ? "2027-12-15"
      : "2026-12-15"
    : attempt.includes("2027")
      ? "2027-06-15"
      : "2026-06-15";
  return Math.max(
    0,
    Math.ceil((new Date(examDateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
}

function paperGhostFromCode(code: string | undefined): string {
  return String(code?.match(/\d+/)?.[0] || "01").padStart(2, "0");
}

function OrbitalRing({percent,size=48,stroke=2.5,delay=0}:{percent:number;size?:number;stroke?:number;delay?:number}){
  const r=(size-stroke)/2, circ=2*Math.PI*r;
  const [m,setM]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setM(true),delay);return()=>clearTimeout(t)},[delay]);
  return(<svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.navy} strokeWidth={stroke} opacity={0.08}/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.gold} strokeWidth={stroke}
      strokeDasharray={circ} strokeDashoffset={m?circ-(circ*percent/100):circ}
      strokeLinecap="round" style={{transition:`stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1) ${delay}ms`}}/>
  </svg>);
}

export default function Home(){
  const router=useRouter();
  const [name,setName]=useState("Student");
  const [course,setCourse]=useState("cma");
  const [level,setLevel]=useState("foundation");
  const [group,setGroup]=useState(0);
  const [attempt,setAttempt]=useState("Nov 2026");
  const [subjects,setSubjects]=useState<any[]>([]);
  const [starredCount,setStarredCount]=useState(0);

  const readStarredCount=()=>{
    if(typeof window==="undefined")return;
    try{
      const a=JSON.parse(localStorage.getItem("somi_starred")||"[]");
      setStarredCount(Array.isArray(a)?a.length:0);
    }catch{
      setStarredCount(0);
    }
  };

  useEffect(()=>{
    const c=localStorage.getItem("somi_course")||"cma";
    const l=localStorage.getItem("somi_level")||"foundation";
    const g=parseInt(localStorage.getItem("somi_group")||"0");
    const a=localStorage.getItem("somi_attempt")||"Nov 2026";
    const n=localStorage.getItem("somi_student_name")||localStorage.getItem("somi_name")||"Student";
    setCourse(c);setLevel(l);setGroup(g);setAttempt(a);setName(n);
    setSubjects(getSubjects(c,l,g||1));
    readStarredCount();
  },[]);

  useEffect(()=>{
    const onFocus=()=>readStarredCount();
    window.addEventListener("focus",onFocus);
    return()=>window.removeEventListener("focus",onFocus);
  },[]);

  const h=new Date().getHours();
  const greeting=h<12?`What's the plan\nthis morning?`:h<17?`Back for more,\n${name}?`:`What's the plan\ntonight?`;
  const levelDisplay=level.charAt(0).toUpperCase()+level.slice(1);
  const todayTopic=subjects[0]?.title||"Select a subject";
  const daysUntilExam = daysUntilExamFromAttempt(attempt);

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{maxWidth:720,margin:"0 auto",padding:"0 20px max(100px, calc(88px + env(safe-area-inset-bottom, 0px)))"}}>
        {/* HEADER */}
        <header style={{paddingTop:"max(52px,env(safe-area-inset-top,52px))",paddingBottom:8,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <motion.div initial={{opacity:0}} animate={{opacity:1}}
            style={{display:"inline-flex",alignItems:"center",background:C.navy,color:C.gold,fontFamily:"'DM Serif Display',Georgia,serif",fontSize:15.4,padding:"4.4px 13.2px",borderRadius:4.4,transform:"rotate(-3deg)",boxShadow:`0 2px 12px ${C.navy}15`}}>
            SOM<i style={{fontStyle:"italic",fontSize:17.6}}>i</i>
          </motion.div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <motion.div whileTap={{scale:0.9}} onClick={()=>router.push("/profile")}
              style={{width:36,height:36,borderRadius:10,background:C.navy,display:"flex",alignItems:"center",justifyContent:"center",color:C.gold,fontFamily:"'DM Serif Display',serif",fontSize:15,cursor:"pointer"}}>
              {name.charAt(0).toUpperCase()}
            </motion.div>
          </div>
        </header>

        {/* GREETING */}
        <motion.section initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
          style={{padding:"36px 0 32px",position:"relative"}}>
          <span style={{position:"absolute",top:-40,left:-30,fontFamily:"'DM Serif Display',serif",fontSize:"clamp(120px,18vw,220px)",fontWeight:900,color:C.navy,opacity:0.025,lineHeight:1,userSelect:"none",pointerEvents:"none"}}>{String(daysUntilExam)}</span>
          <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(32px,7vw,42px)",fontWeight:400,color:C.navy,lineHeight:1.15,whiteSpace:"pre-line",letterSpacing:"-0.01em",position:"relative",zIndex:1}}>{greeting}</h1>
          <p style={{fontSize:14,color:C.navy,opacity:0.35,marginTop:12}}>{course.toUpperCase()} {levelDisplay} · {attempt}</p>
        </motion.section>

        {/* TODAY CARD */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
          style={{background:C.navy,borderRadius:16,padding:28,position:"relative",overflow:"hidden",marginBottom:28}}>
          <span style={{position:"absolute",top:-30,right:-10,fontFamily:"'DM Serif Display',serif",fontSize:180,fontWeight:900,color:"#fff",opacity:0.04,lineHeight:1,userSelect:"none",pointerEvents:"none"}}>{String(starredCount).padStart(2,"0")}</span>
          <div style={{position:"relative",zIndex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
              <span style={{color:C.gold,fontSize:11,fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase" as const,opacity:0.7}}>Today&apos;s Focus</span>
              <span style={{flex:1,height:1,background:C.gold,opacity:0.12}}/>
            </div>
            <div style={{color:"#fff",fontFamily:"'DM Serif Display',serif",fontSize:22,lineHeight:1.3,opacity:0.95,marginBottom:8}}>{todayTopic}</div>
            <p style={{color:C.silver,fontSize:13,lineHeight:1.5,opacity:0.7,marginBottom:20}}>Continue from where you left off</p>
            <motion.button whileTap={{scale:0.97}} onClick={()=>subjects[0]&&router.push(`/subject/${subjects[0].id}`)}
              style={{background:C.gold,color:C.navy,border:"none",borderRadius:8,padding:"10px 24px",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:`0 0 16px ${C.gold}4D`}}>
              Continue Learning
            </motion.button>
          </div>
        </motion.div>

        {/* Revision + Audio CTAs */}
        <div style={{display:"flex",gap:10,marginBottom:20}}>
          <motion.button
            initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
            transition={{delay:0.35}}
            whileTap={{scale:0.97}}
            onClick={()=>router.push("/revision")}
            style={{
              flex:1,padding:"14px 16px",borderRadius:12,
              background:"#fff",border:"1.5px solid rgba(7,23,57,0.08)",
              cursor:"pointer",display:"flex",flexDirection:"column",
              alignItems:"flex-start",gap:6,textAlign:"left",
              fontFamily:"'DM Sans',sans-serif",
            }}>
            <span style={{ display: "inline-flex", marginRight: 4 }}><SomiIcons.Star size={20} /></span>
            <div style={{fontSize:13,fontWeight:600,color:"#071739"}}>Revision</div>
            <div style={{fontSize:10,color:"#4B6382"}}>
              {starredCount>0?`${starredCount} starred`:"Star concepts"}
            </div>
          </motion.button>

          <motion.button
            initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
            transition={{delay:0.38}}
            whileTap={{scale:0.97}}
            onClick={()=>router.push("/audio")}
            style={{
              flex:1,padding:"14px 16px",borderRadius:12,
              background:"#fff",border:"1.5px solid rgba(7,23,57,0.08)",
              cursor:"pointer",display:"flex",flexDirection:"column",
              alignItems:"flex-start",gap:6,textAlign:"left",
              fontFamily:"'DM Sans',sans-serif",
            }}>
            <span style={{ display: "inline-flex", marginRight: 4 }}><SomiIcons.Headphones size={20} /></span>
            <div style={{fontSize:13,fontWeight:600,color:"#071739"}}>Audio</div>
            <div style={{fontSize:10,color:"#4B6382"}}>Listen on the go</div>
          </motion.button>
        </div>

        {/* SUBJECTS */}
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:18}}>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:18,fontWeight:400,color:C.navy}}>Your Subjects</h2>
          <span style={{fontSize:11,color:C.navy,letterSpacing:"0.08em"}}>{subjects.length} subjects</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:40}}>
          {subjects.map((s:any,i:number)=>{
            const cardGhost=paperGhostFromCode(s.code);
            return(
              <motion.div key={s.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4+i*0.06}}
                whileTap={{scale:0.98}} onClick={()=>router.push(`/subject/${s.id}`)}
                style={{position:"relative",borderRadius:14,background:"#fff",border:`1px solid ${C.navy}0A`,padding:"22px",gridColumn:"span 1",overflow:"hidden",cursor:"pointer"}}>
                <span style={{position:"absolute",top:-15,right:-5,fontFamily:"'DM Serif Display',serif",fontSize:"clamp(80px,12vw,140px)",fontWeight:900,color:C.navy,opacity:0.025,lineHeight:1,userSelect:"none",pointerEvents:"none"}}>{cardGhost}</span>
                <div style={{position:"relative",zIndex:1}}>
                  <div style={{marginBottom:12}}>
                    <span style={{fontSize:10,fontWeight:600,letterSpacing:"0.18em",textTransform:"uppercase" as const,color:C.navy}}>{s.code}</span>
                  </div>
                  <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(17px,2.5vw,20px)",fontWeight:400,color:C.navy,lineHeight:1.25,marginBottom:12,maxWidth:"85%"}}>{s.title}</h3>
                  <div>
                    <span style={{fontSize:12,color:C.navy,opacity:0.5}}>{s.chapters} chapters</span>
                    <div style={{marginTop:10,display:"inline-flex",alignItems:"center",gap:6,background:C.gold,padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:600,color:C.navy}}>Start Learning →</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <MamaAgent mode="global" studentName={name} course={course} level={level}/>
      <FloatingNav active="Home" subjectPath={subjects[0] ? `/subject/${subjects[0].id}` : undefined} />
    </div>
  );
}
