"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, FileText, Shuffle, Sparkle,
  Timer, CheckCircle, House, Certificate, ChartBar,
} from "@phosphor-icons/react";

const EXAM_TYPES = [
  {
    id: "chapter",
    icon: <BookOpen size={22} weight="duotone" color="#0E6655" />,
    bg: "#E1F5EE",
    color: "#0E6655",
    label: "Chapter Exam",
    sub: "20 questions · 45 mins · 40 marks",
    description: "Test one chapter at a time",
  },
  {
    id: "combined",
    icon: <Shuffle size={22} weight="duotone" color="#185FA5" />,
    bg: "#DBEAFE",
    color: "#185FA5",
    label: "Combined Exam",
    sub: "Select multiple chapters · Custom time",
    description: "Mix chapters for a tougher test",
  },
  {
    id: "previous",
    icon: <FileText size={22} weight="duotone" color="#E67E22" />,
    bg: "#FFF7ED",
    color: "#E67E22",
    label: "Previous Papers",
    sub: "50 questions · 120 mins · 100 marks",
    description: "Real ICMAI past exam questions",
  },
  {
    id: "mock",
    icon: <Sparkle size={22} weight="duotone" color="#7C3AED" />,
    bg: "#F5F3FF",
    color: "#7C3AED",
    label: "Mock Exam",
    sub: "50 questions · 120 mins · 100 marks",
    description: "Full paper simulation — pass at 80",
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

function BottomNav({ active }: { active: string }) {
  const router = useRouter();
  return (
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
        padding: "10px 20px 20px",
        display: "flex",
        justifyContent: "space-around",
        zIndex: 100,
      }}
    >
      {[
        { label: "Home",     path: "/home" },
        { label: "Study",    path: "/subject/cma_f_law" },
        { label: "Exams",    path: "/exams" },
        { label: "Progress", path: "/progress" },
      ].map((item) => {
        const isActive = item.label === active;
        const iconColor = isActive ? "#0E6655" : "#A89880";
        const iconWeight = isActive ? "fill" : "regular";
        const iconMap: Record<string, React.ReactNode> = {
          Home:     <House       size={20} weight={iconWeight as "fill" | "regular"} color={iconColor} />,
          Study:    <BookOpen    size={20} weight={iconWeight as "fill" | "regular"} color={iconColor} />,
          Exams:    <Certificate size={20} weight={iconWeight as "fill" | "regular"} color={iconColor} />,
          Progress: <ChartBar    size={20} weight={iconWeight as "fill" | "regular"} color={iconColor} />,
        };
        return (
          <motion.div
            key={item.label}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push(item.path)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
            }}
          >
            {iconMap[item.label]}
            <div
              style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 400,
                color: iconColor,
              }}
            >
              {item.label}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function ExamsPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);

  const getExamConfig = () => {
    switch (selectedType) {
      case "chapter":
        return { questions: 20, marks: 40, duration: 45, passMark: Math.round(40 * 0.8) };
      case "combined":
        return {
          questions: selectedChapters.length * 10,
          marks: selectedChapters.length * 20,
          duration: selectedChapters.length * 20,
          passMark: Math.round(selectedChapters.length * 20 * 0.8),
        };
      case "previous":
      case "mock":
        return { questions: 50, marks: 100, duration: 120, passMark: 80 };
      default:
        return { questions: 50, marks: 100, duration: 120, passMark: 80 };
    }
  };

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
    const chapterParam = selectedChapters.length > 0 ? selectedChapters.join(",") : "all";
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
    if (screen === "confirm" && selectedType === "combined") setScreen("combined_select");
    else if (screen === "confirm") setScreen("chapter_select");
    else setScreen("home");
  };

  const currentType = EXAM_TYPES.find((t) => t.id === selectedType);

  return (
    <div className="app-shell">
      {/* ── Header ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0A2E28 0%, #0A4A3C 100%)",
          padding: "18px 24px 16px",
        }}
      >
        {screen !== "home" && (
          <button
            onClick={handleBack}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              marginBottom: 10,
            }}
          >
            ← Back
          </button>
        )}
        <div
          style={{
            fontFamily: "Georgia,serif",
            fontSize: 20,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 2,
          }}
        >
          {screen === "home"
            ? "Exams"
            : screen === "chapter_select"
            ? "Chapter Exam"
            : screen === "combined_select"
            ? "Combined Exam"
            : "Ready to Start?"}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
          {screen === "home"
            ? "CMA Foundation · Paper 1"
            : screen === "confirm"
            ? "Review your exam settings"
            : "Select chapters"}
        </div>
      </div>

      {/* ── Screens ── */}
      <AnimatePresence mode="wait">
        {/* HOME */}
        {screen === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            style={{ flex: 1, padding: "16px 20px 100px", overflowY: "auto" }}
          >
            {/* Real exam info banner */}
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: "12px 16px",
                border: "0.5px solid rgba(0,0,0,0.06)",
                marginBottom: 16,
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: 20 }}>📋</span>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#0A2E28",
                    marginBottom: 4,
                  }}
                >
                  Real CMA Foundation Pattern
                </div>
                <div style={{ fontSize: 11, color: "#6B6560", lineHeight: 1.6 }}>
                  50 MCQs · 2 marks each · 120 mins · No negative marking · Pass: 40% per paper + 50% aggregate
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#E67E22",
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  SOMI practice pass mark: 80/100 🎯
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#6B6560",
                marginBottom: 10,
              }}
            >
              Select Exam Type
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "0.5px solid rgba(0,0,0,0.08)",
                overflow: "hidden",
              }}
            >
              {EXAM_TYPES.map((type, i, arr) => (
                <motion.button
                  key={type.id}
                  whileTap={{ backgroundColor: "#F5F0E8" }}
                  onClick={() => handleTypeSelect(type.id)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    background: "transparent",
                    border: "none",
                    borderBottom:
                      i < arr.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: type.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {type.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#1A1208",
                        marginBottom: 2,
                      }}
                    >
                      {type.label}
                    </div>
                    <div style={{ fontSize: 11, color: "#A89880" }}>{type.sub}</div>
                  </div>
                  <span style={{ fontSize: 16, color: "#C5B9A8" }}>›</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* CHAPTER SELECT */}
        {screen === "chapter_select" && (
          <motion.div
            key="chapter_select"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            style={{ flex: 1, padding: "16px 20px 100px", overflowY: "auto" }}
          >
            <div style={{ fontSize: 12, color: "#A89880", marginBottom: 12 }}>
              Select a chapter to test
            </div>
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "0.5px solid rgba(0,0,0,0.08)",
                overflow: "hidden",
              }}
            >
              {CHAPTERS.map((ch, i, arr) => (
                <motion.button
                  key={ch.num}
                  whileTap={{ backgroundColor: "#F5F0E8" }}
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
                      i < arr.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "#E1F5EE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0E6655" }}>
                      {ch.num}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#1A1208" }}>
                      Ch {ch.num} — {ch.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#A89880" }}>20 questions · 45 mins</div>
                  </div>
                  <span style={{ fontSize: 16, color: "#C5B9A8" }}>›</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* COMBINED SELECT */}
        {screen === "combined_select" && (
          <motion.div
            key="combined_select"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            style={{ flex: 1, padding: "16px 20px 100px", overflowY: "auto" }}
          >
            <div style={{ fontSize: 12, color: "#A89880", marginBottom: 12 }}>
              Select 2 or more chapters
            </div>
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "0.5px solid rgba(0,0,0,0.08)",
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              {CHAPTERS.map((ch, i, arr) => {
                const isSelected = selectedChapters.includes(ch.num);
                return (
                  <motion.button
                    key={ch.num}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChapterSelect(ch.num)}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      background: isSelected ? "#E1F5EE" : "transparent",
                      border: "none",
                      borderBottom:
                        i < arr.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: isSelected ? "#0A2E28" : "#F5F0E8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isSelected ? (
                        <CheckCircle size={18} weight="fill" color="#fff" />
                      ) : (
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#A89880" }}>
                          {ch.num}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? "#0A2E28" : "#1A1208",
                        }}
                      >
                        Ch {ch.num} — {ch.title}
                      </div>
                      <div style={{ fontSize: 11, color: "#A89880" }}>+10 questions</div>
                    </div>
                    {isSelected && (
                      <CheckCircle size={18} weight="fill" color="#0E6655" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {selectedChapters.length >= 2 ? (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setScreen("confirm")}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 14,
                  background: "#0A2E28",
                  color: "#fff",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Continue with {selectedChapters.length} chapters →
              </motion.button>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  color: "#A89880",
                  marginTop: 8,
                }}
              >
                Select at least 2 chapters to continue
              </div>
            )}
          </motion.div>
        )}

        {/* CONFIRM */}
        {screen === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            style={{ flex: 1, padding: "16px 20px 100px", overflowY: "auto" }}
          >
            {(() => {
              const config = getExamConfig();
              return (
                <>
                  {/* Exam summary card */}
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 16,
                      border: "0.5px solid rgba(0,0,0,0.08)",
                      overflow: "hidden",
                      marginBottom: 16,
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        background: currentType?.bg || "#E1F5EE",
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
                        }}
                      >
                        {currentType?.icon}
                      </div>
                      <div>
                        <div
                          style={{ fontSize: 16, fontWeight: 700, color: "#1A1208" }}
                        >
                          {currentType?.label}
                        </div>
                        {selectedChapters.length > 0 && (
                          <div style={{ fontSize: 11, color: "#6B6560" }}>
                            {selectedChapters.length === 1
                              ? `Chapter ${selectedChapters[0]}`
                              : `Chapters ${selectedChapters.join(", ")}`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
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
                            i < arr.length - 1
                              ? "0.5px solid rgba(0,0,0,0.06)"
                              : "none",
                        }}
                      >
                        <span style={{ fontSize: 13, color: "#6B6560" }}>
                          {stat.label}
                        </span>
                        <span
                          style={{ fontSize: 13, fontWeight: 700, color: "#1A1208" }}
                        >
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Rules */}
                  <div
                    style={{
                      background: "#FFFEF9",
                      borderRadius: 14,
                      padding: "12px 16px",
                      border: "0.5px solid rgba(0,0,0,0.06)",
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#A89880",
                        letterSpacing: "0.06em",
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
                        <span
                          style={{
                            fontSize: 10,
                            color: "#0E6655",
                            flexShrink: 0,
                          }}
                        >
                          ✓
                        </span>
                        <span style={{ fontSize: 12, color: "#6B6560" }}>{rule}</span>
                      </div>
                    ))}
                  </div>

                  {/* Start button */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleStartExam}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: 14,
                      background:
                        "linear-gradient(135deg, #0A2E28 0%, #0A4A3C 100%)",
                      color: "#fff",
                      border: "none",
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Timer size={18} weight="fill" color="#E67E22" />
                    Start Exam
                  </motion.button>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav active="Exams" />
    </div>
  );
}
