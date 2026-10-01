import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ALICE, DitherFill, LOCK, SAGE, SpriteG} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Caption, Pt} from '../components/ui';
import {FONT, prog, PX} from '../theme';
import {Cells, ENV, K, Person, pixLine, showAt, stepAlong, sup, T, Tag} from './pk_common';

const CLX = 360;
const SVX = 1560;
const LIFE0 = 300;
const LIFE1 = 828;

type Msg = {y: number; at: number; dir: 1 | -1; dur: number};
const M1: Msg = {y: 330, at: 30, dir: 1, dur: 42};
const M2: Msg = {y: 408, at: 100, dir: -1, dur: 42};
const MB: Msg = {y: 660, at: 220, dir: -1, dur: 54};
const M5: Msg = {y: 726, at: 330, dir: 1, dur: 42};
const M6: Msg = {y: 798, at: 400, dir: 1, dur: 36};
const T_HKDF = 160;
const T_FS = 520;

const arrowPts = (m: Msg): [Pt, Pt] => (m.dir === 1 ? [[CLX + 12, m.y], [SVX - 12, m.y]] : [[SVX - 12, m.y], [CLX + 12, m.y]]);

const MsgArrow: React.FC<{m: Msg; f: number; packet?: boolean}> = ({m, f, packet = true}) => {
  if (f < m.at) return null;
  const [a, b] = arrowPts(m);
  const t = prog(f, m.at, m.dur);
  const cells = pixLine(a, b);
  const n = Math.floor(cells.length * Math.round(t * 12) / 12);
  const pos = stepAlong([a, b], t, 12);
  const hx = b[0];
  return (
    <g>
      <Cells cells={cells} color={K.ink} n={n} size={3} />
      <Cells cells={cells.map(([x, y]): Pt => [x, y + 3])} color={K.ink} n={n} size={3} />
      {t >= 1 && <polygon points={`${hx},${m.y + 3} ${hx - m.dir * 24},${m.y - 12} ${hx - m.dir * 24},${m.y + 18}`} fill={K.ink} />}
      {packet && t > 0 && t < 1 && <SpriteG map={ENV} x={pos[0] - 36} y={pos[1] - 21} s={6} accent={K.ink} />}
    </g>
  );
};

export const PkTls: React.FC = () => {
  const f = useF();
  const fs = f >= T_FS;
  // application data keeps flowing both ways
  const lf = f - M6.at - M6.dur;
  const loop = lf >= 0 ? (lf % 60) / 60 : -1;
  const fwd = lf >= 0 && Math.floor(lf / 60) % 2 === 0;
  const appA = stepAlong(
    [
      [CLX + 12, M6.y],
      [SVX - 12, M6.y],
    ],
    loop,
    12,
  );
  const appB = stepAlong(
    [
      [SVX - 12, M6.y],
      [CLX + 12, M6.y],
    ],
    loop,
    12,
  );
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute'}} shapeRendering="crispEdges">
        {/* parties */}
        {showAt(f, 0) && <Person map={ALICE} x={CLX - 30} y={168} s={6} name="CLIENT" />}
        {showAt(f, 6) && <Person map={SAGE} x={SVX - 30} y={168} s={6} name="SERVER" />}
        {f >= 12 && (
          <>
            <rect x={CLX - 1} y={LIFE0} width={3} height={LIFE1 - LIFE0} fill={K.line} />
            <rect x={SVX - 1} y={LIFE0} width={3} height={LIFE1 - LIFE0} fill={K.line} />
          </>
        )}
        <MsgArrow m={M1} f={f} />
        <MsgArrow m={M2} f={f} />
        {/* encrypted flight from server */}
        {f >= MB.at && (
          <g>
            <rect x={CLX + 66} y={462} width={SVX - CLX - 132} height={174} fill={K.panel} stroke={K.ink} strokeWidth={6} />
            <SpriteG map={LOCK} x={CLX + 84} y={474} s={6} accent={K.ink} />
          </g>
        )}
        <MsgArrow m={MB} f={f} />
        <MsgArrow m={M5} f={f} />
        <MsgArrow m={M6} f={f} packet={false} />
        {loop >= 0 && (
          <>
            {fwd && <SpriteG map={ENV} x={appA[0] - 36} y={appA[1] + 12} s={6} accent={K.ink} />}
            {!fwd && <SpriteG map={ENV} x={appB[0] - 36} y={appB[1] + 12} s={6} accent={K.ink} />}
          </>
        )}
        {/* forward secrecy: ephemeral keys destroyed */}
        {fs && (
          <>
            <DitherFill id="tls-fs-a" level={Math.min(1, (f - T_FS) / 48)} color={K.bg} cell={PX} x={96} y={312} w={234} h={42} />
            <DitherFill id="tls-fs-b" level={Math.min(1, (f - T_FS) / 48)} color={K.bg} cell={PX} x={1590} y={390} w={234} h={42} />
          </>
        )}
      </svg>

      {/* title line */}
      <T f={f} at={10} out={T_FS} x={960} w={720} align="center" y={192} size={36} color={K.sub}>
        1-RTT：一个来回完成握手
      </T>
      <T f={f} at={T_FS + 30} x={960} w={900} align="center" y={186}>
        <Tag size={36}>前向安全：临时私钥用后即焚</Tag>
      </T>

      {/* ephemeral keys */}
      <T f={f} at={M1.at - 12} out={T_FS + 48} x={96} y={312} size={24} font={FONT.pixelMono}>
        临时私钥 a
      </T>
      <T f={f} at={M2.at - 12} out={T_FS + 48} x={1596} y={390} size={24} font={FONT.pixelMono}>
        临时私钥 b
      </T>
      <T f={f} at={T_FS + 54} x={96} y={312} size={24} color={K.red}>
        ✗ a 已销毁
      </T>
      <T f={f} at={T_FS + 54} x={1596} y={390} size={24} color={K.red}>
        ✗ b 已销毁
      </T>

      {/* message labels */}
      <T f={f} at={M1.at} x={960} w={1080} align="center" y={M1.y - 54} size={36}>
        ClientHello + key_share(g{sup('a')}) <Tag>ECDHE · 公钥</Tag>
      </T>
      <T f={f} at={M2.at} x={960} w={1080} align="center" y={M2.y - 54} size={36}>
        ServerHello + key_share(g{sup('b')}) <Tag>ECDHE · 公钥</Tag>
      </T>
      {/* HKDF on both sides */}
      <T f={f} at={T_HKDF} x={96} y={378} size={24} font={FONT.pixelMono}>
        HKDF(g{sup('ab')})
      </T>
      <T f={f} at={T_HKDF + 6} x={96} y={414} size={24} color={K.sub}>
        → 会话密钥
      </T>
      <T f={f} at={T_HKDF} x={1596} y={456} size={24} font={FONT.pixelMono}>
        HKDF(g{sup('ab')})
      </T>
      <T f={f} at={T_HKDF + 6} x={1596} y={492} size={24} color={K.sub}>
        → 会话密钥
      </T>
      {/* encrypted flight */}
      {[
        {t: '{EncryptedExtensions}', tag: ''},
        {t: '{Certificate}', tag: '身份证书'},
        {t: '{CertificateVerify}', tag: '数字签名'},
        {t: '{Finished}', tag: 'MAC · HKDF'},
      ].map((l, i) => (
        <T key={i} f={f} at={MB.at + 12 + i * 14} x={CLX + 168} y={474 + i * 39} size={24} font={FONT.pixelMono}>
          {l.t}
          {l.tag && <span style={{marginLeft: 24, color: K.sub, fontFamily: FONT.pixel}}>{l.tag}</span>}
        </T>
      ))}
      <T f={f} at={MB.at + 12} x={SVX - 96} w={240} align="right" y={474} size={24}>
        <Tag>AEAD · 对称</Tag>
      </T>
      <T f={f} at={M5.at} x={960} w={1080} align="center" y={M5.y - 54} size={36}>
        {'{Finished}'}
      </T>
      <T f={f} at={M6.at} x={960} w={1080} align="center" y={M6.y - 54} size={36}>
        [Application Data] <Tag>AEAD 加密</Tag>
      </T>
      <Caption title="TLS 1.3 握手" en="HANDSHAKE" desc="ECDHE 协商密钥 · 签名认证身份 · AEAD 加密数据" color={K.act} />
    </AbsoluteFill>
  );
};

export const PkTlsCues: Cue[] = [
  [0, 'blip', 72],
  [M1.at, 'whoosh'],
  [M2.at, 'whoosh'],
  [T_HKDF, 'chime'],
  [MB.at, 'whoosh'],
  [MB.at + 40, 'type'],
  [MB.at + MB.dur, 'tick'],
  [M5.at, 'whoosh'],
  [M6.at, 'bell', 76],
  [T_FS, 'riser2'],
  [T_FS + 54, 'error'],
  [T_FS + 84, 'chime'],
];
