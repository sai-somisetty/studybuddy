"use client";

import React from "react";

/**
 * SOMI MarkdownRenderer v2 — Navy + Gold Editorial (Refined)
 * 
 * v2 changes:
 * - Numbered cards: larger gold numbers (22px serif), more padding (14x18), subtle shadow
 * - Bullet points: card-style with white bg + border + shadow
 * - Section headings: 18px serif, 28px top margin for breathing room
 * - Formula cards: 19px serif gold text, deeper shadow, more padding
 * - Example callouts: 4px gold left border (was 3px), better padding
 * - MAMA tip: rotated badge with box-shadow, curly quotes
 * - Paragraphs: 14.5px with 1.75 line-height
 * - Empty lines: 10px spacer (was 6px)
 * - Overall: every element has more vertical margin between them
 */

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
  border: "rgba(7,23,57,0.05)",
  borderGold: "rgba(227,195,157,0.2)",
  shadow: "0 2px 8px rgba(7,23,57,0.04)",
  shadowMd: "0 4px 16px rgba(7,23,57,0.08)",
};

interface Props {
  content: string;
  className?: string;
}

function parseTable(tableText: string) {
  const lines = tableText.trim().split("\n");
  const headers = lines[0]
    .split("|").filter((h) => h.trim()).map((h) => h.trim().replace(/\*\*/g, ""));
  const rows = lines.slice(2).filter((line) => line.includes("|"))
    .map((line) => line.split("|").filter((cell) => cell.trim()).map((cell) => cell.trim()));
  return { headers, rows };
}

function renderTable(tableText: string, index: number) {
  const { headers, rows } = parseTable(tableText);
  return (
    <div key={index} style={{
      overflowX: "auto", margin: "20px 0", borderRadius: 14,
      border: `1px solid ${C.border}`, background: C.white, boxShadow: C.shadow,
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: C.navy }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: "12px 16px", color: C.goldLight, textAlign: "left",
                fontWeight: 600, fontSize: 11, letterSpacing: "0.06em",
                borderRight: i < headers.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
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
                  padding: "11px 16px", color: ci === 0 ? C.navy : C.textLight,
                  fontWeight: ci === 0 ? 600 : 400, fontSize: 12.5, lineHeight: 1.55,
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

function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: C.navy, fontWeight: 700 }}>{part}</strong>
      : <React.Fragment key={i}>{part}</React.Fragment>
  );
}

function renderBlockquote(lines: string[], index: number) {
  const text = lines.map((l) => l.replace(/^>\s?/, "")).join("\n");
  const firstLine = text.trim();

  // 📐 Formula card
  if (firstLine.startsWith("📐")) {
    const content = text.replace(/^📐\s*/, "");
    const labelMatch = content.match(/^\*\*(.+?)\*\*\s*\n?/);
    const label = labelMatch ? labelMatch[1] : "Formula";
    const body = labelMatch ? content.replace(labelMatch[0], "") : content;
    return (
      <div key={index} style={{
        background: C.navy, borderRadius: 14, padding: "20px 22px",
        margin: "22px 0",
        boxShadow: `0 6px 24px rgba(7,23,57,0.15), 0 0 16px rgba(227,195,157,0.06)`,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase" as const, color: C.gold, marginBottom: 10, opacity: 0.7,
        }}>{label}</div>
        {body.split("\n").filter(l => l.trim()).map((line, i) => (
          <div key={i} style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 19, color: C.goldLight, lineHeight: 1.6,
            letterSpacing: "-0.01em",
          }}>{renderInlineFormatting(line.trim())}</div>
        ))}
      </div>
    );
  }

  // 🎯 Mama's Exam Tip
  if (firstLine.startsWith("🎯")) {
    const content = text.replace(/^🎯\s*/, "").replace(/^\*\*.*?\*\*\s*\n?/, "");
    return (
      <div key={index} style={{
        background: `linear-gradient(135deg, rgba(7,23,57,0.02), rgba(227,195,157,0.06))`,
        borderLeft: `4px solid ${C.gold}`,
        borderRadius: "0 14px 14px 0",
        padding: "18px 20px", margin: "22px 0", boxShadow: C.shadow,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase" as const, color: C.sand, marginBottom: 10,
        }}>🎯 Mama&apos;s Exam Tip</div>
        {content.split("\n").filter(l => l.trim()).map((line, i) => (
          <p key={i} style={{ fontSize: 14, color: C.navy, lineHeight: 1.7, margin: "5px 0" }}>
            {renderInlineFormatting(line.trim())}
          </p>
        ))}
      </div>
    );
  }

  // ⚠️ Common Mistakes
  if (firstLine.startsWith("⚠️")) {
    const content = text.replace(/^⚠️\s*/, "").replace(/^\*\*.*?\*\*\s*\n?/, "");
    return (
      <div key={index} style={{
        background: "rgba(7,23,57,0.025)", borderRadius: 14,
        padding: "18px 20px", margin: "22px 0", border: `1px solid ${C.border}`,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase" as const, color: C.navy, marginBottom: 12, opacity: 0.45,
        }}>⚠️ Common Mistakes</div>
        {content.split("\n").filter(l => l.trim()).map((line, i) => (
          <p key={i} style={{ fontSize: 13.5, color: C.navy, lineHeight: 1.65, margin: "5px 0", opacity: 0.8 }}>
            {renderInlineFormatting(line.trim())}
          </p>
        ))}
      </div>
    );
  }

  // MAMA: inline tip
  if (firstLine.startsWith("MAMA:") || firstLine.startsWith("MAMA :")) {
    const tipText = text.replace(/^MAMA\s*:\s*/, "").replace(/^[""\u201C]|[""\u201D]$/g, "").trim();
    return (
      <div key={index} style={{
        display: "flex", gap: 12, alignItems: "flex-start",
        background: "rgba(227,195,157,0.08)",
        border: `1px solid ${C.borderGold}`,
        borderRadius: 12, padding: "16px 18px", margin: "20px 0",
        boxShadow: C.shadow,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
          background: C.sand, color: "#fff",
          padding: "3px 10px", borderRadius: 4,
          transform: "rotate(-2deg)", flexShrink: 0,
          textTransform: "uppercase" as const,
          display: "inline-block",
          boxShadow: "0 2px 8px rgba(166,136,104,0.2)",
        }}>MAMA</span>
        <span style={{ fontSize: 14, color: C.navy, lineHeight: 1.65, fontStyle: "italic" }}>
          &ldquo;{tipText}&rdquo;
        </span>
      </div>
    );
  }

  // Generic blockquote with emoji lead (🏭 Real Example etc.)
  if (firstLine.match(/^[\u{1F300}-\u{1F9FF}]/u)) {
    const labelLine = text.split("\n")[0].replace(/\*\*/g, "");
    const content = text.split("\n").slice(1).join("\n").trim();
    return (
      <div key={index} style={{
        background: `linear-gradient(135deg, rgba(7,23,57,0.025), rgba(227,195,157,0.04))`,
        borderLeft: `4px solid ${C.gold}`,
        borderRadius: "0 14px 14px 0",
        padding: "18px 20px", margin: "22px 0", boxShadow: C.shadow,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase" as const, color: C.sand, marginBottom: 10,
        }}>{labelLine}</div>
        {content.split("\n").filter(l => l.trim()).map((line, i) => (
          <p key={i} style={{ fontSize: 14, color: C.navy, lineHeight: 1.7, margin: "5px 0" }}>
            {renderInlineFormatting(line.trim())}
          </p>
        ))}
      </div>
    );
  }

  // Generic blockquote
  return (
    <div key={index} style={{
      borderLeft: `3px solid ${C.gold}`, paddingLeft: 16,
      margin: "18px 0",
    }}>
      {text.split("\n").filter(l => l.trim()).map((line, i) => (
        <p key={i} style={{ fontSize: 14, color: C.navy, lineHeight: 1.7, margin: "4px 0", opacity: 0.85 }}>
          {renderInlineFormatting(line.trim())}
        </p>
      ))}
    </div>
  );
}

export default function MarkdownRenderer({ content, className }: Props) {
  if (!content) return null;

  const elements: React.ReactNode[] = [];
  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { tableLines.push(lines[i]); i++; }
      elements.push(renderTable(tableLines.join("\n"), elements.length));
      continue;
    }

    if (line.trim().startsWith(">")) {
      const bqLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) { bqLines.push(lines[i]); i++; }
      elements.push(renderBlockquote(bqLines, elements.length));
      continue;
    }

    if (line.trim().startsWith("**") && line.trim().endsWith("**") && !line.trim().startsWith("**Definition")) {
      elements.push(
        <h3 key={elements.length} style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontWeight: 400, color: C.navy, fontSize: 18,
          margin: "28px 0 10px 0", lineHeight: 1.25, letterSpacing: "-0.01em",
        }}>
          {line.trim().replace(/\*\*/g, "")}
        </h3>
      );
      i++; continue;
    }

    if (line.trim().startsWith("**Definition")) {
      elements.push(
        <p key={elements.length} style={{
          fontSize: 14.5, color: C.navy, lineHeight: 1.75, margin: "8px 0 16px",
        }}>
          {renderInlineFormatting(line.trim())}
        </p>
      );
      i++; continue;
    }

    if (line.trim().startsWith("•") || line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      elements.push(
        <div key={elements.length} style={{
          display: "flex", gap: 12, margin: "6px 0",
          padding: "11px 14px", background: C.white,
          borderRadius: 10, border: `1px solid ${C.border}`,
          alignItems: "flex-start", boxShadow: C.shadow,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: C.gold, opacity: 0.7, flexShrink: 0, marginTop: 7,
            boxShadow: "0 0 4px rgba(227,195,157,0.3)",
          }} />
          <p style={{ fontSize: 14, color: C.navy, margin: 0, lineHeight: 1.65, flex: 1 }}>
            {renderInlineFormatting(line.trim().replace(/^[•\-*]\s*/, ""))}
          </p>
        </div>
      );
      i++; continue;
    }

    if (/^\d+\./.test(line.trim())) {
      const num = line.trim().match(/^(\d+)\./)?.[1] || "1";
      elements.push(
        <div key={elements.length} style={{
          display: "flex", gap: 14, margin: "8px 0",
          padding: "14px 18px", background: C.white,
          borderRadius: 12, border: `1px solid ${C.border}`,
          alignItems: "flex-start", boxShadow: C.shadow,
        }}>
          <span style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 22, color: C.gold, opacity: 0.65,
            lineHeight: 1, flexShrink: 0, minWidth: 24, paddingTop: 1,
          }}>{num}</span>
          <p style={{ fontSize: 14, color: C.navy, margin: 0, lineHeight: 1.7, flex: 1 }}>
            {renderInlineFormatting(line.trim().replace(/^\d+\.\s*/, ""))}
          </p>
        </div>
      );
      i++; continue;
    }

    if (line.trim().match(/^[\u{1F300}-\u{1F9FF}]/u)) {
      elements.push(
        <h3 key={elements.length} style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontWeight: 400, color: C.navy, fontSize: 17, margin: "24px 0 8px 0", lineHeight: 1.3,
        }}>
          {renderInlineFormatting(line.trim())}
        </h3>
      );
      i++; continue;
    }

    if (!line.trim()) {
      elements.push(<div key={elements.length} style={{ height: 10 }} />);
      i++; continue;
    }

    elements.push(
      <p key={elements.length} style={{
        fontSize: 14.5, color: C.navy, margin: "6px 0", lineHeight: 1.75, opacity: 0.88,
      }}>
        {renderInlineFormatting(line.trim())}
      </p>
    );
    i++;
  }

  return <div className={className}>{elements}</div>;
}
