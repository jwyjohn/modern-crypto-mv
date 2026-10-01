// usage: node scripts/at.mjs [short] id:sceneFrame [id:sceneFrame ...] [globalFrame ...]
// prints the real global frame for each token (scene frames are warped by the pacing system)
import {build} from 'esbuild';
const args = process.argv.slice(2);
const variant = args[0] === 'short' ? 'short' : 'full';
const toks = variant === 'short' ? args.slice(1) : args;
await build({
  stdin: {
    contents: `import {sceneFrame} from './src/timeline';
      const out = ${JSON.stringify(toks)}.map((t) => { const [id, sf] = t.split(':'); return sf === undefined ? Number(id) : sceneFrame(id, Number(sf), '${variant}'); });
      console.log(out.join(' '));`,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'out/_at.mjs',
  loader: {'.tsx': 'tsx', '.ts': 'ts', '.json': 'json'},
  jsx: 'automatic',
  logLevel: 'error',
  banner: {js: "import {createRequire} from 'module'; const require = createRequire(import.meta.url);"},
});
await import(process.cwd() + '/out/_at.mjs?' + Date.now());
