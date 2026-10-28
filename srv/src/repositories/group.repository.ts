import { getSupabaseClient } from '../config/supabase.ts';
import { GroupItem } from '../types/models.types.ts';

function formatTournamentId(id: string | number): any {
  if (typeof id === 'number') return id;
  const num = Number(id);
  return !isNaN(num) && id.trim() !== '' ? num : id;
}

export class GroupRepository {
  async findByTournament(tournamentId: string): Promise<GroupItem[]> {
    const supabase = getSupabaseClient();
    const formattedId = formatTournamentId(tournamentId);

    let { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('tournament_id', formattedId)
      .order('id', { ascending: true });

    if (error && error.code === '22P02') {
      // Fallback if column type differs
      const fallback = await supabase
        .from('groups')
        .select('*')
        .eq('tournament_id', String(tournamentId))
        .order('id', { ascending: true });
      if (!fallback.error) {
        return (fallback.data as GroupItem[]) || [];
      }
    }

    if (error) {
      console.warn('[GroupRepository.findByTournament] error:', error);
      return [];
    }
    return (data as GroupItem[]) || [];
  }

  async create(tournamentId: string, name: string): Promise<GroupItem> {
    const supabase = getSupabaseClient();
    const formattedId = formatTournamentId(tournamentId);

    const { data, error } = await supabase
      .from('groups')
      .insert({
        tournament_id: formattedId,
        name: name.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('[GroupRepository.create] error:', error);
      throw error;
    }
    return data as GroupItem;
  }

  async update(tournamentId: string, groupId: number | string, name: string): Promise<GroupItem> {
    const supabase = getSupabaseClient();
    const formattedId = formatTournamentId(tournamentId);

    const { data, error } = await supabase
      .from('groups')
      .update({ name: name.trim() })
      .eq('tournament_id', formattedId)
      .eq('id', groupId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as GroupItem;
  }

  async delete(tournamentId: string, groupId: number | string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const formattedId = formatTournamentId(tournamentId);

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('tournament_id', formattedId)
      .eq('id', groupId);

    if (error) {
      throw error;
    }
    return true;
  }

  async syncGroups(tournamentId: string, groupNames: string[]): Promise<GroupItem[]> {
    const supabase = getSupabaseClient();
    const formattedId = formatTournamentId(tournamentId);
    
    // 1. Fetch current groups in db for this tournament
    const current = await this.findByTournament(tournamentId);
    const currentNames = new Set(current.map(c => c.name));
    const targetNames = new Set(groupNames.map(g => g.trim()).filter(Boolean));

    // 2. Delete groups that are no longer in target
    const toDelete = current.filter(c => !targetNames.has(c.name));
    for (const g of toDelete) {
      const { error: delErr } = await supabase
        .from('groups')
        .delete()
        .eq('tournament_id', formattedId)
        .eq('id', g.id);

      if (delErr) {
        console.warn('[GroupRepository.syncGroups] delete error:', delErr);
      }
    }

    // 3. Insert new groups that don't exist yet
    const toInsert = Array.from(targetNames).filter(n => !currentNames.has(n));
    if (toInsert.length > 0) {
      const records = toInsert.map(name => ({
        tournament_id: formattedId,
        name,
      }));
      const { error: insErr } = await supabase.from('groups').insert(records);
      if (insErr) {
        console.error('[GroupRepository.syncGroups] insert error:', insErr);
        throw insErr;
      }
    }

    return this.findByTournament(tournamentId);
  }
}

export const groupRepository = new GroupRepository();
