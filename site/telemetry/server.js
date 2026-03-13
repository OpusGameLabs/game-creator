const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Run schema on startup
pool.query(`
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
`).catch(err => console.error('Schema init error:', err.message));

app.use(cors());

// Telemetry ingestion — fire-and-forget
app.get('/t', (req, res) => {
  res.status(204).end();
  const { event, template, source, v } = req.query;
  if (!event || !template || !source) return;
  if (!['clone', 'click'].includes(event)) return;
  if (!['gallery', 'skill'].includes(source)) return;
  pool.query(
    'INSERT INTO events (event, template, source, version) VALUES ($1, $2, $3, $4)',
    [event, template.slice(0, 100), source, v || null]
  ).catch(() => {});
});

// Stats — cached 60s
let statsCache = null;
let statsCacheTime = 0;

app.get('/stats', async (req, res) => {
  const now = Date.now();
  if (statsCache && now - statsCacheTime < 60_000) {
    return res.json(statsCache);
  }
  try {
    const [totals, recent] = await Promise.all([
      pool.query(`
        SELECT template, event, COUNT(*)::int AS count
        FROM events GROUP BY template, event
      `),
      pool.query(`
        SELECT template, COUNT(*)::int AS count
        FROM events WHERE event = 'clone' AND created_at > NOW() - INTERVAL '24 hours'
        GROUP BY template
      `)
    ]);

    const templates = {};
    let totalClones = 0;
    for (const row of totals.rows) {
      if (!templates[row.template]) templates[row.template] = { clones: 0, clicks: 0, clones_24h: 0 };
      if (row.event === 'clone') {
        templates[row.template].clones = row.count;
        totalClones += row.count;
      } else {
        templates[row.template].clicks = row.count;
      }
    }
    for (const row of recent.rows) {
      if (templates[row.template]) templates[row.template].clones_24h = row.count;
    }

    statsCache = { templates, totalClones, updatedAt: new Date().toISOString() };
    statsCacheTime = now;
    res.json(statsCache);
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(port, () => console.log(`Telemetry server on :${port}`));
