export type TournamentStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';

export interface Tournament {
  id: string;
  name: string;
  status?: string;
  logo?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  knockout_starting_round?: 'qf' | 'sf' | 'final';
  is_bracket_locked?: boolean;
  is_knockout_created?: boolean;
  is_user_portal_enabled?: boolean;
  bracket_data?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface Team {
  id: string;
  name: string;
  short_name?: string | null;
  manager?: string | null;
  group_name?: string | null;
  logo?: string | null;
  logo_path?: string | null;
  tournament_id: string;
  created_at?: string;
}

export interface GroupItem {
  id: number | string;
  tournament_id: string;
  name: string;
  created_at?: string;
}

export interface Player {
  id: string;
  team_id: string;
  tournament_id: string;
  name: string;
  number?: string | null;
  position?: string | null;
  created_at?: string;
}

export interface MatchEvent {
  id: string;
  tournament_id: string;
  match_id: string;
  team_id?: string | null;
  player_id?: string | null;
  player_number?: string | null;
  event_type: 'goal' | 'yellow_card' | 'red_card' | 'sub' | 'penalty';
  minute: number;
  extra_minute?: number;
  detail?: string | null;
  created_at?: string;
}

export interface Match {
  id: string | number;
  tournament_id: string | number;
  match_number?: number | null;
  matchday?: number | null;
  stage: 'group' | 'r16' | 'qf' | 'sf' | 'third_place' | 'final' | string;
  round_name?: string | null;
  group_name?: string | null;
  home_team_id: string | number;
  away_team_id: string | number;
  home_score?: number | null;
  away_score?: number | null;
  home_penalty_score?: number | null;
  away_penalty_score?: number | null;
  status: 'SCHEDULED' | 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'FT' | 'POSTPONED';
  match_date?: string | null;
  match_time?: string | null;
  venue?: string | null;
  pitch?: string | null;
  events?: MatchEvent[];
  created_at?: string;
  updated_at?: string;
}

export interface GroupStandingRow {
  rank?: number;
  isQualified?: boolean;
  teamId: string;
  teamName: string;
  shortName?: string | null;
  teamLogo?: string | null;
  groupName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: ('W' | 'D' | 'L')[];
}

export interface TournamentStandingsSummary {
  totalGroups: number;
  totalTeamsInGroups: number;
  totalMatches: number;
  completedMatches: number;
  liveMatches: number;
  totalGoals: number;
}

export interface TournamentStandingsResponse {
  groups: Record<string, GroupStandingRow[]>;
  summary: TournamentStandingsSummary;
}

export interface GroupSummary {
  name: string;
  teams: Team[];
}

export interface BracketMatchup {
  id: string;
  matchNumber?: number;
  label?: string;
  team1?: Team | null;
  team2?: Team | null;
  score1?: number | null;
  score2?: number | null;
  penaltyScore1?: number | null;
  penaltyScore2?: number | null;
  winner?: Team | null;
  status?: string;
}

export interface BracketData {
  r16Matches?: BracketMatchup[];
  qfMatches?: BracketMatchup[];
  sfMatches?: BracketMatchup[];
  finalMatch?: BracketMatchup | null;
  isBracketLocked?: boolean;
  isKnockoutCreated?: boolean;
}

