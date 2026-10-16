import { getSupabaseClient } from '../config/supabase.ts';
import { Player } from '../types/models.types.ts';

export class PlayerRepository {
  async findByTournament(tournamentId: string, teamId?: string): Promise<Player[]> {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('players')
      .select('*')
      .eq('tournament_id', tournamentId);

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    query = query.order('name', { ascending: true });

    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return (data as Player[]) || [];
  }

  async findById(tournamentId: string, playerId: string): Promise<Player | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('id', playerId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return (data as Player) || null;
  }

  async create(payload: Partial<Player> & { tournament_id: string }): Promise<Player> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('players')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Player;
  }

  async update(tournamentId: string, playerId: string, payload: Partial<Player>): Promise<Player> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('players')
      .update(payload)
      .eq('tournament_id', tournamentId)
      .eq('id', playerId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Player;
  }

  async delete(tournamentId: string, playerId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('id', playerId);

    if (error) {
      throw error;
    }
    return true;
  }
}

export const playerRepository = new PlayerRepository();
