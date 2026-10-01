import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Txt} from '../components/kit';
import {ALICE, KEY, SpriteG} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Caption} from '../components/ui';
import {FONT, snap} from '../theme';
import {fl, Mark, T} from './sig_lib';

/* ====================================================================== */
/* Merkle tree: 8 one-time keys → one public key                          */
/* ====================================================================== */

const H = 3;
const N = 1 << H; // 8 leaves
const LEAF_X = (i: number) => 393 + i * 162;
const LVL_Y = [582, 462, 342, 222]; // leaves, L1, L2, root
const KEY_Y = 696;
/** x of node j on level l (0 = leaves) */
const NX = (l: number, j: number) => {
  const span = 1 << l;
  return (LEAF_X(j * span) + LEAF_X(j * span + span - 1)) / 2;
};
const SIGN_I = 5;
/** authentication path: sibling index on each level below the root */
const PATH = new Array(H).fill(0).map((_, l) => (SIGN_I >> l) ^ 1);
/** the nodes recomputed by the verifier */
const CLIMB = new Array(H + 1).fill(0).map((_, l) => SIGN_I >> l);

const BUILD = [60, 150, 204, 252]; // level appear frames
const SIGN = 330;
const PATHT = 384;
const VERIFY = 492;
const VSTEP = 48;
const OUTRO = 690;

/** bracket edges from children (level l-1) up to parent (level l) */
const Bracket: React.FC<{l: number; j: number; bold: boolean}> = ({l, j, bold}) => {
  const px = snap(NX(l, j));
  const py = LVL_Y[l];
  const cy = LVL_Y[l - 1];
  const a = snap(NX(l - 1, 2 * j));
  const b = snap(NX(l - 1, 2 * j + 1));
  const mid = snap((py + cy) / 2);
  const top = py + (l === H ? 30 : 24);
  const bot = cy - (l === 1 ? 30 : 24);
  const w = bold ? 6 : 3;
  const c = bold ? T.ink : T.dim;
  return (
    <g>
      <rect x={px - w / 2} y={top} width={w} height={mid - top} fill={c} />
      <rect x={a - w / 2} y={mid} width={b - a + w} height={w} fill={c} />
      <rect x={a - w / 2} y={mid} width={w} height={bot - mid} fill={c} />
      <rect x={b - w / 2} y={mid} width={w} height={bot - mid} fill={c} />
    </g>
  );
};

export const SigMerkle: React.FC = () => {
  const f = useF();
  const climbLvl = f >= VERIFY ? Math.min(H, Math.floor((f - VERIFY) / VSTEP)) : -1; // highest recomputed level
  const signing = f >= SIGN;
  const pathOn = f >= PATHT;
  const verified = f >= VERIFY + H * VSTEP + 18;
  const isPath = (l: number, j: number) => pathOn && l < H && PATH[l] === j;
  const isClimb = (l: number, j: number) => climbLvl >= l && CLIMB[l] === j;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {/* brackets */}
        {[1, 2, 3].map((l) =>
          new Array(N >> l).fill(0).map((_, j) => (f >= BUILD[l] ? <Bracket key={`${l}-${j}`} l={l} j={j} bold={isClimb(l, j)} /> : null)),
        )}
        {/* one-time keys */}
        {new Array(N).fill(0).map((_, i) =>
          fl(f, 6 + i * 6) ? (
            <g key={`k${i}`}>
              {signing && i === SIGN_I && <rect x={LEAF_X(i) - 42} y={KEY_Y - 30} width={84} height={60} fill="none" stroke={T.ink} strokeWidth={6} />}
              <SpriteG map={KEY} x={snap(LEAF_X(i) - 24)} y={KEY_Y - 12} s={4} />
              <rect x={LEAF_X(i) - 1} y={KEY_Y - 60} width={3} height={24} fill={f >= BUILD[0] ? T.dim : T.line} />
            </g>
          ) : null,
        )}
        {fl(f, 30) && !signing && (
          <Txt x={240} y={KEY_Y} size={24} anchor="end" color={T.sub}>
            一次性密钥
          </Txt>
        )}
        {/* leaves = H(pk_i) */}
        {new Array(N).fill(0).map((_, i) => {
          if (!fl(f, BUILD[0] + i * 6)) return null;
          const path = isPath(0, i);
          const climb = isClimb(0, i);
          const inv = path;
          return (
            <g key={`l${i}`}>
              <rect x={LEAF_X(i) - 30} y={LVL_Y[0] - 30} width={60} height={60} fill={inv ? T.inv : T.paper} stroke={T.ink} strokeWidth={climb ? 6 : 3} />
              <Txt x={LEAF_X(i)} y={LVL_Y[0] + 2} size={24} color={inv ? T.invText : T.ink} family={FONT.pixelMono}>
                {i}
              </Txt>
            </g>
          );
        })}
        {/* internal nodes */}
        {[1, 2].map((l) =>
          new Array(N >> l).fill(0).map((_, j) => {
            if (!fl(f, BUILD[l] + j * 6)) return null;
            const path = isPath(l, j);
            const climb = isClimb(l, j);
            const x = snap(NX(l, j));
            return <rect key={`n${l}${j}`} x={x - 24} y={LVL_Y[l] - 24} width={48} height={48} fill={path ? T.inv : T.paper} stroke={T.ink} strokeWidth={climb ? 6 : 3} />;
          }),
        )}
        {/* root */}
        {fl(f, BUILD[3]) && (
          <g>
            <rect x={876} y={LVL_Y[3] - 30} width={168} height={60} fill={T.inv} stroke={T.ink} strokeWidth={verified ? 6 : 3} />
            <Txt x={960} y={LVL_Y[3] + 2} size={36} color={T.invText} family={FONT.pixelMono}>
              PK
            </Txt>
            {fl(f, BUILD[3] + 24) && (
              <Txt x={1092} y={LVL_Y[3]} size={36} anchor="start" color={T.ink}>
                公钥 = 根哈希（32 字节）
              </Txt>
            )}
            <Mark x={840} y={LVL_Y[3]} ok show={verified} s={4} />
          </g>
        )}
        {fl(f, BUILD[3] + 36) && (
          <Txt x={96} y={LVL_Y[3]} size={24} anchor="start" color={T.sub} family={FONT.pixelMono}>
            {`h = ${H}：2³ = ${N} 次签名`}
          </Txt>
        )}
        {/* signer */}
        {signing && (
          <g>
            <SpriteG map={ALICE} x={120} y={570} s={12} accent={T.sub} />
          </g>
        )}
        {pathOn && f < OUTRO && (
          <Txt x={1824} y={LVL_Y[2]} size={24} anchor="end" color={T.sub}>
            {`实心 = 认证路径（${H} 个兄弟节点）`}
          </Txt>
        )}
        {signing && f < OUTRO && fl(f, SIGN + 12) && (
          <Txt x={960} y={804} size={36} color={T.ink} family={FONT.pixelMono}>
            {f >= VERIFY ? `验证：自底向上重算 ${H} 次哈希，与 PK 比较` : `σ = ( i = ${SIGN_I}, OTS 签名, pk${'₀₁₂₃₄₅₆₇'[SIGN_I]}, 认证路径 )`}
          </Txt>
        )}
        {fl(f, OUTRO) && (
          <g>
            <Txt x={960} y={774} size={36} color={T.ink}>
              只用哈希、不靠数论难题 ⟶ 抗量子
            </Txt>
            {fl(f, OUTRO + 30) && (
              <Txt x={960} y={834} size={24} color={T.sub} family={FONT.pixelMono}>
                Merkle 1979 · XMSS · SPHINCS+ ⟶ SLH-DSA（FIPS 205, 2024）
              </Txt>
            )}
          </g>
        )}
      </svg>
      <Caption title="Merkle 树" en="HASH-BASED SIGNATURES" desc="2^h 把一次性密钥 → 一个 32 字节公钥；只依赖哈希，抗量子" color={T.act} />
    </AbsoluteFill>
  );
};

export const SigMerkleCues: Cue[] = [
  [6, 'tick'],
  [30, 'tick'],
  ...BUILD.map((t, i): Cue => [t, 'blip', 64 + i * 5]),
  [BUILD[3], 'chime'],
  [SIGN, 'step'],
  [PATHT, 'blip', 76],
  ...[0, 1, 2, 3].map((k): Cue => [VERIFY + k * VSTEP, 'tick']),
  [VERIFY + H * VSTEP + 18, 'bell', 79],
  [OUTRO, 'riser2'],
];
