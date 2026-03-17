"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Single menu item row
function MenuItem({
  icon, label, sub, arrow=true, danger=false, onTap
}: {
  icon:string, label:string, sub?:string,
  arrow?:boolean, danger?:boolean, onTap?:()=>void
}) {
  return (
    <motion.div whileTap={{ scale:0.98 }} onClick={onTap}
      style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 0", cursor: onTap?"pointer":"default", borderBottom:"0.5px solid rgba(0,0,0,0.05)" }}>
      <div style={{ width:36, height:36, borderRadius:10, background: danger?"#FEF2F2":"#F5F0E8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
        {icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color: danger?"#DC2626":"#1A1208" }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:"#A89880", marginTop:1 }}>{sub}</div>}
      </div>
      {arrow && <div style={{ fontSize:12, color:"#A89880" }}>→</div>}
    </motion.div>
  );
}

// Section label
function Section({ label }: { label:string }) {
  return (
    <div style={{ fontSize:10, fontWeight:700, color:"#A89880", letterSpacing:"0.06em", marginTop:20, marginBottom:4 }}>
      {label}
    </div>
  );
}

export default function Profile() {
  const router = useRouter();
  const [name,    setName]    = useState("Sai");
  const [course,  setCourse]  = useState("");
  const [level,   setLevel]   = useState("");
  const [attempt, setAttempt] = useState("");
  const [plan,    setPlan]    = useState("Beta Free");

  useEffect(() => {
    setCourse(localStorage.getItem("somi_course")   || "ca");
    setLevel(localStorage.getItem("somi_level")     || "Foundation");
    setAttempt(localStorage.getItem("somi_attempt") || "Nov 2026");
    setName(localStorage.getItem("somi_name")       || "Sai");
  }, []);

  const handleChangeCourse = () => {
    localStorage.removeItem("somi_course");
    localStorage.removeItem("somi_level");
    localStorage.removeItem("somi_attempt");
    router.push("/onboarding");
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <motion.div
      initial={{ opacity:0, x:40 }}
      animate={{ opacity:1, x:0 }}
      transition={{ type:"spring", stiffness:300, damping:30 }}
      className="app-shell"
      style={{ background:"#FAFAF8" }}
    >

      {/* Header */}
      <div style={{ background:"#0A2E28", padding:"20px 24px 24px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <button onClick={() => router.back()}
            style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
            ← Back
          </button>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Profile</div>
          <div style={{ width:60 }} />
        </div>

        {/* Avatar + name */}
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:56, height:56, borderRadius:18, background:"#E67E22", display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid rgba(255,255,255,0.2)", flexShrink:0 }}>
            <span style={{ fontSize:22, fontWeight:700, color:"#fff", fontFamily:"Georgia,serif" }}>
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#fff" }}>{name}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:2 }}>
              {course.toUpperCase()} · {level} · {attempt}
            </div>
            <div style={{ marginTop:6, background:"rgba(230,126,34,0.2)", color:"#E67E22", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, display:"inline-block" }}>
              {plan}
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div style={{ flex:1, padding:"8px 20px 100px", overflowY:"auto" }}>

        <Section label="ACCOUNT" />
        <MenuItem icon="👤" label="My Profile"       sub="Name, email, phone"          onTap={() => {}} />
        <MenuItem icon="📅" label="Study Plan"       sub="Your personalised schedule"  onTap={() => {}} />
        <MenuItem icon="🔔" label="Notifications"    sub="Reminders and alerts"        onTap={() => {}} />

        <Section label="COURSE" />
        <MenuItem icon="🎓" label="Course & Level"   sub={`${course.toUpperCase()} · ${level}`} onTap={handleChangeCourse} />
        <MenuItem icon="📆" label="Exam Attempt"     sub={attempt}                     onTap={handleChangeCourse} />

        <Section label="SUBSCRIPTION" />
        <MenuItem icon="💳" label="Plan & Billing"   sub={`${plan} · Upgrade to Pro`}  onTap={() => {}} />
        <MenuItem icon="⚡" label="AI Usage"         sub="Questions asked this month"  onTap={() => {}} />
        <MenuItem icon="🧾" label="Invoices"         sub="Download past bills"         onTap={() => {}} />

        <Section label="APP" />
        <MenuItem icon="⭐" label="Rate SOMI"        sub="Help us improve"             onTap={() => {}} />
        <MenuItem icon="💬" label="Send Feedback"    sub="Tell us what to build next"  onTap={() => {}} />
        <MenuItem icon="ℹ️"  label="App Version"     sub="Beta 0.1.0 · Built by Somisetty" arrow={false} />

        <Section label="" />
        <MenuItem icon="🚪" label="Log Out" danger onTap={handleLogout} />

        {/* Bottom tagline */}
        <div style={{ textAlign:"center", marginTop:24 }}>
          <div style={{ fontSize:12, fontFamily:"Georgia,serif", color:"#A89880" }}>SOMI</div>
          <div style={{ fontSize:10, color:"#C8C0B4", marginTop:2 }}>Mama explains. Kitty asks. You pass.</div>
        </div>

      </div>

    </motion.div>
  );
}