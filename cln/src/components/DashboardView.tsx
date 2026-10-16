import React, { useState, useMemo } from 'react';
import { ActiveView, Match, Team, GroupMap, CardDetail } from '../types';
import { TeamLogo } from './TeamLogo';
import {
  Trophy,
  Clock,
  Layers,
  CalendarDays,
  Award,
  GitFork,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Shield,
  Flame,
  AlertTriangle,
  Search,
  Sparkles,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

interface DashboardViewProps {
  tournamentName?: string;
  matches?: Match[];
  teams?: Team[];
  groups?: GroupMap;
  setActiveView: (view: ActiveView) => void;
  onOpenScoreModal?: (match: Match) => void;
  dbStatus?: string;
  isDbLoaded?: boolean;
}

interface TeamDiscipline {
  team: Team;
  groupName: string;
  matchesPlayed: number;
  yellowCards: number;
  redCards: number;
  totalCards: number;
  fairPlayScore: number; // yellow * 1 + red * 3 (lower is better)
  yellowPlayerNumbers: string[];
  redPlayerNumbers: string[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tournamentName = 'SCI CUP 2026',
  matches = [],
  teams = [],
  groups = {},
  setActiveView,
  dbStatus = 'เชื่อมต่อฐานข้อมูลเรียบร้อยแล้ว',
  isDbLoaded = true,
}) => {
  // Defensive fallbacks
  const safeMatches = Array.isArray(matches) ? matches : [];
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeGroups = groups && typeof groups === 'object' ? groups : {};

  // Discipline filters & state
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [disciplineSort, setDisciplineSort] = useState<'cards_desc' | 'fairplay_asc' | 'name_asc'>('cards_desc');
  const [disciplineSearch, setDisciplineSearch] = useState<string>('');

  // Match categorizations
  const liveMatch = safeMatches.find((m) => m && m.status === 'LIVE');
  const completedMatches = safeMatches.filter((m) => m && m.status === 'FT');
  const upcomingMatches = safeMatches.filter((m) => m && m.status === 'UPCOMING');

  // Spotlight match: Priority to LIVE, then next UPCOMING, then last FT
  const spotlightMatch = liveMatch || upcomingMatches[0] || completedMatches[completedMatches.length - 1];

  const totalGoals = safeMatches.reduce((sum, m) => {
    if (m && (m.status === 'FT' || m.status === 'LIVE')) {
      return sum + (Number(m.score1) || 0) + (Number(m.score2) || 0);
    }
    return sum;
  }, 0);

  const playedMatchesCount = completedMatches.length + (liveMatch ? 1 : 0);
  const avgGoals = playedMatchesCount > 0 ? (totalGoals / playedMatchesCount).toFixed(1) : '0.0';

  // Group formatting helper (prevents "กลุ่ม กลุ่ม A")
  const formatGroupName = (grp?: any) => {
    if (!grp || typeof grp !== 'string') return 'รอบแบ่งกลุ่ม';
    const clean = grp.trim();
    if (clean.startsWith('กลุ่ม') || clean.startsWith('สาย')) return clean;
    return `กลุ่ม ${clean}`;
  };

  // Group short tag (e.g. "A", "B", "C", "D")
  const getGroupTag = (grp?: any) => {
    if (!grp || typeof grp !== 'string') return '-';
    return grp.replace(/^(กลุ่ม|สาย)\s*/, '').trim();
  };

  // Active groups count
  const activeGroups = Object.keys(safeGroups).filter(
    (g) => Array.isArray(safeGroups[g]) && safeGroups[g].length > 0
  );
  const activeGroupsCount = activeGroups.length > 0 ? activeGroups.length : 4;

  // Aggregate unique teams across groups and teams list
  const allTournamentTeams = useMemo(() => {
    const map = new Map<string, { team: Team; groupName: string }>();

    // 1. Populate from groups
    Object.entries(safeGroups).forEach(([grpName, grpTeams]) => {
      if (Array.isArray(grpTeams)) {
        grpTeams.forEach((t) => {
          if (t && (t.id != null || t.name)) {
            const key = String(t.id != null ? t.id : t.name);
            map.set(key, { team: t, groupName: grpName });
          }
        });
      }
    });

    // 2. Add unassigned teams from teams array
    safeTeams.forEach((t) => {
      if (t && (t.id != null || t.name)) {
        const key = String(t.id != null ? t.id : t.name);
        if (!map.has(key)) {
          map.set(key, { team: t, groupName: 'ไม่ระบุสาย' });
        }
      }
    });

    return Array.from(map.values());
  }, [safeGroups, safeTeams]);

  // Aggregate Cards & Discipline Statistics per team
  const teamDisciplines = useMemo<TeamDiscipline[]>(() => {
    return allTournamentTeams
      .map(({ team, groupName }) => {
        if (!team) return null;
        const teamIdStr = team.id != null ? String(team.id) : '';
        const teamNameStr = team.name ? String(team.name).trim() : '';

        let yellowCards = 0;
        let redCards = 0;
        let matchesPlayed = 0;
        const yellowNums = new Set<string>();
        const redNums = new Set<string>();

        safeMatches.forEach((m) => {
          if (!m) return;
          const t1Id = m.team1?.id != null ? String(m.team1.id) : '';
          const t2Id = m.team2?.id != null ? String(m.team2.id) : '';
          const t1Name = m.team1?.name ? String(m.team1.name).trim() : '';
          const t2Name = m.team2?.name ? String(m.team2.name).trim() : '';

          const isT1 = (teamIdStr && t1Id === teamIdStr) || (teamNameStr && t1Name === teamNameStr);
          const isT2 = (teamIdStr && t2Id === teamIdStr) || (teamNameStr && t2Name === teamNameStr);

          if (!isT1 && !isT2) return;

          if (m.status === 'FT' || m.status === 'LIVE') {
            matchesPlayed += 1;
          }

          const cards = isT1 ? m.cardsT1 : m.cardsT2;
          if (!cards) return;

          const yCount = Number(cards.yellow) || 0;
          const rCount = Number(cards.red) || 0;
          yellowCards += yCount;
          redCards += rCount;

          // Process details or string player numbers safely
          if (Array.isArray(cards.details) && cards.details.length > 0) {
            cards.details.forEach((d: CardDetail) => {
              if (!d) return;
              const num = String(d.playerNumber || '').trim();
              if (!num) return;
              if (d.type === 'yellow') yellowNums.add(num);
              if (d.type === 'red') redNums.add(num);
            });
          } else {
            if (typeof cards.yellowPlayers === 'string') {
              cards.yellowPlayers.split(',').forEach((n) => {
                const trimmed = n.trim();
                if (trimmed) yellowNums.add(trimmed);
              });
            }
            if (typeof cards.redPlayers === 'string') {
              cards.redPlayers.split(',').forEach((n) => {
                const trimmed = n.trim();
                if (trimmed) redNums.add(trimmed);
              });
            }
          }
        });

        const totalCards = yellowCards + redCards;
        const fairPlayScore = yellowCards * 1 + redCards * 3;

        return {
          team,
          groupName: groupName || 'ไม่ระบุสาย',
          matchesPlayed,
          yellowCards,
          redCards,
          totalCards,
          fairPlayScore,
          yellowPlayerNumbers: Array.from(yellowNums).sort(
            (a, b) => Number(a) - Number(b) || String(a).localeCompare(String(b))
          ),
          redPlayerNumbers: Array.from(redNums).sort(
            (a, b) => Number(a) - Number(b) || String(a).localeCompare(String(b))
          ),
        };
      })
      .filter(Boolean) as TeamDiscipline[];
  }, [allTournamentTeams, safeMatches]);

  // Summary card metrics
  const totalYellowCards = useMemo(
    () => teamDisciplines.reduce((sum, t) => sum + (t.yellowCards || 0), 0),
    [teamDisciplines]
  );
  const totalRedCards = useMemo(
    () => teamDisciplines.reduce((sum, t) => sum + (t.redCards || 0), 0),
    [teamDisciplines]
  );

  // Best Fair Play team (lowest penalty points; if tied, most matches played)
  const bestFairPlayTeam = useMemo(() => {
    if (!teamDisciplines || teamDisciplines.length === 0) return null;
    const sorted = [...teamDisciplines].sort((a, b) => {
      if (a.fairPlayScore !== b.fairPlayScore) return a.fairPlayScore - b.fairPlayScore;
      return b.matchesPlayed - a.matchesPlayed;
    });
    return sorted[0] || null;
  }, [teamDisciplines]);

  // Most Booked Team (highest card count)
  const mostBookedTeam = useMemo(() => {
    if (!teamDisciplines || teamDisciplines.length === 0) return null;
    const sorted = [...teamDisciplines].sort(
      (a, b) => b.totalCards - a.totalCards || b.redCards - a.redCards
    );
    return sorted[0] && sorted[0].totalCards > 0 ? sorted[0] : null;
  }, [teamDisciplines]);

  // Filtered & Sorted disciplines list
  const filteredDisciplines = useMemo(() => {
    return teamDisciplines
      .filter((item) => {
        if (!item || !item.team) return false;

        // Group filter
        if (selectedGroup !== 'ALL') {
          const itemTag = getGroupTag(item.groupName);
          const filterTag = getGroupTag(selectedGroup);
          if (itemTag !== filterTag && item.groupName !== selectedGroup) {
            return false;
          }
        }

        // Search query filter
        if (disciplineSearch.trim()) {
          const q = disciplineSearch.trim().toLowerCase();
          const name = String(item.team.name || '').toLowerCase();
          const nameMatch = name.includes(q);
          const yMatch = item.yellowPlayerNumbers.some((num) => String(num).toLowerCase().includes(q));
          const rMatch = item.redPlayerNumbers.some((num) => String(num).toLowerCase().includes(q));
          if (!nameMatch && !yMatch && !rMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const nameA = String(a.team?.name || '');
        const nameB = String(b.team?.name || '');

        if (disciplineSort === 'cards_desc') {
          if (b.totalCards !== a.totalCards) return b.totalCards - a.totalCards;
          if (b.redCards !== a.redCards) return b.redCards - a.redCards;
          return nameA.localeCompare(nameB, 'th');
        }
        if (disciplineSort === 'fairplay_asc') {
          if (a.fairPlayScore !== b.fairPlayScore) return a.fairPlayScore - b.fairPlayScore;
          if (a.redCards !== b.redCards) return a.redCards - b.redCards;
          return nameA.localeCompare(nameB, 'th');
        }
        return nameA.localeCompare(nameB, 'th');
      });
  }, [teamDisciplines, selectedGroup, disciplineSort, disciplineSearch]);

  return (
    <div className="space-y-7 pb-12">
      {/* 1. Hero & Database Connectivity Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 lg:p-8 shadow-xs border border-[#efeded]">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 w-88 h-88 rounded-full bg-[#ffe680]/25 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-80 h-80 rounded-full bg-[#95fcbc]/20 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* Status Pills: Tournament */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffe680] text-[#786607] text-xs font-bold shadow-2xs">
                <Trophy className="w-3.5 h-3.5 text-[#6f5d00]" />
                <span>ระบบบริหารจัดการแข่งขันฟุตบอลมาตรฐานระดับชาติ</span>
              </div>
            </div>

            <h1 className="font-display text-2xl lg:text-3xl font-bold text-[#1b1c1c] tracking-tight">
              {tournamentName}
            </h1>
            <p className="text-sm text-[#4b4737] max-w-2xl leading-relaxed">
              ยินดีต้อนรับสู่ศูนย์กลางการจัดทัวร์นาเมนต์
            </p>
          </div>

          {/* Quick Nav Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveView('tournament-setup-and-groups')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f5f3f3] hover:bg-[#efeded] text-[#1b1c1c] font-display font-bold text-xs shadow-2xs border border-[#efeded] transition-all"
            >
              <Layers className="w-4 h-4 text-[#6f5d00]" />
              <span>จัดการกลุ่มและทีม</span>
            </button>
            <button
              onClick={() => setActiveView('matches-and-fixtures')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ffe680] hover:bg-[#fbe27c] text-[#786607] font-display font-bold text-xs shadow-xs transition-all"
            >
              <CalendarDays className="w-4 h-4" />
              <span>ตารางการแข่งขัน</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Database Realtime Metrics Strip */}
        <div className="mt-6 pt-5 border-t border-[#efeded] grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
          <div className="p-3.5 rounded-2xl bg-[#fbf9f9] border border-[#f0eeee] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffe680]/50 flex items-center justify-center text-[#786607] shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-[#66645d] truncate">สโมสรในฐานข้อมูล</div>
              <div className="text-lg font-black text-[#1b1c1c] leading-tight">
                {safeTeams.length} <span className="text-xs font-medium text-[#7d7b73]">/ 16 ทีม</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#fbf9f9] border border-[#f0eeee] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#95fcbc]/40 flex items-center justify-center text-[#006d40] shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-[#66645d] truncate">กลุ่มการแข่งขันใน DB</div>
              <div className="text-lg font-black text-[#1b1c1c] leading-tight">
                {activeGroupsCount} <span className="text-xs font-medium text-[#7d7b73]">สาย (A-D)</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#fbf9f9] border border-[#f0eeee] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#dbeafe] flex items-center justify-center text-[#1d4ed8] shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-[#66645d] truncate">แมตช์บันทึกในระบบ</div>
              <div className="text-lg font-black text-[#1b1c1c] leading-tight">
                {safeMatches.length} <span className="text-xs font-medium text-[#7d7b73]">แมตช์</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#fbf9f9] border border-[#f0eeee] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fef3c7] flex items-center justify-center text-[#b45309] shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-[#66645d] truncate">ประตูรวมทัวร์นาเมนต์</div>
              <div className="text-lg font-black text-[#1b1c1c] leading-tight">
                {totalGoals} <span className="text-xs font-medium text-[#7d7b73]">({avgGoals}/นัด)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4 Feature Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveView('tournament-setup-and-groups')}
          className="group cursor-pointer rounded-2xl bg-white p-5 shadow-2xs border border-[#efeded] hover:shadow-md hover:border-[#ffe680] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-[#ffe680]/60 flex items-center justify-center text-[#786607] group-hover:scale-105 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f5f3f3] text-[#4b4737]">
                {safeTeams.length} ทีมในระบบ
              </span>
            </div>
            <span className="text-[10px] text-[#786607] uppercase font-bold tracking-wider">ขั้นตอนที่ 1</span>
            <h3 className="font-display text-base font-bold text-[#1b1c1c] mt-0.5">
              สร้างทีม &amp; จัดกลุ่ม
            </h3>
            <p className="text-xs text-[#4b4737] mt-1 line-clamp-2">
              แบ่ง 4 สาย A, B, C, D พร้อมสุ่มจับสลากอัตโนมัติ 16 สโมสร
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#f5f3f3] flex items-center justify-between text-xs text-[#786607] font-semibold group-hover:translate-x-1 transition-transform">
            <span>เข้าสู่การจัดการ</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div
          onClick={() => setActiveView('matches-and-fixtures')}
          className="group cursor-pointer rounded-2xl bg-white p-5 shadow-2xs border border-[#efeded] hover:shadow-md hover:border-[#95fcbc] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-[#95fcbc]/60 flex items-center justify-center text-[#007746] group-hover:scale-105 transition-transform">
                <CalendarDays className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#95fcbc]/30 text-[#007746]">
                {playedMatchesCount}/{safeMatches.length} นัด
              </span>
            </div>
            <span className="text-[10px] text-[#007746] uppercase font-bold tracking-wider">ขั้นตอนที่ 2</span>
            <h3 className="font-display text-base font-bold text-[#1b1c1c] mt-0.5">
              ตาราง &amp; สกอร์สด
            </h3>
            <p className="text-xs text-[#4b4737] mt-1 line-clamp-2">
              จัดโปรแกรมแข่งขัน บันทึกผลสกอร์สด ใบเหลืองใบแดง และสนามแข่งขัน
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#f5f3f3] flex items-center justify-between text-xs text-[#007746] font-semibold group-hover:translate-x-1 transition-transform">
            <span>บันทึกผล &amp; สกอร์</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div
          onClick={() => setActiveView('standings-and-leaderboard')}
          className="group cursor-pointer rounded-2xl bg-white p-5 shadow-2xs border border-[#efeded] hover:shadow-md hover:border-[#ffe680] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-[#ffe680]/40 flex items-center justify-center text-[#786607] group-hover:scale-105 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ffe680]/30 text-[#786607]">
                คำนวณสด
              </span>
            </div>
            <span className="text-[10px] text-[#786607] uppercase font-bold tracking-wider">ขั้นตอนที่ 3</span>
            <h3 className="font-display text-base font-bold text-[#1b1c1c] mt-0.5">
              ตารางคะแนนสด
            </h3>
            <p className="text-xs text-[#4b4737] mt-1 line-clamp-2">
              ตารางคะแนนเรียลไทม์ Head-to-Head ประตูได้เสีย และดาวซัลโว
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#f5f3f3] flex items-center justify-between text-xs text-[#786607] font-semibold group-hover:translate-x-1 transition-transform">
            <span>ดูตารางคะแนน</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div
          onClick={() => setActiveView('bracket')}
          className="group cursor-pointer rounded-2xl bg-white p-5 shadow-2xs border border-[#efeded] hover:shadow-md hover:border-[#1b1c1c] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-[#f5f3f3] flex items-center justify-center text-[#1b1c1c] group-hover:scale-105 transition-transform">
                <GitFork className="w-6 h-6 text-[#5f5e5e]" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f5f3f3] text-[#4b4737]">
                Knockout
              </span>
            </div>
            <span className="text-[10px] text-[#4b4737] uppercase font-bold tracking-wider">ขั้นตอนที่ 4</span>
            <h3 className="font-display text-base font-bold text-[#1b1c1c] mt-0.5">
              สายน็อคเอาท์
            </h3>
            <p className="text-xs text-[#4b4737] mt-1 line-clamp-2">
              สายแข่งขันรอบ 8 ทีม, รองชนะเลิศ และนัดชิงชนะเลิศ
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#f5f3f3] flex items-center justify-between text-xs text-[#1b1c1c] font-semibold group-hover:translate-x-1 transition-transform">
            <span>ดูสายแข่งขัน</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. Spotlight Arena Match (Live or Featured Upcoming) */}
      {spotlightMatch && (
        <div className="rounded-3xl bg-white p-6 shadow-xs border border-[#efeded] relative overflow-hidden">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#efeded]">
            <div className="flex flex-wrap items-center gap-2.5">
              {spotlightMatch.status === 'LIVE' ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#95fcbc] text-[#007746] text-xs font-bold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#006d40] animate-ping" />
                  กำลังแข่งขันสด (Live Broadcast)
                </span>
              ) : spotlightMatch.status === 'FT' ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f3f3] text-[#1b1c1c] text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#007746]" />
                  จบการแข่งขันแล้ว (Full Time)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffe680] text-[#786607] text-xs font-bold">
                  <CalendarDays className="w-3.5 h-3.5" />
                  โปรแกรมการแข่งขันคู่ถัดไป
                </span>
              )}

              <span className="text-xs font-bold text-[#4b4737]">
                {formatGroupName(spotlightMatch.group)}
                {spotlightMatch.venue ? ` • ${spotlightMatch.venue}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold">
              {spotlightMatch.status === 'LIVE' ? (
                <div className="flex items-center gap-1.5 text-[#006d40]">
                  <Clock className="w-4 h-4 animate-spin text-[#006d40]" />
                  <span>นาที {spotlightMatch.currentMinute || "68'"}</span>
                </div>
              ) : (
                <span className="text-[#66645d]">
                  {spotlightMatch.dateStr || 'เร็วๆ นี้'} {spotlightMatch.timeStr ? `• ${spotlightMatch.timeStr} น.` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Teams and Score Arena */}
          <div className="py-6 flex flex-col md:flex-row items-center justify-around gap-6">
            {/* Team 1 */}
            <div className="flex items-center gap-4 text-right flex-1 justify-end">
              <div>
                <h2 className="font-display text-lg md:text-xl font-bold text-[#1b1c1c] tracking-tight">
                  {spotlightMatch.team1?.name || 'ทีมเจ้าบ้าน'}
                </h2>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-[#f5f3f3] text-[10px] font-semibold text-[#66645d]">
                  เจ้าบ้าน
                </span>
              </div>
              <TeamLogo
                logo={spotlightMatch.team1?.logo}
                name={spotlightMatch.team1?.name}
                className="w-14 h-14 ring-2 ring-[#ffe680]"
              />
            </div>

            {/* Score or VS Badge */}
            <div className="flex flex-col items-center px-4 shrink-0">
              {spotlightMatch.status === 'LIVE' || spotlightMatch.status === 'FT' ? (
                <>
                  <div className="px-6 py-2 rounded-full bg-[#ffe680] text-[#786607] font-display text-3xl font-black shadow-xs">
                    {spotlightMatch.score1} - {spotlightMatch.score2}
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-[#6f5d00] uppercase mt-1">
                    {spotlightMatch.status === 'LIVE' ? 'LIVE SCORE' : 'FINAL RESULT'}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-[#f5f3f3] border border-[#efeded] flex items-center justify-center font-display font-black text-base text-[#4b4737] shadow-2xs">
                    VS
                  </div>
                  <span className="text-[10px] font-semibold text-[#8e8d8d] mt-1">รอเริ่มการแข่งขัน</span>
                </>
              )}
            </div>

            {/* Team 2 */}
            <div className="flex items-center gap-4 text-left flex-1 justify-start">
              <TeamLogo
                logo={spotlightMatch.team2?.logo}
                name={spotlightMatch.team2?.name}
                className="w-14 h-14 ring-2 ring-[#ffe680]"
              />
              <div>
                <h2 className="font-display text-lg md:text-xl font-bold text-[#1b1c1c] tracking-tight">
                  {spotlightMatch.team2?.name || 'ทีมเยือน'}
                </h2>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-[#f5f3f3] text-[10px] font-semibold text-[#66645d]">
                  ทีมเยือน
                </span>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-[#efeded] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#4b4737]">
              <MapPin className="w-3.5 h-3.5 text-[#6f5d00]" />
              <span>
                {spotlightMatch.venue ? `สนาม: ${spotlightMatch.venue}` : 'ยังไม่ระบุสนามแข่งขัน'}
              </span>
            </div>
            <button
              onClick={() => setActiveView('matches-and-fixtures')}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#ffe680] text-[#786607] font-display font-bold text-xs hover:bg-[#fbe27c] transition-all shadow-2xs"
            >
              <span>ปรับปรุงผลสกอร์ในหน้าโปรแกรม</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. NEW: Team Cards & Fair Play Discipline Tracker Section */}
      <div className="space-y-5">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#ffe680] flex items-center justify-center text-[#786607]">
                <Shield className="w-4 h-4" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#1b1c1c]">
                สถิติใบเตือนและแฟร์เพลย์รายสโมสร
              </h2>
            </div>
            <p className="text-xs text-[#66645d] mt-1">
              ระบบตรวจสอบจำนวนใบเหลือง ใบแดง และคะแนนความประพฤติ (Fair Play Points)
              ที่บันทึกจริงในฐานข้อมูล
            </p>
          </div>

          {/* Quick stats chips */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-full bg-[#fef9c3] text-[#a16207] border border-[#fef08a] flex items-center gap-1.5">
              <span className="w-3 h-4 bg-[#eab308] rounded-xs inline-block shadow-2xs" />
              <span>ใบเหลืองรวม: {totalYellowCards}</span>
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca] flex items-center gap-1.5">
              <span className="w-3 h-4 bg-[#ef4444] rounded-xs inline-block shadow-2xs" />
              <span>ใบแดงรวม: {totalRedCards}</span>
            </span>
          </div>
        </div>

        {/* 4 Discipline KPI Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Yellows */}
          <div className="rounded-2xl bg-white p-5 border border-[#efeded] shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#fef9c3] border border-[#fef08a] flex items-center justify-center text-[#ca8a04] shrink-0">
              <div className="w-5 h-7 bg-[#eab308] rounded-xs shadow-xs" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#66645d]">ใบเหลืองสะสมทั้งหมด</div>
              <div className="text-2xl font-black text-[#1b1c1c] mt-0.5">
                {totalYellowCards} <span className="text-xs font-normal text-[#8e8d8d]">ใบ</span>
              </div>
              <div className="text-[11px] text-[#ca8a04] font-medium mt-0.5">
                {playedMatchesCount > 0 ? (totalYellowCards / playedMatchesCount).toFixed(1) : 0} ใบ/นัด
              </div>
            </div>
          </div>

          {/* Card 2: Total Reds */}
          <div className="rounded-2xl bg-white p-5 border border-[#efeded] shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#fee2e2] border border-[#fecaca] flex items-center justify-center text-[#dc2626] shrink-0">
              <div className="w-5 h-7 bg-[#ef4444] rounded-xs shadow-xs" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#66645d]">ใบแดงสะสมทั้งหมด</div>
              <div className="text-2xl font-black text-[#1b1c1c] mt-0.5">
                {totalRedCards} <span className="text-xs font-normal text-[#8e8d8d]">ใบ</span>
              </div>
              <div className="text-[11px] text-[#dc2626] font-medium mt-0.5">
                {totalRedCards > 0 ? 'มีโทษพักแข้ง' : 'ยังไม่มีผู้เล่นติดแบน'}
              </div>
            </div>
          </div>

          {/* Card 3: Best Fair Play Team */}
          <div className="rounded-2xl bg-white p-5 border border-[#efeded] shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#dcfce7] border border-[#bbf7d0] flex items-center justify-center text-[#15803d] shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[#66645d]">ทีมแฟร์เพลย์ยอดเยี่ยม</div>
              {bestFairPlayTeam && bestFairPlayTeam.team ? (
                <>
                  <div className="text-sm font-bold text-[#1b1c1c] truncate mt-0.5 flex items-center gap-1.5">
                    <TeamLogo
                      logo={bestFairPlayTeam.team.logo}
                      name={bestFairPlayTeam.team.name}
                      className="w-4 h-4"
                    />
                    <span className="truncate">{bestFairPlayTeam.team.name || 'ไม่ระบุชื่อทีม'}</span>
                  </div>
                  <div className="text-[11px] text-[#15803d] font-semibold mt-0.5">
                    เสีย {bestFairPlayTeam.totalCards} ใบ ({bestFairPlayTeam.fairPlayScore} แต้ม)
                  </div>
                </>
              ) : (
                <div className="text-xs text-[#8e8d8d] mt-1">-</div>
              )}
            </div>
          </div>

          {/* Card 4: Most Booked Team */}
          <div className="rounded-2xl bg-white p-5 border border-[#efeded] shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#fff7ed] border border-[#ffedd5] flex items-center justify-center text-[#c2410c] shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[#66645d]">ทีมใบเตือนสะสมสูงสุด</div>
              {mostBookedTeam && mostBookedTeam.team ? (
                <>
                  <div className="text-sm font-bold text-[#1b1c1c] truncate mt-0.5 flex items-center gap-1.5">
                    <TeamLogo
                      logo={mostBookedTeam.team.logo}
                      name={mostBookedTeam.team.name}
                      className="w-4 h-4"
                    />
                    <span className="truncate">{mostBookedTeam.team.name || 'ไม่ระบุชื่อทีม'}</span>
                  </div>
                  <div className="text-[11px] text-[#c2410c] font-semibold mt-0.5">
                    ใบเหลือง {mostBookedTeam.yellowCards} ใบ / ใบแดง {mostBookedTeam.redCards} ใบ (รวม {mostBookedTeam.totalCards} ใบ)
                  </div>
                </>
              ) : (
                <div className="text-xs text-[#15803d] font-semibold mt-1">ทุกทีม 0 ใบเตือน</div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar & Controls */}
        <div className="bg-white rounded-2xl p-4 border border-[#efeded] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Group Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedGroup('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${selectedGroup === 'ALL'
                  ? 'bg-[#1b1c1c] text-white shadow-xs'
                  : 'bg-[#f5f3f3] text-[#4b4737] hover:bg-[#efeded]'
                }`}
            >
              ทั้งหมด ({teamDisciplines.length})
            </button>
            {['A', 'B', 'C', 'D'].map((gLetter) => (
              <button
                key={gLetter}
                onClick={() => setSelectedGroup(`กลุ่ม ${gLetter}`)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${getGroupTag(selectedGroup) === gLetter
                    ? 'bg-[#ffe680] text-[#786607] shadow-xs'
                    : 'bg-[#f5f3f3] text-[#4b4737] hover:bg-[#efeded]'
                  }`}
              >
                กลุ่ม {gLetter}
              </button>
            ))}
          </div>

          {/* Sort & Search Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8d8d]" />
              <input
                type="text"
                value={disciplineSearch}
                onChange={(e) => setDisciplineSearch(e.target.value)}
                placeholder="ค้นหาชื่อทีมหรือเบอร์เสื้อ..."
                className="w-full pl-8 pr-3 py-1.5 rounded-full bg-[#f5f3f3] text-xs text-[#1b1c1c] placeholder:text-[#8e8d8d] focus:outline-none focus:ring-2 focus:ring-[#ffe680] transition-all"
              />
              {disciplineSearch && (
                <button
                  onClick={() => setDisciplineSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8e8d8d] hover:text-[#1b1c1c]"
                >
                  ×
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="inline-flex items-center rounded-full bg-[#f5f3f3] p-1 border border-[#efeded] text-xs">
              <button
                onClick={() => setDisciplineSort('cards_desc')}
                className={`px-2.5 py-1 rounded-full font-semibold transition-all ${disciplineSort === 'cards_desc'
                    ? 'bg-white text-[#1b1c1c] shadow-2xs font-bold'
                    : 'text-[#66645d] hover:text-[#1b1c1c]'
                  }`}
                title="เรียงตามจำนวนใบเตือนมากที่สุด"
              >
                ใบเตือนสูงสุด
              </button>
              <button
                onClick={() => setDisciplineSort('fairplay_asc')}
                className={`px-2.5 py-1 rounded-full font-semibold transition-all ${disciplineSort === 'fairplay_asc'
                    ? 'bg-white text-[#15803d] shadow-2xs font-bold'
                    : 'text-[#66645d] hover:text-[#1b1c1c]'
                  }`}
                title="เรียงตามคะแนนแฟร์เพลย์ดีเด่น (เสียคะแนนน้อยสุด)"
              >
                แฟร์เพลย์ดีเด่น
              </button>
              <button
                onClick={() => setDisciplineSort('name_asc')}
                className={`px-2.5 py-1 rounded-full font-semibold transition-all ${disciplineSort === 'name_asc'
                    ? 'bg-white text-[#1b1c1c] shadow-2xs font-bold'
                    : 'text-[#66645d] hover:text-[#1b1c1c]'
                  }`}
                title="เรียงตามชื่อทีม"
              >
                ชื่อทีม
              </button>
            </div>
          </div>
        </div>

        {/* Team Cards & Discipline Table */}
        <div className="bg-white rounded-2xl border border-[#efeded] shadow-2xs overflow-hidden">
          {filteredDisciplines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fcfbfb] border-b border-[#efeded] text-[11px] font-bold text-[#66645d] uppercase tracking-wider">
                    <th className="py-3 px-4 text-center w-12">อันดับ</th>
                    <th className="py-3 px-4 min-w-[200px]">สโมสร / สาย</th>
                    <th className="py-3 px-4 text-center">นัดที่แข่ง</th>
                    <th className="py-3 px-4 text-center">ใบเหลือง</th>
                    <th className="py-3 px-4 text-center">ใบแดง</th>
                    <th className="py-3 px-4 text-center">รวมใบเตือน</th>
                    <th className="py-3 px-4 text-center">แต้มแฟร์เพลย์</th>
                    <th className="py-3 px-4 min-w-[180px]">เบอร์เสื้อผู้ได้รับบัตร</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#efeded] text-sm text-[#1b1c1c]">
                  {filteredDisciplines.map((item, index) => {
                    const hasYellow = item.yellowCards > 0;
                    const hasRed = item.redCards > 0;
                    const isClean = item.totalCards === 0;

                    return (
                      <tr
                        key={item.team.id != null ? String(item.team.id) : `team-${index}`}
                        className="hover:bg-[#fcfbf9] transition-colors"
                      >
                        {/* Rank Badge */}
                        <td className="py-3.5 px-4 text-center font-bold text-xs">
                          {disciplineSort === 'fairplay_asc' && index < 3 ? (
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${index === 0
                                  ? 'bg-[#ffe680] text-[#786607]'
                                  : index === 1
                                    ? 'bg-[#e5e7eb] text-[#374151]'
                                    : 'bg-[#fde047]/40 text-[#854d0e]'
                                }`}
                            >
                              {index + 1}
                            </span>
                          ) : disciplineSort === 'cards_desc' && item.totalCards > 0 && index === 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#fee2e2] text-[#dc2626] font-bold">
                              {index + 1}
                            </span>
                          ) : (
                            <span className="text-[#8e8d8d]">{index + 1}</span>
                          )}
                        </td>

                        {/* Team Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <TeamLogo
                              logo={item.team.logo}
                              name={item.team.name}
                              className="w-9 h-9 ring-1 ring-black/5"
                            />
                            <div>
                              <div className="font-bold text-[#1b1c1c] text-sm">
                                {item.team.name || 'ไม่ระบุชื่อทีม'}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f3f3] text-[#66645d]">
                                  {formatGroupName(item.groupName)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Matches Played */}
                        <td className="py-3.5 px-4 text-center text-xs font-semibold text-[#66645d]">
                          {item.matchesPlayed} นัด
                        </td>

                        {/* Yellow Cards */}
                        <td className="py-3.5 px-4 text-center text-xs font-semibold text-[#1b1c1c]">
                          {item.yellowCards}
                        </td>

                        {/* Red Cards */}
                        <td className="py-3.5 px-4 text-center text-xs font-semibold text-[#1b1c1c]">
                          {item.redCards}
                        </td>

                        {/* Total Cards */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`font-display font-bold text-sm ${item.totalCards > 2
                                ? 'text-[#b91c1c]'
                                : item.totalCards > 0
                                  ? 'text-[#ca8a04]'
                                  : 'text-[#66645d]'
                              }`}
                          >
                            {item.totalCards}
                          </span>
                        </td>

                        {/* Fair Play Score (Penalty Points) */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${isClean
                                ? 'bg-[#dcfce7] text-[#15803d]'
                                : item.fairPlayScore > 3
                                  ? 'bg-[#fee2e2] text-[#b91c1c]'
                                  : 'bg-[#fef9c3] text-[#a16207]'
                              }`}
                            title={`ใบเหลือง (1 แต้ม) + ใบแดง (3 แต้ม) = ${item.fairPlayScore}`}
                          >
                            {isClean ? '0 แต้ม' : `-${item.fairPlayScore} แต้ม`}
                          </span>
                        </td>

                        {/* Booked Player Jersey Numbers */}
                        <td className="py-3.5 px-4 text-xs font-semibold text-[#1b1c1c]">
                          {(() => {
                            const allBooked = Array.from(
                              new Set([...item.yellowPlayerNumbers, ...item.redPlayerNumbers])
                            );
                            if (allBooked.length === 0) {
                              return <span className="text-xs text-[#a3a19b] italic">ไม่มีผู้เล่นได้รับบัตร</span>;
                            }
                            return <span>{allBooked.join(', ')}</span>;
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#f5f3f3] flex items-center justify-center text-[#8e8d8d] mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-[#1b1c1c]">ไม่พบข้อมูลสโมสรตามเงื่อนไขที่ค้นหา</h3>
              <p className="text-xs text-[#66645d] mt-1">
                ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองกลุ่มอื่น
              </p>
            </div>
          )}

          {/* Table Footer info */}
          <div className="p-4 bg-[#fcfbfb] border-t border-[#efeded] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#66645d]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#1b1c1c]">เกณฑ์คะแนนวินัย (Fair Play):</span>
              <span>ใบเหลือง (-1 แต้ม)</span>
              <span>•</span>
              <span>ใบแดง (-3 แต้ม)</span>
              <span>•</span>
              <span>คะแนนเสียน้อยที่สุดคือทีมมีวินัยดีที่สุด</span>
            </div>
            <button
              onClick={() => setActiveView('matches-and-fixtures')}
              className="font-bold text-[#786607] hover:underline flex items-center gap-1"
            >
              <span>บันทึกใบเหลือง-ใบแดงในตารางแข่งขัน</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
