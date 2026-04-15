-- Run in Supabase SQL editor (production) once.
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id TEXT,
  para_index INTEGER,
  concept TEXT,
  namespace TEXT,
  reason TEXT,
  student_name TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  notes TEXT
);
