// Builds a single self-contained HTML file of the game for sharing as a link.
// Debug tools are off by default; turn them on in the game's settings.
import { execSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

execSync('npx vite build --base ./ --outDir dist-play/build --emptyOutDir', { stdio: 'inherit' });

const assets = 'dist-play/build/assets';
const files = readdirSync(assets);
const read = (ext) => files.filter((f) => f.endsWith(ext)).map((f) => readFileSync(`${assets}/${f}`, 'utf8')).join('\n');
const js = read('.js').replace(/<\/script/gi, '<\\/script');
const css = read('.css');

const html = `<title>Wiped: Idle Hacker</title>
<meta name="theme-color" content="#0B0D10">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`;

mkdirSync('dist-play', { recursive: true });
writeFileSync('dist-play/wiped.html', html);
console.log(`Wrote dist-play/wiped.html (${(html.length / 1024).toFixed(0)} KB)`);
