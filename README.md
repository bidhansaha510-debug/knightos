# KnightOS — Chess Platform

A full-stack, real-time chess platform with multiplayer games, Stockfish analysis, puzzle trainer, and Glicko-2 ratings.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v3
- **Backend**: Node.js 20 + Fastify + Prisma + SQLite (Local File)
- **Real-time**: WebSockets via @fastify/websocket
- **Cache/Pub-Sub**: In-Memory Redis Emulator (no external process needed)
- **Chess Logic**: chess.js (client + server validation)
- **Analysis**: Stockfish 16 WASM (browser Web Worker)
- **Rating**: Custom Glicko-2 implementation

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Run database migrations to create SQLite database (dev.db)
cd apps/api && npx prisma migrate dev --name init_sqlite

# 3. Seed sample puzzles
pnpm --filter api exec tsx d:/chess/scripts/seed-puzzles.ts

# 4. Start dev servers (run in separate terminals)
# Start frontend on http://localhost:5173
pnpm --filter web dev

# Start backend on http://localhost:3001
pnpm --filter api dev
```

### Quick Launch (Windows)

You can double-click **`start_all.bat`** in the root of the project. It will launch both the backend API server and the web frontend server in separate command prompt windows.

### Import Lichess Puzzles (Optional)

```bash
# Download Lichess puzzle database (~800MB compressed)
wget https://database.lichess.org/lichess_db_puzzle.csv.zst
zstd -d lichess_db_puzzle.csv.zst

# Import first 50,000 puzzles
npx tsx scripts/import-puzzles.ts lichess_db_puzzle.csv --limit=50000
```

## Project Structure

```
chess/
├── apps/
│   ├── web/          # React frontend (Vite)
│   └── api/          # Fastify backend
├── packages/
│   └── shared/       # Shared TypeScript types
├── scripts/          # Utility scripts (puzzle import, seeding)
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Features

- ♚ Real-time multiplayer chess (WebSocket)
- ⚡ Bullet, Blitz, Rapid, Classical time controls
- 🧩 Puzzle trainer (3M+ from Lichess database)
- 🔬 Stockfish 16 WASM analysis board
- 📊 Glicko-2 rating system per time control
- 👤 User profiles with game history
- 🏆 Leaderboards per time control
- 🎨 5 board themes, sound effects, customization

## License

MIT
