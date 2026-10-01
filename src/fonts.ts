import {continueRender, delayRender, staticFile} from 'remotion';

export const FONT_FILES: [string, string][] = [
  ['Fusion Pixel', 'FusionPixel.woff2'],
  ['Fusion Pixel Mono', 'FusionPixelMono.woff2'],
  ['Press Start 2P', 'PressStart2P.ttf'],
  ['Crypto Pixel', 'CryptoPixel.ttf'],
];

let started = false;

export const ensureFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const handle = delayRender('Loading fonts', {timeoutInMilliseconds: 180000});
  Promise.all(
    FONT_FILES.map(([family, file]) =>
      new FontFace(family, `url('${staticFile('fonts/' + file)}')`)
        .load()
        .then((ff) => {
          document.fonts.add(ff);
        }),
    ),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
};
