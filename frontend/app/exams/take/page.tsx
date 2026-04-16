"use client";

import { SomiIcons } from "@/components/SomiIcons";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect, useRef, Suspense } from "react";

const C = {
  navy: "#071739",
  gold: "#E3C39D",
  steel: "#4B6382",
  bg: "#FAFAF8",
};

const serif = "'DM Serif Display', serif";
const sans = "'DM Sans', sans-serif";

const sampleQuestions = [
  {
    id: "q1",
    concept: "Going Concern",
    source_type: "previous_paper",
    question_text:
      "The Going Concern assumption implies that the enterprise will continue in operation for:",
    option_a: "1 year",
    option_b: "5 years",
    option_c: "Foreseeable future",
    option_d: "Indefinite period",
    correct_option: "C",
    explanation:
      "Going Concern means the enterprise is assumed to continue for the foreseeable future — not a fixed period.",
    icai_reference: "ICAI Study Material · Ch 1 · Page 12 · Para 3.1",
  },
  {
    id: "q2",
    concept: "Minor's Contract",
    source_type: "textbook_exact",
    question_text: "A contract with a minor is:",
    option_a: "Valid",
    option_b: "Voidable",
    option_c: "Void ab initio",
    option_d: "Unenforceable",
    correct_option: "C",
    explanation: "A minor's contract is void ab initio — void from the very beginning. Section 11, ICA 1872.",
    icai_reference: "ICA 1872 · Ch 1 · Page 45 · Section 11",
  },
  {
    id: "q3",
    concept: "Accrual Concept",
    source_type: "tweaked",
    question_text: "Under Accrual concept, expenses are recognised when:",
    option_a: "Cash is paid",
    option_b: "They are incurred",
    option_c: "Invoice is received",
    option_d: "Cheque is issued",
    correct_option: "B",
    explanation: "Accrual concept — expenses recognised when incurred, not when cash paid.",
    icai_reference: "ICAI Study Material · Ch 1 · Page 15 · Para 3.3",
  },
  {
    id: "q4",
    concept: "Going Concern",
    source_type: "ai_generated",
    question_text:
      "Which of the following is NOT an implication of the Going Concern assumption?",
    option_a: "Assets valued at cost",
    option_b: "Long-term liabilities classified separately",
    option_c: "Assets valued at liquidation value",
    option_d: "Business expected to continue",
    correct_option: "C",
    explanation:
      "Going Concern means assets are valued at COST — not liquidation value. Option C is the trap.",
    icai_reference: "ICAI Study Material · Ch 1 · Page 12",
  },
  {
    id: "q5",
    concept: "Consistency",
    source_type: "textbook_exact",
    question_text: "Consistency concept means:",
    option_a: "Same method used every year",
    option_b: "Different methods for different assets",
    option_c: "Method changed annually",
    option_d: "Method decided by auditor",
    correct_option: "A",
    explanation: "Consistency — same accounting method used from year to year for comparability.",
    icai_reference: "ICAI Study Material · Ch 1 · Page 18 · Para 3.4",
  },
];

const sourceStyles: Record<string, { bg: string; color: string; label: string }> = {
  previous_paper: { bg: "rgba(227,195,157,0.12)", color: C.navy, label: "Previous Paper" },
  textbook_exact: { bg: "rgba(7,23,57,0.05)", color: C.navy, label: "Textbook Exact" },
  tweaked: { bg: "rgba(227,195,157,0.08)", color: C.navy, label: "Tweaked" },
  ai_generated: { bg: "rgba(7,23,57,0.04)", color: C.steel, label: "AI Generated" },
};

function ExamContent() {
  const router = useRouter();
  const params = useSearchParams();
  const examType = params.get("type") || "chapter";
  const subject = params.get("subject") || "Accounting";
  const timeLimit =
    examType === "full" ? 5400 : examType === "half" ? 3600 : examType === "combined" ? 2400 : 1800;

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [finished, setFinished] = useState(false);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const questions = sampleQuestions;
  const question = questions[current];
  const isLast = current === questions.length - 1;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const timerColor =
    timeLeft < 300 ? "#B45309" : timeLeft < 600 ? C.gold : "rgba(255,255,255,0.95)";

  const handleSelect = (opt: string) => {
    if (answers[question.id]) return;
    setSelected(opt);
    setAnswers((prev) => ({ ...prev, [question.id]: opt }));
  };

  const handleNext = () => {
    if (isLast) {
      if (timerRef.current) clearInterval(timerRef.current);
      setFinished(true);
    } else {
      setCurrent(current + 1);
      setSelected(answers[questions[current + 1]?.id] || null);
    }
  };

  const handleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(question.id)) next.delete(question.id);
      else next.add(question.id);
      return next;
    });
  };

  if (finished) {
    const score = questions.filter((q) => answers[q.id] === q.correct_option).length;
    const pct = Math.round((score / questions.length) * 100);
    router.push(
      `/exams/results?score=${score}&total=${questions.length}&pct=${pct}&type=${examType}&subject=${subject}`
    );
    return null;
  }

  const sourceInfo = sourceStyles[question.source_type] || sourceStyles.ai_generated;

  return (
    <div
      className="app-shell"
      style={{ minHeight: "100vh", background: C.bg, fontFamily: sans }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ background: C.navy, padding: "14px 20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                {subject} · {examType}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginTop: 4 }}>
                Q{current + 1} of {questions.length}
              </div>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: "8px 16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: timerColor,
                  fontFamily: serif,
                }}
              >
                {formatTime(timeLeft)}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)" }}>remaining</div>
            </div>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" }}>
            <div
              style={{
                width: `${((current + 1) / questions.length) * 100}%`,
                height: "100%",
                background: C.gold,
                borderRadius: 2,
                transition: "width 0.3s",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 3, marginTop: 6, flexWrap: "wrap" }}>
            {questions.map((q, i) => (
              <div
                key={q.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setCurrent(i);
                  setSelected(answers[questions[i].id] || null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setCurrent(i);
                    setSelected(answers[questions[i].id] || null);
                  }
                }}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  background: flagged.has(q.id)
                    ? C.gold
                    : answers[q.id]
                      ? C.navy
                      : i === current
                        ? "#fff"
                        : "rgba(255,255,255,0.2)",
                  color: i === current ? C.navy : "#fff",
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: "14px 20px 120px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 16,
              border: `1px solid rgba(7,23,57,0.06)`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div
                style={{
                  background: sourceInfo.bg,
                  color: sourceInfo.color,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 20,
                  border: `1px solid rgba(227,195,157,0.35)`,
                }}
              >
                {sourceInfo.label}
              </div>
              <motion.div
                whileTap={{ scale: 0.9 }}
                onClick={handleFlag}
                style={{ cursor: "pointer", opacity: flagged.has(question.id) ? 1 : 0.4, display: "flex", alignItems: "center" }}
              >
                <SomiIcons.Flag size={16} />
              </motion.div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, lineHeight: 1.5 }}>{question.question_text}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(["A", "B", "C", "D"] as const).map((opt) => {
              const optKey = `option_${opt.toLowerCase()}` as keyof typeof question;
              const optText = question[optKey] as string;
              const answered = !!answers[question.id];
              const isCorrect = opt === question.correct_option;
              const isSelected = answers[question.id] === opt;

              let bg = "#fff";
              let border = `1px solid rgba(7,23,57,0.06)`;
              let color = C.navy;
              let badgeBg = "rgba(7,23,57,0.06)";
              let badgeColor = C.navy;

              if (answered && isCorrect) {
                bg = "rgba(227,195,157,0.12)";
                border = `1.5px solid ${C.gold}`;
                badgeBg = C.navy;
                badgeColor = "#fff";
              } else if (answered && isSelected) {
                bg = "rgba(7,23,57,0.04)";
                border = `1.5px solid rgba(7,23,57,0.25)`;
                badgeBg = C.steel;
                badgeColor = "#fff";
              }

              return (
                <motion.button
                  key={opt}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(opt)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "13px 14px",
                    borderRadius: 14,
                    background: bg,
                    border,
                    cursor: answered ? "default" : "pointer",
                    textAlign: "left",
                    width: "100%",
                    fontFamily: sans,
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background: badgeBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: badgeColor,
                      flexShrink: 0,
                    }}
                  >
                    {opt}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color, flex: 1 }}>{optText}</span>
                  {answered && isCorrect && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: C.navy,
                        background: C.gold,
                        padding: "2px 8px",
                        borderRadius: 20,
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      <SomiIcons.Check size={12} color={C.navy} />
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {answers[question.id] && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: 14,
                border: `1px solid rgba(7,23,57,0.06)`,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: C.steel,
                  letterSpacing: "0.08em",
                  marginBottom: 6,
                }}
              >
                EXPLANATION
              </div>
              <div style={{ fontSize: 12, color: C.navy, lineHeight: 1.6 }}>{question.explanation}</div>
              <div style={{ fontSize: 10, color: C.steel, marginTop: 6 }}>{question.icai_reference}</div>
            </motion.div>
          )}
        </div>

        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: 520,
            background: "#fff",
            borderTop: `1px solid rgba(7,23,57,0.06)`,
            padding: "12px 20px max(20px, env(safe-area-inset-bottom, 20px))",
            zIndex: 99,
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            {current > 0 && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setCurrent(current - 1);
                  setSelected(answers[questions[current - 1].id] || null);
                }}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: 14,
                  background: "rgba(7,23,57,0.04)",
                  color: C.navy,
                  fontSize: 14,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: sans,
                }}
              >
                ← Prev
              </motion.button>
            )}
            {answers[question.id] && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                style={{
                  flex: 2,
                  padding: "14px",
                  borderRadius: 14,
                  background: C.navy,
                  color: C.gold,
                  fontSize: 14,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: sans,
                }}
              >
                {isLast ? "Submit Exam →" : "Next →"}
              </motion.button>
            )}
            {!answers[question.id] && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: 14,
                  background: "rgba(7,23,57,0.04)",
                  color: C.steel,
                  fontSize: 13,
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: sans,
                }}
              >
                Skip →
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExamTake() {
  return (
    <Suspense
      fallback={
        <div
          className="app-shell"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: C.bg,
            minHeight: "100vh",
          }}
        >
          <div style={{ color: "#071739", fontSize: 16, fontFamily: "'DM Sans', sans-serif" }}>Loading exam...</div>
        </div>
      }
    >
      <ExamContent />
    </Suspense>
  );
}
