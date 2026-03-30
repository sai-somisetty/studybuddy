"use client";

import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://studybuddy-production-7776.up.railway.app";

// ── Types ────────────────────────────────────────────────────────────────────

interface MamaLine {
  text: string;
  tenglish: string;
  is_key_concept: boolean;
  kitty_question: string;
  mama_kitty_answer: string;
  check_question: string;
  check_options: string[];
  check_answer: number;
  check_explanation: string;
  mama_response_correct: string;
  mama_response_wrong: string;
}

interface LessonPage {
  id: string;
  namespace: string;
  concept: string;
  chapter: string;
  page_ref: number;
  book_page: number;
  pdf_page: number;
  is_verified: boolean;
  mama_lines: MamaLine[];
}

interface TreeConcept {
  label: string;
  namespace: string;
}

interface TreeSection {
  label: string;
  concepts: TreeConcept[];
}

interface TreeChapter {
  id: string;
  label: string;
  sections: TreeSection[];
}

interface TreeSubject {
  id: string;
  label: string;
  chapters: TreeChapter[];
}

// ── Static tree data ─────────────────────────────────────────────────────────

const TREE: TreeSubject[] = [
  {
    id: "cma_f_law",
    label: "CMA F — Business Laws",
    chapters: [
      {
        id: "ch1", label: "Ch 1 — Intro to Business Laws",
        sections: [
          { label: "S1 — Sources of Law", concepts: [
            { label: "1.1 Sources of Law", namespace: "cma_f_law_ch1_s1" },
            { label: "1.2 Legislative Process", namespace: "cma_f_law_ch1_s1" },
            { label: "1.3 Court System", namespace: "cma_f_law_ch1_s1" },
          ]},
        ],
      },
      {
        id: "ch2", label: "Ch 2 — Indian Contracts Act",
        sections: [
          { label: "S1 — Essential Elements", concepts: [
            { label: "2.1 Offer and Acceptance", namespace: "cma_f_law_ch2_s1" },
            { label: "2.2 Void Agreements", namespace: "cma_f_law_ch2_s1" },
            { label: "2.3 Consideration", namespace: "cma_f_law_ch2_s1" },
            { label: "2.4 Capacity & Consent", namespace: "cma_f_law_ch2_s1" },
          ]},
          { label: "S2 — Performance", concepts: [
            { label: "2.5 Quasi Contracts", namespace: "cma_f_law_ch2_s2" },
            { label: "2.6 Performance", namespace: "cma_f_law_ch2_s2" },
            { label: "2.9 Discharge", namespace: "cma_f_law_ch2_s2" },
            { label: "2.10 Breach & Remedies", namespace: "cma_f_law_ch2_s2" },
          ]},
        ],
      },
      {
        id: "ch3", label: "Ch 3 — Sale of Goods Act",
        sections: [
          { label: "S1 — Definitions & Transfer", concepts: [
            { label: "3.1 Definition", namespace: "cma_f_law_ch3_s1" },
            { label: "3.2 Transfer of Ownership", namespace: "cma_f_law_ch3_s1" },
            { label: "3.3 Conditions and Warranties", namespace: "cma_f_law_ch3_s1" },
          ]},
        ],
      },
      {
        id: "ch4", label: "Ch 4 — Negotiable Instruments",
        sections: [
          { label: "S1 — Instruments", concepts: [
            { label: "4.1 Characteristics", namespace: "cma_f_law_ch4_s1" },
            { label: "4.2 Definitions", namespace: "cma_f_law_ch4_s1" },
            { label: "4.3 Differences", namespace: "cma_f_law_ch4_s1" },
            { label: "4.4 Crossing", namespace: "cma_f_law_ch4_s1" },
            { label: "4.5 Dishonour s138", namespace: "cma_f_law_ch4_s1" },
          ]},
        ],
      },
      {
        id: "ch5", label: "Ch 5 — Business Communication",
        sections: [
          { label: "S1 — Communication Basics", concepts: [
            { label: "5.1 Meaning of Communication", namespace: "cma_f_law_ch5_s1" },
            { label: "5.2 Types of Communication", namespace: "cma_f_law_ch5_s1" },
          ]},
        ],
      },
    ],
  },
  {
    id: "cma_f_acc",
    label: "CMA F — Accounting",
    chapters: [
      {
        id: "ch1", label: "Ch 1 — Accounting Fundamentals",
        sections: [
          { label: "S1 — Basics", concepts: [
            { label: "1.1 Meaning & Scope", namespace: "cma_f_acc_ch1_s1" },
            { label: "1.2 Accounting Assumptions", namespace: "cma_f_acc_ch1_s1" },
          ]},
        ],
      },
    ],
  },
];

// ── Breadcrumb helper ─────────────────────────────────────────────────────────

interface BreadcrumbPath {
  subject: string;
  chapter: string;
  section: string;
  concept: string;
}

function findBreadcrumb(concept: TreeConcept | null): BreadcrumbPath | null {
  if (!concept) return null;
  for (const subject of TREE) {
    for (const chapter of subject.chapters) {
      for (const section of chapter.sections) {
        for (const c of section.concepts) {
          if (c.namespace === concept.namespace && c.label === concept.label) {
            return {
              subject: subject.label,
              chapter: chapter.label,
              section: section.label,
              concept: c.label,
            };
          }
        }
      }
    }
  }
  return null;
}

// ── PDF Viewer placeholder ────────────────────────────────────────────────────

function PDFPane({
  bookPage,
  namespace,
}: {
  bookPage: number | null;
  namespace: string | null;
}) {
  return (
    <div style={{
      width: 420,
      flexShrink: 0,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#F5F0E8",
      borderLeft: "1px solid #e5e7eb",
      gap: 12,
      padding: 24,
    }}>
      <div style={{ fontSize: 40 }}>📄</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0A2E28", textAlign: "center" }}>
        PDF Viewer
      </div>
      {namespace && (
        <div style={{ fontSize: 11, color: "#6B6560", textAlign: "center", lineHeight: 1.6 }}>
          <div>Namespace: {namespace}</div>
          {bookPage && <div>Book page: {bookPage}</div>}
        </div>
      )}
      {!namespace && (
        <div style={{ fontSize: 11, color: "#A89880", textAlign: "center" }}>
          Select a concept to preview its PDF page
        </div>
      )}
    </div>
  );
}

// ── Select Page Modal ─────────────────────────────────────────────────────────

function SelectPageModal({
  onClose,
  onSelect,
  selected,
}: {
  onClose: () => void;
  onSelect: (concept: TreeConcept) => void;
  selected: TreeConcept | null;
}) {
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({ cma_f_law: true });
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  function toggleSubject(id: string) {
    setExpandedSubjects((p) => ({ ...p, [id]: !p[id] }));
  }
  function toggleChapter(key: string) {
    setExpandedChapters((p) => ({ ...p, [key]: !p[key] }));
  }
  function toggleSection(key: string) {
    setExpandedSections((p) => ({ ...p, [key]: !p[key] }));
  }

  return (
    /* Overlay */
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {/* Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 600,
          maxWidth: "100%",
          maxHeight: "80vh",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Modal header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #e5e7eb",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0A2E28" }}>
            📂 Select Page
          </span>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              color: "#9ca3af",
              lineHeight: 1,
              padding: "2px 6px",
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {TREE.map((subject) => {
            const subjOpen = !!expandedSubjects[subject.id];
            return (
              <div key={subject.id}>
                {/* Subject row */}
                <button
                  onClick={() => toggleSubject(subject.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 20px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid #f3f4f6",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 10, color: "#9ca3af", width: 12 }}>
                    {subjOpen ? "▼" : "▶"}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0A2E28" }}>
                    {subject.label}
                  </span>
                </button>

                {subjOpen && subject.chapters.map((chapter) => {
                  const chKey = `${subject.id}_${chapter.id}`;
                  const chOpen = !!expandedChapters[chKey];
                  return (
                    <div key={chKey}>
                      {/* Chapter row */}
                      <button
                        onClick={() => toggleChapter(chKey)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 20px 8px 36px",
                          background: "#fafafa",
                          border: "none",
                          borderBottom: "1px solid #f3f4f6",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ fontSize: 10, color: "#9ca3af", width: 12 }}>
                          {chOpen ? "▼" : "▶"}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                          {chapter.label}
                        </span>
                      </button>

                      {chOpen && chapter.sections.map((section) => {
                        const secKey = `${chKey}_${section.label}`;
                        const secOpen = !!expandedSections[secKey];
                        return (
                          <div key={secKey}>
                            {/* Section row */}
                            <button
                              onClick={() => toggleSection(secKey)}
                              style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "7px 20px 7px 52px",
                                background: "#f5f5f5",
                                border: "none",
                                borderBottom: "1px solid #f3f4f6",
                                cursor: "pointer",
                                textAlign: "left",
                              }}
                            >
                              <span style={{ fontSize: 9, color: "#9ca3af", width: 12 }}>
                                {secOpen ? "▼" : "▶"}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>
                                {section.label}
                              </span>
                            </button>

                            {secOpen && (
                              <div>
                                {section.concepts.map((concept) => {
                                  const isSelected =
                                    selected?.label === concept.label &&
                                    selected?.namespace === concept.namespace;
                                  return (
                                    <button
                                      key={concept.namespace + concept.label}
                                      onClick={() => {
                                        onSelect(concept);
                                        onClose();
                                      }}
                                      style={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "7px 20px 7px 68px",
                                        background: isSelected ? "#E1F5EE" : "transparent",
                                        border: "none",
                                        borderLeft: isSelected ? "3px solid #0A2E28" : "3px solid transparent",
                                        borderBottom: "1px solid #f9fafb",
                                        cursor: "pointer",
                                        textAlign: "left",
                                      }}
                                    >
                                      <span style={{ fontSize: 11, color: isSelected ? "#0A2E28" : "#374151", fontWeight: isSelected ? 600 : 400 }}>
                                        {concept.label}
                                      </span>
                                      {isSelected && (
                                        <span style={{ fontSize: 10, color: "#0A2E28", marginLeft: "auto" }}>✓</span>
                                      )}
                                    </button>
                                  );
                                })}
                                {/* + Add Page button */}
                                <button
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "6px 20px 6px 68px",
                                    background: "transparent",
                                    border: "none",
                                    borderBottom: "1px solid #f3f4f6",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    color: "#9ca3af",
                                    fontSize: 11,
                                  }}
                                >
                                  <span>+</span>
                                  <span>Add Page</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Breadcrumb bar ────────────────────────────────────────────────────────────

function BreadcrumbBar({
  concept,
  pageNum,
  onOpenModal,
}: {
  concept: TreeConcept | null;
  pageNum: number;
  onOpenModal: () => void;
}) {
  const path = findBreadcrumb(concept);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 16px",
      background: "#fff",
      borderBottom: "1px solid #e5e7eb",
      flexShrink: 0,
      gap: 12,
      minHeight: 44,
    }}>
      {/* Breadcrumb text */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {path ? (
          <span style={{
            fontSize: 12,
            color: "#6B7280",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "block",
          }}>
            <span style={{ color: "#9ca3af" }}>{path.subject}</span>
            <span style={{ color: "#d1d5db", margin: "0 6px" }}>›</span>
            <span style={{ color: "#9ca3af" }}>{path.chapter}</span>
            <span style={{ color: "#d1d5db", margin: "0 6px" }}>›</span>
            <span style={{ color: "#9ca3af" }}>{path.section}</span>
            <span style={{ color: "#d1d5db", margin: "0 6px" }}>›</span>
            <span style={{ color: "#374151", fontWeight: 600 }}>{path.concept}</span>
            <span style={{ color: "#d1d5db", margin: "0 6px" }}>›</span>
            <span style={{ color: "#374151", fontWeight: 600 }}>Page {pageNum}</span>
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>
            No page selected — click Change Page to begin
          </span>
        )}
      </div>

      {/* Change Page button */}
      <button
        onClick={onOpenModal}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px",
          borderRadius: 7,
          border: "1px solid #d1d5db",
          background: "#fff",
          color: "#374151",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        📂 Change Page
      </button>
    </div>
  );
}

// ── Concept Form ─────────────────────────────────────────────────────────────

function ConceptForm({
  form,
  sectionOpen,
  toggleSection,
  updateForm,
  updateOption,
}: {
  form: MamaLine;
  sectionOpen: { tenglish: boolean; kitty: boolean; check: boolean; responses: boolean };
  toggleSection: (k: keyof typeof sectionOpen) => void;
  updateForm: (field: keyof MamaLine, value: string | boolean | number | string[]) => void;
  updateOption: (idx: number, value: string) => void;
}) {
  const ACCENT = "#0A2E28";
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    fontSize: 12,
    color: "#1A1208",
    background: "#FAFAF8",
    outline: "none",
    lineHeight: 1.6,
    resize: "vertical" as const,
    fontFamily: "inherit",
  };

  function SectionHeader({
    sectionKey,
    icon,
    label,
    collapsible = true,
  }: {
    sectionKey?: keyof typeof sectionOpen;
    icon: string;
    label: string;
    collapsible?: boolean;
  }) {
    const isOpen = collapsible && sectionKey ? sectionOpen[sectionKey] : true;
    return (
      <div
        onClick={() => collapsible && sectionKey && toggleSection(sectionKey)}
        style={{
          cursor: collapsible ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: "#F5F0E8",
          borderBottom: "1px solid #e5e7eb",
          userSelect: "none",
        }}
      >
        <p style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: ACCENT,
        }}>
          {icon} {label}
        </p>
        {collapsible && (
          <span style={{ fontSize: 10, color: "#9ca3af" }}>{isOpen ? "▼" : "▶"}</span>
        )}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>

      {/* ── 📖 Content — always open ── */}
      <SectionHeader icon="📖" label="Content" collapsible={false} />
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
        <label style={{ fontSize: 10, fontWeight: 600, color: "#6B6560", display: "block", marginBottom: 4 }}>
          ICMAI Official Text
        </label>
        <textarea
          rows={4}
          value={form.text || ""}
          onChange={(e) => updateForm("text", e.target.value)}
          style={inputStyle}
          placeholder="Official ICMAI textbook text…"
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <input
            type="checkbox"
            id="is_key"
            checked={!!form.is_key_concept}
            onChange={(e) => updateForm("is_key_concept", e.target.checked)}
            style={{ accentColor: ACCENT, cursor: "pointer" }}
          />
          <label htmlFor="is_key" style={{ fontSize: 11, color: "#374151", cursor: "pointer" }}>
            Key concept (shows Kitty + check question)
          </label>
        </div>
      </div>

      {/* ── 🧠 Mama's Explanation ── */}
      <SectionHeader sectionKey="tenglish" icon="🧠" label="Mama's Explanation" />
      {sectionOpen.tenglish && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: "#6B6560", display: "block", marginBottom: 4 }}>
            Tenglish Explanation
          </label>
          <textarea
            rows={4}
            value={form.tenglish || ""}
            onChange={(e) => updateForm("tenglish", e.target.value)}
            style={inputStyle}
            placeholder="Mama explains in Tenglish with Indian company examples…"
          />
        </div>
      )}

      {/* ── 😺 Kitty Interaction ── */}
      <SectionHeader sectionKey="kitty" icon="😺" label="Kitty Interaction" />
      {sectionOpen.kitty && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: "#6B6560", display: "block", marginBottom: 4 }}>
              Kitty Question
            </label>
            <textarea
              rows={2}
              value={form.kitty_question || ""}
              onChange={(e) => updateForm("kitty_question", e.target.value)}
              style={inputStyle}
              placeholder="Kitty's confused question in Tenglish…"
            />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: "#6B6560", display: "block", marginBottom: 4 }}>
              Mama's Answer to Kitty
            </label>
            <textarea
              rows={3}
              value={form.mama_kitty_answer || ""}
              onChange={(e) => updateForm("mama_kitty_answer", e.target.value)}
              style={inputStyle}
              placeholder="Mama answers Kitty's question…"
            />
          </div>
        </div>
      )}

      {/* ── ❓ Check Question ── */}
      <SectionHeader sectionKey="check" icon="❓" label="Check Question" />
      {sectionOpen.check && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: "#6B6560", display: "block", marginBottom: 4 }}>
              Question
            </label>
            <textarea
              rows={2}
              value={form.check_question || ""}
              onChange={(e) => updateForm("check_question", e.target.value)}
              style={inputStyle}
              placeholder="MCQ question text…"
            />
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: "#6B6560", display: "block", marginBottom: 6 }}>
              Options (select correct answer)
            </label>
            {["A", "B", "C", "D"].map((letter, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <input
                  type="radio"
                  name="check_answer"
                  checked={form.check_answer === idx}
                  onChange={() => updateForm("check_answer", idx)}
                  style={{ accentColor: "#16a34a", cursor: "pointer", flexShrink: 0 }}
                />
                <span style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  background: form.check_answer === idx ? "#16a34a" : "#e5e7eb",
                  color: form.check_answer === idx ? "#fff" : "#374151",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {letter}
                </span>
                <input
                  type="text"
                  value={(form.check_options || [])[idx] || ""}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  style={{ ...inputStyle, resize: "none" }}
                  placeholder={`Option ${letter}…`}
                />
              </div>
            ))}
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: "#6B6560", display: "block", marginBottom: 4 }}>
              Explanation
            </label>
            <textarea
              rows={2}
              value={form.check_explanation || ""}
              onChange={(e) => updateForm("check_explanation", e.target.value)}
              style={inputStyle}
              placeholder="Why the correct answer is right…"
            />
          </div>
        </div>
      )}

      {/* ── 💬 Mama Responses ── */}
      <SectionHeader sectionKey="responses" icon="💬" label="Mama Responses" />
      {sectionOpen.responses && (
        <div style={{ padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: "#16a34a", display: "block", marginBottom: 4 }}>
              ✓ When Correct
            </label>
            <textarea
              rows={2}
              value={form.mama_response_correct || ""}
              onChange={(e) => updateForm("mama_response_correct", e.target.value)}
              style={{ ...inputStyle, border: "1px solid #bbf7d0" }}
              placeholder="Mama's celebratory response…"
            />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: "#ef4444", display: "block", marginBottom: 4 }}>
              ✗ When Wrong
            </label>
            <textarea
              rows={2}
              value={form.mama_response_wrong || ""}
              onChange={(e) => updateForm("mama_response_wrong", e.target.value)}
              style={{ ...inputStyle, border: "1px solid #fecaca" }}
              placeholder="Mama's encouraging response when wrong…"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ContentDashboardPage() {
  const [selectedConcept, setSelectedConcept] = useState<TreeConcept | null>(null);
  const [pages, setPages] = useState<LessonPage[]>([]);
  const [selectedPageIdx, setSelectedPageIdx] = useState(0);
  const [selectedLineIdx, setSelectedLineIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [form, setForm] = useState<MamaLine | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [sectionOpen, setSectionOpen] = useState({
    tenglish: true,
    kitty: true,
    check: true,
    responses: true,
  });

  function toggleSection(key: keyof typeof sectionOpen) {
    setSectionOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  useEffect(() => {
    if (!selectedConcept) return;
    setLoading(true);
    setForm(null);
    fetch(`${API}/lesson/smart?namespace=${selectedConcept.namespace}`)
      .then((r) => r.json())
      .then((data) => {
        setPages(data.pages || []);
        setSelectedPageIdx(0);
        setSelectedLineIdx(0);
        if (data.pages?.[0]?.mama_lines?.[0]) {
          setForm({ ...data.pages[0].mama_lines[0] });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedConcept]);

  useEffect(() => {
    const line = pages[selectedPageIdx]?.mama_lines?.[selectedLineIdx];
    if (line) setForm({ ...line });
    else setForm(null);
  }, [selectedPageIdx, selectedLineIdx, pages]);

  function updateForm(field: keyof MamaLine, value: string | boolean | number | string[]) {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  function updateOption(idx: number, value: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const opts = [...(prev.check_options || [])];
      opts[idx] = value;
      return { ...prev, check_options: opts };
    });
  }

  async function handleSave() {
    if (!form || !selectedConcept || !pages[selectedPageIdx]) return;
    setSaving(true);
    setSaveMsg("");
    try {
      setPages((prev) => {
        const next = [...prev];
        const page = { ...next[selectedPageIdx] };
        const lines = [...(page.mama_lines || [])];
        lines[selectedLineIdx] = { ...form };
        page.mama_lines = lines;
        next[selectedPageIdx] = page;
        return next;
      });
      setSaveMsg("✓ Saved locally — push to DB from backend");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch {
      setSaveMsg("✗ Save failed");
    } finally {
      setSaving(false);
    }
  }

  const currentPage = pages[selectedPageIdx] ?? null;
  const currentLines = currentPage?.mama_lines ?? [];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#FAFAF8", fontFamily: "system-ui, sans-serif" }}>

      {/* Top bar */}
      <div style={{
        height: 48,
        background: "#0A2E28",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 16,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
          📚 StudyBuddy — Content Dashboard
        </span>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

        {/* ── CENTER PANE ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Breadcrumb + Change Page bar */}
          <BreadcrumbBar
            concept={selectedConcept}
            pageNum={selectedPageIdx + 1}
            onOpenModal={() => setShowModal(true)}
          />

          {/* Page / paragraph selector row */}
          {selectedConcept && !loading && (
            <div style={{
              background: "#fff",
              borderBottom: "1px solid #e5e7eb",
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, color: "#6B6560", fontWeight: 600 }}>PAGE</span>
              <div style={{ display: "flex", gap: 4 }}>
                {pages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedPageIdx(i); setSelectedLineIdx(0); }}
                    style={{
                      padding: "3px 10px",
                      borderRadius: 6,
                      border: "none",
                      background: selectedPageIdx === i ? "#0A2E28" : "#F5F0E8",
                      color: selectedPageIdx === i ? "#fff" : "#1A1208",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              {currentLines.length > 0 && (
                <>
                  <span style={{ fontSize: 11, color: "#6B6560", fontWeight: 600, marginLeft: 8 }}>PARA</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {currentLines.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedLineIdx(i)}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 6,
                          border: "none",
                          background: selectedLineIdx === i ? "#E67E22" : "#F5F0E8",
                          color: selectedLineIdx === i ? "#fff" : "#1A1208",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div style={{ flex: 1 }} />
              {saveMsg && (
                <span style={{
                  fontSize: 11,
                  color: saveMsg.startsWith("✓") ? "#16a34a" : "#ef4444",
                  fontWeight: 600,
                }}>
                  {saveMsg}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !form}
                style={{
                  padding: "5px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: form ? "#0A2E28" : "#e5e7eb",
                  color: form ? "#fff" : "#9ca3af",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: form ? "pointer" : "default",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          )}

          {/* Form body / empty states */}
          {loading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                <div style={{ fontSize: 13, color: "#0A2E28", fontWeight: 700 }}>Loading content…</div>
              </div>
            </div>
          ) : !selectedConcept ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0A2E28", marginBottom: 8 }}>
                  No page selected
                </div>
                <div style={{ fontSize: 11, color: "#A89880", lineHeight: 1.6, marginBottom: 20 }}>
                  Use the Change Page button above to pick a concept
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    color: "#374151",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  📂 Change Page
                </button>
              </div>
            </div>
          ) : form ? (
            <ConceptForm
              form={form}
              sectionOpen={sectionOpen}
              toggleSection={toggleSection}
              updateForm={updateForm}
              updateOption={updateOption}
            />
          ) : (
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#A89880",
              fontSize: 13,
            }}>
              No content for this concept yet.
            </div>
          )}
        </div>

        {/* ── PDF PANE ── */}
        <PDFPane
          bookPage={currentPage?.book_page ?? null}
          namespace={selectedConcept?.namespace ?? null}
        />
      </div>

      {/* ── Select Page Modal ── */}
      {showModal && (
        <SelectPageModal
          onClose={() => setShowModal(false)}
          onSelect={setSelectedConcept}
          selected={selectedConcept}
        />
      )}
    </div>
  );
}
