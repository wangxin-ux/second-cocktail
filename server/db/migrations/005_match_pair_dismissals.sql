CREATE TABLE IF NOT EXISTS match_pair_dismissals (
  pair_id UUID NOT NULL REFERENCES match_pairs(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES tonight_sessions(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (pair_id, session_id)
);
