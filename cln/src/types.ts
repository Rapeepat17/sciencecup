export interface Player {
  id: string;
  name: string;
  number: number | string;
  position?: string;
  team_id?: string;
  teamId?: string;
}

export interface Team {
  id: string | number;
  tournamentId?: string;
  name: string;
  nameEn?: string;
  shortName?: string;
  short_name?: string;
  logo: string;
  logoPath?: string;
  badgeIcon?: string;
  color?: string;
  stadium?: string;
  city?: string;
  manager?: string;
  seed?: number;
  group?: string;
  group_name?: string;
  players?: Player[];
}

export type MatchStatus = 'LIVE' | 'FT' | 'UPCOMING' | 'POSTPONED';

export interface MatchEvent {
  id: string | number;
  minute?: number;
  type?: 'goal' | 'yellow_card' | 'red_card' | 'sub';
  teamId?: string | number;
  playerName?: string;
  event_type?: string;
  team_id?: string | number;
  player_id?: string | number;
  player_number?: string | number;
  detail?: string;
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
  tournamentId?: string;
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
  position?: string;
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

export type TournamentStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface TournamentItem {
  id: string;
  name: string;
  status?: TournamentStatus;
  logo?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  teamsCount?: number;
  matchesCount?: number;
  knockoutStartingRound?: 'r16' | 'qf' | 'sf' | 'final';
  isUserPortalEnabled?: boolean;
  isBracketLocked?: boolean;
  isKnockoutCreated?: boolean;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface TournamentDatabaseData {
  id?: string;
  tournamentName: string;
  status?: TournamentStatus;
  logo?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
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
  | 'tournaments'
  | 'tournament-hub'
  | 'dashboard'
  | 'create-tournament'
  | 'teams'
  | 'groups'
  | 'tournament-setup-and-groups'
  | 'matches'
  | 'matches-and-fixtures'
  | 'standings'
  | 'standings-and-leaderboard'
  | 'bracket'
  | 'settings'
  | 'tournament-settings'
  | 'user-portal';
