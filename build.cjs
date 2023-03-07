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
  external: ['vue', '@vue/composition-api'],
  minify: true
}).catch(() => process.exit(1))
