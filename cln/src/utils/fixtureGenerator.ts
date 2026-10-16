import { Team, Match, GroupMap } from '../types';

interface GenerateFixturesOptions {
  startDate?: string;
  startHour?: number; // default 9 (09:00)
  startMinute?: number; // default 0 (09:00)
  matchIntervalMinutes?: number; // default 75 mins
  matchesPerDay?: number; // default 6 matches per day
  venues?: string[];
}

/**
 * Generates Round-Robin matches for each group where every team plays every other team in the group.
 * The matches are interleaved across groups round-by-round (Group A match 1, Group B match 1, Group C match 1...
 * then Group A match 2, Group B match 2, etc.) as requested:
 * "การสร้างตารางการแข่งจะเป็นการเจอกันทั้งในกลุ่ม และเรียงการแข่งขันเป็นการแข่งเรียงกลุ่มละนัดไล่จนครบ"
 */
export function generateInterleavedRoundRobinMatches(
  groups: GroupMap,
  options: GenerateFixturesOptions = {}
): Match[] {
  const groupKeys = Object.keys(groups).filter(
    (gKey) => groups[gKey] && groups[gKey].length >= 2
  );

  if (groupKeys.length === 0) {
    return [];
  }

  const {
    startHour = 9,
    startMinute = 0,
    matchIntervalMinutes = 75,
    matchesPerDay = 999,
    venues = [],
  } = options;

  // 1. Generate Round Robin match pairings for each group using standard polygon/circle method
  // to ensure fair rest and clean rounds.
  const groupMatchQueues: Record<string, { team1: Team; team2: Team; roundNum: number }[]> = {};

  groupKeys.forEach((gKey) => {
    const teams = [...groups[gKey]];
    const n = teams.length;
    const isOdd = n % 2 !== 0;
    const count = isOdd ? n + 1 : n;
    const roundsCount = count - 1;
    const matchesPerRound = count / 2;

    const groupMatches: { team1: Team; team2: Team; roundNum: number }[] = [];

    // Array of indices
    const indices: (number | null)[] = Array.from({ length: n }, (_, i) => i);
    if (isOdd) {
      indices.push(null); // dummy / bye
    }

    for (let r = 0; r < roundsCount; r++) {
      for (let m = 0; m < matchesPerRound; m++) {
        const homeIdx = indices[m];
        const awayIdx = indices[count - 1 - m];

        if (homeIdx !== null && awayIdx !== null) {
          // Alternate home/away based on round for fairness
          const isSwap = (r + m) % 2 === 1;
          const t1 = isSwap ? teams[awayIdx] : teams[homeIdx];
          const t2 = isSwap ? teams[homeIdx] : teams[awayIdx];

          groupMatches.push({
            team1: t1,
            team2: t2,
            roundNum: r + 1,
          });
        }
      }

      // Rotate indices, keeping first index fixed (standard polygon method)
      const fixed = indices[0];
      const rest = indices.slice(1);
      const last = rest.pop();
      if (last !== undefined) {
        rest.unshift(last);
      }
      indices.splice(0, indices.length, fixed, ...rest);
    }

    groupMatchQueues[gKey] = groupMatches;
  });

  // 2. Interleave matches across groups:
  // Take 1 match from Group A, then 1 match from Group B, then 1 match from Group C...
  // Repeat circulating until all matches are scheduled.
  const interleavedPairings: {
    group: string;
    team1: Team;
    team2: Team;
    roundNum: number;
  }[] = [];

  let hasMore = true;
  let cycle = 0;

  while (hasMore) {
    hasMore = false;
    groupKeys.forEach((gKey) => {
      const queue = groupMatchQueues[gKey];
      if (queue && queue.length > 0) {
        const nextMatch = queue.shift()!;
        interleavedPairings.push({
          group: gKey,
          team1: nextMatch.team1,
          team2: nextMatch.team2,
          roundNum: nextMatch.roundNum,
        });
        if (queue.length > 0) {
          hasMore = true;
        }
      }
    });
    cycle++;
    if (cycle > 500) break; // safety guard
  }

  // 3. Convert pairings into complete Match objects with sequential timing & dates
  const dayThaiNames = [
    'วันเสาร์ที่ 17 ตุลาคม 2026',
    'วันอาทิตย์ที่ 18 ตุลาคม 2026',
    'วันเสาร์ที่ 24 ตุลาคม 2026',
    'วันอาทิตย์ที่ 25 ตุลาคม 2026',
    'วันเสาร์ที่ 31 ตุลาคม 2026',
    'วันอาทิตย์ที่ 1 พฤศจิกายน 2026',
  ];

  const nowTimestamp = Date.now();

  const generatedMatches: Match[] = interleavedPairings.map((pairing, index) => {
    const matchNumber = index + 1;
    const dayIndex = Math.floor(index / matchesPerDay);
    const matchInDayIndex = index % matchesPerDay;

    // Calculate time for this match
    const totalMinutes =
      startHour * 60 + startMinute + matchInDayIndex * matchIntervalMinutes;
    const matchHour = Math.floor(totalMinutes / 60);
    const matchMinute = totalMinutes % 60;
    const timeStr = `${String(matchHour).padStart(2, '0')}:${String(
      matchMinute
    ).padStart(2, '0')}`;

    const dateStr =
      dayThaiNames[dayIndex % dayThaiNames.length] ||
      `วันแข่งขันที่ ${dayIndex + 1}`;

    const venue = venues.length > 0 ? venues[index % venues.length] : '';

    return {
      id: `match-gen-${nowTimestamp}-${matchNumber}`,
      matchday: dayIndex + 1,
      matchNumber,
      dateStr,
      timeStr,
      round: 'รอบแบ่งกลุ่ม (Group Stage)',
      group: pairing.group,
      venue,
      team1: pairing.team1,
      team2: pairing.team2,
      score1: 0,
      score2: 0,
      status: 'UPCOMING',
      statusLabel: `รอแข่ง ${timeStr} น.`,
      currentMinute: `คู่ที่ ${matchNumber}`,
      cardsT1: { yellow: 0, red: 0 },
      cardsT2: { yellow: 0, red: 0 },
      events: [],
    };
  });

  return generatedMatches;
}

/**
 * Re-aligns sequential times and match numbers for an existing list of matches
 * (useful after dragging and dropping matches up and down).
 */
function formatThaiDateFromObj(d: Date): string {
  const dayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const dayName = dayNames[d.getDay()];
  const dayNum = d.getDate();
  const monthName = monthNames[d.getMonth()];
  const yearStr = d.getFullYear();
  return `${dayName}ที่ ${dayNum} ${monthName} ${yearStr}`;
}

export function realignMatchTimesAndNumbers(
  matches: Match[],
  options: GenerateFixturesOptions = {}
): Match[] {
  const {
    startDate,
    startHour = 9,
    startMinute = 0,
    matchIntervalMinutes = 75,
    matchesPerDay = 999,
    venues = [],
  } = options;

  const dayThaiNames = [
    'วันเสาร์ที่ 17 ตุลาคม 2026',
    'วันอาทิตย์ที่ 18 ตุลาคม 2026',
    'วันเสาร์ที่ 24 ตุลาคม 2026',
    'วันอาทิตย์ที่ 25 ตุลาคม 2026',
    'วันเสาร์ที่ 31 ตุลาคม 2026',
    'วันอาทิตย์ที่ 1 พฤศจิกายน 2026',
  ];

  return matches.map((m, index) => {
    const matchNumber = index + 1;
    const dayIndex = Math.floor(index / matchesPerDay);
    const matchInDayIndex = index % matchesPerDay;

    const totalMinutes =
      startHour * 60 + startMinute + matchInDayIndex * matchIntervalMinutes;
    const matchHour = Math.floor(totalMinutes / 60);
    const matchMinute = totalMinutes % 60;
    const timeStr = `${String(matchHour).padStart(2, '0')}:${String(
      matchMinute
    ).padStart(2, '0')}`;

    let dateStr = '';
    if (startDate) {
      const [y, mon, d] = startDate.split('-').map(Number);
      if (y && mon && d) {
        const targetDate = new Date(y, mon - 1, d + dayIndex);
        dateStr = formatThaiDateFromObj(targetDate);
      }
    }
    if (!dateStr) {
      dateStr =
        dayThaiNames[dayIndex % dayThaiNames.length] ||
        `วันแข่งขันที่ ${dayIndex + 1}`;
    }

    const assignedVenue =
      venues.length > 0
        ? venues[index % venues.length]
        : (m.venue || '');

    return {
      ...m,
      matchNumber,
      matchday: dayIndex + 1,
      dateStr,
      timeStr,
      venue: assignedVenue,
      statusLabel:
        m.status === 'UPCOMING' ? `รอแข่ง ${timeStr} น.` : m.statusLabel,
      currentMinute:
        m.status === 'UPCOMING'
          ? `คู่ที่ ${matchNumber}`
          : m.currentMinute,
    };
  });
}
