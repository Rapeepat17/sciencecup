export interface Player {
  id: string;
  name: string;
  number: number | string;
  position?: string;
}

export interface Team {
  id: string | number;
  name: string;
  nameEn?: string;
  shortName?: string;
  logo: string;
  badgeIcon?: string;
  color?: string;
  stadium?: string;
  city?: string;
  manager?: string;
  seed?: number;
  players?: Player[];
}

export type MatchStatus = 'LIVE' | 'FT' | 'UPCOMING' | 'POSTPONED';

export interface MatchEvent {
  id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'sub';
  teamId: string | number;
  playerName: string;
}

export type GroupMap = Record<string, Team[]>;

export interface CardDetail {
  id: string;
  type: 'yellow' | 'red';
  playerNumber: string;
}

export interface GoalDetail {
  id: string;
  playerNumber: string;
  playerName?: string;
  minute?: number;
}

export interface Match {
  id: string;
  matchday: number;
  matchNumber?: number;
  dateStr: string;
  timeStr: string;
  round: string; // 'รอบแบ่งกลุ่ม (Group Stage)' | 'รอบ 8 ทีมสุดท้าย' | 'รอบรองชนะเลิศ' | 'นัดชิงชนะเลิศ'
  group: string;
  venue: string;
  team1: Team;
  team2: Team;
  score1: number;
  score2: number;
  status: MatchStatus;
  statusLabel?: string;
  currentMinute?: string;
  cardsT1?: { yellow: number; red: number; yellowPlayers?: string; redPlayers?: string; details?: CardDetail[] };
  cardsT2?: { yellow: number; red: number; yellowPlayers?: string; redPlayers?: string; details?: CardDetail[] };
  penaltyScore1?: number | null;
  penaltyScore2?: number | null;
  goalPlayers1?: string;
  goalPlayers2?: string;
  goalDetails1?: GoalDetail[];
  goalDetails2?: GoalDetail[];
  events?: MatchEvent[];
}

export interface TeamStanding {
  team: Team;
  group: string;
  p: number; // Played
  w: number; // Won
  d: number; // Draw
  l: number; // Lost
  gf: number; // Goals For
  ga: number; // Goals Against
  gd: number; // Goal Difference
  pts: number; // Points
  form: ('W' | 'D' | 'L')[];
}

export interface TopScorer {
  id: string;
  rank: number;
  name: string;
  initials: string;
  number: number;
  position: string;
  teamName: string;
  group: string;
  matchesPlayed: number;
  goals: number;
  avatar?: string;
}

export interface BracketMatchup {
  id: string;
  roundName: string;
  date: string;
  time: string;
  venue: string;
  team1: { name: string; score: number | null; penaltyScore?: number | null; logo?: string };
  team2: { name: string; score: number | null; penaltyScore?: number | null; logo?: string };
  winner?: 1 | 2 | null;
}

export interface AdminCredentials {
  username: string;
  passwordHash: string;
}

export interface TournamentDatabaseData {
  tournamentName: string;
  teams: Team[];
  groups: GroupMap;
  matches: Match[];
  knockoutStartingRound?: 'r16' | 'qf' | 'sf' | 'final';
  r16Matches?: BracketMatchup[];
  qfMatches: BracketMatchup[];
  sfMatches: BracketMatchup[];
  finalMatch: BracketMatchup;
  isBracketLocked?: boolean;
  isKnockoutCreated?: boolean;
  isUserPortalEnabled?: boolean;
  adminCredentials?: AdminCredentials;
  updatedAt?: number;
}

export type AppMode = 'admin' | 'user';

export type ActiveView =
  | 'dashboard'
  | 'tournament-setup-and-groups'
  | 'matches-and-fixtures'
  | 'standings-and-leaderboard'
  | 'teams'
  | 'bracket'
  | 'tournament-settings'
  | 'user-portal';
