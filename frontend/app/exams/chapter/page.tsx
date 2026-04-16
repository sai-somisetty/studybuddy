"use client";

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

const subjects = [
  { id: "accounting", label: "Accounting", chapters: 8 },
  { id: "law", label: "Law", chapters: 6 },
  { id: "maths", label: "Maths", chapters: 7 },
  { id: "economics", label: "Economics", chapters: 5 },
];

export default function ChapterExam() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState(0);

  const selected = subjects.find((s) => s.id === subject);

  const handleStart = () => {
    if (!subject || !chapter) return;
    router.push(
      `/exams/take?type=chapter&subject=${subject}&chapters=${chapter}&paper=1`
    );
  };

  return (
    <div
      className="app-shell"
      style={{ minHeight: "100vh", background: C.bg, fontFamily: sans }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
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
            Chapter Exam
          </div>
          <div style={{ position: "relative", zIndex: 1, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            20 questions · 30 minutes · All 4 question types
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: "20px 20px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: C.steel }}>Select subject</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {subjects.map((s) => (
              <motion.div
                key={s.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setSubject(s.id);
                  setChapter(0);
                }}
                style={{
                  background: subject === s.id ? C.navy : "#fff",
                  borderRadius: 14,
                  padding: 14,
                  border:
                    subject === s.id
                      ? `2px solid ${C.navy}`
                      : `1px solid rgba(7,23,57,0.06)`,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: subject === s.id ? "#fff" : C.navy,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: subject === s.id ? "rgba(255,255,255,0.65)" : C.steel,
                    marginTop: 2,
                  }}
                >
                  {s.chapters} chapters
                </div>
              </motion.div>
            ))}
          </div>

          {selected && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.steel, marginBottom: 10 }}>
                Select chapter
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Array.from({ length: selected.chapters }, (_, i) => i + 1).map((ch) => (
                  <motion.div
                    key={ch}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setChapter(ch)}
                    style={{
                      background: chapter === ch ? "rgba(227,195,157,0.12)" : "#fff",
                      borderRadius: 14,
                      padding: "12px 16px",
                      border:
                        chapter === ch
                          ? `1.5px solid rgba(227,195,157,0.55)`
                          : `1px solid rgba(7,23,57,0.06)`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: chapter === ch ? 600 : 400,
                        color: C.navy,
                      }}
                    >
                      Chapter {ch}
                    </div>
                    {chapter === ch && (
                      <div style={{ fontSize: 12, color: C.navy, fontWeight: 700 }}>Selected ✓</div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {subject && chapter > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: C.navy, borderRadius: 14, padding: 16 }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
                Ready to start
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginBottom: 12 }}>
                {selected?.label} · Chapter {chapter} · 20 questions · 30 mins
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleStart}
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
                Start Exam →
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
