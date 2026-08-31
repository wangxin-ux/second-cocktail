ALTER TABLE tonight_sessions
  ADD COLUMN IF NOT EXISTS meeting_location VARCHAR(80);

ALTER TABLE match_pairs
  ADD COLUMN IF NOT EXISTS meeting_location VARCHAR(80);
