import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCw,
  Trophy,
  Medal,
  CalendarDays,
  ExternalLink,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Match, Team, MatchStatus } from '../../../types';
import {
  DashboardStatsCards,
  DashboardStats,
  DashboardMatchCenter,
  QuickScoreEditModal,
  ScorerItem,
  TopScorersWidget,
  MiniStandingsWidget,
} from './components';
import { teamService } from '../../../services/teamService';
import { matchService } from '../../../services/matchService';
import { groupService } from '../../../services/groupService';
import { standingsService, GroupStandingItem } from '../../../services/standingsService';

interface DashboardPageProps {
  currentTournamentId?: string;
  tournamentName?: string;
  onNavigate?: (view: string) => void;
}

const mapBackendStatusToFrontend = (status?: string): MatchStatus => {
  const s = (status || '').toUpperCase();
  if (s === 'LIVE') return 'LIVE';
  if (s === 'FINISHED' || s === 'COMPLETED' || s === 'FT') return 'FT';
  if (s === 'POSTPONED') return 'POSTPONED';
  return 'UPCOMING';
};

const mapFrontendStatusToBackend = (
  status?: string
): 'SCHEDULED' | 'LIVE' | 'COMPLETED' => {
  const s = (status || '').toUpperCase();
  if (s === 'LIVE') return 'LIVE';
  if (s === 'FINISHED' || s === 'COMPLETED' || s === 'FT') return 'COMPLETED';
  return 'SCHEDULED';
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentTournamentId,
  tournamentName = 'ทัวร์นาเมนต์ปัจจุบัน',
  onNavigate,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [matches, setMatches] = useState<Match[]>([]);
  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [standingsGroups, setStandingsGroups] = useState<Record<string, GroupStandingItem[]>>({});

  const [stats, setStats] = useState<DashboardStats>({
    totalTeams: 0,
    totalGroups: 0,
    totalMatches: 0,
    completedMatches: 0,
    liveMatches: 0,
    totalGoals: 0,
  });

  // Score editing modal state
  const [selectedMatchForScore, setSelectedMatchForScore] = useState<Match | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState<boolean>(false);

  const loadDashboardData = useCallback(
    async (showRefreshIndicator = false) => {
      if (!currentTournamentId) {
        setIsLoading(false);
        return;
      }

      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const [teams, rawMatches, groupsMap, scorersData, standingsRes] = await Promise.all([
          teamService.getByTournament(currentTournamentId).catch(() => []),
          matchService.getByTournament(currentTournamentId).catch(() => []),
          groupService.getByTournament(currentTournamentId).catch(() => ({})),
          matchService.getTopScorers(currentTournamentId, 5).catch(() => []),
          standingsService.getByTournament(currentTournamentId).catch(() => ({ groups: {} as any })),
        ]);

        const teamMap = new Map<string, Team>();
        teams.forEach((t) => teamMap.set(String(t.id), t));

        // Map raw matches to frontend Match
        const mappedMatches: Match[] = (rawMatches || []).map((m: any, idx: number) => {
          const homeTeam = teamMap.get(String(m.home_team_id));
          const awayTeam = teamMap.get(String(m.away_team_id));

          return {
            id: String(m.id),
            tournamentId: String(m.tournament_id || currentTournamentId || ''),
            matchNumber: m.match_number || idx + 1,
            matchday: m.matchday || 1,
            round:
              m.round_name ||
              m.round ||
              (m.stage === 'knockout' ? 'รอบน็อคเอาท์' : 'รอบแบ่งกลุ่ม (Group Stage)'),
            group: m.group_name || m.group || '',
            dateStr: m.match_date || 'TBD',
            timeStr: m.match_time || 'TBD',
            venue: m.venue || m.pitch || 'สนาม 1',
            team1: homeTeam || {
              id: String(m.home_team_id || ''),
              name: m.home_team_name || (m.home_team_id ? String(m.home_team_id) : 'รอระบุทีมเหย้า'),
              shortName: (m.home_team_name || String(m.home_team_id || 'HOM')).slice(0, 3).toUpperCase(),
              logo: m.home_team_logo || '',
            },
            team2: awayTeam || {
              id: String(m.away_team_id || ''),
              name: m.away_team_name || (m.away_team_id ? String(m.away_team_id) : 'รอระบุทีมเยือน'),
              shortName: (m.away_team_name || String(m.away_team_id || 'AWY')).slice(0, 3).toUpperCase(),
              logo: m.away_team_logo || '',
            },
            score1: m.home_score !== null && m.home_score !== undefined ? Number(m.home_score) : 0,
            score2: m.away_score !== null && m.away_score !== undefined ? Number(m.away_score) : 0,
            penaltyScore1: m.home_penalty_score ?? null,
            penaltyScore2: m.away_penalty_score ?? null,
            status: mapBackendStatusToFrontend(m.status),
            goalPlayers1: m.home_scorers || m.goalPlayers1 || '',
            goalPlayers2: m.away_scorers || m.goalPlayers2 || '',
            cardsT1: m.cardsT1 || null,
            cardsT2: m.cardsT2 || null,
            events: m.events || [],
          };
        });

        setMatches(mappedMatches);

        // รวมอันดับดาวซัลโว: ใช้ข้อมูลจาก Backend หรือคำนวณ Fallback จากแมตช์หากยังไม่มีข้อมูล
        let finalScorers = scorersData && scorersData.length > 0 ? scorersData : [];
        if (finalScorers.length === 0) {
          const fallbackMap = new Map<string, {
            id: string;
            rank: number;
            name: string;
            number: string;
            teamId: string;
            teamName: string;
            goals: number;
          }>();

          mappedMatches.forEach((m) => {
            const processScorers = (team: Team, rawStr?: string, eventsList?: any[]) => {
              // 1. จาก events ถ้ามี
              if (eventsList && eventsList.length > 0) {
                eventsList
                  .filter((e) => e.event_type === 'goal' && String(e.team_id) === String(team.id))
                  .forEach((e) => {
                    const num = e.player_number ? String(e.player_number).trim() : '';
                    const p = team.players?.find((pl) => String(pl.number).trim() === num);
                    const pName = p?.name || e.detail || (num ? `ผู้เล่นหมายเลข ${num}` : 'ผู้เล่นไม่ระบุชื่อ');
                    const key = `${team.id}_${num || pName}`;

                    if (!fallbackMap.has(key)) {
                      fallbackMap.set(key, {
                        id: key,
                        rank: 1,
                        name: pName,
                        number: num,
                        teamId: String(team.id),
                        teamName: team.name,
                        goals: 0,
                      });
                    }
                    fallbackMap.get(key)!.goals += 1;
                  });
              } else if (rawStr && rawStr.trim()) {
                // 2. จากข้อความ comma-separated
                rawStr.split(',').forEach((s) => {
                  const trimmed = s.trim();
                  if (!trimmed) return;
                  const numMatch = trimmed.match(/\d+/);
                  const num = numMatch ? numMatch[0] : '';
                  const p = team.players?.find((pl) => String(pl.number).trim() === num);
                  const pName = p?.name || (num ? `ผู้เล่นหมายเลข ${num}` : trimmed);
                  const key = `${team.id}_${num || pName}`;

                  if (!fallbackMap.has(key)) {
                    fallbackMap.set(key, {
                      id: key,
                      rank: 1,
                      name: pName,
                      number: num,
                      teamId: String(team.id),
                      teamName: team.name,
                      goals: 0,
                    });
                  }
                  fallbackMap.get(key)!.goals += 1;
                });
              }
            };

            processScorers(m.team1, m.goalPlayers1, m.events);
            processScorers(m.team2, m.goalPlayers2, m.events);
          });

          finalScorers = Array.from(fallbackMap.values())
            .filter((s) => s.goals > 0)
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 5)
            .map((s, idx) => ({ ...s, rank: idx + 1 }));
        }

        setTopScorers(finalScorers);
        setStandingsGroups(standingsRes.groups || {});

        const totalTeams = teams.length;
        const totalGroups = Object.keys(groupsMap || {}).length;
        const totalMatches = mappedMatches.length;

        let completedMatches = 0;
        let liveMatches = 0;
        let totalGoals = 0;

        mappedMatches.forEach((m) => {
          const status = m.status;
          if (status === 'LIVE') {
            liveMatches++;
          } else if (status === 'FT') {
            completedMatches++;
          }

          if (status === 'LIVE' || status === 'FT') {
            totalGoals += (m.score1 || 0) + (m.score2 || 0);
          }
        });

        setStats({
          totalTeams,
          totalGroups,
          totalMatches,
          completedMatches,
          liveMatches,
          totalGoals,
        });
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลสถิติ');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentTournamentId]
  );

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // สลับสถานะแมตช์ด่วน (เช่น LIVE <-> FT)
  const handleQuickStatusChange = async (match: Match, newStatus: MatchStatus) => {
    if (!currentTournamentId) return;

    try {
      const backendStatus = mapFrontendStatusToBackend(newStatus);
      await matchService.recordResult(currentTournamentId, match.id, {
        home_score: match.score1,
        away_score: match.score2,
        home_penalty_score: match.penaltyScore1,
        away_penalty_score: match.penaltyScore2,
        status: backendStatus,
      });

      // รีเฟรชข้อมูลแดชบอร์ด
      loadDashboardData(true);
    } catch (err: any) {
      console.error('Failed to update match status:', err);
      alert('ไม่สามารถอัปเดตสถานะแมตช์ได้: ' + (err.message || 'เกิดข้อผิดพลาด'));
    }
  };

  const handleOpenScoreModal = (match: Match) => {
    setSelectedMatchForScore(match);
    setIsScoreModalOpen(true);
  };

  const handleSaveScoreAndGoals = async (payload: {
    homeScore: number;
    awayScore: number;
    homePenaltyScore: number | null;
    awayPenaltyScore: number | null;
    status: MatchStatus;
    scorers: ScorerItem[];
    cards?: any[];
  }) => {
    if (!currentTournamentId || !selectedMatchForScore) return;

    const backendStatus = mapFrontendStatusToBackend(payload.status);

    // 1. บันทึกผลสกอร์และสถานะไปยัง Backend
    await matchService.recordResult(currentTournamentId, selectedMatchForScore.id, {
      home_score: payload.homeScore,
      away_score: payload.awayScore,
      home_penalty_score: payload.homePenaltyScore,
      away_penalty_score: payload.awayPenaltyScore,
      status: backendStatus,
    });

    // 2. บันทึกผู้ทำประตู (Goalscorers) ไปยัง Backend DB match_events
    try {
      await matchService.syncMatchGoals(
        currentTournamentId,
        selectedMatchForScore.id,
        payload.scorers.map((s) => ({
          team_id: s.team_id,
          player_id: s.player_id,
          player_number: s.player_number,
          player_name: s.player_name,
        }))
      );
    } catch (goalsErr: any) {
      console.warn('Could not sync goals to match_events:', goalsErr);
    }

    // 3. บันทึกใบเตือน (Yellow & Red Cards) ไปยัง Backend DB match_events
    if (payload.cards && payload.cards.length >= 0) {
      try {
        await matchService.syncMatchCards(
          currentTournamentId,
          selectedMatchForScore.id,
          payload.cards.map((c) => ({
            team_id: c.team_id,
            player_id: c.player_id,
            player_number: c.player_number,
            player_name: c.player_name,
            card_type: c.card_type,
          }))
        );
      } catch (cardsErr: any) {
        console.warn('Could not sync cards to match_events:', cardsErr);
      }
    }

    // 4. รีเฟรชข้อมูลแดชบอร์ดทันที (สถิติ, แมตช์, ตารางคะแนน, อันดับดาวซัลโว)
    await loadDashboardData(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ส่วนหัวแดชบอร์ด (Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-[#efeded] p-5 sm:p-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-display text-[#1b1c1c]">
              แดชบอร์ดภาพรวม
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#7d7765] mt-1">
            สรุปสถานะ สถิติภาพรวม และการแข่งขันของทัวร์นาเมนต์{' '}
            <span className="font-semibold text-[#1b1c1c]">
              {tournamentName}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDashboardData(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#5c5746] bg-[#f8f7f5] hover:bg-[#efece6] border border-[#efeded] rounded-xl transition-colors disabled:opacity-50"
            title="รีเฟรชข้อมูล"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            รีเฟรชข้อมูล
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. แถบสรุปตัวเลขสถิติภาพรวม (Stat Cards) */}
      <DashboardStatsCards stats={stats} isLoading={isLoading} />

      {/* 2. ศูนย์ควบคุมแมตช์ & อัปเดตผลการแข่งขัน (Match Center) */}
      <DashboardMatchCenter
        matches={matches}
        onOpenScoreModal={handleOpenScoreModal}
        onQuickStatusChange={handleQuickStatusChange}
        onNavigateToMatches={() => onNavigate && onNavigate('matches')}
      />

      {/* 3 & 4. โครงสร้าง Grid สองคอลัมน์: ตารางคะแนนย่อ & อันดับดาวซัลโว */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* คอลัมน์ซ้าย: สรุปตารางคะแนนย่อ */}
        <MiniStandingsWidget
          groups={standingsGroups}
          isLoading={isLoading}
          onNavigateToStandings={() => onNavigate && onNavigate('standings')}
        />

        {/* คอลัมน์ขวา: อันดับดาวซัลโวสูงสุด (Top Scorers) */}
        <TopScorersWidget
          scorers={topScorers}
          isLoading={isLoading}
        />
      </div>

      {/* โมดอลแก้ไขสกอร์ & ผู้ทำประตู */}
      <QuickScoreEditModal
        isOpen={isScoreModalOpen}
        match={selectedMatchForScore}
        tournamentId={currentTournamentId || ''}
        onClose={() => setIsScoreModalOpen(false)}
        onSave={handleSaveScoreAndGoals}
      />
    </div>
  );
};
