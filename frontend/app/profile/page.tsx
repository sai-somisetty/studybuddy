"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import FloatingNav from "@/components/FloatingNav";

const C = {
  navy: "#071739",
  gold: "#E3C39D",
  silver: "#A4B5C4",
  steel: "#4B6382",
  bg: "#FAFAF8",
};

function MenuItem({
  icon,
  label,
  sub,
  arrow = true,
  danger = false,
  onTap,
}: {
  icon: string;
  label: string;
  sub?: string;
  arrow?: boolean;
  danger?: boolean;
  onTap?: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      disabled={!onTap}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        marginBottom: 8,
        cursor: onTap ? "pointer" : "default",
        textAlign: "left",
        background: "#fff",
        borderRadius: 12,
        border: "1px solid rgba(7,23,57,0.06)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: danger ? "#FEF2F2" : "rgba(7,23,57,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: danger ? "#DC2626" : C.navy,
          }}
        >
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: C.steel, marginTop: 2, lineHeight: 1.35 }}>
            {sub}
          </div>
        )}
      </div>
      {arrow && (
        <span style={{ fontSize: 14, color: C.navy, opacity: 0.2, flexShrink: 0 }} aria-hidden>
          ›
        </span>
      )}
    </motion.button>
  );
}

function Section({ label }: { label: string }) {
  if (!label) return null;
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        color: C.navy,
        opacity: 0.4,
        fontFamily: "'DM Sans', sans-serif",
        marginTop: 24,
        marginBottom: 10,
      }}
    >
      {label}
    </div>
  );
}

export default function Profile() {
  const router = useRouter();
  const [name, setName] = useState("Sai");
  const [course, setCourse] = useState("");
  const [level, setLevel] = useState("");
  const [group, setGroup] = useState("");
  const [attempt, setAttempt] = useState("");
  const [plan, setPlan] = useState("Beta Free");

  useEffect(() => {
    setName(
      localStorage.getItem("somi_student_name") ||
        localStorage.getItem("somi_name") ||
        "Sai"
    );
    setCourse(localStorage.getItem("somi_course") || "ca");
    setLevel(localStorage.getItem("somi_level") || "foundation");
    setGroup(localStorage.getItem("somi_group") || "0");
    setAttempt(localStorage.getItem("somi_attempt") || "Nov 2026");
  }, []);

  const handleChangeCourse = () => {
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
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          padding: `0 20px max(100px, calc(88px + env(safe-area-inset-bottom, 0px)))`,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
        >
          {/* Navy hero */}
          <div
            style={{
              background: C.navy,
              borderRadius: "0 0 20px 20px",
              marginLeft: -20,
              marginRight: -20,
              paddingLeft: 20,
              paddingRight: 20,
              paddingTop: "max(16px, env(safe-area-inset-top, 16px))",
              paddingBottom: 28,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: -16,
                right: -8,
                fontFamily: "'Playfair Display', serif",
                fontWeight: 900,
                fontSize: "clamp(100px, 22vw, 160px)",
                color: "#fff",
                opacity: 0.04,
                lineHeight: 1,
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              03
            </span>

            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <button
                type="button"
                onClick={() => router.back()}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.75)",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                ← Back
              </button>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  color: C.gold,
                  opacity: 0.5,
                }}
              >
                PROFILE
              </span>
              <div style={{ width: 72 }} />
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: C.gold,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid rgba(255,255,255,0.25)",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: C.navy,
                    fontFamily: "'DM Serif Display', serif",
                  }}
                >
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: "clamp(26px, 6vw, 32px)",
                    fontWeight: 400,
                    color: "#fff",
                    lineHeight: 1.15,
                    margin: 0,
                  }}
                >
                  Hi {name}
                </h1>
                <p
                  style={{
                    fontSize: 13,
                    color: C.silver,
                    opacity: 0.85,
                    marginTop: 8,
                    marginBottom: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {course.toUpperCase()} {levelDisplay} · {attempt}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            style={{
              marginTop: 20,
              background: C.navy,
              borderRadius: 16,
              padding: "18px 18px 16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 8px 24px rgba(7,23,57,0.12)",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: C.gold,
                  opacity: 0.55,
                  marginBottom: 4,
                }}
              >
                SUBSCRIPTION
              </div>
              <div
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 20,
                  fontWeight: 400,
                  color: "#fff",
                }}
              >
                {plan}
              </div>
              <div style={{ fontSize: 12, color: C.silver, opacity: 0.65, marginTop: 4 }}>
                Unlock full MAMA + exam tools
              </div>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => {}}
              style={{
                flexShrink: 0,
                padding: "10px 18px",
                borderRadius: 10,
                background: C.gold,
                color: C.navy,
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Upgrade
            </motion.button>
          </motion.div>

          {/* Settings */}
          <div style={{ paddingTop: 8 }}>
            <Section label="Account" />
            <MenuItem icon="👤" label="My Profile" sub="Name, email, phone" onTap={() => {}} />
            <MenuItem icon="📅" label="Study Plan" sub="Your personalised schedule" onTap={() => {}} />
            <MenuItem icon="🔔" label="Notifications" sub="Reminders and alerts" onTap={() => {}} />

            <Section label="Course" />
            <MenuItem
              icon="🎓"
              label="Course & Level"
              sub={`${course.toUpperCase()} · ${levelDisplay}${groupDisplay}`}
              onTap={handleChangeCourse}
            />
            <MenuItem icon="📆" label="Exam Attempt" sub={attempt} onTap={handleChangeCourse} />
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={handleChangeCourse}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "14px 16px",
                marginBottom: 8,
                background: "#fff",
                borderRadius: 12,
                border: "1px solid rgba(7,23,57,0.06)",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Change Course / Level / Group</div>
                <div style={{ fontSize: 12, color: C.steel, marginTop: 2 }}>
                  Switch CA / CMA / CS, level or group
                </div>
              </div>
              <span style={{ fontSize: 14, color: C.navy, opacity: 0.2 }}>›</span>
            </motion.button>

            <Section label="Billing" />
            <MenuItem icon="💳" label="Plan & Billing" sub={`${plan} · payment methods`} onTap={() => {}} />
            <MenuItem icon="⚡" label="AI Usage" sub="Questions asked this month" onTap={() => {}} />
            <MenuItem icon="🧾" label="Invoices" sub="Download past bills" onTap={() => {}} />

            <Section label="Feedback" />
            <MenuItem icon="🚩" label="Report a Bug" sub="Help us fix issues fast" onTap={() => router.push("/bug-report")} />
            <MenuItem icon="⭐" label="Rate SOMI" sub="Help us improve" onTap={() => {}} />
            <MenuItem icon="💬" label="Send Feedback" sub="Tell us what to build next" onTap={() => {}} />

            <Section label="App" />
            <MenuItem icon="ℹ️" label="App Version" sub="Beta 0.1.0 · Built by Somisetty" arrow={false} onTap={() => {}} />

            <div style={{ height: 8 }} />
            <MenuItem icon="🚪" label="Log Out" danger arrow={false} onTap={handleLogout} />

            <div style={{ textAlign: "center", marginTop: 28, paddingBottom: 8 }}>
              <div
                style={{
                  fontSize: 13,
                  fontFamily: "'DM Serif Display', serif",
                  color: C.navy,
                  opacity: 0.35,
                }}
              >
                SOMI
              </div>
              <div style={{ fontSize: 11, color: C.steel, marginTop: 4, opacity: 0.7 }}>
                Mama explains. You pass.
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <FloatingNav active="Profile" />
    </div>
  );
}
