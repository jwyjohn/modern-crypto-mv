import React, {createContext, useContext} from 'react';
import {blink, COL, FONT, PAL, PX, shade} from '../theme';
import {SPRITE_IMG} from './sprites_data';

/** which cast the film uses: 'ba' = Game Development Department pixel characters, 'classic' = original monochrome sprites */
export type Cast = 'ba' | 'classic';
export const CastCtx = createContext<Cast>('ba');
export const useCast = () => useContext(CastCtx);
/** native facing of each character image (measured from the face position inside the sprite) */
const NATIVE_FACING: Record<string, 'left' | 'right' | 'none'> = {momoi: 'left', midori: 'right', arisu: 'left', yuzu: 'none', yuuka: 'left'};
/** role convention: Alice (Momoi) faces right, Bob (Midori) faces left — the two parties face each other;
 *  everyone else faces the screen centre unless a scene asks otherwise */
const ROLE_FACING: Record<string, 'left' | 'right'> = {momoi: 'right', midori: 'left'};

/* ====================================================================== */
/* Window: NES/RPG style box — notched corners, solid border, hard shadow  */
/* ====================================================================== */

const notch = (c: number) =>
  `polygon(${c}px 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, ${c}px 100%, 0 calc(100% - ${c}px), 0 ${c}px)`;

export const PixelBox: React.FC<{
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  color?: string;
  fill?: string;
  border?: number;
  shadow?: number;
  pad?: string | number;
  style?: React.CSSProperties;
  inner?: React.CSSProperties;
  children?: React.ReactNode;
  opacity?: number;
}> = ({x, y, w, h, color = COL.text, fill = COL.panel, border = 3, shadow = 0, pad = '24px 30px', style, inner, children, opacity = 1}) => {
  const pos: React.CSSProperties = x !== undefined || y !== undefined ? {position: 'absolute', left: x, top: y} : {position: 'relative'};
  return (
    <div style={{...pos, width: w, height: h, opacity, ...style}}>
      {shadow > 0 && <div style={{position: 'absolute', left: shadow, top: shadow, right: -shadow, bottom: -shadow, background: COL.line, clipPath: notch(border)}} />}
      <div style={{position: 'relative', width: '100%', height: '100%', background: color, clipPath: notch(border), padding: border, boxSizing: 'border-box'}}>
        <div
          style={{
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            background: fill,
            clipPath: notch(border),
            padding: pad,
            color: COL.text,
            fontFamily: FONT.pixel,
            fontSize: 36,
            lineHeight: '48px',
            ...inner,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

/** same window, for use inside an <svg> */
export const PixelRect: React.FC<{x: number; y: number; w: number; h: number; color?: string; fill?: string; b?: number; shadow?: number; opacity?: number}> = ({
  x,
  y,
  w,
  h,
  color = COL.text,
  fill = COL.panel,
  b = 3,
  shadow = 0,
  opacity = 1,
}) => {
  const pts = (ox: number, oy: number, ww: number, hh: number, c: number) =>
    `${ox + c},${oy} ${ox + ww - c},${oy} ${ox + ww},${oy + c} ${ox + ww},${oy + hh - c} ${ox + ww - c},${oy + hh} ${ox + c},${oy + hh} ${ox},${oy + hh - c} ${ox},${oy + c}`;
  return (
    <g opacity={opacity}>
      {shadow > 0 && <polygon points={pts(x + shadow, y + shadow, w, h, b)} fill={COL.line} />}
      <polygon points={pts(x, y, w, h, b)} fill={color} />
      <polygon points={pts(x + b, y + b, w - 2 * b, h - 2 * b, b)} fill={fill} />
    </g>
  );
};

/* ====================================================================== */
/* Block cursor █ (never a thin bar)                                        */
/* ====================================================================== */

export const BlockCursor: React.FC<{f: number; color?: string; size?: number; on?: boolean}> = ({f, color = COL.text, size = 36, on}) => (
  <span
    style={{
      display: 'inline-block',
      width: size * 0.55,
      height: size * 0.9,
      marginLeft: size * 0.08,
      verticalAlign: '-0.1em',
      background: color,
      opacity: on ?? blink(f, 30, 16) ? 1 : 0,
    }}
  />
);

/** SVG block cursor at (x, baseline-ish y) */
export const BlockCursorG: React.FC<{x: number; y: number; f: number; color?: string; size?: number}> = ({x, y, f, color = COL.text, size = 36}) =>
  blink(f, 30, 16) ? <rect x={x} y={y - size * 0.45} width={size * 0.55} height={size * 0.9} fill={color} /> : null;

/* ====================================================================== */
/* Sprites: string maps → crisp rects                                      */
/* ====================================================================== */

export type SpriteMap = string[];

const BASE: Record<string, string> = {
  k: PAL.black,
  w: PAL.white,
  s: PAL.peach,
  r: PAL.red,
  o: PAL.orange,
  y: PAL.yellow,
  g: PAL.green,
  f: PAL.forest,
  b: PAL.blue,
  n: PAL.navy,
  p: PAL.plum,
  l: PAL.lavender,
  i: PAL.pink,
  e: PAL.silver,
  d: PAL.slate,
  u: PAL.brown,
};

/** sprite as SVG group. `A`/`a` in the map = accent colour / its shade */
export const SpriteG: React.FC<{
  map: SpriteMap;
  x: number;
  y: number;
  s?: number;
  accent?: string;
  flip?: boolean;
  colors?: Record<string, string>;
  opacity?: number;
  /** character sprites: which way to face (default: toward the screen centre) */
  face?: 'left' | 'right';
  /** absolute screen x of this sprite when x is local (used for the default facing) */
  screenX?: number;
}> = ({map, x, y, s = PX, accent = PAL.red, flip = false, colors, opacity = 1, face, screenX}) => {
  const cast = useCast();
  const img = (map as SpriteMap & {img?: string}).img;
  if (cast === 'ba' && img && SPRITE_IMG[img]) {
    // character sprite: the reference pixel art itself, fitted to the 10×14-cell footprint, bottom-aligned,
    // mirrored so it faces toward the screen centre (or the requested side)
    const sp = SPRITE_IMG[img];
    const hh = 14 * s;
    const ww = (hh * sp.w) / sp.h;
    const cx = x + 5 * s;
    const want = face ?? ROLE_FACING[img] ?? ((screenX ?? x) + 5 * s < 960 ? 'right' : 'left');
    const nat = NATIVE_FACING[img] ?? 'none';
    const mirror = nat !== 'none' && nat !== want;
    return (
      <g transform={mirror ? `translate(${2 * cx},0) scale(-1,1)` : undefined} opacity={opacity}>
        <image href={sp.uri} x={cx - ww / 2} y={y} width={ww} height={hh} preserveAspectRatio="none" style={{imageRendering: 'pixelated'}} />
      </g>
    );
  }
  const pal: Record<string, string> = {...BASE, A: accent, a: shade(accent), ...colors};
  const w = map[0].length;
  const rects: React.ReactNode[] = [];
  map.forEach((row, j) => {
    let i = 0;
    while (i < row.length) {
      const ch = row[i];
      if (ch === '.' || ch === ' ') {
        i++;
        continue;
      }
      let k = i;
      while (k < row.length && row[k] === ch) k++;
      const xx = flip ? w - k : i;
      rects.push(<rect key={`${j}-${i}`} x={x + xx * s} y={y + j * s} width={(k - i) * s} height={s} fill={pal[ch] ?? ch} />);
      i = k;
    }
  });
  return <g opacity={opacity}>{rects}</g>;
};

/** sprite as a standalone absolutely-positioned element */
/** Yuzu, available for extra roles */
export const YUZU: SpriteMap = Object.assign(['..........'], {img: 'yuzu'});

export const Sprite: React.FC<{map: SpriteMap; x: number; y: number; s?: number; accent?: string; flip?: boolean; colors?: Record<string, string>; opacity?: number; face?: 'left' | 'right'; screenX?: number}> = (p) => {
  const s = p.s ?? PX;
  const w = p.map[0].length * s;
  const h = p.map.length * s;
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: p.x, top: p.y, overflow: 'visible', opacity: p.opacity ?? 1}}>
      <SpriteG {...p} x={0} y={0} opacity={1} screenX={p.screenX ?? p.x} />
    </svg>
  );
};

/** 10×14 characters. A = shirt colour */
export const ALICE: SpriteMap = Object.assign([
  '...uuuu...',
  '..uuuuuu..',
  '.uussssuu.',
  '.usksskus.',
  '.usssssu..',
  '.uussssu..',
  '..AAAAAA..',
  '.AAAAAAAA.',
  '.sAAAAAAs.',
  '.sAAAAAAs.',
  '..aaaaaa..',
  '..ss..ss..',
  '..ss..ss..',
  '.kkk..kkk.',
], {img: 'momoi'});
export const BOB: SpriteMap = Object.assign([
  '...kkkk...',
  '..kkkkkk..',
  '..kssssk..',
  '..skssks..',
  '..ssssss..',
  '...ssss...',
  '..AAAAAA..',
  '.AAAAAAAA.',
  '.sAAAAAAs.',
  '.sAAAAAAs.',
  '..nnnnnn..',
  '..nn..nn..',
  '..nn..nn..',
  '.kkk..kkk.',
], {img: 'midori'});
export const EVE: SpriteMap = Object.assign([
  '...dddd...',
  '..dddddd..',
  '.ddkkkkdd.',
  '.dkrkkrkd.',
  '.ddkkkkdd.',
  '..dddddd..',
  '.dddddddd.',
  'dddddddddd',
  'dlddddddld',
  'dlddddddld',
  '.dddddddd.',
  '.dddddddd.',
  '..dd..dd..',
  '.kkk..kkk.',
], {img: 'yuuka'});
/** generic NPC (researchers, examiners…) — A = robe colour */
export const SAGE: SpriteMap = Object.assign([
  '...eeee...',
  '..eeeeee..',
  '..esssse..',
  '..skssks..',
  '..ssssss..',
  '..eeeeee..',
  '..AAAAAA..',
  '.AAAAAAAA.',
  '.sAAAAAAs.',
  '.AAAAAAAA.',
  '.AAAAAAAA.',
  '.AAAAAAAA.',
  '..AA..AA..',
  '.kkk..kkk.',
], {img: 'arisu'});
export const KEY: SpriteMap = [
  '.yyyy.......',
  'yokkoy......',
  'yk..kyyyyyyy',
  'yk..ky..o.o.',
  'yokkoy..o.o.',
  '.yyyy.......',
];
export const LOCK: SpriteMap = [
  '...eeee...',
  '..ekkkke..',
  '..ek..ke..',
  '..ek..ke..',
  '.AAAAAAAA.',
  '.AaaaaaaA.',
  '.Aa.kk.aA.',
  '.Aa.kk.aA.',
  '.Aaa.kaaA.',
  '.AAAAAAAA.',
];
export const LOCK_OPEN: SpriteMap = [
  '......eeee',
  '.....ekkke',
  '.....ek..e',
  '.........e',
  '.AAAAAAAA.',
  '.AaaaaaaA.',
  '.Aa.kk.aA.',
  '.Aa.kk.aA.',
  '.Aaa.kaaA.',
  '.AAAAAAAA.',
];
export const COIN: SpriteMap = ['..yyyy..', '.yowwoy.', 'yoywyooy', 'yoywyooy', 'yoywyooy', 'yoyyyooy', '.yooooy.', '..yyyy..'];
export const HEART: SpriteMap = ['.rr.rr.', 'rwrrrrr', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'];
export const HEART_EMPTY: SpriteMap = ['.dd.dd.', 'd..d..d', 'd.....d', 'd.....d', '.d...d.', '..d.d..', '...d...'];
export const SCROLL: SpriteMap = ['.ueeeeeeu.', 'ueewwwwweu', '.ewkkkkwe.', '.ewwwwwwe.', '.ewkkkwwe.', '.ewwwwwwe.', '.ewkkkkwe.', 'ueewwwwweu', '.ueeeeeeu.'];
export const FLAG: SpriteMap = ['eAAAAA', 'eAAAAAA', 'eAAAAA.', 'eAA....', 'e......', 'e......', 'e......', 'e......', 'kkk....'];
export const STAR: SpriteMap = ['...y...', '...y...', '..yyy..', 'yyywyyy', '.yyyyy.', '.yy.yy.', 'y.....y'];
export const CHEST: SpriteMap = ['.uuuuuuuu.', 'uoooooooou', 'uuuuyyuuuu', 'uoooykooou', 'uoooooooou', 'uuuuuuuuuu'];
/** boss monster (an "attack"). A = body colour */
export const BOSS: SpriteMap = [
  '....AAAAAAAA....',
  '..AAAAAAAAAAAA..',
  '.AAAAAAAAAAAAAA.',
  'AAAwwwAAAAwwwAAA',
  'AAwwkkwAAwkkwwAA',
  'AAwwkkwAAwkkwwAA',
  'AAAwwwAAAAwwwAAA',
  'AAAAAAAAAAAAAAAA',
  'AAAkAkAkAkAkAkAA',
  'AAAkkkkkkkkkkkAA',
  'AAAAwAwAwAwAwAAA',
  'AAAAAAAAAAAAAAAA',
  'aAAAAAAAAAAAAAAa',
  'aaAAaaAAAaaAAaaa'.slice(0, 16),
  'a.aa..aaa..aa..a',
];

/* ====================================================================== */
/* Bars, dither, misc                                                      */
/* ====================================================================== */

/** segmented HP / progress bar */
export const SegBar: React.FC<{value: number; n?: number; w: number; h?: number; color?: string; back?: string}> = ({value, n = 20, w, h = 24, color = COL.text, back = COL.line}) => {
  const seg = w / n;
  const on = Math.round(Math.max(0, Math.min(1, value)) * n);
  return (
    <div style={{display: 'flex', width: w, height: h, gap: 0}}>
      {new Array(n).fill(0).map((_, i) => (
        <div key={i} style={{width: seg - 3, marginRight: 3, height: h, background: i < on ? color : back}} />
      ))}
    </div>
  );
};

/** ordered-dither (4×4 Bayer) cover. level 0 = transparent, 1 = solid. cell = pixel size */
export const DitherFill: React.FC<{level: number; color?: string; cell?: number; id: string; w?: number; h?: number; x?: number; y?: number}> = ({
  level,
  color = COL.text,
  cell = PX,
  id,
  w = 1920,
  h = 1080,
  x = 0,
  y = 0,
}) => {
  const L = Math.round(Math.max(0, Math.min(1, level)) * 16);
  if (L <= 0) return null;
  if (L >= 16) return <rect x={x} y={y} width={w} height={h} fill={color} />;
  const ORDER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  return (
    <>
      <defs>
        <pattern id={id} width={cell * 4} height={cell * 4} patternUnits="userSpaceOnUse">
          {ORDER.map((v, k) => (v < L ? <rect key={k} x={(k % 4) * cell} y={Math.floor(k / 4) * cell} width={cell} height={cell} fill={color} /> : null))}
        </pattern>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id})`} />
    </>
  );
};

/** text with a hard pixel drop shadow */
export const PText: React.FC<{children: React.ReactNode; size?: number; color?: string; font?: string; shadow?: number; style?: React.CSSProperties}> = ({
  children,
  size = 36,
  color = COL.text,
  font = FONT.pixel,
  shadow,
  style,
}) => {
  const d = shadow ?? 0;
  return <span style={{fontFamily: font, fontSize: size, color, textShadow: d ? `${d}px ${d}px 0 ${COL.line}` : undefined, lineHeight: 1.25, ...style}}>{children}</span>;
};
