import React from 'react';
import {AbsoluteFill} from 'remotion';
import {MILESTONES} from '../cites';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {DitherFill} from '../components/pixel';
import {ACTS} from '../components/ui';
import {clamp01, COL, FONT, quant, rnd, snap} from '../theme';

/**
 * Overview: ciphertext tiles in Schotter-like disorder (Georg Nees, 1968) are "decrypted" into a
 * Mondrian-like composition of four chapter blocks. Order from disorder = decryption.
 */

type Block = {x: number; y: number; w: number; h: number; cols: number; fill: 'paper' | 'grey' | 'dither' | 'ink'; topics: string[]};

const L = 12; // ink line width
export const BLOCKS: Block[] = [
  {x: 96, y: 150, w: 660, h: 360, cols: 4, fill: 'paper', topics: ['一次一密', '完美保密', 'AES', '差分分析', '线性分析', '代数攻击', '工作模式', '生日界', 'MAC', '认证加密']},
  {x: 756, y: 150, w: 600, h: 360, cols: 4, fill: 'grey', topics: ['模运算', '循环群', '离散对数', 'DH 交换', 'RSA', '陷门函数', 'CRT', '椭圆曲线', 'ElGamal', 'TLS 1.3']},
  {x: 1356, y: 150, w: 468, h: 720, cols: 2, fill: 'dither', topics: ['EUF-CMA', '单向函数', 'Lamport', 'Merkle 树', 'Schnorr', 'Fiat-Shamir', 'nonce', 'BLS', '配对', '门限签名']},
  {x: 96, y: 510, w: 600, h: 360, cols: 4, fill: 'ink', topics: ['交互证明', '图同构', '零知识', '模拟器', 'Σ 协议', '特殊可靠性', 'FS 变换', 'Sumcheck', 'SNARK', '承诺']},
  {x: 696, y: 510, w: 660, h: 360, cols: 4, fill: 'paper', topics: ['LWE', 'Kyber', 'ML-DSA', '侧信道', '掩码', '秘密共享', 'MPC', 'PIR', '差分隐私', '同态加密']},
];
const TWB = (b: Block) => Math.min(168, Math.floor((b.w - 36 - (b.cols - 1) * GAP) / b.cols));
const TH = 54;
const GAP = 12;
const HEX = '0123456789abcdef';

const DEC0 = 170; // decryption starts
const SPOT = [400, 490, 580, 670, 760]; // chapter spotlights
const SPOT_LEN = 90;
const OUTRO = 850;

const tilePos = (b: Block, k: number) => {
  const c = k % b.cols;
  const r = Math.floor(k / b.cols);
  const TW = TWB(b);
  const gridW = b.cols * TW + (b.cols - 1) * GAP;
  return {x: b.x + Math.round((b.w - gridW) / 2) + c * (TW + GAP), y: b.y + 102 + r * (TH + GAP)};
};

const cipherText = (seed: number, len: number) =>
  new Array(len)
    .fill(0)
    .map((_, i) => HEX[Math.floor(rnd(seed * 7.3 + i * 1.9) * 16)])
    .join('');

export const Overview: React.FC = () => {
  const f = useF();
  const settled = f >= DEC0 + 200;
  const spot = SPOT.findIndex((s) => f >= s && f < s + SPOT_LEN);
  const outroT = f - OUTRO;

  const tiles: React.ReactNode[] = [];
  BLOCKS.forEach((b, bi) =>
    b.topics.forEach((label, k) => {
      const id = bi * 10 + k;
      const TW = TWB(b);
      const fin = tilePos(b, k);
      // scattered start: a loose grid with Schotter-like jitter, more chaos further down
      const gx = 120 + (id % 10) * 170;
      const gy = 170 + Math.floor(id / 10) * 140;
      const chaos = 0.3 + 0.7 * (Math.floor(id / 10) / 4);
      const sx = snap(gx + (rnd(id * 2.3) - 0.5) * 120 * chaos);
      const sy = snap(gy + (rnd(id * 3.9) - 0.5) * 120 * chaos);
      const rot0 = Math.round(((rnd(id * 5.3) - 0.5) * 90 * chaos) / 15) * 15;
      const start = DEC0 + Math.floor(rnd(id * 1.7) * 130);
      const t = quant(clamp01((f - start) / 30), 5);
      const x = snap(sx + (fin.x - sx) * t);
      const y = snap(sy + (fin.y - sy) * t);
      const rot = Math.round(rot0 * (1 - t));
      // text: ciphertext → plaintext, char by char
      const shown = t >= 1 ? label : t > 0 ? label.slice(0, Math.floor(label.length * t)) + cipherText(id + f, Math.max(0, 4 - Math.floor(4 * t))) : cipherText(id + Math.floor(f / 6), 4);
      const inv = t >= 1 && b.fill === 'ink';
      tiles.push(
        <g key={id} transform={`translate(${x + TW / 2},${y + TH / 2}) rotate(${rot})`}>
          <rect x={-TW / 2} y={-TH / 2} width={TW} height={TH} fill={inv ? COL.ink : COL.panel} stroke={inv ? COL.invText : COL.ink} strokeWidth={3} />
          <text y={2} textAnchor="middle" dominantBaseline="middle" fontFamily={t >= 1 ? FONT.pixel : FONT.pixelMono} fontSize={24} fill={inv ? COL.invText : COL.text}>
            {shown}
          </text>
        </g>,
      );
    }),
  );

  // composition appears as the tiles settle
  const comp = quant(clamp01((f - DEC0 - 40) / 120), 6);

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute'}} shapeRendering="crispEdges">
        {comp > 0 &&
          BLOCKS.map((b, bi) => (
            <g key={bi}>
              {b.fill === 'grey' && <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={COL.panelDark} opacity={comp >= 0.5 ? 1 : 0} />}
              {b.fill === 'paper' && <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={COL.panel} opacity={comp >= 0.33 ? 1 : 0} />}
              {b.fill === 'ink' && comp >= 0.66 && <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={COL.ink} />}
              {b.fill === 'dither' && comp >= 0.5 && <DitherFill id={`ov-d${bi}`} level={0.19} x={b.x} y={b.y} w={b.w} h={b.h} color={COL.dim} cell={6} />}
            </g>
          ))}
        {/* Mondrian ink grid */}
        {comp > 0 && (
          <g fill={COL.ink}>
            <rect x={96 - L / 2} y={150 - L / 2} width={1728 + L} height={L} />
            <rect x={96 - L / 2} y={870 - L / 2} width={(1728 + L) * comp} height={L} />
            <rect x={96 - L / 2} y={150 - L / 2} width={L} height={(720 + L) * comp} />
            <rect x={1824 - L / 2} y={150 - L / 2} width={L} height={(720 + L) * comp} />
            <rect x={1356 - L / 2} y={150 - L / 2} width={L} height={(720 + L) * comp} />
            <rect x={756 - L / 2} y={150 - L / 2} width={L} height={360 * comp} />
            <rect x={696 - L / 2} y={510 - L / 2} width={L} height={360 * comp} />
            <rect x={96 - L / 2} y={510 - L / 2} width={1260 * comp} height={L} />
          </g>
        )}
        {/* chapter headers */}
        {settled &&
          BLOCKS.map((b, bi) => {
            const inv = b.fill === 'ink';
            return (
              <g key={bi}>
                <text x={b.x + 36} y={b.y + 54} fontFamily={FONT.press} fontSize={32} fill={inv ? COL.invText : COL.text}>
                  {ACTS[bi].num}
                </text>
                <text x={b.x + 36 + ACTS[bi].num.length * 32 + 24} y={b.y + 54} fontFamily={FONT.pixel} fontSize={36} fill={inv ? COL.invText : COL.text}>
                  {ACTS[bi].name}
                </text>
              </g>
            );
          })}
        {tiles}
        {/* dim the other chapters with a dither veil (no translucency) */}
        {spot >= 0 && BLOCKS.map((b, bi) => (bi === spot ? null : <DitherFill key={bi} id={`ov-veil${bi}`} level={0.5} x={b.x + L / 2} y={b.y + L / 2} w={b.w - L} h={b.h - L} color={COL.bg} cell={6} />))}
        {spot >= 0 && (
          <rect x={BLOCKS[spot].x + 6} y={BLOCKS[spot].y + 6} width={BLOCKS[spot].w - 12} height={BLOCKS[spot].h - 12} fill="none" stroke={BLOCKS[spot].fill === 'ink' ? COL.invText : COL.ink} strokeWidth={6} />
        )}
      </svg>

      {/* top line */}
      <div style={{position: 'absolute', left: 96, top: 66, display: 'flex', alignItems: 'baseline', gap: 24, whiteSpace: 'nowrap'}}>
        <span style={{fontFamily: FONT.press, fontSize: 16, color: COL.dim}}>OVERVIEW</span>
        <span style={{fontFamily: FONT.pixel, fontSize: 36, color: COL.text}}>{f < DEC0 ? '密文' : settled ? '现代密码学 · 全景' : '解密中'}</span>
      </div>

      {/* bottom narration */}
      <div style={{position: 'absolute', left: 96, top: 912, width: 1728, whiteSpace: 'nowrap'}}>
        {spot >= 0 ? (
          <>
            <div style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.text}}>
              {ACTS[spot].zh} · {ACTS[spot].name}
              <span style={{fontFamily: FONT.press, fontSize: 16, color: COL.dim, marginLeft: 24}}>
                {MILESTONES[String(spot + 1).padStart(2, '0')][0][0]} — {MILESTONES[String(spot + 1).padStart(2, '0')].slice(-1)[0][0]}
              </span>
            </div>
            <div style={{fontFamily: FONT.pixel, fontSize: 24, lineHeight: '36px', color: COL.sub, whiteSpace: 'normal', width: 1728, marginTop: 6}}>
              {MILESTONES[String(spot + 1).padStart(2, '0')]
                .map(([y, l]) => `${y} ${l}`)
                .join('  ·  ')}
            </div>
          </>
        ) : f < DEC0 ? (
          <div style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.sub}}>{'没有钥匙，它们只是一片无序的符号'.slice(0, Math.floor(f / 3))}</div>
        ) : outroT >= 0 ? (
          <div style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.text}}>{'五章 · 五十个核心概念 · 从香农到后量子'.slice(0, Math.floor(outroT / 3))}</div>
        ) : settled ? null : (
          <div style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.sub}}>{'有了钥匙，秩序浮现'.slice(0, Math.floor((f - DEC0) / 3))}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const OverviewCues: Cue[] = [
  [6, 'type'],
  [DEC0, 'riser2'],
  ...new Array(12).fill(0).map((_, k): Cue => [DEC0 + 10 + k * 12, 'tick']),
  [DEC0 + 160, 'chime'],
  ...SPOT.map((s, i): Cue => [s, 'bell', [72, 76, 79, 84, 88][i]]),
  [OUTRO, 'whoosh'],
];
