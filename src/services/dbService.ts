import { TournamentDatabaseData, Team, Player, Match, GroupMap, BracketMatchup } from '../types';
import { INITIAL_R16_MATCHES, INITIAL_QF_MATCHES, INITIAL_SF_MATCHES, INITIAL_FINAL_MATCH } from '../data/bracketData';
import { calculateGroupStandings } from '../utils/standingsCalculator';
import { supabase, isSupabaseConfigured } from './supabaseClient';

try {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('scicup_database_v1');
    localStorage.removeItem('scicup_database_v2');
  }
} catch (e) {}

const LOCAL_STORAGE_KEY = 'scicup_database_v3';
const SUPABASE_ROW_ID = 'sci_cup_main';

export const DEFAULT_DATABASE_DATA: TournamentDatabaseData = {
  tournamentName: 'SCI CUP 2026',
  teams: [],
  groups: {},
  matches: [],
  knockoutStartingRound: 'sf',
  r16Matches: INITIAL_R16_MATCHES,
  qfMatches: INITIAL_QF_MATCHES,
  sfMatches: INITIAL_SF_MATCHES,
  finalMatch: INITIAL_FINAL_MATCH,
  isBracketLocked: false,
  isKnockoutCreated: false,
  isUserPortalEnabled: true,
};

export function formatDatabaseData(data: any): TournamentDatabaseData {
  if (!data || typeof data !== 'object') {
    return DEFAULT_DATABASE_DATA;
  }

  const adminCreds =
    data.admin_credentials && typeof data.admin_credentials === 'object'
      ? data.admin_credentials
      : data.adminCredentials && typeof data.adminCredentials === 'object'
        ? data.adminCredentials
        : {};

  return {
    tournamentName: data.tournament_name || data.tournamentName || DEFAULT_DATABASE_DATA.tournamentName,
    teams: Array.isArray(data.teams) ? data.teams : [],
    groups: data.groups && typeof data.groups === 'object' ? data.groups : {},
    matches: Array.isArray(data.matches) ? data.matches : [],
    knockoutStartingRound:
      data.knockout_starting_round ||
      data.knockoutStartingRound ||
      adminCreds.knockoutStartingRound ||
      DEFAULT_DATABASE_DATA.knockoutStartingRound,
    r16Matches: Array.isArray(data.r16_matches || data.r16Matches || adminCreds.r16Matches)
      ? data.r16_matches || data.r16Matches || adminCreds.r16Matches
      : DEFAULT_DATABASE_DATA.r16Matches,
    qfMatches: Array.isArray(data.qf_matches || data.qfMatches)
      ? data.qf_matches || data.qfMatches
      : DEFAULT_DATABASE_DATA.qfMatches,
    sfMatches: Array.isArray(data.sf_matches || data.sfMatches)
      ? data.sf_matches || data.sfMatches
      : DEFAULT_DATABASE_DATA.sfMatches,
    finalMatch: data.final_match || data.finalMatch || DEFAULT_DATABASE_DATA.finalMatch,
    isBracketLocked:
      typeof data.is_bracket_locked === 'boolean'
        ? data.is_bracket_locked
        : typeof data.isBracketLocked === 'boolean'
          ? data.isBracketLocked
          : typeof adminCreds.isBracketLocked === 'boolean'
            ? adminCreds.isBracketLocked
            : false,
    isKnockoutCreated:
      typeof data.is_knockout_created === 'boolean'
        ? data.is_knockout_created
        : typeof data.isKnockoutCreated === 'boolean'
          ? data.isKnockoutCreated
          : typeof adminCreds.isKnockoutCreated === 'boolean'
            ? adminCreds.isKnockoutCreated
            : false,
    isUserPortalEnabled:
      typeof data.is_user_portal_enabled === 'boolean'
        ? data.is_user_portal_enabled
        : typeof data.isUserPortalEnabled === 'boolean'
          ? data.isUserPortalEnabled
          : typeof adminCreds.isUserPortalEnabled === 'boolean'
            ? adminCreds.isUserPortalEnabled
            : true,
    adminCredentials: {
      username: adminCreds.username || 'admin',
      passwordHash: adminCreds.passwordHash || '1234',
    },
    updatedAt: data.updated_at
      ? typeof data.updated_at === 'number'
        ? data.updated_at
        : new Date(data.updated_at).getTime()
      : data.updatedAt || 0,
  };
}

/**
 * Fast Parallel Fetch from Supabase Cloud Database
 */
export async function fetchDatabase(): Promise<TournamentDatabaseData> {
  if (isSupabaseConfigured && supabase) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase fetch timeout')), 4000)
      );

      const relFetchPromise = (async () => {
        // Fetch all 7 tables in parallel
        const [tourneyRes, teamsRes, playersRes, groupsRes, groupTeamsRes, matchesRes, profileRes] =
          await Promise.all([
            supabase.from('tournaments').select('*').eq('id', SUPABASE_ROW_ID).maybeSingle(),
            supabase.from('teams').select('*'),
            supabase.from('players').select('*'),
            supabase.from('groups').select('*').eq('tournament_id', SUPABASE_ROW_ID),
            supabase.from('group_teams').select('*'),
            supabase.from('matches').select('*').eq('tournament_id', SUPABASE_ROW_ID).order('matchday', { ascending: true }),
            supabase.from('profiles').select('*').eq('username', 'admin').maybeSingle(),
          ]);

        const tourney = tourneyRes.data;
        const teamsData = teamsRes.data || [];
        const playersData = playersRes.data || [];
        const groupsData = groupsRes.data || [];
        const groupTeamsData = groupTeamsRes.data || [];
        const matchesData = matchesRes.data || [];
        const profileData = profileRes.data;

        if (tourney || teamsData.length > 0 || groupsData.length > 0) {
          // Group players by team_id
          const playersByTeam: Record<string, Player[]> = {};
          playersData.forEach((p: any) => {
            const tId = String(p.team_id);
            if (!playersByTeam[tId]) playersByTeam[tId] = [];
            playersByTeam[tId].push({
              id: String(p.id),
              name: p.name,
              number: p.number,
              position: p.position,
            });
          });

          // Map teams
          const teams: Team[] = teamsData.map((t: any) => ({
            id: String(t.id),
            name: t.name,
            nameEn: t.name_en || t.name,
            shortName: t.short_name,
            logo: t.logo || '',
            players: playersByTeam[String(t.id)] || [],
          }));

          // Reconstruct groups
          const groups: GroupMap = {};
          groupsData.forEach((g: any) => {
            const teamRows = groupTeamsData.filter((gt: any) => gt.group_id === g.id);
            const teamsInGroup = teamRows
              .map((gt: any) => teams.find((t) => String(t.id) === String(gt.team_id)))
              .filter(Boolean) as Team[];
            groups[g.name] = teamsInGroup;
          });

          // Reconstruct bracket from tourney.bracket_data if available
          const bracketData = (tourney as any)?.bracket_data || {};
          const matchDetails = bracketData.matchDetails || {};
          let r16Matches: BracketMatchup[] = Array.isArray(bracketData.r16Matches)
            ? bracketData.r16Matches
            : [...INITIAL_R16_MATCHES];
          let qfMatches: BracketMatchup[] = Array.isArray(bracketData.qfMatches)
            ? bracketData.qfMatches
            : [...INITIAL_QF_MATCHES];
          let sfMatches: BracketMatchup[] = Array.isArray(bracketData.sfMatches)
            ? bracketData.sfMatches
            : [...INITIAL_SF_MATCHES];
          let finalMatch: BracketMatchup = bracketData.finalMatch || { ...INITIAL_FINAL_MATCH };

          // Reconstruct matches schedule
          const scheduledMatches: Match[] = [];
          if (matchesData.length > 0) {
            const groupMapById = new Map(groupsData.map((g: any) => [g.id, g.name]));

            matchesData.forEach((m: any) => {
              const homeName = m.home_team_name || teams.find((t) => String(t.id) === String(m.home_team_id))?.name || '-';
              const awayName = m.away_team_name || teams.find((t) => String(t.id) === String(m.away_team_id))?.name || '-';
              const homeLogo = m.home_team_logo || teams.find((t) => String(t.id) === String(m.home_team_id))?.logo || '';
              const awayLogo = m.away_team_logo || teams.find((t) => String(t.id) === String(m.away_team_id))?.logo || '';

              const md = matchDetails[m.id] || {};

              const t1: Team = {
                id: m.home_team_id || `t1_${m.id}`,
                name: homeName,
                logo: homeLogo,
              };
              const t2: Team = {
                id: m.away_team_id || `t2_${m.id}`,
                name: awayName,
                logo: awayLogo,
              };

              scheduledMatches.push({
                id: String(m.id),
                matchNumber: m.matchday || undefined,
                matchday: m.matchday || 1,
                dateStr: m.match_date || '',
                timeStr: m.match_time || '',
                round: m.round_name || 'รอบแบ่งกลุ่ม (Group Stage)',
                group: m.stage === 'group' || !m.stage ? groupMapById.get(m.group_id) || '' : 'Knockout',
                venue: m.venue || 'สนามหลัก',
                team1: t1,
                team2: t2,
                score1: m.home_score ?? 0,
                score2: m.away_score ?? 0,
                penaltyScore1: m.penalty_home_score,
                penaltyScore2: m.penalty_away_score,
                status: m.status || 'UPCOMING',
                statusLabel: m.status_label || '',
                currentMinute: m.current_minute || '',
                goalPlayers1: md.goalPlayers1,
                goalPlayers2: md.goalPlayers2,
                goalDetails1: md.goalDetails1,
                goalDetails2: md.goalDetails2,
                cardsT1: md.cardsT1,
                cardsT2: md.cardsT2,
                events: md.events,
              });
            });

            // Ensure matches are strictly sorted by matchNumber
            scheduledMatches.sort((a, b) => (a.matchNumber || a.matchday || 0) - (b.matchNumber || b.matchday || 0));
          }

          const fallback = DEFAULT_DATABASE_DATA;

          const formatted: TournamentDatabaseData = {
            tournamentName: tourney?.name || fallback.tournamentName,
            teams,
            groups,
            matches: scheduledMatches,
            knockoutStartingRound: tourney?.knockout_starting_round || fallback.knockoutStartingRound,
            r16Matches,
            qfMatches,
            sfMatches,
            finalMatch,
            isBracketLocked: tourney?.is_bracket_locked ?? fallback.isBracketLocked,
            isKnockoutCreated: tourney?.is_knockout_created ?? fallback.isKnockoutCreated,
            isUserPortalEnabled: tourney?.is_user_portal_enabled ?? fallback.isUserPortalEnabled,
            adminCredentials: {
              username: profileData?.username || 'admin',
              passwordHash: profileData?.password_hash || '1234',
            },
            updatedAt: tourney?.updated_at ? new Date(tourney.updated_at).getTime() : Date.now(),
          };

          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formatted));
          } catch (e) {}

          return formatted;
        }

        return null;
      })();

      const result: any = await Promise.race([relFetchPromise, timeoutPromise]);
      if (result) return result;
    } catch (err) {
      console.warn('Fast Supabase fetch error or timeout:', err);
    }
  }

  // Fallback to LocalStorage
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      return formatDatabaseData(JSON.parse(cached));
    }
  } catch (e) {}

  return DEFAULT_DATABASE_DATA;
}

/**
 * Fast Parallel Save to Supabase Cloud Database
 */
export async function saveDatabase(data: TournamentDatabaseData): Promise<boolean> {
  // Update LocalStorage cache immediately
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) {
    return true;
  }

  try {
    const nowIso = new Date().toISOString();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase save timeout')), 6000)
    );

    const fastSavePromise = (async () => {
      const promises: Promise<any>[] = [];

      // 1. Tournaments
      const tourneyPayload: any = {
        id: SUPABASE_ROW_ID,
        name: data.tournamentName,
        knockout_starting_round: data.knockoutStartingRound || 'sf',
        is_bracket_locked: Boolean(data.isBracketLocked),
        is_knockout_created: Boolean(data.isKnockoutCreated),
        is_user_portal_enabled: Boolean(data.isUserPortalEnabled),
        updated_at: nowIso,
      };

      const matchDetails: Record<string, any> = {};
      if (Array.isArray(data.matches)) {
        data.matches.forEach((m) => {
          if (m.goalDetails1 || m.goalDetails2 || m.goalPlayers1 || m.goalPlayers2 || m.cardsT1 || m.cardsT2 || m.events) {
            matchDetails[m.id] = {
              goalDetails1: m.goalDetails1,
              goalDetails2: m.goalDetails2,
              goalPlayers1: m.goalPlayers1,
              goalPlayers2: m.goalPlayers2,
              cardsT1: m.cardsT1,
              cardsT2: m.cardsT2,
              events: m.events,
            };
          }
        });
      }

      const bracketPayload = {
        r16Matches: data.r16Matches,
        qfMatches: data.qfMatches,
        sfMatches: data.sfMatches,
        finalMatch: data.finalMatch,
        matchDetails,
      };

      const saveTourney = async () => {
        let { error } = await supabase.from('tournaments').upsert({
          ...tourneyPayload,
          bracket_data: bracketPayload,
        });
        if (error && error.message?.includes('bracket_data')) {
          await supabase.from('tournaments').upsert(tourneyPayload);
        }
      };
      promises.push(saveTourney());

      // 2. Teams and Players
      const saveTeams = async () => {
        if (Array.isArray(data.teams) && data.teams.length > 0) {
          const teamsPayload = data.teams.map((t) => ({
            id: String(t.id),
            name: t.name,
            name_en: t.nameEn || t.name,
            short_name: t.shortName || t.name.slice(0, 3).toUpperCase(),
            logo: t.logo || '',
          }));

          await supabase.from('teams').upsert(teamsPayload);

          // Delete removed teams safely
          const currentTeamIds = data.teams.map((t) => String(t.id));
          const formattedIds = `("${currentTeamIds.join('","')}")`;
          await supabase.from('players').delete().not('team_id', 'in', formattedIds);
          await supabase.from('teams').delete().not('id', 'in', formattedIds);

          // Save players
          const playersPayload: any[] = [];
          data.teams.forEach((t) => {
            if (Array.isArray(t.players)) {
              t.players.forEach((p) => {
                playersPayload.push({
                  id: String(p.id),
                  team_id: String(t.id),
                  name: p.name,
                  number: String(p.number || ''),
                  position: p.position || 'กองหน้า',
                });
              });
            }
          });

          if (playersPayload.length > 0) {
            await supabase.from('players').upsert(playersPayload);
            const playerIds = playersPayload.map((p) => String(p.id));
            await supabase.from('players').delete().not('id', 'in', `("${playerIds.join('","')}")`);
          } else {
            await supabase.from('players').delete().neq('id', '___');
          }
        } else {
          // If teams array is empty, delete all players and teams
          await supabase.from('players').delete().neq('id', '___');
          await supabase.from('teams').delete().neq('id', '___');
        }
      };
      promises.push(saveTeams());

      // 3. Groups & Group Teams
      const saveGroups = async () => {
        const groupNames = data.groups && typeof data.groups === 'object' ? Object.keys(data.groups) : [];
        const { data: existingGroups } = await supabase
          .from('groups')
          .select('id, name')
          .eq('tournament_id', SUPABASE_ROW_ID);

        const existingMap = new Map((existingGroups || []).map((g: any) => [g.name, g.id]));

        // Delete groups removed from state
        const groupsToDelete = (existingGroups || []).filter((g: any) => !groupNames.includes(g.name));
        if (groupsToDelete.length > 0) {
          const deleteIds = groupsToDelete.map((g: any) => g.id);
          await supabase.from('group_teams').delete().in('group_id', deleteIds);
          await supabase.from('groups').delete().in('id', deleteIds);
        }

        // Compute group standings stats
        const standings = calculateGroupStandings(data.groups || {}, data.matches || []);

        // Process groups
        for (const gName of groupNames) {
          let gId = existingMap.get(gName);
          if (!gId) {
            const { data: newG } = await supabase
              .from('groups')
              .insert({ tournament_id: SUPABASE_ROW_ID, name: gName })
              .select('id')
              .single();
            if (newG) gId = newG.id;
          }

          if (gId) {
            const teamsInG = data.groups[gName] || [];
            const groupStats = standings[gName] || [];
            const statsByTeamId = new Map(groupStats.map((st) => [String(st.team.id), st]));

            await supabase.from('group_teams').delete().eq('group_id', gId);
            if (teamsInG.length > 0) {
              const uniqueTeamIds = Array.from(new Set(teamsInG.map((t) => String(t.id))));
              const gtPayload = uniqueTeamIds.map((tId) => {
                const stat = statsByTeamId.get(tId);
                return {
                  group_id: gId,
                  team_id: tId,
                  played: stat ? stat.p : 0,
                  wins: stat ? stat.w : 0,
                  draws: stat ? stat.d : 0,
                  losses: stat ? stat.l : 0,
                  goals_for: stat ? stat.gf : 0,
                  goals_against: stat ? stat.ga : 0,
                  goal_difference: stat ? stat.gd : 0,
                  points: stat ? stat.pts : 0,
                };
              });
              await supabase.from('group_teams').insert(gtPayload);
            }
          }
        }
      };
      promises.push(saveGroups());

      // 4. Matches, Goals, and Cards
      const saveMatches = async () => {
        if (Array.isArray(data.matches) && data.matches.length > 0) {
          const { data: currentGroups } = await supabase
            .from('groups')
            .select('id, name')
            .eq('tournament_id', SUPABASE_ROW_ID);
          const groupNameToId = new Map((currentGroups || []).map((g: any) => [g.name, g.id]));
          const validTeamIds = new Set((data.teams || []).map((t) => String(t.id)));

          const matchesPayload = data.matches.map((m) => {
            const isHomeTeamReal = m.team1?.id && validTeamIds.has(String(m.team1.id));
            const isAwayTeamReal = m.team2?.id && validTeamIds.has(String(m.team2.id));
            const isKnockout = m.group === 'Knockout' || m.group?.includes('น็อคเอาท์');

            return {
              id: String(m.id),
              tournament_id: SUPABASE_ROW_ID,
              group_id: groupNameToId.get(m.group) || null,
              home_team_id: isHomeTeamReal ? String(m.team1.id) : null,
              away_team_id: isAwayTeamReal ? String(m.team2.id) : null,
              home_team_name: m.team1?.name || null,
              away_team_name: m.team2?.name || null,
              home_team_logo: m.team1?.logo || null,
              away_team_logo: m.team2?.logo || null,
              home_score: typeof m.score1 === 'number' ? m.score1 : 0,
              away_score: typeof m.score2 === 'number' ? m.score2 : 0,
              penalty_home_score: m.penaltyScore1 ?? null,
              penalty_away_score: m.penaltyScore2 ?? null,
              match_date: m.dateStr || '',
              match_time: m.timeStr || '',
              venue: m.venue || 'สนามหลัก',
              status: m.status || 'UPCOMING',
              status_label: m.statusLabel || '',
              current_minute: m.currentMinute || (m.matchNumber ? `คู่ที่ ${m.matchNumber}` : ''),
              stage: isKnockout ? 'knockout' : 'group',
              round_name: m.round || 'รอบแบ่งกลุ่ม',
              matchday: m.matchNumber || m.matchday || 1,
            };
          });

          await supabase.from('matches').upsert(matchesPayload);
          const currentMatchIds = `("${matchesPayload.map((m) => m.id).join('","')}")`;
          await supabase.from('matches').delete().eq('tournament_id', SUPABASE_ROW_ID).not('id', 'in', currentMatchIds);

          // Extract and sync goals and cards
          const allGoalsPayload: any[] = [];
          const allCardsPayload: any[] = [];
          const validMatchIds = Array.from(new Set(data.matches.map((m) => String(m.id))));

          data.matches.forEach((m) => {
            const mId = String(m.id);
            // Team 1 Goals
            if (Array.isArray(m.goalDetails1) && m.goalDetails1.length > 0) {
              m.goalDetails1.forEach((g) => {
                allGoalsPayload.push({
                  match_id: mId,
                  team_id: m.team1?.id ? String(m.team1.id) : null,
                  player_number: String(g.playerNumber || ''),
                  minute: typeof g.minute === 'number' ? g.minute : 0,
                  added_time: 0,
                  goal_type: 'normal',
                });
              });
            } else if (m.goalPlayers1 && typeof m.goalPlayers1 === 'string') {
              const nums = m.goalPlayers1.split(',').map((s) => s.trim().replace(/^เบอร์\s*/i, '')).filter(Boolean);
              nums.forEach((num) => {
                allGoalsPayload.push({
                  match_id: mId,
                  team_id: m.team1?.id ? String(m.team1.id) : null,
                  player_number: num,
                  minute: 0,
                  added_time: 0,
                  goal_type: 'normal',
                });
              });
            }

            // Team 2 Goals
            if (Array.isArray(m.goalDetails2) && m.goalDetails2.length > 0) {
              m.goalDetails2.forEach((g) => {
                allGoalsPayload.push({
                  match_id: mId,
                  team_id: m.team2?.id ? String(m.team2.id) : null,
                  player_number: String(g.playerNumber || ''),
                  minute: typeof g.minute === 'number' ? g.minute : 0,
                  added_time: 0,
                  goal_type: 'normal',
                });
              });
            } else if (m.goalPlayers2 && typeof m.goalPlayers2 === 'string') {
              const nums = m.goalPlayers2.split(',').map((s) => s.trim().replace(/^เบอร์\s*/i, '')).filter(Boolean);
              nums.forEach((num) => {
                allGoalsPayload.push({
                  match_id: mId,
                  team_id: m.team2?.id ? String(m.team2.id) : null,
                  player_number: num,
                  minute: 0,
                  added_time: 0,
                  goal_type: 'normal',
                });
              });
            }

            // Cards Team 1
            if (m.cardsT1?.details && Array.isArray(m.cardsT1.details)) {
              m.cardsT1.details.forEach((c) => {
                allCardsPayload.push({
                  match_id: mId,
                  team_id: m.team1?.id ? String(m.team1.id) : null,
                  player_number: String(c.playerNumber || ''),
                  card_type: c.type === 'red' ? 'red' : 'yellow',
                  minute: 0,
                  reason: null,
                });
              });
            }

            // Cards Team 2
            if (m.cardsT2?.details && Array.isArray(m.cardsT2.details)) {
              m.cardsT2.details.forEach((c) => {
                allCardsPayload.push({
                  match_id: mId,
                  team_id: m.team2?.id ? String(m.team2.id) : null,
                  player_number: String(c.playerNumber || ''),
                  card_type: c.type === 'red' ? 'red' : 'yellow',
                  minute: 0,
                  reason: null,
                });
              });
            }
          });

          // Sync goals and cards
          if (validMatchIds.length > 0) {
            await supabase.from('goals').delete().in('match_id', validMatchIds);
            if (allGoalsPayload.length > 0) {
              await supabase.from('goals').insert(allGoalsPayload);
            }

            await supabase.from('cards').delete().in('match_id', validMatchIds);
            if (allCardsPayload.length > 0) {
              await supabase.from('cards').insert(allCardsPayload);
            }
          }
        } else {
          // If matches array is empty, delete all matches, goals, and cards for this tournament
          await supabase.from('matches').delete().eq('tournament_id', SUPABASE_ROW_ID);
        }
      };
      promises.push(saveMatches());

      // 5. Admin Profile
      if (data.adminCredentials) {
        promises.push(
          (async () => {
            await supabase.from('profiles').upsert(
              {
                username: data.adminCredentials?.username || 'admin',
                password_hash: data.adminCredentials?.passwordHash || '1234',
                role: 'admin',
              },
              { onConflict: 'username' }
            );
          })()
        );
      }

      await Promise.all(promises);
      return true;
    })();

    await Promise.race([fastSavePromise, timeoutPromise]);
    return true;
  } catch (err) {
    console.warn('Supabase fast save error:', err);
    return false;
  }
}

/**
 * Reset database across Supabase and Local
 */
export async function resetDatabase(): Promise<TournamentDatabaseData> {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_DATABASE_DATA));
  } catch (e) {}

  if (isSupabaseConfigured && supabase) {
    try {
      await Promise.all([
        supabase.from('tournaments').delete().eq('id', SUPABASE_ROW_ID),
        supabase.from('teams').delete().neq('id', ''),
        supabase.from('groups').delete().eq('tournament_id', SUPABASE_ROW_ID),
        supabase.from('matches').delete().eq('tournament_id', SUPABASE_ROW_ID),
      ]);
    } catch (err) {}
  }

  return DEFAULT_DATABASE_DATA;
}

export function loadDatabaseSync(): TournamentDatabaseData {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}
  return DEFAULT_DATABASE_DATA;
}
