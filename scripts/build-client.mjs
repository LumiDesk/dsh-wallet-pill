/**
 * Bundle the Client half into the single file the Harness module loader expects:
 * `window.__ModuleLoader__.load({ id, factory(require) { ... } })`.
 *
 * esbuild emits an IIFE assigned to `__dshWalletPill`; the banner opens the
 * factory function *before* that IIFE runs, so the `require(...)` calls esbuild
 * leaves for the externals resolve to the loader's own module table.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

const root = new URL('..', import.meta.url)
const packageJson = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))

await build({
  absWorkingDir: fileURLToPath(root),
  entryPoints: ['src/client/index.tsx'],
  outfile: 'dist/client.js',
  bundle: true,
  format: 'iife',
  globalName: '__dshWalletPill',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  // The Host serves this file to every page load; keep the plugin small.
  minify: true,
  // The page module table provides these; bundling a second copy of React would
  // bloat the plugin and break context identity.
  external: ['react', 'react/jsx-runtime', 'react-dom'],
  legalComments: 'none',
  logLevel: 'info',
  banner: {
    js: `window.__ModuleLoader__.load({id:${JSON.stringify(packageJson.name)},factory(require){`,
  },
  footer: {
    js: 'return __dshWalletPill.create(require);}});',
  },
})
