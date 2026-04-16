"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer, CheckCircle, XCircle, Trophy, CaretLeft, ArrowRight,
} from "@phosphor-icons/react";

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://studybuddy-production-7776.up.railway.app";

// Fallback questions used when the endpoint has no data
const FALLBACK_QUESTIONS = [
  {
    id: "fb1",
    question_text: "A contract is defined under which section of the Indian Contract Act 1872?",
    option_a: "Section 2(a)",
    option_b: "Section 2(e)",
    option_c: "Section 2(h)",
    option_d: "Section 2(i)",
    correct_option: "C",
    explanation: "Section 2(h) ICA 1872 defines contract as 'an agreement enforceable by law'.",
  },
  {
    id: "fb2",
    question_text: "Which of the following is an essential element of a valid contract?",
    option_a: "Written document",
    option_b: "Two witnesses",
    option_c: "Free consent of parties",
    option_d: "Registration",
    correct_option: "C",
    explanation: "Free consent is always essential. Other options are not always required.",
  },
  {
    id: "fb3",
    question_text: "An agreement enforceable by law is a:",
    option_a: "Promise",
    option_b: "Contract",
    option_c: "Offer",
    option_d: "Proposal",
    correct_option: "B",
    explanation: "Contract = Agreement + Enforceability by law. Section 2(h) ICA 1872.",
  },
  {
    id: "fb4",
    question_text: "Under the Sale of Goods Act 1930, 'goods' includes:",
    option_a: "Actionable claims",
    option_b: "Money",
    option_c: "Moveable property",
    option_d: "Immoveable property",
    correct_option: "C",
    explanation: "Goods means every kind of moveable property other than actionable claims and money.",
  },
  {
    id: "fb5",
    question_text: "A negotiable instrument is one which is:",
    option_a: "Transferable by endorsement and delivery",
    option_b: "Only transferable by endorsement",
    option_c: "Only transferable by delivery",
    option_d: "Not transferable",
    correct_option: "A",
    explanation: "Negotiable instruments are freely transferable by endorsement and/or delivery.",
  },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function timerColor(seconds: number, durationMins: number) {
  const totalSecs = durationMins * 60;
  if (seconds > totalSecs * 0.5) return "#16a34a";
  if (seconds > 5 * 60) return "#E3C39D";
  return "#ef4444";
}

function ExamSessionContent() {
  const router = useRouter();
  const params = useSearchParams();

  const type = params.get("type") || "mock";
  const chaptersParam = params.get("chapters") || "all";
  const questionCount = parseInt(params.get("questions") || "50");
  const durationMins = parseInt(params.get("duration") || "120");
  const passMark = parseInt(params.get("passMark") || "80");
  const course = params.get("course") || "cma";
  const paper = params.get("paper") || "1";

  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(durationMins * 60);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeUp, setTimeUp] = useState(false);

  // Fetch questions on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Try the dedicated exam endpoint first
        const url = `${API}/questions/exam?chapters=${chaptersParam}&count=${questionCount}&course=${course}&paper=${paper}&type=${type}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.questions && data.questions.length > 0) {
            setExamQuestions(data.questions.slice(0, questionCount));
            setLoading(false);
            return;
          }
        }
      } catch {
        // fall through to textbook endpoint
      }

      try {
        // Fallback: textbook endpoint per chapter
        const chapters =
          chaptersParam === "all" ? ["1"] : chaptersParam.split(",");
        const allQs: any[] = [];
        for (const ch of chapters) {
          const res = await fetch(
            `${API}/questions/textbook?course=${course}&paper=${paper}&chapter=${ch}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.questions) allQs.push(...data.questions);
          }
        }
        if (allQs.length > 0) {
          // Shuffle and trim
          const shuffled = allQs.sort(() => Math.random() - 0.5);
          setExamQuestions(shuffled.slice(0, questionCount));
        } else {
          setExamQuestions(FALLBACK_QUESTIONS.slice(0, questionCount));
        }
      } catch {
        setExamQuestions(FALLBACK_QUESTIONS.slice(0, questionCount));
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer
  useEffect(() => {
    if (submitted || loading) return;
    if (timeLeft <= 0) {
      setTimeUp(true);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, submitted, loading]);

  const handleAnswer = useCallback(
    (opt: string) => {
      if (submitted) return;
      setAnswers((prev) => ({ ...prev, [currentQ]: opt }));
    },
    [currentQ, submitted]
  );

  const handleSubmit = () => setSubmitted(true);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = examQuestions.length > 0 && answeredCount === examQuestions.length;

  // ── LOADING ──
  if (loading) {
    return (
      <div
        className="app-shell"
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#071739",
              marginBottom: 8,
            }}
          >
            Preparing your exam...
          </div>
          <div style={{ fontSize: 12, color: "#A4B5C4", lineHeight: 1.6, marginBottom: 20 }}>
            Loading questions for{" "}
            {chaptersParam === "all" ? "all chapters" : `chapter${chaptersParam.includes(",") ? "s" : ""} ${chaptersParam}`}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#071739",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS ──
  if (submitted) {
    const totalMarks = examQuestions.length * 2;
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    examQuestions.forEach((q, i) => {
      const ans = answers[i];
      if (!ans) unanswered++;
      else if (ans === q.correct_option) correct++;
      else wrong++;
    });

    const score = correct * 2;
    const pct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const passed = score >= passMark;

    return (
      <div className="app-shell">
        {/* Results header */}
        <div
          style={{
            background: "#071739",
            padding: "18px 24px 16px",
          }}
        >
          <div
            style={{
              fontFamily: "Georgia,serif",
              fontSize: 20,
              fontWeight: 700,
              color: "#fff",
              marginBottom: 2,
            }}
          >
            Exam Results
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            {type.charAt(0).toUpperCase() + type.slice(1)} Exam · CMA Foundation
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: "16px 20px 40px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Score card */}
          <div
            style={{
              background: passed
                ? "linear-gradient(135deg, #F0FDF4, #DCFCE7)"
                : "linear-gradient(135deg, #FEF2F2, #FEE2E2)",
              borderRadius: 20,
              padding: 24,
              textAlign: "center",
              border: `1.5px solid ${passed ? "rgba(22,163,74,0.2)" : "rgba(239,68,68,0.2)"}`,
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 8 }}>
              {passed ? (
                <Trophy size={40} weight="fill" color="#16a34a" />
              ) : (
                <XCircle size={40} weight="fill" color="#ef4444" />
              )}
            </div>
            <div
              style={{
                fontFamily: "Georgia,serif",
                fontSize: 52,
                fontWeight: 700,
                color: passed ? "#16a34a" : "#ef4444",
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {score}
            </div>
            <div style={{ fontSize: 14, color: "#4B6382", marginBottom: 8 }}>
              out of {totalMarks} marks
            </div>
            <div
              style={{
                display: "inline-block",
                background: passed ? "#16a34a" : "#ef4444",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                padding: "6px 20px",
                borderRadius: 20,
              }}
            >
              {passed ? "PASSED ✓" : "FAILED ✗"}
            </div>
            <div style={{ fontSize: 12, color: "#4B6382", marginTop: 10 }}>
              {pct}% · Pass mark was {passMark}/{totalMarks}
            </div>
          </div>

          {/* Breakdown */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "0.5px solid rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}
          >
            {[
              { label: "Correct", value: correct, color: "#16a34a", bg: "#F0FDF4" },
              { label: "Wrong", value: wrong, color: "#ef4444", bg: "#FEF2F2" },
              { label: "Unanswered", value: unanswered, color: "#E3C39D", bg: "rgba(227,195,157,0.08)" },
              { label: "Total Questions", value: examQuestions.length, color: "#071739", bg: "#fff" },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: item.bg,
                  borderBottom:
                    i < arr.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {item.label === "Correct" && (
                    <CheckCircle size={16} weight="fill" color="#16a34a" />
                  )}
                  {item.label === "Wrong" && (
                    <XCircle size={16} weight="fill" color="#ef4444" />
                  )}
                  <span style={{ fontSize: 13, color: "#4B6382" }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: item.color }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Mama says */}
          <div
            style={{
              background: "#071739",
              borderRadius: 16,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
              MAMA SAYS
            </div>
            <div style={{ fontSize: 12, color: "#fff", lineHeight: 1.6 }}>
              {pct >= 80
                ? '"Outstanding! You have mastered this! 🎉 You are ready for the real exam."'
                : pct >= 60
                ? '"Good effort! Review the wrong answers once and try again. You\'re close!"'
                : '"Don\'t worry — study the chapters once more and come back stronger. Mama believes in you!"'}
            </div>
          </div>

          {/* Question review */}
          <div style={{ fontSize: 12, fontWeight: 600, color: "#4B6382" }}>
            Question Review
          </div>
          {examQuestions.map((q, i) => {
            const ans = answers[i];
            const isCorrect = ans === q.correct_option;
            const isUnanswered = !ans;

            return (
              <div
                key={q.id || i}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: "12px 14px",
                  border: `1px solid ${
                    isUnanswered
                      ? "rgba(0,0,0,0.06)"
                      : isCorrect
                      ? "rgba(22,163,74,0.2)"
                      : "rgba(239,68,68,0.2)"
                  }`,
                }}
              >
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: isUnanswered ? "#A4B5C4" : isCorrect ? "#16a34a" : "#ef4444",
                      background: isUnanswered ? "rgba(7,23,57,0.04)" : isCorrect ? "#F0FDF4" : "#FEF2F2",
                      padding: "2px 8px",
                      borderRadius: 6,
                      flexShrink: 0,
                    }}
                  >
                    Q{i + 1} {isUnanswered ? "—" : isCorrect ? "✓" : "✗"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#071739", lineHeight: 1.5, marginBottom: 6 }}>
                  {q.question_text}
                </div>
                {["A", "B", "C", "D"].map((opt) => {
                  const optKey = `option_${opt.toLowerCase()}` as keyof typeof q;
                  const optText = q[optKey];
                  if (!optText) return null;
                  const isCorrectOpt = opt === q.correct_option;
                  const isUserAns = ans === opt;

                  let bg = "transparent";
                  let color = "#4B6382";
                  let fontWeight: number | string = 400;

                  if (isCorrectOpt) {
                    bg = "#F0FDF4";
                    color = "#16a34a";
                    fontWeight = 600;
                  } else if (isUserAns && !isCorrectOpt) {
                    bg = "#FEF2F2";
                    color = "#ef4444";
                    fontWeight = 600;
                  }

                  return (
                    <div
                      key={opt}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 8px",
                        borderRadius: 8,
                        background: bg,
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color,
                          width: 16,
                          flexShrink: 0,
                        }}
                      >
                        {opt}.
                      </span>
                      <span style={{ fontSize: 11, color, fontWeight }}>
                        {optText as string}
                      </span>
                      {isCorrectOpt && (
                        <CheckCircle
                          size={12}
                          weight="fill"
                          color="#16a34a"
                          style={{ marginLeft: "auto", flexShrink: 0 }}
                        />
                      )}
                    </div>
                  );
                })}
                {q.explanation && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      color: "#6B9B8A",
                      lineHeight: 1.5,
                      borderTop: "0.5px solid rgba(0,0,0,0.06)",
                      paddingTop: 8,
                    }}
                  >
                    💡 {q.explanation}
                  </div>
                )}
              </div>
            );
          })}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setAnswers({});
                setCurrentQ(0);
                setSubmitted(false);
                setTimeLeft(durationMins * 60);
                setTimeUp(false);
              }}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 14,
                background: "#071739",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              Try Again
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/exams")}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 14,
                background: "rgba(7,23,57,0.04)",
                color: "#071739",
                fontSize: 13,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              Back to Exams
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ── EXAM IN PROGRESS ──
  const q = examQuestions[currentQ];
  const selectedAns = answers[currentQ];
  const isLast = currentQ === examQuestions.length - 1;
  const tColor = timerColor(timeLeft, durationMins);
  const progressPct =
    examQuestions.length > 0 ? ((currentQ + 1) / examQuestions.length) * 100 : 0;

  return (
    <div className="app-shell">
      {/* Header with timer */}
      <div
        style={{
          background: "#071739",
          padding: "14px 20px 12px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <button
            onClick={() => {
              if (confirm("Exit exam? Your progress will be lost.")) {
                router.push("/exams");
              }
            }}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <CaretLeft size={12} weight="bold" />
            Exit
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Timer size={14} weight="fill" color={tColor} />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 15,
                fontWeight: 700,
                color: tColor,
                letterSpacing: "0.04em",
              }}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 3,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 2,
            overflow: "hidden",
            marginBottom: 6,
          }}
        >
          <motion.div
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
            style={{ height: "100%", background: "#E3C39D", borderRadius: 2 }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            Q{currentQ + 1} of {examQuestions.length}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            {answeredCount}/{examQuestions.length} answered
          </div>
        </div>
      </div>

      {/* Time up banner */}
      <AnimatePresence>
        {timeUp && !submitted && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            style={{
              background: "#FEF2F2",
              padding: "10px 20px",
              borderBottom: "1px solid rgba(239,68,68,0.2)",
              textAlign: "center",
              fontSize: 12,
              fontWeight: 600,
              color: "#ef4444",
            }}
          >
            ⏰ Time&apos;s up! Review your answers and submit.
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          flex: 1,
          padding: "14px 20px 140px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Question card */}
        {q && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.15 }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 16,
                  border: "0.5px solid rgba(0,0,0,0.06)",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#A4B5C4",
                    letterSpacing: "0.06em",
                    marginBottom: 8,
                  }}
                >
                  MCQ · 2 MARKS
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#071739",
                    lineHeight: 1.65,
                  }}
                >
                  {q.question_text}
                </div>
              </div>

              {/* Options */}
              {["A", "B", "C", "D"].map((opt) => {
                const optKey = `option_${opt.toLowerCase()}` as keyof typeof q;
                const optText = q[optKey] as string;
                if (!optText) return null;

                const isSelected = selectedAns === opt;

                return (
                  <motion.button
                    key={opt}
                    whileTap={!selectedAns ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(opt)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                      padding: "13px 14px",
                      borderRadius: 14,
                      background: isSelected ? "rgba(7,23,57,0.05)" : "#fff",
                      border: isSelected
                        ? "1.5px solid #071739"
                        : "0.5px solid rgba(0,0,0,0.08)",
                      cursor: submitted ? "default" : "pointer",
                      textAlign: "left",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: isSelected ? "#071739" : "rgba(7,23,57,0.04)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: isSelected ? "#fff" : "#A4B5C4",
                        flexShrink: 0,
                      }}
                    >
                      {opt}
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? "#071739" : "#071739",
                        flex: 1,
                      }}
                    >
                      {optText}
                    </span>
                    {isSelected && (
                      <CheckCircle size={16} weight="fill" color="#071739" />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Bottom navigation */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          borderTop: "0.5px solid rgba(0,0,0,0.06)",
          padding: "12px 20px 28px",
          zIndex: 99,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Question navigator dots (max 20 shown) */}
        {examQuestions.length <= 20 && (
          <div
            style={{
              display: "flex",
              gap: 5,
              justifyContent: "center",
              marginBottom: 4,
            }}
          >
            {examQuestions.map((_, i) => (
              <div
                key={i}
                onClick={() => setCurrentQ(i)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  cursor: "pointer",
                  background:
                    i === currentQ
                      ? "#071739"
                      : answers[i]
                      ? "#071739"
                      : "rgba(7,23,57,0.08)",
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
            disabled={currentQ === 0}
            style={{
              padding: "13px 16px",
              borderRadius: 14,
              background: currentQ === 0 ? "rgba(7,23,57,0.04)" : "rgba(7,23,57,0.08)",
              color: currentQ === 0 ? "#C5B9A8" : "#4B6382",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: currentQ === 0 ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <CaretLeft size={14} weight="bold" />
            Prev
          </motion.button>

          {!isLast ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                setCurrentQ((q) => Math.min(examQuestions.length - 1, q + 1))
              }
              style={{
                flex: 1,
                padding: "13px",
                borderRadius: 14,
                background: selectedAns ? "#071739" : "rgba(7,23,57,0.08)",
                color: selectedAns ? "#fff" : "#A4B5C4",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              Next
              <ArrowRight size={14} weight="bold" />
            </motion.button>
          ) : null}

          {(isLast || allAnswered || timeUp) && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              style={{
                flex: isLast ? 1 : undefined,
                padding: "13px 20px",
                borderRadius: 14,
                background: "#071739",
                color: "#fff",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Submit Exam →
            </motion.button>
          )}
        </div>

        {!allAnswered && !timeUp && (
          <div style={{ textAlign: "center", fontSize: 10, color: "#A4B5C4" }}>
            {examQuestions.length - answeredCount} question
            {examQuestions.length - answeredCount !== 1 ? "s" : ""} remaining
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExamSessionPage() {
  return (
    <Suspense
      fallback={
        <div
          className="app-shell"
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div style={{ color: "#071739", fontSize: 14 }}>Loading exam...</div>
        </div>
      }
    >
      <ExamSessionContent />
    </Suspense>
  );
}
