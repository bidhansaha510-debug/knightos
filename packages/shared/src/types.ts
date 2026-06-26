// ============================================================
// KnightOS — Shared Types
// ============================================================

// --- Time Controls ---

export type TimeControlCategory = 'bullet' | 'blitz' | 'rapid' | 'classical' | 'puzzle';

export interface TimeControl {
  /** e.g. "5+0", "3+2", "10+5" */
  label: string;
  /** Base time in seconds */
  baseTime: number;
  /** Increment in seconds */
  increment: number;
}

export function getTimeControlCategory(baseTime: number, increment: number): TimeControlCategory {
  const totalSeconds = baseTime + increment * 40; // estimated game length
  if (totalSeconds < 180) return 'bullet';
  if (totalSeconds < 480) return 'blitz';
  if (totalSeconds < 1500) return 'rapid';
  return 'classical';
}

export function parseTimeControl(label: string): { baseTime: number; increment: number } {
  const [base, inc] = label.split('+').map(Number);
  return { baseTime: base * 60, increment: inc || 0 };
}

// --- Game State ---

export type PieceColor = 'w' | 'b';
export type GameResult = '1-0' | '0-1' | '1/2-1/2' | '*';
export type Termination = 'checkmate' | 'resignation' | 'timeout' | 'draw' | 'stalemate' | 'abandoned' | 'agreement';

export interface GameMove {
  san: string;
  uci: string;
  fen: string;
  clock?: number; // remaining time in ms for the player who made this move
}

export interface GameState {
  id: string;
  fen: string;
  pgn: string;
  moves: GameMove[];
  turn: PieceColor;
  whiteClock: number; // ms remaining
  blackClock: number;
  status: 'waiting' | 'active' | 'ended';
  result?: GameResult;
  termination?: Termination;
  whiteId: string;
  blackId: string;
  whiteUsername: string;
  blackUsername: string;
  whiteRating: number;
  blackRating: number;
  timeControl: string;
  rated: boolean;
  drawOffer?: PieceColor;
}

// --- Seek & Matchmaking ---

export interface Seek {
  id: string;
  userId: string;
  username: string;
  rating: number;
  timeControl: string;
  rated: boolean;
  color?: 'white' | 'black' | 'random';
  createdAt: number;
}

export interface Challenge {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromRating: number;
  toUserId: string;
  timeControl: string;
  rated: boolean;
  createdAt: number;
}

// --- Puzzle ---

export interface PuzzleData {
  id: string;
  fen: string;
  moves: string[]; // UCI moves
  rating: number;
  themes: string[];
}

export interface PuzzleAttemptResult {
  solved: boolean;
  timeTaken: number; // ms
  newRating?: number;
  ratingDelta?: number;
}

// --- User ---

export interface UserProfile {
  id: string;
  username: string;
  createdAt: string;
  ratings: Record<TimeControlCategory, { rating: number; rd: number }>;
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
  };
  followerCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  rating: number;
  gamesPlayed: number;
}

// --- WebSocket Messages: Client → Server (Game) ---

export interface WsMoveMessage {
  type: 'move';
  from: string;
  to: string;
  promotion?: string;
}

export interface WsResignMessage {
  type: 'resign';
}

export interface WsDrawOfferMessage {
  type: 'draw_offer';
}

export interface WsDrawAcceptMessage {
  type: 'draw_accept';
}

export interface WsDrawDeclineMessage {
  type: 'draw_decline';
}

export interface WsChatMessage {
  type: 'chat';
  message: string;
}

export type ClientGameMessage =
  | WsMoveMessage
  | WsResignMessage
  | WsDrawOfferMessage
  | WsDrawAcceptMessage
  | WsDrawDeclineMessage
  | WsChatMessage;

// --- WebSocket Messages: Server → Client (Game) ---

export interface WsGameStateMessage {
  type: 'game_state';
  gameState: GameState;
}

export interface WsMoveResponseMessage {
  type: 'move';
  san: string;
  uci: string;
  fen: string;
  whiteClock: number;
  blackClock: number;
}

export interface WsIllegalMoveMessage {
  type: 'illegal_move';
}

export interface WsGameOverMessage {
  type: 'game_over';
  result: GameResult;
  termination: Termination;
}

export interface WsDrawOfferedMessage {
  type: 'draw_offered';
  by: 'white' | 'black';
}

export interface WsChatResponseMessage {
  type: 'chat';
  from: string;
  message: string;
}

export interface WsOpponentDisconnectedMessage {
  type: 'opponent_disconnected';
}

export interface WsOpponentReconnectedMessage {
  type: 'opponent_reconnected';
}

export type ServerGameMessage =
  | WsGameStateMessage
  | WsMoveResponseMessage
  | WsIllegalMoveMessage
  | WsGameOverMessage
  | WsDrawOfferedMessage
  | WsChatResponseMessage
  | WsOpponentDisconnectedMessage
  | WsOpponentReconnectedMessage;

// --- WebSocket Messages: Client → Server (Lobby) ---

export interface WsSeekMessage {
  type: 'seek';
  timeControl: string;
  rated: boolean;
  color?: 'white' | 'black' | 'random';
}

export interface WsSeekCancelMessage {
  type: 'seek_cancel';
}

export interface WsChallengeMessage {
  type: 'challenge';
  toUserId: string;
  timeControl: string;
  rated: boolean;
}

export interface WsChallengeAcceptMessage {
  type: 'challenge_accept';
  challengeId: string;
}

export interface WsChallengeDeclineMessage {
  type: 'challenge_decline';
  challengeId: string;
}

export type ClientLobbyMessage =
  | WsSeekMessage
  | WsSeekCancelMessage
  | WsChallengeMessage
  | WsChallengeAcceptMessage
  | WsChallengeDeclineMessage;

// --- WebSocket Messages: Server → Client (Lobby) ---

export interface WsSeeksUpdateMessage {
  type: 'seeks_update';
  seeks: Seek[];
}

export interface WsGameStartMessage {
  type: 'game_start';
  gameId: string;
  color: 'white' | 'black';
}

export interface WsChallengedByMessage {
  type: 'challenged_by';
  challenge: Challenge;
}

export type ServerLobbyMessage =
  | WsSeeksUpdateMessage
  | WsGameStartMessage
  | WsChallengedByMessage;

// --- Analysis ---

export interface EngineEval {
  depth: number;
  score: { type: 'cp' | 'mate'; value: number };
  pv: string[]; // principal variation in UCI
  pvSan?: string[]; // in SAN for display
  multipv: number;
}

export interface MoveClassification {
  type: 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  eval: number; // centipawn eval after the move
  bestEval: number; // eval of the best move
  cpLoss: number; // centipawn loss
}

export interface GameAnalysis {
  moves: Array<{
    san: string;
    eval: number;
    classification: MoveClassification['type'];
    bestMove?: string;
  }>;
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteMistakes: number;
  whiteBlunders: number;
  blackMistakes: number;
  blackBlunders: number;
}

// --- Color Tokens ---

export const COLORS = {
  bgBase: '#0f1117',
  bgSurface: '#1a1d27',
  bgElevated: '#222536',
  accentBlue: '#3b82f6',
  accentGreen: '#22c55e',
  accentRed: '#ef4444',
  accentAmber: '#f59e0b',
  textPrimary: '#f1f5f9',
  textMuted: '#64748b',
  boardLight: '#f0d9b5',
  boardDark: '#b58863',
  border: '#2d3148',
} as const;
