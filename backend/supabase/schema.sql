-- Proply Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)

-- Table 1: user_sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  skills TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  hourly_rate TEXT DEFAULT ''
);

-- Table 2: job_matches
CREATE TABLE IF NOT EXISTS job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  job_title TEXT NOT NULL,
  job_url TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL CHECK (source IN ('upwork', 'freelancer', 'unknown')),
  match_percentage DOUBLE PRECISION NOT NULL DEFAULT 0,
  keyword_baseline_score DOUBLE PRECISION NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_job_matches_session_id ON job_matches(session_id);

-- Table 3: proposals
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  job_title TEXT NOT NULL,
  tone TEXT NOT NULL,
  proposal_text TEXT NOT NULL,
  relevance_score DOUBLE PRECISION,
  specificity_score DOUBLE PRECISION,
  cta_score DOUBLE PRECISION,
  overall_score DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS idx_proposals_session_id ON proposals(session_id);

-- Row Level Security (allow anon key inserts/updates for MVP)
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert user_sessions"
  ON user_sessions FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon select user_sessions"
  ON user_sessions FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert job_matches"
  ON job_matches FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon select job_matches"
  ON job_matches FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert proposals"
  ON proposals FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update proposals"
  ON proposals FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon select proposals"
  ON proposals FOR SELECT TO anon USING (true);
