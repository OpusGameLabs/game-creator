CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  event VARCHAR(20) NOT NULL,
  template VARCHAR(100) NOT NULL,
  source VARCHAR(20) NOT NULL,
  version VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_template ON events(template);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
