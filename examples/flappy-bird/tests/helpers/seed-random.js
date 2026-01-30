// Mulberry32 — seeded PRNG for deterministic tests
export function seedRandom(seed = 42) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function injectSeedRandom(page, seed = 42) {
  return page.addInitScript(`
    (function() {
      let s = ${seed};
      function mulberry32() {
        let t = (s += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      }
      Math.random = mulberry32;
    })();
  `);
}
