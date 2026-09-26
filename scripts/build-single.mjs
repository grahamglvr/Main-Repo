// Bundle www/ into a single self-contained HTML file for quick testing.
//   node scripts/build-single.mjs          -> dist/reelbook.html (open it in any browser, or send it to your phone)
//   node scripts/build-single.mjs --embed  -> dist/reelbook-embed.html (body-only page for sandboxed previews,
//                                             where downloads are shown as copyable text instead)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'www');
const embed = process.argv.includes('--embed');
const read = p => readFileSync(join(www, p), 'utf8');

let html = read('index.html');

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => `<style>\n${read(href)}\n</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
  const code = read(src);
  if (/<\/script/i.test(code.replace(/<\\\/script/g, ''))) throw new Error(`${src} contains a literal </script>`);
  return `<script>\n/* ${src} */\n${code}\n</script>`;
});
// Manifest and icons are separate files, so they can't come along in a single-file build.
html = html.replace(/\s*<link rel="(manifest|icon|apple-touch-icon)"[^>]*>/g, '');

if (embed) {
  // Only look inside the real <head>/<body>: scripts contain HTML templates (e.g. the printable shot list).
  const head = html.slice(0, html.indexOf('</head>'));
  const title = head.match(/<title>[\s\S]*?<\/title>/)[0];
  const styles = [...head.matchAll(/<style>[\s\S]*?<\/style>/g)].map(m => m[0]).join('\n');
  const body = html.slice(html.indexOf('>', html.indexOf('<body')) + 1, html.lastIndexOf('</body>'));
  const extraCss = `<style>
  /* The host page pads the root by the safe-area insets, so sticky bars offset from there. */
  .topbar { top: env(safe-area-inset-top, 0px); padding-top: 10px; }
  .tabs { top: calc(55px + env(safe-area-inset-top, 0px)); }
  @media (max-width: 719px) { .tabs { top: auto; } .subnav { top: calc(55px + env(safe-area-inset-top, 0px)); } }
</style>`;
  html = `${title}\n${styles}\n${extraCss}\n<script>window.RB_SANDBOX = true; document.body && (document.body.dataset.tab = 'prep');</script>\n${body.trim()}\n`;
}

mkdirSync(join(root, 'dist'), { recursive: true });
const out = join(root, 'dist', embed ? 'reelbook-embed.html' : 'reelbook.html');
writeFileSync(out, html);
console.log(`Wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);
