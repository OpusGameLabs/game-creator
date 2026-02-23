#!/usr/bin/env node
// =============================================================================
// validate-architecture.mjs — Static architecture validation for Three.js games
//
// Checks that a game project follows the required architecture patterns:
// - render_game_to_text() in main.js
// - GameState.reset() in core/GameState.js
// - SAFE_ZONE constant in core/Constants.js
// - systems/ directory exists with at least one system file
// - EventBus events defined in core/EventBus.js
// - [WARN] Hardcoded magic numbers outside Constants.js
//
// Usage:
//   node scripts/validate-architecture.mjs
//
// Exits 0 if all required checks pass, 1 if any FAIL.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';

const CWD = process.cwd();
const SRC = path.join(CWD, 'src');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFile(relPath) {
  const full = path.join(SRC, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf-8');
}

function readDir(relPath) {
  const full = path.join(SRC, relPath);
  if (!fs.existsSync(full) || !fs.statSync(full).isDirectory()) return [];
  return fs.readdirSync(full).filter(f => f.endsWith('.js'));
}

function getAllJsFiles(dir, base) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllJsFiles(full, rel));
    } else if (entry.name.endsWith('.js')) {
      results.push({ path: full, rel });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
let warnings = 0;

function pass(msg) {
  console.log(`[PASS] ${msg}`);
  passed++;
}

function fail(msg) {
  console.log(`[FAIL] ${msg}`);
  failed++;
}

function warn(msg) {
  console.log(`[WARN] ${msg}`);
  warnings++;
}

console.log('=== Architecture Validation (Three.js) ===\n');

// Check 1: render_game_to_text() in main.js
const mainJs = readFile('main.js');
if (mainJs && /render_game_to_text/.test(mainJs)) {
  pass('render_game_to_text() found in main.js');
} else if (!mainJs) {
  fail('render_game_to_text() — src/main.js not found');
} else {
  fail('render_game_to_text() not found in main.js');
}

// Check 2: GameState has reset() method
const gameStateJs = readFile('core/GameState.js');
if (gameStateJs && /reset\s*\(/.test(gameStateJs)) {
  pass('GameState.reset() found');
} else if (!gameStateJs) {
  fail('GameState.reset() — src/core/GameState.js not found');
} else {
  fail('GameState.reset() not found in GameState.js');
}

// Check 3: SAFE_ZONE constant in Constants.js
const constantsJs = readFile('core/Constants.js');
if (constantsJs && /SAFE_ZONE/.test(constantsJs)) {
  pass('SAFE_ZONE found in Constants.js');
} else if (!constantsJs) {
  fail('SAFE_ZONE — src/core/Constants.js not found');
} else {
  fail('SAFE_ZONE not found in Constants.js');
}

// Check 4: systems/ directory with system files (Three.js equivalent of Phaser scenes)
const systemFiles = readDir('systems');
if (systemFiles.length > 0) {
  pass(`systems/ directory found (${systemFiles.length} system file${systemFiles.length !== 1 ? 's' : ''}: ${systemFiles.join(', ')})`);
} else {
  const systemsDir = path.join(SRC, 'systems');
  if (fs.existsSync(systemsDir)) {
    fail('systems/ directory exists but contains no .js files');
  } else {
    fail('systems/ directory not found — Three.js games need src/systems/ for game systems');
  }
}

// Check 5: EventBus has events defined
const eventBusJs = readFile('core/EventBus.js');
let eventCount = 0;

if (eventBusJs) {
  // Count exported event constants — look for KEY: 'value' patterns in an Events object
  const eventMatches = eventBusJs.match(/[A-Z_]+\s*:\s*['"][a-z]+:[a-z_]+['"]/g);
  eventCount = eventMatches ? eventMatches.length : 0;

  if (eventCount > 0) {
    pass(`EventBus events defined (${eventCount} events)`);
  } else {
    fail('EventBus — no event constants found in EventBus.js');
  }
} else {
  fail('EventBus — src/core/EventBus.js not found');
}

// Check 6: [WARN] Hardcoded magic numbers
const allJsFiles = getAllJsFiles(SRC, '');
const excludeFiles = new Set(['core/Constants.js', 'core/PixelRenderer.js']);
// Also exclude by basename for flexibility
const excludeBaseNames = new Set(['Constants.js', 'PixelRenderer.js']);

// Common non-magic numbers to allow
const allowedNumbers = new Set([
  0, 1, 2, 3, 4, 5, 10, 16, 32, 60, 64, 100, 255, 256, 1000,
  0.5, 0.25, 0.75, 1.0, 2.0,
  -1, -2,
]);

const magicNumberPattern = /(?<!\w)(-?\d+\.?\d*)\b/g;
const suspiciousLines = [];

for (const { path: filePath, rel } of allJsFiles) {
  // Normalize path separators for comparison
  const normRel = rel.replace(/\\/g, '/');
  const baseName = path.basename(filePath);

  if (excludeFiles.has(normRel) || excludeBaseNames.has(baseName)) continue;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
    // Skip import/export lines
    if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) continue;
    // Skip lines that are just closing braces, returns of simple values, etc.
    if (trimmed.length < 5) continue;

    let match;
    magicNumberPattern.lastIndex = 0;
    while ((match = magicNumberPattern.exec(line)) !== null) {
      const num = parseFloat(match[1]);
      if (allowedNumbers.has(num)) continue;
      if (isNaN(num)) continue;
      // Skip proportional values (alpha, scale, ratio)
      if (Math.abs(num) > 0 && Math.abs(num) < 1) continue;
      // Skip hex color literals (0x...)
      if (/0x[0-9a-fA-F]+/.test(match[0])) continue;
      const before = line.substring(0, match.index);
      if (/0x[0-9a-fA-F]*$/.test(before)) continue;
      // Skip version-like patterns and string contents
      if (/['"`]/.test(before) && /['"`]/.test(line.substring(match.index + match[0].length))) continue;

      suspiciousLines.push({
        file: `src/${normRel}`,
        line: lineNum + 1,
        text: trimmed,
        number: match[1],
      });
    }
  }
}

if (suspiciousLines.length > 0) {
  warn('Possible magic numbers:');
  // Show up to 15 suspicious lines
  const shown = suspiciousLines.slice(0, 15);
  for (const s of shown) {
    console.log(`  ${s.file}:${s.line}  ${s.text}`);
  }
  if (suspiciousLines.length > 15) {
    console.log(`  ... and ${suspiciousLines.length - 15} more`);
  }
} else {
  console.log('[INFO] No suspicious magic numbers detected');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const total = passed + failed;
console.log(`\nResults: ${passed}/${total} passed, ${failed} failed, ${warnings} warning${warnings !== 1 ? 's' : ''}`);

process.exit(failed > 0 ? 1 : 0);
