"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSubjects } from "@/lib/syllabus";

const C = { navy:"#071739", gold:"#E3C39D", steel:"#4B6382", silver:"#A4B5C4", sand:"#A68868", bg:"#FAFAF8" };

const chapterNameMap: Record<string, Record<number, string>> = {
  cma_f_law:{1:"Introduction to Business Laws",2:"Indian Contracts Act 1872",3:"Sale of Goods Act 1930",4:"Negotiable Instruments Act 1881",5:"Business Communication"},
  cma_f_acc:{1:"Accounting Fundamentals",2:"Accounting for Special Transactions",3:"Preparation of Final Accounts",4:"Fundamentals of Cost Accounting"},
  cma_f_maths:{1:"Arithmetic",2:"Algebra",3:"Calculus Application",4:"Statistical Representation",5:"Central Tendency & Dispersion",6:"Correlation & Regression",7:"Probability",8:"Index Numbers & Time Series"},
  cma_f_eco:{1:"Basic Concepts of Economics",2:"Forms of Market",3:"Money & Banking",4:"Economic & Business Environment",5:"Fundamentals of Management"},
};

interface NavItem { label:string; path:string; icon:"home"|"book"|"exam"|"chart"|"user"|"star"|"headphones"; }

function NavIcon({ type, active, size=18 }: { type:string; active?:boolean; size?:number }) {
  const c = active ? C.gold : "rgba(255,255,255,0.4)";
  const s = size;
  const sw = "1.8";
  switch(type) {
    case "home": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/><path d="M9 22V12h6v10" stroke={c} strokeWidth={sw}/></svg>;
    case "book": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7V3z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "exam": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={c} strokeWidth={sw}/><path d="M14 2v6h6M9 15l2 2 4-4" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "chart": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="12" width="4" height="9" rx="1" fill={c} opacity="0.3"/><rect x="10" y="8" width="4" height="13" rx="1" fill={c} opacity="0.6"/><rect x="17" y="4" width="4" height="17" rx="1" fill={c}/></svg>;
    case "user": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={c} strokeWidth={sw}/><path d="M4 21v-1a6 6 0 0112 0v1" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case "star": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case "headphones": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 18v-6a9 9 0 0118 0v6" stroke={c} strokeWidth={sw}/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z" fill={c}/></svg>;
    default: return null;
  }
}

export default function DesktopShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [name, setName] = useState("Student");
  const [course, setCourse] = useState("cma");
  const [level, setLevel] = useState("foundation");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [starredCount, setStarredCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => { setIsDesktop(window.innerWidth >= 1024); setShowRight(window.innerWidth >= 1380); };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const n = localStorage.getItem("somi_student_name") || localStorage.getItem("somi_name") || "Student";
    const c = localStorage.getItem("somi_course") || "cma";
    const l = localStorage.getItem("somi_level") || "foundation";
    const g = parseInt(localStorage.getItem("somi_group") || "0");
    setName(n); setCourse(c); setLevel(l);
    setSubjects(getSubjects(c, l, g || 1));
    try {
      const starred = JSON.parse(localStorage.getItem("somi_starred") || "[]");
      setStarredCount(Array.isArray(starred) ? starred.length : 0);
    } catch { setStarredCount(0); }
  }, [mounted]);

  // Skip pages that have their own full-width layouts
  const skipShell = ["/auth", "/onboarding", "/profile-setup"].some(p => pathname?.startsWith(p));

  if (!mounted || !isDesktop || skipShell) {
    return <>{children}</>;
  }

  const navItems: NavItem[] = [
    { label:"Home", path:"/home", icon:"home" },
    { label:"Study", path:subjects[0] ? `/subject/${subjects[0].id}` : "/home", icon:"book" },
    { label:"Exams", path:"/exams", icon:"exam" },
    { label:"Progress", path:"/progress", icon:"chart" },
    { label:"Profile", path:"/profile", icon:"user" },
  ];

  const isActive = (path: string) => {
    if (path === "/home") return pathname === "/home" || pathname === "/";
    if (path.startsWith("/subject")) return pathname?.startsWith("/subject") || pathname?.startsWith("/chapter") || pathname?.startsWith("/lesson");
    return pathname?.startsWith(path.split("?")[0]);
  };

  const levelDisplay = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#0D1B2A", fontFamily:"'DM Sans', sans-serif" }}>

      {/* ═══ LEFT SIDEBAR ═══ */}
      <aside style={{
        width: 240, flexShrink: 0, background: C.navy,
        display: "flex", flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.04)",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: "28px 24px 20px" }}>
          <div style={{ display:"inline-flex", alignItems:"center", background:"rgba(255,255,255,0.04)", padding:"5px 14px", borderRadius:5, transform:"rotate(-3deg)" }}>
            <span style={{ fontFamily:"'DM Serif Display', serif", fontSize:17, color:C.gold, letterSpacing:1 }}>SOM</span>
            <span style={{ fontFamily:"'DM Serif Display', serif", fontSize:19, fontStyle:"italic", color:C.gold }}>i</span>
          </div>
          <div style={{ fontSize:10, color:C.gold, opacity:0.35, letterSpacing:"0.15em", marginTop:8, fontWeight:600 }}>COMMERCE</div>
        </div>

        {/* Student info */}
        <div style={{ padding:"0 24px 20px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:C.gold, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Serif Display', serif", fontSize:15, color:C.navy, fontWeight:500 }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{name}</div>
              <div style={{ fontSize:10, color:C.silver, opacity:0.5 }}>{course.toUpperCase()} {levelDisplay}</div>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav style={{ padding:"16px 12px", flex:1 }}>
          {navItems.map(item => {
            const active = isActive(item.path);
            return (
              <button key={item.label} onClick={() => router.push(item.path)}
                style={{
                  width:"100%", display:"flex", alignItems:"center", gap:12,
                  padding:"10px 12px", borderRadius:10, border:"none", cursor:"pointer",
                  background: active ? "rgba(227,195,157,0.08)" : "transparent",
                  marginBottom:2, textAlign:"left",
                  fontFamily:"'DM Sans', sans-serif",
                  transition:"background 0.15s",
                }}>
                <NavIcon type={item.icon} active={active} />
                <span style={{ fontSize:13, fontWeight: active ? 600 : 400, color: active ? C.gold : "rgba(255,255,255,0.45)" }}>{item.label}</span>
                {active && <div style={{ width:4, height:4, borderRadius:2, background:C.gold, marginLeft:"auto" }}/>}
              </button>
            );
          })}

          {/* Divider */}
          <div style={{ height:1, background:"rgba(255,255,255,0.04)", margin:"14px 12px" }}/>

          {/* Quick links */}
          <button onClick={() => router.push("/revision")}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10, border:"none", cursor:"pointer", background: pathname==="/revision" ? "rgba(227,195,157,0.08)" : "transparent", marginBottom:2, textAlign:"left", fontFamily:"'DM Sans', sans-serif" }}>
            <NavIcon type="star" active={pathname==="/revision"} />
            <span style={{ fontSize:13, fontWeight: pathname==="/revision" ? 600 : 400, color: pathname==="/revision" ? C.gold : "rgba(255,255,255,0.45)" }}>Revision</span>
            {starredCount > 0 && <span style={{ marginLeft:"auto", fontSize:10, fontWeight:600, color:C.gold, opacity:0.6, background:"rgba(227,195,157,0.1)", padding:"2px 8px", borderRadius:10 }}>{starredCount}</span>}
          </button>
          <button onClick={() => router.push("/audio")}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10, border:"none", cursor:"pointer", background: pathname==="/audio" ? "rgba(227,195,157,0.08)" : "transparent", marginBottom:2, textAlign:"left", fontFamily:"'DM Sans', sans-serif" }}>
            <NavIcon type="headphones" active={pathname==="/audio"} />
            <span style={{ fontSize:13, fontWeight: pathname==="/audio" ? 600 : 400, color: pathname==="/audio" ? C.gold : "rgba(255,255,255,0.45)" }}>Audio Library</span>
          </button>

          {/* Divider */}
          <div style={{ height:1, background:"rgba(255,255,255,0.04)", margin:"14px 12px" }}/>

          {/* Subjects */}
          <div style={{ padding:"0 12px", marginBottom:8 }}>
            <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.12em", color:"rgba(255,255,255,0.2)" }}>PAPERS</span>
          </div>
          {subjects.map((s: any, i: number) => {
            const active = pathname?.includes(s.id);
            return (
              <button key={s.id} onClick={() => router.push(`/subject/${s.id}`)}
                style={{
                  width:"100%", display:"flex", alignItems:"center", gap:10,
                  padding:"8px 12px", borderRadius:8, border:"none", cursor:"pointer",
                  background: active ? "rgba(227,195,157,0.06)" : "transparent",
                  marginBottom:1, textAlign:"left", fontFamily:"'DM Sans', sans-serif",
                }}>
                <span style={{ fontSize:11, fontWeight:600, color: active ? C.gold : "rgba(255,255,255,0.25)", minWidth:14 }}>P{i+1}</span>
                <span style={{ fontSize:12, color: active ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.title}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom brand */}
        <div style={{ padding:"16px 24px", borderTop:"1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.15)", letterSpacing:"0.1em" }}>STUDENT ORIENTED</div>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.15)", letterSpacing:"0.1em" }}>MENTOR INTELLIGENCE</div>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.1)", marginTop:4 }}>SOMi Commerce v1.0</div>
        </div>
      </aside>

      {/* ═══ CENTER — MOBILE APP ═══ */}
      <main style={{
        flex: 1, marginLeft: 240,
        display: "flex", justifyContent: "center",
        background: "#0D1B2A",
        minHeight: "100vh",
      }}>
        <div style={{
          width: "100%", maxWidth: 760,
          background: C.bg,
          minHeight: "100vh",
          position: "relative",
          borderLeft: "1px solid rgba(255,255,255,0.04)",
          borderRight: "1px solid rgba(255,255,255,0.04)",
        }}>
          {children}
        </div>
      </main>

      {/* ═══ RIGHT PANEL — CONTEXT ═══ */}
      {showRight && <aside style={{
        width: 320, flexShrink: 0,
        background: C.navy,
        borderLeft: "1px solid rgba(255,255,255,0.04)",
        position: "fixed", top: 0, right: 0, bottom: 0,
        padding: "28px 20px",
        overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 20,
      }}>
        {/* MAMA card */}
        <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:14, padding:"18px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:7, fontWeight:800, color:C.gold }}>MAMA</div>
            <span style={{ fontSize:11, fontWeight:600, color:C.gold, opacity:0.6 }}>MAMA says</span>
          </div>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", lineHeight:1.7, fontStyle:"italic" }}>
            &ldquo;Night study is powerful — silence plus focus equals gold marks. Ready to learn?&rdquo;
          </p>
        </div>

        {/* Quick stats */}
        <div>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.12em", color:"rgba(255,255,255,0.2)", marginBottom:10 }}>QUICK STATS</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              { val:"12", label:"Day streak" },
              { val:"70", label:"Concepts" },
              { val:"81%", label:"Accuracy" },
              { val:"4.2h", label:"This week" },
            ].map((s,i) => (
              <div key={i} style={{ background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"12px 10px", textAlign:"center" }}>
                <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:18, color:C.gold }}>{s.val}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:2, letterSpacing:"0.08em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.12em", color:"rgba(255,255,255,0.2)", marginBottom:10 }}>RECENT</div>
          {[
            { title:"Sources of Law", sub:"Business Laws · Ch 1", time:"2h ago" },
            { title:"Consideration & Legality", sub:"Indian Contracts · Ch 2", time:"Yesterday" },
            { title:"Cost Sheet Structure", sub:"Cost Accounting · Ch 3", time:"2 days ago" },
          ].map((item, i) => (
            <div key={i} style={{ padding:"10px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div style={{ fontSize:12, fontWeight:500, color:"rgba(255,255,255,0.6)", marginBottom:2 }}>{item.title}</div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>{item.sub}</span>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.15)" }}>{item.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Keyboard shortcuts */}
        <div>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.12em", color:"rgba(255,255,255,0.2)", marginBottom:10 }}>SHORTCUTS</div>
          {[
            { keys:"→", label:"Next concept" },
            { keys:"←", label:"Previous" },
            { keys:"T", label:"Test me" },
            { keys:"S", label:"Star concept" },
            { keys:"R", label:"Report issue" },
          ].map((s, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 0" }}>
              <div style={{ minWidth:28, height:22, borderRadius:4, background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.3)", fontFamily:"monospace" }}>{s.keys}</div>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ marginTop:"auto", paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.12)", textAlign:"center", letterSpacing:"0.1em" }}>
            SOMi · Commerce · v1.0
          </div>
        </div>
      </aside>}
    </div>
  );
}
