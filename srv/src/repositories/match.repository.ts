import { getSupabaseClient } from '../config/supabase.ts';
import { Match, MatchEvent } from '../types/models.types.ts';

export class MatchRepository {
  async findByTournament(tournamentId: string, stage?: string): Promise<Match[]> {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId);

    if (stage) {
      query = query.eq('stage', stage);
    }

    query = query
      .order('match_date', { ascending: true })
      .order('match_time', { ascending: true });

    let { data, error } = await query;
    if (error && error.code === '42703') {
      let fallbackQuery = supabase.from('matches').select('*');
      if (stage) fallbackQuery = fallbackQuery.eq('stage', stage);
      fallbackQuery = fallbackQuery
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true });
      const fallback = await fallbackQuery;
      if (!fallback.error) {
        return (fallback.data as Match[]) || [];
      }
    }

    if (error) {
      throw error;
    }
    return (data as Match[]) || [];
  }

  async findById(tournamentId: string, matchId: string): Promise<Match | null> {
    const supabase = getSupabaseClient();
    let { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('id', matchId)
      .maybeSingle();

    if (error && error.code === '42703') {
      const fallback = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .maybeSingle();
      if (!fallback.error) {
        return (fallback.data as Match) || null;
      }
    }

    if (error) {
      throw error;
    }
    return (data as Match) || null;
  }

  async findAnywhere(matchId: string): Promise<Match | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .maybeSingle();

    if (error) {
      return null;
    }
    return (data as Match) || null;
  }

  async create(payload: Partial<Match> & { tournament_id: string }): Promise<Match> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('matches')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Match;
  }

  async update(tournamentId: string, matchId: string, payload: Partial<Match>): Promise<Match> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('matches')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('tournament_id', tournamentId)
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Match;
  }

  async getEventsByMatch(tournamentId: string, matchId: string): Promise<MatchEvent[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('match_events')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('match_id', matchId)
      .order('minute', { ascending: true });

    if (error) {
      throw error;
    }
    return (data as MatchEvent[]) || [];
  }

  async addEvent(event: Omit<MatchEvent, 'id' | 'created_at'>): Promise<MatchEvent> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('match_events')
      .insert(event)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as MatchEvent;
  }
}

export const matchRepository = new MatchRepository();
