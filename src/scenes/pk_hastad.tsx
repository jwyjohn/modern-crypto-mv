import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ALICE, BOB, EVE, LOCK_OPEN, SpriteG} from '../components/pixel';
import {Cue, Problem, probCues} from '../components/Problem';
import {Pt} from '../components/ui';
import {FONT, prog} from '../theme';
import {Cells, ENV, K, Person, pixLine, showAt, stepAlong, sub, sup, T, Tag} from './pk_common';
import {crt, modpow} from './pk_math';

/* ---------------- numbers (computed) ---------------- */
const E = 3;
const NS = [55, 46, 493];
const MSG = 13;
const CS = NS.map((n) => modpow(MSG, E, n)); // 52, 35, 225
const CR = crt(CS, NS); // M = 1247290, x = 2197
const X = CR.x;
const ROOT = Math.round(Math.cbrt(X)); // 13
const ROOT_OK = ROOT ** 3 === X && ROOT === MSG && NS.every((n) => n < X) && X < CR.M;

const SPEC = {
  card: 330,
  reveal: 900,
  steps: [
    {at: 0, label: '三份密文'},
    {at: 220, label: 'CRT 合并'},
    {at: 560, label: '没有回绕'},
    {at: 760, label: '开立方'},
  ],
};

export const PkHastad: React.FC = () => (
  <Problem
    no={5}
    color={K.act}
    tag="公钥密码 · RSA 攻击"
    title="Håstad 广播攻击"
    q={[
      ['1985 年，Håstad 指出：同一条明文用小指数 ', {t: `e = ${E}`, m: true}, ' 发给多个人、又不加随机填充，就会出事。'],
      ['Alice 把同一个 m 分别加密给三个人，模数 ', {t: `N = ${NS.join(', ')}`, m: true}, '，Eve 截获了 ', {t: `c = ${CS.join(', ')}`, m: true}, '。'],
    ]}
    answerText={`CRT 合成 ${X} = ${ROOT}³，m = ${ROOT}${ROOT_OK ? '' : ' (?)'}`}
    brief={`e = ${E} · N = ${NS.join(', ')} · c = ${CS.join(', ')}`}
    insight="m³ < N₁N₂N₃ 时，CRT 直接还原 m³——小指数 + 无随机填充的教科书 RSA 不堪一击"
    {...SPEC}
  >
    {(sf) => <HastadStage sf={sf} />}
  </Problem>
);

const S2 = SPEC.steps[1].at;
const S3 = SPEC.steps[2].at;
const S4 = SPEC.steps[3].at;
const ROWS = [264, 420, 576];
const AL: Pt = [156, 420];
const RX = 420;
const BAR0 = 1176;
const BSCALE = 0.27; // px per unit

const HastadStage: React.FC<{sf: number}> = ({sf}) => {
  const step = sf < S2 ? 0 : sf < S3 ? 1 : sf < S4 ? 2 : 3;
  const fly = (i: number) => prog(sf, 20 + i * 24, 40);
  const congr = (i: number) => sf >= 140 + i * 12;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute'}} shapeRendering="crispEdges">
        {/* Alice + three recipients */}
        {showAt(sf, 0) && <Person map={ALICE} x={96} y={AL[1] - 84} s={12} />}
        {NS.map((_, i) => {
          const to: Pt = [RX, ROWS[i] + 42];
          const path: Pt[] = [
            [AL[0] + 72, AL[1]],
            [to[0] - 48, to[1]],
          ];
          const t = fly(i);
          const pos = stepAlong(path, t, 12);
          return (
            <g key={i}>
              {sf >= 20 + i * 24 && <Cells cells={pixLine(path[0], path[1])} color={K.line} dash={3} />}
              {t > 0 && t < 1 && <SpriteG map={ENV} x={pos[0] - 36} y={pos[1] - 21} s={6} accent={K.ink} />}
              {showAt(sf, 6 + i * 6) && <SpriteG map={BOB} x={RX} y={ROWS[i]} s={6} accent={K.ink} />}
            </g>
          );
        })}
        {showAt(sf, 170) && <Person map={EVE} x={96} y={660} s={12} />}

        {/* step 3: bar chart on a linear scale */}
        {step === 2 &&
          [...NS, X].map((v, i) => {
            const w = Math.max(6, Math.round((v * BSCALE * Math.min(1, Math.max(0, (sf - S3 - 30 - i * 18) / 24))) / 6) * 6);
            if (sf < S3 + 30 + i * 18) return null;
            return <rect key={i} x={BAR0} y={354 + i * 66} width={w} height={36} fill={i === 3 ? K.inv : K.panel2} stroke={K.ink} strokeWidth={3} />;
          })}
        {step === 3 && showAt(sf, S4 + 80) && <SpriteG map={LOCK_OPEN} x={1500} y={432} s={9} accent={K.ink} />}
      </svg>

      {/* left: what each recipient got → congruences */}
      {NS.map((n, i) => (
        <React.Fragment key={i}>
          {showAt(sf, 40 + i * 24) && !congr(i) && (
            <T x={516} y={ROWS[i] + 18} size={48} font={FONT.pixelMono}>
              c{sub(i + 1)} = {CS[i]}
              <span style={{fontSize: 24, color: K.sub}}>　(N{sub(i + 1)} = {n})</span>
            </T>
          )}
          {congr(i) && (
            <T x={516} y={ROWS[i] + 18} size={48} font={FONT.pixelMono}>
              x ≡ {CS[i]} (mod {n})
            </T>
          )}
        </React.Fragment>
      ))}
      <T f={sf} at={176} x={240} y={732} size={24} color={K.sub}>
        Eve 收齐三份：设 x = m³
      </T>

      {/* right: CRT */}
      {step === 1 && (
        <>
          <T f={sf} at={S2} x={1032} y={264} size={36} font={FONT.pixelMono}>
            M = {NS.join(' × ')} = {CR.M}
          </T>
          {CR.rows.map((r, i) => (
            <T key={i} f={sf} at={S2 + 50 + i * 40} x={1032} y={348 + i * 72} size={36} font={FONT.pixelMono}>
              M{sub(i + 1)} = {r.Mi} ≡ {r.r}　y{sub(i + 1)} = {r.y}
            </T>
          ))}
          <T f={sf} at={S2 + 190} x={1032} y={576} size={24} color={K.sub}>
            yᵢ = Mᵢ⁻¹ mod Nᵢ　（Nᵢ 两两互素）
          </T>
          <T f={sf} at={S2 + 240} x={1032} y={648} size={36} font={FONT.pixelMono}>
            x = ∑ cᵢMᵢyᵢ mod M = <Tag size={48}>{X}</Tag>
          </T>
        </>
      )}
      {step === 2 && (
        <>
          <T f={sf} at={S3} x={1032} y={264} size={36} font={FONT.pixelMono}>
            x = <Tag size={36}>{X}</Tag> 是真正的 m³ 吗？
          </T>
          {[...NS.map((n, i) => `N${sub(i + 1)} = ${n}`), `m³ = ${X}`].map((l, i) => (
            <T key={i} f={sf} at={S3 + 30 + i * 18} x={1032} y={348 + i * 66} size={24} font={FONT.pixelMono} color={i === 3 ? K.ink : K.sub}>
              {l}
            </T>
          ))}
          <T f={sf} at={S3 + 130} x={1032} y={624} size={24} color={K.sub}>
            每个 Nᵢ &lt; m³：单看一份密文，m³ 早已被模掉
          </T>
          <T f={sf} at={S3 + 160} x={1032} y={684} size={24} color={K.ink}>
            但 m³ &lt; M = {CR.M}：合起来没有回绕，x 就是 m³
          </T>
        </>
      )}
      {step === 3 && (
        <>
          <T f={sf} at={S4} x={1032} y={264} size={48} font={FONT.pixelMono}>
            {X} = {ROOT} × {ROOT} × {ROOT}
          </T>
          <T f={sf} at={S4 + 50} x={1032} y={384} size={72} font={FONT.pixelMono}>
            m = <Tag size={72}>{ROOT}</Tag>
          </T>
          {NS.map((n, i) => (
            <T key={i} f={sf} at={S4 + 90 + i * 16} x={1032} y={552 + i * 60} size={24} font={FONT.pixelMono} color={K.sub}>
              {ROOT}
              {sup(E)} mod {n} = {modpow(ROOT, E, n)} {modpow(ROOT, E, n) === CS[i] ? '✓' : '✗'}
            </T>
          ))}
        </>
      )}
    </AbsoluteFill>
  );
};

export const PkHastadCues: Cue[] = probCues(SPEC, [
  [20, 'whoosh'],
  [44, 'whoosh'],
  [68, 'whoosh'],
  [140, 'type'],
  [176, 'error'],
  [S2 + 50, 'tick'],
  [S2 + 90, 'tick'],
  [S2 + 130, 'tick'],
  [S2 + 240, 'bell', 76],
  [S3 + 30, 'blip', 70],
  [S3 + 84, 'blip', 79],
  [S4 + 50, 'chime'],
]);
