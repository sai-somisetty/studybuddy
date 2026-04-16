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

export default function FullExam() {
  const router = useRouter();
  const [subject, setSubject] = useState("Accounting");
  const [paper, setPaper] = useState(0);

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
            Full Portion Exam
          </div>
          <div style={{ position: "relative", zIndex: 1, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            60 questions · 90 mins · 10 unique papers
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
          <div
            style={{
              background: "linear-gradient(135deg, rgba(227,195,157,0.14), rgba(7,23,57,0.04))",
              borderRadius: 14,
              padding: 12,
              border: `1px solid rgba(7,23,57,0.06)`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <SomiIcons.Warning size={14} />
              Use in final 4 weeks
            </div>
            <div style={{ fontSize: 11, color: C.steel, lineHeight: 1.5 }}>
              Full portion exams simulate real CA/CMA exam conditions. 60 questions, 90 minutes, full syllabus coverage.
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: C.steel }}>Subject</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Accounting", "Law", "Maths", "Economics"].map((s) => (
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

          <div style={{ fontSize: 12, fontWeight: 600, color: C.steel }}>Select paper (1–10)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((p) => (
              <motion.div
                key={p}
                whileTap={{ scale: 0.97 }}
                onClick={() => setPaper(p)}
                style={{
                  padding: "12px 0",
                  borderRadius: 12,
                  background: paper === p ? C.navy : "#fff",
                  border: paper === p ? "none" : `1px solid rgba(7,23,57,0.06)`,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: paper === p ? "#fff" : C.navy,
                    fontFamily: serif,
                  }}
                >
                  P{p}
                </div>
              </motion.div>
            ))}
          </div>

          {paper > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: C.navy, borderRadius: 14, padding: 16 }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
                Ready to start
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginBottom: 12 }}>
                {subject} · Full Syllabus · Paper {paper} · 60 questions · 90 mins
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  router.push(`/exams/take?type=full&subject=${subject}&paper=${paper}`)
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
                Start Full Exam →
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
