const fs = require('fs');
const path = require('path');

const sets = ['merida', 'alpha', 'staunty'];
const pieces = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'];
const baseDir = path.join(__dirname, '../apps/web/public/pieces');

async function repair() {
  for (const set of sets) {
    for (const piece of pieces) {
      const file = path.join(baseDir, set, `${piece}.svg`);
      if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
        console.log(`Missing or empty: ${set}/${piece}.svg. Downloading...`);
        try {
          const res = await fetch(`https://api.github.com/repos/lichess-org/lila/contents/public/piece/${set}/${piece}.svg`, {
            headers: { 'User-Agent': 'Node' }
          });
          if (res.ok) {
            const json = await res.json();
            const buffer = Buffer.from(json.content, 'base64');
            fs.writeFileSync(file, buffer);
            console.log(`Repaired ${set}/${piece}.svg`);
          } else {
            console.error(`Failed to repair ${set}/${piece}.svg: ${res.status}`);
          }
        } catch (e) {
          console.error(`Error repairing ${set}/${piece}.svg:`, e);
        }
      }
    }
  }
  console.log('Verification and repair complete.');
}

repair();
