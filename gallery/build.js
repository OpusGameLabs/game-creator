#!/usr/bin/env node

/**
 * Build the gallery page from manifest.json.
 *
 * Reads gallery/manifest.json → generates _site/gallery/index.html
 * Copies gallery/thumbnails/ → _site/gallery/thumbnails/
 * Fetches telemetry stats (clone counts) from the telemetry API
 *
 * Usage:
 *   node gallery/build.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(__dirname, 'manifest.json');
const OUT_DIR = path.join(ROOT, '_site', 'gallery');
const THUMBS_SRC = path.join(__dirname, 'thumbnails');
const THUMBS_DST = path.join(OUT_DIR, 'thumbnails');
const TELEMETRY_URL = process.env.TELEMETRY_URL || 'https://gallery-telemetry.up.railway.app';

async function fetchStats() {
  try {
    const res = await fetch(`${TELEMETRY_URL}/stats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`  Warning: Could not fetch telemetry stats (${err.message}). Using zero counts.`);
    return { templates: {}, totalClones: 0 };
  }
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'));

  // Fetch telemetry stats
  const stats = await fetchStats();

  // Enrich manifest with clone counts
  for (const t of manifest) {
    const s = stats.templates[t.id] || {};
    t.clones = s.clones || 0;
    t.clicks = s.clicks || 0;
    t.clones_24h = s.clones_24h || 0;
  }

  // Create output dirs
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Copy thumbnails
  if (fs.existsSync(THUMBS_SRC)) {
    fs.mkdirSync(THUMBS_DST, { recursive: true });
    for (const file of fs.readdirSync(THUMBS_SRC)) {
      fs.copyFileSync(path.join(THUMBS_SRC, file), path.join(THUMBS_DST, file));
    }
  }

  // Collect all genres and features for filter pills
  const allGenres = [...new Set(manifest.flatMap(t => t.genre))].sort();

  const html = generateHTML(manifest, allGenres);
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);

  console.log(`Gallery built: ${path.join(OUT_DIR, 'index.html')}`);
  console.log(`  ${manifest.length} templates, ${allGenres.length} genres`);
  if (stats.totalClones > 0) {
    console.log(`  ${stats.totalClones} total clones tracked`);
  }
}

function generateHTML(manifest, allGenres) {
  const dataJSON = JSON.stringify(manifest);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Template Gallery — Game Creator</title>
  <meta name="description" content="Browse ${manifest.length} game templates. Filter by engine, genre, and complexity. Clone any template with one command." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #06080f;
      --bg-raised: #0d1117;
      --border: #1e293b;
      --text: #e2e8f0;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --red: #ff4444;
      --red-soft: #ff6b6b;
      --red-glow: rgba(255,68,68,0.15);
      --coral: #ff7b72;
      --orange: #fb923c;
      --green: #4ade80;
      --blue: #60a5fa;
      --yellow: #fbbf24;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    /* NAV */
    nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 50;
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 32px;
      background: rgba(6,8,15,0.85);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(30,41,59,0.5);
    }
    .nav-logo {
      font-weight: 800; font-size: 18px; color: #fff;
      text-decoration: none; letter-spacing: -0.5px;
    }
    .nav-logo span { color: var(--red); }
    .nav-links { display: flex; gap: 28px; }
    .nav-links a {
      color: var(--text-muted); text-decoration: none; font-size: 14px; font-weight: 500;
      transition: color 0.2s;
    }
    .nav-links a:hover { color: #fff; }

    /* HEADER */
    .gallery-header {
      text-align: center; padding: 120px 24px 40px;
    }
    .gallery-header h1 {
      font-size: clamp(32px, 5vw, 52px);
      font-weight: 900; letter-spacing: -2px; margin-bottom: 12px;
    }
    .gallery-header h1 .gradient {
      background: linear-gradient(135deg, var(--red), var(--coral), var(--orange));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .gallery-header p {
      color: var(--text-muted); font-size: 17px; max-width: 560px; margin: 0 auto;
    }
    .gallery-header .count {
      color: var(--red); font-weight: 700;
    }

    /* FILTER BAR */
    .filter-bar {
      position: sticky; top: 57px; z-index: 40;
      background: rgba(6,8,15,0.92);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
      padding: 16px 24px;
    }
    .filter-inner {
      max-width: 1200px; margin: 0 auto;
      display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
    }
    .search-box {
      flex: 1; min-width: 200px;
      background: var(--bg-raised); border: 1px solid var(--border);
      border-radius: 8px; padding: 10px 14px;
      color: var(--text); font-size: 14px; font-family: inherit;
      outline: none; transition: border-color 0.2s;
    }
    .search-box::placeholder { color: var(--text-dim); }
    .search-box:focus { border-color: var(--red); }

    .toggle-group {
      display: flex; gap: 0; border-radius: 8px; overflow: hidden;
      border: 1px solid var(--border);
    }
    .toggle-btn {
      padding: 8px 16px; border: none; background: var(--bg-raised);
      color: var(--text-dim); font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .toggle-btn:not(:last-child) { border-right: 1px solid var(--border); }
    .toggle-btn.active { background: var(--red-glow); color: var(--red); }
    .toggle-btn:hover:not(.active) { color: var(--text); }

    .complexity-select, .sort-select {
      background: var(--bg-raised); border: 1px solid var(--border);
      border-radius: 8px; padding: 8px 12px;
      color: var(--text); font-size: 13px; font-family: inherit;
      cursor: pointer; outline: none;
    }
    .complexity-select:focus, .sort-select:focus { border-color: var(--red); }

    .genre-pills {
      display: flex; flex-wrap: wrap; gap: 6px;
      width: 100%; margin-top: 4px;
    }
    .genre-pill {
      padding: 4px 12px; border-radius: 100px;
      background: var(--bg-raised); border: 1px solid var(--border);
      color: var(--text-dim); font-size: 12px; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
    }
    .genre-pill.active { background: var(--red-glow); border-color: rgba(255,68,68,0.3); color: var(--red); }
    .genre-pill:hover:not(.active) { border-color: var(--text-dim); color: var(--text-muted); }

    /* RESULTS */
    .results-bar {
      max-width: 1200px; margin: 0 auto; padding: 20px 24px 12px;
      font-size: 14px; color: var(--text-dim);
    }
    .results-bar strong { color: var(--text-muted); }

    /* CARD GRID */
    .grid {
      max-width: 1200px; margin: 0 auto; padding: 0 24px 80px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
      gap: 20px;
    }

    .card {
      background: var(--bg-raised); border: 1px solid var(--border);
      border-radius: 14px; overflow: hidden;
      transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
      display: flex; flex-direction: column;
    }
    .card:hover {
      transform: translateY(-4px);
      border-color: rgba(255,68,68,0.3);
      box-shadow: 0 12px 40px rgba(255,68,68,0.08);
    }
    .card.hidden { display: none; }

    .card-thumb {
      width: 100%; aspect-ratio: 16/9;
      background: linear-gradient(135deg, #0d1117, #1a1a2e);
      position: relative; overflow: hidden;
    }
    .card-thumb img {
      width: 100%; height: 100%; object-fit: cover;
      display: block;
    }

    .card-badges {
      position: absolute; top: 10px; left: 10px;
      display: flex; gap: 6px;
    }
    .badge {
      display: inline-block; padding: 3px 10px; border-radius: 100px;
      font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
      text-transform: uppercase; backdrop-filter: blur(8px);
    }
    .badge-2d { background: rgba(74,222,128,0.2); color: var(--green); }
    .badge-3d { background: rgba(255,68,68,0.2); color: var(--red); }
    .badge-starter { background: rgba(96,165,250,0.2); color: var(--blue); }
    .badge-beginner { background: rgba(74,222,128,0.2); color: var(--green); }
    .badge-intermediate { background: rgba(251,191,36,0.2); color: var(--yellow); }
    .badge-advanced { background: rgba(255,68,68,0.2); color: var(--red); }

    .card-body {
      padding: 20px; flex: 1;
      display: flex; flex-direction: column;
    }
    .card-body h2 {
      font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 6px;
    }
    .card-body .desc {
      font-size: 13px; color: var(--text-muted); line-height: 1.5;
      margin-bottom: 14px;
      display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
    }

    .card-features {
      display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 16px;
    }
    .feature-pill {
      padding: 2px 8px; border-radius: 4px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      font-size: 11px; color: var(--text-dim); font-weight: 500;
    }

    .clone-count {
      font-size: 11px; color: var(--text-dim); margin-bottom: 12px;
    }

    .card-actions {
      display: flex; gap: 8px; margin-top: auto;
    }
    .card-btn {
      flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px 16px; border-radius: 8px;
      font-size: 13px; font-weight: 700; text-decoration: none;
      transition: all 0.15s; cursor: pointer; border: none; font-family: inherit;
    }
    .btn-play {
      background: linear-gradient(135deg, var(--red), var(--red-soft));
      color: #fff; box-shadow: 0 4px 16px rgba(255,68,68,0.2);
    }
    .btn-play:hover { box-shadow: 0 6px 24px rgba(255,68,68,0.35); transform: scale(1.02); }
    .btn-use {
      background: rgba(255,255,255,0.06); border: 1px solid var(--border);
      color: var(--text);
    }
    .btn-use:hover { border-color: var(--text-muted); color: #fff; }

    .no-results {
      grid-column: 1 / -1; text-align: center; padding: 80px 24px;
      color: var(--text-dim); font-size: 16px;
    }

    /* TOAST */
    .toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: var(--bg-raised); border: 1px solid var(--green);
      color: var(--green); padding: 12px 24px; border-radius: 10px;
      font-size: 14px; font-weight: 600;
      opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 100;
    }
    .toast.show { opacity: 1; }

    /* FOOTER */
    footer {
      text-align: center; padding: 32px 24px;
      color: var(--text-dim); font-size: 13px;
      border-top: 1px solid var(--border);
    }
    footer a { color: var(--coral); text-decoration: none; }
    footer a:hover { text-decoration: underline; }

    /* RESPONSIVE */
    @media (max-width: 768px) {
      nav { padding: 12px 16px; }
      .nav-links { display: none; }
      .gallery-header { padding: 100px 16px 32px; }
      .filter-bar { padding: 12px 16px; }
      .filter-inner { gap: 8px; }
      .search-box { min-width: 100%; }
      .grid {
        grid-template-columns: 1fr;
        padding: 0 16px 60px;
      }
    }
  </style>
</head>
<body>

  <nav>
    <a class="nav-logo" href="../">game<span>-creator</span></a>
    <div class="nav-links">
      <a href="../">Home</a>
      <a href="../#pipeline">Pipeline</a>
      <a href="../#features">Features</a>
      <a href="#">Gallery</a>
    </div>
  </nav>

  <div class="gallery-header">
    <h1><span class="gradient">Template Gallery</span></h1>
    <p>Browse <span class="count">${manifest.length}</span> game templates. Filter by engine, genre, and complexity. Clone any template with one command.</p>
  </div>

  <div class="filter-bar">
    <div class="filter-inner">
      <input class="search-box" type="text" placeholder="Search templates..." id="search" autocomplete="off" />

      <div class="toggle-group" id="engine-toggle">
        <button class="toggle-btn active" data-engine="all">All</button>
        <button class="toggle-btn" data-engine="2d">2D</button>
        <button class="toggle-btn" data-engine="3d">3D</button>
      </div>

      <select class="complexity-select" id="complexity-select">
        <option value="all">All Levels</option>
        <option value="starter">Starter</option>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>

      <select class="sort-select" id="sort-select">
        <option value="default">Sort: Default</option>
        <option value="popular">Sort: Popular</option>
        <option value="trending">Sort: Trending</option>
      </select>

      <div class="genre-pills" id="genre-pills">
        ${allGenres.map(g => `<button class="genre-pill" data-genre="${g}">${g}</button>`).join('\n        ')}
      </div>
    </div>
  </div>

  <div class="results-bar" id="results-bar">
    Showing <strong>${manifest.length}</strong> of ${manifest.length} templates
  </div>

  <div class="grid" id="grid">
    ${manifest.map(t => cardHTML(t)).join('\n    ')}
    <div class="no-results" id="no-results" style="display:none;">No templates match your filters.</div>
  </div>

  <div class="toast" id="toast">Copied to clipboard!</div>

  <footer>
    Built by <a href="https://github.com/OpusGameLabs">OpusGameLabs</a> &middot;
    <a href="../">Home</a> &middot;
    <a href="https://github.com/OpusGameLabs/game-creator">Source</a>
  </footer>

  <script>
    const TELEMETRY_URL = '${TELEMETRY_URL}';
    const TEMPLATES = ${dataJSON};
    const manifestOrder = TEMPLATES.map(t => t.id);

    const searchInput = document.getElementById('search');
    const engineToggle = document.getElementById('engine-toggle');
    const complexitySelect = document.getElementById('complexity-select');
    const sortSelect = document.getElementById('sort-select');
    const genrePills = document.getElementById('genre-pills');
    const resultsBar = document.getElementById('results-bar');
    const grid = document.getElementById('grid');
    const noResults = document.getElementById('no-results');
    const toast = document.getElementById('toast');

    let activeEngine = 'all';
    let activeGenre = null;

    function getCardIndex(card) {
      return TEMPLATES.findIndex(t => t.id === card.dataset.id);
    }

    function sortCards() {
      const sortMode = sortSelect.value;
      if (sortMode === 'default') return;

      const cards = Array.from(grid.querySelectorAll('.card'));
      cards.sort((a, b) => {
        const ta = TEMPLATES[getCardIndex(a)];
        const tb = TEMPLATES[getCardIndex(b)];
        if (sortMode === 'popular') return (tb.clones || 0) - (ta.clones || 0);
        if (sortMode === 'trending') return (tb.clones_24h || 0) - (ta.clones_24h || 0);
        return 0;
      });
      cards.forEach(card => grid.appendChild(card));
      grid.appendChild(noResults);
    }

    function resetCardOrder() {
      const cards = Array.from(grid.querySelectorAll('.card'));
      cards.sort((a, b) => manifestOrder.indexOf(a.dataset.id) - manifestOrder.indexOf(b.dataset.id));
      cards.forEach(card => grid.appendChild(card));
      grid.appendChild(noResults);
    }

    function filterCards() {
      const query = searchInput.value.toLowerCase().trim();
      const complexity = complexitySelect.value;
      const cards = grid.querySelectorAll('.card');
      let visible = 0;

      cards.forEach(card => {
        const t = TEMPLATES[getCardIndex(card)];
        let show = true;

        if (query) {
          const haystack = (t.name + ' ' + t.description + ' ' + t.genre.join(' ') + ' ' + t.features.join(' ')).toLowerCase();
          show = haystack.includes(query);
        }
        if (show && activeEngine !== 'all') show = t.engine === activeEngine;
        if (show && complexity !== 'all') show = t.complexity === complexity;
        if (show && activeGenre) show = t.genre.includes(activeGenre);

        card.classList.toggle('hidden', !show);
        if (show) visible++;
      });

      noResults.style.display = visible === 0 ? 'block' : 'none';
      resultsBar.innerHTML = 'Showing <strong>' + visible + '</strong> of ' + TEMPLATES.length + ' templates';
    }

    searchInput.addEventListener('input', filterCards);

    engineToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('.toggle-btn');
      if (!btn) return;
      engineToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeEngine = btn.dataset.engine;
      filterCards();
    });

    complexitySelect.addEventListener('change', filterCards);

    sortSelect.addEventListener('change', () => {
      if (sortSelect.value === 'default') resetCardOrder();
      else sortCards();
      filterCards();
    });

    genrePills.addEventListener('click', (e) => {
      const pill = e.target.closest('.genre-pill');
      if (!pill) return;
      if (pill.classList.contains('active')) {
        pill.classList.remove('active');
        activeGenre = null;
      } else {
        genrePills.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeGenre = pill.dataset.genre;
      }
      filterCards();
    });

    function copyCommand(id) {
      fetch(TELEMETRY_URL + '/t?event=click&template=' + encodeURIComponent(id) + '&source=gallery&v=1')
        .catch(function() {});
      var text = '/use-template ' + id;
      navigator.clipboard.writeText(text).then(function() {
        toast.textContent = 'Copied: ' + text;
        toast.classList.add('show');
        setTimeout(function() { toast.classList.remove('show'); }, 2000);
      });
    }
  </script>

</body>
</html>`;
}

function cardHTML(t) {
  const engineBadge = t.engine === '2d'
    ? '<span class="badge badge-2d">Phaser 2D</span>'
    : '<span class="badge badge-3d">Three.js 3D</span>';

  const complexityBadge = `<span class="badge badge-${t.complexity}">${t.complexity}</span>`;

  const features = t.features.slice(0, 4)
    .map(f => `<span class="feature-pill">${f}</span>`)
    .join('');

  const cloneText = t.clones > 0
    ? `<div class="clone-count">${t.clones} clone${t.clones !== 1 ? 's' : ''}</div>`
    : '';

  const playBtn = t.demoUrl
    ? `<a class="card-btn btn-play" href="${t.demoUrl}" target="_blank">Play Demo</a>`
    : `<span class="card-btn btn-play" style="opacity:0.4;cursor:default;">No Demo</span>`;

  return `<div class="card" data-id="${t.id}">
      <div class="card-thumb">
        <img src="thumbnails/${t.id}.png" alt="${t.name}" loading="lazy" onerror="this.style.display='none'" />
        <div class="card-badges">${engineBadge}${complexityBadge}</div>
      </div>
      <div class="card-body">
        <h2>${t.name}</h2>
        <p class="desc">${t.description}</p>
        <div class="card-features">${features}</div>
        ${cloneText}
        <div class="card-actions">
          ${playBtn}
          <button class="card-btn btn-use" onclick="copyCommand('${t.id}')">Use Template</button>
        </div>
      </div>
    </div>`;
}

main();
