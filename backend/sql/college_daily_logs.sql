-- Run in Supabase SQL editor (once).
CREATE TABLE IF NOT EXISTS college_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subject TEXT NOT NULL,
  topics_covered TEXT[] NOT NULL,
  teacher_name TEXT,
  homework TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, log_date, subject)
);
CREATE INDEX IF NOT EXISTS idx_cdl_student_date ON college_daily_logs(student_id, log_date);
