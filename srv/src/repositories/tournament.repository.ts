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

    const list = ((data as Tournament[]) || []).map((t) => {
      const tourney = { ...t };
      if (!tourney.status && (tourney as any).bracket_data?.status) {
        tourney.status = (tourney as any).bracket_data.status;
      }
      if (!tourney.status) {
        tourney.status = 'ACTIVE';
      }
      return tourney;
    });

    return list;
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
      if (alt.data) {
        data = alt.data;
        error = null;
      }

      if (!data) {
        const firstTourney = await supabase
          .from('tournaments')
          .select('*')
          .limit(1)
          .maybeSingle();
        if (firstTourney.data) {
          data = firstTourney.data;
          error = null;
        }
      }
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

    const tourney = (data as Tournament) || null;
    if (tourney) {
      if (!tourney.status && (tourney as any).bracket_data?.status) {
        tourney.status = (tourney as any).bracket_data.status;
      }
      if (!tourney.status) {
        tourney.status = 'ACTIVE';
      }
    }

    return tourney;
  }

  async create(payload: Partial<Tournament>): Promise<Tournament> {
    const supabase = getSupabaseClient();
    let currentPayload = { ...payload };

    let { data, error } = await supabase
      .from('tournaments')
      .insert(currentPayload)
      .select()
      .single();

    // Graceful fallback if status or logo column has not been migrated yet in Supabase
    if (
      error &&
      (error.code === '42703' ||
        error.message?.includes('status') ||
        error.message?.includes('logo'))
    ) {
      const { status, logo, ...rest } = currentPayload;
      const fallbackPayload: Record<string, any> = { ...rest };
      if (status) {
        fallbackPayload.bracket_data = {
          ...(fallbackPayload.bracket_data || {}),
          status,
        };
      }
      const fallbackResult = await supabase
        .from('tournaments')
        .insert(fallbackPayload)
        .select()
        .single();
      if (!fallbackResult.error && fallbackResult.data) {
        return { ...(fallbackResult.data as Tournament), status, logo };
      }
      error = fallbackResult.error || error;
    }

    if (error) {
      throw error;
    }
    return data as Tournament;
  }

  async update(id: string, payload: Partial<Tournament>): Promise<Tournament> {
    const supabase = getSupabaseClient();

    // Resolve target tournament id if alias or fallback exists
    let targetId = id;
    const existing = await this.findById(id);
    if (existing?.id) {
      targetId = existing.id;
    }

    let currentPayload: Record<string, any> = {
      ...payload,
      updated_at: new Date().toISOString(),
    };

    let attempts = 0;
    let savedData: any = null;
    let lastError: any = null;

    while (attempts < 5) {
      attempts++;
      const { data, error } = await supabase
        .from('tournaments')
        .update(currentPayload)
        .eq('id', targetId)
        .select()
        .single();

      if (!error && data) {
        savedData = data;
        break;
      }

      lastError = error;

      // Extract missing column name from PostgREST schema cache error
      // e.g. "Could not find the 'status' column of 'tournaments' in the schema cache"
      const matchMissingCol = error?.message?.match(/Could not find the '([^']+)' column/i);
      const missingColumn = matchMissingCol ? matchMissingCol[1] : null;

      if (missingColumn && missingColumn in currentPayload) {
        console.warn(`[TournamentRepository] Column '${missingColumn}' not found in Supabase table. Falling back gracefully.`);

        if (missingColumn === 'status' && payload.status) {
          const currentBracket = currentPayload.bracket_data || existing?.bracket_data || {};
          currentPayload.bracket_data = {
            ...currentBracket,
            status: payload.status,
          };
        }

        if (missingColumn === 'logo' && !('logo_path' in currentPayload)) {
          currentPayload.logo_path = currentPayload.logo;
          delete currentPayload.logo;
          continue;
        }

        delete currentPayload[missingColumn];
        continue;
      }

      // Check PostgreSQL 42703 (undefined column) or specific column notices
      if (
        error?.code === '42703' ||
        error?.message?.includes('status') ||
        error?.message?.includes('logo') ||
        error?.message?.includes('bracket_data')
      ) {
        if ('status' in currentPayload) {
          const currentBracket = currentPayload.bracket_data || existing?.bracket_data || {};
          currentPayload.bracket_data = {
            ...currentBracket,
            status: payload.status,
          };
          delete currentPayload.status;
          continue;
        }

        if ('logo' in currentPayload) {
          currentPayload.logo_path = currentPayload.logo;
          delete currentPayload.logo;
          continue;
        }

        if ('logo_path' in currentPayload) {
          delete currentPayload.logo_path;
          continue;
        }

        if ('bracket_data' in currentPayload) {
          delete currentPayload.bracket_data;
          continue;
        }
      }

      break;
    }

    if (!savedData) {
      throw lastError;
    }

    const result = savedData as Tournament;
    if (payload.status) {
      result.status = payload.status;
    }
    if (payload.logo) {
      result.logo = payload.logo;
    }
    return result;
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
