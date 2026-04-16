"use client";

import { SomiIcons } from "@/components/SomiIcons";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense } from "react";

const C = {
  navy: "#071739",
  gold: "#E3C39D",
  steel: "#4B6382",
  bg: "#FAFAF8",
};

const serif = "'DM Serif Display', serif";
const sans = "'DM Sans', sans-serif";

function ResultsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const score = parseInt(params.get("score") || "0");
  const total = parseInt(params.get("total") || "5");
  const pct = parseInt(params.get("pct") || "0");
  const type = params.get("type") || "chapter";
  const subject = params.get("subject") || "Accounting";

  const passed = pct >= 40;

  const mamaMessage =
    pct >= 80
      ? "Outstanding! You are exam ready. Mama is proud!"
      : pct >= 60
        ? "Good attempt! Review the questions you got wrong. Try again tomorrow."
        : pct >= 40
          ? "Passing score! Focus on weak concepts and try the next paper."
          : "Do not worry. Review the lesson once more. Mama will explain differently.";

  return (
    <div
      className="app-shell"
      style={{ minHeight: "100vh", background: C.bg, fontFamily: sans }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div
          style={{
            background: C.navy,
            padding: "20px 20px 18px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -8,
              right: -8,
              fontFamily: "'Playfair Display', serif",
              fontSize: 96,
              fontWeight: 900,
              color: "#fff",
              opacity: 0.04,
              pointerEvents: "none",
            }}
            aria-hidden
          >
            02
          </span>
          <div style={{ position: "relative", zIndex: 1, fontFamily: serif, fontSize: 22, fontWeight: 400, color: "#fff" }}>
            Exam Results
          </div>
          <div style={{ position: "relative", zIndex: 1, fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>
            {subject} · {type} exam
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: "20px 20px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            overflowY: "auto",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              textAlign: "center",
              border: `1px solid rgba(7,23,57,0.06)`,
              boxShadow: passed ? `inset 0 0 0 2px ${C.gold}` : undefined,
            }}
          >
            <div
              style={{
                fontFamily: serif,
                fontSize: 56,
                fontWeight: 600,
                color: C.navy,
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              {pct}%
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginBottom: 4 }}>
              {score} of {total} correct
            </div>
            <div style={{ fontSize: 13, color: C.steel }}>
              {passed ? "Passed threshold (40%)" : "Below passing marks (40%)"}
            </div>
            <div
              style={{
                display: "inline-block",
                marginTop: 12,
                background: C.gold,
                color: C.navy,
                fontSize: 12,
                fontWeight: 700,
                padding: "6px 18px",
                borderRadius: 999,
              }}
            >
              {passed ? "On track" : "Keep practicing"}
            </div>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { val: score, label: "Correct" },
              { val: total - score, label: "Wrong" },
              { val: total, label: "Total" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: 12,
                  border: `1px solid rgba(7,23,57,0.06)`,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: serif,
                    fontSize: 24,
                    fontWeight: 600,
                    color: s.label === "Wrong" ? C.steel : C.navy,
                  }}
                >
                  {s.val}
                </div>
                <div style={{ fontSize: 10, color: C.steel, marginTop: 4 }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 14,
              border: `1px solid rgba(7,23,57,0.06)`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 10, fontFamily: serif }}>
              By question type
            </div>
            {[
              { label: "Previous Papers" },
              { label: "Textbook Exact" },
              { label: "Tweaked" },
              { label: "AI Generated" },
            ].map((t) => (
              <div
                key={t.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 12, color: C.navy, fontWeight: 500 }}>{t.label}</span>
                <span style={{ fontSize: 12, color: C.steel }}>Coming soon</span>
              </div>
            ))}
          </div>

          <div
            style={{
              background: C.navy,
              borderRadius: 14,
              padding: 14,
              display: "flex",
              gap: 10,
              borderLeft: `4px solid ${C.gold}`,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "rgba(255,255,255,0.1)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>M</span>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.gold, marginBottom: 4, fontWeight: 700, letterSpacing: "0.12em" }}>
                MAMA SAYS
              </div>
              <div style={{ fontSize: 13, color: "#fff", lineHeight: 1.55 }}>“{mamaMessage}”</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/exams")}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 14,
                background: C.navy,
                color: C.gold,
                fontSize: 13,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                fontFamily: sans,
              }}
            >
              Try Another
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/home")}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 14,
                background: "#fff",
                color: C.navy,
                fontSize: 13,
                fontWeight: 700,
                border: `1px solid rgba(7,23,57,0.08)`,
                cursor: "pointer",
                fontFamily: sans,
              }}
            >
              Home
            </motion.button>
          </div>

          <div style={{ textAlign: "center" }}>
            <span
              style={{ fontSize: 11, color: C.steel, cursor: "pointer" }}
              onClick={() => router.push("/profile")}
              onKeyDown={(e) => e.key === "Enter" && router.push("/profile")}
              role="link"
              tabIndex={0}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <SomiIcons.Flag size={14} />
                Report an issue with this exam
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExamResults() {
  return (
    <Suspense fallback={<div className="app-shell" style={{ background: C.bg }} />}>
      <ResultsContent />
    </Suspense>
  );
}
