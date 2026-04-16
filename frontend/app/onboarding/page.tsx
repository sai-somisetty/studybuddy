"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { hasGroups } from "@/lib/syllabus";
import { SomiIcons } from "@/components/SomiIcons";

const C = {
  navy: "#071739",
  gold: "#E3C39D",
  silver: "#A4B5C4",
  steel: "#4B6382",
};

const sans = "'DM Sans', sans-serif";
const serif = "'DM Serif Display', serif";

const courses = [
  {
    id: "ca",
    label: "CA",
    full: "Chartered Accountant",
    icon: <SomiIcons.Chart size={24} /> as ReactNode,
    levels: ["Foundation", "Intermediate", "Final"],
  },
  {
    id: "cma",
    label: "CMA",
    full: "Cost & Management Accountant",
    icon: <SomiIcons.TrendingUp size={24} /> as ReactNode,
    levels: ["Foundation", "Intermediate", "Final"],
  },
  {
    id: "cs",
    label: "CS",
    full: "Company Secretary",
    icon: <SomiIcons.Scale size={24} /> as ReactNode,
    levels: ["Foundation", "Executive", "Professional"],
  },
];

const attempts = ["May 2026", "Nov 2026", "May 2027", "Nov 2027"];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [course, setCourse] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [group, setGroup] = useState<number | null>(null);
  const [attempt, setAttempt] = useState<string | null>(null);

  const selectedCourse = courses.find((c) => c.id === course);
  const needsGroup = course && level ? hasGroups(course, level.toLowerCase()) : false;
  const totalSteps = needsGroup ? 4 : 3;

  const handleCourse = (id: string) => {
    setCourse(id);
    setLevel(null);
    setGroup(null);
    setStep(2);
  };
  const handleLevel = (l: string) => {
    setLevel(l);
    setGroup(null);
    setStep(3);
  };
  const handleGroup = (g: number) => {
    setGroup(g);
    setStep(4);
  };
  const handleAttempt = (a: string) => {
    setAttempt(a);
    localStorage.setItem("somi_course", course!);
    localStorage.setItem("somi_level", level!.toLowerCase());
    localStorage.setItem("somi_group", group ? String(group) : "0");
    localStorage.setItem("somi_attempt", a);
    router.push("/home");
  };

  const OptionCard = ({
    label,
    sub,
    icon,
    onClick,
    selected,
  }: {
    label: string;
    sub?: string;
    icon?: ReactNode;
    onClick: () => void;
    selected: boolean;
  }) => (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        background: "#fff",
        borderRadius: 14,
        padding: "16px 18px",
        border: selected ? `2px solid ${C.gold}` : "1px solid rgba(7,23,57,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        fontFamily: sans,
        boxSizing: "border-box",
      }}
    >
      {icon && <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{icon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: selected ? C.gold : C.navy,
          }}
        >
          {label}
        </div>
        {sub && (
          <div
            style={{
              fontSize: 11,
              color: C.steel,
              marginTop: 4,
              lineHeight: 1.4,
            }}
          >
            {sub}
          </div>
        )}
      </div>
      {selected && (
        <span style={{ display: "flex", alignItems: "center" }} aria-hidden>
          <SomiIcons.Check size={14} color={C.gold} />
        </span>
      )}
    </motion.button>
  );

  const stepLabel =
    step === 1
      ? "Let's set up your study plan"
      : step === 2
        ? "Which level are you studying?"
        : step === 3 && needsGroup
          ? "Which group?"
          : step === 3 && !needsGroup
            ? "When is your exam?"
            : "When is your exam?";

  return (
    <div
      className="app-shell"
      style={{
        minHeight: "100vh",
        background: C.navy,
        fontFamily: sans,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: `max(20px, env(safe-area-inset-top, 20px)) 20px 16px`,
          maxWidth: 520,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            border: `1px solid ${C.gold}`,
            color: C.gold,
            fontFamily: sans,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.18em",
            padding: "5px 10px",
            borderRadius: 4,
            marginBottom: 12,
          }}
        >
          MAMA
        </div>

        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: "#fff", marginBottom: 6 }}>SOMI</div>
        <div style={{ fontSize: 13, color: C.silver, lineHeight: 1.45, marginBottom: 18 }}>{stepLabel}</div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => {
            const done = s < step;
            const current = s === step;
            return (
              <div
                key={s}
                title={`Step ${s}`}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: done ? C.gold : "transparent",
                  border: done
                    ? `2px solid ${C.gold}`
                    : current
                      ? `2px solid ${C.gold}`
                      : `2px solid rgba(255,255,255,0.4)`,
                }}
              />
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>
          Step {step} of {totalSteps}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: "8px 20px max(40px, env(safe-area-inset-bottom, 40px))",
          maxWidth: 520,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#fff",
                fontFamily: serif,
                marginBottom: 4,
              }}
            >
              Which course are you preparing for?
            </div>
            {courses.map((c) => (
              <OptionCard
                key={c.id}
                label={c.label}
                sub={c.full}
                icon={c.icon}
                selected={course === c.id}
                onClick={() => handleCourse(c.id)}
              />
            ))}
          </motion.div>
        )}

        {step === 2 && selectedCourse && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#fff",
                fontFamily: serif,
                marginBottom: 4,
              }}
            >
              Which level of {selectedCourse.label}?
            </div>
            {selectedCourse.levels.map((l) => (
              <OptionCard
                key={l}
                label={l}
                sub={
                  l === "Foundation"
                    ? "Entry level · No groups · Objective questions"
                    : l === "Intermediate" || l === "Executive"
                      ? "Mid level · 2 groups · Mixed questions"
                      : "Final level · 2 groups · Advanced questions"
                }
                selected={level === l}
                onClick={() => handleLevel(l)}
              />
            ))}
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                background: "none",
                border: "none",
                fontSize: 13,
                color: C.silver,
                cursor: "pointer",
                textAlign: "left",
                marginTop: 4,
                fontFamily: sans,
              }}
            >
              ← Change course
            </button>
          </motion.div>
        )}

        {step === 3 && needsGroup && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#fff",
                fontFamily: serif,
                marginBottom: 4,
              }}
            >
              Which group are you studying?
            </div>
            <OptionCard
              label="Group 1"
              sub="First 3 papers of the level"
              selected={group === 1}
              onClick={() => handleGroup(1)}
            />
            <OptionCard
              label="Group 2"
              sub="Second 3–4 papers of the level"
              selected={group === 2}
              onClick={() => handleGroup(2)}
            />
            <OptionCard
              label="Both Groups"
              sub="Preparing for all papers together"
              selected={group === 0}
              onClick={() => handleGroup(0)}
            />
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{
                background: "none",
                border: "none",
                fontSize: 13,
                color: C.silver,
                cursor: "pointer",
                textAlign: "left",
                marginTop: 4,
                fontFamily: sans,
              }}
            >
              ← Change level
            </button>
          </motion.div>
        )}

        {((step === 3 && !needsGroup) || step === 4) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#fff",
                fontFamily: serif,
                marginBottom: 4,
              }}
            >
              When is your exam attempt?
            </div>
            {attempts.map((a) => (
              <OptionCard key={a} label={a} selected={attempt === a} onClick={() => handleAttempt(a)} />
            ))}
            <button
              type="button"
              onClick={() => setStep(needsGroup ? 3 : 2)}
              style={{
                background: "none",
                border: "none",
                fontSize: 13,
                color: C.silver,
                cursor: "pointer",
                textAlign: "left",
                marginTop: 4,
                fontFamily: sans,
              }}
            >
              ← Back
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
