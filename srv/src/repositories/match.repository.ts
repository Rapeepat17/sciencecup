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
      .order('match_number', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true });

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

  async findById(tournamentId: string, matchId: string | number): Promise<Match | null> {
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

  async findAnywhere(matchId: string | number): Promise<Match | null> {
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

  async create(payload: Partial<Match> & { tournament_id: string | number }): Promise<Match> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('matches')
      .insert(payload)
      .select()
      .single();

    if (error) {
      const code = error?.code || '';
      const msg = String(error?.message || '').toLowerCase();
      if (
        code === '22P02' ||
        code === '23503' ||
        msg.includes('integer') ||
        msg.includes('foreign key')
      ) {
        const sanitized = { ...payload };
        if (sanitized.home_team_id !== undefined && isNaN(Number(sanitized.home_team_id))) {
          sanitized.home_team_id = null as any;
        }
        if (sanitized.away_team_id !== undefined && isNaN(Number(sanitized.away_team_id))) {
          sanitized.away_team_id = null as any;
        }
        const retryRes = await supabase
          .from('matches')
          .insert(sanitized)
          .select()
          .single();
        if (!retryRes.error) {
          return retryRes.data as Match;
        }
      }
      throw error;
    }
    return data as Match;
  }

  async update(tournamentId: string, matchId: string | number, payload: Partial<Match>): Promise<Match> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('matches')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('tournament_id', tournamentId)
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      const code = error?.code || '';
      const msg = String(error?.message || '').toLowerCase();
      if (
        code === '22P02' ||
        code === '23503' ||
        msg.includes('integer') ||
        msg.includes('foreign key')
      ) {
        const sanitized = { ...payload };
        if (sanitized.home_team_id !== undefined && isNaN(Number(sanitized.home_team_id))) {
          sanitized.home_team_id = null as any;
        }
        if (sanitized.away_team_id !== undefined && isNaN(Number(sanitized.away_team_id))) {
          sanitized.away_team_id = null as any;
        }
        const retryRes = await supabase
          .from('matches')
          .update({ ...sanitized, updated_at: new Date().toISOString() })
          .eq('tournament_id', tournamentId)
          .eq('id', matchId)
          .select()
          .single();
        if (!retryRes.error) {
          return retryRes.data as Match;
        }
      }
      throw error;
    }
    return data as Match;
  }

  async delete(tournamentId: string, matchId: string | number): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('id', matchId);

    if (error) {
      throw error;
    }
  }

  async syncTournamentMatches(
    tournamentId: string,
    incomingMatches: Array<{
      id?: string | number;
      match_number: number;
      matchday: number;
      stage: string;
      round_name: string | null;
      group_name: string | null;
      home_team_id: string | number;
      away_team_id: string | number;
      match_date: string | null;
      match_time: string | null;
      venue: string | null;
      status?: string;
      home_score?: number | null;
      away_score?: number | null;
      home_penalty_score?: number | null;
      away_penalty_score?: number | null;
    }>
  ): Promise<void> {
    const supabase = getSupabaseClient();
    const existing = await this.findByTournament(tournamentId);
    const existingMap = new Map(existing.map((m) => [String(m.id), m]));

    const incomingExistingIds = new Set<string>();
    const toUpdate: Array<{ id: string | number; data: Record<string, any> }> = [];
    const toInsert: Array<Record<string, any>> = [];

    const formatTeamId = (val: any): string | null => {
      if (val === undefined || val === null) return null;
      const s = String(val).trim();
      if (!s || s === 'undefined' || s === 'null') return null;
      return s;
    };

    for (const item of incomingMatches) {
      const idStr = item.id !== undefined && item.id !== null ? String(item.id) : '';
      const isExistingInDb =
        idStr !== '' &&
        !idStr.startsWith('temp_') &&
        !idStr.startsWith('match-gen-') &&
        !idStr.startsWith('bracket_') &&
        existingMap.has(idStr);

      const matchedRecord =
        (isExistingInDb ? existingMap.get(idStr) : undefined) ||
        existing.find(
          (m) =>
            Number(m.match_number) === Number(item.match_number) &&
            !incomingExistingIds.has(String(m.id))
        );

      const rowData: Record<string, any> = {
        tournament_id: tournamentId,
        match_number: item.match_number,
        matchday: item.matchday || 1,
        stage: item.stage || 'group',
        round_name: item.round_name || 'รอบแบ่งกลุ่ม (Group Stage)',
        group_name: item.group_name ?? null,
        home_team_id: formatTeamId(item.home_team_id),
        away_team_id: formatTeamId(item.away_team_id),
        match_date: item.match_date || '',
        match_time: item.match_time || '',
        venue: item.venue || 'สนาม 1',
        status: item.status || matchedRecord?.status || 'SCHEDULED',
        home_score: item.home_score ?? matchedRecord?.home_score ?? 0,
        away_score: item.away_score ?? matchedRecord?.away_score ?? 0,
        home_penalty_score: item.home_penalty_score ?? matchedRecord?.home_penalty_score ?? null,
        away_penalty_score: item.away_penalty_score ?? matchedRecord?.away_penalty_score ?? null,
      };

      if (matchedRecord) {
        incomingExistingIds.add(String(matchedRecord.id));
        toUpdate.push({ id: matchedRecord.id, data: rowData });
      } else {
        toInsert.push(rowData);
      }
    }

    // 1. Delete matches removed from schedule
    const idsToDelete = existing
      .filter((m) => !incomingExistingIds.has(String(m.id)))
      .map((m) => m.id);

    if (idsToDelete.length > 0) {
      try {
        await supabase
          .from('match_events')
          .delete()
          .eq('tournament_id', tournamentId)
          .in('match_id', idsToDelete.map(String));
      } catch (evtErr) {
        // Safe ignore
      }

      const { error: delError } = await supabase
        .from('matches')
        .delete()
        .eq('tournament_id', tournamentId)
        .in('id', idsToDelete);
      if (delError) throw delError;
    }

    const isDbIntegerTypeMismatch = (err: any) => {
      const code = err?.code || '';
      const msg = String(err?.message || '').toLowerCase();
      const details = String(err?.details || '').toLowerCase();
      return (
        code === '22P02' ||
        code === '23503' ||
        msg.includes('invalid input syntax for type integer') ||
        msg.includes('violates foreign key constraint') ||
        details.includes('invalid input syntax for type integer') ||
        details.includes('is not present in table "teams"')
      );
    };

    const sanitizeRowForIntSchema = (data: Record<string, any>) => {
      const homeStr = data.home_team_id !== null && data.home_team_id !== undefined ? String(data.home_team_id).trim() : '';
      const awayStr = data.away_team_id !== null && data.away_team_id !== undefined ? String(data.away_team_id).trim() : '';
      const homeNum = Number(homeStr);
      const awayNum = Number(awayStr);
      return {
        ...data,
        home_team_id: homeStr !== '' && !isNaN(homeNum) ? homeNum : null,
        away_team_id: awayStr !== '' && !isNaN(awayNum) ? awayNum : null,
      };
    };

    try {
      // 2. Update existing matches
      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map((u) => this.update(tournamentId, u.id, u.data))
        );
      }

      // 3. Insert newly created matches
      if (toInsert.length > 0) {
        const { error: insError } = await supabase
          .from('matches')
          .insert(toInsert);
        if (insError) throw insError;
      }
    } catch (err: any) {
      if (isDbIntegerTypeMismatch(err)) {
        console.warn(
          '[syncTournamentMatches] matches table expects integer team IDs or foreign key. Retrying with sanitized numeric IDs...',
          err?.message || err
        );

        if (toUpdate.length > 0) {
          await Promise.all(
            toUpdate.map((u) =>
              this.update(tournamentId, u.id, sanitizeRowForIntSchema(u.data))
            )
          );
        }

        if (toInsert.length > 0) {
          const sanitizedInserts = toInsert.map(sanitizeRowForIntSchema);
          const { error: retryInsError } = await supabase
            .from('matches')
            .insert(sanitizedInserts);
          if (retryInsError) throw retryInsError;
        }
      } else {
        throw err;
      }
    }
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
