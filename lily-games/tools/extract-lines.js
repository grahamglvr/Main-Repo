// Prints the game's spoken lines (key -> text) as JSON, read from the VOICE-LINES block in index.html.
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const block = html.split('// VOICE-LINES:START')[1].split('// VOICE-LINES:END')[0];
const lines = new Function(block.slice(block.indexOf('\n')) + '\nreturn LINES;')();
process.stdout.write(JSON.stringify(lines, null, 2));
