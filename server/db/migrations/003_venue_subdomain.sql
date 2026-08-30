ALTER TABLE tonight_sessions ADD COLUMN IF NOT EXISTS venue_id VARCHAR(63);
UPDATE tonight_sessions SET venue_id = 'main' WHERE venue_id IS NULL;
ALTER TABLE tonight_sessions ALTER COLUMN venue_id SET DEFAULT 'main';
ALTER TABLE tonight_sessions ALTER COLUMN venue_id SET NOT NULL;

ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS venue_id VARCHAR(63);
UPDATE queue_entries q SET venue_id = s.venue_id
FROM tonight_sessions s WHERE q.session_id = s.id AND q.venue_id IS NULL;
ALTER TABLE queue_entries ALTER COLUMN venue_id SET DEFAULT 'main';
ALTER TABLE queue_entries ALTER COLUMN venue_id SET NOT NULL;

ALTER TABLE match_pairs ADD COLUMN IF NOT EXISTS venue_id VARCHAR(63);
UPDATE match_pairs p SET venue_id = s.venue_id
FROM tonight_sessions s WHERE p.session_a_id = s.id AND p.venue_id IS NULL;
ALTER TABLE match_pairs ALTER COLUMN venue_id SET DEFAULT 'main';
ALTER TABLE match_pairs ALTER COLUMN venue_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS waiting_queue_by_venue
  ON queue_entries(venue_id, entered_queue_at) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS sessions_by_venue
  ON tonight_sessions(venue_id, last_seen_at) WHERE invalidated_at IS NULL;
