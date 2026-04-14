-- ═══════════════════════════════════════════════════════════════════════════
-- SOMI MENTOR AGENT — Database Schema
-- Run these in Supabase SQL Editor (production project)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Agent Sessions — tracks each student's agent state
CREATE TABLE IF NOT EXISTS agent_sessions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      uuid NOT NULL,
    current_concept text,
    current_chapter text,
    current_namespace text,
    mode            text DEFAULT 'concept' CHECK (mode IN ('concept', 'global')),
    navigation_history jsonb DEFAULT '[]'::jsonb,
    weak_concepts   jsonb DEFAULT '[]'::jsonb,
    total_interactions int DEFAULT 0,
    kg_hits         int DEFAULT 0,
    llm_hits        int DEFAULT 0,
    last_active     timestamptz DEFAULT now(),
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_agent_sessions_student ON agent_sessions(student_id);
CREATE INDEX idx_agent_sessions_active ON agent_sessions(last_active DESC);

-- 2. Agent Messages — full chat history for analytics + KG improvement
CREATE TABLE IF NOT EXISTS agent_messages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      uuid NOT NULL,
    session_id      uuid REFERENCES agent_sessions(id) ON DELETE CASCADE,
    mode            text DEFAULT 'concept',
    namespace       text,
    concept         text,
    chapter         text,
    intent          text,
    message         text NOT NULL,
    reply           text NOT NULL,
    source          text CHECK (source IN ('kg', 'llm_fallback', 'system')),
    response_ms     int,
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_agent_messages_student ON agent_messages(student_id);
CREATE INDEX idx_agent_messages_session ON agent_messages(session_id);
CREATE INDEX idx_agent_messages_intent ON agent_messages(intent);
CREATE INDEX idx_agent_messages_source ON agent_messages(source);

-- 3. Concept Relationships — lightweight KG edges
-- (Add to lesson_content later, or use this separate table)
CREATE TABLE IF NOT EXISTS concept_relationships (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id      text NOT NULL,
    related_id      text NOT NULL,
    relationship    text NOT NULL CHECK (relationship IN (
        'prerequisite', 'related', 'opposite', 'extends', 'example_of'
    )),
    chapter         text,
    namespace       text,
    confidence      float DEFAULT 1.0,
    created_at      timestamptz DEFAULT now(),
    UNIQUE(concept_id, related_id, relationship)
);

CREATE INDEX idx_concept_rel_concept ON concept_relationships(concept_id);
CREATE INDEX idx_concept_rel_related ON concept_relationships(related_id);

-- 4. Fallback Review Queue — LLM responses that need human validation
CREATE TABLE IF NOT EXISTS agent_fallback_queue (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id      uuid REFERENCES agent_messages(id),
    student_question text NOT NULL,
    llm_response    text NOT NULL,
    namespace       text,
    concept         text,
    chapter         text,
    times_asked     int DEFAULT 1,
    status          text DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'rejected', 'added_to_kg'
    )),
    reviewed_by     text,
    reviewed_at     timestamptz,
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_fallback_queue_status ON agent_fallback_queue(status);
CREATE INDEX idx_fallback_queue_times ON agent_fallback_queue(times_asked DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS Policies (enable Row Level Security)
-- ═══════════════════════════════════════════════════════════════════════════

-- For now, using service role key from backend, so RLS is optional.
-- Enable these when you add direct Supabase client access from frontend:

-- ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Students see own sessions" ON agent_sessions
--     FOR SELECT USING (student_id = auth.uid());
-- CREATE POLICY "Students see own messages" ON agent_messages
--     FOR SELECT USING (student_id = auth.uid());
