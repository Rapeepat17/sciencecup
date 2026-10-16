import { getSupabaseClient } from '../config/supabase.ts';
import { Team } from '../types/models.types.ts';

export class TeamRepository {
  async findByTournament(tournamentId: string): Promise<Team[]> {
    const supabase = getSupabaseClient();
    let { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('group_name', { ascending: true })
      .order('name', { ascending: true });

    if (error && error.code === '42703') {
      const fallback = await supabase
        .from('teams')
        .select('*')
        .order('group_name', { ascending: true })
        .order('name', { ascending: true });
      if (!fallback.error) {
        return (fallback.data as Team[]) || [];
      }
    }

    if (error) {
      throw error;
    }
    return (data as Team[]) || [];
  }

  async findById(tournamentId: string, teamId: string): Promise<Team | null> {
    const supabase = getSupabaseClient();
    let { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('id', teamId)
      .maybeSingle();

    if (error && error.code === '42703') {
      const fallback = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .maybeSingle();
      if (!fallback.error) {
        return (fallback.data as Team) || null;
      }
    }

    if (error) {
      throw error;
    }
    return (data as Team) || null;
  }

  async findAnywhere(teamId: string): Promise<Team | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .maybeSingle();

    if (error) {
      return null;
    }
    return (data as Team) || null;
  }

  async create(payload: Partial<Team> & { tournament_id: string }): Promise<Team> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('teams')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Team;
  }

  async update(tournamentId: string, teamId: string, payload: Partial<Team>): Promise<Team> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('teams')
      .update(payload)
      .eq('tournament_id', tournamentId)
      .eq('id', teamId)
      .select()
      .single();

    if (error && error.code === '42703') {
      const fallback = await supabase
        .from('teams')
        .update(payload)
        .eq('id', teamId)
        .select()
        .single();
      if (!fallback.error) {
        return fallback.data as Team;
      }
    }

    if (error) {
      throw error;
    }
    return data as Team;
  }

  async delete(tournamentId: string, teamId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    let { error } = await supabase
      .from('teams')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('id', teamId);

    if (error && error.code === '42703') {
      const fallback = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);
      if (!fallback.error) {
        return true;
      }
    }

    if (error) {
      throw error;
    }
    return true;
  }
}

export const teamRepository = new TeamRepository();
