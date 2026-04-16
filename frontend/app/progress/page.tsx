"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import FloatingNav from "@/components/FloatingNav";

const C = {
  navy: "#071739",
  gold: "#E3C39D",
  silver: "#A4B5C4",
  steel: "#4B6382",
  bg: "#FAFAF8",
};

const stats = [
  { val: "68%", label: "Overall" },
  { val: "7", label: "Day streak" },
  { val: "142", label: "Questions" },
  { val: "78%", label: "Accuracy" },
];

const subjects = [
  { title: "Accounting", progress: 72 },
  { title: "Law", progress: 45 },
  { title: "Maths", progress: 28 },
];

function ProgressRing({
  percent,
  size = 56,
  stroke = 3.5,
  delay = 0,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  delay?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [m, setM] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setM(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={C.gold}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={m ? circ - (circ * percent) / 100 : circ}
        strokeLinecap="round"
        style={{
          transition: `stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        }}
      />
    </svg>
  );
}

export default function Progress() {
  const router = useRouter();
  const [course, setCourse] = useState("cma");
  const [level, setLevel] = useState("foundation");
  const [attempt, setAttempt] = useState("Nov 2026");

  useEffect(() => {
    const c = localStorage.getItem("somi_course") || "cma";
    const l = localStorage.getItem("somi_level") || "foundation";
    const a = localStorage.getItem("somi_attempt") || "Nov 2026";
    setCourse(c);
    setLevel(l);
    setAttempt(a);
  }, []);

  const levelDisplay = level.charAt(0).toUpperCase() + level.slice(1);
  const subtitle = `${course.toUpperCase()} ${levelDisplay} · ${attempt}`;
  // TODO: Replace with mastery % from API / persisted stats when backend is wired.
  const overallPct = Math.min(
    100,
    Math.max(0, parseInt(stats[0].val.replace("%", ""), 10) || 0)
  );
  const ghostMastery = String(overallPct).padStart(2, "0");

  const serif = "'DM Serif Display', serif";
  const sans = "'DM Sans', sans-serif";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: sans }}>
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          padding: `0 20px max(100px, calc(88px + env(safe-area-inset-bottom, 0px)))`,
        }}
      >
        {/* Navy header */}
        <header
          style={{
            margin: "0 -20px",
            padding: `max(16px, env(safe-area-inset-top, 16px)) 20px 20px`,
            background: C.navy,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -8,
              right: -16,
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(100px, 28vw, 160px)",
              fontWeight: 900,
              color: "#fff",
              opacity: 0.04,
              lineHeight: 1,
              userSelect: "none",
              pointerEvents: "none",
            }}
            aria-hidden
          >
            {ghostMastery}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              position: "relative",
              zIndex: 1,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1
                style={{
                  fontFamily: serif,
                  fontSize: 24,
                  fontWeight: 400,
                  color: "#fff",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Your Progress
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: C.silver,
                  margin: "8px 0 0",
                  opacity: 0.95,
                }}
              >
                {subtitle}
              </p>
            </div>
            <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
              <ProgressRing percent={overallPct} size={56} stroke={3.5} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: serif,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  pointerEvents: "none",
                }}
              >
                {overallPct}%
              </div>
            </div>
          </div>
        </header>

        <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Stats 2x2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {stats.map((s, i) => {
              const streakAccent = s.label.toLowerCase().includes("streak");
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 16,
                    border: "1px solid rgba(7,23,57,0.06)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: serif,
                      fontSize: 26,
                      fontWeight: 600,
                      color: streakAccent ? C.gold : C.navy,
                      lineHeight: 1.1,
                    }}
                  >
                    {s.val}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: C.steel, marginTop: 6 }}>
                    {s.label}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: C.navy,
              opacity: 0.4,
              marginTop: 8,
              marginBottom: -4,
            }}
          >
            Subjects
          </div>

          {subjects.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 14,
                border: "1px solid rgba(7,23,57,0.06)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "baseline" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{s.title}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.steel }}>{s.progress}%</span>
              </div>
              <div style={{ height: 6, background: "rgba(7,23,57,0.06)", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${s.progress}%`,
                    height: "100%",
                    background: C.gold,
                    borderRadius: 4,
                  }}
                />
              </div>
            </motion.div>
          ))}

          {/* Needs attention */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: C.navy,
              opacity: 0.4,
              marginTop: 8,
              marginBottom: -4,
            }}
          >
            Needs attention
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 14,
              border: "1.5px solid rgba(7,23,57,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 4 }}>
                  Depreciation — AS 10
                </div>
                <div style={{ fontSize: 12, color: C.steel }}>Quiz accuracy: 42%</div>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/lesson")}
                style={{
                  background: C.navy,
                  color: C.gold,
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: sans,
                  flexShrink: 0,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                Study →
              </motion.button>
            </div>
          </motion.div>

          {/* Mama says */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34 }}
            style={{
              background: C.navy,
              borderRadius: 12,
              padding: 16,
              borderLeft: `4px solid ${C.gold}`,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <span
              style={{
                alignSelf: "flex-start",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: C.gold,
                border: `1px solid ${C.gold}`,
                padding: "4px 10px",
                borderRadius: 4,
                fontFamily: sans,
              }}
            >
              MAMA
            </span>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.92)", lineHeight: 1.55 }}>
              “Depreciation chapter concentrate cheyyi. Strong ayite accounting lo 80% complete.”
            </p>
          </motion.div>
        </div>
      </div>

      <FloatingNav active="Progress" />
    </div>
  );
}
