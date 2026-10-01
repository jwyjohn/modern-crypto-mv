import {build} from 'esbuild';
await build({
  stdin: {
    contents: `import {TIMELINES} from './src/timeline';
      import fs from 'node:fs';
      for (const [v, file] of [['full', 'audio/timeline.json'], ['short', 'audio/timeline_short.json']]) {
        const {SHOTS, TOTAL, ACT_RANGES} = TIMELINES[v];
        fs.writeFileSync(file, JSON.stringify({variant: v, total: TOTAL, acts: ACT_RANGES, shots: SHOTS.map(s => ({id: s.id, start: s.start, end: s.end, mood: s.mood, act: s.act, tier: s.tier, cues: s.cues}))}, null, 1));
        console.log(v, 'shots', SHOTS.length, 'frames', TOTAL, 'sec', TOTAL / 60);
      }`,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'out/_timeline.mjs',
  loader: {'.tsx': 'tsx', '.ts': 'ts', '.json': 'json'},
  jsx: 'automatic',
  logLevel: 'error',
  banner: {js: "import {createRequire} from 'module'; const require = createRequire(import.meta.url);"},
});
await import(process.cwd() + '/out/_timeline.mjs?' + Date.now());
