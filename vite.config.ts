import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Rapier's -compat build inlines its WebAssembly as base64 inside the JS
 * (4.3 MB raw). This swaps the inline bytes for the package's own .wasm file,
 * served as a separate asset: smaller over the wire, compiled while it streams,
 * and no base64 decode on the main thread. Fails the build if Rapier changes
 * shape, so it can never silently ship the wrong thing.
 */
function rapierWasmFile(): Plugin {
  const INLINE = /module_or_path:([A-Za-z_$][\w$]*)\.toByteArray\("[A-Za-z0-9+/=]+"\)(\.buffer)?/;
  return {
    name: 'rapier-wasm-file',
    enforce: 'pre',
    transform(code, id) {
      if (!/rapier3d-compat[\\/]dist[\\/]rapier\.mjs/.test(id.split('?')[0])) return null;
      if (!INLINE.test(code)) this.error('rapier-wasm-file: inline WASM not found. Check the @dimforge/rapier3d-compat version.');
      return {
        code: `import __rapierWasmUrl from './rapier_wasm3d_bg.wasm?url';\n${code.replace(INLINE, 'module_or_path:__rapierWasmUrl')}`,
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [react(), rapierWasmFile()],
  optimizeDeps: { exclude: ['@dimforge/rapier3d-compat'] },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    assetsInlineLimit: 2048,
  },
});
