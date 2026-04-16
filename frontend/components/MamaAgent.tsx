"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { SomiIcons } from "@/components/SomiIcons";
import { motion, AnimatePresence } from "framer-motion";
import MarkdownRenderer from "./MarkdownRenderer";

const API = process.env.NEXT_PUBLIC_API_URL || "https://studybuddy-production-7776.up.railway.app";

// ─── TYPES ─────────────────────────────────────────────────────────────────
interface AgentMessage {
  id: number;
  role: "user" | "mama";
  text: string;
  source?: "kg" | "llm_fallback";
  suggested_actions?: string[];
}

interface MamaAgentProps {
  mode: "concept" | "global";
  studentName: string;
  // Concept mode props
  namespace?: string;
  concept?: string;
  subject?: string;
  chapter?: string;
  conceptId?: string;
  // Global mode props
  course?: string;
  level?: string;
}

// ─── SUGGESTED ACTIONS PER MODE ────────────────────────────────────────────
const CONCEPT_CHIPS = ["Explain simply", "Test me", "Why is this important?", "Give example"];
const GLOBAL_CHIPS  = ["Continue studying", "Quiz me", "What's my progress?", "Weak topics"];

// ─── GREETING MESSAGES ─────────────────────────────────────────────────────
function getConceptGreeting(name: string, concept: string): string {
  const greetings = [
    `${concept} chaduvuthunnav kadha ${name}? Doubts unte adugu, lekapothe "test me" ani cheppu!`,
    `${name}, ${concept} lo emi doubt ayina adugu — Mama ready ga undi!`,
    `Baaga chaduvuthunnav ${name}! ${concept} about emi question ayina fire cheyyi`,
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

function getGlobalGreeting(name: string): string {
  const h = new Date().getHours();
  const timeGreet = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  const greetings = [
    `${timeGreet} ${name}! Ready to study? Tell me what you want to learn or ask "what should I study today?"`,
    `Hey ${name}! Mama ikkada undi. Subject select cheyyi or directly doubt adugu!`,
    `Welcome back ${name}! Let's continue where you left off — or start something new!`,
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

// ─── SOURCE BADGE ──────────────────────────────────────────────────────────
function SourceBadge({ source }: { source: "kg" | "llm_fallback" }) {
  if (source === "kg") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 9, color: "#071739", background: "rgba(7,23,57,0.05)",
        padding: "2px 8px", borderRadius: 10, fontWeight: 600,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#071739" }} />
        Verified
      </span>
    );
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 9, color: "#E3C39D", background: "rgba(227,195,157,0.08)",
      padding: "2px 8px", borderRadius: 10, fontWeight: 600,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#E3C39D" }} />
      AI Generated
    </span>
  );
}

// ─── TYPING INDICATOR ──────────────────────────────────────────────────────
function MamaTyping() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
      <div style={{
        background: "rgba(7,23,57,0.04)", borderRadius: "14px 14px 14px 4px",
        padding: "10px 16px", display: "flex", gap: 5, alignItems: "center"
      }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#071739" }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function MamaAgent({
  mode,
  studentName,
  namespace,
  concept,
  subject,
  chapter,
  course,
  level,
}: MamaAgentProps) {
  const [isOpen, setIsOpen]           = useState(false);
  const [messages, setMessages]       = useState<AgentMessage[]>([]);
  const [input, setInput]             = useState("");
  const [isTyping, setIsTyping]       = useState(false);
  const [hasGreeted, setHasGreeted]   = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // Track concept changes — reset greeting when concept changes
  const [lastConcept, setLastConcept] = useState(concept);

  useEffect(() => {
    if (concept !== lastConcept) {
      setLastConcept(concept);
      setHasGreeted(false);
      setMessages([]);
    }
  }, [concept, lastConcept]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  // Greet on first open
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setIsTyping(true);
      const greeting = mode === "concept"
        ? getConceptGreeting(studentName, concept || "this concept")
        : getGlobalGreeting(studentName);

      setTimeout(() => {
        setMessages([{
          id: Date.now(),
          role: "mama",
          text: greeting,
          source: "kg",
          suggested_actions: mode === "concept" ? CONCEPT_CHIPS : GLOBAL_CHIPS,
        }]);
        setIsTyping(false);
        setHasGreeted(true);
      }, 600);
    }
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen, hasGreeted, mode, studentName, concept]);

  // ── Send message ──
  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;

    const userMsg: AgentMessage = { id: Date.now(), role: "user", text: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Get student_id from localStorage
      const studentId = typeof window !== "undefined"
        ? localStorage.getItem("somi_student_id") || "anonymous"
        : "anonymous";

      const res = await fetch(`${API}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          student_name: studentName,
          message: msg,
          mode,
          namespace: namespace || "",
          concept: concept || "",
          subject: subject || "",
          chapter: chapter || "",
        }),
      });
      const data = await res.json();

      const mamaMsg: AgentMessage = {
        id: Date.now() + 1,
        role: "mama",
        text: data.reply,
        source: data.source as "kg" | "llm_fallback",
        suggested_actions: data.suggested_actions || [],
      };
      setMessages(prev => [...prev, mamaMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "mama",
        text: `Sorry ${studentName}, network issue vachindi. Try again!`,
        source: "llm_fallback" as const,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleChipClick = (action: string) => {
    sendMessage(action);
  };

  // ── Context label ──
  const contextLabel = mode === "concept"
    ? `${concept || "Concept"} · ${chapter || ""}`
    : `${(course || "cma").toUpperCase()} · All Subjects`;

  return (
    <>
      {/* ═══ FLOATING MAMA BUBBLE ═══ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            data-mama-bubble="true"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            style={{
              position: "fixed", bottom: 80, right: 20, zIndex: 90,
            }}
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(true)}
              style={{
                width: 52, height: 52, borderRadius: 16, border: "none",
                background: "#071739",
                cursor: "pointer", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 1,
                boxShadow: "0 4px 20px rgba(10,46,40,0.35)",
              }}
            >
              <span style={{ fontSize: 7, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>MAMA</span>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><SomiIcons.Chat size={12} color="rgba(255,255,255,0.6)" /></span>
            </motion.button>

            {/* Nudge tooltip — only show once, on concept pages */}
            {!hasGreeted && mode === "concept" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                style={{
                  position: "absolute", bottom: 58, right: 0, width: 180,
                  background: "#fff", border: "1px solid rgba(7,23,57,0.08)",
                  borderRadius: "12px 12px 4px 12px", padding: "8px 12px",
                  fontSize: 11, color: "#071739", lineHeight: 1.4,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                <span style={{ color: "#071739", fontWeight: 700 }}>Mama</span> is here! Doubt unte tap cheyyi <span style={{ display: "inline-flex", verticalAlign: "middle", marginLeft: 4 }}><SomiIcons.Wave size={14} /></span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ CHAT PANEL (SLIDE UP) ═══ */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
                zIndex: 200,
              }}
            />

            {/* Panel */}
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0,
                height: "72vh", maxWidth: 480, margin: "0 auto",
                zIndex: 201,
                background: "#FAFAF8",
                borderRadius: "20px 20px 0 0",
                display: "flex", flexDirection: "column",
                boxShadow: "0 -8px 30px rgba(0,0,0,0.15)",
              }}
            >
              {/* ── Header ── */}
              <div style={{
                padding: "12px 16px", display: "flex", alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(7,23,57,0.08)", flexShrink: 0,
                background: "#fff", borderRadius: "20px 20px 0 0",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 12,
                    background: "#071739",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 7, fontWeight: 800, color: "#fff" }}>MAMA</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#071739" }}>
                      Ask Mama
                    </div>
                    <div style={{
                      fontSize: 10, color: "#071739", fontWeight: 500,
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: "#071739", display: "inline-block",
                      }} />
                      {contextLabel}
                    </div>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: "rgba(7,23,57,0.04)", border: "none", borderRadius: 10,
                    color: "#4B6382", cursor: "pointer", width: 34, height: 34,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  ✕
                </motion.button>
              </div>

              {/* ── Messages ── */}
              <div style={{
                flex: 1, overflowY: "auto", padding: "12px 14px 8px",
              }}>
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginBottom: 14,
                      display: "flex",
                      justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    {msg.role === "user" ? (
                      /* ── User bubble ── */
                      <div style={{
                        background: "#071739", color: "#fff",
                        borderRadius: "14px 14px 4px 14px",
                        padding: "10px 14px", maxWidth: "80%",
                        fontSize: 12, lineHeight: 1.6, fontWeight: 500,
                      }}>
                        {msg.text}
                      </div>
                    ) : (
                      /* ── Mama bubble ── */
                      <div style={{ maxWidth: "88%" }}>
                        <div style={{
                          background: "#fff", borderRadius: "4px 14px 14px 14px",
                          padding: "12px 14px", fontSize: 12, lineHeight: 1.6,
                          color: "#071739", border: "0.5px solid rgba(0,0,0,0.06)",
                        }}>
                          {/* Source badge */}
                          {msg.source && (
                            <div style={{ marginBottom: 6 }}>
                              <SourceBadge source={msg.source} />
                            </div>
                          )}
                          {/* Content */}
                          <MarkdownRenderer content={msg.text} />
                        </div>

                        {/* Suggested actions */}
                        {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                          <div style={{
                            display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8,
                          }}>
                            {msg.suggested_actions.map((action, i) => (
                              <motion.button
                                key={i}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleChipClick(action)}
                                style={{
                                  background: "#fff", border: "1px solid rgba(7,23,57,0.08)",
                                  borderRadius: 20, padding: "6px 12px", fontSize: 11,
                                  color: "#071739", cursor: "pointer", fontWeight: 500,
                                }}
                              >
                                {action}
                              </motion.button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
                {isTyping && <MamaTyping />}
                <div ref={chatEndRef} />
              </div>

              {/* ── Input bar ── */}
              <div style={{
                padding: "10px 14px 20px", borderTop: "1px solid rgba(7,23,57,0.08)",
                flexShrink: 0, background: "#fff",
              }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                    placeholder={mode === "concept"
                      ? "Ask about this concept..."
                      : "Ask Mama anything..."}
                    style={{
                      flex: 1, padding: "10px 14px", borderRadius: 20,
                      border: "1.5px solid rgba(7,23,57,0.08)", background: "#FAFAF8",
                      fontSize: 13, color: "#071739", outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isTyping}
                    style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: input.trim() && !isTyping ? "#071739" : "rgba(7,23,57,0.08)",
                      border: "none",
                      cursor: input.trim() && !isTyping ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: "#fff", fontSize: 14 }}>↑</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
