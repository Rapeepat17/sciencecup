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
  id: string;
  tournament_id: string;
  stage: 'group' | 'qf' | 'sf' | 'final';
  group_name?: string | null;
  home_team_id: string;
  away_team_id: string;
  home_score?: number | null;
  away_score?: number | null;
  home_penalty_score?: number | null;
  away_penalty_score?: number | null;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'POSTPONED';
  match_date?: string | null;
  match_time?: string | null;
  pitch?: string | null;
  events?: MatchEvent[];
  created_at?: string;
  updated_at?: string;
}

export interface GroupStandingRow {
  teamId: string;
  teamName: string;
  groupName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
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

