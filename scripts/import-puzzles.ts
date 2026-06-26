// Lichess Puzzle CSV Importer
// Usage: npx tsx scripts/import-puzzles.ts --limit=50000
//
// CSV format: PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PuzzleRow {
  puzzleId: string;
  fen: string;
  moves: string;
  rating: number;
  ratingDeviation: number;
  popularity: number;
  nbPlays: number;
  themes: string[];
  gameUrl: string;
  openingTags: string;
}

function parseLine(line: string): PuzzleRow | null {
  const parts = line.split(',');
  if (parts.length < 8) return null;

  const rating = parseInt(parts[3]);
  if (isNaN(rating)) return null;

  return {
    puzzleId: parts[0],
    fen: parts[1],
    moves: parts[2],
    rating,
    ratingDeviation: parseInt(parts[4]) || 75,
    popularity: parseInt(parts[5]) || 0,
    nbPlays: parseInt(parts[6]) || 0,
    themes: parts[7] ? parts[7].split(' ').filter(Boolean) : [],
    gameUrl: parts[8] || '',
    openingTags: parts[9] || '',
  };
}

async function importPuzzles(filePath: string, limit: number, minRating?: number, maxRating?: number) {
  console.log(`Importing puzzles from ${filePath} (limit: ${limit})`);

  const stream = createReadStream(filePath, { encoding: 'utf-8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let count = 0;
  let skipped = 0;
  let batch: any[] = [];
  const BATCH_SIZE = 1000;
  let isFirstLine = true;

  for await (const line of rl) {
    // Skip header
    if (isFirstLine) {
      isFirstLine = false;
      if (line.startsWith('PuzzleId')) continue;
    }

    if (count >= limit) break;

    const puzzle = parseLine(line);
    if (!puzzle) {
      skipped++;
      continue;
    }

    if (minRating && puzzle.rating < minRating) { skipped++; continue; }
    if (maxRating && puzzle.rating > maxRating) { skipped++; continue; }

    batch.push({
      id: puzzle.puzzleId,
      fen: puzzle.fen,
      moves: puzzle.moves,
      rating: puzzle.rating,
      rd: puzzle.ratingDeviation,
      themes: puzzle.themes,
      popularity: puzzle.popularity,
      sourceGameId: puzzle.gameUrl || null,
    });

    if (batch.length >= BATCH_SIZE) {
      try {
        await prisma.puzzle.createMany({
          data: batch,
        });
      } catch (err) {
        console.error(`Batch insert error at count ${count}:`, err);
      }
      count += batch.length;
      batch = [];
      if (count % 10000 === 0) {
        console.log(`  Imported ${count} puzzles...`);
      }
    }
  }

  // Insert remaining batch
  if (batch.length > 0) {
    try {
      await prisma.puzzle.createMany({
        data: batch,
      });
      count += batch.length;
    } catch (err) {
      console.error('Final batch insert error:', err);
    }
  }

  console.log(`Done! Imported ${count} puzzles, skipped ${skipped}`);
}

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name: string) => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : undefined;
};

const filePath = args.find((a) => !a.startsWith('--')) || 'lichess_db_puzzle.csv';
const limit = parseInt(getArg('limit') || '50000');
const minRating = getArg('min-rating') ? parseInt(getArg('min-rating')!) : undefined;
const maxRating = getArg('max-rating') ? parseInt(getArg('max-rating')!) : undefined;

importPuzzles(filePath, limit, minRating, maxRating)
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
