import { Team, Match, TeamStanding, GroupMap, TopScorer } from '../types';

/**
 * Normalizes group name / key into a standard group identifier (e.g. "A", "B", "C", "D")
 * Handles: "A", "สาย A", "กลุ่ม A", "Group A", "group a", "สาย A (ชาย)", "กลุ่ม 1", "1"
 */
export function normalizeGroupCode(name?: string): string {
  if (!name) return '';
  const s = name.trim();
  const cleaned = s
    .replace(/^(?:กลุ่มการแข่งขัน|สายการแข่งขัน|กลุ่ม|สาย|group)\s*/gi, '')
    .trim();

  const m = cleaned.match(/^([A-Za-z0-9]+)/i);
  if (m) {
    return m[1].toUpperCase();
  }
  return cleaned.toUpperCase();
}

/**
 * Normalizes group key for label comparison (e.g. "สาย A" -> "A")
 */
export function normalizeGroupKey(key?: string): string {
  if (!key) return '';
  return key
    .replace(/^(?:กลุ่มการแข่งขัน|สายการแข่งขัน|กลุ่ม|สาย|group)\s*/gi, '')
    .trim()
    .toUpperCase();
}

/**
 * Parses any seed string format into group letter and rank number.
 * Supported formats:
 * - "A1", "B2", "C1", "D2", "E1", "F2", "A-1", "A_1"
 * - "1A", "2B", "1st Group A", "2nd Group B"
 * - "ที่ 1 สาย A", "อันดับ 2 สาย B", "ที่ 1 กลุ่ม A", "อันดับ 1 ของสาย A"
 * - "สาย A อันดับ 1", "สาย B อันดับ 2", "สาย A ที่ 1", "กลุ่ม A ที่ 1"
 * - "สาย A (1)", "สาย A (อันดับ 1)", "Group A 1", "Group A1", "Group A (1)"
 */
export function parseSeedString(seedStr?: string): { groupLetter: string; rankNum: number } | null {
  if (!seedStr || seedStr === '-' || seedStr.trim() === '') return null;
  const s = seedStr.trim();

  // Pattern 1: A1, A-1, A_1, สาย A1, สาย A 1, กลุ่ม A 1, Group A1, Group A 1, สาย A-1
  let m = s.match(/^(?:กลุ่มการแข่งขัน|สายการแข่งขัน|กลุ่ม|สาย|group)?\s*([A-Za-z0-9]+)\s*[-_]?\s*(?:อันดับ|ที่)?\s*(\d+)$/i);
  if (m) {
    const g = normalizeGroupCode(m[1]);
    const r = parseInt(m[2], 10);
    if (r > 0) return { groupLetter: g, rankNum: r };
  }

  // Pattern 2: สาย A อันดับ 1, สาย A ที่ 1, กลุ่ม A อันดับ 1, สาย A (1), สาย A (อันดับ 1), Group A (1)
  m = s.match(/^(?:กลุ่มการแข่งขัน|สายการแข่งขัน|กลุ่ม|สาย|group)?\s*([A-Za-z0-9]+)\s*(?:อันดับ|ที่|\(?อันดับ|\(?ที่|\()?[:\s]*(\d+)\)?$/i);
  if (m) {
    const g = normalizeGroupCode(m[1]);
    const r = parseInt(m[2], 10);
    if (r > 0) return { groupLetter: g, rankNum: r };
  }

  // Pattern 3: ที่ 1 สาย A, อันดับ 2 กลุ่ม B, ที่ 1 ของสาย A, อันดับ 1 ของกลุ่ม A, 1A, 2B, 1st Group A, 2nd Group B
  m = s.match(/^(?:อันดับ|ที่|rank)?\s*(\d+)(?:st|nd|rd|th)?\s*(?:ของ)?\s*(?:สายการแข่งขัน|กลุ่มการแข่งขัน|สาย|กลุ่ม|group)?\s*([A-Za-z0-9]+)$/i);
  if (m) {
    const g = normalizeGroupCode(m[2]);
    const r = parseInt(m[1], 10);
    if (r > 0) return { groupLetter: g, rankNum: r };
  }

  // Pattern 4: Generic letter followed by rank number
  m = s.match(/([A-Za-z])\s*(\d+)/i);
  if (m) {
    const g = normalizeGroupCode(m[1]);
    const r = parseInt(m[2], 10);
    if (r > 0) return { groupLetter: g, rankNum: r };
  }

  return null;
}

/**
 * Checks whether a given string is a seed placeholder (e.g. "A1", "สาย A อันดับ 1", "-", "ทีม 1")
 * as opposed to a custom/real team name.
 */
export function isSeedPlaceholder(str?: string): boolean {
  if (!str || str === '-' || str.trim() === '') return true;
  const s = str.trim();
  if (parseSeedString(s) !== null) return true;
  if (
    s.startsWith('ผู้ชนะ') ||
    s.startsWith('ทีมชนะ') ||
    s.startsWith('Winner') ||
    s.startsWith('ทีม 1') ||
    s.startsWith('ทีม 2') ||
    s === 'TBD' ||
    s === 'รอผลการแข่งขัน' ||
    s === 'รอผลแข่งขัน'
  ) {
    return true;
  }
  return false;
}

/**
 * Checks if a match is considered finished (FT)
 */
export function isMatchCompleted(m: Match): boolean {
  if (!m) return false;
  if (m.status === 'FT') return true;
  if ((m.status as string) === 'ft' || (m.status as string) === 'FINISHED') return true;
  if (m.currentMinute === 'FT') return true;
  if (m.statusLabel && (m.statusLabel.includes('จบเกม') || m.statusLabel.includes('จบการแข่งขัน'))) return true;
  if (
    m.score1 !== null &&
    m.score1 !== undefined &&
    m.score2 !== null &&
    m.score2 !== undefined &&
    m.status !== 'LIVE' &&
    m.status !== 'UPCOMING'
  ) {
    return true;
  }
  return false;
}

export function calculateTopScorers(matches: Match[], teamsList?: Team[]): TopScorer[] {
  const scorerMap = new Map<string, {
    playerNumber: number;
    teamId: string | number;
    teamName: string;
    group: string;
    goals: number;
    nameOverride?: string;
    matchesSet: Set<string>;
  }>();

  const teamRosterMap = new Map<string | number, Team>();

  const registerTeam = (t: Team) => {
    if (!t) return;
    if (t.id !== undefined && t.id !== null) {
      teamRosterMap.set(t.id, t);
      teamRosterMap.set(String(t.id), t);
    }
    if (t.name) {
      teamRosterMap.set(t.name.trim(), t);
      teamRosterMap.set(t.name.trim().toLowerCase(), t);
    }
    if (t.shortName) {
      teamRosterMap.set(t.shortName.trim(), t);
      teamRosterMap.set(t.shortName.trim().toLowerCase(), t);
    }
  };

  if (teamsList) {
    teamsList.forEach(registerTeam);
  }

  const processGoalDetails = (
    matchId: string,
    team: Team,
    group: string,
    details?: { id: string; playerNumber: string; playerName?: string }[],
    rawString?: string
  ) => {
    if (!team) return;
    registerTeam(team);

    const canonicalTeam =
      teamRosterMap.get(team.id) ||
      teamRosterMap.get(String(team.id)) ||
      (team.name ? teamRosterMap.get(team.name.trim().toLowerCase()) : null) ||
      team;

    const teamKey = (canonicalTeam.name && canonicalTeam.name.trim() !== '-' && !/^[A-D][1-4]$/i.test(canonicalTeam.name.trim()))
      ? canonicalTeam.name.trim().toLowerCase()
      : (canonicalTeam.id ? String(canonicalTeam.id) : (team.name ? team.name.trim().toLowerCase() : 'unknown'));

    const resolvedTeamId = canonicalTeam.id || team.id || teamKey;
    const resolvedTeamName = (canonicalTeam.name && canonicalTeam.name.trim() !== '-' && !/^[A-D][1-4]$/i.test(canonicalTeam.name.trim()))
      ? canonicalTeam.name.trim()
      : (team.name && team.name.trim() !== '-' ? team.name.trim() : String(resolvedTeamId));

    const list: { numStr: string; nameOverride?: string }[] = [];

    if (details && details.length > 0) {
      details.forEach((d) => {
        if (d.playerNumber && String(d.playerNumber).trim()) {
          list.push({ numStr: String(d.playerNumber).trim(), nameOverride: d.playerName });
        }
      });
    } else if (rawString && rawString.trim()) {
      rawString.split(',').forEach((s) => {
        const trimmed = s.trim();
        if (trimmed) list.push({ numStr: trimmed });
      });
    }

    list.forEach(({ numStr, nameOverride }) => {
      const num = parseInt(numStr, 10);
      if (isNaN(num)) return;

      const key = `${teamKey}_${num}`;
      let entry = scorerMap.get(key);
      if (!entry) {
        entry = {
          playerNumber: num,
          teamId: resolvedTeamId,
          teamName: resolvedTeamName,
          group: group || '',
          goals: 0,
          nameOverride: nameOverride,
          matchesSet: new Set<string>(),
        };
        scorerMap.set(key, entry);
      } else {
        if (nameOverride && (!entry.nameOverride || entry.nameOverride.startsWith('ผู้เล่นเบอร์'))) {
          entry.nameOverride = nameOverride;
        }
        if (resolvedTeamName && resolvedTeamName !== entry.teamName && !/^[A-D][1-4]$/i.test(resolvedTeamName)) {
          entry.teamName = resolvedTeamName;
        }
      }
      entry.goals += 1;
      entry.matchesSet.add(matchId);
    });
  };

  matches.forEach((m) => {
    processGoalDetails(m.id, m.team1, m.group, m.goalDetails1, m.goalPlayers1);
    processGoalDetails(m.id, m.team2, m.group, m.goalDetails2, m.goalPlayers2);
  });

  const list = Array.from(scorerMap.values()).map((item) => {
    const teamObj =
      teamRosterMap.get(item.teamId) ||
      teamRosterMap.get(String(item.teamId)) ||
      teamRosterMap.get(item.teamName.trim()) ||
      teamRosterMap.get(item.teamName.trim().toLowerCase());

    const matchedPlayer = teamObj?.players?.find(
      (p) => String(p.number).trim() === String(item.playerNumber).trim()
    );

    const playerName = matchedPlayer?.name || item.nameOverride || `ผู้เล่นเบอร์ ${item.playerNumber}`;
    const initials = matchedPlayer
      ? matchedPlayer.name.slice(0, 2).toUpperCase()
      : item.nameOverride
      ? item.nameOverride.slice(0, 2).toUpperCase()
      : `#${item.playerNumber}`;
    const position = matchedPlayer?.position || 'ผู้เล่น';

    return {
      id: `${item.teamId}_${item.playerNumber}`,
      rank: 0,
      name: playerName,
      initials,
      number: item.playerNumber,
      position,
      teamName: item.teamName,
      group: item.group,
      matchesPlayed: item.matchesSet.size,
      goals: item.goals,
    };
  });

  list.sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    return a.matchesPlayed - b.matchesPlayed;
  });

  return list.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

export function calculateGroupStandings(
  groups: GroupMap,
  matches: Match[]
): Record<string, TeamStanding[]> {
  const result: Record<string, TeamStanding[]> = {};

  const groupKeys = Object.keys(groups);

  groupKeys.forEach((groupKey) => {
    const teamsInGroup = groups[groupKey] || [];
    const standingsMap = new Map<string | number, TeamStanding>();

    teamsInGroup.forEach((team) => {
      standingsMap.set(team.id, {
        team,
        group: groupKey,
        p: 0,
        w: 0,
        d: 0,
        l: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
        form: [],
      });
      standingsMap.set(String(team.id), standingsMap.get(team.id)!);
    });

    const findStanding = (teamRef?: { id?: string | number; name?: string }) => {
      if (!teamRef) return undefined;
      if (teamRef.id !== undefined && teamRef.id !== null) {
        if (standingsMap.has(teamRef.id)) return standingsMap.get(teamRef.id);
        if (standingsMap.has(String(teamRef.id))) return standingsMap.get(String(teamRef.id));
      }
      if (teamRef.name) {
        const cleanN = teamRef.name.trim().toLowerCase();
        for (const val of standingsMap.values()) {
          if (val.team.name.trim().toLowerCase() === cleanN) return val;
        }
      }
      return undefined;
    };

    const targetGroupCode = normalizeGroupCode(groupKey);

    // Check matches for this group that are completed (FT) or live
    matches
      .filter((m) => {
        if (
          m.group === 'Knockout' ||
          m.round?.includes('น็อคเอาท์') ||
          m.round?.includes('ชิง') ||
          m.round?.includes('R16') ||
          m.round?.includes('QF') ||
          m.round?.includes('SF') ||
          m.round?.includes('Final')
        ) {
          return false;
        }

        const isLiveOrFT = isMatchCompleted(m) || m.status === 'LIVE';
        if (!isLiveOrFT) return false;

        const matchGroupCode = normalizeGroupCode(m.group);
        const matchRoundCode = normalizeGroupCode(m.round);

        const isMatchGroup =
          m.group === groupKey ||
          matchGroupCode === targetGroupCode ||
          matchRoundCode === targetGroupCode ||
          (findStanding(m.team1) !== undefined && findStanding(m.team2) !== undefined);

        return isMatchGroup;
      })
      .forEach((m) => {
        const s1 = findStanding(m.team1);
        const s2 = findStanding(m.team2);

        if (s1 && s2) {
          const sc1 = Number(m.score1 ?? (m.team1 as any)?.score ?? 0) || 0;
          const sc2 = Number(m.score2 ?? (m.team2 as any)?.score ?? 0) || 0;

          s1.p += 1;
          s2.p += 1;
          s1.gf += sc1;
          s1.ga += sc2;
          s2.gf += sc2;
          s2.ga += sc1;

          if (sc1 > sc2) {
            s1.w += 1;
            s1.pts += 3;
            s1.form.push('W');
            s2.l += 1;
            s2.form.push('L');
          } else if (sc1 < sc2) {
            s2.w += 1;
            s2.pts += 3;
            s2.form.push('W');
            s1.l += 1;
            s1.form.push('L');
          } else {
            s1.d += 1;
            s1.pts += 1;
            s1.form.push('D');
            s2.d += 1;
            s2.pts += 1;
            s2.form.push('D');
          }
        }
      });

    // Calculate GD
    const standingsList = Array.from(new Set(standingsMap.values())).map((item) => ({
      ...item,
      gd: item.gf - item.ga,
    }));

    // If matches are low (e.g. at start), we ensure teams with scores show accurately
    standingsList.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team.name.localeCompare(b.team.name, 'th');
    });

    result[groupKey] = standingsList;
  });

  return result;
}

/**
 * Checks if all matches in a specific group have completed (status === 'FT').
 */
export function isGroupMatchesCompleted(
  groupKey: string,
  matches: Match[],
  groups?: GroupMap
): boolean {
  if (!matches || matches.length === 0) return false;

  const targetGroupCode = normalizeGroupCode(groupKey);

  const groupTeams = groups && groups[groupKey] ? groups[groupKey] : undefined;
  const groupTeamIds = groupTeams ? new Set(groupTeams.map((t) => String(t.id))) : null;
  const groupTeamNames = groupTeams ? new Set(groupTeams.map((t) => t.name.trim().toLowerCase())) : null;

  const matchesInGroup = matches.filter((m) => {
    // Exclude knockout matches
    if (
      m.group === 'Knockout' ||
      m.round?.includes('น็อคเอาท์') ||
      m.round?.includes('ชิง') ||
      m.round?.includes('R16') ||
      m.round?.includes('QF') ||
      m.round?.includes('SF') ||
      m.round?.includes('Final')
    ) {
      return false;
    }

    // Match by group code / name
    if (m.group) {
      const matchGroupCode = normalizeGroupCode(m.group);
      if (matchGroupCode && matchGroupCode === targetGroupCode) {
        return true;
      }
      if (m.group === groupKey || m.group.trim().toUpperCase() === groupKey.trim().toUpperCase()) {
        return true;
      }
    }

    // Match by round string if round contains group name
    if (m.round) {
      const roundGroupCode = normalizeGroupCode(m.round);
      if (roundGroupCode && roundGroupCode === targetGroupCode) {
        return true;
      }
    }

    // Match by team membership if group teams data is available
    if (groupTeamIds || groupTeamNames) {
      const t1Id = m.team1?.id !== undefined && m.team1?.id !== null ? String(m.team1.id) : '';
      const t2Id = m.team2?.id !== undefined && m.team2?.id !== null ? String(m.team2.id) : '';
      const t1Name = m.team1?.name?.trim().toLowerCase() || '';
      const t2Name = m.team2?.name?.trim().toLowerCase() || '';

      const t1InGroup = (groupTeamIds && groupTeamIds.has(t1Id)) || (groupTeamNames && groupTeamNames.has(t1Name));
      const t2InGroup = (groupTeamIds && groupTeamIds.has(t2Id)) || (groupTeamNames && groupTeamNames.has(t2Name));

      if (t1InGroup && t2InGroup) {
        return true;
      }
    }

    return false;
  });

  if (matchesInGroup.length === 0) return false;

  return matchesInGroup.every(isMatchCompleted);
}

/**
 * Dynamic resolution of group seed placeholders (e.g., "A1", "B2", "C1", "ที่ 1 สาย A", "อันดับ 2 กลุ่ม B")
 * to actual qualified team names and logos based on calculated group standings.
 * Does NOT hardcode ranks — respects whatever seed placeholder is specified in the knockout bracket matchup.
 * By default, requires all matches in the group to be finished ('FT') before resolving.
 */
export function resolveSeedFromStandings(
  seedStr: string,
  standings: Record<string, TeamStanding[]>,
  matches?: Match[],
  options?: { requireAllGroupMatchesFinished?: boolean; groups?: GroupMap }
): { name: string; logo: string } | null {
  if (!seedStr || seedStr === '-' || seedStr.trim() === '') return null;

  const parsed = parseSeedString(seedStr);
  if (!parsed) return null;

  const { groupLetter, rankNum } = parsed;

  const groupKey = Object.keys(standings).find((k) => {
    const code = normalizeGroupCode(k);
    return (
      code === groupLetter ||
      k.trim().toUpperCase() === groupLetter ||
      normalizeGroupKey(k) === groupLetter
    );
  });

  if (groupKey && standings[groupKey]) {
    const requireFinished = options?.requireAllGroupMatchesFinished ?? true;
    if (requireFinished && matches) {
      if (!isGroupMatchesCompleted(groupKey, matches, options?.groups)) {
        return null;
      }
    }

    const list = standings[groupKey];
    if (list && list[rankNum - 1]) {
      const teamObj = list[rankNum - 1].team;
      return {
        name: teamObj.name,
        logo: teamObj.logo || '',
      };
    }
  }

  return null;
}

