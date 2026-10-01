import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ALICE, KEY, LOCK, LOCK_OPEN, SpriteG} from '../components/pixel';
import {Txt} from '../components/kit';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Arrow, Caption} from '../components/ui';
import {blink, clamp01, COL, FONT, quant} from '../theme';
import {on, Tag} from './zk_util';

const INK = COL.text;
const M = FONT.pixelMono;

/* toy plaintexts (computed) */
const XV = 3;
const FX = XV * XV + 1;
const EA = 3;
const EB = 5;
const SUM = EA + EB;
const PROD = EA * EB;
const EC = 2;
const PROD2 = PROD * EC;

const P2 = 246;
const P3 = 486;

/* ---------- phase 1: client / cloud ---------- */
const Cloud: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    {[
      [60, 0, 180, 30],
      [24, 30, 276, 30],
      [0, 60, 360, 90],
      [24, 150, 312, 24],
    ].map(([dx, dy, w, h], i) => (
      <rect key={i} x={x + dx} y={y + dy} width={w} height={h} fill={COL.panelDark} />
    ))}
    <polygon
      points={`${x + 60},${y + 30} ${x + 60},${y} ${x + 240},${y} ${x + 240},${y + 30} ${x + 300},${y + 30} ${x + 300},${y + 60} ${x + 360},${y + 60} ${x + 360},${y + 150} ${x + 336},${y + 150} ${x + 336},${y + 174} ${x + 24},${y + 174} ${x + 24},${y + 150} ${x},${y + 150} ${x},${y + 60} ${x + 24},${y + 60} ${x + 24},${y + 30}`}
      fill="none"
      stroke={INK}
      strokeWidth={3}
    />
  </g>
);

const Packet: React.FC<{x: number; y: number; text: string; open?: boolean}> = ({x, y, text, open}) => (
  <g>
    <Tag x={x} y={y} w={252} h={72} text={text} family={M} inv={!open} />
    <SpriteG map={open ? LOCK_OPEN : LOCK} x={x + 96} y={y - 66} s={6} accent={INK} />
  </g>
);

const Outsource: React.FC<{f: number}> = ({f}) => {
  const CLX = 1290;
  const CLY = 330;
  const go = quant(clamp01((f - 60) / 54), 12);
  const back = quant(clamp01((f - 168) / 54), 12);
  const computing = f >= 114 && f < 168;
  return (
    <g>
      {f >= 6 && <SpriteG map={ALICE} x={168} y={342} s={12} accent={INK} />}
      {on(f, 12) && (
        <Txt x={228} y={570} size={36}>
          你
        </Txt>
      )}
      {f >= 18 && <Cloud x={CLX} y={CLY} />}
      {on(f, 24) && (
        <Txt x={CLX + 180} y={CLY + 105} size={36}>
          {computing ? `计算 x² + 1${blink(f, 12, 6) ? ' …' : ''}` : '云服务器'}
        </Txt>
      )}
      {on(f, 36) && (
        <Txt x={CLX + 180} y={CLY + 222} size={24} color={COL.sub}>
          只见密文，看不到数据
        </Txt>
      )}
      {/* outbound */}
      {f >= 42 && f < 114 && <Packet x={Math.round((360 + go * 780) / 6) * 6} y={432} text={`Enc(${XV})`} />}
      {f >= 168 && f < 228 && <Packet x={Math.round((1140 - back * 780) / 6) * 6} y={432} text={`Enc(${FX})`} />}
      {f >= 228 && <Packet x={360} y={432} text={`f(x) = ${FX}`} open />}
      {on(f, 228) && (
        <Txt x={960} y={696} size={36}>
          {`数据全程加密，云端照样算出了 f(${XV}) = ${FX}`}
        </Txt>
      )}
    </g>
  );
};

/* ---------- noise bar ---------- */
const BX = 1704;
const BT = 300;
const BH = 504;
const LIM = 0.8;
const NoiseBar: React.FC<{n: number; f: number}> = ({n, f}) => {
  const h = Math.round((quant(n, 28) * BH) / 6) * 6;
  const hot = n > LIM - 0.1;
  return (
    <g>
      <Txt x={BX + 48} y={252} size={36}>
        噪声
      </Txt>
      <rect x={BX + 1.5} y={BT + 1.5} width={93} height={BH - 3} fill={COL.panel} stroke={INK} strokeWidth={3} />
      <rect x={BX + 6} y={BT + BH - h} width={84} height={Math.max(0, h - 6)} fill={hot && blink(f, 12, 6) ? COL.red : INK} />
      {new Array(9).fill(0).map((_, i) => (
        <rect key={i} x={BX - 36 + i * 18} y={BT + BH * (1 - LIM) - 3} width={12} height={6} fill={COL.red} />
      ))}
      <Txt x={BX - 12} y={BT + BH * (1 - LIM) - 30} size={24} anchor="end" color={COL.red}>
        解密上限
      </Txt>
    </g>
  );
};
const noiseAt = (f: number) => {
  const s = f - P2;
  if (f < P2) return 0.12;
  if (f < P3) return s < 30 ? 0.12 : s < 90 ? 0.2 : s < 150 ? 0.46 : 0.74;
  const t = f - P3;
  return t < 132 ? 0.74 : 0.16;
};

/* ---------- phase 2: homomorphic ops ---------- */
const Ops: React.FC<{f: number}> = ({f}) => {
  const s = f - P2;
  const rows = [
    {t: `Enc(${EA}) ⊞ Enc(${EB}) = Enc(${SUM})`, note: '加法：噪声只涨一点', at: 12},
    {t: `Enc(${EA}) ⊠ Enc(${EB}) = Enc(${PROD})`, note: '乘法：噪声涨很多', at: 72},
    {t: `Enc(${PROD}) ⊠ Enc(${EC}) = Enc(${PROD2})`, note: '', at: 132},
  ];
  return (
    <g>
      {rows.map((r, i) =>
        on(s, r.at) ? (
          <g key={i}>
            <Txt x={120} y={300 + i * 156} size={60} anchor="start" family={M}>
              {r.t}
            </Txt>
            {r.note && on(s, r.at + 18) && (
              <Txt x={120} y={360 + i * 156} size={24} anchor="start" color={COL.sub}>
                {r.note}
              </Txt>
            )}
          </g>
        ) : null,
      )}
      {on(s, 168) && (
        <Txt x={120} y={720} size={36} anchor="start" color={COL.red}>
          噪声逼近上限：再乘一次就解不开了 ✗
        </Txt>
      )}
    </g>
  );
};

/* ---------- phase 3: bootstrapping ---------- */
const Boot: React.FC<{f: number}> = ({f}) => {
  const s = f - P3;
  return (
    <g>
      {on(s, 0) && (
        <Txt x={120} y={288} size={48} anchor="start">
          自举 Bootstrapping · Gentry 2009
        </Txt>
      )}
      {on(s, 18) && <Tag x={120} y={420} w={336} h={84} text={`Enc(${PROD2})`} size={48} family={M} />}
      {on(s, 18) && (
        <Txt x={288} y={540} size={24} color={COL.red}>
          噪声将满
        </Txt>
      )}
      {s >= 36 && <Arrow pts={[[468, 462], [570, 462]]} t={clamp01((s - 36) / 12)} color={INK} w={6} glow={false} />}
      {on(s, 48) && <Tag x={588} y={390} w={600} h={144} text="同态地运行解密电路" size={36} inv />}
      {s >= 66 && <SpriteG map={KEY} x={762} y={606} s={6} accent={INK} />}
      {on(s, 66) && (
        <Txt x={852} y={624} size={36} anchor="start" family={M}>
          Enc(sk)
        </Txt>
      )}
      {s >= 66 && <Arrow pts={[[888, 588], [888, 546]]} t={clamp01((s - 72) / 9)} color={INK} w={6} glow={false} />}
      {s >= 108 && <Arrow pts={[[1200, 462], [1284, 462]]} t={clamp01((s - 108) / 12)} color={INK} w={6} glow={false} />}
      {on(s, 132) && <Tag x={1296} y={420} w={336} h={84} text={`Enc(${PROD2})`} size={48} family={M} inv />}
      {on(s, 132) && (
        <Txt x={1464} y={540} size={24} color={COL.sub}>
          同一个明文，噪声清零
        </Txt>
      )}
      {on(s, 168) && <Tag x={120} y={714} w={1512} h={84} text="噪声可以反复刷新 → 任意次计算：全同态加密" size={36} />}
    </g>
  );
};

export const ZkFhe: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {f < P2 && <Outsource f={f} />}
        {f >= P2 && f < P3 && <Ops f={f} />}
        {f >= P3 && <Boot f={f} />}
        {f >= P2 && <NoiseBar n={noiseAt(f)} f={f} />}
      </svg>
      <Caption title="全同态加密" en="FULLY HOMOMORPHIC ENCRYPTION" desc="在看不到的数据上计算；噪声增长 + 自举刷新" color={COL.zk} />
    </AbsoluteFill>
  );
};

export const ZkFheCues: Cue[] = [
  [6, 'whoosh'],
  [60, 'blip', 72],
  [114, 'tick'],
  [168, 'blip', 76],
  [228, 'chime'],
  [P2 + 12, 'blip', 72],
  [P2 + 72, 'blip', 76],
  [P2 + 132, 'blip', 79],
  [P2 + 168, 'error'],
  [P3, 'whoosh'],
  [P3 + 48, 'riser2'],
  [P3 + 132, 'bell', 84],
  [P3 + 168, 'chime'],
];
