#!/usr/bin/env node
/**
 * find-3d-asset.mjs — Search free 3D model libraries and download GLB files.
 *
 * Zero npm dependencies. Uses Node.js built-in fetch, fs, path, child_process.
 *
 * Sources (in priority order):
 *   1. Poly.pizza  — 10K+ low-poly CC-BY models (requires POLY_PIZZA_API_KEY)
 *   2. Sketchfab   — 700K+ models (search free, download requires SKETCHFAB_TOKEN)
 *   3. Poly Haven   — ~400 CC0 models (fully free, no auth)
 *
 * Usage:
 *   node scripts/find-3d-asset.mjs --query "house" --output public/assets/models/
 *   node scripts/find-3d-asset.mjs --query "tree" --source sketchfab --output public/assets/models/
 *   node scripts/find-3d-asset.mjs --query "chair" --source polyhaven --output public/assets/models/
 *   node scripts/find-3d-asset.mjs --query "coin" --list-only
 *
 * Output:
 *   {slug}.glb          — the 3D model file
 *   {slug}.meta.json    — source, license, attribution, polycount
 */

import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { execSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function getArg(name, fallback = null) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return fallback;
  return args[idx + 1];
}

const hasFlag = (name) => args.includes(`--${name}`);

const query = getArg('query');
const source = (getArg('source') || 'auto').toLowerCase();
const outputDir = getArg('output', 'public/assets/models');
const listOnly = hasFlag('list-only');
const maxResults = parseInt(getArg('limit', '5'), 10);
const maxFaces = parseInt(getArg('max-faces', '50000'), 10);
const slug = getArg('slug'); // override output filename

if (!query) {
  console.error(`Usage: node scripts/find-3d-asset.mjs --query "<search>" [options]

Options:
  --query <text>       Search query (required)
  --source <name>      Source: auto, polypizza, sketchfab, polyhaven (default: auto)
  --output <dir>       Output directory (default: public/assets/models)
  --list-only          Show results without downloading
  --limit <n>          Max search results to show (default: 5)
  --max-faces <n>      Max face count filter for Sketchfab (default: 50000)
  --slug <name>        Override output filename slug

Sources:
  auto       — Try Poly.pizza → Sketchfab → Poly Haven
  polypizza  — Poly.pizza (requires POLY_PIZZA_API_KEY env var)
  sketchfab  — Sketchfab (search free, download requires SKETCHFAB_TOKEN)
  polyhaven  — Poly Haven (fully free, no auth)`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function fetchJSON(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}: ${await res.text().catch(() => '')}`);
  }
  return res.json();
}

async function downloadFile(url, dest, headers = {}) {
  const res = await fetch(url, { headers, redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Download failed: HTTP ${res.status} from ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buffer);
  return buffer.length;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function writeMeta(outPath, meta) {
  writeFileSync(outPath, JSON.stringify(meta, null, 2) + '\n');
  console.log(`  meta → ${outPath}`);
}

// ---------------------------------------------------------------------------
// Poly.pizza
// ---------------------------------------------------------------------------

async function searchPolyPizza(q, limit) {
  const apiKey = process.env.POLY_PIZZA_API_KEY;
  if (!apiKey) {
    console.log('  [polypizza] POLY_PIZZA_API_KEY not set — skipping');
    return [];
  }

  console.log(`  [polypizza] Searching for "${q}"...`);

  try {
    const data = await fetchJSON(
      `https://api.poly.pizza/v1/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      { 'x-api-key': apiKey }
    );

    const results = (data.results || data.Results || []).map((m) => ({
      source: 'polypizza',
      id: m.ID || m.id,
      name: m.Name || m.name || m.Title || m.title,
      author: m.Author || m.author || 'Unknown',
      faces: m.Triangles || m.triangles || 0,
      license: m.License || m.license || 'CC-BY 3.0',
      thumbnail: m.Thumbnail || m.thumbnail || '',
      downloadUrl: m.Download || m.download || null,
      viewUrl: `https://poly.pizza/m/${m.ID || m.id}`,
    }));

    return results;
  } catch (err) {
    console.log(`  [polypizza] Search failed: ${err.message}`);
    return [];
  }
}

async function downloadPolyPizza(result, outDir, fileSlug) {
  const apiKey = process.env.POLY_PIZZA_API_KEY;
  const dest = join(outDir, `${fileSlug}.glb`);
  console.log(`  [polypizza] Downloading ${result.name}...`);

  // Try direct download URL first, then API download endpoint
  const downloadUrl = result.downloadUrl ||
    `https://api.poly.pizza/v1/model/${result.id}/download?format=glb`;

  try {
    const size = await downloadFile(downloadUrl, dest, { 'x-api-key': apiKey });
    console.log(`  model → ${dest} (${formatBytes(size)})`);
    return dest;
  } catch (err) {
    console.log(`  [polypizza] Download failed: ${err.message}`);
    console.log(`  [polypizza] Visit: ${result.viewUrl}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sketchfab
// ---------------------------------------------------------------------------

async function searchSketchfab(q, limit) {
  console.log(`  [sketchfab] Searching for "${q}"...`);

  const params = new URLSearchParams({
    type: 'models',
    q,
    downloadable: 'true',
    count: String(limit),
    sort_by: '-likeCount',
    max_face_count: String(maxFaces),
  });

  try {
    const data = await fetchJSON(`https://api.sketchfab.com/v3/search?${params}`);

    return (data.results || []).map((m) => ({
      source: 'sketchfab',
      id: m.uid,
      name: m.name,
      author: m.user?.displayName || 'Unknown',
      faces: m.faceCount || 0,
      license: m.license?.label || 'Unknown',
      thumbnail: m.thumbnails?.images?.[0]?.url || '',
      viewUrl: m.viewerUrl,
      animations: m.animationCount || 0,
      glbSize: m.archives?.glb?.size || 0,
    }));
  } catch (err) {
    console.log(`  [sketchfab] Search failed: ${err.message}`);
    return [];
  }
}

async function downloadSketchfab(result, outDir, fileSlug) {
  const token = process.env.SKETCHFAB_TOKEN;
  if (!token) {
    console.log(`  [sketchfab] SKETCHFAB_TOKEN not set — cannot download`);
    console.log(`  [sketchfab] Get a token at: https://sketchfab.com/settings/password`);
    console.log(`  [sketchfab] View model: ${result.viewUrl}`);
    return null;
  }

  console.log(`  [sketchfab] Requesting download for ${result.name}...`);
  const headers = { Authorization: `Token ${token}` };

  try {
    // Get temporary download URL (expires in 5 minutes)
    const dlInfo = await fetchJSON(
      `https://api.sketchfab.com/v3/models/${result.id}/download`,
      headers
    );

    // Prefer GLB format, fall back to GLTF
    const glbInfo = dlInfo.glb || dlInfo.gltf;
    if (!glbInfo?.url) {
      console.log(`  [sketchfab] No GLB/GLTF download available`);
      return null;
    }

    const format = glbInfo === dlInfo.glb ? 'glb' : 'gltf';
    const tmpDest = join(outDir, `${fileSlug}.download`);
    const modelDest = join(outDir, `${fileSlug}.glb`);

    console.log(`  [sketchfab] Downloading ${format.toUpperCase()}...`);
    await downloadFile(glbInfo.url, tmpDest);

    // Check if the file is already a GLB (starts with "glTF" magic bytes)
    const { readFileSync } = await import('node:fs');
    const header = readFileSync(tmpDest, { encoding: null }).subarray(0, 4);
    const isGlb = header[0] === 0x67 && header[1] === 0x6c && header[2] === 0x54 && header[3] === 0x46;

    if (isGlb) {
      // Already a GLB — just rename
      execSync(`mv "${tmpDest}" "${modelDest}"`, { stdio: 'pipe' });
      console.log(`  model → ${modelDest} (${formatBytes(readFileSync(modelDest).length)})`);
      return modelDest;
    }

    // Try to unzip (Sketchfab sometimes returns ZIP archives)
    const extractDir = join(outDir, `${fileSlug}_extract`);
    mkdirSync(extractDir, { recursive: true });

    try {
      execSync(`unzip -o -q "${tmpDest}" -d "${extractDir}"`, { stdio: 'pipe' });
    } catch {
      // Not a ZIP either — check if it's a GLTF JSON
      const text = readFileSync(tmpDest, 'utf8').slice(0, 20);
      if (text.includes('{') && text.includes('asset')) {
        execSync(`mv "${tmpDest}" "${join(outDir, `${fileSlug}.gltf`)}"`, { stdio: 'pipe' });
        console.log(`  model → ${join(outDir, `${fileSlug}.gltf`)}`);
        execSync(`rm -rf "${extractDir}"`, { stdio: 'pipe' });
        return join(outDir, `${fileSlug}.gltf`);
      }
      console.log(`  [sketchfab] Unknown file format`);
      execSync(`rm -rf "${extractDir}" "${tmpDest}"`, { stdio: 'pipe' });
      return null;
    }

    // Find .glb or .gltf file in extracted contents
    const findGlb = execSync(`find "${extractDir}" -name "*.glb" -o -name "*.gltf" | head -1`, {
      encoding: 'utf8',
    }).trim();

    if (findGlb) {
      execSync(`cp "${findGlb}" "${modelDest}"`, { stdio: 'pipe' });
      console.log(`  model → ${modelDest}`);
    } else {
      console.log(`  [sketchfab] No .glb/.gltf found in archive`);
      execSync(`rm -rf "${extractDir}" "${tmpDest}"`, { stdio: 'pipe' });
      return null;
    }

    // Cleanup
    execSync(`rm -rf "${extractDir}" "${tmpDest}"`, { stdio: 'pipe' });
    return modelDest;
  } catch (err) {
    console.log(`  [sketchfab] Download failed: ${err.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Poly Haven
// ---------------------------------------------------------------------------

let polyHavenCatalog = null;

async function loadPolyHavenCatalog() {
  if (polyHavenCatalog) return polyHavenCatalog;

  console.log(`  [polyhaven] Loading model catalog...`);
  polyHavenCatalog = await fetchJSON('https://api.polyhaven.com/assets?type=models');
  console.log(`  [polyhaven] ${Object.keys(polyHavenCatalog).length} models available`);
  return polyHavenCatalog;
}

async function searchPolyHaven(q, limit) {
  try {
    const catalog = await loadPolyHavenCatalog();
    const queryTerms = q.toLowerCase().split(/\s+/);

    const matches = [];
    for (const [id, info] of Object.entries(catalog)) {
      const searchText = [
        id,
        info.name || '',
        ...(info.tags || []),
        ...(info.categories || []),
      ].join(' ').toLowerCase();

      const score = queryTerms.filter((term) => searchText.includes(term)).length;
      if (score > 0) {
        matches.push({
          source: 'polyhaven',
          id,
          name: info.name || id,
          author: Object.keys(info.authors || {}).join(', ') || 'Poly Haven',
          faces: info.polycount || 0,
          license: 'CC0',
          thumbnail: info.thumbnail_url || '',
          categories: info.categories || [],
          tags: info.tags || [],
          score,
        });
      }
    }

    // Sort by relevance score, then by download count
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, limit);
  } catch (err) {
    console.log(`  [polyhaven] Search failed: ${err.message}`);
    return [];
  }
}

async function downloadPolyHaven(result, outDir, fileSlug) {
  console.log(`  [polyhaven] Fetching file info for ${result.id}...`);

  try {
    const filesInfo = await fetchJSON(`https://api.polyhaven.com/files/${result.id}`);

    // Prefer GLTF format at 1k resolution (smallest)
    const gltfData = filesInfo.gltf;
    if (!gltfData) {
      console.log(`  [polyhaven] No GLTF format available for ${result.id}`);
      return null;
    }

    // Find smallest resolution
    const resolution = ['1k', '2k', '4k'].find((r) => gltfData[r]) || Object.keys(gltfData)[0];
    const resData = gltfData[resolution];
    if (!resData) {
      console.log(`  [polyhaven] No resolution data found`);
      return null;
    }

    // Create a subdirectory for this model's GLTF files
    const modelDir = join(outDir, fileSlug);
    mkdirSync(modelDir, { recursive: true });

    // Download the main GLTF file
    const mainEntry = resData.gltf;
    if (!mainEntry?.url) {
      console.log(`  [polyhaven] No GLTF URL found`);
      return null;
    }

    const gltfDest = join(modelDir, `${fileSlug}.gltf`);
    console.log(`  [polyhaven] Downloading GLTF (${resolution})...`);
    await downloadFile(mainEntry.url, gltfDest);

    // Download included files (bin, textures)
    if (mainEntry.include) {
      for (const [relPath, fileInfo] of Object.entries(mainEntry.include)) {
        if (!fileInfo?.url) continue;
        const fileDest = join(modelDir, relPath);
        const fileDir = join(modelDir, relPath.substring(0, relPath.lastIndexOf('/') || 0));
        if (fileDir && fileDir !== modelDir) {
          mkdirSync(fileDir, { recursive: true });
        }
        console.log(`  [polyhaven]   + ${relPath} (${formatBytes(fileInfo.size || 0)})`);
        await downloadFile(fileInfo.url, fileDest);
      }
    }

    console.log(`  model → ${modelDir}/`);
    return gltfDest;
  } catch (err) {
    console.log(`  [polyhaven] Download failed: ${err.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n=== find-3d-asset: "${query}" ===\n`);

  const fileSlug = slug || slugify(query);

  // Determine which sources to search
  let sources;
  if (source === 'auto') {
    sources = [];
    if (process.env.POLY_PIZZA_API_KEY) sources.push('polypizza');
    sources.push('sketchfab', 'polyhaven');
  } else {
    sources = [source];
  }

  // Search all selected sources
  let allResults = [];

  for (const src of sources) {
    let results = [];
    switch (src) {
      case 'polypizza':
        results = await searchPolyPizza(query, maxResults);
        break;
      case 'sketchfab':
        results = await searchSketchfab(query, maxResults);
        break;
      case 'polyhaven':
        results = await searchPolyHaven(query, maxResults);
        break;
      default:
        console.log(`  Unknown source: ${src}`);
    }
    allResults.push(...results);

    // In auto mode, stop if we found good results
    if (source === 'auto' && results.length > 0) break;
  }

  if (allResults.length === 0) {
    console.log('\nNo models found. Try different search terms or a different source.');
    process.exit(1);
  }

  // Display results
  console.log(`\nFound ${allResults.length} result(s):\n`);
  allResults.forEach((r, i) => {
    const parts = [
      `  ${i + 1}. ${r.name}`,
      `     source: ${r.source} | faces: ${r.faces.toLocaleString()} | license: ${r.license}`,
      `     author: ${r.author}`,
    ];
    if (r.animations) parts.push(`     animations: ${r.animations}`);
    if (r.glbSize) parts.push(`     glb size: ${formatBytes(r.glbSize)}`);
    if (r.viewUrl) parts.push(`     url: ${r.viewUrl}`);
    if (r.thumbnail) parts.push(`     thumb: ${r.thumbnail}`);
    console.log(parts.join('\n'));
    console.log();
  });

  if (listOnly) {
    console.log('(--list-only mode, skipping download)');
    return;
  }

  // Download the first result
  const best = allResults[0];
  console.log(`--- Downloading: ${best.name} ---\n`);

  mkdirSync(resolve(outputDir), { recursive: true });
  const outDir = resolve(outputDir);

  let modelPath = null;
  switch (best.source) {
    case 'polypizza':
      modelPath = await downloadPolyPizza(best, outDir, fileSlug);
      break;
    case 'sketchfab':
      modelPath = await downloadSketchfab(best, outDir, fileSlug);
      break;
    case 'polyhaven':
      modelPath = await downloadPolyHaven(best, outDir, fileSlug);
      break;
  }

  // Write meta.json regardless of download success
  const metaPath = join(outDir, `${fileSlug}.meta.json`);
  writeMeta(metaPath, {
    slug: fileSlug,
    name: best.name,
    source: best.source,
    sourceId: best.id,
    author: best.author,
    license: best.license,
    faces: best.faces,
    viewUrl: best.viewUrl || null,
    thumbnail: best.thumbnail || null,
    animations: best.animations || 0,
    downloadedAt: new Date().toISOString(),
    modelPath: modelPath ? basename(modelPath) : null,
  });

  if (modelPath) {
    console.log(`\n=== Done: ${modelPath} ===\n`);
  } else {
    console.log(`\n=== Search complete (download requires auth token) ===`);
    console.log(`    Metadata saved to: ${metaPath}`);
    console.log(`    View model: ${best.viewUrl || best.thumbnail}\n`);
  }
}

main().catch((err) => {
  console.error(`\nFatal error: ${err.message}`);
  process.exit(1);
});
