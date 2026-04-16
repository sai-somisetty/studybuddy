"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

const C = {
  navy: "#071739",
  gold: "#E3C39D",
  steel: "#4B6382",
  silver: "#A4B5C4",
  bg: "#FAFAF8",
};

export type StarredItem = {
  key: string;
  pageId?: string;
  paraIdx?: number;
  namespace: string;
  concept: string;
  subject?: string;
  chapter?: string;
  title?: string;
  bookPage?: number;
  quickContent?: string;
  reviseContent?: string;
  starredAt?: string;
};

function loadStarred(): StarredItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem("somi_starred") || "[]");
    return Array.isArray(raw) ? (raw as StarredItem[]) : [];
  } catch {
    return [];
  }
}

export default function RevisionPage() {
  const router = useRouter();
  const [items, setItems] = useState<StarredItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [tab, setTab] = useState<"quick" | "revise">("quick");

  const refresh = useCallback(() => {
    const next = loadStarred();
    setItems(next);
    setIdx((i) => (next.length === 0 ? 0 : Math.min(i, next.length - 1)));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const current = items[idx];

  const openInLesson = () => {
    if (!current) return;
    const ns = encodeURIComponent(current.namespace);
    const concept = encodeURIComponent(current.concept);
    const subj = encodeURIComponent(current.subject || "");
    const chRaw = current.chapter || "Chapter 1";
    const ch = chRaw.startsWith("Chapter") ? chRaw : `Chapter ${chRaw}`;
    const chapter = encodeURIComponent(ch);
    const page = current.bookPage ?? "";
    router.push(`/lesson?namespace=${ns}&concept=${concept}&subject=${subj}&chapter=${chapter}&page=${page}`);
  };

  const removeCurrent = () => {
    if (!current) return;
    const next = items.filter((_, i) => i !== idx);
    localStorage.setItem("somi_starred", JSON.stringify(next));
    const impKey = `imp_${current.pageId}_${current.paraIdx}`;
    localStorage.removeItem(impKey);
    setItems(next);
    setIdx((i) => (next.length === 0 ? 0 : Math.min(i, next.length - 1)));
  };

  const goPrev = () => setIdx((i) => (i <= 0 ? items.length - 1 : i - 1));
  const goNext = () => setIdx((i) => (items.length === 0 ? 0 : (i + 1) % items.length));

  useEffect(() => {
    setTab("quick");
  }, [idx]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 20px", paddingBottom: 100 }}>
        <header
          style={{
            paddingTop: "max(48px, env(safe-area-inset-top, 48px))",
            paddingBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => router.push("/home")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: C.navy,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Back to home"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </motion.button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.navy, fontWeight: 400 }}>
              Revision Mode
            </div>
            <div style={{ fontSize: 12, color: C.steel, marginTop: 2 }}>
              {items.length} starred {items.length === 1 ? "concept" : "concepts"}
            </div>
          </div>
        </header>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", padding: "48px 16px" }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>☆</div>
            <p style={{ fontSize: 15, color: C.navy, fontWeight: 600, marginBottom: 8 }}>No starred concepts yet</p>
            <p style={{ fontSize: 13, color: C.steel, lineHeight: 1.5, marginBottom: 24 }}>
              In a lesson, tap the star on a paragraph to save it here for quick revision.
            </p>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/home")}
              style={{
                background: C.navy,
                color: C.gold,
                border: "none",
                borderRadius: 10,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Back to Home
            </motion.button>
          </motion.div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={goPrev}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.navy}14`,
                  background: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.navy,
                  cursor: "pointer",
                }}
              >
                ← Prev
              </motion.button>
              <span style={{ fontSize: 11, color: C.steel, fontWeight: 600 }}>
                {idx + 1} / {items.length}
              </span>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={goNext}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.navy}14`,
                  background: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.navy,
                  cursor: "pointer",
                }}
              >
                Next →
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current?.key ?? "card"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  border: `1px solid ${C.navy}0D`,
                  overflow: "hidden",
                  marginBottom: 16,
                }}
              >
                <div style={{ padding: "18px 18px 12px", borderBottom: `1px solid ${C.navy}08` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: "0.1em", marginBottom: 6 }}>
                    ⭐ STARRED
                  </div>
                  <h2
                    style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: 19,
                      fontWeight: 400,
                      color: C.navy,
                      lineHeight: 1.3,
                      margin: 0,
                    }}
                  >
                    {current?.title || current?.concept}
                  </h2>
                  <div style={{ fontSize: 11, color: C.steel, marginTop: 8 }}>
                    {current?.subject && <span>{current.subject}</span>}
                    {current?.subject && current?.chapter && <span> · </span>}
                    {current?.chapter && <span>{current.chapter}</span>}
                    {current?.bookPage != null && (
                      <span>
                        {" "}
                        · Book p. {current.bookPage}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", borderBottom: `1px solid ${C.navy}08` }}>
                  {(
                    [
                      { id: "quick" as const, label: "⚡ Quick" },
                      { id: "revise" as const, label: "📝 Revise" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      style={{
                        flex: 1,
                        padding: "10px 8px",
                        fontSize: 11,
                        fontWeight: tab === t.id ? 700 : 500,
                        background: tab === t.id ? C.navy : "transparent",
                        color: tab === t.id ? "#fff" : C.steel,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div style={{ padding: 18, minHeight: 160 }}>
                  <p style={{ fontSize: 14, color: C.navy, lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>
                    {tab === "quick"
                      ? current?.quickContent || "No Quick (Tenglish) snippet saved for this star."
                      : current?.reviseContent || "No Revise snippet saved for this star."}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={openInLesson}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 12,
                  background: C.navy,
                  color: C.gold,
                  border: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Open full lesson
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={removeCurrent}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 12,
                  background: "transparent",
                  color: C.steel,
                  border: `1px solid ${C.navy}12`,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Remove from revision list
              </motion.button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
