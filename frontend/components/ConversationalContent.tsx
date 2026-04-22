// ConversationalContent.tsx — SOMI Student App
// Renders V3 content in conversational line-by-line style
// Supports: intro, key points, comparison, table, mermaid, timeline,
// formula, bar chart, pie chart, line chart, stacked bar, example, exam trap

import React, { useMemo, useEffect, useRef } from 'react'

// ─── TYPES ────────────────────────────────────────────────

type Section =
  | { type: 'intro'; lines: string[] }
  | { type: 'points'; items: { key: string; text: string }[] }
  | { type: 'example'; text: string }
  | { type: 'trap'; text: string }
  | { type: 'mermaid'; code: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'comparison'; left: { title: string; points: string[] }; right: { title: string; points: string[] } }
  | { type: 'timeline'; events: { label: string; text: string }[] }
  | { type: 'formula'; text: string }
  | { type: 'chart'; chartType: string; title: string; unit: string; data: { label: string; value: number }[]; series?: { name: string; values: number[] }[]; xLabel?: string; yLabel?: string }
  | { type: 'text'; lines: string[] }

// ─── SOMI COLOR PALETTE ───────────────────────────────────

const COLORS = [
  '#071739', '#2c5282', '#5DCAA5', '#D85A30', '#AFA9EC',
  '#FAC775', '#F0997B', '#85B7EB', '#085041', '#3C3489'
]

const COLORS_LIGHT = [
  '#e6eaf0', '#ebf2fa', '#e1f5ee', '#faece7', '#eeedfe',
  '#faeeda', '#fce8e0', '#dbeaf8', '#d0ebe2', '#e0dff8'
]

// ─── MAIN COMPONENT ──────────────────────────────────────

interface Props {
  content: string
  className?: string
}

export default function ConversationalContent({ content, className }: Props) {
  const sections = useMemo(() => parseContent(content), [content])

  return (
    <div className={className} style={{ maxWidth: 640 }}>
      {sections.map((section, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          {renderSection(section, i)}
        </div>
      ))}
    </div>
  )
}

// ─── SECTION RENDERER ────────────────────────────────────

function renderSection(section: Section, index: number) {
  switch (section.type) {
    case 'intro':
      return (
        <div>
          {section.lines.map((line, j) => (
            <p key={j} style={{ fontSize: 15, lineHeight: 1.7, padding: '4px 0', margin: 0 }}>
              <BoldText text={line} />
            </p>
          ))}
        </div>
      )

    case 'points':
      return (
        <div>
          <SectionLabel>Key points</SectionLabel>
          {section.items.map((item, j) => (
            <div key={j} style={{ padding: '8px 0' }}>
              <span style={{ fontWeight: 600, color: '#2c5282' }}>{item.key} — </span>
              <span style={{ fontSize: 14, lineHeight: 1.6 }}>
                <BoldText text={item.text} />
              </span>
            </div>
          ))}
        </div>
      )

    case 'example':
      return (
        <div>
          <SectionLabel>Real example</SectionLabel>
          <div style={{
            background: '#f5f5f4', borderLeft: '3px solid #85B7EB',
            borderRadius: 8, padding: '12px 16px', fontSize: 13, lineHeight: 1.7,
          }}>
            <BoldText text={section.text} />
          </div>
        </div>
      )

    case 'trap':
      return (
        <div>
          <SectionLabel>Exam trap</SectionLabel>
          <div style={{
            background: '#fef2f2', color: '#991b1b',
            borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.7,
          }}>
            <BoldText text={section.text} />
          </div>
        </div>
      )

    case 'mermaid':
      return (
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <MermaidBlock code={section.code} id={`mermaid-${index}`} />
        </div>
      )

    case 'table':
      return (
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <SectionLabel>Comparison</SectionLabel>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, lineHeight: 1.6 }}>
            <thead>
              <tr>
                {section.headers.map((h, j) => (
                  <th key={j} style={{
                    textAlign: 'left', padding: '8px 12px', fontWeight: 600,
                    fontSize: 12, color: '#6b7280', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, j) => (
                <tr key={j}>
                  {row.map((cell, k) => (
                    <td key={k} style={{
                      padding: '8px 12px', borderBottom: '0.5px solid #f0f0f0',
                      color: k === 0 ? '#2c5282' : 'inherit', fontWeight: k === 0 ? 600 : 400,
                    }}><BoldText text={cell} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'comparison':
      return (
        <div>
          <SectionLabel>Comparison</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#f5f5f4', borderRadius: 8, padding: '12px 14px', borderTop: '3px solid #2c5282' }}>
              <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 8px', color: '#2c5282' }}>
                {section.left.title || 'Option A'}
              </p>
              {section.left.points.map((p, j) => (
                <p key={j} style={{ fontSize: 12, lineHeight: 1.6, padding: '3px 0', margin: 0 }}>
                  <BoldText text={p} />
                </p>
              ))}
            </div>
            <div style={{ background: '#f5f5f4', borderRadius: 8, padding: '12px 14px', borderTop: '3px solid #D85A30' }}>
              <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 8px', color: '#D85A30' }}>
                {section.right.title || 'Option B'}
              </p>
              {section.right.points.map((p, j) => (
                <p key={j} style={{ fontSize: 12, lineHeight: 1.6, padding: '3px 0', margin: 0 }}>
                  <BoldText text={p} />
                </p>
              ))}
            </div>
          </div>
        </div>
      )

    case 'timeline':
      return (
        <div>
          <SectionLabel>Timeline</SectionLabel>
          <div style={{ borderLeft: '2px solid #85B7EB', marginLeft: 8, paddingLeft: 20 }}>
            {section.events.map((ev, j) => (
              <div key={j} style={{ position: 'relative', padding: '8px 0' }}>
                <div style={{
                  position: 'absolute', left: -26, top: 12,
                  width: 10, height: 10, borderRadius: '50%', background: '#2c5282',
                }} />
                <p style={{ fontWeight: 600, fontSize: 12, color: '#2c5282', margin: 0 }}>{ev.label}</p>
                <p style={{ fontSize: 13, lineHeight: 1.6, margin: '2px 0 0' }}>
                  <BoldText text={ev.text} />
                </p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'formula':
      return (
        <div>
          <SectionLabel>Formula</SectionLabel>
          <div style={{
            background: '#f5f5f4', borderRadius: 8, padding: '14px 18px',
            fontFamily: 'monospace', fontSize: 15, fontWeight: 500,
            textAlign: 'center', letterSpacing: 0.5, lineHeight: 1.8, whiteSpace: 'pre-wrap',
          }}>
            <BoldText text={section.text} />
          </div>
        </div>
      )

    case 'chart':
      return <ChartRenderer chart={section} />

    case 'text':
      return (
        <div>
          {section.lines.map((line, j) => (
            <p key={j} style={{ fontSize: 14, lineHeight: 1.7, padding: '3px 0', margin: 0 }}>
              <BoldText text={line} />
            </p>
          ))}
        </div>
      )

    default:
      return null
  }
}

// ─── CHART RENDERER ──────────────────────────────────────

function ChartRenderer({ chart }: { chart: Extract<Section, { type: 'chart' }> }) {
  const { chartType, title, unit, data, series, xLabel, yLabel } = chart

  return (
    <div>
      <SectionLabel>{chartType === 'pie' ? 'Distribution' : 'Data'}</SectionLabel>
      <div style={{ background: '#f5f5f4', borderRadius: 12, padding: 20, margin: '8px 0' }}>
        {title && (
          <p style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', margin: '0 0 16px' }}>
            {title}{unit ? ` (${unit})` : ''}
          </p>
        )}

        {chartType === 'bar' && <BarChart data={data} />}
        {chartType === 'pie' && <PieChart data={data} />}
        {chartType === 'line' && <LineChart data={data} series={series} xLabel={xLabel} yLabel={yLabel} />}
        {chartType === 'stacked' && <StackedBar data={data} />}
      </div>
    </div>
  )
}

// ─── BAR CHART ───────────────────────────────────────────

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value))
  const W = 500, H = 200, PAD = 80, TOP = 20
  const barW = Math.min(55, (W - PAD - 40) / data.length - 10)

  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: '100%', height: 'auto' }}>
      {/* Y axis */}
      <line x1={PAD} y1={TOP} x2={PAD} y2={H} stroke="#e5e7eb" strokeWidth={0.5} />
      <line x1={PAD} y1={H} x2={W - 20} y2={H} stroke="#e5e7eb" strokeWidth={0.5} />

      {/* Bars */}
      {data.map((d, i) => {
        const barH = ((d.value / max) * (H - TOP - 20))
        const x = PAD + 20 + i * ((W - PAD - 40) / data.length)
        const y = H - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill={COLORS[i % COLORS.length]} />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize={10} fontWeight={600}
              fill={COLORS[i % COLORS.length]}>{d.value}</text>
            <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize={10}
              fill="#6b7280">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── PIE CHART ───────────────────────────────────────────

function PieChart({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const CX = 120, CY = 100, R = 75
  let angle = -Math.PI / 2

  const slices = data.map((d, i) => {
    const pct = d.value / total
    const startAngle = angle
    angle += pct * 2 * Math.PI
    const endAngle = angle
    const x1 = CX + R * Math.cos(startAngle)
    const y1 = CY + R * Math.sin(startAngle)
    const x2 = CX + R * Math.cos(endAngle)
    const y2 = CY + R * Math.sin(endAngle)
    const large = pct > 0.5 ? 1 : 0
    const path = `M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} Z`
    return { path, color: COLORS[i % COLORS.length], label: d.label, pct: Math.round(pct * 100) }
  })

  return (
    <svg viewBox="0 0 420 210" style={{ width: '100%', height: 'auto' }}>
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} />
      ))}
      {/* Legend */}
      {slices.map((s, i) => (
        <g key={`l${i}`}>
          <rect x={260} y={20 + i * 28} width={10} height={10} rx={2} fill={s.color} />
          <text x={276} y={29 + i * 28} fontSize={12} fontWeight={600} fill={s.color}>{s.label}</text>
          <text x={276} y={42 + i * 28} fontSize={10} fill="#6b7280">{s.pct}%</text>
        </g>
      ))}
    </svg>
  )
}

// ─── LINE CHART ──────────────────────────────────────────

function LineChart({ data, series, xLabel, yLabel }: {
  data: { label: string; value: number }[]
  series?: { name: string; values: number[] }[]
  xLabel?: string
  yLabel?: string
}) {
  const W = 420, H = 220, PAD = 60, TOP = 20, RIGHT = 20

  // Use series if available, otherwise single data line
  const allSeries = series || [{ name: 'Value', values: data.map(d => d.value) }]
  const labels = data.map(d => d.label)
  const allValues = allSeries.flatMap(s => s.values)
  const maxVal = Math.max(...allValues)
  const minVal = Math.min(...allValues)
  const range = maxVal - minVal || 1

  function getX(i: number) { return PAD + (i / (labels.length - 1)) * (W - PAD - RIGHT) }
  function getY(v: number) { return TOP + (1 - (v - minVal) / range) * (H - TOP - 30) }

  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: '100%', height: 'auto' }}>
      {/* Axes */}
      <line x1={PAD} y1={TOP} x2={PAD} y2={H - 20} stroke="#6b7280" strokeWidth={0.5} />
      <line x1={PAD} y1={H - 20} x2={W - RIGHT} y2={H - 20} stroke="#6b7280" strokeWidth={0.5} />
      {/* Axis labels */}
      {xLabel && <text x={(W + PAD) / 2} y={H + 20} textAnchor="middle" fontSize={11} fill="#6b7280">{xLabel}</text>}
      {yLabel && <text x={15} y={(H + TOP) / 2} textAnchor="middle" fontSize={11} fill="#6b7280"
        transform={`rotate(-90,15,${(H + TOP) / 2})`}>{yLabel}</text>}
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
        const y = TOP + (1 - p) * (H - TOP - 30)
        const val = Math.round(minVal + p * range)
        return (
          <g key={i}>
            <line x1={PAD} y1={y} x2={W - RIGHT} y2={y} stroke="#e5e7eb" strokeWidth={0.5} strokeDasharray="3,3" />
            <text x={PAD - 8} y={y + 4} textAnchor="end" fontSize={9} fill="#6b7280">{val}</text>
          </g>
        )
      })}
      {/* X labels */}
      {labels.map((l, i) => (
        <text key={i} x={getX(i)} y={H - 4} textAnchor="middle" fontSize={9} fill="#6b7280">{l}</text>
      ))}
      {/* Lines */}
      {allSeries.map((s, si) => {
        const points = s.values.map((v, i) => `${getX(i)},${getY(v)}`).join(' ')
        const color = COLORS[si % COLORS.length]
        return (
          <g key={si}>
            <polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {s.values.map((v, i) => (
              <circle key={i} cx={getX(i)} cy={getY(v)} r={3} fill={color} stroke="white" strokeWidth={1.5} />
            ))}
          </g>
        )
      })}
      {/* Legend */}
      {allSeries.length > 1 && (
        <g>
          {allSeries.map((s, si) => (
            <g key={si}>
              <rect x={PAD + si * 120} y={H + 14} width={8} height={8} rx={4} fill={COLORS[si % COLORS.length]} />
              <text x={PAD + si * 120 + 14} y={H + 22} fontSize={11} fill="#6b7280">{s.name}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}

// ─── STACKED BAR ─────────────────────────────────────────

function StackedBar({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const W = 400, BAR_H = 36

  let x = 0
  const segments = data.map((d, i) => {
    const w = (d.value / total) * W
    const seg = { x, w, label: d.label, value: d.value, color: COLORS[i % COLORS.length], lightColor: COLORS_LIGHT[i % COLORS_LIGHT.length] }
    x += w
    return seg
  })

  return (
    <svg viewBox={`0 0 ${W} ${BAR_H + 50}`} style={{ width: '100%', height: 'auto' }}>
      {/* Bar segments */}
      {segments.map((s, i) => (
        <g key={i}>
          <rect x={s.x} y={0} width={s.w} height={BAR_H}
            rx={i === 0 ? 6 : i === segments.length - 1 ? 6 : 0}
            fill={s.color} />
          {s.w > 40 && (
            <text x={s.x + s.w / 2} y={BAR_H / 2 + 4} textAnchor="middle"
              fontSize={10} fill="white" fontWeight={500}>
              {Math.round(s.value / total * 100)}%
            </text>
          )}
        </g>
      ))}
      {/* Legend below */}
      {segments.map((s, i) => {
        const lx = i * (W / segments.length)
        return (
          <g key={`l${i}`}>
            <rect x={lx + 4} y={BAR_H + 10} width={8} height={8} rx={2} fill={s.color} />
            <text x={lx + 18} y={BAR_H + 18} fontSize={10} fontWeight={600} fill={s.color}>{s.label}</text>
            <text x={lx + 18} y={BAR_H + 30} fontSize={9} fill="#6b7280">{s.value}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── MERMAID BLOCK ───────────────────────────────────────

function MermaidBlock({ code, id }: { code: string; id: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function render() {
      try {
        // @ts-ignore — mermaid loaded globally or via dynamic import
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false, theme: 'base',
          themeVariables: {
            primaryColor: '#ebf2fa', primaryTextColor: '#0C447C',
            primaryBorderColor: '#85B7EB', lineColor: '#CDD5DB',
            fontFamily: 'system-ui,sans-serif', fontSize: '12px',
          },
        })
        const { svg } = await mermaid.render(id, code)
        if (ref.current) ref.current.innerHTML = svg
      } catch (e) {
        if (ref.current) ref.current.innerHTML = `<pre style="font-size:12px;color:#6b7280">${code}</pre>`
      }
    }
    render()
  }, [code, id])

  return <div ref={ref} />
}

// ─── HELPER COMPONENTS ───────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 600, letterSpacing: 0.6,
      textTransform: 'uppercase' as const, color: '#6b7280',
      padding: '18px 0 6px', margin: 0,
    }}>{children}</p>
  )
}

function BoldText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <b key={i} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</b>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

// ─── CONTENT PARSER ──────────────────────────────────────

function parseContent(content: string): Section[] {
  const sections: Section[] = []
  const lines = content.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line) { i++; continue }

    // ─── Mermaid block ───
    if (line.startsWith('```mermaid')) {
      i++
      let code = ''
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code += lines[i] + '\n'; i++
      }
      i++
      sections.push({ type: 'mermaid', code: code.trim() })
      continue
    }

    // ─── Chart block :::chart ... ::: ───
    if (line === ':::chart') {
      i++
      let chartType = 'bar', title = '', unit = ''
      const data: { label: string; value: number }[] = []
      const seriesMap: Record<string, number[]> = {}
      let xLabel = '', yLabel = ''

      while (i < lines.length && lines[i].trim() !== ':::') {
        const cl = lines[i].trim()
        if (cl.startsWith('type:')) chartType = cl.split(':')[1].trim()
        else if (cl.startsWith('title:')) title = cl.substring(6).trim()
        else if (cl.startsWith('unit:')) unit = cl.substring(5).trim()
        else if (cl.startsWith('x_label:')) xLabel = cl.substring(8).trim()
        else if (cl.startsWith('y_label:')) yLabel = cl.substring(8).trim()
        else if (cl.includes(':')) {
          const [key, val] = cl.split(':').map(s => s.trim())
          if (key && val) {
            // Check if multi-value (line chart series): "Demand: 100,80,60,40,20"
            if (val.includes(',')) {
              seriesMap[key] = val.split(',').map(v => parseFloat(v.trim()))
            } else {
              const num = parseFloat(val)
              if (!isNaN(num)) data.push({ label: key, value: num })
            }
          }
        }
        i++
      }
      i++ // skip closing :::

      // Convert series map to series array
      const seriesArr = Object.entries(seriesMap).map(([name, values]) => ({ name, values }))

      // For line charts with series, create dummy data labels
      if (seriesArr.length > 0 && data.length === 0) {
        const len = seriesArr[0].values.length
        for (let k = 0; k < len; k++) {
          data.push({ label: String(k + 1), value: seriesArr[0].values[k] })
        }
      }

      sections.push({
        type: 'chart', chartType, title, unit, data,
        series: seriesArr.length > 0 ? seriesArr : undefined,
        xLabel, yLabel,
      })
      continue
    }

    // ─── Topic intro ───
    if (line.match(/\*\*.*(ante enti|Core concept)/i)) {
      const introLines: string[] = [line]
      i++
      while (i < lines.length) {
        const next = lines[i].trim()
        if (!next) { i++; continue }
        if (next.startsWith('**') || next.startsWith('```') || next.startsWith('- **') || next.startsWith('* **') || next === ':::chart') break
        introLines.push(next); i++
      }
      sections.push({ type: 'intro', lines: introLines })
      continue
    }

    // ─── Key points ───
    if (line.match(/\*\*.*(Key points|important points|Important points)/i)) {
      i++
      const items: { key: string; text: string }[] = []
      while (i < lines.length) {
        const next = lines[i].trim()
        if (!next) { i++; continue }
        if (next.match(/\*\*.*(example|daily life|chusthe|Exam|trap|gurtunchu|Visualization|Comparison|Timeline|Formula)/i)) break
        if (next.startsWith('```') || next === ':::chart') break
        const bulletMatch = next.match(/^[-*]?\s*\*\*([^*]+)\*\*[\s:—-]*(.*)/)
        if (bulletMatch) {
          let pointText = bulletMatch[2].trim()
          i++
          while (i < lines.length) {
            const cont = lines[i].trim()
            if (!cont || cont.startsWith('- **') || cont.startsWith('* **') || cont.startsWith('**')) break
            pointText += ' ' + cont; i++
          }
          items.push({ key: bulletMatch[1].trim(), text: pointText })
        } else { i++ }
      }
      if (items.length > 0) sections.push({ type: 'points', items })
      continue
    }

    // ─── Table ───
    if (line.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim()); i++
      }
      const headers = tableLines[0].split('|').filter(c => c.trim()).map(c => c.trim())
      const rows = tableLines.slice(2).map(row =>
        row.split('|').filter(c => c.trim()).map(c => c.trim())
      )
      sections.push({ type: 'table', headers, rows })
      continue
    }

    // ─── Comparison ───
    if (line.match(/\*\*.*(vs |Vs |VS |Difference between|Comparison)/i)) {
      i++
      const left: { title: string; points: string[] } = { title: '', points: [] }
      const right: { title: string; points: string[] } = { title: '', points: [] }
      let side: 'left' | 'right' = 'left'
      while (i < lines.length) {
        const next = lines[i].trim()
        if (!next) { i++; continue }
        if (next.match(/\*\*.*(example|Exam|trap|Visualization|Key points)/i)) break
        if (next.startsWith('```') || next === ':::chart') break
        const sideMatch = next.match(/^\*\*([^*]+)\*\*\s*:?\s*$/)
        if (sideMatch) {
          if (!left.title) { left.title = sideMatch[1]; side = 'left' }
          else { right.title = sideMatch[1]; side = 'right' }
          i++; continue
        }
        const bulletMatch = next.match(/^[-*]\s*(.+)/)
        if (bulletMatch) {
          if (side === 'left' && right.title) side = 'right'
          if (side === 'left') left.points.push(bulletMatch[1])
          else right.points.push(bulletMatch[1])
        }
        i++
      }
      if (left.points.length > 0 || right.points.length > 0) {
        sections.push({ type: 'comparison', left, right })
        continue
      }
    }

    // ─── Timeline ───
    if (line.match(/\*\*.*(Timeline|History|Evolution|Stages|Steps|Process)/i)) {
      i++
      const events: { label: string; text: string }[] = []
      while (i < lines.length) {
        const next = lines[i].trim()
        if (!next) { i++; continue }
        if (next.match(/\*\*.*(example|Exam|trap|Visualization|Key points)/i)) break
        if (next.startsWith('```') || next === ':::chart') break
        const eventMatch = next.match(/^[-*]?\s*\*\*([^*]+)\*\*[\s:—-]*(.*)/)
        if (eventMatch) events.push({ label: eventMatch[1].trim(), text: eventMatch[2].trim() })
        i++
      }
      if (events.length > 0) { sections.push({ type: 'timeline', events }); continue }
    }

    // ─── Formula ───
    if (line.match(/\*\*.*(Formula|Equation|Calculate)/i) || line.match(/^Formula:/i)) {
      i++
      let text = ''
      while (i < lines.length) {
        const next = lines[i].trim()
        if (!next) { i++; continue }
        if (next.startsWith('**') || next.startsWith('```') || next === ':::chart') break
        text += (text ? '\n' : '') + next; i++
      }
      if (text) sections.push({ type: 'formula', text })
      continue
    }

    // ─── Example ───
    if (line.match(/\*\*.*(example|daily life|chusthe)/i)) {
      i++
      let text = ''
      while (i < lines.length) {
        const next = lines[i].trim()
        if (next.match(/\*\*.*(Exam|trap|gurtunchu|Visualization|Key points|Formula|Timeline)/i)) break
        if (next.startsWith('```') || next === ':::chart') break
        if (next) text += (text ? ' ' : '') + next
        i++
      }
      if (text) sections.push({ type: 'example', text })
      continue
    }

    // ─── Exam trap ───
    if (line.match(/\*\*.*(Exam trap|Exam tip|gurtunchu)/i)) {
      i++
      let text = ''
      while (i < lines.length) {
        const next = lines[i].trim()
        if (next.match(/\*\*.*(Visualization|Key points|example|Formula|Timeline)/i)) break
        if (next.startsWith('```') || next === ':::chart') break
        if (next) text += (text ? ' ' : '') + next
        i++
      }
      if (text) sections.push({ type: 'trap', text })
      continue
    }

    // ─── Visualization label — skip ───
    if (line.match(/\*\*.*Visualization/i)) { i++; continue }

    // ─── Default text ───
    sections.push({ type: 'text', lines: [line] })
    i++
  }

  return sections
}
