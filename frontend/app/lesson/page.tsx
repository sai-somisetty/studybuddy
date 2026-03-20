"use client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message {
  role: "user" | "mama";
  text: string;
  source?: string;
  verified?: boolean;
}

export default function Lesson() {
  const router = useRouter();
  const [question,  setQuestion]  = useState("");
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [namespace, setNamespace] = useState("cma_f_law_ch1_s1");
  const [concept,   setConcept]   = useState("Contract");
  const [subject,   setSubject]   = useState("Business Laws");
  const [chapter,   setChapter]   = useState("Chapter 1");
  const [page,      setPage]      = useState("8");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read namespace from URL or localStorage
    const params = new URLSearchParams(window.location.search);
    const ns = params.get("namespace") || localStorage.getItem("somi_last_namespace") || "cma_f_law_ch1_s1";
    const cn = params.get("concept")   || "Contract";
    const su = params.get("subject")   || "Business Laws";
    const ch = params.get("chapter")   || "Chapter 1";
    const pg = params.get("page")      || "8";
    setNamespace(ns);
    setConcept(cn);
    setSubject(su);
    setChapter(ch);
    setPage(pg);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const askMama = async () => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setQuestion("");
    setMessages(prev => [...prev, { role:"user", text:q }]);
    setLoading(true);

    try {
      const res  = await fetch(`${API}/ask?question=${encodeURIComponent(q)}&namespace=${namespace}&student_name=Student`);
      const data = await res.json();
      setMessages(prev => [...prev, {
        role:     "mama",
        text:     data.answer,
        source:   data.source,
        verified: data.verified_from_textbook,
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "mama",
        text: "Sorry — Mama is thinking. Try again in a moment.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">

      {/* Header */}
      <div style={{ background:"#0A2E28", padding:"16px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <button onClick={() => router.back()}
            style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>
            ← Back
          </button>
        </div>
        <div style={{ fontFamily:"Georgia,serif", fontSize:17, fontWeight:700, color:"#fff", marginBottom:2 }}>{concept}</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>{subject} · {chapter} · Page {page}</div>
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:"14px 20px 160px", display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>

        {/* ICAI Definition card */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
          style={{ background:"#E1F5EE", borderRadius:16, padding:14, border:"0.5px solid rgba(14,102,85,0.2)" }}>
          <div style={{ fontSize:9, fontWeight:700, color:"#0E6655", letterSpacing:"0.08em", marginBottom:6 }}>ICAI DEFINITION</div>
          <div style={{ fontSize:13, color:"#085041", lineHeight:1.6, fontStyle:"italic" }}>
            "A contract is an agreement enforceable by law."
          </div>
          <div style={{ fontSize:10, color:"#A89880", marginTop:6 }}>
            ICMAI Study Material · {chapter} · Page {page}
          </div>
        </motion.div>

        {/* Kitty asks */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }}
          style={{ background:"linear-gradient(135deg,#FEF9C3,#FFEDD5)", borderRadius:16, padding:14, border:"0.5px solid rgba(230,126,34,0.2)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"#E67E22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:8, fontWeight:700, color:"#fff" }}>KITTY</span>
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:"#9a3412" }}>Kitty asks</div>
          </div>
          <div style={{ fontSize:13, color:"#431407", lineHeight:1.6, fontStyle:"italic" }}>
            "Mama — Contract ante just agreement kaadu, law enforce chestundi antunnaru... law ki pani lekapothe agreement void avtunda?"
          </div>
        </motion.div>

        {/* Mama explains */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.16 }}
          style={{ background:"linear-gradient(135deg,#F0FDF4,#DCFCE7)", borderRadius:16, padding:14, border:"0.5px solid rgba(22,163,74,0.2)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"#0A2E28", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:8, fontWeight:700, color:"#fff" }}>MAMA</span>
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:"#14532d" }}>Mama explains</div>
          </div>
          <div style={{ fontSize:13, color:"#14532d", lineHeight:1.6 }}>
            Kitty — Appa flour mill lo supplier tho agreement chesadu — "50 bags rice ivvu" ani. Aa agreement court lo enforce cheyyagaligite — it becomes a CONTRACT. Enforce cheyyalekunte — just a promise. That's the difference!
          </div>
          <div style={{ marginTop:8, background:"rgba(10,46,40,0.08)", borderRadius:8, padding:"6px 10px", fontSize:11, color:"#0A2E28", fontWeight:500 }}>
            💡 Exam tip: All contracts are agreements. But NOT all agreements are contracts.
          </div>
        </motion.div>

        {/* Ask Mama chat messages */}
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              style={{ display:"flex", justifyContent: msg.role==="user"?"flex-end":"flex-start" }}>
              <div style={{
                maxWidth:"85%",
                background:   msg.role==="user"?"#0A2E28":"#fff",
                borderRadius: msg.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",
                padding:"12px 14px",
                border: msg.role==="mama"?"0.5px solid rgba(0,0,0,0.06)":"none",
              }}>
                {msg.role==="mama" && (
                  <div style={{ fontSize:9, fontWeight:700, color:"#E67E22", letterSpacing:"0.06em", marginBottom:4 }}>MAMA</div>
                )}
                <div style={{ fontSize:13, color: msg.role==="user"?"#fff":"#1A1208", lineHeight:1.6 }}>
                  {msg.text}
                </div>
                {msg.verified && msg.source && (
                  <div style={{ fontSize:10, color:"#A89880", marginTop:6, display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ color:"#0E6655" }}>✓</span>
                    {msg.source}
                  </div>
                )}
                {msg.role==="mama" && !msg.verified && (
                  <div style={{ fontSize:10, color:"#A89880", marginTop:6 }}>AI generated · verify with textbook</div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{ display:"flex", justifyContent:"flex-start" }}>
            <div style={{ background:"#fff", borderRadius:"18px 18px 18px 4px", padding:"12px 16px", border:"0.5px solid rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:9, fontWeight:700, color:"#E67E22", marginBottom:4 }}>MAMA</div>
              <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                {[0,1,2].map(i => (
                  <motion.div key={i}
                    animate={{ y:[0,-4,0] }}
                    transition={{ repeat:Infinity, duration:0.6, delay:i*0.15 }}
                    style={{ width:6, height:6, borderRadius:"50%", background:"#0A2E28" }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Bottom — Ask Mama + Quiz button */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#fff", borderTop:"0.5px solid rgba(0,0,0,0.06)", padding:"10px 16px 24px", zIndex:100 }}>

        {/* Quiz modes */}
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          {[
            { icon:"📄", label:"Prev Papers", mode:"previous"  },
            { icon:"📖", label:"Textbook",    mode:"textbook"  },
            { icon:"🔄", label:"Tweaked",     mode:"tweaked"   },
            { icon:"🤖", label:"AI Quiz",     mode:"ai"        },
          ].map(q => (
            <motion.button key={q.mode} whileTap={{ scale:0.95 }}
              onClick={() => router.push(`/quiz?namespace=${namespace}&concept=${concept}&mode=${q.mode}`)}
              style={{ flex:1, padding:"8px 4px", borderRadius:12, background:"#F5F0E8", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
              <span style={{ fontSize:14 }}>{q.icon}</span>
              <span style={{ fontSize:9, color:"#6B6560", fontWeight:600 }}>{q.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Ask Mama input */}
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key==="Enter" && askMama()}
            placeholder="Ask Mama anything about this concept..."
            style={{ flex:1, padding:"12px 14px", borderRadius:14, border:"1.5px solid #E5E0D8", background:"#FAFAF8", fontSize:13, color:"#1A1208", outline:"none" }}
          />
          <motion.button whileTap={{ scale:0.95 }} onClick={askMama}
            disabled={!question.trim() || loading}
            style={{ width:44, height:44, borderRadius:14, background: question.trim()&&!loading?"#0A2E28":"#E5E0D8", border:"none", cursor: question.trim()&&!loading?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ fontSize:16, color:"#fff" }}>↑</span>
          </motion.button>
        </div>

      </div>

    </div>
  );
}