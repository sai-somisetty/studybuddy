"use client";

import React from "react";

/**
 * SOMI MarkdownRenderer — Navy + Gold Editorial Design
 * 
 * Handles these markdown patterns from SOMI Engine:
 * - **bold text** → navy bold
 * - | tables | → navy header, gold first column, striped rows
 * - > 📐 Formula blockquotes → navy card with gold text
 * - > 🎯 Mama tip blockquotes → gold-bordered callout
 * - > ⚠️ Warning blockquotes → subtle warning card
 * - > MAMA: "tip" → sand-colored MAMA tip bar
 * - Numbered lists → gold number + card layout
 * - Bullet points → gold dot + clean typography
 * - Emoji headings → section headers
 */

// ── Design tokens ──
const C = {
  navy: "#071739",
  gold: "#E3C39D",
  goldLight: "#F0DCC4",
  sand: "#A68868",
  steel: "#4B6382",
  bg: "#FAFAF8",
  white: "#ffffff",
  text: "#071739",
  textLight: "#4B6382",
  border: "rgba(7,23,57,0.06)",
  borderGold: "rgba(227,195,157,0.2)",
};

interface Props {
  content: string;
  className?: string;
}

// ── Table parser ──
function parseTable(tableText: string) {
  const lines = tableText.trim().split("\n");
  const headers = lines[0]
    .split("|")
    .filter((h) => h.trim())
    .map((h) => h.trim().replace(/\*\*/g, ""));
  const rows = lines
    .slice(2)
    .filter((line) => line.includes("|"))
    .map((line) =>
      line.split("|").filter((cell) => cell.trim()).map((cell) => cell.trim())
    );
  return { headers, rows };
}

// ── Table renderer ──
function renderTable(tableText: string, index: number) {
  const { headers, rows } = parseTable(tableText);
  return (
    <div key={index} style={{
      overflowX: "auto", margin: "14px 0", borderRadius: 12,
      border: `1px solid ${C.border}`, background: C.white,
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead>
          <tr style={{ background: C.navy }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: "10px 14px", color: C.goldLight,
                textAlign: "left", fontWeight: 600, fontSize: 11,
                letterSpacing: "0.04em",
                borderRight: i < headers.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{
              background: ri % 2 === 0 ? C.white : C.bg,
              borderBottom: `1px solid ${C.border}`,
            }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: "9px 14px",
                  color: ci === 0 ? C.navy : C.textLight,
                  fontWeight: ci === 0 ? 600 : 400,
                  fontSize: 12, lineHeight: 1.5,
                  borderRight: ci < row.length - 1 ? `1px solid ${C.border}` : "none",
                }}>{renderInlineFormatting(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Inline bold/italic parser ──
function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: C.navy, fontWeight: 600 }}>{part}</strong>
      : <React.Fragment key={i}>{part}</React.Fragment>
  );
}

// ── Blockquote renderer (formula, tip, warning, mama) ──
function renderBlockquote(lines: string[], index: number) {
  const text = lines.map((l) => l.replace(/^>\s?/, "")).join("\n");
  const firstLine = text.trim();

  // 📐 Formula card — navy bg, gold text
  if (firstLine.startsWith("📐")) {
    const content = text.replace(/^📐\s*/, "");
    return (
      <div key={index} style={{
        background: C.navy, borderRadius: 12, padding: "16px 18px",
        margin: "16px 0",
        boxShadow: "0 4px 16px rgba(7,23,57,0.12)",
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.12em",
          textTransform: "uppercase" as const, color: C.gold, marginBottom: 8, opacity: 0.7,
        }}>Formula</div>
        {content.split("\n").map((line, i) => (
          <div key={i} style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 16, color: C.goldLight, lineHeight: 1.6,
          }}>{renderInlineFormatting(line.trim())}</div>
        ))}
      </div>
    );
  }

  // 🎯 Mama's Exam Tip — gold border callout
  if (firstLine.startsWith("🎯")) {
    const content = text.replace(/^🎯\s*/, "").replace(/^\*\*.*?\*\*\s*\n?/, "");
    return (
      <div key={index} style={{
        background: `linear-gradient(135deg, rgba(7,23,57,0.02), rgba(227,195,157,0.06))`,
        borderLeft: `3px solid ${C.gold}`, borderRadius: "0 12px 12px 0",
        padding: "14px 16px", margin: "16px 0",
        border: `1px solid ${C.borderGold}`, borderLeftWidth: 3, borderLeftColor: C.gold,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase" as const, color: C.sand, marginBottom: 8,
        }}>🎯 Mama's Exam Tip</div>
        {content.split("\n").filter(l => l.trim()).map((line, i) => (
          <p key={i} style={{ fontSize: 13, color: C.navy, lineHeight: 1.6, margin: "4px 0" }}>
            {renderInlineFormatting(line.trim())}
          </p>
        ))}
      </div>
    );
  }

  // ⚠️ Warning/Common Mistakes — subtle card
  if (firstLine.startsWith("⚠️")) {
    const content = text.replace(/^⚠️\s*/, "").replace(/^\*\*.*?\*\*\s*\n?/, "");
    return (
      <div key={index} style={{
        background: "rgba(7,23,57,0.03)", borderRadius: 12,
        padding: "14px 16px", margin: "16px 0",
        border: `1px solid ${C.border}`,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase" as const, color: C.navy, marginBottom: 10, opacity: 0.5,
        }}>⚠️ Common Mistakes</div>
        {content.split("\n").filter(l => l.trim()).map((line, i) => (
          <p key={i} style={{ fontSize: 13, color: C.navy, lineHeight: 1.6, margin: "4px 0", opacity: 0.8 }}>
            {renderInlineFormatting(line.trim())}
          </p>
        ))}
      </div>
    );
  }

  // MAMA: inline tip — sand bar
  if (firstLine.startsWith("MAMA:") || firstLine.startsWith("MAMA :")) {
    const tipText = text.replace(/^MAMA\s*:\s*/, "").replace(/^[""]|[""]$/g, "");
    return (
      <div key={index} style={{
        display: "flex", gap: 10, alignItems: "flex-start",
        background: "rgba(227,195,157,0.08)",
        border: `1px solid ${C.borderGold}`,
        borderRadius: 10, padding: "12px 14px", margin: "14px 0",
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
          background: C.sand, color: "#fff",
          padding: "2px 8px", borderRadius: 3,
          transform: "rotate(-2deg)", flexShrink: 0,
          textTransform: "uppercase" as const,
        }}>MAMA</span>
        <span style={{ fontSize: 13, color: C.navy, lineHeight: 1.55, fontStyle: "italic" }}>
          "{tipText}"
        </span>
      </div>
    );
  }

  // Generic blockquote — subtle indent
  return (
    <div key={index} style={{
      borderLeft: `2px solid ${C.gold}`, paddingLeft: 14,
      margin: "12px 0", opacity: 0.85,
    }}>
      {text.split("\n").filter(l => l.trim()).map((line, i) => (
        <p key={i} style={{ fontSize: 13, color: C.navy, lineHeight: 1.6, margin: "3px 0" }}>
          {renderInlineFormatting(line.trim())}
        </p>
      ))}
    </div>
  );
}

// ── Main renderer ──
export default function MarkdownRenderer({ content, className }: Props) {
  if (!content) return null;

  const elements: React.ReactNode[] = [];
  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Table (starts with |) ──
    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(renderTable(tableLines.join("\n"), elements.length));
      continue;
    }

    // ── Blockquote (starts with >) ──
    if (line.trim().startsWith(">")) {
      const bqLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        bqLines.push(lines[i]);
        i++;
      }
      elements.push(renderBlockquote(bqLines, elements.length));
      continue;
    }

    // ── Bold heading (entire line is **bold**) ──
    if (line.trim().startsWith("**") && line.trim().endsWith("**") && !line.trim().startsWith("**Definition")) {
      elements.push(
        <p key={elements.length} style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontWeight: 400, color: C.navy, fontSize: 16,
          margin: "18px 0 8px 0", lineHeight: 1.3,
        }}>
          {line.trim().replace(/\*\*/g, "")}
        </p>
      );
      i++;
      continue;
    }

    // ── Definition line (starts with **Definition) ──
    if (line.trim().startsWith("**Definition")) {
      elements.push(
        <p key={elements.length} style={{
          fontSize: 13.5, color: C.navy, lineHeight: 1.7,
          margin: "6px 0", fontWeight: 400,
        }}>
          {renderInlineFormatting(line.trim())}
        </p>
      );
      i++;
      continue;
    }

    // ── Bullet point ──
    if (line.trim().startsWith("•") || line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      elements.push(
        <div key={elements.length} style={{
          display: "flex", gap: 10, margin: "5px 0",
          paddingLeft: 4, alignItems: "flex-start",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: C.gold, opacity: 0.6, flexShrink: 0,
            marginTop: 7,
          }} />
          <p style={{
            fontSize: 13, color: C.navy, margin: 0,
            lineHeight: 1.65, flex: 1,
          }}>
            {renderInlineFormatting(line.trim().replace(/^[•\-*]\s*/, ""))}
          </p>
        </div>
      );
      i++;
      continue;
    }

    // ── Numbered list ──
    if (/^\d+\./.test(line.trim())) {
      const num = line.trim().match(/^(\d+)\./)?.[1] || "1";
      elements.push(
        <div key={elements.length} style={{
          display: "flex", gap: 12, margin: "6px 0",
          padding: "10px 14px", background: C.white,
          borderRadius: 10, border: `1px solid ${C.border}`,
          alignItems: "flex-start",
        }}>
          <span style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 18, color: C.gold, opacity: 0.7,
            lineHeight: 1, flexShrink: 0, minWidth: 20,
            paddingTop: 2,
          }}>{num}</span>
          <p style={{
            fontSize: 13, color: C.navy, margin: 0,
            lineHeight: 1.65, flex: 1,
          }}>
            {renderInlineFormatting(line.trim().replace(/^\d+\.\s*/, ""))}
          </p>
        </div>
      );
      i++;
      continue;
    }

    // ── Emoji heading ──
    if (line.trim().match(/^[\u{1F300}-\u{1F9FF}]/u)) {
      elements.push(
        <p key={elements.length} style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontWeight: 400, color: C.navy, fontSize: 15,
          margin: "16px 0 6px 0",
        }}>
          {renderInlineFormatting(line.trim())}
        </p>
      );
      i++;
      continue;
    }

    // ── Empty line ──
    if (!line.trim()) {
      elements.push(<div key={elements.length} style={{ height: 6 }} />);
      i++;
      continue;
    }

    // ── Regular paragraph ──
    elements.push(
      <p key={elements.length} style={{
        fontSize: 13.5, color: C.navy, margin: "5px 0",
        lineHeight: 1.7, opacity: 0.85,
      }}>
        {renderInlineFormatting(line.trim())}
      </p>
    );
    i++;
  }

  return <div className={className}>{elements}</div>;
}
