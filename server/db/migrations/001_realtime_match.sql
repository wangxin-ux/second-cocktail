CREATE TABLE IF NOT EXISTS tonight_sessions (
  id UUID PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  nickname VARCHAR(24) NOT NULL,
  age SMALLINT NOT NULL CHECK (age BETWEEN 18 AND 99),
  age_band SMALLINT NOT NULL,
  energy VARCHAR(16) NOT NULL,
  mbti VARCHAR(4),
  spirit VARCHAR(16) NOT NULL,
  flavor VARCHAR(16) NOT NULL,
  cocktail_id VARCHAR(128) NOT NULL,
  cocktail_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  invalidated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS queue_entries (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES tonight_sessions(id) ON DELETE CASCADE,
  entered_queue_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  energy VARCHAR(16) NOT NULL,
  mbti VARCHAR(4),
  age_band SMALLINT NOT NULL,
  spirit VARCHAR(16) NOT NULL,
  flavor VARCHAR(16) NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('waiting', 'cancelled', 'matched', 'expired'))
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_queue_entry_per_session
  ON queue_entries(session_id) WHERE status = 'waiting';

CREATE TABLE IF NOT EXISTS match_pairs (
  id UUID PRIMARY KEY,
  session_a_id UUID NOT NULL REFERENCES tonight_sessions(id),
  session_b_id UUID NOT NULL REFERENCES tonight_sessions(id),
  status VARCHAR(24) NOT NULL CHECK (status IN ('candidate','waiting_for_other','mutual','connection','passed','cancelled','expired','ended')),
  a_decision VARCHAR(8) CHECK (a_decision IN ('accept','pass','block')),
  b_decision VARCHAR(8) CHECK (b_decision IN ('accept','pass','block')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  candidate_expires_at TIMESTAMPTZ NOT NULL,
  mutual_at TIMESTAMPTZ,
  meeting_area_id VARCHAR(32),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (session_a_id <> session_b_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_pair_for_a
  ON match_pairs(session_a_id) WHERE status IN ('candidate','waiting_for_other','mutual','connection');
CREATE UNIQUE INDEX IF NOT EXISTS one_active_pair_for_b
  ON match_pairs(session_b_id) WHERE status IN ('candidate','waiting_for_other','mutual','connection');

CREATE TABLE IF NOT EXISTS pair_exclusions (
  session_low_id UUID NOT NULL REFERENCES tonight_sessions(id),
  session_high_id UUID NOT NULL REFERENCES tonight_sessions(id),
  reason VARCHAR(8) NOT NULL CHECK (reason IN ('pass','block')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (session_low_id, session_high_id),
  CHECK (session_low_id < session_high_id)
);

CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY,
  match_pair_id UUID NOT NULL UNIQUE REFERENCES match_pairs(id),
  meeting_area_id VARCHAR(32) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  end_reason VARCHAR(24)
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY,
  reporter_session_id UUID NOT NULL REFERENCES tonight_sessions(id),
  match_pair_id UUID REFERENCES match_pairs(id),
  reason VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(16) NOT NULL DEFAULT 'recorded'
);
