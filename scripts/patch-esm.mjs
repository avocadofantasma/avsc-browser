/**
 * Post-build script: prepends named re-exports to dist/index.mjs so consumers
 * can use both `import avro from 'avrocado'` and `import { Type } from 'avrocado'`.
 */
import { readFileSync, writeFileSync } from 'fs';

const path = new URL('../dist/index.mjs', import.meta.url).pathname;
const src = readFileSync(path, 'utf8');

const namedExports = [
  'Type', 'Service', 'parse', 'streams', 'avroTypes',
  'assembleProtocol', 'readProtocol', 'readSchema',
  'discoverProtocol', 'createBlobDecoder', 'createBlobEncoder',
];

const patch = [
  '',
  '// Named exports',
  'var _mod = require_index_esm();',
  ...namedExports.map(n => `export var ${n} = _mod.${n};`),
  'export default _mod;',
  '',
].join('\n');

// Remove the existing `export default require_index_esm();` line and append ours
const patched = src.replace(/^export default require_index_esm\(\);?$/m, '') + patch;
writeFileSync(path, patched, 'utf8');
console.log('ESM named exports patched into dist/index.mjs');
