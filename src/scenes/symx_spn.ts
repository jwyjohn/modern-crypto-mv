/* Toy 16-bit SPN from Heys' tutorial: 4×4 S-box E4D12FB83A6C5907, bit-transposition P, 4 rounds + final key.
 * Everything shown on screen in the cryptanalysis section is computed here (deterministically). */

export const SBOX = [0xe, 0x4, 0xd, 0x1, 0x2, 0xf, 0xb, 0x8, 0x3, 0xa, 0x6, 0xc, 0x5, 0x9, 0x0, 0x7];
export const SINV: number[] = (() => {
  const t = new Array(16).fill(0);
  SBOX.forEach((v, i) => (t[v] = i));
  return t;
})();

/** bit i (0 = MSB) of the 16-bit block goes to position (i mod 4)·4 + ⌊i/4⌋ */
export const perm = (b: number) => {
  let o = 0;
  for (let i = 0; i < 16; i++) if ((b >> (15 - i)) & 1) o |= 1 << (15 - ((i % 4) * 4 + Math.floor(i / 4)));
  return o;
};
export const subL = (v: number) => (SBOX[(v >> 12) & 15] << 12) | (SBOX[(v >> 8) & 15] << 8) | (SBOX[(v >> 4) & 15] << 4) | SBOX[v & 15];
export const parity = (v: number) => {
  let c = 0;
  while (v) {
    c ^= v & 1;
    v >>= 1;
  }
  return c;
};
export const nib = (v: number) => v.toString(2).padStart(16, '0').replace(/(.{4})/g, '$1 ').trim();
export const h1 = (v: number) => v.toString(16).toUpperCase();

/** difference distribution table: DDT[dx][dy] = #{x : S(x) ⊕ S(x⊕dx) = dy} */
export const DDT: number[][] = (() => {
  const t = [...Array(16)].map(() => new Array(16).fill(0));
  for (let x = 0; x < 16; x++) for (let dx = 0; dx < 16; dx++) t[dx][SBOX[x] ^ SBOX[x ^ dx]]++;
  return t;
})();

/** linear approximation table (count − 8): LAT[a][b] = #{x : a·x = b·S(x)} − 8; bias = LAT/16 */
export const LAT: number[][] = [...Array(16)].map((_, a) => [...Array(16)].map((__, b) => {
  let c = 0;
  for (let x = 0; x < 16; x++) if (parity(x & a) === parity(SBOX[x] & b)) c++;
  return c - 8;
}));

/** mulberry32 — good 32-bit PRNG built on Math.imul (no float overflow) */
export const prng = (seed: number) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  };
};

/** the secret round keys of our demo instance; last key has nibbles 2 and 4 = 2, 4 (target partial subkey 0x24) */
const R0 = prng(1);
export const KEYS = [R0() & 0xffff, R0() & 0xffff, R0() & 0xffff, R0() & 0xffff, (R0() & 0xf0f0) | 0x0204];
export const TARGET = 0x24;
const u4Of = (p: number) => {
  let s = p;
  for (let i = 0; i < 3; i++) s = perm(subL(s ^ KEYS[i]));
  return s ^ KEYS[3];
};
export const encrypt = (p: number) => subL(u4Of(p)) ^ KEYS[4];

/** differential characteristic of the tutorial: ΔP = 0B00 → ΔU4 = 0606 */
export const DP = 0x0b00;
export const CHAR = (() => {
  const dv1 = 0x0200; // S12: B → 2
  const du2 = perm(dv1);
  const dv2 = 0x0060; // S23: 4 → 6
  const du3 = perm(dv2);
  const dv3 = 0x0550; // S32, S33: 2 → 5
  const du4 = perm(dv3);
  const p = (DDT[0xb][2] / 16) * (DDT[4][6] / 16) * (DDT[2][5] / 16) ** 2;
  return {du: [DP, du2, du3, du4], dv: [dv1, dv2, dv3], p};
})();

/** key recovery: 5000 chosen pairs, counters for all 256 guesses of (K5 nibble 2, nibble 4); snapshots every 250 pairs */
export const NPAIRS = 5000;
export const SNAP = 250;
export const DIFF_SNAPS: number[][] = (() => {
  const r = prng(1);
  for (let i = 0; i < 5; i++) r(); // same stream position as KEYS generation, then continue
  const cnt = new Array(256).fill(0);
  const snaps: number[][] = [cnt.slice()];
  for (let n = 1; n <= NPAIRS; n++) {
    const p = r() & 0xffff;
    const c = encrypt(p);
    const c2 = encrypt(p ^ DP);
    if (((c ^ c2) & 0xf0f0) === 0) {
      for (let g = 0; g < 256; g++) {
        const a = g >> 4;
        const b = g & 15;
        if ((SINV[((c >> 8) & 15) ^ a] ^ SINV[((c2 >> 8) & 15) ^ a]) === 6 && (SINV[(c & 15) ^ b] ^ SINV[(c2 & 15) ^ b]) === 6) cnt[g]++;
      }
    }
    if (n % SNAP === 0) snaps.push(cnt.slice());
  }
  return snaps;
})();

/** linear approximation P5⊕P7⊕P8 ⊕ U4,6⊕U4,8⊕U4,14⊕U4,16 — exact bias over all 2^16 plaintexts */
export const LIN_TRUE_BIAS = (() => {
  let hold = 0;
  for (let p = 0; p < 65536; p++) if ((parity(p & 0x0b00) ^ parity(u4Of(p) & 0x0505)) === 0) hold++;
  return hold / 65536 - 0.5;
})();
