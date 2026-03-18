"use client";
// SOMI Onboarding — 4 steps for Inter/Final (adds Group selection)
// 3 steps for Foundation (no groups)

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { hasGroups } from "@/lib/syllabus";

const courses = [
  { id:"ca",  label:"CA",  full:"Chartered Accountant",         icon:"📊", color:"#185FA5", bg:"#DBEAFE",
    levels:["Foundation","Intermediate","Final"] },
  { id:"cma", label:"CMA", full:"Cost & Management Accountant", icon:"📈", color:"#3B6D11", bg:"#DCFCE7",
    levels:["Foundation","Intermediate","Final"] },
  { id:"cs",  label:"CS",  full:"Company Secretary",            icon:"⚖️", color:"#854F0B", bg:"#FEF9C3",
    levels:["Foundation","Executive","Professional"] },
];

const attempts = ["May 2026","Nov 2026","May 2027","Nov 2027"];

export default function Onboarding() {
  const router = useRouter();
  const [step,    setStep]    = useState(1);
  const [course,  setCourse]  = useState<string|null>(null);
  const [level,   setLevel]   = useState<string|null>(null);
  const [group,   setGroup]   = useState<number|null>(null);
  const [attempt, setAttempt] = useState<string|null>(null);

  const selectedCourse = courses.find(c => c.id === course);
  const needsGroup     = course && level ? hasGroups(course, level.toLowerCase()) : false;
  const totalSteps     = needsGroup ? 4 : 3;

  const handleCourse = (id: string) => { setCourse(id); setLevel(null); setGroup(null); setStep(2); };
  const handleLevel  = (l: string)  => {
    setLevel(l);
    setGroup(null);
    const ng = hasGroups(course!, l.toLowerCase());
    setStep(ng ? 3 : 3); // always go to step 3 next
  };
  const handleGroup  = (g: number) => { setGroup(g); setStep(4); };
  const handleAttempt = (a: string) => {
    setAttempt(a);
    localStorage.setItem("somi_course",  course!);
    localStorage.setItem("somi_level",   level!.toLowerCase());
    localStorage.setItem("somi_group",   group ? String(group) : "0");
    localStorage.setItem("somi_attempt", a);
    router.push("/home");
  };

  const OptionCard = ({ label, sub, icon, color, bg, onClick, selected }: any) => (
    <motion.div whileTap={{ scale:0.97 }} onClick={onClick}
      style={{ background:selected?color:bg||"#fff", borderRadius:16, padding:"16px 18px",
        border:selected?`2px solid ${color}`:"0.5px solid rgba(0,0,0,0.08)",
        display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}>
      {icon && <div style={{ fontSize:24, flexShrink:0 }}>{icon}</div>}
      <div style={{ flex:1 }}>
        <div style={{ fontSize:15, fontWeight:700, color:selected?"#fff":"#1A1208" }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:selected?"rgba(255,255,255,0.7)":"#A89880", marginTop:2 }}>{sub}</div>}
      </div>
      {selected && <div style={{ fontSize:14, color:"#fff" }}>✓</div>}
    </motion.div>
  );

  return (
    <div className="app-shell">
      <div style={{ background:"#0A2E28", padding:"24px 24px 20px" }}>
        <div style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:700, color:"#fff", marginBottom:4 }}>SOMI</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>
          {step===1 && "Let's set up your study plan"}
          {step===2 && "Which level are you studying?"}
          {step===3 && needsGroup && "Which group?"}
          {step===3 && !needsGroup && "When is your exam?"}
          {step===4 && "When is your exam?"}
        </div>
        {/* Step indicator */}
        <div style={{ display:"flex", gap:6, marginTop:14 }}>
          {Array.from({length:totalSteps},(_,i)=>i+1).map(s => (
            <div key={s} style={{ flex:1, height:3, borderRadius:2,
              background:s<=step?"#E67E22":"rgba(255,255,255,0.2)" }} />
          ))}
        </div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:5 }}>
          Step {step} of {totalSteps}
        </div>
      </div>

      <div style={{ flex:1, padding:"24px 20px 40px", display:"flex", flexDirection:"column", gap:12 }}>

        {/* STEP 1 — Course */}
        {step===1 && (
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
            style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#1A1208", fontFamily:"Georgia,serif", marginBottom:4 }}>
              Which course are you preparing for?
            </div>
            {courses.map(c => (
              <OptionCard key={c.id} label={c.label} sub={c.full}
                icon={c.icon} color={c.color} bg={c.bg}
                selected={course===c.id} onClick={() => handleCourse(c.id)} />
            ))}
          </motion.div>
        )}

        {/* STEP 2 — Level */}
        {step===2 && selectedCourse && (
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
            style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#1A1208", fontFamily:"Georgia,serif", marginBottom:4 }}>
              Which level of {selectedCourse.label}?
            </div>
            {selectedCourse.levels.map(l => (
              <OptionCard key={l} label={l}
                sub={
                  l==="Foundation" ? "Entry level · No groups · Objective questions" :
                  l==="Intermediate"||l==="Executive" ? "Mid level · 2 groups · Mixed questions" :
                  "Final level · 2 groups · Advanced questions"
                }
                color={selectedCourse.color} bg={selectedCourse.bg}
                selected={level===l} onClick={() => handleLevel(l)} />
            ))}
            <button onClick={() => setStep(1)}
              style={{ background:"none", border:"none", fontSize:12, color:"#A89880", cursor:"pointer", textAlign:"left", marginTop:4 }}>
              ← Change course
            </button>
          </motion.div>
        )}

        {/* STEP 3 — Group (only for Inter/Final) */}
        {step===3 && needsGroup && (
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
            style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#1A1208", fontFamily:"Georgia,serif", marginBottom:4 }}>
              Which group are you studying?
            </div>
            <OptionCard label="Group 1"
              sub="First 3 papers of the level"
              color="#0A2E28" bg="#E1F5EE"
              selected={group===1} onClick={() => handleGroup(1)} />
            <OptionCard label="Group 2"
              sub="Second 3-4 papers of the level"
              color="#0A2E28" bg="#E1F5EE"
              selected={group===2} onClick={() => handleGroup(2)} />
            <OptionCard label="Both Groups"
              sub="Preparing for all papers together"
              color="#E67E22" bg="#FFF7ED"
              selected={group===0} onClick={() => handleGroup(0)} />
            <button onClick={() => setStep(2)}
              style={{ background:"none", border:"none", fontSize:12, color:"#A89880", cursor:"pointer", textAlign:"left", marginTop:4 }}>
              ← Change level
            </button>
          </motion.div>
        )}

        {/* STEP 3 (Foundation) or STEP 4 (Inter/Final) — Attempt */}
        {((step===3 && !needsGroup) || step===4) && (
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
            style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#1A1208", fontFamily:"Georgia,serif", marginBottom:4 }}>
              When is your exam attempt?
            </div>
            {attempts.map(a => (
              <OptionCard key={a} label={a} color="#0A2E28" bg="#E1F5EE"
                selected={attempt===a} onClick={() => handleAttempt(a)} />
            ))}
            <button onClick={() => setStep(needsGroup ? 3 : 2)}
              style={{ background:"none", border:"none", fontSize:12, color:"#A89880", cursor:"pointer", textAlign:"left", marginTop:4 }}>
              ← Back
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
}