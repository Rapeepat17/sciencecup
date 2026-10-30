import { getSupabaseClient } from '../config/supabase.ts';
import { Tournament } from '../types/models.types.ts';
import { AppError } from '../middleware/errorHandler.ts';

export class TournamentRepository {
  async findAll(): Promise<Tournament[]> {
    const supabase = getSupabaseClient();
    let { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error && (error.code === '42703' || error.message?.includes('created_at'))) {
      const fallback = await supabase.from('tournaments').select('*');
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      if (error.code === '42P01' || error.code === '42703') {
        return [
          {
            id: 'sci_cup_main',
            name: 'SCI CUP 2026',
            status: 'ACTIVE',
            description: 'การแข่งขันฟุตบอลวิทยาศาสตร์คัพ ประจำปี 2026',
            is_user_portal_enabled: true,
            knockout_starting_round: 'sf',
          } as Tournament,
        ];
      }
      throw error;
    }
    return (data as Tournament[]) || [];
  }

  async findById(id: string): Promise<Tournament | null> {
    const supabase = getSupabaseClient();
    let { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!data && (id === '1000' || id === 'sci_cup_main')) {
      const altId = id === '1000' ? 'sci_cup_main' : '1000';
      const alt = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', altId)
        .maybeSingle();
      if (alt.data) return alt.data as Tournament;

      const firstTourney = await supabase
        .from('tournaments')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (firstTourney.data) return firstTourney.data as Tournament;
    }

    if (error) {
      if (error.code === '42P01' || error.code === '42703') {
        return {
          id,
          name: 'SCI CUP 2026',
          status: 'ACTIVE',
          description: 'การแข่งขันฟุตบอลวิทยาศาสตร์คัพ ประจำปี 2026',
          is_user_portal_enabled: true,
          knockout_starting_round: 'sf',
        } as Tournament;
      }
      throw error;
    }
    return (data as Tournament) || null;
  }

  async create(payload: Partial<Tournament>): Promise<Tournament> {
    const supabase = getSupabaseClient();
    let { data, error } = await supabase
      .from('tournaments')
      .insert(payload)
      .select()
      .single();

    // Graceful fallback if logo column has not been migrated yet in Supabase
    if (error && (error.code === '42703' || error.message?.includes('logo'))) {
      const { logo, ...rest } = payload;
      const fallbackResult = await supabase
        .from('tournaments')
        .insert(rest)
        .select()
        .single();
      if (!fallbackResult.error) {
        return { ...(fallbackResult.data as Tournament), logo };
      }
      error = fallbackResult.error;
    }

    if (error) {
      throw error;
    }
    return data as Tournament;
  }

  async update(id: string, payload: Partial<Tournament>): Promise<Tournament> {
    const supabase = getSupabaseClient();
    let { data, error } = await supabase
      .from('tournaments')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    // Graceful fallback if logo or bracket_data column has been removed/not migrated
    if (
      error &&
      (error.code === '42703' ||
        error.message?.includes('logo') ||
        error.message?.includes('bracket_data'))
    ) {
      const { logo, bracket_data, ...rest } = payload;
      const fallbackResult = await supabase
        .from('tournaments')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!fallbackResult.error) {
        return { ...(fallbackResult.data as Tournament), logo, bracket_data };
      }
      error = fallbackResult.error;
    }

    if (error) {
      throw error;
    }
    return data as Tournament;
  }

  async delete(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
    return true;
  }
}

export const tournamentRepository = new TournamentRepository();
