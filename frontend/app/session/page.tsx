"use client";
import { SomiIcons } from "@/components/SomiIcons";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://studybuddy-production-7776.up.railway.app";

const C = {
  navy: "#071739",
  gold: "#E3C39D",
  steel: "#4B6382",
  silver: "#A4B5C4",
  bg: "#FAFAF8",
};

const sans = "'DM Sans', sans-serif";
const serif = "'DM Serif Display', serif";

// ── Types ──

interface ChatMessage {
  id: number;
  role: "mama" | "student" | "kitty" | "page" | "check" | "complete";
  text: string;
  icaiText?: string;
  icaiRef?: string;
  pageNumber?: number;
  checkQuestion?: string;
  checkOptions?: string[];
  checkAnswer?: number;
}

interface SessionState {
  nextState: string;
  nextReadingOrder: number;
  sessionHistory: any[];
  sessionComplete: boolean;
}

// ── Main Component ──

function SessionContent() {
  const router = useRouter();
  const params = useSearchParams();

  const sectionLabel = params.get("section_label") || "2.1";
  const subject      = params.get("subject") || "Business Laws";
  const chapter      = params.get("chapter") || "Chapter 2";
  const course       = params.get("course") || "cma";
  const level        = params.get("level") || "foundation";
  const paper        = parseInt(params.get("paper") || "1");
  const subjectCode  = params.get("subject_code") || "law";

  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [session, setSession]         = useState<SessionState>({
    nextState: "INTRO", nextReadingOrder: 0, sessionHistory: [], sessionComplete: false,
  });
  const [msgCounter, setMsgCounter]   = useState(0);
  const [checkPending, setCheckPending] = useState<{ q: string; opts: string[]; ans: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const studentName = typeof window !== "undefined" ? localStorage.getItem("somi_name") || "Student" : "Student";
  const studentId   = typeof window !== "undefined" ? localStorage.getItem("somi_student_id") || "anon" : "anon";

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Start session on mount
  useEffect(() => {
    sendToMama("start", "INTRO", 0, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Send message to backend ──
  const sendToMama = async (
    studentMessage: string,
    currentState: string,
    currentReadingOrder: number,
    history: any[],
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/session/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          student_name: studentName,
          course,
          level_name: level,
          paper_number: paper,
          subject: subjectCode,
          section_label: sectionLabel,
          current_state: currentState,
          current_reading_order: currentReadingOrder,
          student_message: studentMessage,
          session_history: history,
        }),
      });
      const data = await res.json();

      const newMessages: ChatMessage[] = [];
      let counter = msgCounter;

      // Page indicator
      if (data.page_to_open && currentState === "OPEN_BOOK") {
        counter++;
        newMessages.push({
          id: counter, role: "page", text: "",
          pageNumber: data.page_to_open,
        });
      }

      // Mama response
      if (data.mama_response) {
        counter++;
        const node = data.current_node;
        newMessages.push({
          id: counter, role: "mama",
          text: data.mama_response,
          icaiText: currentState === "LINE_BY_LINE" && node ? node.content : undefined,
          icaiRef: currentState === "LINE_BY_LINE" && node
            ? `Page ${node.page_number} · Section ${node.section_label}`
            : undefined,
        });
      }

      // Kitty
      if (data.show_kitty && data.kitty_message) {
        counter++;
        newMessages.push({ id: counter, role: "kitty", text: data.kitty_message });
      }

      // Check question
      if (data.show_check_question && data.check_question) {
        counter++;
        newMessages.push({
          id: counter, role: "check",
          text: data.check_question,
          checkQuestion: data.check_question,
          checkOptions: data.check_options,
          checkAnswer: data.check_answer,
        });
        setCheckPending({ q: data.check_question, opts: data.check_options, ans: data.check_answer });
      } else {
        setCheckPending(null);
      }

      // Complete
      if (data.session_complete) {
        counter++;
        newMessages.push({ id: counter, role: "complete", text: `Section ${sectionLabel} Complete!` });
      }

      setMsgCounter(counter);
      setMessages(prev => [...prev, ...newMessages]);
      setSession({
        nextState: data.next_state || "INTRO",
        nextReadingOrder: data.next_reading_order || 0,
        sessionHistory: data.session_history || history,
        sessionComplete: data.session_complete || false,
      });

    } catch {
      const counter = msgCounter + 1;
      setMsgCounter(counter);
      setMessages(prev => [...prev, {
        id: counter, role: "mama",
        text: "Sorry — Mama is thinking. Try again in a moment.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  // ── Handle student send ──
  const handleSend = (text: string) => {
    if (!text.trim() || loading || session.sessionComplete) return;
    const msg = text.trim();
    setInput("");

    // Add student bubble
    const counter = msgCounter + 1;
    setMsgCounter(counter);
    setMessages(prev => [...prev, { id: counter, role: "student", text: msg }]);

    // If check pending — send as CHECK state
    const state = checkPending ? "CHECK" : session.nextState;

    sendToMama(msg, state, session.nextReadingOrder, session.sessionHistory);
  };

  // ── Quick replies ──
  const quickReply = (text: string) => handleSend(text);

  // ── Render ──
  return (
    <div className="app-shell" style={{ minHeight: "100vh", background: C.bg, fontFamily: sans }}>

      {/* Header */}
      <div style={{ background: C.navy, padding: "14px 20px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <button type="button" onClick={() => router.back()}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", cursor: "pointer", fontFamily: sans }}>
            ← Back
          </button>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
            Live Session
          </div>
        </div>
        <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 600, color: "#fff" }}>
          Section {sectionLabel}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
          {subject} · {chapter}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, padding: "14px 16px 160px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>

        <AnimatePresence>
          {messages.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}>

              {/* ── Student message ── */}
              {msg.role === "student" && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ maxWidth: "80%", background: C.navy, borderRadius: "18px 18px 4px 18px", padding: "12px 14px" }}>
                    <div style={{ fontSize: 13, color: "#fff", lineHeight: 1.6 }}>{msg.text}</div>
                  </div>
                </div>
              )}

              {/* ── Mama message ── */}
              {msg.role === "mama" && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ maxWidth: "88%", background: "#fff", borderRadius: "18px 18px 18px 4px", padding: "14px 16px", border: `1px solid rgba(7,23,57,0.1)` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 7, background: C.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 7, fontWeight: 800, color: C.gold }}>MAMA</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.navy }}>Mama</span>
                    </div>

                    {/* ICAI text box */}
                    {msg.icaiText && (
                      <div style={{ background: "rgba(7,23,57,0.04)", borderRadius: 12, padding: "10px 12px", marginBottom: 10, border: `1px solid rgba(7,23,57,0.1)` }}>
                        <div style={{ fontSize: 8, fontWeight: 700, color: C.navy, letterSpacing: "0.08em", marginBottom: 4 }}>ICMAI TEXTBOOK</div>
                        <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.6, fontFamily: serif, fontStyle: "italic" }}>
                          "{msg.icaiText}"
                        </div>
                        {msg.icaiRef && (
                          <div style={{ fontSize: 9, color: C.steel, marginTop: 6 }}>{msg.icaiRef}</div>
                        )}
                      </div>
                    )}

                    <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Kitty message ── */}
              {msg.role === "kitty" && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 20 }}
                  style={{ background: "#fff", borderRadius: 16, padding: 14, border: `1px solid rgba(7,23,57,0.1)`, borderLeft: `4px solid ${C.gold}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: C.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 6, fontWeight: 800, color: C.gold }}>KITTY</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.steel }}>Kitty asks</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.6, fontStyle: "italic" }}>
                    "{msg.text}"
                  </div>
                </motion.div>
              )}

              {/* ── Page indicator ── */}
              {msg.role === "page" && msg.pageNumber && (
                <div style={{ background: "#fff", borderRadius: 16, padding: "16px 18px", border: `1.5px solid ${C.gold}`, textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}><SomiIcons.BookOpen size={28} /></div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: serif }}>
                    Open your ICMAI book to Page {msg.pageNumber}
                  </div>
                  <div style={{ fontSize: 11, color: C.steel, marginTop: 4 }}>
                    Find Section {sectionLabel} and tell Mama when ready
                  </div>
                </div>
              )}

              {/* ── Check question ── */}
              {msg.role === "check" && msg.checkOptions && (
                <div style={{ background: "#fff", borderRadius: 16, padding: 16, border: `1px solid rgba(7,23,57,0.12)` }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: C.navy, letterSpacing: "0.08em", marginBottom: 8 }}>CHECK QUESTION</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, lineHeight: 1.6, marginBottom: 12 }}>
                    {msg.checkQuestion}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {msg.checkOptions.map((opt, i) => (
                      <motion.button type="button" key={i} whileTap={{ scale: 0.98 }}
                        onClick={() => quickReply(String.fromCharCode(65 + i))}
                        style={{ textAlign: "left", padding: "10px 14px", borderRadius: 12, background: "#fff", border: `1.5px solid ${C.navy}`, fontSize: 13, color: C.navy, cursor: "pointer", lineHeight: 1.5, fontFamily: sans }}>
                        <span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Complete ── */}
              {msg.role === "complete" && (
                <div style={{ background: "#fff", borderRadius: 16, padding: 20, textAlign: "center", border: `1px solid rgba(7,23,57,0.1)`, boxShadow: `inset 0 0 0 1px ${C.gold}` }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><SomiIcons.Celebration size={36} /></div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 4, fontFamily: serif }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: 12, color: C.steel, marginBottom: 16 }}>
                    You read every line with Mama. Well done!
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                    <motion.button type="button" whileTap={{ scale: 0.97 }}
                      onClick={() => router.push(`/quiz?namespace=${course}_${level.charAt(0)}_${subjectCode}&concept=${encodeURIComponent(sectionLabel)}&subject=${encodeURIComponent(subject)}`)}
                      style={{ padding: "12px 20px", borderRadius: 14, background: C.navy, color: C.gold, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: sans }}>
                      Take Quiz →
                    </motion.button>
                    <motion.button type="button" whileTap={{ scale: 0.97 }}
                      onClick={() => router.back()}
                      style={{ padding: "12px 20px", borderRadius: 14, background: "#fff", color: C.navy, fontSize: 13, fontWeight: 600, border: `1.5px solid ${C.navy}`, cursor: "pointer", fontFamily: sans }}>
                      Back to Chapter
                    </motion.button>
                  </div>
                </div>
              )}

            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading dots */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: "#fff", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", border: `1px solid rgba(7,23,57,0.1)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: C.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 7, fontWeight: 800, color: C.gold }}>MAMA</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                    style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Bottom bar */}
      {!session.sessionComplete && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: `1px solid rgba(7,23,57,0.08)`, padding: "8px 16px max(24px, env(safe-area-inset-bottom, 24px))", zIndex: 100 }}>

          {/* Quick replies */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {([
              { label: (<span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}>YES<SomiIcons.Check size={12} /></span>), value: "yes" },
              { label: "Not clear", value: "not clear" },
              { label: "Give example", value: "give me a different example" },
            ] as { label: ReactNode; value: string }[]).map(qr => (
              <motion.button type="button" key={qr.value} whileTap={{ scale: 0.95 }}
                onClick={() => quickReply(qr.value)}
                disabled={loading}
                style={{ flex: 1, padding: "8px 6px", borderRadius: 10, background: "#fff", border: `1px solid ${C.navy}`, fontSize: 11, fontWeight: 600, color: C.navy, cursor: loading ? "default" : "pointer", fontFamily: sans }}>
                {qr.label}
              </motion.button>
            ))}
          </div>

          {/* Text input */}
          <div style={{ display: "flex", gap: 8 }}>
            <input ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend(input)}
              placeholder="Ask Mama anything..."
              disabled={loading}
              style={{ flex: 1, padding: "12px 14px", borderRadius: 14, border: `1px solid rgba(7,23,57,0.12)`, background: "#fff", fontSize: 13, color: C.navy, outline: "none", fontFamily: sans }}
            />
            <motion.button type="button" whileTap={{ scale: 0.95 }}
              onClick={() => handleSend(input)}
              disabled={!input.trim() || loading}
              style={{ width: 44, height: 44, borderRadius: 14, background: input.trim() && !loading ? C.navy : "rgba(7,23,57,0.08)", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 16, color: C.gold, fontWeight: 700 }}>↑</span>
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page wrapper ──

export default function SessionPage() {
  return (
    <Suspense fallback={
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: C.bg, fontFamily: sans }}>
        <div style={{ color: C.navy }}>Starting session...</div>
      </div>
    }>
      <SessionContent />
    </Suspense>
  );
}
