"use client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://studybuddy-production-7776.up.railway.app";

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
    <div className="app-shell">

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0A2E28 0%, #0A4A3C 100%)", padding: "14px 20px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <button onClick={() => router.back()}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
            ← Back
          </button>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
            Live Session
          </div>
        </div>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>
          Section {sectionLabel}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
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
                  <div style={{ maxWidth: "80%", background: "#0A2E28", borderRadius: "18px 18px 4px 18px", padding: "12px 14px" }}>
                    <div style={{ fontSize: 13, color: "#fff", lineHeight: 1.6 }}>{msg.text}</div>
                  </div>
                </div>
              )}

              {/* ── Mama message ── */}
              {msg.role === "mama" && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ maxWidth: "88%", background: "#fff", borderRadius: "18px 18px 18px 4px", padding: "14px 16px", border: "0.5px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 7, background: "#0A2E28", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 7, fontWeight: 800, color: "#fff" }}>MAMA</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#0A2E28" }}>Mama</span>
                    </div>

                    {/* ICAI text box */}
                    {msg.icaiText && (
                      <div style={{ background: "#E1F5EE", borderRadius: 12, padding: "10px 12px", marginBottom: 10, border: "1px solid rgba(14,102,85,0.12)" }}>
                        <div style={{ fontSize: 8, fontWeight: 700, color: "#0E6655", letterSpacing: "0.08em", marginBottom: 4 }}>ICMAI TEXTBOOK</div>
                        <div style={{ fontSize: 13, color: "#085041", lineHeight: 1.6, fontFamily: "Georgia,serif", fontStyle: "italic" }}>
                          "{msg.icaiText}"
                        </div>
                        {msg.icaiRef && (
                          <div style={{ fontSize: 9, color: "#6B9B8A", marginTop: 6 }}>{msg.icaiRef}</div>
                        )}
                      </div>
                    )}

                    <div style={{ fontSize: 13, color: "#1A1208", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Kitty message ── */}
              {msg.role === "kitty" && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 20 }}
                  style={{ background: "linear-gradient(135deg,#FEF9C3,#FFEDD5)", borderRadius: 16, padding: 14, border: "1px solid rgba(230,126,34,0.15)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: "#E67E22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 6, fontWeight: 800, color: "#fff" }}>KITTY</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#9a3412" }}>Kitty asks</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#431407", lineHeight: 1.6, fontStyle: "italic" }}>
                    "{msg.text}"
                  </div>
                </motion.div>
              )}

              {/* ── Page indicator ── */}
              {msg.role === "page" && msg.pageNumber && (
                <div style={{ background: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", borderRadius: 16, padding: "16px 18px", border: "1.5px solid #E67E22", textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📖</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#9a3412" }}>
                    Open your ICMAI book to Page {msg.pageNumber}
                  </div>
                  <div style={{ fontSize: 11, color: "#A89880", marginTop: 4 }}>
                    Find Section {sectionLabel} and tell Mama when ready
                  </div>
                </div>
              )}

              {/* ── Check question ── */}
              {msg.role === "check" && msg.checkOptions && (
                <div style={{ background: "#fff", borderRadius: 16, padding: 16, border: "1.5px solid rgba(24,95,165,0.2)" }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: "#185FA5", letterSpacing: "0.08em", marginBottom: 8 }}>CHECK QUESTION</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1208", lineHeight: 1.6, marginBottom: 12 }}>
                    {msg.checkQuestion}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {msg.checkOptions.map((opt, i) => (
                      <motion.button key={i} whileTap={{ scale: 0.98 }}
                        onClick={() => quickReply(String.fromCharCode(65 + i))}
                        style={{ textAlign: "left", padding: "10px 14px", borderRadius: 12, background: "#FAFAF8", border: "1px solid #E5E0D8", fontSize: 13, color: "#1A1208", cursor: "pointer", lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Complete ── */}
              {msg.role === "complete" && (
                <div style={{ background: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", borderRadius: 16, padding: 20, textAlign: "center", border: "1.5px solid rgba(14,102,85,0.2)" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#0E6655", marginBottom: 4 }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: 12, color: "#6B9B8A", marginBottom: 16 }}>
                    You read every line with Mama. Well done!
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => router.push(`/quiz?namespace=${course}_${level.charAt(0)}_${subjectCode}&concept=${encodeURIComponent(sectionLabel)}&subject=${encodeURIComponent(subject)}`)}
                      style={{ padding: "12px 20px", borderRadius: 14, background: "#0A2E28", color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
                      Take Quiz →
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => router.back()}
                      style={{ padding: "12px 20px", borderRadius: 14, background: "#F5F0E8", color: "#1A1208", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
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
            <div style={{ background: "#fff", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", border: "0.5px solid rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: "#0A2E28", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 7, fontWeight: 800, color: "#fff" }}>MAMA</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                    style={{ width: 6, height: 6, borderRadius: "50%", background: "#0A2E28" }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Bottom bar */}
      {!session.sessionComplete && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "0.5px solid rgba(0,0,0,0.06)", padding: "8px 16px 24px", zIndex: 100 }}>

          {/* Quick replies */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {[
              { label: "YES ✓", value: "yes" },
              { label: "Not clear", value: "not clear" },
              { label: "Give example", value: "give me a different example" },
            ].map(qr => (
              <motion.button key={qr.value} whileTap={{ scale: 0.95 }}
                onClick={() => quickReply(qr.value)}
                disabled={loading}
                style={{ flex: 1, padding: "8px 6px", borderRadius: 10, background: "#F5F0E8", border: "none", fontSize: 11, fontWeight: 600, color: "#6B6560", cursor: loading ? "default" : "pointer" }}>
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
              style={{ flex: 1, padding: "12px 14px", borderRadius: 14, border: "1.5px solid #E5E0D8", background: "#FAFAF8", fontSize: 13, color: "#1A1208", outline: "none" }}
            />
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => handleSend(input)}
              disabled={!input.trim() || loading}
              style={{ width: 44, height: 44, borderRadius: 14, background: input.trim() && !loading ? "#0A2E28" : "#E5E0D8", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 16, color: "#fff" }}>↑</span>
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
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#0A2E28" }}>Starting session...</div>
      </div>
    }>
      <SessionContent />
    </Suspense>
  );
}
