import React, { useState, useMemo } from 'react';
import { Team, Match, GroupMap, BracketMatchup, GoalDetail } from '../types';
import { formatMatchGroupLabel } from './MatchesFixturesView';
import { calculateGroupStandings, calculateTopScorers, resolveSeedFromStandings, parseSeedString, isSeedPlaceholder } from '../utils/standingsCalculator';
import { TeamLogo } from './TeamLogo';

export const formatGoalscorersString = (
  goalDetails?: GoalDetail[],
  goalPlayers?: string
): string => {
  if (goalDetails && goalDetails.length > 0) {
    const nums = goalDetails.map((g) => String(g.playerNumber).trim()).filter(Boolean);
    return nums.length > 0 ? `เบอร์ ${nums.join(', ')}` : '';
  }
  if (goalPlayers && goalPlayers.trim()) {
    const nums = goalPlayers
      .split(',')
      .map((s) => s.trim().replace(/^เบอร์\s*/i, ''))
      .filter(Boolean);
    return nums.length > 0 ? `เบอร์ ${nums.join(', ')}` : '';
  }
  return '';
};
import {
  Trophy,
  CalendarDays,
  Award,
  GitFork,
  Search,
  Clock,
  MapPin,
  Eye,
  Shield,
  CheckCircle2,
  Radio,
  ExternalLink,
  ChevronRight,
  Filter,
  X,
  Share2,
  Users,
  Sparkles,
  ListOrdered,
  LayoutGrid,
  List,
  Calendar,
  Info,
} from 'lucide-react';
import { SoccerBall } from './icons/SoccerBall';

type UserTab = 'fixtures' | 'standings' | 'bracket';

interface UserPortalViewProps {
  tournamentName: string;
  matches: Match[];
  groups: GroupMap;
  teams: Team[];
  knockoutStartingRound?: 'r16' | 'qf' | 'sf' | 'final';
  r16Matches?: BracketMatchup[];
  qfMatches: BracketMatchup[];
  sfMatches: BracketMatchup[];
  finalMatch: BracketMatchup;
  onSwitchToAdmin: () => void;
  activeTab?: UserTab;
  onTabChange?: (tab: UserTab) => void;
}

const DEFAULT_R16_SEED_PAIRS: [string, string][] = [
  ['A1', 'B2'],
  ['C1', 'D2'],
  ['B1', 'A2'],
  ['D1', 'C2'],
  ['E1', 'F2'],
  ['G1', 'H2'],
  ['F1', 'E2'],
  ['H1', 'G2'],
];

const DEFAULT_QF_SEED_PAIRS: [string, string][] = [
  ['A1', 'B2'],
  ['B1', 'C2'],
  ['C1', 'A2'],
  ['D1', 'D2'],
];

const DEFAULT_SF_SEED_PAIRS: [string, string][] = [
  ['A1', 'B2'],
  ['B1', 'A2'],
];

const formatSeedText = (seed: string): string => {
  if (!seed || seed === '-') return '-';
  const parsed = parseSeedString(seed);
  if (parsed) {
    return `อันดับ ${parsed.rankNum} สาย ${parsed.groupLetter}`;
  }
  return seed;
};

const resolveKnockoutSlotName = (
  rawName: string | undefined,
  defaultSeedCode: string,
  standings: Record<string, any[]>,
  matchesList: Match[],
  groups?: GroupMap
): string => {
  const seedCodeToTry = rawName && rawName !== '-' && rawName.trim() !== '' ? rawName : defaultSeedCode;

  const resolved = resolveSeedFromStandings(seedCodeToTry, standings, matchesList, { requireAllGroupMatchesFinished: true, groups });
  if (resolved) {
    return resolved.name;
  }

  if (
    rawName &&
    rawName !== '-' &&
    !isSeedPlaceholder(rawName) &&
    !rawName.startsWith('ผู้ชนะ') &&
    !rawName.startsWith('ทีมชนะ')
  ) {
    return rawName;
  }

  return formatSeedText(seedCodeToTry);
};

export const getKnockoutMatchWinner = (
  sm: Match | undefined,
  bm: BracketMatchup | undefined
): { winnerIndex: 1 | 2 | null; winnerName: string | null } => {
  if (sm && sm.status === 'FT') {
    if (sm.score1 > sm.score2) return { winnerIndex: 1, winnerName: sm.team1?.name || null };
    if (sm.score2 > sm.score1) return { winnerIndex: 2, winnerName: sm.team2?.name || null };
    if (sm.score1 === sm.score2) {
      if (
        sm.penaltyScore1 !== undefined &&
        sm.penaltyScore1 !== null &&
        sm.penaltyScore2 !== undefined &&
        sm.penaltyScore2 !== null
      ) {
        if (sm.penaltyScore1 > sm.penaltyScore2) return { winnerIndex: 1, winnerName: sm.team1?.name || null };
        if (sm.penaltyScore2 > sm.penaltyScore1) return { winnerIndex: 2, winnerName: sm.team2?.name || null };
      }
    }
  }

  if (bm) {
    if (bm.winner === 1) return { winnerIndex: 1, winnerName: bm.team1?.name || null };
    if (bm.winner === 2) return { winnerIndex: 2, winnerName: bm.team2?.name || null };
    if (bm.team1?.score !== undefined && bm.team2?.score !== undefined) {
      if (bm.team1.score > bm.team2.score) return { winnerIndex: 1, winnerName: bm.team1?.name || null };
      if (bm.team2.score > bm.team1.score) return { winnerIndex: 2, winnerName: bm.team2?.name || null };
      if (bm.team1.score === bm.team2.score) {
        if (
          bm.team1.penaltyScore !== undefined &&
          bm.team1.penaltyScore !== null &&
          bm.team2.penaltyScore !== undefined &&
          bm.team2.penaltyScore !== null
        ) {
          if (bm.team1.penaltyScore > bm.team2.penaltyScore) return { winnerIndex: 1, winnerName: bm.team1?.name || null };
          if (bm.team2.penaltyScore > bm.team1.penaltyScore) return { winnerIndex: 2, winnerName: bm.team2?.name || null };
        }
      }
    }
  }

  return { winnerIndex: null, winnerName: null };
};

const BracketConnector: React.FC<{ color?: string }> = ({ color = '#cbd5e1' }) => {
  return (
    <div className="w-6 sm:w-10 h-full flex items-center justify-center shrink-0 py-2">
      <svg
        className="w-full h-full overflow-visible shrink-0 pointer-events-none"
        viewBox="0 0 40 100"
        preserveAspectRatio="none"
      >
        <path
          d="M 0 25 H 20 V 75 H 0 M 20 50 H 40"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};

export const UserPortalView: React.FC<UserPortalViewProps> = ({
  tournamentName,
  matches,
  groups,
  teams,
  knockoutStartingRound = 'sf',
  r16Matches = [],
  qfMatches,
  sfMatches,
  finalMatch,
  onSwitchToAdmin,
  activeTab: controlledActiveTab,
  onTabChange,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<UserTab>('fixtures');
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const setActiveTab = (tab: UserTab) => {
    setInternalActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [matchViewStyle, setMatchViewStyle] = useState<'sequence' | 'byDate'>('sequence');
  const [matchDisplayMode, setMatchDisplayMode] = useState<'card' | 'table'>('card');
  const [bracketMobileRound, setBracketMobileRound] = useState<'all' | 'r16' | 'qf' | 'sf' | 'final'>('all');
  const [activeDetailMatch, setActiveDetailMatch] = useState<Match | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Calculate live group standings
  const computedStandings = useMemo(
    () => calculateGroupStandings(groups || {}, matches),
    [groups, matches]
  );

  const topScorers = useMemo(
    () => calculateTopScorers(matches, teams),
    [matches, teams]
  );

  const groupKeys = useMemo(() => Object.keys(groups), [groups]);

  const knockoutRoundLabel = useMemo(() => {
    switch (knockoutStartingRound) {
      case 'r16':
        return 'รอบ 16 ทีม';
      case 'qf':
        return 'รอบ 8 ทีม';
      case 'sf':
        return 'รอบรองชนะเลิศ';
      case 'final':
        return 'รอบชิงชนะเลิศ';
      default:
        return 'รอบน็อคเอาท์';
    }
  }, [knockoutStartingRound]);

  const totalKnockoutSlots = useMemo(() => {
    switch (knockoutStartingRound) {
      case 'r16':
        return 16;
      case 'qf':
        return 8;
      case 'sf':
        return 4;
      case 'final':
        return 2;
      default:
        return 4;
    }
  }, [knockoutStartingRound]);

  const numGroups = groupKeys.length || 1;
  const qualifyCountPerGroup = Math.max(1, Math.floor(totalKnockoutSlots / numGroups));

  const qualificationZoneText = useMemo(() => {
    if (qualifyCountPerGroup === 1) {
      return `อันดับ 1 โซนเข้ารอบ${knockoutRoundLabel}`;
    }
    return `อันดับ 1-${qualifyCountPerGroup} โซนเข้ารอบ${knockoutRoundLabel}`;
  }, [qualifyCountPerGroup, knockoutRoundLabel]);

  // Match statistics summary
  const liveCount = matches.filter((m) => m.status === 'LIVE').length;
  const ftCount = matches.filter((m) => m.status === 'FT').length;
  const upcomingCount = matches.filter((m) => m.status === 'UPCOMING').length;

  // Filter matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Group filter
      if (selectedGroupFilter !== 'all') {
        const normGroup = (g: string) => (g || '').replace(/^กลุ่ม\s*/, '').trim().toUpperCase();
        if (m.group !== selectedGroupFilter && normGroup(m.group) !== normGroup(selectedGroupFilter)) {
          return false;
        }
      }
      // Status filter
      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'LIVE' && m.status !== 'LIVE') return false;
        if (selectedStatusFilter === 'FT' && m.status !== 'FT') return false;
        if (selectedStatusFilter === 'UPCOMING' && m.status !== 'UPCOMING') return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const t1Name = m.team1.name.toLowerCase();
        const t2Name = m.team2.name.toLowerCase();
        const venue = (m.venue || '').toLowerCase();
        const group = (m.group || '').toLowerCase();
        if (
          !t1Name.includes(q) &&
          !t2Name.includes(q) &&
          !venue.includes(q) &&
          !group.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [matches, selectedGroupFilter, selectedStatusFilter, searchQuery]);

  // Group matches by date
  const matchesByDate = useMemo(() => {
    const grouped: { [date: string]: Match[] } = {};
    filteredMatches.forEach((m) => {
      const d = m.dateStr || 'ยังไม่กำหนดวัน';
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(m);
    });
    return grouped;
  }, [filteredMatches]);

  const handleCopyShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const championName =
    finalMatch?.winner === 1
      ? finalMatch?.team1?.name
      : finalMatch?.winner === 2
        ? finalMatch?.team2?.name
        : undefined;

  const getTeamLogoByName = (name?: string): string | undefined => {
    if (
      !name ||
      name === '-' ||
      name.startsWith('ผู้ชนะ') ||
      name.startsWith('ทีมชนะ') ||
      /^[A-Z]\d+$/i.test(name) ||
      name.startsWith('อันดับ') ||
      name.startsWith('ที่')
    ) {
      return undefined;
    }
    const clean = name.trim().toLowerCase();
    const found = teams.find((t) => t.name.trim().toLowerCase() === clean);
    return found?.logo;
  };

  const formatUserTeamName = (name?: string, _isTeam2?: boolean, _m?: Match): string => {
    const trimmed = name?.trim();
    if (!trimmed || trimmed === '' || trimmed === '-' || trimmed.startsWith('ทีมที่') || trimmed.includes('รอผล')) {
      return '-';
    }
    return trimmed;
  };

  // Render individual match card or table row
  const renderMatchItem = (match: Match) => {
    const isLive = match.status === 'LIVE';
    const isFT = match.status === 'FT';
    const t1Name = formatUserTeamName(match.team1?.name, false, match);
    const t2Name = formatUserTeamName(match.team2?.name, true, match);
    const hasPenalties = match.penaltyScore1 !== undefined && match.penaltyScore1 !== null && match.penaltyScore2 !== undefined && match.penaltyScore2 !== null;
    const isT1Winner = isFT && (match.score1 > match.score2 || (match.score1 === match.score2 && hasPenalties && (match.penaltyScore1 ?? 0) > (match.penaltyScore2 ?? 0)));
    const isT2Winner = isFT && (match.score2 > match.score1 || (match.score1 === match.score2 && hasPenalties && (match.penaltyScore2 ?? 0) > (match.penaltyScore1 ?? 0)));

    if (matchDisplayMode === 'table') {
      return (
        <div
          key={match.id}
          onClick={() => setActiveDetailMatch(match)}
          className={`rounded-2xl bg-white border border-l-4 p-3.5 transition-all hover:shadow-md cursor-pointer flex items-center gap-3 ${isLive
            ? 'border-emerald-500 border-l-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
            : 'border-[#efeded] border-l-[#fde68a] hover:border-l-[#f59e0b]'
            }`}
        >
          {/* Left: Time / Status & Match # */}
          <div className="w-24 sm:w-28 shrink-0 text-left border-r border-[#efeded] pr-2.5 space-y-1">
            <span className="font-display font-bold text-xs text-[#854d0e] bg-[#fef9c3] px-2 py-0.5 rounded-lg border border-[#fde68a] inline-block">
              คู่ที่ {match.matchNumber || 1}
            </span>
            {isLive ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#007746] animate-pulse block">
                <span className="w-1.5 h-1.5 rounded-full bg-[#007746]" />
                สด
              </span>
            ) : isFT ? (
              <span className="text-xs font-bold text-[#1b1c1c] block">จบเกมส์</span>
            ) : (
              <span className="text-xs font-bold text-[#1b1c1c] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#6f5d00]" /> {match.timeStr}
              </span>
            )}
            <div className="text-[10px] text-[#4b4737] truncate font-medium">
              {formatMatchGroupLabel(match.group, match.round)}
            </div>
          </div>

          {/* Center: 2 Rows of Teams & Scores (FlashScore style) */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Row 1: Team 1 */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <TeamLogo
                  logo={t1Name !== '-' ? (match.team1?.logo || getTeamLogoByName(t1Name) || '') : ''}
                  name={t1Name}
                  className="w-5 h-5 sm:w-6 sm:h-6 shrink-0"
                />
                <span
                  className={`text-xs sm:text-sm truncate ${isT1Winner ? 'font-black text-[#1b1c1c]' : 'font-semibold text-[#1b1c1c]'
                    }`}
                >
                  {t1Name}
                </span>
              </div>
              <span
                className={`font-mono text-sm font-bold px-2 ${isT1Winner ? 'text-[#007746]' : 'text-[#1b1c1c]'
                  }`}
              >
                {isLive || isFT ? `${match.score1}${hasPenalties ? `(${match.penaltyScore1})` : ''}` : '-'}
              </span>
            </div>

            {/* Row 2: Team 2 */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <TeamLogo
                  logo={t2Name !== '-' ? (match.team2?.logo || getTeamLogoByName(t2Name) || '') : ''}
                  name={t2Name}
                  className="w-5 h-5 sm:w-6 sm:h-6 shrink-0"
                />
                <span
                  className={`text-xs sm:text-sm truncate ${isT2Winner ? 'font-black text-[#1b1c1c]' : 'font-semibold text-[#1b1c1c]'
                    }`}
                >
                  {t2Name}
                </span>
              </div>
              <span
                className={`font-mono text-sm font-bold px-2 ${isT2Winner ? 'text-[#007746]' : 'text-[#1b1c1c]'
                  }`}
              >
                {isLive || isFT ? `${match.score2}${hasPenalties ? `(${match.penaltyScore2})` : ''}` : '-'}
              </span>
            </div>
          </div>

          {/* Right: Venue & Arrow */}
          <div className="shrink-0 pl-2 border-l border-[#efeded] text-right hidden sm:block">
            <div className="text-[11px] text-[#4b4737] flex items-center justify-end gap-1">
              <MapPin className="w-3 h-3 text-[#6f5d00]" />
              <span className="truncate max-w-[110px]">{match.venue || 'ระบุสนาม'}</span>
            </div>
            <span className="text-[10px] text-[#786607] font-bold hover:underline">ข้อมูล &gt;</span>
          </div>
        </div>
      );
    }

    // Default: Card Mode (FotMob / UEFA Style - Clean, Legible, Professional Spacing)
    return (
      <div
        key={match.id}
        onClick={() => setActiveDetailMatch(match)}
        className={`rounded-2xl bg-white border border-l-4 transition-all hover:shadow-md cursor-pointer overflow-hidden ${isLive
          ? 'border-emerald-500 border-l-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
          : 'border-[#efeded] border-l-[#fde68a] hover:border-l-[#f59e0b]'
          }`}
      >
        {/* Top Header Strip */}
        <div className="bg-[#faf9f8] px-3.5 sm:px-5 py-2.5 border-b border-[#efeded] flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-display font-bold text-xs text-[#854d0e] bg-[#fef9c3] px-3 py-1 rounded-xl border border-[#fde68a] shrink-0">
              คู่ที่ {match.matchNumber || 1}
            </span>
            <span className="font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-xl text-xs truncate border border-gray-200">
              {formatMatchGroupLabel(match.group, match.round)}
            </span>
            {match.dateStr && (
              <span className="text-[#6b7280] text-[11px] flex items-center gap-1 ml-1">
                <Calendar className="w-3.5 h-3.5 text-[#786607]" /> {match.dateStr}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 text-xs text-[#4b4737] font-semibold">
              <MapPin className="w-3.5 h-3.5 text-[#786607] shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-none">{match.venue || 'ระบุสนาม'}</span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-0.5 text-xs font-bold text-[#786607] hover:underline pl-2.5 border-l border-[#efeded]">
              ข้อมูลแมตช์ <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Main Match Arena: Team 1 vs Team 2 */}
        <div className="p-3.5 sm:p-5 flex items-center justify-between gap-2 sm:gap-6">
          {/* Home Team */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-4 flex-1 min-w-0">
            <span className={`font-display text-sm sm:text-base text-right truncate ${isT1Winner ? 'font-black text-emerald-700' : 'font-bold text-gray-900'}`}>
              {t1Name}
            </span>
            <TeamLogo
              logo={t1Name !== '-' ? (match.team1?.logo || getTeamLogoByName(t1Name) || '') : ''}
              name={t1Name}
              className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-full bg-gray-50 ring-1 ring-black/5"
            />
          </div>

          {/* Center Centerpiece: Time or Score Badge */}
          <div className="w-24 sm:w-32 shrink-0 text-center px-1">
            {isLive ? (
              <div className="bg-emerald-50 border border-emerald-300/60 rounded-xl py-1.5 px-3">
                <div className="font-display font-black text-lg sm:text-2xl text-emerald-700 leading-none flex items-center justify-center gap-1.5">
                  <span>{match.score1}</span>
                  <span className="text-xs text-emerald-500">-</span>
                  <span>{match.score2}</span>
                </div>
                <span className="inline-block mt-1 text-[10px] sm:text-[11px] font-bold text-emerald-600 animate-pulse">
                  กำลังแข่งขัน
                </span>
              </div>
            ) : isFT ? (
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl py-1.5 px-3">
                <div className="font-display font-black text-base sm:text-xl leading-none flex items-center justify-center gap-1">
                  <span className={isT1Winner ? 'text-emerald-600 font-black' : 'text-gray-900'}>
                    {match.score1}{hasPenalties ? `(${match.penaltyScore1})` : ''}
                  </span>
                  <span className="text-xs text-gray-400">-</span>
                  <span className={isT2Winner ? 'text-emerald-600 font-black' : 'text-gray-900'}>
                    {match.score2}{hasPenalties ? `(${match.penaltyScore2})` : ''}
                  </span>
                </div>
                <span className="inline-block mt-1 text-[10px] sm:text-[11px] font-bold text-gray-500">
                  จบเกมส์
                </span>
              </div>
            ) : (
              <div className="bg-[#f3f4f6] border border-[#e5e7eb] rounded-xl py-2 px-3 flex items-center justify-center shadow-2xs">
                <div className="font-display font-bold text-xs sm:text-sm text-gray-800 leading-none">
                  {match.timeStr ? `${match.timeStr} น.` : 'VS'}
                </div>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-start gap-2.5 sm:gap-4 flex-1 min-w-0">
            <TeamLogo
              logo={t2Name !== '-' ? (match.team2?.logo || getTeamLogoByName(t2Name) || '') : ''}
              name={t2Name}
              className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-full bg-gray-50 ring-1 ring-black/5"
            />
            <span className={`font-display text-sm sm:text-base text-left truncate ${isT2Winner ? 'font-black text-emerald-700' : 'font-bold text-gray-900'}`}>
              {t2Name}
            </span>
          </div>
        </div>

        {/* Goalscorers Footer Strip (only when goals recorded) */}
        {(() => {
          const goals1Str = formatGoalscorersString(match.goalDetails1, match.goalPlayers1);
          const goals2Str = formatGoalscorersString(match.goalDetails2, match.goalPlayers2);

          const hasGoals1 = Boolean(goals1Str);
          const hasGoals2 = Boolean(goals2Str);

          if (!hasGoals1 && !hasGoals2) return null;

          return (
            <div className="bg-[#faf9f8] px-3.5 sm:px-5 py-2 border-t border-[#efeded] flex items-center justify-between gap-2 text-[11px] text-[#4b4737]">
              {/* Team 1 Goals (Far Left aligned) */}
              <div className="flex-1 flex items-center justify-start min-w-0">
                {hasGoals1 ? (
                  <span className="truncate text-emerald-700 font-semibold text-left" title={goals1Str}>
                    {goals1Str}
                  </span>
                ) : null}
              </div>

              {/* Center Soccer Ball Icon */}
              <div className="shrink-0 flex items-center justify-center px-2">
                <SoccerBall className="w-3.5 h-3.5 text-emerald-600" />
              </div>

              {/* Team 2 Goals (Far Right aligned) */}
              <div className="flex-1 flex items-center justify-end min-w-0">
                {hasGoals2 ? (
                  <span className="truncate text-emerald-700 font-semibold text-right" title={goals2Str}>
                    {goals2Str}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1b1c1c] font-body flex flex-col">
      {/* 1. Public Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#efeded] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            {/* Logo & Tournament Name */}
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src="/science_cup_logo.png"
                alt="Science Cup Logo"
                className="h-12 sm:h-16 w-auto object-contain shrink-0 drop-shadow-xs"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-black text-base sm:text-lg text-[#1b1c1c] truncate">
                    {tournamentName}
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#95fcbc]/40 text-[#007746] border border-[#007746]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#007746] animate-pulse" />
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-[#4b4737] truncate">
                  การแข่งขันฟุตบอลภายในคณะวิทยาศาสตร์
                </p>
              </div>
            </div>
          </div>

          {/* 2. Main 3 Tab Navigation (Fixtures, Standings, Knockout) */}
          <div className="flex items-center gap-2 border-t border-[#efeded]/80 py-2.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('fixtures')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-display font-bold transition-all shrink-0 ${activeTab === 'fixtures'
                ? 'bg-[#ffe680] text-[#786607] shadow-xs'
                : 'text-[#4b4737] hover:bg-[#f5f3f3] hover:text-[#1b1c1c]'
                }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>ตารางการแข่งขัน</span>
              {liveCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('standings')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-display font-bold transition-all shrink-0 ${activeTab === 'standings'
                ? 'bg-[#ffe680] text-[#786607] shadow-xs'
                : 'text-[#4b4737] hover:bg-[#f5f3f3] hover:text-[#1b1c1c]'
                }`}
            >
              <Award className="w-4 h-4" />
              <span>ตารางคะแนน</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bracket')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-display font-bold transition-all shrink-0 ${activeTab === 'bracket'
                ? 'bg-[#ffe680] text-[#786607] shadow-xs'
                : 'text-[#4b4737] hover:bg-[#f5f3f3] hover:text-[#1b1c1c]'
                }`}
            >
              <GitFork className="w-4 h-4" />
              <span>ตารางน็อคเอาท์ (Bracket)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* =========================================================================
            TAB 1: ตารางการแข่งขัน (Matches & Fixtures) - Read-Only
           ========================================================================= */}
        {activeTab === 'fixtures' && (
          <div className="space-y-6">
            {/* Header / Filter Toolbar */}
            {/* Featured Live / Playing Match Banner with Faded Photo Background */}
            {(() => {
              const liveMatches = matches.filter((m) => m.status === 'LIVE');
              const upcomingMatches = matches.filter((m) => m.status === 'UPCOMING');
              const featuredMatch = liveMatches[0] || upcomingMatches[0] || matches[0];

              if (!featuredMatch) return null;

              const isLive = featuredMatch.status === 'LIVE';
              const t1Name = formatUserTeamName(featuredMatch.team1?.name, false, featuredMatch);
              const t2Name = formatUserTeamName(featuredMatch.team2?.name, true, featuredMatch);

              // Clean group & round label
              const groupLabel = (() => {
                const grp = featuredMatch.group || '';
                const rnd = featuredMatch.round || '';
                return formatMatchGroupLabel(grp, rnd);
              })();

              return (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#111318] via-[#0d0e12] to-[#08090c] text-white shadow-2xl border border-white/[0.12] p-6 sm:p-8 group">
                  {/* Top Edge Multi-Color Specular Highlight */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 via-amber-300/40 via-emerald-400/40 to-transparent z-10" />

                  {/* Rich Cosmic Aurora & Dynamic Mesh Color Background */}
                  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
                    {/* Deep Cosmic Base Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0e1424] via-[#090d18] to-[#05070d]" />

                    {/* Team 1 Home Aura (Electric Indigo / Cyan Glow) */}
                    <div className="absolute -top-12 -left-12 w-80 h-80 bg-gradient-to-br from-indigo-500/25 via-cyan-500/15 to-transparent blur-3xl rounded-full" />

                    {/* Team 2 Away Aura (Vibrant Emerald / Teal Glow) */}
                    <div className="absolute -bottom-12 -right-12 w-80 h-80 bg-gradient-to-tl from-emerald-500/20 via-teal-400/15 to-transparent blur-3xl rounded-full" />

                    {/* Center Championship Gold Beam */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-amber-400/15 via-blue-500/5 to-transparent blur-2xl rounded-full" />

                    {/* Geometric Pitch Texture Grid Lines (Subtle Vector Grid) */}
                    <div
                      className="absolute inset-0 opacity-[0.035]"
                      style={{
                        backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
                        backgroundSize: '36px 36px',
                      }}
                    />

                    {/* Subtle Center Court Arc */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 border border-white/[0.04] rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 sm:w-36 h-28 sm:h-36 border border-white/[0.03] rounded-full" />
                  </div>

                  {/* Banner Header Strip */}
                  <div className="relative z-10 mb-4 sm:mb-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                        {isLive ? (
                          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#007746] text-white text-xs font-bold tracking-wide shadow-[0_0_12px_rgba(0,119,70,0.4)] border border-[#00995a]/40">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            กำลังแข่งขัน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 rounded-full bg-white/10 text-amber-300 text-[11px] sm:text-xs font-medium tracking-wide border border-white/10 backdrop-blur-xs shrink-0">
                            <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                            <span>คู่ที่กำลังจะแข่ง {featuredMatch.timeStr ? `(เวลา ${featuredMatch.timeStr} น.)` : ''}</span>
                          </span>
                        )}

                        <span className="text-xs text-zinc-400 font-medium hidden sm:inline-block">
                          {groupLabel}
                        </span>
                      </div>

                      {featuredMatch.venue && (
                        <span className="text-xs text-amber-400 font-medium flex items-center gap-1.5 shrink-0 py-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{featuredMatch.venue}</span>
                        </span>
                      )}
                    </div>

                    {/* Mobile Group Label Below */}
                    <div className="sm:hidden mt-1.5 pl-0.5">
                      <span className="text-xs text-zinc-400 font-medium">
                        {groupLabel}
                      </span>
                    </div>
                  </div>

                  {/* Main Match Arena: Team 1 vs Team 2 */}
                  <div className="relative z-10 flex items-center justify-between gap-4 max-w-2xl mx-auto py-2">
                    {/* Team 1 (Home) */}
                    <div className="flex-1 flex flex-col items-center text-center gap-2 min-w-0">
                      <div className="p-1 rounded-full bg-white/10 ring-2 ring-white/20 shadow-xl backdrop-blur-xs transition-transform duration-300 group-hover:scale-105">
                        <TeamLogo
                          logo={t1Name !== '-' ? (featuredMatch.team1?.logo || getTeamLogoByName(t1Name) || '') : ''}
                          name={t1Name}
                          className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full object-cover"
                        />
                      </div>
                      <span className="font-display font-black text-sm sm:text-base text-white tracking-wide text-center truncate max-w-full drop-shadow-sm uppercase">
                        {t1Name}
                      </span>
                    </div>

                    {/* Live Score Display */}
                    <div className="flex flex-col items-center justify-center px-2 sm:px-6 shrink-0">
                      {(() => {
                        const featHasPen = featuredMatch.penaltyScore1 !== undefined && featuredMatch.penaltyScore1 !== null && featuredMatch.penaltyScore2 !== undefined && featuredMatch.penaltyScore2 !== null;
                        return (
                          <div className="flex items-center gap-2 font-display font-black text-2xl sm:text-4xl text-amber-300 tracking-wide drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)]">
                            <span>
                              {isLive || featuredMatch.status === 'FT'
                                ? `${featuredMatch.score1}${featHasPen ? `(${featuredMatch.penaltyScore1})` : ''}`
                                : 0}
                            </span>
                            <span className="text-white/40 text-xl sm:text-2xl font-light select-none">:</span>
                            <span>
                              {isLive || featuredMatch.status === 'FT'
                                ? `${featuredMatch.score2}${featHasPen ? `(${featuredMatch.penaltyScore2})` : ''}`
                                : 0}
                            </span>
                          </div>
                        );
                      })()}
                      <div className="mt-2 text-center">
                        <span className="px-3.5 py-0.5 rounded-full bg-[#004d2e] text-[#22c55e] border border-[#00663d] text-xs font-bold font-display shadow-xs">
                          คู่ที่ {featuredMatch.matchNumber || 1}
                        </span>
                      </div>
                    </div>

                    {/* Team 2 (Away) */}
                    <div className="flex-1 flex flex-col items-center text-center gap-2 min-w-0">
                      <div className="p-1 rounded-full bg-white/10 ring-2 ring-white/20 shadow-xl backdrop-blur-xs transition-transform duration-300 group-hover:scale-105">
                        <TeamLogo
                          logo={t2Name !== '-' ? (featuredMatch.team2?.logo || getTeamLogoByName(t2Name) || '') : ''}
                          name={t2Name}
                          className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full object-cover"
                        />
                      </div>
                      <span className="font-display font-black text-sm sm:text-base text-white tracking-wide text-center truncate max-w-full drop-shadow-sm uppercase">
                        {t2Name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}



            {/* Match Cards List (เรียงลงล่าง พร้อมตัวเลือกการ์ดชัดเจน/ตารางกะทัดรัด) */}
            <div className="max-w-4xl mx-auto w-full">
              {filteredMatches.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#efeded]">
                  <CalendarDays className="w-12 h-12 text-[#888580] mx-auto mb-3 opacity-50" />
                  <h3 className="font-display font-bold text-base text-[#1b1c1c]">
                    ไม่พบคู่ที่ตรงกับเงื่อนไข
                  </h3>
                  <p className="text-xs text-[#4b4737] mt-1">
                    ลองล้างตัวกรองสถานะ หรือคำค้นหาเพื่อดูโปรแกรมการแข่งขันทั้งหมด
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGroupFilter('all');
                      setSelectedStatusFilter('all');
                      setSearchQuery('');
                    }}
                    className="mt-4 px-4 py-2 rounded-full bg-[#ffe680] text-[#786607] font-bold text-xs"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              ) : matchViewStyle === 'sequence' ? (
                /* Mode 1: เรียงคิวการแข่งขัน 1 ลงล่างต่อเนื่อง */
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between px-1 text-xs text-[#4b4737] mb-1">
                    <span className="flex items-center gap-1.5 font-bold text-[#1b1c1c]">
                      <ListOrdered className="w-4 h-4 text-[#786607]" />
                      โปรแกรมการแข่งขันเรียงตามลำดับคิว ({filteredMatches.length} คู่)
                    </span>
                    <div className="flex items-center gap-1 bg-[#f5f3f3] p-1 rounded-xl border border-[#efeded]">
                      <button
                        type="button"
                        onClick={() => setMatchDisplayMode('card')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${matchDisplayMode === 'card'
                          ? 'bg-white text-[#1b1c1c] shadow-2xs font-black'
                          : 'text-[#4b4737] hover:text-[#1b1c1c]'
                          }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>มุมมองการ์ด</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMatchDisplayMode('table')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${matchDisplayMode === 'table'
                          ? 'bg-white text-[#1b1c1c] shadow-2xs font-black'
                          : 'text-[#4b4737] hover:text-[#1b1c1c]'
                          }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>มุมมองตาราง</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredMatches.map(renderMatchItem)}
                  </div>
                </div>
              ) : (
                /* Mode 2: แบ่งตามวันแข่ง (แต่ยังคงเรียงลงล่างเป็นแถวเดี่ยว 1 คอลัมน์) */
                <div className="space-y-6">
                  {(Object.entries(matchesByDate) as [string, Match[]][]).map(([dateStr, dateMatches]) => (
                    <div key={dateStr} className="space-y-3">
                      {/* Date Header Pill */}
                      <div className="flex items-center gap-2">
                        <div className="px-3.5 py-1.5 rounded-xl bg-white border border-[#efeded] text-xs font-bold text-[#1b1c1c] shadow-2xs flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-[#6f5d00]" />
                          <span>{dateStr}</span>
                        </div>
                        <span className="text-[11px] text-[#4b4737]">
                          ({dateMatches.length} คู่การแข่งขัน)
                        </span>
                      </div>

                      {/* Matches List */}
                      <div className="space-y-3">
                        {dateMatches.map(renderMatchItem)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: ตารางคะแนน (Standings & Leaderboard) - Read-Only
           ========================================================================= */}
        {activeTab === 'standings' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#efeded] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-amber-800 mb-1">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>สรุปอันดับคะแนนแบบเรียลไทม์</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-black text-[#1b1c1c]">
                  ตารางคะแนนรอบแบ่งกลุ่ม
                </h2>
                <p className="text-xs text-[#716e68] mt-1">
                  {qualifyCountPerGroup === 1 ? 'อันดับ 1' : `อันดับ 1-${qualifyCountPerGroup}`} ของแต่ละกลุ่มผ่านเข้าสู่{knockoutRoundLabel}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/80 flex items-center gap-2 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  {qualificationZoneText}
                </span>
              </div>
            </div>

            {/* Standings Tables by Group */}
            {groupKeys.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#efeded]">
                <Award className="w-12 h-12 text-[#888580] mx-auto mb-2 opacity-50" />
                <h3 className="font-display font-bold text-base text-[#1b1c1c]">
                  ยังไม่มีข้อมูลกลุ่มการแข่งขัน
                </h3>
                <p className="text-xs text-[#4b4737] mt-1">
                  กรุณาตรวจสอบตารางการแข่งขัน หรือรอผู้จัดการแข่งขันจัดกลุ่ม
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {groupKeys.map((groupKey) => {
                  const table = computedStandings[groupKey] || [];

                  return (
                    <div
                      key={groupKey}
                      className="bg-white rounded-3xl p-5 sm:p-6 border border-[#efeded] shadow-xs overflow-hidden flex flex-col justify-between"
                    >
                      {/* Group Header */}
                      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#efeded]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src="/science_cup_logo.png"
                              alt="Science Cup"
                              className="w-full h-full object-contain scale-[1.75] transform"
                            />
                          </div>
                          <div>
                            <h3 className="font-display font-extrabold text-base text-[#1b1c1c]">
                              {groupKey.startsWith('กลุ่ม') || groupKey.startsWith('สาย') ? groupKey : `กลุ่ม ${groupKey}`}
                            </h3>
                          </div>
                        </div>

                        <span className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-full shadow-2xs">
                          รอบแบ่งกลุ่ม
                        </span>
                      </div>

                      {/* Standings Table */}
                      <div className="overflow-x-auto -mx-2 sm:mx-0">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-[#efeded] text-[#716e68] text-[11px] font-semibold">
                              <th className="py-2.5 px-2 text-center w-8">#</th>
                              <th className="py-2.5 px-2">สโมสร</th>
                              <th className="py-2.5 px-1 text-center">แข่ง</th>
                              <th className="py-2.5 px-1 text-center">ชนะ</th>
                              <th className="py-2.5 px-1 text-center">เสมอ</th>
                              <th className="py-2.5 px-1 text-center">แพ้</th>
                              <th className="py-2.5 px-1 text-center hidden sm:table-cell">ได้</th>
                              <th className="py-2.5 px-1 text-center hidden sm:table-cell">เสีย</th>
                              <th className="py-2.5 px-1.5 text-center">+/-</th>
                              <th className="py-2.5 px-2 text-center font-bold text-[#1b1c1c]">แต้ม</th>
                              <th className="py-2.5 px-2 text-center hidden sm:table-cell">ฟอร์ม</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#efeded]/70">
                            {table.length === 0 ? (
                              <tr>
                                <td colSpan={11} className="py-6 text-center text-[#716e68]">
                                  ยังไม่มีทีมในกลุ่มนี้
                                </td>
                              </tr>
                            ) : (
                              table.map((row, idx) => {
                                const rank = idx + 1;
                                const isQualified = rank <= qualifyCountPerGroup;

                                return (
                                  <tr
                                    key={row.team.id}
                                    className={`hover:bg-[#faf9f8] transition-colors ${isQualified ? 'bg-emerald-50/40' : ''
                                      }`}
                                  >
                                    {/* Rank */}
                                    <td className="py-3 px-2 text-center">
                                      <span
                                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-black ${isQualified
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'bg-zinc-100 text-[#716e68]'
                                          }`}
                                      >
                                        {rank}
                                      </span>
                                    </td>

                                    {/* Team Name & Logo */}
                                    <td className="py-3 px-2">
                                      <div className="flex items-center gap-2 max-w-[140px] sm:max-w-[180px]">
                                        <TeamLogo
                                          logo={row.team.logo}
                                          name={row.team.name}
                                          className="w-6 h-6 rounded-full object-cover shrink-0"
                                        />
                                        <span className="font-bold text-[#1b1c1c] truncate">
                                          {row.team.name}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Stats */}
                                    <td className="py-3 px-1 text-center text-[#4b4737] font-medium">{row.p}</td>
                                    <td className="py-3 px-1 text-center font-bold text-emerald-700">{row.w}</td>
                                    <td className="py-3 px-1 text-center text-[#4b4737] font-medium">{row.d}</td>
                                    <td className="py-3 px-1 text-center font-semibold text-rose-600">{row.l}</td>
                                    <td className="py-3 px-1 text-center text-[#716e68] hidden sm:table-cell">{row.gf}</td>
                                    <td className="py-3 px-1 text-center text-[#716e68] hidden sm:table-cell">{row.ga}</td>
                                    <td className="py-3 px-1.5 text-center font-mono font-bold">
                                      {row.gd > 0 ? (
                                        <span className="text-emerald-700">+{row.gd}</span>
                                      ) : row.gd < 0 ? (
                                        <span className="text-rose-600">{row.gd}</span>
                                      ) : (
                                        <span className="text-zinc-400">0</span>
                                      )}
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                      <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100/60 text-emerald-900 font-display font-black text-sm">
                                        {row.pts}
                                      </span>
                                    </td>

                                    {/* Form */}
                                    <td className="py-3 px-2 text-center hidden sm:table-cell">
                                      <div className="flex items-center justify-center gap-1">
                                        {row.form.length === 0 ? (
                                          <span className="text-[10px] text-[#888580]">-</span>
                                        ) : (
                                          row.form.slice(-3).map((f, fIdx) => (
                                            <span
                                              key={fIdx}
                                              className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white shadow-2xs ${f === 'W'
                                                ? 'bg-emerald-600'
                                                : f === 'D'
                                                  ? 'bg-amber-400 text-amber-900'
                                                  : 'bg-rose-500'
                                                }`}
                                              title={f === 'W' ? 'ชนะ' : f === 'D' ? 'เสมอ' : 'แพ้'}
                                            >
                                              {f}
                                            </span>
                                          ))
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Top Scorers Leaderboard */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#efeded] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#efeded] gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 flex items-center justify-center font-bold shadow-xs border border-amber-400/40">
                    <SoccerBall className="w-5 h-5 text-amber-950" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-black text-lg text-[#1b1c1c]">
                        อันดับดาวซัลโวประจำทัวร์นาเมนต์
                      </h3>
                    </div>
                    <p className="text-xs text-[#716e68]">
                      รวมสถิติการทำประตูของผู้เล่นทุกคน
                    </p>
                  </div>
                </div>
              </div>

              {topScorers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {topScorers.map((scorer) => {
                    const isRank1 = scorer.rank === 1;
                    const isRank2 = scorer.rank === 2;
                    const isRank3 = scorer.rank === 3;

                    return (
                      <div
                        key={scorer.id}
                        className={`p-4 rounded-3xl border transition-all duration-200 flex items-center gap-3.5 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 ${isRank1
                          ? 'bg-blue-50/60 border-2 border-blue-400/90 hover:bg-blue-50/80 shadow-sm'
                          : isRank2
                            ? 'bg-blue-50/35 border border-blue-300/80 hover:bg-blue-50/60'
                            : isRank3
                              ? 'bg-blue-50/15 border border-blue-200/70 hover:bg-blue-50/40'
                              : 'bg-white border-[#efeded] hover:bg-[#faf9f8]'
                          }`}
                      >
                        {/* Rank Badge */}
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-display font-black text-sm shrink-0 shadow-xs ${isRank1
                            ? 'bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 text-white border border-blue-600 shadow-blue-900/30 ring-1 ring-blue-400/30'
                            : isRank2
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white border border-blue-400 shadow-blue-500/20'
                              : isRank3
                                ? 'bg-gradient-to-br from-sky-400 to-blue-400 text-white border border-sky-300 shadow-sky-400/20'
                                : 'bg-zinc-100 text-zinc-600 border border-zinc-200/80'
                            }`}
                        >
                          #{scorer.rank}
                        </div>

                        {/* Player & Team Info */}
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-extrabold text-base text-[#1b1c1c] truncate">
                            {scorer.name}
                          </p>
                          <p className="text-xs text-[#716e68] truncate font-medium">
                            {scorer.teamName}
                          </p>
                          <span className="inline-block text-[10px] font-semibold text-zinc-600 bg-white px-2 py-0.5 rounded-lg border border-[#efeded] mt-1 shadow-2xs">
                            เบอร์ {scorer.number}
                          </span>
                        </div>

                        {/* Goal Count */}
                        <div className="shrink-0 flex flex-col items-center justify-center min-w-[36px] text-center">
                          <span
                            className={`font-display font-black text-lg sm:text-xl leading-tight text-center ${isRank1
                              ? 'text-blue-950'
                              : isRank2
                                ? 'text-blue-800'
                                : isRank3
                                  ? 'text-blue-700'
                                  : 'text-[#1b1c1c]'
                              }`}
                          >
                            {scorer.goals}
                          </span>
                          <span className="text-[10px] text-[#716e68] font-bold text-center">ประตู</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 px-4 text-center bg-[#faf9f8] rounded-2xl border border-dashed border-[#efeded]">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center text-xl">
                    <SoccerBall className="w-6 h-6 text-amber-700" />
                  </div>
                  <h4 className="font-display font-bold text-sm text-[#1b1c1c]">
                    ยังไม่มีผู้ทำประตูในขณะนี้
                  </h4>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: ตารางน็อคเอาท์ (Knockout Bracket) - Read-Only
           ========================================================================= */}
        {activeTab === 'bracket' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#efeded] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-[#786607] text-xs font-bold uppercase tracking-wider mb-2">
                  <GitFork className="w-3.5 h-3.5 text-amber-600" />
                  <span>เส้นทางสู่แชมป์ • {totalKnockoutSlots} ทีมสุดท้าย</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-black text-[#1b1c1c] tracking-tight">
                  การแข่งขันรอบน็อคเอาท์
                </h2>
                <p className="text-xs sm:text-sm text-[#4b4737] mt-0.5">
                  การแข่งขันแบบแพ้คัดออกสู่นัดชิงชนะเลิศ Science Cup
                </p>
              </div>
            </div>

            {/* Round Selector Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setBracketMobileRound('all')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${bracketMobileRound === 'all'
                  ? 'bg-[#ffe680] text-[#786607] font-black ring-1 ring-amber-400/60 shadow-sm'
                  : 'bg-white text-[#4b4737] border border-[#efeded] hover:bg-[#f5f3f3]'
                  }`}
              >
                ทุกรอบ (All Bracket)
              </button>

              {knockoutStartingRound === 'r16' && (
                <button
                  type="button"
                  onClick={() => setBracketMobileRound('r16')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${bracketMobileRound === 'r16'
                    ? 'bg-[#ffe680] text-[#786607] font-black ring-1 ring-amber-400/60 shadow-sm'
                    : 'bg-white text-[#4b4737] border border-[#efeded] hover:bg-[#f5f3f3]'
                    }`}
                >
                  รอบ 16 ทีม (R16)
                </button>
              )}

              {(knockoutStartingRound === 'r16' || knockoutStartingRound === 'qf') && (
                <button
                  type="button"
                  onClick={() => setBracketMobileRound('qf')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${bracketMobileRound === 'qf'
                    ? 'bg-[#ffe680] text-[#786607] font-black ring-1 ring-amber-400/60 shadow-sm'
                    : 'bg-white text-[#4b4737] border border-[#efeded] hover:bg-[#f5f3f3]'
                    }`}
                >
                  รอบ 8 ทีม (QF)
                </button>
              )}

              {(knockoutStartingRound === 'r16' || knockoutStartingRound === 'qf' || knockoutStartingRound === 'sf') && (
                <button
                  type="button"
                  onClick={() => setBracketMobileRound('sf')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${bracketMobileRound === 'sf'
                    ? 'bg-[#ffe680] text-[#786607] font-black ring-1 ring-amber-400/60 shadow-sm'
                    : 'bg-white text-[#4b4737] border border-[#efeded] hover:bg-[#f5f3f3]'
                    }`}
                >
                  รอบรองฯ (SF)
                </button>
              )}

              <button
                type="button"
                onClick={() => setBracketMobileRound('final')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${bracketMobileRound === 'final'
                  ? 'bg-[#ffe680] text-[#786607] font-black ring-1 ring-amber-400/60 shadow-sm'
                  : 'bg-white text-[#4b4737] border border-[#efeded] hover:bg-[#f5f3f3]'
                  }`}
              >
                รอบชิงฯ (Final)
              </button>
            </div>

            {/* Visual Bracket Grid (Desktop Columns with Connectors, Mobile Responsive) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-8 border border-[#efeded] shadow-xs overflow-x-auto">
              {bracketMobileRound === 'all' ? (
                <div className={`flex items-stretch justify-center gap-2 sm:gap-4 ${
                  knockoutStartingRound === 'sf'
                    ? 'max-w-4xl mx-auto min-w-[620px]'
                    : knockoutStartingRound === 'qf'
                      ? 'max-w-5xl mx-auto min-w-[780px]'
                      : 'min-w-[920px]'
                }`}>
                  {/* Column 0: R16 (If starting from R16) */}
                  {knockoutStartingRound === 'r16' && (
                    <>
                      <div className="flex-1 flex flex-col min-w-[200px] max-w-[250px]">
                        <div className="text-center pb-2.5 mb-4 border-b border-[#efeded]">
                          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#f5f3f3] text-[#1b1c1c] text-[11px] font-black uppercase tracking-wider">
                            <span>รอบ 16 ทีม (R16)</span>
                          </div>
                          <span className="text-[11px] text-[#4b4737] block mt-0.5 font-medium">8 แมตช์</span>
                        </div>

                        <div className="flex-1 flex flex-col justify-around gap-3">
                          {r16Matches.map((m, r16Idx) => {
                            const sm = matches.find((item) => item.id === m.id);
                            const isFT = sm ? sm.status === 'FT' : (m.winner !== null && m.winner !== undefined);
                            const isLive = sm ? sm.status === 'LIVE' : false;
                            const score1 = sm ? (sm.score1 ?? 0) : (m.team1.score ?? 0);
                            const score2 = sm ? (sm.score2 ?? 0) : (m.team2.score ?? 0);
                            const hasPenalties = sm
                              ? sm.penaltyScore1 !== undefined && sm.penaltyScore1 !== null && sm.penaltyScore2 !== undefined && sm.penaltyScore2 !== null
                              : m.team1.penaltyScore !== undefined && m.team1.penaltyScore !== null && m.team2.penaltyScore !== undefined && m.team2.penaltyScore !== null;
                            const pScore1 = sm ? sm.penaltyScore1 : m.team1.penaltyScore;
                            const pScore2 = sm ? sm.penaltyScore2 : m.team2.penaltyScore;
                            const winnerInfo = getKnockoutMatchWinner(sm, m);
                            const isT1Winner = isFT && winnerInfo.winnerIndex === 1;
                            const isT2Winner = isFT && winnerInfo.winnerIndex === 2;
                            const displayScore1 = isLive || isFT ? `${score1}${hasPenalties ? `(${pScore1})` : ''}` : '-';
                            const displayScore2 = isLive || isFT ? `${score2}${hasPenalties ? `(${pScore2})` : ''}` : '-';

                            const defaultPair = DEFAULT_R16_SEED_PAIRS[r16Idx] || ['A1', 'B2'];
                            const team1Name = resolveKnockoutSlotName(sm ? sm.team1.name : m.team1.name, defaultPair[0], computedStandings, matches, groups);
                            const team2Name = resolveKnockoutSlotName(sm ? sm.team2.name : m.team2.name, defaultPair[1], computedStandings, matches, groups);

                            const team1Logo = getTeamLogoByName(team1Name);
                            const team2Logo = getTeamLogoByName(team2Name);
                            const isPlaceholder1 = !team1Name || team1Name.startsWith('ทีมชนะ') || team1Name.startsWith('ผู้ชนะ') || /^[A-Z]\d+$/i.test(team1Name);
                            const isPlaceholder2 = !team2Name || team2Name.startsWith('ทีมชนะ') || team2Name.startsWith('ผู้ชนะ') || /^[A-Z]\d+$/i.test(team2Name);

                            const matchNo = sm?.matchNumber;
                            const roundLabel = matchNo ? `รอบ 16 ทีม (คู่ที่ ${matchNo})` : 'รอบ 16 ทีม';
                            const timeLabel = sm?.timeStr
                              ? `${sm.timeStr.replace(/\s*น\.?$/g, '')} น.`
                              : m.time
                                ? `${m.time.replace(/\s*น\.?$/g, '')} น.`
                                : '';

                            return (
                              <div
                                key={m.id}
                                onClick={() => sm && setActiveDetailMatch(sm)}
                                className={`rounded-2xl bg-white p-3 border border-[#efeded] shadow-2xs hover:shadow-md hover:border-amber-300 transition-all duration-200 ${sm ? 'cursor-pointer' : ''}`}
                              >
                                <div className="flex items-center justify-between text-[10px] text-[#4b4737] pb-1.5 mb-1.5 border-b border-[#efeded]">
                                  <span className="font-bold text-[#786607] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                                    {roundLabel}
                                  </span>
                                  {isLive ? (
                                    <span className="font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full text-[9px] flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                      LIVE
                                    </span>
                                  ) : isFT ? (
                                    <span className="font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-[9px]">
                                      {hasPenalties ? 'FT (PEN)' : 'FT'}
                                    </span>
                                  ) : timeLabel ? (
                                    <span className="font-medium text-gray-500 flex items-center gap-0.5 text-[9px]">
                                      <Clock className="w-2.5 h-2.5 text-gray-400" />
                                      {timeLabel}
                                    </span>
                                  ) : null}
                                </div>
                                <div className={`flex items-center justify-between py-1.5 px-2 rounded-xl transition-all ${isT1Winner ? 'bg-amber-50/80 font-bold text-[#1b1c1c] ring-1 ring-amber-300/60' : isT2Winner ? 'opacity-60 text-gray-500' : 'text-[#1b1c1c] hover:bg-gray-50'}`}>
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <TeamLogo name={team1Name} logo={team1Logo} className="w-5 h-5 rounded-full shrink-0" />
                                    <span className={`truncate text-xs ${isT1Winner ? 'font-black text-[#1b1c1c]' : isPlaceholder1 ? 'text-gray-400 italic text-[11px]' : 'font-semibold'}`}>{team1Name}</span>
                                  </div>
                                  <span className={`font-mono text-xs px-2 py-0.5 rounded-md min-w-[22px] text-center shrink-0 ml-1 ${isT1Winner ? 'bg-[#ffe680] text-[#786607] font-black shadow-2xs' : isLive ? 'bg-red-50 text-red-600 font-black' : 'bg-gray-100 text-gray-700 font-bold'}`}>{displayScore1}</span>
                                </div>
                                <div className={`flex items-center justify-between py-1.5 px-2 rounded-xl transition-all mt-1 ${isT2Winner ? 'bg-amber-50/80 font-bold text-[#1b1c1c] ring-1 ring-amber-300/60' : isT1Winner ? 'opacity-60 text-gray-500' : 'text-[#1b1c1c] hover:bg-gray-50'}`}>
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <TeamLogo name={team2Name} logo={team2Logo} className="w-5 h-5 rounded-full shrink-0" />
                                    <span className={`truncate text-xs ${isT2Winner ? 'font-black text-[#1b1c1c]' : isPlaceholder2 ? 'text-gray-400 italic text-[11px]' : 'font-semibold'}`}>{team2Name}</span>
                                  </div>
                                  <span className={`font-mono text-xs px-2 py-0.5 rounded-md min-w-[22px] text-center shrink-0 ml-1 ${isT2Winner ? 'bg-[#ffe680] text-[#786607] font-black shadow-2xs' : isLive ? 'bg-red-50 text-red-600 font-black' : 'bg-gray-100 text-gray-700 font-bold'}`}>{displayScore2}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Connector R16 -> QF */}
                      <div className="flex flex-col min-w-[28px] sm:min-w-[36px] pt-12">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="flex-1 flex items-center justify-center">
                            <BracketConnector />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Column 1: Quarterfinals */}
                  {(knockoutStartingRound === 'r16' || knockoutStartingRound === 'qf') && (
                    <>
                      <div className="flex-1 flex flex-col min-w-[220px] max-w-[270px]">
                        <div className="text-center pb-2.5 mb-4 border-b border-[#efeded]">
                          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#f5f3f3] text-[#1b1c1c] text-[11px] font-black uppercase tracking-wider">
                            <span>รอบ 8 ทีม (QF)</span>
                          </div>
                          <span className="text-[11px] text-[#4b4737] block mt-0.5 font-medium">4 แมตช์</span>
                        </div>

                        <div className="flex-1 flex flex-col justify-around gap-5">
                          {qfMatches.map((m, qfIdx) => {
                            const sm = matches.find((item) => item.id === m.id);
                            const isFT = sm ? sm.status === 'FT' : (m.winner !== null && m.winner !== undefined);
                            const isLive = sm ? sm.status === 'LIVE' : false;
                            const score1 = sm ? (sm.score1 ?? 0) : (m.team1.score ?? 0);
                            const score2 = sm ? (sm.score2 ?? 0) : (m.team2.score ?? 0);
                            const hasPenalties = sm
                              ? sm.penaltyScore1 !== undefined && sm.penaltyScore1 !== null && sm.penaltyScore2 !== undefined && sm.penaltyScore2 !== null
                              : m.team1.penaltyScore !== undefined && m.team1.penaltyScore !== null && m.team2.penaltyScore !== undefined && m.team2.penaltyScore !== null;
                            const pScore1 = sm ? sm.penaltyScore1 : m.team1.penaltyScore;
                            const pScore2 = sm ? sm.penaltyScore2 : m.team2.penaltyScore;
                            const winnerInfo = getKnockoutMatchWinner(sm, m);
                            const isT1Winner = isFT && winnerInfo.winnerIndex === 1;
                            const isT2Winner = isFT && winnerInfo.winnerIndex === 2;
                            const displayScore1 = isLive || isFT ? `${score1}${hasPenalties ? `(${pScore1})` : ''}` : '-';
                            const displayScore2 = isLive || isFT ? `${score2}${hasPenalties ? `(${pScore2})` : ''}` : '-';

                            let team1Name = sm ? sm.team1.name : m.team1.name;
                            let team2Name = sm ? sm.team2.name : m.team2.name;

                            if (knockoutStartingRound === 'r16' && r16Matches && r16Matches.length >= 8) {
                              const r16Idx1 = qfIdx * 2;
                              const r16Idx2 = qfIdx * 2 + 1;
                              const r16Match1 = r16Matches[r16Idx1];
                              const r16Match2 = r16Matches[r16Idx2];
                              const r16Sm1 = r16Match1 ? matches.find((item) => item.id === r16Match1.id) : undefined;
                              const r16Sm2 = r16Match2 ? matches.find((item) => item.id === r16Match2.id) : undefined;

                              const isR16FT1 = r16Sm1 ? r16Sm1.status === 'FT' : (r16Match1?.winner !== null && r16Match1?.winner !== undefined);
                              const isR16FT2 = r16Sm2 ? r16Sm2.status === 'FT' : (r16Match2?.winner !== null && r16Match2?.winner !== undefined);

                              const r16No1 = r16Sm1?.matchNumber ?? (r16Idx1 + 1);
                              const r16No2 = r16Sm2?.matchNumber ?? (r16Idx2 + 1);

                              if (isR16FT1) {
                                const w1 = getKnockoutMatchWinner(r16Sm1, r16Match1);
                                if (w1.winnerName) {
                                  team1Name = w1.winnerName;
                                }
                              } else if (!team1Name || team1Name === '-' || team1Name.trim() === '' || team1Name.startsWith('ผู้ชนะ') || team1Name.startsWith('ทีมชนะ')) {
                                team1Name = `ทีมชนะ (คู่ที่ ${r16No1})`;
                              }

                              if (isR16FT2) {
                                const w2 = getKnockoutMatchWinner(r16Sm2, r16Match2);
                                if (w2.winnerName) {
                                  team2Name = w2.winnerName;
                                }
                              } else if (!team2Name || team2Name === '-' || team2Name.trim() === '' || team2Name.startsWith('ผู้ชนะ') || team2Name.startsWith('ทีมชนะ')) {
                                team2Name = `ทีมชนะ (คู่ที่ ${r16No2})`;
                              }
                            } else {
                              const defaultPair = DEFAULT_QF_SEED_PAIRS[qfIdx] || ['A1', 'B2'];
                              team1Name = resolveKnockoutSlotName(team1Name, defaultPair[0], computedStandings, matches, groups);
                              team2Name = resolveKnockoutSlotName(team2Name, defaultPair[1], computedStandings, matches, groups);
                            }

                            const team1Logo = getTeamLogoByName(team1Name);
                            const team2Logo = getTeamLogoByName(team2Name);
                            const isPlaceholder1 = !team1Name || team1Name.startsWith('ทีมชนะ') || team1Name.startsWith('ผู้ชนะ') || /^[A-Z]\d+$/i.test(team1Name);
                            const isPlaceholder2 = !team2Name || team2Name.startsWith('ทีมชนะ') || team2Name.startsWith('ผู้ชนะ') || /^[A-Z]\d+$/i.test(team2Name);

                            const matchNo = sm?.matchNumber;
                            const roundLabel = matchNo ? `รอบ 8 ทีม (คู่ที่ ${matchNo})` : `รอบ 8 ทีม (คู่ที่ ${qfIdx + 1})`;
                            const timeLabel = sm?.timeStr
                              ? `${sm.timeStr.replace(/\s*น\.?$/g, '')} น.`
                              : m.time
                                ? `${m.time.replace(/\s*น\.?$/g, '')} น.`
                                : '';

                            return (
                              <div
                                key={m.id}
                                onClick={() => sm && setActiveDetailMatch(sm)}
                                className={`rounded-2xl bg-white p-3 sm:p-3.5 border border-[#efeded] shadow-2xs hover:shadow-md hover:border-amber-300 transition-all duration-200 ${sm ? 'cursor-pointer' : ''}`}
                              >
                                <div className="flex items-center justify-between text-[10px] text-[#4b4737] pb-1.5 mb-1.5 border-b border-[#efeded]">
                                  <span className="font-bold text-[#786607] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                                    {roundLabel}
                                  </span>
                                  {isLive ? (
                                    <span className="font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full text-[9px] flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                      LIVE
                                    </span>
                                  ) : isFT ? (
                                    <span className="font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-[9px]">
                                      {hasPenalties ? 'FT (PEN)' : 'FT'}
                                    </span>
                                  ) : timeLabel ? (
                                    <span className="font-medium text-gray-500 flex items-center gap-0.5 text-[9px]">
                                      <Clock className="w-2.5 h-2.5 text-gray-400" />
                                      {timeLabel}
                                    </span>
                                  ) : null}
                                </div>

                                <div
                                  className={`flex items-center justify-between py-1.5 px-2 rounded-xl transition-all ${isT1Winner ? 'bg-amber-50/80 font-bold text-[#1b1c1c] ring-1 ring-amber-300/60' : isT2Winner ? 'opacity-60 text-gray-500' : 'text-[#1b1c1c] hover:bg-gray-50'}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <TeamLogo name={team1Name} logo={team1Logo} className="w-5 h-5 rounded-full shrink-0" />
                                    <span className={`truncate text-xs ${isT1Winner ? 'font-black text-[#1b1c1c]' : isPlaceholder1 ? 'text-gray-400 italic text-[11px]' : 'font-semibold'}`}>{team1Name}</span>
                                  </div>
                                  <span className={`font-mono text-xs px-2 py-0.5 rounded-md min-w-[22px] text-center shrink-0 ml-1 ${isT1Winner ? 'bg-[#ffe680] text-[#786607] font-black shadow-2xs' : isLive ? 'bg-red-50 text-red-600 font-black' : 'bg-gray-100 text-gray-700 font-bold'}`}>{displayScore1}</span>
                                </div>

                                <div
                                  className={`flex items-center justify-between py-1.5 px-2 rounded-xl transition-all mt-1 ${isT2Winner ? 'bg-amber-50/80 font-bold text-[#1b1c1c] ring-1 ring-amber-300/60' : isT1Winner ? 'opacity-60 text-gray-500' : 'text-[#1b1c1c] hover:bg-gray-50'}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <TeamLogo name={team2Name} logo={team2Logo} className="w-5 h-5 rounded-full shrink-0" />
                                    <span className={`truncate text-xs ${isT2Winner ? 'font-black text-[#1b1c1c]' : isPlaceholder2 ? 'text-gray-400 italic text-[11px]' : 'font-semibold'}`}>{team2Name}</span>
                                  </div>
                                  <span className={`font-mono text-xs px-2 py-0.5 rounded-md min-w-[22px] text-center shrink-0 ml-1 ${isT2Winner ? 'bg-[#ffe680] text-[#786607] font-black shadow-2xs' : isLive ? 'bg-red-50 text-red-600 font-black' : 'bg-gray-100 text-gray-700 font-bold'}`}>{displayScore2}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Connector QF -> SF */}
                      <div className="flex flex-col min-w-[28px] sm:min-w-[36px] pt-12">
                        <div className="flex-1 flex items-center justify-center">
                          <BracketConnector />
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          <BracketConnector />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Column 2: Semifinals */}
                  {(knockoutStartingRound === 'r16' || knockoutStartingRound === 'qf' || knockoutStartingRound === 'sf') && (
                    <>
                      <div className="flex-1 flex flex-col min-w-[240px] max-w-[300px]">
                        <div className="text-center pb-2.5 mb-4 border-b border-[#efeded]">
                          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#f5f3f3] text-[#1b1c1c] text-[11px] font-black uppercase tracking-wider">
                            <span>รอบรองชนะเลิศ (SF)</span>
                          </div>
                          <span className="text-[11px] text-[#4b4737] block mt-0.5 font-medium">2 แมตช์</span>
                        </div>

                        <div className="flex-1 flex flex-col justify-around gap-8">
                          {sfMatches.map((m, idx) => {
                            const sm = matches.find((item) => item.id === m.id);
                            const isFT = sm ? sm.status === 'FT' : (m.winner !== null && m.winner !== undefined);
                            const isLive = sm ? sm.status === 'LIVE' : false;
                            const score1 = sm ? (sm.score1 ?? 0) : (m.team1.score ?? 0);
                            const score2 = sm ? (sm.score2 ?? 0) : (m.team2.score ?? 0);
                            const hasPenalties = sm
                              ? sm.penaltyScore1 !== undefined && sm.penaltyScore1 !== null && sm.penaltyScore2 !== undefined && sm.penaltyScore2 !== null
                              : m.team1.penaltyScore !== undefined && m.team1.penaltyScore !== null && m.team2.penaltyScore !== undefined && m.team2.penaltyScore !== null;
                            const pScore1 = sm ? sm.penaltyScore1 : m.team1.penaltyScore;
                            const pScore2 = sm ? sm.penaltyScore2 : m.team2.penaltyScore;
                            const winnerInfo = getKnockoutMatchWinner(sm, m);
                            const isT1Winner = isFT && winnerInfo.winnerIndex === 1;
                            const isT2Winner = isFT && winnerInfo.winnerIndex === 2;
                            const displayScore1 = isLive || isFT ? `${score1}${hasPenalties ? `(${pScore1})` : ''}` : '-';
                            const displayScore2 = isLive || isFT ? `${score2}${hasPenalties ? `(${pScore2})` : ''}` : '-';

                            const getBaseMatchNumber = (): number => {
                              const groupMatches = matches.filter(
                                (m) =>
                                  m.group !== 'Knockout' &&
                                  !m.round.includes('8 ทีม') &&
                                  !m.round.includes('รอง') &&
                                  !m.round.includes('ชิง')
                              );
                              const maxNo = groupMatches.reduce((max, m) => Math.max(max, m.matchNumber || 0), 0);
                              return maxNo > 0 ? maxNo : groupMatches.length;
                            };
                            const baseNo = getBaseMatchNumber();

                            const qf1Idx = idx * 2;
                            const qf2Idx = idx * 2 + 1;
                            const qf1Match = qfMatches[qf1Idx];
                            const qf2Match = qfMatches[qf2Idx];
                            const qf1Sm = qf1Match ? matches.find((item) => item.id === qf1Match.id) : undefined;
                            const qf2Sm = qf2Match ? matches.find((item) => item.id === qf2Match.id) : undefined;
                            const qf1No = qf1Sm?.matchNumber ?? (knockoutStartingRound === 'r16' ? baseNo + 9 + qf1Idx : baseNo + 1 + qf1Idx);
                            const qf2No = qf2Sm?.matchNumber ?? (knockoutStartingRound === 'r16' ? baseNo + 9 + qf2Idx : baseNo + 1 + qf2Idx);

                            const defaultPlaceholder1 = `ทีมชนะ (คู่ที่ ${qf1No})`;
                            const defaultPlaceholder2 = `ทีมชนะ (คู่ที่ ${qf2No})`;

                            const resolveSfTeamName = (rawName: string | undefined, defaultPlaceholder: string, qfPairIndex: number) => {
                              const name = sm ? (qfPairIndex % 2 === 0 ? sm.team1.name : sm.team2.name) : rawName;
                              if (!name || name === '-' || name.trim() === '') return defaultPlaceholder;

                              if (knockoutStartingRound === 'sf') {
                                return name.replace(/ที่\s*(\d+)\s*สาย\s*([A-Z])/gi, '$2$1');
                              }

                              const qfMatch = qfMatches[qfPairIndex];
                              const qfSm = qfMatch ? matches.find((item) => item.id === qfMatch.id) : undefined;
                              const isQfFT = qfSm ? qfSm.status === 'FT' : (qfMatch?.winner !== null && qfMatch?.winner !== undefined);

                              if (isQfFT) {
                                const w = getKnockoutMatchWinner(qfSm, qfMatch);
                                if (w.winnerName) return w.winnerName;
                              }

                              if (/^[A-Z]\d+$/i.test(name) || name.startsWith('ผู้ชนะ') || name.startsWith('ทีมชนะ')) {
                                return defaultPlaceholder;
                              }

                              return name.replace(/ที่\s*(\d+)\s*สาย\s*([A-Z])/gi, '$2$1');
                            };

                            const team1Name = resolveSfTeamName(m.team1.name, defaultPlaceholder1, idx * 2);
                            const team2Name = resolveSfTeamName(m.team2.name, defaultPlaceholder2, idx * 2 + 1);

                            const team1Logo = getTeamLogoByName(team1Name);
                            const team2Logo = getTeamLogoByName(team2Name);
                            const isPlaceholder1 = !team1Name || team1Name.startsWith('ทีมชนะ') || team1Name.startsWith('ผู้ชนะ') || /^[A-Z]\d+$/i.test(team1Name);
                            const isPlaceholder2 = !team2Name || team2Name.startsWith('ทีมชนะ') || team2Name.startsWith('ผู้ชนะ') || /^[A-Z]\d+$/i.test(team2Name);

                            const matchNo = sm?.matchNumber;
                            const roundLabel = matchNo ? `รอบรองชนะเลิศ ${idx + 1} (คู่ที่ ${matchNo})` : `รอบรองชนะเลิศ ${idx + 1}`;
                            const timeLabel = sm?.timeStr
                              ? `${sm.timeStr.replace(/\s*น\.?$/g, '')} น.`
                              : m.time
                                ? `${m.time.replace(/\s*น\.?$/g, '')} น.`
                                : '';

                            return (
                              <div
                                key={m.id}
                                onClick={() => sm && setActiveDetailMatch(sm)}
                                className={`rounded-2xl bg-white p-3.5 sm:p-4 border border-[#efeded] shadow-2xs hover:shadow-md hover:border-amber-300 transition-all duration-200 ${sm ? 'cursor-pointer' : ''}`}
                              >
                                <div className="flex items-center justify-between text-[10px] text-[#4b4737] pb-1.5 mb-1.5 border-b border-[#efeded]">
                                  <span className="font-bold text-[#786607] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                                    {roundLabel}
                                  </span>
                                  {isLive ? (
                                    <span className="font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full text-[9px] flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                      LIVE
                                    </span>
                                  ) : isFT ? (
                                    <span className="font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-[9px]">
                                      {hasPenalties ? 'FT (PEN)' : 'FT'}
                                    </span>
                                  ) : timeLabel ? (
                                    <span className="font-medium text-gray-500 flex items-center gap-0.5 text-[9px]">
                                      <Clock className="w-2.5 h-2.5 text-gray-400" />
                                      {timeLabel}
                                    </span>
                                  ) : null}
                                </div>

                                <div
                                  className={`flex items-center justify-between py-1.5 px-2.5 rounded-xl transition-all ${isT1Winner ? 'bg-amber-50/80 font-bold text-[#1b1c1c] ring-1 ring-amber-300/60' : isT2Winner ? 'opacity-60 text-gray-500' : 'text-[#1b1c1c] hover:bg-gray-50'}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <TeamLogo name={team1Name} logo={team1Logo} className="w-5 h-5 rounded-full shrink-0" />
                                    <span className={`truncate text-xs ${isT1Winner ? 'font-black text-[#1b1c1c]' : isPlaceholder1 ? 'text-gray-400 italic text-[11px]' : 'font-semibold'}`}>{team1Name}</span>
                                  </div>
                                  <span className={`font-mono text-xs px-2 py-0.5 rounded-md min-w-[22px] text-center shrink-0 ml-1 ${isT1Winner ? 'bg-[#ffe680] text-[#786607] font-black shadow-2xs' : isLive ? 'bg-red-50 text-red-600 font-black' : 'bg-gray-100 text-gray-700 font-bold'}`}>{displayScore1}</span>
                                </div>

                                <div
                                  className={`flex items-center justify-between py-1.5 px-2.5 rounded-xl transition-all mt-1 ${isT2Winner ? 'bg-amber-50/80 font-bold text-[#1b1c1c] ring-1 ring-amber-300/60' : isT1Winner ? 'opacity-60 text-gray-500' : 'text-[#1b1c1c] hover:bg-gray-50'}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <TeamLogo name={team2Name} logo={team2Logo} className="w-5 h-5 rounded-full shrink-0" />
                                    <span className={`truncate text-xs ${isT2Winner ? 'font-black text-[#1b1c1c]' : isPlaceholder2 ? 'text-gray-400 italic text-[11px]' : 'font-semibold'}`}>{team2Name}</span>
                                  </div>
                                  <span className={`font-mono text-xs px-2 py-0.5 rounded-md min-w-[22px] text-center shrink-0 ml-1 ${isT2Winner ? 'bg-[#ffe680] text-[#786607] font-black shadow-2xs' : isLive ? 'bg-red-50 text-red-600 font-black' : 'bg-gray-100 text-gray-700 font-bold'}`}>{displayScore2}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Connector SF -> Final */}
                      <div className="flex flex-col min-w-[28px] sm:min-w-[40px] pt-12">
                        <div className="flex-1 flex items-center justify-center">
                          <BracketConnector />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Column 3: Grand Final */}
                  <div className="flex-1 flex flex-col min-w-[260px] max-w-[320px]">
                    <div className="text-center pb-2.5 mb-4 border-b border-[#efeded]">
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 text-[11px] font-black uppercase tracking-wider shadow-2xs">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>ชิงชนะเลิศ (Grand Final)</span>
                      </div>
                      <span className="text-[11px] font-medium text-amber-800/80 block mt-0.5">ชิงถ้วย Science Cup</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      {(() => {
                        const sm = finalMatch ? matches.find((item) => item.id === finalMatch.id) : undefined;
                        const isFT = sm ? sm.status === 'FT' : (finalMatch?.winner !== null && finalMatch?.winner !== undefined);
                        const isLive = sm ? sm.status === 'LIVE' : false;
                        const score1 = sm ? (sm.score1 ?? 0) : (finalMatch?.team1?.score ?? 0);
                        const score2 = sm ? (sm.score2 ?? 0) : (finalMatch?.team2?.score ?? 0);
                        const hasPenalties = sm
                          ? sm.penaltyScore1 !== undefined && sm.penaltyScore1 !== null && sm.penaltyScore2 !== undefined && sm.penaltyScore2 !== null
                          : finalMatch?.team1?.penaltyScore !== undefined && finalMatch?.team1?.penaltyScore !== null && finalMatch?.team2?.penaltyScore !== undefined && finalMatch?.team2?.penaltyScore !== null;
                        const pScore1 = sm ? sm.penaltyScore1 : finalMatch?.team1?.penaltyScore;
                        const pScore2 = sm ? sm.penaltyScore2 : finalMatch?.team2?.penaltyScore;
                        const winnerInfo = getKnockoutMatchWinner(sm, finalMatch);
                        const isTeam1Winner = isFT && winnerInfo.winnerIndex === 1;
                        const isTeam2Winner = isFT && winnerInfo.winnerIndex === 2;
                        const displayScore1 = isLive || isFT ? `${score1}${hasPenalties ? `(${pScore1})` : ''}` : '-';
                        const displayScore2 = isLive || isFT ? `${score2}${hasPenalties ? `(${pScore2})` : ''}` : '-';

                        const resolveFinalTeamName = (rawName: string | undefined, defaultPlaceholder: string, sfMatchIdx: number) => {
                          const name = sm ? (sfMatchIdx === 0 ? sm.team1.name : sm.team2.name) : rawName;
                          if (!name || name === '-' || name.trim() === '') return defaultPlaceholder;

                          const sfMatch = sfMatches[sfMatchIdx];
                          const sfSm = sfMatch ? matches.find((item) => item.id === sfMatch.id) : undefined;
                          const isSfFT = sfSm ? sfSm.status === 'FT' : (sfMatch?.winner !== null && sfMatch?.winner !== undefined);

                          if (isSfFT) {
                            const w = getKnockoutMatchWinner(sfSm, sfMatch);
                            if (w.winnerName) return w.winnerName;
                          }

                          if (/^[A-Z]\d+$/i.test(name) || name.startsWith('ผู้ชนะ') || name.startsWith('ทีมชนะ')) {
                            return defaultPlaceholder;
                          }

                          return name.replace(/ที่\s*(\d+)\s*สาย\s*([A-Z])/gi, '$2$1');
                        };

                        const getBaseMatchNumber = (): number => {
                          const groupMatches = matches.filter(
                            (m) =>
                              m.group !== 'Knockout' &&
                              !m.round.includes('8 ทีม') &&
                              !m.round.includes('รอง') &&
                              !m.round.includes('ชิง')
                          );
                          const maxNo = groupMatches.reduce((max, m) => Math.max(max, m.matchNumber || 0), 0);
                          return maxNo > 0 ? maxNo : groupMatches.length;
                        };
                        const baseNo = getBaseMatchNumber();

                        const sf1Match = sfMatches[0];
                        const sf1Sm = sf1Match ? matches.find((item) => item.id === sf1Match.id) : undefined;
                        const sf1No = sf1Sm?.matchNumber ?? (knockoutStartingRound === 'r16' ? baseNo + 13 : knockoutStartingRound === 'qf' ? baseNo + 5 : baseNo + 1);

                        const sf2Match = sfMatches[1];
                        const sf2Sm = sf2Match ? matches.find((item) => item.id === sf2Match.id) : undefined;
                        const sf2No = sf2Sm?.matchNumber ?? (knockoutStartingRound === 'r16' ? baseNo + 14 : knockoutStartingRound === 'qf' ? baseNo + 6 : baseNo + 2);

                        const defaultPlaceholder1 = `ทีมชนะ (คู่ที่ ${sf1No})`;
                        const defaultPlaceholder2 = `ทีมชนะ (คู่ที่ ${sf2No})`;

                        const team1Name = resolveFinalTeamName(finalMatch?.team1?.name, defaultPlaceholder1, 0);
                        const team2Name = resolveFinalTeamName(finalMatch?.team2?.name, defaultPlaceholder2, 1);
                        const team1Logo = getTeamLogoByName(team1Name);
                        const team2Logo = getTeamLogoByName(team2Name);
                        const isPlaceholder1 = !team1Name || team1Name.startsWith('ทีมชนะ') || team1Name.startsWith('ผู้ชนะ') || /^[A-Z]\d+$/i.test(team1Name);
                        const isPlaceholder2 = !team2Name || team2Name.startsWith('ทีมชนะ') || team2Name.startsWith('ผู้ชนะ') || /^[A-Z]\d+$/i.test(team2Name);

                        const matchNo = sm?.matchNumber;
                        const roundLabel = matchNo ? `นัดชิงชนะเลิศ (คู่ที่ ${matchNo})` : 'นัดชิงชนะเลิศ';
                        const timeLabel = sm?.timeStr
                          ? `${sm.timeStr.replace(/\s*น\.?$/g, '')} น.`
                          : finalMatch?.time
                            ? `${finalMatch.time.replace(/\s*น\.?$/g, '')} น.`
                            : '';

                        return (
                          <div
                            onClick={() => sm && setActiveDetailMatch(sm)}
                            className={`rounded-3xl bg-gradient-to-b from-amber-100/50 via-yellow-50/30 to-white p-4 sm:p-5 border-2 border-amber-300/90 shadow-md relative group hover:shadow-lg hover:border-amber-400 transition-all duration-300 ${sm ? 'cursor-pointer' : ''}`}
                          >
                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 flex items-center justify-center absolute -top-4.5 left-1/2 -translate-x-1/2 shadow-xs ring-4 ring-white">
                              <Trophy className="w-4.5 h-4.5 drop-shadow-xs" />
                            </div>

                            <div className="text-center pt-2.5 pb-2 mb-2.5 border-b border-amber-200/60">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                                  {roundLabel}
                                </span>
                                {isLive ? (
                                  <span className="font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full text-[9px] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                    LIVE
                                  </span>
                                ) : isFT ? (
                                  <span className="font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-[9px]">
                                    {hasPenalties ? 'FT (PEN)' : 'FT'}
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5 flex items-center justify-center gap-1.5">
                                <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3 text-amber-700" />{sm?.dateStr || finalMatch?.date || '-'}</span>
                                <span>•</span>
                                <span className="font-semibold text-gray-700 flex items-center gap-0.5"><Clock className="w-3 h-3 text-amber-700" />{timeLabel}</span>
                              </div>
                            </div>

                            {/* Final Team 1 */}
                            <div
                              className={`flex items-center justify-between p-2.5 rounded-2xl text-xs sm:text-sm my-1.5 transition-all ${isTeam1Winner
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 font-black shadow-xs ring-1 ring-amber-400'
                                : isFT && isTeam2Winner
                                  ? 'bg-gray-100/70 text-gray-400 opacity-60'
                                  : 'bg-white text-[#1b1c1c] border border-gray-200/80 shadow-2xs'
                                }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <TeamLogo name={team1Name} logo={team1Logo} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full shrink-0" />
                                <span className={`truncate ${isTeam1Winner ? 'font-black' : isPlaceholder1 ? 'text-gray-400 italic text-xs' : 'font-bold'}`}>
                                  {team1Name}
                                </span>
                                {isTeam1Winner && <Sparkles className="w-3.5 h-3.5 text-amber-950 shrink-0" />}
                              </div>
                              <span className={`font-mono text-sm sm:text-base px-2.5 py-0.5 rounded-lg text-center min-w-[26px] ${isTeam1Winner ? 'bg-amber-950/10 font-black text-amber-950' : isLive ? 'bg-red-50 text-red-600 font-black' : 'bg-gray-100 font-bold text-gray-800'
                                }`}>
                                {displayScore1}
                              </span>
                            </div>

                            {/* Final Team 2 */}
                            <div
                              className={`flex items-center justify-between p-2.5 rounded-2xl text-xs sm:text-sm my-1.5 transition-all ${isTeam2Winner
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 font-black shadow-xs ring-1 ring-amber-400'
                                : isFT && isTeam1Winner
                                  ? 'bg-gray-100/70 text-gray-400 opacity-60'
                                  : 'bg-white text-[#1b1c1c] border border-gray-200/80 shadow-2xs'
                                }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <TeamLogo name={team2Name} logo={team2Logo} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full shrink-0" />
                                <span className={`truncate ${isTeam2Winner ? 'font-black' : isPlaceholder2 ? 'text-gray-400 italic text-xs' : 'font-bold'}`}>
                                  {team2Name}
                                </span>
                                {isTeam2Winner && <Sparkles className="w-3.5 h-3.5 text-amber-950 shrink-0" />}
                              </div>
                              <span className={`font-mono text-sm sm:text-base px-2.5 py-0.5 rounded-lg text-center min-w-[26px] ${isTeam2Winner ? 'bg-amber-950/10 font-black text-amber-950' : isLive ? 'bg-red-50 text-red-600 font-black' : 'bg-gray-100 font-bold text-gray-800'
                                }`}>
                                {displayScore2}
                              </span>
                            </div>

                            {/* Winner Banner if FT */}
                            {(isTeam1Winner || isTeam2Winner) && (
                              <div className="mt-2.5 p-2 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 rounded-xl text-center text-xs font-black text-amber-950 flex items-center justify-center gap-1.5 shadow-2xs">
                                <Trophy className="w-4 h-4 text-amber-900" />
                                <span>แชมป์เปี้ยน: {isTeam1Winner ? team1Name : team2Name}</span>
                              </div>
                            )}

                            {/* Venue */}
                            <div className="mt-3 pt-2 border-t border-amber-200/50 text-center text-[10px] sm:text-[11px] font-medium text-gray-600 flex items-center justify-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>{sm?.venue || finalMatch?.venue || 'ยังไม่ระบุสนาม'}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                /* Single column mobile view */
                <div className="max-w-md mx-auto space-y-3">
                  {bracketMobileRound === 'r16' && (
                    <div className="space-y-2.5">
                      <div className="text-center pb-1.5 border-b border-[#efeded]">
                        <span className="font-display font-bold text-xs uppercase tracking-wider text-[#6f5d00]">
                          รอบ 16 ทีมสุดท้าย (R16)
                        </span>
                      </div>
                      {r16Matches.map((m, r16Idx) => {
                        const sm = matches.find((item) => item.id === m.id);
                        const isFT = sm ? sm.status === 'FT' : (m.winner !== null && m.winner !== undefined);
                        const isLive = sm ? sm.status === 'LIVE' : false;
                        const score1 = sm ? (sm.score1 ?? 0) : (m.team1.score ?? 0);
                        const score2 = sm ? (sm.score2 ?? 0) : (m.team2.score ?? 0);
                        const hasPenalties = sm
                          ? sm.penaltyScore1 !== undefined && sm.penaltyScore1 !== null && sm.penaltyScore2 !== undefined && sm.penaltyScore2 !== null
                          : m.team1.penaltyScore !== undefined && m.team1.penaltyScore !== null && m.team2.penaltyScore !== undefined && m.team2.penaltyScore !== null;
                        const pScore1 = sm ? sm.penaltyScore1 : m.team1.penaltyScore;
                        const pScore2 = sm ? sm.penaltyScore2 : m.team2.penaltyScore;
                        const winnerInfo = getKnockoutMatchWinner(sm, m);
                        const isT1Winner = isFT && winnerInfo.winnerIndex === 1;
                        const isT2Winner = isFT && winnerInfo.winnerIndex === 2;
                        const displayScore1 = isLive || isFT ? `${score1}${hasPenalties ? `(${pScore1})` : ''}` : '-';
                        const displayScore2 = isLive || isFT ? `${score2}${hasPenalties ? `(${pScore2})` : ''}` : '-';

                        const defaultPair = DEFAULT_R16_SEED_PAIRS[r16Idx] || ['A1', 'B2'];
                        const team1Name = resolveKnockoutSlotName(sm ? sm.team1.name : m.team1.name, defaultPair[0], computedStandings, matches, groups);
                        const team2Name = resolveKnockoutSlotName(sm ? sm.team2.name : m.team2.name, defaultPair[1], computedStandings, matches, groups);
                        const team1Logo = getTeamLogoByName(team1Name);
                        const team2Logo = getTeamLogoByName(team2Name);
                        const matchNo = sm?.matchNumber;
                        const roundLabel = matchNo ? `รอบ 16 ทีม (คู่ที่ ${matchNo})` : 'รอบ 16 ทีม';

                        return (
                          <div
                            key={m.id}
                            onClick={() => sm && setActiveDetailMatch(sm)}
                            className="rounded-xl bg-white p-3 border border-[#efeded] shadow-2xs hover:border-amber-300 transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between text-[10px] text-[#4b4737] pb-1 mb-1 border-b border-[#efeded]">
                              <span className="font-bold text-[#786607]">{roundLabel}</span>
                              {isLive ? (
                                <span className="font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded-full text-[9px] flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                  LIVE
                                </span>
                              ) : isFT ? (
                                <span className="font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded text-[9px]">
                                  FT
                                </span>
                              ) : (
                                <span>{sm?.timeStr || m.time || ''}</span>
                              )}
                            </div>
                            <div className={`flex items-center justify-between py-1 px-1.5 rounded-lg text-xs ${isT1Winner ? 'bg-amber-50/80 font-bold text-[#1b1c1c]' : 'text-[#4b4737]'}`}>
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <TeamLogo name={team1Name} logo={team1Logo} className="w-4 h-4 rounded-full" />
                                <span className="truncate">{team1Name}</span>
                              </div>
                              <span className={`font-mono text-xs font-bold px-1.5 py-0.2 rounded ml-1 ${isT1Winner ? 'bg-[#ffe680] text-[#786607]' : isLive ? 'bg-red-50 text-red-600' : ''}`}>{displayScore1}</span>
                            </div>
                            <div className={`flex items-center justify-between py-1 px-1.5 rounded-lg text-xs mt-0.5 ${isT2Winner ? 'bg-amber-50/80 font-bold text-[#1b1c1c]' : 'text-[#4b4737]'}`}>
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <TeamLogo name={team2Name} logo={team2Logo} className="w-4 h-4 rounded-full" />
                                <span className="truncate">{team2Name}</span>
                              </div>
                              <span className={`font-mono text-xs font-bold px-1.5 py-0.2 rounded ml-1 ${isT2Winner ? 'bg-[#ffe680] text-[#786607]' : isLive ? 'bg-red-50 text-red-600' : ''}`}>{displayScore2}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {bracketMobileRound === 'qf' && (
                    <div className="space-y-2.5">
                      <div className="text-center pb-1.5 border-b border-[#efeded]">
                        <span className="font-display font-bold text-xs uppercase tracking-wider text-[#6f5d00]">
                          รอบ 8 ทีมสุดท้าย (QF)
                        </span>
                      </div>
                      {qfMatches.map((m, qfIdx) => {
                        const sm = matches.find((item) => item.id === m.id);
                        const isFT = sm ? sm.status === 'FT' : (m.winner !== null && m.winner !== undefined);
                        const isLive = sm ? sm.status === 'LIVE' : false;
                        const score1 = sm ? (sm.score1 ?? 0) : (m.team1.score ?? 0);
                        const score2 = sm ? (sm.score2 ?? 0) : (m.team2.score ?? 0);
                        const hasPenalties = sm
                          ? sm.penaltyScore1 !== undefined && sm.penaltyScore1 !== null && sm.penaltyScore2 !== undefined && sm.penaltyScore2 !== null
                          : m.team1.penaltyScore !== undefined && m.team1.penaltyScore !== null && m.team2.penaltyScore !== undefined && m.team2.penaltyScore !== null;
                        const pScore1 = sm ? sm.penaltyScore1 : m.team1.penaltyScore;
                        const pScore2 = sm ? sm.penaltyScore2 : m.team2.penaltyScore;
                        const winnerInfo = getKnockoutMatchWinner(sm, m);
                        const isT1Winner = isFT && winnerInfo.winnerIndex === 1;
                        const isT2Winner = isFT && winnerInfo.winnerIndex === 2;
                        const displayScore1 = isLive || isFT ? `${score1}${hasPenalties ? `(${pScore1})` : ''}` : '-';
                        const displayScore2 = isLive || isFT ? `${score2}${hasPenalties ? `(${pScore2})` : ''}` : '-';

                        let team1Name = sm ? sm.team1.name : m.team1.name;
                        let team2Name = sm ? sm.team2.name : m.team2.name;

                        if (knockoutStartingRound === 'r16' && r16Matches && r16Matches.length >= 8) {
                          const r16Idx1 = qfIdx * 2;
                          const r16Idx2 = qfIdx * 2 + 1;
                          const r16Match1 = r16Matches[r16Idx1];
                          const r16Match2 = r16Matches[r16Idx2];
                          const r16Sm1 = r16Match1 ? matches.find(item => item.id === r16Match1.id) : undefined;
                          const r16Sm2 = r16Match2 ? matches.find(item => item.id === r16Match2.id) : undefined;
                          const isR16FT1 = r16Sm1 ? r16Sm1.status === 'FT' : (r16Match1?.winner !== null && r16Match1?.winner !== undefined);
                          const isR16FT2 = r16Sm2 ? r16Sm2.status === 'FT' : (r16Match2?.winner !== null && r16Match2?.winner !== undefined);
                          const r16No1 = r16Sm1?.matchNumber ?? (r16Idx1 + 1);
                          const r16No2 = r16Sm2?.matchNumber ?? (r16Idx2 + 1);

                          if (isR16FT1) {
                            const w1 = getKnockoutMatchWinner(r16Sm1, r16Match1);
                            if (w1.winnerName) {
                              team1Name = w1.winnerName;
                            }
                          } else if (!team1Name || team1Name === '-' || team1Name.trim() === '' || team1Name.startsWith('ผู้ชนะ') || team1Name.startsWith('ทีมชนะ')) {
                            team1Name = `ทีมชนะ (คู่ที่ ${r16No1})`;
                          }

                          if (isR16FT2) {
                            const w2 = getKnockoutMatchWinner(r16Sm2, r16Match2);
                            if (w2.winnerName) {
                              team2Name = w2.winnerName;
                            }
                          } else if (!team2Name || team2Name === '-' || team2Name.trim() === '' || team2Name.startsWith('ผู้ชนะ') || team2Name.startsWith('ทีมชนะ')) {
                            team2Name = `ทีมชนะ (คู่ที่ ${r16No2})`;
                          }
                        } else {
                          const defaultPair = DEFAULT_QF_SEED_PAIRS[qfIdx] || ['A1', 'B2'];
                          team1Name = resolveKnockoutSlotName(team1Name, defaultPair[0], computedStandings, matches, groups);
                          team2Name = resolveKnockoutSlotName(team2Name, defaultPair[1], computedStandings, matches, groups);
                        }

                        const team1Logo = getTeamLogoByName(team1Name);
                        const team2Logo = getTeamLogoByName(team2Name);
                        const matchNo = sm?.matchNumber;
                        const roundLabel = matchNo ? `รอบ 8 ทีม (คู่ที่ ${matchNo})` : `รอบ 8 ทีม (คู่ที่ ${qfIdx + 1})`;

                        return (
                          <div
                            key={m.id}
                            onClick={() => sm && setActiveDetailMatch(sm)}
                            className="rounded-xl bg-white p-3 border border-[#efeded] shadow-2xs hover:border-amber-300 transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between text-[10px] text-[#4b4737] pb-1 mb-1 border-b border-[#efeded]">
                              <span className="font-bold text-[#786607]">{roundLabel}</span>
                              {isLive ? (
                                <span className="font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded-full text-[9px] flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                  LIVE
                                </span>
                              ) : isFT ? (
                                <span className="font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded text-[9px]">
                                  FT
                                </span>
                              ) : (
                                <span>{sm?.timeStr || m.time || ''}</span>
                              )}
                            </div>
                            <div className={`flex items-center justify-between py-1 px-1.5 rounded-lg text-xs ${isT1Winner ? 'bg-amber-50/80 font-bold text-[#1b1c1c]' : 'text-[#4b4737]'}`}>
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <TeamLogo name={team1Name} logo={team1Logo} className="w-4 h-4 rounded-full" />
                                <span className="truncate">{team1Name}</span>
                              </div>
                              <span className={`font-mono text-xs font-bold px-1.5 py-0.2 rounded ml-1 ${isT1Winner ? 'bg-[#ffe680] text-[#786607]' : isLive ? 'bg-red-50 text-red-600' : ''}`}>{displayScore1}</span>
                            </div>
                            <div className={`flex items-center justify-between py-1 px-1.5 rounded-lg text-xs mt-0.5 ${isT2Winner ? 'bg-amber-50/80 font-bold text-[#1b1c1c]' : 'text-[#4b4737]'}`}>
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <TeamLogo name={team2Name} logo={team2Logo} className="w-4 h-4 rounded-full" />
                                <span className="truncate">{team2Name}</span>
                              </div>
                              <span className={`font-mono text-xs font-bold px-1.5 py-0.2 rounded ml-1 ${isT2Winner ? 'bg-[#ffe680] text-[#786607]' : isLive ? 'bg-red-50 text-red-600' : ''}`}>{displayScore2}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {bracketMobileRound === 'sf' && (
                    <div className="space-y-2.5">
                      <div className="text-center pb-1.5 border-b border-[#efeded]">
                        <span className="font-display font-bold text-xs uppercase tracking-wider text-[#6f5d00]">
                          รอบรองชนะเลิศ (Semifinals)
                        </span>
                      </div>
                      {sfMatches.map((m, idx) => {
                        const sm = matches.find((item) => item.id === m.id);
                        const isFT = sm ? sm.status === 'FT' : (m.winner !== null && m.winner !== undefined);
                        const isLive = sm ? sm.status === 'LIVE' : false;
                        const score1 = sm ? (sm.score1 ?? 0) : (m.team1.score ?? 0);
                        const score2 = sm ? (sm.score2 ?? 0) : (m.team2.score ?? 0);
                        const hasPenalties = sm
                          ? sm.penaltyScore1 !== undefined && sm.penaltyScore1 !== null && sm.penaltyScore2 !== undefined && sm.penaltyScore2 !== null
                          : m.team1.penaltyScore !== undefined && m.team1.penaltyScore !== null && m.team2.penaltyScore !== undefined && m.team2.penaltyScore !== null;
                        const pScore1 = sm ? sm.penaltyScore1 : m.team1.penaltyScore;
                        const pScore2 = sm ? sm.penaltyScore2 : m.team2.penaltyScore;
                        const winnerInfo = getKnockoutMatchWinner(sm, m);
                        const isT1Winner = isFT && winnerInfo.winnerIndex === 1;
                        const isT2Winner = isFT && winnerInfo.winnerIndex === 2;
                        const displayScore1 = isLive || isFT ? `${score1}${hasPenalties ? `(${pScore1})` : ''}` : '-';
                        const displayScore2 = isLive || isFT ? `${score2}${hasPenalties ? `(${pScore2})` : ''}` : '-';

                        const team1Name = sm ? sm.team1.name : m.team1.name;
                        const team2Name = sm ? sm.team2.name : m.team2.name;
                        const team1Logo = getTeamLogoByName(team1Name);
                        const team2Logo = getTeamLogoByName(team2Name);
                        const matchNo = sm?.matchNumber;
                        const roundLabel = matchNo ? `รอบรองชนะเลิศ ${idx + 1} (คู่ที่ ${matchNo})` : `รอบรองชนะเลิศ ${idx + 1}`;

                        return (
                          <div
                            key={m.id}
                            onClick={() => sm && setActiveDetailMatch(sm)}
                            className="rounded-xl bg-white p-3 border border-[#efeded] shadow-2xs hover:border-amber-300 transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between text-[10px] text-[#4b4737] pb-1 mb-1 border-b border-[#efeded]">
                              <span className="font-bold text-[#786607]">{roundLabel}</span>
                              {isLive ? (
                                <span className="font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded-full text-[9px] flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                  LIVE
                                </span>
                              ) : isFT ? (
                                <span className="font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded text-[9px]">
                                  FT
                                </span>
                              ) : (
                                <span>{sm?.timeStr || m.time || ''}</span>
                              )}
                            </div>
                            <div className={`flex items-center justify-between py-1 px-1.5 rounded-lg text-xs ${isT1Winner ? 'bg-amber-50/80 font-bold text-[#1b1c1c]' : 'text-[#4b4737]'}`}>
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <TeamLogo name={team1Name} logo={team1Logo} className="w-4 h-4 rounded-full" />
                                <span className="truncate">{team1Name}</span>
                              </div>
                              <span className={`font-mono text-xs font-bold px-1.5 py-0.2 rounded ml-1 ${isT1Winner ? 'bg-[#ffe680] text-[#786607]' : isLive ? 'bg-red-50 text-red-600' : ''}`}>{displayScore1}</span>
                            </div>
                            <div className={`flex items-center justify-between py-1 px-1.5 rounded-lg text-xs mt-0.5 ${isT2Winner ? 'bg-amber-50/80 font-bold text-[#1b1c1c]' : 'text-[#4b4737]'}`}>
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <TeamLogo name={team2Name} logo={team2Logo} className="w-4 h-4 rounded-full" />
                                <span className="truncate">{team2Name}</span>
                              </div>
                              <span className={`font-mono text-xs font-bold px-1.5 py-0.2 rounded ml-1 ${isT2Winner ? 'bg-[#ffe680] text-[#786607]' : isLive ? 'bg-red-50 text-red-600' : ''}`}>{displayScore2}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {bracketMobileRound === 'final' && (
                    <div className="space-y-2.5">
                      <div className="text-center pb-1.5 border-b border-[#efeded]">
                        <span className="font-display font-bold text-xs uppercase tracking-wider text-[#6f5d00]">
                          นัดชิงชนะเลิศ (Grand Final)
                        </span>
                      </div>
                      {finalMatch && (() => {
                        const sm = matches.find((item) => item.id === finalMatch.id);
                        const isFT = sm ? sm.status === 'FT' : (finalMatch?.winner !== null && finalMatch?.winner !== undefined);
                        const isLive = sm ? sm.status === 'LIVE' : false;
                        const score1 = sm ? (sm.score1 ?? 0) : (finalMatch?.team1?.score ?? 0);
                        const score2 = sm ? (sm.score2 ?? 0) : (finalMatch?.team2?.score ?? 0);
                        const hasPenalties = sm
                          ? sm.penaltyScore1 !== undefined && sm.penaltyScore1 !== null && sm.penaltyScore2 !== undefined && sm.penaltyScore2 !== null
                          : finalMatch?.team1?.penaltyScore !== undefined && finalMatch?.team1?.penaltyScore !== null && finalMatch?.team2?.penaltyScore !== undefined && finalMatch?.team2?.penaltyScore !== null;
                        const pScore1 = sm ? sm.penaltyScore1 : finalMatch?.team1?.penaltyScore;
                        const pScore2 = sm ? sm.penaltyScore2 : finalMatch?.team2?.penaltyScore;
                        const winnerInfo = getKnockoutMatchWinner(sm, finalMatch);
                        const isTeam1Winner = isFT && winnerInfo.winnerIndex === 1;
                        const isTeam2Winner = isFT && winnerInfo.winnerIndex === 2;
                        const displayScore1 = isLive || isFT ? `${score1}${hasPenalties ? `(${pScore1})` : ''}` : '-';
                        const displayScore2 = isLive || isFT ? `${score2}${hasPenalties ? `(${pScore2})` : ''}` : '-';

                        const team1Name = sm?.team1?.name || finalMatch.team1?.name || 'ทีม 1';
                        const team2Name = sm?.team2?.name || finalMatch.team2?.name || 'ทีม 2';
                        const team1Logo = getTeamLogoByName(team1Name);
                        const team2Logo = getTeamLogoByName(team2Name);

                        return (
                          <div
                            onClick={() => sm && setActiveDetailMatch(sm)}
                            className="rounded-2xl bg-gradient-to-b from-amber-100/50 via-yellow-50/30 to-white p-4 border-2 border-amber-300 shadow-sm relative cursor-pointer hover:border-amber-400 transition-all"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 flex items-center justify-center absolute -top-4 left-1/2 -translate-x-1/2 shadow-xs ring-2 ring-white">
                              <Trophy className="w-4 h-4" />
                            </div>
                            <div className="text-center pt-2 pb-2 mb-2 border-b border-amber-200/60">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-amber-900 block">
                                  {sm?.matchNumber ? `นัดชิงชนะเลิศ (คู่ที่ ${sm.matchNumber})` : 'นัดชิงชนะเลิศ'}
                                </span>
                                {isLive ? (
                                  <span className="font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded-full text-[9px] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                    LIVE
                                  </span>
                                ) : isFT ? (
                                  <span className="font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded text-[9px]">
                                    FT
                                  </span>
                                ) : null}
                              </div>
                              <span className="text-[10px] text-gray-500 block mt-0.5">
                                {sm?.dateStr || finalMatch?.date || '-'} • {sm?.timeStr || finalMatch?.time || ''}
                              </span>
                            </div>
                            <div className={`flex items-center justify-between p-2.5 rounded-xl text-xs sm:text-sm my-1 ${isTeam1Winner ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 font-black shadow-xs' : 'bg-white text-[#1b1c1c] border border-gray-200/80 shadow-2xs'
                              }`}>
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <TeamLogo name={team1Name} logo={team1Logo} className="w-5 h-5 rounded-full" />
                                <span className="truncate">{team1Name}</span>
                                {isTeam1Winner && <Sparkles className="w-3.5 h-3.5 text-amber-950 shrink-0" />}
                              </div>
                              <span className="font-mono font-black text-base ml-1">{displayScore1}</span>
                            </div>
                            <div className={`flex items-center justify-between p-2.5 rounded-xl text-xs sm:text-sm my-1 ${isTeam2Winner ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 font-black shadow-xs' : 'bg-white text-[#1b1c1c] border border-gray-200/80 shadow-2xs'
                              }`}>
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <TeamLogo name={team2Name} logo={team2Logo} className="w-5 h-5 rounded-full" />
                                <span className="truncate">{team2Name}</span>
                                {isTeam2Winner && <Sparkles className="w-3.5 h-3.5 text-amber-950 shrink-0" />}
                              </div>
                              <span className="font-mono font-black text-base ml-1">{displayScore2}</span>
                            </div>

                            {/* Venue */}
                            <div className="mt-3 pt-2 border-t border-amber-200/50 text-center text-[10px] text-gray-600 flex items-center justify-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>{sm?.venue || finalMatch?.venue || 'ยังไม่ระบุสนาม'}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Match Details Modal (Read-Only Spectator Sheet) */}
      {activeDetailMatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#efeded] relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto space-y-4">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#efeded]">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-800 border border-amber-400/30 text-xs font-bold font-display">
                  คู่ที่ {activeDetailMatch.matchNumber || 1}
                </span>
                <span className="text-sm font-bold text-[#1b1c1c]">
                  {formatMatchGroupLabel(activeDetailMatch.group, activeDetailMatch.round)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveDetailMatch(null)}
                className="p-1.5 rounded-full hover:bg-[#efeded] text-[#4b4737] transition-colors"
                title="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Premium Match Arena Card */}
            {(() => {
              const modalT1Name = formatUserTeamName(activeDetailMatch.team1?.name, false, activeDetailMatch);
              const modalT2Name = formatUserTeamName(activeDetailMatch.team2?.name, true, activeDetailMatch);
              const modalT1Logo = modalT1Name !== '-' ? (getTeamLogoByName(modalT1Name) || '') : '';
              const modalT2Logo = modalT2Name !== '-' ? (getTeamLogoByName(modalT2Name) || '') : '';

              return (
                <>
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#111520] via-[#0c0f17] to-[#07090e] p-5 text-white border border-white/[0.12] shadow-xl text-center">
                    {/* Center Spotlight & Ambient Glow */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-32 bg-amber-400/[0.08] blur-2xl rounded-full" />
                      <div className="absolute top-1/2 -left-10 w-48 h-48 bg-cyan-500/[0.06] blur-3xl rounded-full" />
                      <div className="absolute top-1/2 -right-10 w-48 h-48 bg-emerald-500/[0.06] blur-3xl rounded-full" />
                    </div>

                    <div className="relative z-10 grid grid-cols-7 items-center gap-2">
                      {/* Team 1 (Home) */}
                      <div className="col-span-3 flex flex-col items-center min-w-0">
                        <div className="p-1 rounded-full bg-white/10 ring-2 ring-white/20 shadow-lg mb-1.5 backdrop-blur-xs">
                          <TeamLogo
                            logo={modalT1Logo}
                            name={modalT1Name}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                          />
                        </div>
                        <span className="font-display font-extrabold text-sm sm:text-base text-white tracking-tight truncate max-w-full">
                          {modalT1Name}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium mt-0.5">เจ้าบ้าน</span>
                      </div>

                      {/* Center Score */}
                      <div className="col-span-1 flex flex-col items-center justify-center">
                        {activeDetailMatch.status === 'LIVE' || activeDetailMatch.status === 'FT' ? (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 font-display font-black text-2xl sm:text-4xl text-amber-300 tracking-tight drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]">
                              <span>{activeDetailMatch.score1}{activeDetailMatch.penaltyScore1 !== undefined && activeDetailMatch.penaltyScore1 !== null ? `(${activeDetailMatch.penaltyScore1})` : ''}</span>
                              <span className="text-white/30 text-lg sm:text-2xl select-none">:</span>
                              <span>{activeDetailMatch.score2}{activeDetailMatch.penaltyScore2 !== undefined && activeDetailMatch.penaltyScore2 !== null ? `(${activeDetailMatch.penaltyScore2})` : ''}</span>
                            </div>
                            {activeDetailMatch.penaltyScore1 !== undefined && activeDetailMatch.penaltyScore1 !== null && activeDetailMatch.penaltyScore2 !== undefined && activeDetailMatch.penaltyScore2 !== null && (
                              <span className="text-[10px] text-amber-400 font-bold mt-1 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30">
                                จุดโทษ ({activeDetailMatch.penaltyScore1} - {activeDetailMatch.penaltyScore2})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-zinc-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                            VS
                          </span>
                        )}
                      </div>

                      {/* Team 2 (Away) */}
                      <div className="col-span-3 flex flex-col items-center min-w-0">
                        <div className="p-1 rounded-full bg-white/10 ring-2 ring-white/20 shadow-lg mb-1.5 backdrop-blur-xs">
                          <TeamLogo
                            logo={modalT2Logo}
                            name={modalT2Name}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                          />
                        </div>
                        <span className="font-display font-extrabold text-sm sm:text-base text-white tracking-tight truncate max-w-full">
                          {modalT2Name}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium mt-0.5">ทีมเยือน</span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="relative z-10 mt-3.5 flex justify-center">
                      {activeDetailMatch.status === 'LIVE' && (
                        <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1.5 shadow-xs backdrop-blur-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          กำลังแข่งขัน
                        </span>
                      )}
                      {activeDetailMatch.status === 'FT' && (
                        <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-white/10 text-zinc-200 border border-white/15 inline-flex items-center gap-1.5 backdrop-blur-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> จบเกมส์
                        </span>
                      )}
                      {activeDetailMatch.status === 'UPCOMING' && (
                        <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/20 inline-flex items-center gap-1.5 backdrop-blur-xs">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> เริ่ม {activeDetailMatch.timeStr ? `${activeDetailMatch.timeStr} น.` : 'ตามกำหนดการ'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Venue & Date Strip */}
                  <div className="bg-[#faf9f8] p-3 rounded-2xl border border-[#efeded] flex flex-wrap items-center justify-between gap-2 text-xs text-[#4b4737]">
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-[#1b1c1c] font-semibold">{activeDetailMatch.venue || 'ยังไม่ระบุสนาม'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-[11px] text-[#716e68]">
                      <Calendar className="w-3.5 h-3.5 text-[#716e68] shrink-0" />
                      <span>{activeDetailMatch.dateStr || 'ยังไม่ระบุวันที่'}</span>
                    </div>
                  </div>

                  {/* Team Goalscorers & Discipline Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Team 1 Details */}
                    <div className="p-3.5 bg-[#faf9f8] rounded-2xl border border-[#efeded] space-y-2">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-[#efeded]">
                        <TeamLogo
                          logo={modalT1Logo}
                          name={modalT1Name}
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                        />
                        <span className="font-bold text-xs text-[#1b1c1c] truncate">
                          {modalT1Name}
                        </span>
                      </div>

                      {/* Goals */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-[#716e68] flex items-center gap-1">
                          <SoccerBall className="w-3 h-3 text-emerald-600 shrink-0" /> ผู้ทำประตู:
                        </span>
                        {(() => {
                          const gStr = formatGoalscorersString(activeDetailMatch.goalDetails1, activeDetailMatch.goalPlayers1);
                          if (gStr) {
                            return (
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                                {gStr}
                              </span>
                            );
                          }
                          return <p className="text-[11px] text-[#888580]">-</p>;
                        })()}
                      </div>

                      {/* Cards */}
                      <div className="pt-1 border-t border-[#f0eeeb] flex flex-wrap items-center gap-2 text-[11px]">
                        {(activeDetailMatch.cardsT1?.yellow || 0) > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                            <span className="w-2 h-3 bg-amber-400 rounded-xs inline-block shadow-2xs" />
                            {activeDetailMatch.cardsT1?.yellow} ใบเหลือง {activeDetailMatch.cardsT1?.yellowPlayers ? `(เบอร์ ${activeDetailMatch.cardsT1.yellowPlayers})` : ''}
                          </span>
                        )}
                        {(activeDetailMatch.cardsT1?.red || 0) > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-900 border border-rose-200 font-semibold">
                            <span className="w-2 h-3 bg-rose-500 rounded-xs inline-block shadow-2xs" />
                            {activeDetailMatch.cardsT1?.red} ใบแดง {activeDetailMatch.cardsT1?.redPlayers ? `(เบอร์ ${activeDetailMatch.cardsT1.redPlayers})` : ''}
                          </span>
                        )}
                        {(activeDetailMatch.cardsT1?.yellow || 0) === 0 && (activeDetailMatch.cardsT1?.red || 0) === 0 && (
                          <span className="text-[10px] text-[#888580]">ไม่มีใบเตือน</span>
                        )}
                      </div>
                    </div>

                    {/* Team 2 Details */}
                    <div className="p-3.5 bg-[#faf9f8] rounded-2xl border border-[#efeded] space-y-2">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-[#efeded]">
                        <TeamLogo
                          logo={modalT2Logo}
                          name={modalT2Name}
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                        />
                        <span className="font-bold text-xs text-[#1b1c1c] truncate">
                          {modalT2Name}
                        </span>
                      </div>

                      {/* Goals */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-[#716e68] flex items-center gap-1">
                          <SoccerBall className="w-3 h-3 text-emerald-600 shrink-0" /> ผู้ทำประตู:
                        </span>
                        {(() => {
                          const gStr = formatGoalscorersString(activeDetailMatch.goalDetails2, activeDetailMatch.goalPlayers2);
                          if (gStr) {
                            return (
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                                {gStr}
                              </span>
                            );
                          }
                          return <p className="text-[11px] text-[#888580]">-</p>;
                        })()}
                      </div>

                      {/* Cards */}
                      <div className="pt-1 border-t border-[#f0eeeb] flex flex-wrap items-center gap-2 text-[11px]">
                        {(activeDetailMatch.cardsT2?.yellow || 0) > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                            <span className="w-2 h-3 bg-amber-400 rounded-xs inline-block shadow-2xs" />
                            {activeDetailMatch.cardsT2?.yellow} ใบเหลือง {activeDetailMatch.cardsT2?.yellowPlayers ? `(เบอร์ ${activeDetailMatch.cardsT2.yellowPlayers})` : ''}
                          </span>
                        )}
                        {(activeDetailMatch.cardsT2?.red || 0) > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-900 border border-rose-200 font-semibold">
                            <span className="w-2 h-3 bg-rose-500 rounded-xs inline-block shadow-2xs" />
                            {activeDetailMatch.cardsT2?.red} ใบแดง {activeDetailMatch.cardsT2?.redPlayers ? `(เบอร์ ${activeDetailMatch.cardsT2.redPlayers})` : ''}
                          </span>
                        )}
                        {(activeDetailMatch.cardsT2?.yellow || 0) === 0 && (activeDetailMatch.cardsT2?.red || 0) === 0 && (
                          <span className="text-[10px] text-[#888580]">ไม่มีใบเตือน</span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Read-Only Notice */}
            <div className="text-center py-2 text-[11px] text-[#716e68] bg-[#faf9f8] rounded-xl flex items-center justify-center gap-1.5 border border-[#efeded]">
              <Info className="w-3.5 h-3.5 text-cyan-600 shrink-0" /> โหมดผู้ชม: ข้อมูลแสดงผลแบบเรียลไทม์
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveDetailMatch(null)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#1b1c1c] text-white font-bold text-xs hover:bg-black transition-all shadow-md active:scale-98"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-[#efeded] py-6 px-4 text-center text-xs text-[#4b4737] mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {tournamentName} • ระบบจัดการแข่งขันฟุตบอล</p>
          <button
            type="button"
            onClick={onSwitchToAdmin}
            className="text-[#6f5d00] hover:underline font-semibold"
          >
            เข้าสู่ระบบผู้ดูแลการแข่งขัน (Admin Login)
          </button>
        </div>
      </footer>
    </div>
  );
};
