"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { SomiIcons } from "@/components/SomiIcons";

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

type RevisionOverviewProps = {
  items: StarredItem[];
  onStartRevision: (playlist: StarredItem[]) => void;
};

function RevisionOverview({ items, onStartRevision }: RevisionOverviewProps) {
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterChapter, setFilterChapter] = useState<string>("all");

  const subjects = [...new Set(items.map((i) => i.subject).filter(Boolean))] as string[];
  const chapters = [...new Set(items.map((i) => i.chapter).filter(Boolean))] as string[];

  const filtered = items.filter((i) => {
    if (filterSubject !== "all" && i.subject !== filterSubject) return false;
    if (filterChapter !== "all" && i.chapter !== filterChapter) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, StarredItem[]>>((acc, row) => {
    const k = row.subject || "Other";
    if (!acc[k]) acc[k] = [];
    acc[k].push(row);
    return acc;
  }, {});

  return (
    <>
      {/* Subject filter */}
      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          marginBottom: 10,
          paddingBottom: 4,
          WebkitOverflowScrolling: "touch",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setFilterSubject("all");
            setFilterChapter("all");
          }}
          style={{
            padding: "6px 14px",
            borderRadius: 20,
            flexShrink: 0,
            background: filterSubject === "all" ? "#071739" : "transparent",
            color: filterSubject === "all" ? "#E3C39D" : "#071739",
            border: filterSubject === "all" ? "none" : "1.5px solid rgba(7,23,57,0.1)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          All Subjects
        </button>
        {subjects.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setFilterSubject(s);
              setFilterChapter("all");
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              flexShrink: 0,
              background: filterSubject === s ? "#071739" : "transparent",
              color: filterSubject === s ? "#E3C39D" : "#071739",
              border: filterSubject === s ? "none" : "1.5px solid rgba(7,23,57,0.1)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            {s.length > 25 ? `${s.slice(0, 25)}…` : s}
          </button>
        ))}
      </div>

      {/* Chapter filter — only show when a subject is selected */}
      {filterSubject !== "all" && (
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            marginBottom: 14,
            paddingBottom: 4,
            WebkitOverflowScrolling: "touch",
          }}
        >
          <button
            type="button"
            onClick={() => setFilterChapter("all")}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              flexShrink: 0,
              background: filterChapter === "all" ? "#071739" : "transparent",
              color: filterChapter === "all" ? "#E3C39D" : "#071739",
              border: filterChapter === "all" ? "none" : "1.5px solid rgba(7,23,57,0.1)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            All Chapters
          </button>
          {chapters
            .filter((ch) => items.some((i) => i.subject === filterSubject && i.chapter === ch))
            .map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setFilterChapter(ch)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  flexShrink: 0,
                  background: filterChapter === ch ? "#071739" : "transparent",
                  color: filterChapter === ch ? "#E3C39D" : "#071739",
                  border: filterChapter === ch ? "none" : "1.5px solid rgba(7,23,57,0.1)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                {ch.length > 20 ? `${ch.slice(0, 20)}…` : ch}
              </button>
            ))}
        </div>
      )}

      {filtered.length === 0 && items.length > 0 && (
        <p style={{ fontSize: 13, color: C.steel, marginBottom: 16, lineHeight: 1.5 }}>
          No starred concepts in this selection. Try a different filter.
        </p>
      )}

      {filtered.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {Object.entries(grouped).map(([subject, rows]) => (
            <div key={subject} style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.steel,
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                }}
              >
                {subject}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {rows.map((row) => (
                  <div
                    key={row.key}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "#fff",
                      border: `1px solid rgba(7,23,57,0.08)`,
                      fontSize: 13,
                      color: C.navy,
                      lineHeight: 1.4,
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{row.title || row.concept}</div>
                    {row.chapter && (
                      <div style={{ fontSize: 11, color: C.steel, marginTop: 4 }}>{row.chapter}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <motion.button
        type="button"
        whileTap={{ scale: filtered.length > 0 ? 0.98 : 1 }}
        onClick={() => {
          if (filtered.length > 0) onStartRevision([...filtered]);
        }}
        disabled={filtered.length === 0}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 12,
          background: filtered.length > 0 ? C.navy : `${C.navy}40`,
          color: C.gold,
          border: "none",
          fontSize: 14,
          fontWeight: 600,
          cursor: filtered.length > 0 ? "pointer" : "not-allowed",
          marginBottom: 8,
        }}
      >
        Start Revision ({filtered.length} concepts)
      </motion.button>
    </>
  );
}

export default function RevisionPage() {
  const router = useRouter();
  const [items, setItems] = useState<StarredItem[]>([]);
  const [playlist, setPlaylist] = useState<StarredItem[]>([]);
  const [inPlayer, setInPlayer] = useState(false);
  const [idx, setIdx] = useState(0);
  const [tab, setTab] = useState<"quick" | "revise">("quick");

  const refresh = useCallback(() => {
    setItems(loadStarred());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const current = inPlayer ? playlist[idx] : undefined;

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
    const key = current.key;
    const nextItems = items.filter((x) => x.key !== key);
    localStorage.setItem("somi_starred", JSON.stringify(nextItems));
    localStorage.removeItem(`imp_${current.pageId}_${current.paraIdx}`);
    setItems(nextItems);
    const nextPl = playlist.filter((x) => x.key !== key);
    setPlaylist(nextPl);
    setIdx((i) => (nextPl.length === 0 ? 0 : Math.min(i, nextPl.length - 1)));
    if (nextPl.length === 0) setInPlayer(false);
  };

  const goPrev = () => setIdx((i) => (i <= 0 ? playlist.length - 1 : i - 1));
  const goNext = () => setIdx((i) => (playlist.length === 0 ? 0 : (i + 1) % playlist.length));

  useEffect(() => {
    setTab("quick");
  }, [idx]);

  const startRevision = (filtered: StarredItem[]) => {
    setPlaylist(filtered);
    setIdx(0);
    setInPlayer(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 20px", paddingBottom: 100, position: "relative" }}>
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: "max(8px, env(safe-area-inset-top, 8px))",
            right: 0,
            fontFamily: "'DM Serif Display', serif",
            fontWeight: 900,
            fontSize: "clamp(80px, 22vw, 140px)",
            color: C.navy,
            opacity: 0.06,
            lineHeight: 1,
            userSelect: "none",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {String(items.length).padStart(2, "0")}
        </span>
        <header
          style={{
            paddingTop: "max(48px, env(safe-area-inset-top, 48px))",
            paddingBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            position: "relative",
            zIndex: 1,
          }}
        >
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => (inPlayer ? setInPlayer(false) : router.push("/home"))}
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
            aria-label={inPlayer ? "Back to revision list" : "Back to home"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </motion.button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.navy, fontWeight: 400 }}>
              {inPlayer ? "Revision" : "Revision Mode"}
            </div>
            <div style={{ fontSize: 12, color: C.steel, marginTop: 2 }}>
              {inPlayer
                ? `${idx + 1} / ${playlist.length} in this session`
                : `${items.length} starred ${items.length === 1 ? "concept" : "concepts"}`}
            </div>
          </div>
        </header>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", padding: "48px 16px" }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <SomiIcons.StarOutline size={40} />
            </div>
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
        ) : !inPlayer ? (
          <RevisionOverview items={items} onStartRevision={startRevision} />
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
                {idx + 1} / {playlist.length}
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
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: C.gold,
                      letterSpacing: "0.1em",
                      marginBottom: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <SomiIcons.Star size={14} />
                    STARRED
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
                      { id: "quick" as const, icon: SomiIcons.Bolt, text: "Quick" },
                      { id: "revise" as const, icon: SomiIcons.Pen, text: "Revise" },
                    ] as const
                  ).map((t) => {
                    const Ico = t.icon;
                    const active = tab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        style={{
                          flex: 1,
                          padding: "10px 8px",
                          fontSize: 11,
                          fontWeight: active ? 700 : 500,
                          background: active ? C.navy : "transparent",
                          color: active ? "#fff" : C.steel,
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <Ico size={14} color={active ? "#fff" : C.steel} />
                        {t.text}
                      </button>
                    );
                  })}
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
