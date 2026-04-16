"use client";

import { SomiIcons } from "@/components/SomiIcons";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

const C = {
  navy: "#071739",
  gold: "#E3C39D",
  steel: "#4B6382",
  bg: "#FAFAF8",
};

const serif = "'DM Serif Display', serif";
const sans = "'DM Sans', sans-serif";

const attempts = [
  { name: "May 2024", year: 2024, month: "May", questions: 40 },
  { name: "Nov 2023", year: 2023, month: "Nov", questions: 40 },
  { name: "May 2023", year: 2023, month: "May", questions: 40 },
  { name: "Nov 2022", year: 2022, month: "Nov", questions: 40 },
  { name: "May 2022", year: 2022, month: "May", questions: 40 },
  { name: "Nov 2021", year: 2021, month: "Nov", questions: 40 },
];

const subjects = ["Accounting", "Law", "Maths", "Economics"];

export default function PreviousPapers() {
  const router = useRouter();
  const [subject, setSubject] = useState("Accounting");
  const [selected, setSelected] = useState("");
  const [mode, setMode] = useState<"" | "chapter" | "full">("");

  return (
    <div
      className="app-shell"
      style={{ minHeight: "100vh", background: C.bg, fontFamily: sans }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div
          style={{
            background: C.navy,
            padding: "18px 20px 16px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -8,
              fontFamily: "'Playfair Display', serif",
              fontSize: 100,
              fontWeight: 900,
              color: "#fff",
              opacity: 0.04,
              pointerEvents: "none",
            }}
            aria-hidden
          >
            02
          </span>
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.75)",
                cursor: "pointer",
                fontFamily: sans,
              }}
            >
              ← Back
            </button>
          </div>
          <div
            style={{
              position: "relative",
              zIndex: 1,
              fontFamily: serif,
              fontSize: 22,
              fontWeight: 400,
              color: "#fff",
              marginBottom: 4,
            }}
          >
            Previous Papers
          </div>
          <div style={{ position: "relative", zIndex: 1, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            6 attempts · Chapter wise or full paper
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: "16px 20px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: C.steel }}>Subject</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {subjects.map((s) => (
              <motion.div
                key={s}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSubject(s)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  background: subject === s ? C.navy : "#fff",
                  border: subject === s ? "none" : `1px solid rgba(7,23,57,0.06)`,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: subject === s ? "#fff" : C.navy,
                  }}
                >
                  {s}
                </div>
              </motion.div>
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: C.steel }}>Select attempt</div>
          {attempts.map((a, i) => (
            <motion.div
              key={a.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => {
                setSelected(a.name);
                setMode("");
              }}
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: 16,
                border:
                  selected === a.name
                    ? `1.5px solid rgba(227,195,157,0.55)`
                    : `1px solid rgba(7,23,57,0.06)`,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: selected === a.name ? 12 : 0,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: C.steel, marginTop: 2 }}>
                    {a.questions} questions · {subject}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: selected === a.name ? C.gold : C.steel,
                    fontWeight: 600,
                  }}
                >
                  {selected === a.name ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Selected <SomiIcons.Check size={12} color={C.gold} />
                    </span>
                  ) : (
                    "→"
                  )}
                </div>
              </div>

              {selected === a.name && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: "flex", gap: 10 }}
                >
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMode("chapter");
                    }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 12,
                      background: mode === "chapter" ? C.navy : "rgba(7,23,57,0.05)",
                      color: mode === "chapter" ? "#fff" : C.navy,
                      fontSize: 12,
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: sans,
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <SomiIcons.BookOpen size={14} color={mode === "chapter" ? "#fff" : C.navy} />
                      Chapter Wise
                    </span>
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMode("full");
                    }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 12,
                      background: mode === "full" ? C.navy : "rgba(7,23,57,0.05)",
                      color: mode === "full" ? "#fff" : C.navy,
                      fontSize: 12,
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: sans,
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <SomiIcons.Timer size={14} color={mode === "full" ? "#fff" : C.navy} />
                      Full Paper
                    </span>
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          ))}

          {selected && mode && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: C.navy, borderRadius: 14, padding: 16 }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
                {selected} · {subject}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginBottom: 12 }}>
                {mode === "full"
                  ? "40 questions · 60 mins timed · Real exam simulation"
                  : "Browse chapter wise · Practice specific chapters"}
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (mode === "full") {
                    router.push(
                      `/exams/take?type=previous&subject=${subject}&attempt=${selected}&paper=1`
                    );
                  } else {
                    router.push(
                      `/exams/previous/${encodeURIComponent(selected)}?subject=${subject}`
                    );
                  }
                }}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 14,
                  background: C.gold,
                  color: C.navy,
                  fontSize: 14,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: sans,
                }}
              >
                {mode === "full" ? "Start Timed Paper →" : "View Chapter Wise →"}
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
