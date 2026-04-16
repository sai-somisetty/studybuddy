"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  FileText,
  Shuffle,
  Sparkle,
  Timer,
  CheckCircle,
} from "@phosphor-icons/react";
import FloatingNav from "@/components/FloatingNav";
import { SomiIcons } from "@/components/SomiIcons";

const C = {
  navy: "#071739",
  gold: "#E3C39D",
  silver: "#A4B5C4",
  steel: "#4B6382",
  bg: "#FAFAF8",
};

const serif = "'DM Serif Display', serif";
const sans = "'DM Sans', sans-serif";

const EXAM_TYPES = [
  {
    id: "chapter",
    icon: <BookOpen size={22} weight="duotone" color={C.navy} />,
    label: "Chapter Exam",
    sub: "50 questions · 120 mins · 100 marks",
    description: "Full chapter deep test — real exam pressure",
  },
  {
    id: "combined",
    icon: <Shuffle size={22} weight="duotone" color={C.navy} />,
    label: "Combined Exam",
    sub: "50 questions · 120 mins · 100 marks",
    description: "Mix chapters — like real paper distribution",
  },
  {
    id: "previous",
    icon: <FileText size={22} weight="duotone" color={C.navy} />,
    label: "Previous Papers",
    sub: "50 questions · 120 mins · 100 marks",
    description: "Real ICMAI past exam questions",
  },
  {
    id: "mock",
    icon: <Sparkle size={22} weight="duotone" color={C.navy} />,
    label: "Mock Exam",
    sub: "50 questions · 120 mins · 100 marks",
    description: "Full paper simulation — all chapters",
  },
];

const CHAPTERS = [
  { num: 1, title: "Introduction to Business Laws" },
  { num: 2, title: "Indian Contracts Act 1872" },
  { num: 3, title: "Sale of Goods Act 1930" },
  { num: 4, title: "Negotiable Instruments Act 1881" },
  { num: 5, title: "Business Communication" },
];

type Screen = "home" | "chapter_select" | "combined_select" | "confirm";

export default function ExamsPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);
  const [examCount, setExamCount] = useState(0);

  useEffect(() => {
    // TODO: Merge with server-side completed exams when accounts sync.
    const raw = localStorage.getItem("somi_exam_count");
    const n = raw != null ? parseInt(raw, 10) : NaN;
    setExamCount(Number.isFinite(n) ? n : 0);
  }, []);

  const examSubtitle =
    examCount === 0
      ? "No exams completed yet"
      : examCount === 1
        ? "1 exam completed"
        : `${examCount} exams completed`;

  const getExamConfig = () => ({
    questions: 50,
    marks: 100,
    duration: 120,
    passMark: 80,
  });

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setSelectedChapters([]);
    if (type === "chapter") setScreen("chapter_select");
    else if (type === "combined") setScreen("combined_select");
    else setScreen("confirm");
  };

  const handleChapterSelect = (num: number) => {
    if (selectedType === "chapter") {
      setSelectedChapters([num]);
      setScreen("confirm");
    } else {
      setSelectedChapters((prev) =>
        prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
      );
    }
  };

  const handleStartExam = () => {
    const config = getExamConfig();
    const chapterParam =
      selectedChapters.length > 0 ? selectedChapters.join(",") : "all";
    router.push(
      `/exam-session?type=${selectedType}` +
        `&chapters=${chapterParam}` +
        `&questions=${config.questions}` +
        `&duration=${config.duration}` +
        `&passMark=${config.passMark}` +
        `&course=cma&paper=1`
    );
  };

  const handleBack = () => {
    if (screen === "confirm" && selectedType === "combined")
      setScreen("combined_select");
    else if (screen === "confirm") setScreen("chapter_select");
    else setScreen("home");
  };

  const currentType = EXAM_TYPES.find((t) => t.id === selectedType);

  const headerTitle =
    screen === "home"
      ? "Exams"
      : screen === "chapter_select"
        ? "Chapter Exam"
        : screen === "combined_select"
          ? "Combined Exam"
          : "Ready to Start?";

  const headerSub =
    screen === "home"
      ? examSubtitle
      : screen === "confirm"
        ? "Review your exam settings"
        : "Select chapters";

  const innerPad = "16px 20px max(100px, calc(88px + env(safe-area-inset-bottom, 0px)))";

  return (
    <div
      className="app-shell"
      style={{ minHeight: "100vh", background: C.bg, fontFamily: sans }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          padding: "0 20px",
        }}
      >
        <header
          style={{
            margin: "0 -20px",
            padding: `max(16px, env(safe-area-inset-top, 16px)) 20px 20px`,
            background: C.navy,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -8,
              right: -12,
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(96px, 26vw, 140px)",
              fontWeight: 900,
              color: "#fff",
              opacity: 0.04,
              lineHeight: 1,
              userSelect: "none",
              pointerEvents: "none",
            }}
            aria-hidden
          >
            {String(examCount).padStart(2, "0")}
          </span>
          {screen !== "home" && (
            <button
              type="button"
              onClick={handleBack}
              style={{
                position: "relative",
                zIndex: 1,
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.75)",
                cursor: "pointer",
                marginBottom: 10,
                fontFamily: sans,
              }}
            >
              ← Back
            </button>
          )}
          <div style={{ position: "relative", zIndex: 1 }}>
            <h1
              style={{
                fontFamily: serif,
                fontSize: screen === "home" ? 26 : 22,
                fontWeight: 400,
                color: "#fff",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {headerTitle}
            </h1>
            <p
              style={{
                fontSize: 12,
                color: C.silver,
                margin: "8px 0 0",
                opacity: 0.95,
              }}
            >
              {headerSub}
            </p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {screen === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              style={{ padding: innerPad, overflowY: "auto" }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: "12px 16px",
                  border: `1px solid rgba(7,23,57,0.06)`,
                  marginBottom: 16,
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ display: "flex", flexShrink: 0 }} aria-hidden>
                  <SomiIcons.Book size={20} />
                </span>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.navy,
                      marginBottom: 4,
                      letterSpacing: "0.04em",
                    }}
                  >
                    Real CMA Foundation Pattern
                  </div>
                  <div style={{ fontSize: 11, color: C.steel, lineHeight: 1.6 }}>
                    50 MCQs · 2 marks each · 120 mins · No negative marking · Pass: 40% per paper + 50% aggregate
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: C.gold,
                      fontWeight: 600,
                      marginTop: 4,
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      SOMI practice pass mark: 80/100 <SomiIcons.Target size={14} />
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: C.navy,
                  opacity: 0.4,
                  marginBottom: 10,
                }}
              >
                Select exam type
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {EXAM_TYPES.map((type, i) => (
                  <motion.button
                    key={type.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleTypeSelect(type.id)}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      background: "#fff",
                      borderRadius: 14,
                      border: `1px solid rgba(7,23,57,0.06)`,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: sans,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "rgba(7,23,57,0.04)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: `inset 0 0 0 1px rgba(227,195,157,0.25)`,
                      }}
                    >
                      {type.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: C.navy,
                          marginBottom: 2,
                        }}
                      >
                        {type.label}
                      </div>
                      <div style={{ fontSize: 11, color: C.steel }}>{type.sub}</div>
                    </div>
                    <span
                      style={{ fontSize: 16, color: C.navy, opacity: 0.2, flexShrink: 0 }}
                      aria-hidden
                    >
                      ›
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {screen === "chapter_select" && (
            <motion.div
              key="chapter_select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              style={{ padding: innerPad, overflowY: "auto" }}
            >
              <div style={{ fontSize: 12, color: C.steel, marginBottom: 12 }}>
                Select a chapter to test
              </div>
              <div
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  border: `1px solid rgba(7,23,57,0.06)`,
                  overflow: "hidden",
                }}
              >
                {CHAPTERS.map((ch, i, arr) => (
                  <motion.button
                    key={ch.num}
                    type="button"
                    whileTap={{ backgroundColor: "rgba(7,23,57,0.04)" }}
                    onClick={() => handleChapterSelect(ch.num)}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      background: "transparent",
                      border: "none",
                      borderBottom:
                        i < arr.length - 1 ? "1px solid rgba(7,23,57,0.06)" : "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: sans,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "rgba(7,23,57,0.04)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>
                        {ch.num}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.navy }}>
                        Ch {ch.num} — {ch.title}
                      </div>
                      <div style={{ fontSize: 11, color: C.steel }}>50 questions · 120 mins</div>
                    </div>
                    <span style={{ fontSize: 16, color: C.navy, opacity: 0.2 }} aria-hidden>
                      ›
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {screen === "combined_select" && (
            <motion.div
              key="combined_select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              style={{ padding: innerPad, overflowY: "auto" }}
            >
              <div style={{ fontSize: 12, color: C.steel, marginBottom: 12 }}>
                Select 2 or more chapters
              </div>
              <div
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  border: `1px solid rgba(7,23,57,0.06)`,
                  overflow: "hidden",
                  marginBottom: 16,
                }}
              >
                {CHAPTERS.map((ch, i, arr) => {
                  const isSelected = selectedChapters.includes(ch.num);
                  return (
                    <motion.button
                      key={ch.num}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleChapterSelect(ch.num)}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        background: isSelected ? "rgba(227,195,157,0.08)" : "transparent",
                        border: "none",
                        borderBottom:
                          i < arr.length - 1 ? "1px solid rgba(7,23,57,0.06)" : "none",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: sans,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: isSelected ? C.navy : "rgba(7,23,57,0.04)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isSelected ? (
                          <CheckCircle size={18} weight="fill" color="#fff" />
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.steel }}>
                            {ch.num}
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: isSelected ? 600 : 500,
                            color: C.navy,
                          }}
                        >
                          Ch {ch.num} — {ch.title}
                        </div>
                        <div style={{ fontSize: 11, color: C.steel }}>+10 questions</div>
                      </div>
                      {isSelected && (
                        <CheckCircle size={18} weight="fill" color={C.navy} />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {selectedChapters.length >= 2 ? (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setScreen("confirm")}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 14,
                    background: C.navy,
                    color: C.gold,
                    border: "none",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: sans,
                  }}
                >
                  Continue with {selectedChapters.length} chapters →
                </motion.button>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    color: C.steel,
                    marginTop: 8,
                  }}
                >
                  Select at least 2 chapters to continue
                </div>
              )}
            </motion.div>
          )}

          {screen === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              style={{ padding: innerPad, overflowY: "auto" }}
            >
              {(() => {
                const config = getExamConfig();
                return (
                  <>
                    <div
                      style={{
                        background: "#fff",
                        borderRadius: 14,
                        border: `1px solid rgba(7,23,57,0.06)`,
                        overflow: "hidden",
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          background: "linear-gradient(135deg, rgba(227,195,157,0.12), rgba(7,23,57,0.04))",
                          padding: "20px 20px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 14,
                            background: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: `inset 0 0 0 1px rgba(7,23,57,0.06)`,
                          }}
                        >
                          {currentType?.icon}
                        </div>
                        <div>
                          <div
                            style={{
                              fontFamily: serif,
                              fontSize: 18,
                              fontWeight: 600,
                              color: C.navy,
                            }}
                          >
                            {currentType?.label}
                          </div>
                          {selectedChapters.length > 0 && (
                            <div style={{ fontSize: 11, color: C.steel, marginTop: 4 }}>
                              {selectedChapters.length === 1
                                ? `Chapter ${selectedChapters[0]}`
                                : `Chapters ${selectedChapters.join(", ")}`}
                            </div>
                          )}
                        </div>
                      </div>

                      {[
                        { label: "Questions", value: config.questions },
                        { label: "Total Marks", value: config.marks },
                        { label: "Duration", value: `${config.duration} mins` },
                        {
                          label: "Pass Mark",
                          value: `${config.passMark}/${config.marks}`,
                        },
                      ].map((stat, i, arr) => (
                        <div
                          key={stat.label}
                          style={{
                            padding: "12px 20px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderBottom:
                              i < arr.length - 1 ? "1px solid rgba(7,23,57,0.06)" : "none",
                          }}
                        >
                          <span style={{ fontSize: 13, color: C.steel }}>{stat.label}</span>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: C.navy,
                              fontFamily: serif,
                            }}
                          >
                            {stat.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        background: "#fff",
                        borderRadius: 14,
                        padding: "12px 16px",
                        border: `1px solid rgba(7,23,57,0.06)`,
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: C.steel,
                          letterSpacing: "0.1em",
                          marginBottom: 8,
                        }}
                      >
                        EXAM RULES
                      </div>
                      {[
                        "No negative marking",
                        "All questions are MCQ",
                        `Pass mark: ${config.passMark}/${config.marks} (80%)`,
                        "Timer shown — submit when done",
                        "Results shown immediately",
                      ].map((rule) => (
                        <div
                          key={rule}
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "flex-start",
                            marginBottom: 6,
                          }}
                        >
                          <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                            <SomiIcons.Check size={10} color={C.gold} />
                          </span>
                          <span style={{ fontSize: 12, color: C.steel }}>{rule}</span>
                        </div>
                      ))}
                    </div>

                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={handleStartExam}
                      style={{
                        width: "100%",
                        padding: "16px",
                        borderRadius: 14,
                        background: C.navy,
                        color: C.gold,
                        border: "none",
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        fontFamily: sans,
                      }}
                    >
                      <Timer size={18} weight="fill" color={C.gold} />
                      Start Exam
                    </motion.button>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FloatingNav active="Exams" />
    </div>
  );
}
