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

const subjectChapters: Record<string, number> = {
  Accounting: 8,
  Law: 6,
  Maths: 7,
  Economics: 5,
};

export default function CombinedExam() {
  const router = useRouter();
  const [subject, setSubject] = useState("Accounting");
  const [selected, setSelected] = useState<number[]>([]);

  const chapters = subjectChapters[subject] || 8;

  const toggle = (ch: number) => {
    setSelected((prev) =>
      prev.includes(ch)
        ? prev.filter((c) => c !== ch)
        : prev.length < 3
          ? [...prev, ch]
          : prev
    );
  };

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
            Combined Exam
          </div>
          <div style={{ position: "relative", zIndex: 1, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            Select any 3 chapters · 30 questions · 40 mins
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: "16px 20px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: C.steel }}>Subject</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.keys(subjectChapters).map((s) => (
              <motion.div
                key={s}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setSubject(s);
                  setSelected([]);
                }}
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.steel }}>Select chapters</div>
            <div
              style={{
                fontSize: 11,
                color: selected.length === 3 ? C.navy : C.steel,
                fontWeight: 600,
              }}
            >
              {selected.length}/3 selected
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {Array.from({ length: chapters }, (_, i) => i + 1).map((ch) => {
              const isSelected = selected.includes(ch);
              const disabled = !isSelected && selected.length >= 3;
              return (
                <motion.div
                  key={ch}
                  whileTap={!disabled ? { scale: 0.97 } : {}}
                  onClick={() => !disabled && toggle(ch)}
                  style={{
                    background: isSelected ? C.navy : disabled ? C.bg : "#fff",
                    borderRadius: 14,
                    padding: 14,
                    border: isSelected
                      ? `2px solid ${C.navy}`
                      : `1px solid rgba(7,23,57,0.06)`,
                    cursor: disabled ? "not-allowed" : "pointer",
                    textAlign: "center",
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isSelected ? "#fff" : disabled ? C.steel : C.navy,
                    }}
                  >
                    Chapter {ch}
                  </div>
                  {isSelected && (
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      <SomiIcons.Check size={10} color="rgba(255,255,255,0.85)" />
                      Selected
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {selected.length === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: C.navy, borderRadius: 14, padding: 16 }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
                Ready to start
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginBottom: 12 }}>
                {subject} · Chapters {selected.sort().join(", ")} · 30 questions · 40 mins
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  router.push(
                    `/exams/take?type=combined&subject=${subject}&chapters=${selected.join(",")}&paper=1`
                  )
                }
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
                Start Combined Exam →
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
