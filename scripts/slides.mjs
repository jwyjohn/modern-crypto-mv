// usage: node scripts/slides.mjs [--list] [--scale 2]   (2 = 3840×2160, the default)
// Picks one settled frame per shot (plus the extra pages listed below) and renders them as PNG
// into out/slides/. scripts/slides_pdf.py then packs them into out/MI50_MV_slides.pdf.
import {build} from 'esbuild';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const listOnly = args.includes('--list');
const scale = args.includes('--scale') ? Number(args[args.indexOf('--scale') + 1]) : 2;

/** extra pages, as [shot id, scene frame, label]; a shot's own page is its last settled frame */
const EXTRA = [
  ['intro', 684, '等待'],
  // the credits roll (19 entries): entries 0–7, 8–15, then the end of the roll (11–18)
  ['fin_credits', 548, '致谢 1'],
  ['fin_credits', 870, '致谢 2'],
  ['fin_credits', 1010, '致谢 3'],
];
/** shots whose last frame is not worth a page of its own */
const SKIP = new Set(['fin_credits']);

await build({
  stdin: {
    contents: `import {SHOTS, sceneFrame} from './src/timeline';
      export const shots = SHOTS.map((s) => ({id: s.id, start: s.start, end: s.end, mood: s.mood, pre: s.tin ? s.tin.pre : 15, cues: s.cues}));
      export {sceneFrame};`,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'out/_slides.mjs',
  loader: {'.tsx': 'tsx', '.ts': 'ts', '.json': 'json'},
  jsx: 'automatic',
  logLevel: 'error',
  banner: {js: "import {createRequire} from 'module'; const require = createRequire(import.meta.url);"},
});
const {shots, sceneFrame} = await import(process.cwd() + '/out/_slides.mjs?' + Date.now());

const pages = [];
shots.forEach((s, i) => {
  const next = shots[i + 1];
  // last frame before the next shot's transition starts to cover this one
  const last = next ? next.start - next.pre - 2 : s.end - 1;
  for (const [id, sf, label] of EXTRA) if (id === s.id) pages.push({id, frame: sceneFrame(id, sf), label});
  // a case page: its title card (narration) first, then the worked stage
  if (s.mood === 'problem') {
    const whoosh = s.cues.find((c) => c[1] === 'whoosh');
    if (whoosh) pages.push({id: s.id, frame: s.start + whoosh[0] - 4, label: '案例'});
  }
  if (!SKIP.has(s.id)) pages.push({id: s.id, frame: last, label: ''});
});

if (listOnly) {
  for (const [i, p] of pages.entries()) console.log(String(i + 1).padStart(2, '0'), p.id, p.frame, p.label);
  process.exit(0);
}

const dir = 'out/slides';
fs.rmSync(dir, {recursive: true, force: true});
fs.mkdirSync(dir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), onProgress: () => {}});
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
const composition = await selectComposition({serveUrl, id: 'MVInferencePreview', puppeteerInstance: browser});
for (const [i, p] of pages.entries()) {
  const output = `${dir}/${String(i + 1).padStart(2, '0')}-${p.id}.png`;
  await renderStill({composition, serveUrl, output, frame: p.frame, imageFormat: 'png', scale, puppeteerInstance: browser, overwrite: true});
  console.log(output, p.frame);
}
await browser.close({silent: true});
