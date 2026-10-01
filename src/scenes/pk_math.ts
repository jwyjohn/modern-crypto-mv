// Small deterministic number-theory helpers for ACT 2 (all values computed, never hard-coded).

export const mod = (v: number, m: number) => ((v % m) + m) % m;

export const modpow = (b: number, e: number, m: number) => {
  let r = 1n;
  let bb = BigInt(mod(b, m));
  let ee = BigInt(e);
  const mm = BigInt(m);
  while (ee > 0n) {
    if (ee & 1n) r = (r * bb) % mm;
    bb = (bb * bb) % mm;
    ee >>= 1n;
  }
  return Number(r);
};

export const modinv = (a: number, m: number) => {
  const A = mod(a, m);
  for (let i = 1; i < m; i++) if ((A * i) % m === 1) return i;
  return -1;
};

export const order = (g: number, p: number) => {
  let x = g % p;
  let k = 1;
  while (x !== 1) {
    x = (x * g) % p;
    k++;
  }
  return k;
};

/** powers g^0..g^(n-1) mod p */
export const powers = (g: number, p: number, n: number) => {
  const out: number[] = [];
  let x = 1;
  for (let i = 0; i < n; i++) {
    out.push(x);
    x = (x * g) % p;
  }
  return out;
};

/** square-and-multiply table: rows {k: 2^i, v: b^(2^i) mod m, bit} plus running products for set bits */
export const sqMul = (b: number, e: number, m: number) => {
  const bits = e.toString(2).split('').reverse().map(Number);
  const rows: {k: number; v: number; bit: number}[] = [];
  let v = mod(b, m);
  for (let i = 0; i < bits.length; i++) {
    rows.push({k: 1 << i, v, bit: bits[i]});
    v = (v * v) % m;
  }
  const chain: {k: number; v: number; acc: number; raw: number}[] = [];
  let acc = 1;
  for (const r of rows) {
    if (!r.bit) continue;
    const raw = acc * r.v;
    acc = raw % m;
    chain.push({k: r.k, v: r.v, acc, raw});
  }
  return {bits, rows, chain, result: acc};
};

/* ---------------- elliptic curve over F_p ---------------- */
export type EP = [number, number] | null;

export const ecAdd = (P: EP, Q: EP, a: number, p: number): EP => {
  if (!P) return Q;
  if (!Q) return P;
  if (P[0] === Q[0] && mod(P[1] + Q[1], p) === 0) return null;
  let m: number;
  if (P[0] === Q[0] && P[1] === Q[1]) m = mod((3 * P[0] * P[0] + a) * modinv(2 * P[1], p), p);
  else m = mod((Q[1] - P[1]) * modinv(Q[0] - P[0], p), p);
  const x = mod(m * m - P[0] - Q[0], p);
  return [x, mod(m * (P[0] - x) - P[1], p)];
};

export const ecPoints = (a: number, b: number, p: number) => {
  const pts: [number, number][] = [];
  for (let x = 0; x < p; x++) for (let y = 0; y < p; y++) if (mod(y * y - (x * x * x + a * x + b), p) === 0) pts.push([x, y]);
  return pts;
};

export const ecMul = (k: number, P: EP, a: number, p: number): EP => {
  let R: EP = null;
  for (let i = 0; i < k; i++) R = ecAdd(R, P, a, p);
  return R;
};

/* ---------------- elliptic curve over R (y^2 = x^3 + a x + b) ---------------- */
export const reAdd = (P: [number, number], Q: [number, number], a: number) => {
  const same = Math.abs(P[0] - Q[0]) < 1e-9 && Math.abs(P[1] - Q[1]) < 1e-9;
  const m = same ? (3 * P[0] * P[0] + a) / (2 * P[1]) : (Q[1] - P[1]) / (Q[0] - P[0]);
  const x = m * m - P[0] - Q[0];
  const y = P[1] + m * (x - P[0]);
  return {m, R: [x, y] as [number, number], S: [x, -y] as [number, number]};
};

/* ---------------- CRT ---------------- */
export const crt = (c: number[], N: number[]) => {
  const M = N.reduce((s, v) => s * v, 1);
  const rows = N.map((n, i) => {
    const Mi = M / n;
    const r = Mi % n;
    const y = modinv(r, n);
    return {n, c: c[i], Mi, r, y, term: c[i] * Mi * y};
  });
  const sum = rows.reduce((s, r) => s + r.term, 0);
  return {M, rows, sum, x: sum % M};
};
