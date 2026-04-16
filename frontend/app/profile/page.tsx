"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function MenuItem({ icon, label, sub, arrow=true, danger=false, onTap }: {
  icon:string, label:string, sub?:string,
  arrow?:boolean, danger?:boolean, onTap?:()=>void
}) {
  return (
    <motion.div whileTap={{ scale:0.98 }} onClick={onTap}
      style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 0", cursor:onTap?"pointer":"default", borderBottom:"0.5px solid rgba(0,0,0,0.05)" }}>
      <div style={{ width:36, height:36, borderRadius:10, background:danger?"#FEF2F2":"rgba(7,23,57,0.04)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
        {icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:danger?"#DC2626":"#071739" }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:"#A4B5C4", marginTop:1 }}>{sub}</div>}
      </div>
      {arrow && <div style={{ fontSize:12, color:"#A4B5C4" }}>→</div>}
    </motion.div>
  );
}

function Section({ label }: { label:string }) {
  return (
    <div style={{ fontSize:10, fontWeight:700, color:"#A4B5C4", letterSpacing:"0.06em", marginTop:20, marginBottom:4 }}>
      {label}
    </div>
  );
}

export default function Profile() {
  const router = useRouter();
  const [name,    setName]    = useState("Sai");
  const [course,  setCourse]  = useState("");
  const [level,   setLevel]   = useState("");
  const [group,   setGroup]   = useState("");
  const [attempt, setAttempt] = useState("");
  const [plan,    setPlan]    = useState("Beta Free");

  useEffect(() => {
    setName(localStorage.getItem("somi_name")      || "Sai");
    setCourse(localStorage.getItem("somi_course")  || "ca");
    setLevel(localStorage.getItem("somi_level")    || "foundation");
    setGroup(localStorage.getItem("somi_group")    || "0");
    setAttempt(localStorage.getItem("somi_attempt")|| "Nov 2026");
  }, []);

  const handleChangeCourse = () => {
    // Clear all course settings → onboarding from scratch
    localStorage.removeItem("somi_course");
    localStorage.removeItem("somi_level");
    localStorage.removeItem("somi_group");
    localStorage.removeItem("somi_attempt");
    router.push("/onboarding");
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const groupDisplay = group && group !== "0" ? ` · Group ${group}` : "";
  const levelDisplay = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <motion.div
      initial={{ opacity:0, x:40 }}
      animate={{ opacity:1, x:0 }}
      transition={{ type:"spring", stiffness:300, damping:30 }}
      className="app-shell"
    >
      {/* Header */}
      <div style={{ background:"#071739", padding:"20px 24px 24px" }}>
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
          <div style={{ width:56, height:56, borderRadius:18, background:"#E3C39D", display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid rgba(255,255,255,0.2)", flexShrink:0 }}>
            <span style={{ fontSize:22, fontWeight:700, color:"#fff", fontFamily:"Georgia,serif" }}>
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#fff" }}>{name}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:2 }}>
              {course.toUpperCase()} · {levelDisplay}{groupDisplay} · {attempt}
            </div>
            <div style={{ marginTop:6, background:"rgba(227,195,157,0.15)", color:"#E3C39D", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, display:"inline-block" }}>
              {plan}
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div style={{ flex:1, padding:"8px 20px 100px", overflowY:"auto" }}>

        <Section label="ACCOUNT" />
        <MenuItem icon="👤" label="My Profile"     sub="Name, email, phone"         onTap={() => {}} />
        <MenuItem icon="📅" label="Study Plan"     sub="Your personalised schedule" onTap={() => {}} />
        <MenuItem icon="🔔" label="Notifications"  sub="Reminders and alerts"       onTap={() => {}} />

        <Section label="COURSE" />
        <MenuItem icon="🎓" label="Course & Level"
          sub={`${course.toUpperCase()} · ${levelDisplay}${groupDisplay}`}
          onTap={handleChangeCourse} />
        <MenuItem icon="📆" label="Exam Attempt"
          sub={attempt}
          onTap={handleChangeCourse} />
        <motion.div whileTap={{ scale:0.97 }} onClick={handleChangeCourse}
          style={{ background:"rgba(7,23,57,0.05)", borderRadius:14, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", border:"0.5px solid rgba(14,102,85,0.2)", cursor:"pointer", marginTop:10 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#071739" }}>Change Course / Level / Group</div>
            <div style={{ fontSize:11, color:"#071739", opacity:0.7, marginTop:2 }}>Switch CA / CMA / CS, level or group</div>
          </div>
          <div style={{ fontSize:14, color:"#071739" }}>→</div>
        </motion.div>

        <Section label="SUBSCRIPTION" />
        <MenuItem icon="💳" label="Plan & Billing"  sub={`${plan} · Upgrade to Pro`} onTap={() => {}} />
        <MenuItem icon="⚡" label="AI Usage"        sub="Questions asked this month" onTap={() => {}} />
        <MenuItem icon="🧾" label="Invoices"        sub="Download past bills"        onTap={() => {}} />

        <Section label="FEEDBACK" />
        <MenuItem icon="🚩" label="Report a Bug"    sub="Help us fix issues fast"    onTap={() => router.push("/bug-report")} />
        <MenuItem icon="⭐" label="Rate SOMI"       sub="Help us improve"            onTap={() => {}} />
        <MenuItem icon="💬" label="Send Feedback"   sub="Tell us what to build next" onTap={() => {}} />

        <Section label="APP" />
        <MenuItem icon="ℹ️"  label="App Version"    sub="Beta 0.1.0 · Built by Somisetty" arrow={false} />

        <Section label="" />
        <MenuItem icon="🚪" label="Log Out" danger onTap={handleLogout} />

        {/* Bottom tagline */}
        <div style={{ textAlign:"center", marginTop:24 }}>
          <div style={{ fontSize:12, fontFamily:"Georgia,serif", color:"#A4B5C4" }}>SOMI</div>
          <div style={{ fontSize:10, color:"#C8C0B4", marginTop:2 }}>Mama explains. You pass.</div>
        </div>

      </div>

    </motion.div>
  );
}