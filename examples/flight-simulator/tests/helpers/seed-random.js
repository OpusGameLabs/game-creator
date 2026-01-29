// Mulberry32 seeded PRNG — inject via page.addInitScript()
// Provides deterministic Math.random() for reproducible ring placement
(function() {
  let seed = 42;
  Math.random = function() {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();
