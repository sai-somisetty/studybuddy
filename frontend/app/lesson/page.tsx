"use client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://studybuddy-production-7776.up.railway.app";

// ── Types ──

interface Section {
  id: string;
  title: string;
  icaiQuote: string;
  icaiRef: string;
  mamaExplain: string;
  examTip: string;
  kittyAsk: string;
  checkQuestion: string;
  checkOptions: string[];
  checkAnswer: number; // index of correct option
  checkExplanation: string;
}

interface Message {
  role: "user" | "mama";
  text: string;
  source?: string;
  verified?: boolean;
}

// ── Kitty dialogues ──

const KITTY_LINES = [
  "Mama wait wait — nenu doubt adugutunna...",
  "Mama — idi exam lo vastunda?",
  "Mama — oka real example cheppu please!",
  "Mama — idi next topic ki connect avthunda?",
  "Mama — eppudu I got confused again...",
  "Mama — simple ga cheppu na!",
  "Mama — idi important antunnaru, entha marks?",
  "Mama — oka shortcut trick unda?",
];

function getKittyLine(idx: number) {
  return KITTY_LINES[idx % KITTY_LINES.length];
}

// ── Generate sections from concept ──

function generateSections(concept: string, chapter: string): Section[] {
  // Single section for the concept — AI will fill real content via Ask Mama
  return [{
    id: "s1",
    title: concept,
    icaiQuote: `As per ICMAI Study Material — "${concept}" is a fundamental concept covered in ${chapter}.`,
    icaiRef: `ICMAI Study Material · ${chapter}`,
    mamaExplain: `Kitty — let me explain "${concept}" with a simple example. Think of it like running a small shop in your neighbourhood. Every concept in this topic connects to real business situations you see every day. Master this and you'll answer any exam question on it!`,
    examTip: `This topic carries 3-5 marks in every exam. Focus on definitions and practical applications.`,
    kittyAsk: getKittyLine(0),
    checkQuestion: `Which of the following best describes the concept of "${concept}"?`,
    checkOptions: [
      "A theoretical concept with no practical application",
      "A fundamental principle defined in ICMAI study material",
      "An outdated concept no longer in the syllabus",
      "A concept only relevant for final level exams",
    ],
    checkAnswer: 1,
    checkExplanation: `"${concept}" is a fundamental principle covered in the ICMAI study material for this chapter. It has direct practical applications and is regularly tested in exams.`,
  }];
}

// ── Main Component ──

function LessonContent() {
  const router = useRouter();
  const params = useSearchParams();

  // URL params
  const namespace = params.get("namespace") || "cma_f_law_ch1_s1";
  const concept   = params.get("concept")   || "Contract";
  const subject   = params.get("subject")   || "Business Laws";
  const chapter   = params.get("chapter")   || "Chapter 1";

  // State
  const [sections,       setSections]       = useState<Section[]>([]);
  const [lessonLoading,  setLessonLoading]  = useState(true);
  const [currentSection, setCurrentSection] = useState(0);
  const [showCheck,      setShowCheck]      = useState(false);
  const [checkAnswer,    setCheckAnswer]    = useState<number | null>(null);
  const [showAskMama,    setShowAskMama]    = useState(false);
  const [question,       setQuestion]       = useState("");
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [kittyVisible,   setKittyVisible]   = useState(false);
  const [activeZone,     setActiveZone]     = useState<"mama" | "icmai">("mama");
  const [smartConcepts,  setSmartConcepts]  = useState<any[]>([]);
  const [smartIndex,     setSmartIndex]     = useState(0);
  const [hasSmartContent, setHasSmartContent] = useState(false);
  const [touchStartX,   setTouchStartX]    = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sec = sections[currentSection];
  const progress = sections.length > 0 ? ((currentSection + 1) / sections.length) * 100 : 0;

  // Fetch lesson content from API on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchLesson() {
      setLessonLoading(true);
      try {
        const res = await fetch(`${API}/lesson/content`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ namespace, concept }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.sections && data.sections.length > 0) {
          setSections(data.sections.map((s: any, i: number) => ({
            id:               s.id || `s${i + 1}`,
            title:            s.title || concept,
            icaiQuote:        s.icmai_quote || "",
            icaiRef:          s.icmai_ref || "",
            mamaExplain:      s.mama_explain || "",
            examTip:          s.exam_tip || "",
            kittyAsk:         s.kitty_ask || getKittyLine(i),
            checkQuestion:    s.check_question || "",
            checkOptions:     s.check_options || ["A", "B", "C", "D"],
            checkAnswer:      typeof s.check_answer === "number" ? s.check_answer : 0,
            checkExplanation: s.check_explanation || "",
          })));
        } else {
          setSections(generateSections(concept, chapter));
        }
      } catch {
        if (!cancelled) setSections(generateSections(concept, chapter));
      } finally {
        if (!cancelled) setLessonLoading(false);
      }
    }
    fetchLesson();

    async function fetchSmartLesson() {
      try {
        const res = await fetch(
          `${API}/lesson/smart?namespace=${namespace}&concept=${encodeURIComponent(concept)}`
        );
        const data = await res.json();
        if (!cancelled && data.has_content && data.concepts && data.concepts.length > 0) {
          setSmartConcepts(data.concepts);
          setHasSmartContent(true);
        }
      } catch (e) {
        console.error("Smart lesson fetch failed:", e);
      }
    }
    fetchSmartLesson();

    return () => { cancelled = true; };
  }, [namespace, concept]);

  // Show kitty after 3 seconds
  useEffect(() => {
    if (lessonLoading) return;
    const t = setTimeout(() => setKittyVisible(true), 3000);
    return () => clearTimeout(t);
  }, [currentSection, lessonLoading]);

  // Scroll chat
  useEffect(() => {
    if (showAskMama) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showAskMama]);

  // ── Ask Mama ──
  const askMama = async () => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setQuestion("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res  = await fetch(`${API}/ask?question=${encodeURIComponent(q)}&namespace=${namespace}&student_name=Student`);
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "mama", text: data.answer,
        source: data.source, verified: data.verified_from_textbook,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: "mama", text: "Sorry — Mama is thinking. Try again!" }]);
    } finally {
      setLoading(false);
    }
  };

  // ── Check answer ──
  const handleCheck = (idx: number) => {
    if (checkAnswer !== null) return;
    setCheckAnswer(idx);
  };

  // ── Navigate sections ──
  const goNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setShowCheck(false);
      setCheckAnswer(null);
      setKittyVisible(false);
    }
  };

  const goPrev = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      setShowCheck(false);
      setCheckAnswer(null);
      setKittyVisible(false);
    }
  };

  // ── LOADING STATE ──
  if (lessonLoading || sections.length === 0) {
    return (
      <div className="app-shell">
        <div style={{ background:"#0A2E28", padding:"14px 20px 12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={() => router.back()}
              style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
              ← Back
            </button>
          </div>
          <div style={{ fontFamily:"Georgia,serif", fontSize:17, fontWeight:700, color:"#fff", marginTop:10 }}>{concept}</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{subject} · {chapter}</div>
        </div>
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:16 }}>📖</div>
            <div style={{ fontSize:15, fontWeight:700, color:"#0A2E28", marginBottom:8 }}>
              Mama is preparing your lesson...
            </div>
            <div style={{ fontSize:12, color:"#A89880", lineHeight:1.6, marginBottom:16 }}>
              Reading ICMAI textbook and creating examples just for you.
            </div>
            <div style={{ display:"flex", justifyContent:"center", gap:6 }}>
              {[0,1,2].map(i => (
                <motion.div key={i}
                  animate={{ y:[0,-6,0] }}
                  transition={{ repeat:Infinity, duration:0.6, delay:i*0.15 }}
                  style={{ width:8, height:8, borderRadius:"50%", background:"#0A2E28" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ASK MAMA OVERLAY ──
  if (showAskMama) {
    return (
      <div className="app-shell">
        {/* Header */}
        <div style={{ background:"#0A2E28", padding:"14px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <button onClick={() => setShowAskMama(false)}
              style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
              ← Back to Lesson
            </button>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>Ask Mama</div>
          </div>
          <div style={{ fontFamily:"Georgia,serif", fontSize:15, fontWeight:700, color:"#fff", marginTop:8 }}>{concept}</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{subject} · {chapter}</div>
        </div>

        {/* Chat */}
        <div style={{ flex:1, padding:"14px 20px 100px", display:"flex", flexDirection:"column", gap:10, overflowY:"auto" }}>
          {/* Intro message */}
          <div style={{ background:"#F5F0E8", borderRadius:16, padding:12, fontSize:12, color:"#6B6560", lineHeight:1.6 }}>
            Ask me anything about <strong>{concept}</strong>. I'll answer from the ICMAI textbook first, then explain in simple words.
          </div>

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                style={{ display:"flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth:"85%",
                  background: msg.role === "user" ? "#0A2E28" : "#fff",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding:"12px 14px",
                  border: msg.role === "mama" ? "0.5px solid rgba(0,0,0,0.06)" : "none",
                }}>
                  {msg.role === "mama" && (
                    <div style={{ fontSize:9, fontWeight:700, color:"#0E6655", letterSpacing:"0.06em", marginBottom:4 }}>MAMA</div>
                  )}
                  <div style={{ fontSize:13, color: msg.role === "user" ? "#fff" : "#1A1208", lineHeight:1.6 }}>
                    {msg.text}
                  </div>
                  {msg.verified && msg.source && (
                    <div style={{ fontSize:10, color:"#0E6655", marginTop:6 }}>
                      ✓ {msg.source}
                    </div>
                  )}
                  {msg.role === "mama" && !msg.verified && (
                    <div style={{ fontSize:10, color:"#A89880", marginTop:6 }}>AI generated · verify with textbook</div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div style={{ display:"flex", justifyContent:"flex-start" }}>
              <div style={{ background:"#fff", borderRadius:"18px 18px 18px 4px", padding:"12px 16px", border:"0.5px solid rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:9, fontWeight:700, color:"#0E6655", marginBottom:4 }}>MAMA</div>
                <div style={{ display:"flex", gap:4 }}>
                  {[0,1,2].map(i => (
                    <motion.div key={i} animate={{ y:[0,-4,0] }}
                      transition={{ repeat:Infinity, duration:0.6, delay:i*0.15 }}
                      style={{ width:6, height:6, borderRadius:"50%", background:"#0A2E28" }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#fff", borderTop:"0.5px solid rgba(0,0,0,0.06)", padding:"10px 16px 24px", zIndex:100 }}>
          <div style={{ display:"flex", gap:8 }}>
            <input value={question} onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && askMama()}
              placeholder="Ask Mama anything..."
              style={{ flex:1, padding:"12px 14px", borderRadius:14, border:"1.5px solid #E5E0D8", background:"#FAFAF8", fontSize:13, color:"#1A1208", outline:"none" }}
            />
            <motion.button whileTap={{ scale:0.95 }} onClick={askMama}
              disabled={!question.trim() || loading}
              style={{ width:44, height:44, borderRadius:14, background: question.trim() && !loading ? "#0A2E28" : "#E5E0D8", border:"none", cursor: question.trim() && !loading ? "pointer" : "default", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:16, color:"#fff" }}>↑</span>
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN LESSON VIEW ──
  return (
    <div className="app-shell">

      {/* ── Header ── */}
      <div style={{ background:"#0A2E28", padding:"14px 20px 12px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <button onClick={() => router.back()}
            style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
            ← Back
          </button>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:600 }}>
            {currentSection + 1} / {sections.length}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height:3, background:"rgba(255,255,255,0.15)", borderRadius:2, overflow:"hidden", marginBottom:8 }}>
          <motion.div animate={{ width: `${progress}%` }} transition={{ duration:0.3 }}
            style={{ height:"100%", background:"#E67E22", borderRadius:2 }} />
        </div>

        <div style={{ fontFamily:"Georgia,serif", fontSize:17, fontWeight:700, color:"#fff", marginBottom:2 }}>
          {sec.title}
        </div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>
          {subject} · {chapter}
        </div>
      </div>

      {/* Zone tabs */}
      {hasSmartContent && (
        <div style={{ display:"flex", background:"#F5F0E8", borderBottom:"0.5px solid rgba(0,0,0,0.06)" }}>
          <button onClick={() => setActiveZone("mama")}
            style={{ flex:1, padding:"10px", fontSize:12, fontWeight: activeZone==="mama"?700:500, background: activeZone==="mama"?"#0A2E28":"transparent", color: activeZone==="mama"?"#fff":"#6B6560", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            🧠 Mama Zone
          </button>
          <button onClick={() => setActiveZone("icmai")}
            style={{ flex:1, padding:"10px", fontSize:12, fontWeight: activeZone==="icmai"?700:500, background: activeZone==="icmai"?"#0E6655":"transparent", color: activeZone==="icmai"?"#fff":"#6B6560", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            📖 ICMAI Zone
          </button>
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ flex:1, padding:"14px 20px 140px", display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}
        onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX === null) return;
          const diff = touchStartX - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 50) {
            setActiveZone(diff > 0 ? "icmai" : "mama");
          }
          setTouchStartX(null);
        }}>

        {/* Smart content — Bento-Box UI */}
        {hasSmartContent && smartConcepts.length > 0 && (() => {
          const sc = smartConcepts[smartIndex];

          if (activeZone === "mama") {
            return (
              <motion.div key={`mama-${smartIndex}`}
                initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
                style={{ display:"flex", flexDirection:"column", gap:12 }}>

                {/* Concept header */}
                <div style={{ background:"linear-gradient(135deg,#0A2E28,#0A4A3C)", borderRadius:16, padding:16 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.5)", letterSpacing:"0.08em", marginBottom:4 }}>
                    {sc.section_label} · PAGE {sc.page_ref}
                  </div>
                  <div style={{ fontFamily:"Georgia,serif", fontSize:16, fontWeight:700, color:"#fff", marginBottom:8 }}>
                    {sc.concept_title}
                  </div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", lineHeight:1.6, fontStyle:"italic" }}>
                    {sc.core_definition}
                  </div>
                </div>

                {/* Mama's Logic */}
                <div style={{ background:"#fff", borderRadius:16, padding:16, border:"0.5px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <div style={{ width:30, height:30, borderRadius:10, background:"#0A2E28", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontSize:8, fontWeight:800, color:"#fff" }}>MAMA</span>
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#0A2E28" }}>🧠 Mama&apos;s Logic</div>
                    {!sc.is_verified && (
                      <span style={{ fontSize:9, background:"#FFF7ED", color:"#E67E22", padding:"2px 8px", borderRadius:20, fontWeight:600 }}>AI Draft</span>
                    )}
                    {sc.is_verified && (
                      <span style={{ fontSize:9, background:"#E1F5EE", color:"#0E6655", padding:"2px 8px", borderRadius:20, fontWeight:600 }}>✓ Verified</span>
                    )}
                  </div>
                  <div style={{ fontSize:13, color:"#1A1208", lineHeight:1.7, whiteSpace:"pre-wrap" }}>
                    {sc.tenglish_verified || sc.somi_business_logic || sc.tenglish_ai}
                  </div>
                </div>

                {/* Mama's Tip */}
                {sc.mamas_tip && (
                  <div style={{ background:"#FFF7ED", borderRadius:14, padding:"12px 16px", border:"1px solid rgba(230,126,34,0.2)", display:"flex", gap:10, alignItems:"flex-start" }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>💡</span>
                    <div>
                      <div style={{ fontSize:9, fontWeight:700, color:"#E67E22", letterSpacing:"0.08em", marginBottom:4 }}>MAMA&apos;S EXAM TIP</div>
                      <div style={{ fontSize:12, color:"#9a3412", lineHeight:1.6, fontWeight:500 }}>{sc.mamas_tip}</div>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                {smartConcepts.length > 1 && (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    <button onClick={() => setSmartIndex(Math.max(0, smartIndex - 1))} disabled={smartIndex === 0}
                      style={{ padding:"6px 14px", borderRadius:20, background: smartIndex===0?"#E5E0D8":"#0A2E28", color:"#fff", border:"none", cursor: smartIndex===0?"default":"pointer", fontSize:12 }}>←</button>
                    <span style={{ fontSize:11, color:"#A89880" }}>{smartIndex + 1} / {smartConcepts.length}</span>
                    <button onClick={() => setSmartIndex(Math.min(smartConcepts.length - 1, smartIndex + 1))} disabled={smartIndex === smartConcepts.length - 1}
                      style={{ padding:"6px 14px", borderRadius:20, background: smartIndex===smartConcepts.length-1?"#E5E0D8":"#0A2E28", color:"#fff", border:"none", cursor: smartIndex===smartConcepts.length-1?"default":"pointer", fontSize:12 }}>→</button>
                  </div>
                )}

                {/* Dots */}
                {smartConcepts.length > 1 && (
                  <div style={{ display:"flex", justifyContent:"center", gap:6 }}>
                    {smartConcepts.map((_: any, i: number) => (
                      <div key={i} onClick={() => setSmartIndex(i)}
                        style={{ width: i===smartIndex?20:6, height:6, borderRadius:3, background: i===smartIndex?"#0A2E28":"#E5E0D8", cursor:"pointer", transition:"all 0.3s" }} />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          }

          if (activeZone === "icmai") {
            return (
              <motion.div key={`icmai-${smartIndex}`}
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                style={{ background:"#FFFEF9", borderRadius:16, padding:20, border:"1px solid rgba(14,102,85,0.15)" }}>
                <div style={{ fontSize:9, fontWeight:700, color:"#0E6655", letterSpacing:"0.08em", marginBottom:12 }}>
                  📖 ICMAI OFFICIAL TEXT · PAGE {sc.page_ref}
                </div>
                <div style={{ fontSize:13, color:"#1A1208", lineHeight:1.9, fontFamily:"Georgia,serif", whiteSpace:"pre-wrap" }}>
                  {sc.official_full_text || sc.official_text}
                </div>
                <div style={{ marginTop:16, paddingTop:12, borderTop:"0.5px solid rgba(14,102,85,0.1)", fontSize:10, color:"#6B9B8A", fontStyle:"italic" }}>
                  Source: ICMAI Study Material · {sc.section_label}
                </div>
              </motion.div>
            );
          }

          return null;
        })()}

        {/* Fallback: existing content when no smart content */}
        {!hasSmartContent && (<>

        {/* 1. ICAI Quote */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          style={{ background:"#E1F5EE", borderRadius:16, padding:16, border:"1px solid rgba(14,102,85,0.15)" }}>
          <div style={{ fontSize:9, fontWeight:700, color:"#0E6655", letterSpacing:"0.08em", marginBottom:8 }}>
            ICMAI TEXTBOOK
          </div>
          <div style={{ fontSize:14, color:"#085041", lineHeight:1.7, fontFamily:"Georgia,serif", fontStyle:"italic" }}>
            "{sec.icaiQuote}"
          </div>
          <div style={{ fontSize:10, color:"#6B9B8A", marginTop:8 }}>
            {sec.icaiRef}
          </div>
        </motion.div>

        {/* 2. Mama Explains */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          style={{ background:"#fff", borderRadius:16, padding:16, border:"0.5px solid rgba(0,0,0,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <div style={{ width:30, height:30, borderRadius:10, background:"#0A2E28", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:8, fontWeight:800, color:"#fff", letterSpacing:"0.04em" }}>MAMA</span>
            </div>
            <div style={{ fontSize:12, fontWeight:700, color:"#0A2E28" }}>Mama explains</div>
          </div>
          <div style={{ fontSize:13, color:"#1A1208", lineHeight:1.7 }}>
            {sec.mamaExplain}
          </div>
          <div style={{ marginTop:10, background:"#FFF7ED", borderRadius:10, padding:"8px 12px", display:"flex", alignItems:"flex-start", gap:8 }}>
            <span style={{ fontSize:14, flexShrink:0 }}>💡</span>
            <div style={{ fontSize:12, color:"#9a3412", lineHeight:1.5, fontWeight:500 }}>
              {sec.examTip}
            </div>
          </div>
        </motion.div>

        {/* 3. Kitty Moment */}
        <AnimatePresence>
          {kittyVisible && (
            <motion.div initial={{ opacity:0, scale:0.95, y:10 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0 }}
              transition={{ type:"spring", damping:20 }}
              style={{ background:"linear-gradient(135deg,#FEF9C3,#FFEDD5)", borderRadius:16, padding:14, border:"1px solid rgba(230,126,34,0.15)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:"#E67E22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:7, fontWeight:800, color:"#fff" }}>KITTY</span>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:"#9a3412" }}>Kitty asks</div>
              </div>
              <div style={{ fontSize:13, color:"#431407", lineHeight:1.6, fontStyle:"italic" }}>
                "{sec.kittyAsk}"
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Check Question */}
        {!showCheck ? (
          <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
            whileTap={{ scale:0.97 }}
            onClick={() => setShowCheck(true)}
            style={{ width:"100%", padding:"14px", borderRadius:14, background:"linear-gradient(135deg,#0A2E28,#0A4A3C)", color:"#fff", fontSize:13, fontWeight:700, border:"none", cursor:"pointer", textAlign:"center" }}>
            Check your understanding
          </motion.button>
        ) : (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            style={{ background:"#fff", borderRadius:16, padding:16, border:"1.5px solid rgba(10,46,40,0.1)" }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#185FA5", letterSpacing:"0.08em", marginBottom:10 }}>
              CHECK QUESTION
            </div>
            <div style={{ fontSize:13, fontWeight:600, color:"#1A1208", lineHeight:1.6, marginBottom:14 }}>
              {sec.checkQuestion}
            </div>

            {sec.checkOptions.map((opt, idx) => {
              const isAnswered = checkAnswer !== null;
              const isCorrect  = idx === sec.checkAnswer;
              const isSelected = checkAnswer === idx;

              let bg = "#FAFAF8", border = "1px solid #E5E0D8", color = "#1A1208";
              if (isAnswered && isCorrect)       { bg = "#F0FDF4"; border = "1.5px solid #16a34a"; color = "#14532d"; }
              else if (isAnswered && isSelected)  { bg = "#FEF2F2"; border = "1.5px solid #ef4444"; color = "#991b1b"; }

              return (
                <motion.button key={idx} whileTap={!isAnswered ? { scale:0.98 } : {}}
                  onClick={() => handleCheck(idx)}
                  style={{ display:"block", width:"100%", textAlign:"left", padding:"11px 14px", marginBottom:8, borderRadius:12, background:bg, border, color, fontSize:13, fontWeight:500, cursor: isAnswered ? "default" : "pointer", lineHeight:1.5 }}>
                  <span style={{ fontWeight:700, marginRight:8 }}>{String.fromCharCode(65 + idx)}.</span>
                  {opt}
                  {isAnswered && isCorrect  && <span style={{ float:"right", color:"#16a34a", fontWeight:700 }}>✓</span>}
                  {isAnswered && isSelected && !isCorrect && <span style={{ float:"right", color:"#ef4444", fontWeight:700 }}>✗</span>}
                </motion.button>
              );
            })}

            {/* Explanation */}
            {checkAnswer !== null && (
              <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                style={{ marginTop:8, background:"#F5F0E8", borderRadius:10, padding:"10px 14px" }}>
                <div style={{ fontSize:9, fontWeight:700, color:"#6B6560", letterSpacing:"0.06em", marginBottom:4 }}>EXPLANATION</div>
                <div style={{ fontSize:12, color:"#1A1208", lineHeight:1.6 }}>
                  {sec.checkExplanation}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* 5. Section Navigation */}
        {sections.length > 1 && (
          <div style={{ display:"flex", gap:10, marginTop:4 }}>
            {currentSection > 0 && (
              <motion.button whileTap={{ scale:0.97 }} onClick={goPrev}
                style={{ flex:1, padding:"12px", borderRadius:14, background:"#F5F0E8", color:"#1A1208", fontSize:13, fontWeight:600, border:"none", cursor:"pointer" }}>
                ← Previous
              </motion.button>
            )}
            {currentSection < sections.length - 1 && (
              <motion.button whileTap={{ scale:0.97 }} onClick={goNext}
                style={{ flex:1, padding:"12px", borderRadius:14, background:"#0A2E28", color:"#fff", fontSize:13, fontWeight:600, border:"none", cursor:"pointer" }}>
                Next Section →
              </motion.button>
            )}
          </div>
        )}

        {/* Done — go to quiz */}
        {(sections.length === 1 || currentSection === sections.length - 1) && checkAnswer !== null && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            style={{ background:"linear-gradient(135deg,#F0FDF4,#DCFCE7)", borderRadius:16, padding:16, textAlign:"center", border:"1px solid rgba(14,102,85,0.15)" }}>
            <div style={{ fontSize:15, fontWeight:700, color:"#0E6655", marginBottom:4 }}>
              {checkAnswer === sec.checkAnswer ? "Correct! You've got this!" : "Review once more — you'll nail it!"}
            </div>
            <div style={{ fontSize:12, color:"#6B9B8A", marginBottom:12 }}>Ready to practice with quiz questions?</div>
            <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
              {[
                { icon:"📄", label:"Prev Papers", mode:"previous" },
                { icon:"📖", label:"Textbook",    mode:"textbook" },
                { icon:"🔄", label:"Tweaked",     mode:"tweaked"  },
                { icon:"🤖", label:"AI Quiz",     mode:"ai"       },
              ].map(q => (
                <motion.button key={q.mode} whileTap={{ scale:0.95 }}
                  onClick={() => router.push(`/quiz?namespace=${namespace}&concept=${encodeURIComponent(concept)}&mode=${q.mode}&subject=${encodeURIComponent(subject)}`)}
                  style={{ padding:"8px 14px", borderRadius:12, background:"#fff", border:"1px solid rgba(14,102,85,0.15)", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:14 }}>{q.icon}</span>
                  <span style={{ fontSize:11, color:"#0E6655", fontWeight:600 }}>{q.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        </>)}
      </div>

      {/* ── Bottom Bar — Ask Mama ── */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#fff", borderTop:"0.5px solid rgba(0,0,0,0.06)", padding:"10px 16px 24px", zIndex:100 }}>
        <motion.button whileTap={{ scale:0.97 }}
          onClick={() => setShowAskMama(true)}
          style={{ width:"100%", padding:"14px", borderRadius:14, background:"#0A2E28", color:"#fff", fontSize:13, fontWeight:700, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <span style={{ fontSize:16 }}>💬</span>
          Ask Mama about this concept
        </motion.button>
      </div>
    </div>
  );
}

// ── Page wrapper ──

export default function LessonPage() {
  return (
    <Suspense fallback={
      <div className="app-shell" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:"#0A2E28" }}>Loading lesson...</div>
      </div>
    }>
      <LessonContent />
    </Suspense>
  );
}
