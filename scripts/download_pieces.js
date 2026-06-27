const fs = require('fs');
const path = require('path');

const sets = ['merida', 'alpha', 'staunty'];
const pieces = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'];

async function download() {
  const baseDir = path.join(__dirname, '../apps/web/public/pieces');
  console.log('Downloading SVGs to:', baseDir);

  for (const set of sets) {
    const dir = path.join(baseDir, set);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    for (const piece of pieces) {
      const url = `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/${set}/${piece}.svg`;
      const dest = path.join(dir, `${piece}.svg`);
      try {
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          fs.writeFileSync(dest, text);
          console.log(`Downloaded ${set}/${piece}.svg`);
        } else {
          console.error(`Failed to download ${set}/${piece}.svg: ${res.status}`);
        }
      } catch (e) {
        console.error(`Error downloading ${set}/${piece}.svg:`, e);
      }
    }
  }
  console.log('Done!');
}

download();
