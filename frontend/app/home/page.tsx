"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getSubjects } from "@/lib/syllabus";
import MamaAgent from "@/components/MamaAgent";

const C = { navy:"#071739",gold:"#E3C39D",goldLight:"#F0DCC4",steel:"#4B6382",silver:"#A4B5C4",sand:"#A68868",bg:"#FAFAF8" };

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

  useEffect(()=>{
    const c=localStorage.getItem("somi_course")||"cma";
    const l=localStorage.getItem("somi_level")||"foundation";
    const g=parseInt(localStorage.getItem("somi_group")||"0");
    const a=localStorage.getItem("somi_attempt")||"Nov 2026";
    const n=localStorage.getItem("somi_student_name")||localStorage.getItem("somi_name")||"Student";
    setCourse(c);setLevel(l);setGroup(g);setAttempt(a);setName(n);
    setSubjects(getSubjects(c,l,g||1));
  },[]);

  const h=new Date().getHours();
  const greeting=h<12?`What's the plan\nthis morning?`:h<17?`Back for more,\n${name}?`:`What's the plan\ntonight?`;
  const levelDisplay=level.charAt(0).toUpperCase()+level.slice(1);
  const stats={streak:12,weekHours:"4.2h",concepts:70,accuracy:"81%"};
  const todayTopic=subjects[0]?.title||"Select a subject";
  const subjectMeta=[
    {ghost:"05",progress:72,mastered:35,total:48,chapters:6},
    {ghost:"06",progress:41,mastered:25,total:62,chapters:8},
    {ghost:"08",progress:18,mastered:10,total:55,chapters:7},
    {ghost:"09",progress:0,mastered:0,total:40,chapters:5},
  ];

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{maxWidth:520,margin:"0 auto",padding:"0 20px"}}>
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
          <span style={{position:"absolute",top:-40,left:-30,fontFamily:"'Playfair Display',serif",fontSize:"clamp(120px,18vw,220px)",fontWeight:900,color:C.navy,opacity:0.025,lineHeight:1,userSelect:"none",pointerEvents:"none"}}>04</span>
          <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(32px,7vw,42px)",fontWeight:400,color:C.navy,lineHeight:1.15,whiteSpace:"pre-line",letterSpacing:"-0.01em",position:"relative",zIndex:1}}>{greeting}</h1>
          <p style={{fontSize:14,color:C.navy,opacity:0.35,marginTop:12}}>{course.toUpperCase()} {levelDisplay} · {attempt}</p>
        </motion.section>

        {/* STATS */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
          style={{display:"flex",borderRadius:12,border:`1px solid ${C.navy}0D`,overflow:"hidden",marginBottom:28}}>
          {[{v:String(stats.streak),l:"Day Streak",accent:true},{v:stats.weekHours,l:"This Week"},{v:String(stats.concepts),l:"Concepts"},{v:stats.accuracy,l:"Accuracy"}].map((s,i)=>(
            <div key={i} style={{flex:1,padding:"16px 0",textAlign:"center",borderRight:i<3?`1px solid ${C.navy}0A`:"none",background:s.accent?`${C.navy}06`:"transparent"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:s.accent?26:22,color:C.navy,lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:10,color:C.navy,marginTop:4,letterSpacing:"0.1em",textTransform:"uppercase" as const}}>{s.l}</div>
            </div>
          ))}
        </motion.div>

        {/* TODAY CARD */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
          style={{background:C.navy,borderRadius:16,padding:28,position:"relative",overflow:"hidden",marginBottom:28}}>
          <span style={{position:"absolute",top:-30,right:-10,fontFamily:"'Playfair Display',serif",fontSize:180,fontWeight:900,color:"#fff",opacity:0.04,lineHeight:1}}>15</span>
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

        {/* SUBJECTS */}
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:18}}>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:18,fontWeight:400,color:C.navy}}>Your Subjects</h2>
          <span style={{fontSize:11,color:C.navy,letterSpacing:"0.08em"}}>{subjects.length} subjects</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:40}}>
          {subjects.map((s:any,i:number)=>{
            const meta=subjectMeta[i]||{ghost:"00",progress:0,mastered:0,total:30,chapters:5};
            const isLocked=meta.progress===0&&i>0;
            return(
              <motion.div key={s.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4+i*0.06}}
                whileTap={!isLocked?{scale:0.98}:{}} onClick={()=>!isLocked&&router.push(`/subject/${s.id}`)}
                style={{position:"relative",borderRadius:14,background:"#fff",border:`1px solid ${C.navy}0A`,padding:"22px",gridColumn:"span 1",overflow:"hidden",cursor:isLocked?"default":"pointer",filter:isLocked?"grayscale(0.3)":"none"}}>
                <span style={{position:"absolute",top:-15,right:-5,fontFamily:"'Playfair Display',serif",fontSize:"clamp(80px,12vw,140px)",fontWeight:900,color:C.navy,opacity:0.025,lineHeight:1,userSelect:"none",pointerEvents:"none"}}>{meta.ghost}</span>
                <div style={{position:"relative",zIndex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <span style={{fontSize:10,fontWeight:600,letterSpacing:"0.18em",textTransform:"uppercase" as const,color:C.navy}}>{s.code}</span>
                    {meta.progress>0&&<OrbitalRing percent={meta.progress} size={40} delay={500+i*100}/>}
                  </div>
                  <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(17px,2.5vw,20px)",fontWeight:400,color:C.navy,lineHeight:1.25,marginBottom:12,maxWidth:"85%"}}>{s.title}</h3>
                  {meta.progress>0?(
                    <>
                      <div style={{display:"flex",gap:18,alignItems:"baseline",marginBottom:14}}>
                        <div><span style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:C.navy}}>{meta.mastered}</span><span style={{fontSize:11,color:C.navy,opacity:0.75,marginLeft:4}}>/ {meta.total} mastered</span></div>
                        <div style={{height:16,width:1,background:C.navy,opacity:0.08}}/>
                        <span style={{fontSize:12,color:C.navy,opacity:0.75}}>{meta.chapters} chapters</span>
                      </div>
                      <div style={{display:"flex",gap:3,height:4,borderRadius:2,overflow:"hidden"}}>
                        {Array.from({length:Math.min(meta.total,50)}).map((_,j)=>(<div key={j} style={{flex:1,borderRadius:1,background:j<meta.mastered?C.gold:C.navy,opacity:j<meta.mastered?0.7:0.05}}/>))}
                      </div>
                    </>
                  ):(
                    <div>
                      <span style={{fontSize:12,color:C.navy,opacity:0.6}}>{meta.total} concepts · {meta.chapters} chapters</span>
                      {isLocked&&(<div style={{marginTop:14,display:"inline-flex",alignItems:"center",gap:6,background:`${C.navy}08`,padding:"8px 16px",borderRadius:8,fontSize:12,color:C.navy,opacity:0.6}}>Start when ready</div>)}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        <div style={{height:80}}/>
      </div>
      <MamaAgent mode="global" studentName={name} course={course} level={level}/>
      <nav style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(250,250,248,0.92)",backdropFilter:"blur(20px) saturate(180%)",WebkitBackdropFilter:"blur(20px) saturate(180%)",borderTop:`1px solid ${C.navy}0A`,padding:"10px 0",paddingBottom:"max(10px,env(safe-area-inset-bottom,8px))",zIndex:100}}>
        <div style={{maxWidth:520,margin:"0 auto",display:"flex",justifyContent:"space-around",alignItems:"center"}}>
          {[{label:"Home",active:true,path:"/home"},{label:"Study",active:false,path:subjects[0]?`/subject/${subjects[0].id}`:"/home"},{label:"Exams",active:false,path:"/exams"},{label:"Profile",active:false,path:"/profile"}].map(item=>(
            <motion.button key={item.label} whileTap={{scale:0.9}} onClick={()=>router.push(item.path)}
              style={{background:"none",border:"none",padding:"6px 16px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",position:"relative"}}>
              {item.active&&<div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",width:20,height:3,borderRadius:2,background:C.gold}}/>}
              <span style={{fontSize:10,color:C.navy,opacity:item.active?1:0.3,fontWeight:item.active?600:400,letterSpacing:"0.04em"}}>{item.label}</span>
            </motion.button>
          ))}
        </div>
      </nav>
    </div>
  );
}
