# SOMI Mentor Agent — Integration Guide

## File created:
- `frontend/components/MamaAgent.tsx` ✅

## Changes needed in existing files:

---

## 1. LESSON PAGE (`frontend/app/lesson/page.tsx`)

### Step A: Add import (after existing imports, ~line 6)

```tsx
import MamaAgent from "@/components/MamaAgent";
```

### Step B: Remove the old "Ask Mama" chat block

Delete lines 752–791 (the entire `{/* ── BLOCK 6: Ask Mama */}` section).

This block starts with:
```tsx
{/* ── BLOCK 6: Ask Mama (after MCQ answered) ── */}
{selectedAnswer !== null && (
```

And ends with:
```tsx
                )}
```

The new MamaAgent replaces this entirely — and it's always accessible, 
not gated behind MCQ completion.

### Step C: Add MamaAgent before the closing tags (before `</div>` of the mama zone)

Add this just before the closing `</div>` of the `activeZone === "mama"` block 
(around line 912, after the BLOCK 7 section complete):

```tsx
        {/* ── MAMA AGENT (always accessible) ── */}
        <MamaAgent
          mode="concept"
          studentName={studentName}
          namespace={namespace}
          concept={concept}
          subject={subject}
          chapter={chapter}
          conceptId={currentPage?.id}
        />
```

### Step D: Remove old Ask Mama state variables (optional cleanup)

These state variables are no longer needed if you remove the old chat:
```tsx
// Remove these (lines ~112-115):
const [studentQuestion, setStudentQuestion] = useState("");
const [studentMessages, setStudentMessages] = useState<any[]>([]);
const [mamaTyping, setMamaTyping]           = useState(false);
const [inputFocused, setInputFocused]       = useState(false);
```

Also remove the `sendQuestion` function (lines ~260-275).

---

## 2. HOME PAGE (`frontend/app/home/page.tsx`)

### Step A: Add import

```tsx
import MamaAgent from "@/components/MamaAgent";
```

### Step B: Add MamaAgent before the bottom nav

Add this just before the `{/* Bottom nav */}` comment (around line 149):

```tsx
        {/* ── MAMA AGENT (global mode) ── */}
        <MamaAgent
          mode="global"
          studentName={name}
          course={course}
          level={level}
        />
```

### Step C: Make "Ask Mama" text on MAMA card functional (optional)

The floating bubble already provides access, but if you want the 
"Ask Mama" text to also open the agent, you'd need to lift the 
`isOpen` state up. For now, the floating bubble is sufficient.

---

## 3. BACKEND (`backend/main.py`)

### Step A: Add import (after existing imports, ~line 14)

```python
from agent_routes import router as agent_router, init_agent
```

### Step B: Include router (after other router includes, ~line 36)

```python
app.include_router(agent_router)
```

### Step C: Initialize agent with clients (after client creation, ~line 45)

```python
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
claude = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
chroma = chromadb.PersistentClient(path="./chromadb_data")

# Add this line:
init_agent(supabase, claude)
```

### Step D: Run SQL schema

Open Supabase SQL Editor → paste contents of `backend/sql/agent_schema.sql` → Run.

This creates 4 tables:
- `agent_sessions` — student session state
- `agent_messages` — full chat history for analytics
- `concept_relationships` — lightweight KG edges (for future use)
- `agent_fallback_queue` — LLM responses pending human review

---

## 4. API ENDPOINT REFERENCE

### POST /agent/chat
Main agent endpoint.

```json
// Request
{
  "student_id": "uuid",
  "student_name": "Ravi",
  "message": "explain marginal cost",
  "mode": "concept",
  "namespace": "cma_f_cost_ch3_s1",
  "concept": "Marginal Cost",
  "subject": "Cost Accounting",
  "chapter": "Chapter 3"
}

// Response
{
  "reply": "Marginal Cost ante...",
  "source": "kg",
  "intent": "explain",
  "suggested_actions": ["Give example", "Test me", "Why important?"],
  "session_id": "uuid",
  "response_ms": 45,
  "concept_title": "Marginal Cost"
}
```

### GET /agent/session/{student_id}
Returns session stats (total interactions, KG hit ratio).

### GET /agent/fallback-queue?status=pending
Admin endpoint — shows LLM responses that need review.

### POST /agent/fallback-queue/{item_id}/review
Admin endpoint — approve/reject fallback responses.

---

## Design decisions made:

| Decision | Choice | Reason |
|----------|--------|--------|
| Theme | Light (#FAFAF8, #0A2E28, #E67E22) | Matches existing app |
| Bubble position | Bottom-right, above nav | Doesn't block content |
| Panel height | 72vh | Enough space for chat, lesson still visible |
| Animations | framer-motion spring | Consistent with app |
| Markdown | Reuses existing MarkdownRenderer | Tables/bold work out of the box |
| Source badge | Green "Verified" / Orange "AI Generated" | Matches app color system |
| Greeting | Resets when concept changes | Context-aware |
| Mode switch | Props-driven | Same component, two behaviors |
