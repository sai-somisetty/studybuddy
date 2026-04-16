"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import FloatingNav from "@/components/FloatingNav";

const C = {
  navy: "#071739",
  gold: "#E3C39D",
  silver: "#A4B5C4",
  steel: "#4B6382",
  bg: "#FAFAF8",
};

const sans = "'DM Sans', sans-serif";
const serif = "'DM Serif Display', serif";

const EXAM_ATTEMPTS = ["Jun 2026", "Nov 2026", "Jun 2027"] as const;

function SectionHeading({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        color: C.navy,
        opacity: 0.45,
        fontFamily: sans,
        marginTop: 22,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid rgba(7,23,57,0.1)",
        padding: "16px 16px 14px",
        fontFamily: sans,
      }}
    >
      {children}
    </div>
  );
}

function ComingSoonPill() {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        color: C.steel,
        background: "rgba(7,23,57,0.06)",
        padding: "4px 8px",
        borderRadius: 999,
        border: "1px solid rgba(7,23,57,0.08)",
      }}
    >
      Coming Soon
    </span>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: C.steel,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

export default function Profile() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [email, setEmail] = useState("");
  const [course, setCourse] = useState("");
  const [level, setLevel] = useState("");
  const [group, setGroup] = useState("");
  const [attempt, setAttempt] = useState("");
  const [starCount, setStarCount] = useState(0);

  const loadFromStorage = useCallback(() => {
    if (typeof window === "undefined") return;
    const n =
      localStorage.getItem("somi_name") ||
      localStorage.getItem("somi_student_name") ||
      "";
    setName(n || "Student");
    setNameDraft(n || "Student");
    setEmail(localStorage.getItem("somi_email") || "");
    setCourse(localStorage.getItem("somi_course") || "ca");
    setLevel(localStorage.getItem("somi_level") || "foundation");
    setGroup(localStorage.getItem("somi_group") || "0");
    setAttempt(localStorage.getItem("somi_attempt") || "Nov 2026");
    try {
      const raw = JSON.parse(localStorage.getItem("somi_starred") || "[]");
      setStarCount(Array.isArray(raw) ? raw.length : 0);
    } catch {
      setStarCount(0);
    }
  }, []);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const nameDirty = useMemo(() => nameDraft.trim() !== name.trim(), [nameDraft, name]);

  const saveProfile = () => {
    const next = nameDraft.trim() || "Student";
    localStorage.setItem("somi_name", next);
    localStorage.setItem("somi_student_name", next);
    setName(next);
    setNameDraft(next);
  };

  const cycleAttempt = () => {
    const i = EXAM_ATTEMPTS.indexOf(attempt as (typeof EXAM_ATTEMPTS)[number]);
    const next = EXAM_ATTEMPTS[(i >= 0 ? i + 1 : 1) % EXAM_ATTEMPTS.length];
    localStorage.setItem("somi_attempt", next);
    setAttempt(next);
  };

  const handleChangeCourse = () => {
    router.push("/onboarding");
  };

  const handleLogoutReset = () => {
    localStorage.clear();
    router.push("/auth");
  };

  const groupDisplay = group && group !== "0" ? ` · Group ${group}` : "";
  const levelDisplay = level ? level.charAt(0).toUpperCase() + level.slice(1) : "";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        fontFamily: sans,
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
                fontFamily: serif,
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
                  fontFamily: sans,
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
                    fontFamily: serif,
                  }}
                >
                  {(name || "S").charAt(0).toUpperCase()}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1
                  style={{
                    fontFamily: serif,
                    fontSize: "clamp(26px, 6vw, 32px)",
                    fontWeight: 400,
                    color: "#fff",
                    lineHeight: 1.15,
                    margin: 0,
                  }}
                >
                  Hi {name || "there"}
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

          <SectionHeading>Your info</SectionHeading>
          <Card>
            <FieldLabel>Name</FieldLabel>
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Your name"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid rgba(7,23,57,0.12)",
                fontSize: 15,
                color: C.navy,
                marginBottom: 14,
                fontFamily: sans,
                background: "#FAFAF8",
              }}
            />
            <FieldLabel>Email</FieldLabel>
            <div style={{ fontSize: 14, color: C.navy, marginBottom: 14, lineHeight: 1.45 }}>
              {email || <span style={{ color: C.silver }}>Not set — sign in to add</span>}
            </div>
            <FieldLabel>Exam attempt</FieldLabel>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={cycleAttempt}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: `1.5px solid ${C.navy}`,
                background: "#fff",
                fontSize: 14,
                fontWeight: 600,
                color: C.navy,
                cursor: "pointer",
                fontFamily: sans,
                marginBottom: 14,
                textAlign: "left",
              }}
            >
              {attempt}
              <span style={{ float: "right", opacity: 0.45, fontWeight: 500 }}>Tap to change →</span>
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={saveProfile}
              disabled={!nameDirty}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "none",
                background: nameDirty ? C.navy : "rgba(7,23,57,0.08)",
                color: nameDirty ? C.gold : C.silver,
                fontSize: 14,
                fontWeight: 700,
                cursor: nameDirty ? "pointer" : "default",
                fontFamily: sans,
              }}
            >
              Save
            </motion.button>
          </Card>

          <SectionHeading>Course</SectionHeading>
          <Card>
            <FieldLabel>Current course & level</FieldLabel>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 14 }}>
              {course.toUpperCase()} · {levelDisplay}
              {groupDisplay}
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={handleChangeCourse}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: `1.5px solid ${C.navy}`,
                background: "#fff",
                fontSize: 14,
                fontWeight: 600,
                color: C.navy,
                cursor: "pointer",
                fontFamily: sans,
              }}
            >
              Change course / level / group
            </motion.button>
          </Card>

          <SectionHeading>Subscription</SectionHeading>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            style={{
              background: C.navy,
              borderRadius: 16,
              padding: "18px 18px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              boxShadow: "0 8px 24px rgba(7,23,57,0.12)",
              border: "1px solid rgba(7,23,57,0.2)",
              fontFamily: sans,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: C.gold,
                opacity: 0.55,
              }}
            >
              PLAN
            </div>
            <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: "#fff" }}>Beta Free</div>
            <div style={{ fontSize: 13, color: C.silver, opacity: 0.85, lineHeight: 1.45 }}>
              Upgrade coming soon — full MAMA + exam tools will unlock here.
            </div>
          </motion.div>

          <SectionHeading>App</SectionHeading>
          <Card>
            <Link
              href="/revision"
              style={{ textDecoration: "none", color: "inherit", display: "block", marginBottom: 14 }}
            >
              <motion.div whileTap={{ scale: 0.99 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <FieldLabel>Starred concepts</FieldLabel>
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.navy }}>
                      {starCount} saved → Revision
                    </div>
                  </div>
                  <span style={{ fontSize: 18, color: C.navy, opacity: 0.25 }} aria-hidden>
                    ›
                  </span>
                </div>
              </motion.div>
            </Link>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 0",
                borderTop: "1px solid rgba(7,23,57,0.08)",
                borderBottom: "1px solid rgba(7,23,57,0.08)",
                marginBottom: 12,
                opacity: 0.55,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Study plan</div>
                <div style={{ fontSize: 12, color: C.steel, marginTop: 2 }}>Personalised schedule</div>
              </div>
              <ComingSoonPill />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 16,
                opacity: 0.55,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Notifications</div>
                <div style={{ fontSize: 12, color: C.steel, marginTop: 2 }}>Reminders and alerts</div>
              </div>
              <ComingSoonPill />
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={handleLogoutReset}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid rgba(220,38,38,0.35)",
                background: "#FEF2F2",
                fontSize: 14,
                fontWeight: 600,
                color: "#B91C1C",
                cursor: "pointer",
                fontFamily: sans,
                marginBottom: 14,
              }}
            >
              Log out & clear all data
            </motion.button>

            <div style={{ fontSize: 12, color: C.steel, textAlign: "center", paddingTop: 4 }}>
              SOMi Commerce v1.0
            </div>
          </Card>

          <div style={{ textAlign: "center", marginTop: 24, paddingBottom: 8 }}>
            <div style={{ fontSize: 13, fontFamily: serif, color: C.navy, opacity: 0.35 }}>SOMI</div>
            <div style={{ fontSize: 11, color: C.steel, marginTop: 4, opacity: 0.7 }}>Mama explains. You pass.</div>
          </div>
        </motion.div>
      </div>

      <FloatingNav active="Profile" />
    </div>
  );
}
