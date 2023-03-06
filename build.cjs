const { build } = require('esbuild')

build({
  entryPoints: ['./src/index.js'],
  outfile: './dist/index.cjs',
  bundle: true,
  format: 'cjs',
  minify: true
}).catch(() => process.exit(1))

build({
  entryPoints: ['./src/index.js'],
  outfile: './dist/index.js',
  bundle: true,
  format: 'esm',
  minify: true
}).catch(() => process.exit(1))
