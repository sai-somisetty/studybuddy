"use client";

import React from "react";

interface Props {
  content: string;
  className?: string;
}

function parseTable(tableText: string) {
  const lines = tableText.trim().split('\n');
  const headers = lines[0]
    .split('|')
    .filter(h => h.trim())
    .map(h => h.trim().replace(/\*\*/g, ''));

  const rows = lines
    .slice(2) // skip header and separator
    .filter(line => line.includes('|'))
    .map(line =>
      line.split('|')
        .filter(cell => cell.trim())
        .map(cell => cell.trim().replace(/\*\*/g, ''))
    );

  return { headers, rows };
}

function renderTable(tableText: string, index: number) {
  const { headers, rows } = parseTable(tableText);

  return (
    <div key={index} style={{
      overflowX: 'auto',
      margin: '12px 0',
      borderRadius: 10,
      border: '1px solid #e5e7eb',
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 12,
      }}>
        <thead>
          <tr style={{ background: '#0A2E28' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '10px 12px',
                color: 'white',
                textAlign: 'left',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                borderRight: i < headers.length - 1
                  ? '1px solid #1a4a3a' : 'none',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{
              background: ri % 2 === 0 ? '#ffffff' : '#f9fafb',
              borderBottom: '1px solid #f0f0f0',
            }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: '8px 12px',
                  color: ci === 0 ? '#0A2E28' : '#374151',
                  fontWeight: ci === 0 ? 600 : 400,
                  borderRight: ci < row.length - 1
                    ? '1px solid #f0f0f0' : 'none',
                  fontSize: 11,
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderBoldText(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: '#0A2E28' }}>{part}</strong>
      : part
  );
}

export default function MarkdownRenderer({ content, className }: Props) {
  if (!content) return null;

  const elements: React.ReactNode[] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect table (starts with |)
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(renderTable(tableLines.join('\n'), elements.length));
      continue;
    }

    // Bold heading (starts with ** and ends with **)
    if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
      elements.push(
        <p key={elements.length} style={{
          fontWeight: 700,
          color: '#0A2E28',
          fontSize: 13,
          margin: '14px 0 6px 0',
        }}>
          {line.trim().replace(/\*\*/g, '')}
        </p>
      );
      i++;
      continue;
    }

    // Bullet point
    if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
      elements.push(
        <div key={elements.length} style={{
          display: 'flex',
          gap: 8,
          margin: '4px 0',
          paddingLeft: 8,
        }}>
          <span style={{ color: '#E67E22', flexShrink: 0 }}>•</span>
          <p style={{
            fontSize: 12,
            color: '#374151',
            margin: 0,
            lineHeight: 1.6,
          }}>
            {renderBoldText(
              line.trim().replace(/^[•\-*]\s*/, '')
            )}
          </p>
        </div>
      );
      i++;
      continue;
    }

    // Numbered list
    if (/^\d+\./.test(line.trim())) {
      elements.push(
        <div key={elements.length} style={{
          display: 'flex',
          gap: 8,
          margin: '4px 0',
          paddingLeft: 8,
        }}>
          <span style={{
            color: '#E67E22',
            flexShrink: 0,
            fontWeight: 600,
            fontSize: 12,
          }}>
            {line.trim().match(/^\d+\./)?.[0]}
          </span>
          <p style={{
            fontSize: 12,
            color: '#374151',
            margin: 0,
            lineHeight: 1.6,
          }}>
            {renderBoldText(
              line.trim().replace(/^\d+\.\s*/, '')
            )}
          </p>
        </div>
      );
      i++;
      continue;
    }

    // Emoji heading (line starting with an emoji)
    if (line.trim().match(/^[\u{1F300}-\u{1F9FF}]/u)) {
      elements.push(
        <p key={elements.length} style={{
          fontWeight: 700,
          color: '#0A2E28',
          fontSize: 13,
          margin: '14px 0 6px 0',
        }}>
          {renderBoldText(line.trim())}
        </p>
      );
      i++;
      continue;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(
        <div key={elements.length} style={{ height: 8 }} />
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={elements.length} style={{
        fontSize: 12,
        color: '#374151',
        margin: '4px 0',
        lineHeight: 1.7,
      }}>
        {renderBoldText(line.trim())}
      </p>
    );
    i++;
  }

  return (
    <div className={className}>
      {elements}
    </div>
  );
}
