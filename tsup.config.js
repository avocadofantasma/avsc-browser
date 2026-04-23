import { defineConfig } from 'tsup';
import { copyFileSync } from 'fs';

export default defineConfig({
  entry: { index: 'src/index.esm.js' },
  format: ['esm', 'cjs'],
  outDir: 'dist',
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.cjs' };
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  platform: 'browser',
  noExternal: ['buffer', 'readable-stream', 'events'],
  cjsInterop: true,
  shims: true,
  onSuccess() {
    // Copy hand-written .d.ts — no codegen needed since source is plain JS
    copyFileSync('src/index.d.ts', 'dist/index.d.ts');
    console.log('Copied dist/index.d.ts');
  },
});
