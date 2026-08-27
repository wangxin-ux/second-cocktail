ALTER TABLE match_pairs
  ADD COLUMN IF NOT EXISTS a_continue BOOLEAN,
  ADD COLUMN IF NOT EXISTS b_continue BOOLEAN;

ALTER TABLE match_pairs DROP CONSTRAINT IF EXISTS match_pairs_status_check;
ALTER TABLE match_pairs ADD CONSTRAINT match_pairs_status_check
  CHECK (status IN ('candidate','waiting_for_other','mutual','connection','time_up','continuing','passed','cancelled','expired','ended'));

DROP INDEX IF EXISTS one_active_pair_for_a;
DROP INDEX IF EXISTS one_active_pair_for_b;
CREATE UNIQUE INDEX IF NOT EXISTS one_active_pair_for_a
  ON match_pairs(session_a_id) WHERE status IN ('candidate','waiting_for_other','mutual','connection','time_up','continuing');
CREATE UNIQUE INDEX IF NOT EXISTS one_active_pair_for_b
  ON match_pairs(session_b_id) WHERE status IN ('candidate','waiting_for_other','mutual','connection','time_up','continuing');
