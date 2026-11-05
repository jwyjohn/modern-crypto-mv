import React, {useEffect, useRef, useState} from 'react';
import {Player, type PlayerRef} from '@remotion/player';
import {Main} from '../src/Main';
import {ACT_RANGES, TOTAL} from '../src/timeline';
import type {Cast} from '../src/components/pixel';

const LABEL: Record<string, string> = {intro: '片头', hw: 'I 一张卡', llm: 'II 一个模型', run: 'III 先跑对', go: 'IV 脱掉外壳', ds: 'V 猜', fin: '尾声'};

const FPS = 60;
const BASE = import.meta.env.BASE_URL;

const FONTS: [string, string][] = [
  ['Fusion Pixel', 'fonts/FusionPixel.woff2'],
  ['Fusion Pixel Mono', 'fonts/FusionPixelMono.woff2'],
  ['Press Start 2P', 'fonts/PressStart2P.ttf'],
  ['Crypto Pixel', 'fonts/CryptoPixel.ttf'],
];

const fmt = (frame: number) => {
  const s = Math.floor(frame / FPS);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

const App: React.FC = () => {
  const ref = useRef<PlayerRef>(null);
  const [frame, setFrame] = useState(0);
  const [cast, setCast] = useState<Cast>('ba');

  // 字体异步加载，不阻塞首屏；没下完先用系统字体顶
  useEffect(() => {
    let dead = false;
    FONTS.forEach(([family, file]) => {
      new FontFace(family, `url('${BASE}${file}')`)
        .load()
        .then((ff) => {
          if (!dead) document.fonts.add(ff);
        })
        .catch(() => {});
    });
    return () => {
      dead = true;
    };
  }, []);

  return (
    <div style={{maxWidth: 1280, margin: '0 auto', padding: '24px 16px 64px'}}>
      <h1 style={{fontSize: 22, margin: '8px 0 4px'}}>榨干一张 MI50 · 网页实时渲染版</h1>
      <p style={{color: '#4a4a47', margin: '0 0 16px', fontSize: 14}}>
        共 {TOTAL} 帧 / {fmt(TOTAL)}（60fps），浏览器实时播，不用导出 mp4。音频为压缩流播版（mp3，边下边播）。
      </p>
      <div style={{display: 'flex', gap: 8, marginBottom: 12}}>
        {(['ba', 'classic'] as Cast[]).map((c) => (
          <button
            key={c}
            onClick={() => setCast(c)}
            style={{background: cast === c ? '#141414' : '#f6f6f2', color: cast === c ? '#f6f6f2' : '#141414', border: '3px solid #141414', padding: '8px 14px', cursor: 'pointer', fontSize: 14}}
          >
            {c === 'ba' ? '游戏开发部人物' : '原版人物'}
          </button>
        ))}
      </div>
      <div style={{overflow: 'hidden', border: '3px solid #141414'}}>
        <Player
          key="film"
          ref={ref}
          component={Main}
          inputProps={{cast, musicSrc: `${BASE}music.mp3`}}
          durationInFrames={TOTAL}
          fps={FPS}
          compositionWidth={1920}
          compositionHeight={1080}
          controls
          loop
          clickToPlay
          acknowledgeRemotionLicense
          style={{width: '100%'}}
          onFrameUpdate={setFrame}
        />
      </div>
      <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16}}>
        {ACT_RANGES.map((a) => (
          <button
            key={a.key}
            onClick={() => ref.current?.seekTo(a.s)}
            style={{
              background: '#f6f6f2',
              color: '#141414',
              border: '3px solid #141414',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {LABEL[a.key] ?? a.key} · {fmt(a.s)}
          </button>
        ))}
      </div>
      <p style={{color: '#8c8c88', fontSize: 12, marginTop: 16}}>当前帧：{frame}（{fmt(frame)}）· 章节跳转按各 Act 起始帧 seek</p>
    </div>
  );
};

export default App;
