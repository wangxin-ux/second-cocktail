ALTER TABLE tonight_sessions
  ADD COLUMN IF NOT EXISTS height_cm SMALLINT CHECK (height_cm BETWEEN 120 AND 230),
  ADD COLUMN IF NOT EXISTS gender VARCHAR(16) CHECK (gender IN ('woman', 'man', 'nonbinary')),
  ADD COLUMN IF NOT EXISTS preferred_gender VARCHAR(16) CHECK (preferred_gender IN ('any', 'woman', 'man', 'nonbinary')),
  ADD COLUMN IF NOT EXISTS min_partner_height_cm SMALLINT CHECK (min_partner_height_cm BETWEEN 120 AND 230);

CREATE INDEX IF NOT EXISTS sessions_by_agent_preferences
  ON tonight_sessions(venue_id, gender, height_cm)
  WHERE invalidated_at IS NULL;
