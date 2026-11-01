import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarDays, Loader2 } from 'lucide-react';
import {
  FeaturedMatchHero,
  ChampionData,
  MatchHeaderBar,
  MatchCard,
  MatchTableRow,
  MatchDetailModal,
  ViewMode,
} from './components';
import { Match, Team } from '../../../types';
import { matchService } from '../../../services/matchService';
import { teamService } from '../../../services/teamService';
import { tournamentService } from '../../../services/tournamentService';

export interface HomePageProps {
  tournamentId?: string;
  matches?: Match[];
  onSelectMatch?: (match: Match) => void;
  tournamentStatus?: string;
  isDraft?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  tournamentId = '1000',
  matches: propMatches,
  onSelectMatch,
  tournamentStatus: propTournamentStatus,
  isDraft: propIsDraft,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [matches, setMatches] = useState<Match[]>(propMatches ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(!propMatches || propMatches.length === 0);
  const [selectedDetailMatch, setSelectedDetailMatch] = useState<Match | null>(null);
  const [status, setStatus] = useState<string>(propTournamentStatus || 'ACTIVE');
  const [finalBracketMatch, setFinalBracketMatch] = useState<any>(null);

  useEffect(() => {
    if (propMatches && propMatches.length > 0) {
      setMatches(propMatches);
      setIsLoading(false);
    }
  }, [propMatches]);

  const handleMatchClick = (match: Match) => {
    setSelectedDetailMatch(match);
    if (onSelectMatch) {
      onSelectMatch(match);
    }
  };

  // Direct fetch from API (Single Source of Truth - matching Admin schedule exactly)
  const fetchSchedule = useCallback(async () => {
    const tourneyId = tournamentId || '1000';
    if (!propMatches || propMatches.length === 0) {
      setIsLoading(true);
    }
    try {
      const [rawMatches, rawTeams, tourneyData, bracketData] = await Promise.all([
        matchService.getByTournament(tourneyId).catch(() => []),
        teamService.getByTournament(tourneyId).catch(() => []),
        tournamentService.getById(tourneyId).catch(() => null),
        tournamentService.getBracket(tourneyId).catch(() => null),
      ]);

      if ((!rawMatches || rawMatches.length === 0) && propMatches && propMatches.length > 0) {
        setMatches(propMatches);
        return;
      }

      if (tourneyData?.status) {
        setStatus(String(tourneyData.status).toUpperCase());
      }

      const fb =
        bracketData?.bracket_data?.finalMatch ||
        tourneyData?.bracket_data?.finalMatch;
      if (fb) {
        setFinalBracketMatch(fb);
      }

      const teamMap = new Map<string, Team>();
      (rawTeams || []).forEach((t: any) => teamMap.set(String(t.id), t));

      const transformed: Match[] = (rawMatches || []).map((m: any, idx: number) => {
        const homeTeam = m.home_team_id ? teamMap.get(String(m.home_team_id)) : undefined;
        const awayTeam = m.away_team_id ? teamMap.get(String(m.away_team_id)) : undefined;

        const normalizedGroup = m.group_name
          ? String(m.group_name).replace(/^Group\s*/i, '').trim()
          : m.stage === 'knockout'
          ? 'Knockout'
          : 'A';

        const fallbackHomeName =
          m.home_team_name ||
          m.team1?.name ||
          (m.home_team_id && String(m.home_team_id).trim() !== ''
            ? String(m.home_team_id).trim()
            : 'รอระบุทีม');

        const fallbackAwayName =
          m.away_team_name ||
          m.team2?.name ||
          (m.away_team_id && String(m.away_team_id).trim() !== ''
            ? String(m.away_team_id).trim()
            : 'รอระบุทีม');

        const hasScoreEntered =
          m.home_score !== null &&
          m.home_score !== undefined &&
          m.away_score !== null &&
          m.away_score !== undefined;
        const rawStatus = String(m.status || 'SCHEDULED').toUpperCase();
        const uiStatus =
          rawStatus === 'LIVE'
            ? 'LIVE'
            : rawStatus === 'COMPLETED' || rawStatus === 'FT' || rawStatus === 'FINISHED' || hasScoreEntered
            ? 'FT'
            : rawStatus === 'POSTPONED'
            ? 'POSTPONED'
            : 'UPCOMING';

        return {
          id: String(m.id),
          tournamentId: String(tourneyId),
          matchNumber: m.match_number || idx + 1,
          matchday: m.matchday || 1,
          round:
            m.round_name ||
            m.round ||
            (m.stage === 'knockout' ? 'รอบน็อคเอาท์' : 'รอบแบ่งกลุ่ม (Group Stage)'),
          group: normalizedGroup,
          dateStr: m.match_date || m.dateStr || 'TBD',
          timeStr: m.match_time || m.timeStr || 'TBD',
          venue: m.venue || m.pitch || 'สนาม 1',
          team1: homeTeam || {
            id: String(m.home_team_id || ''),
            name: fallbackHomeName,
            shortName: fallbackHomeName.slice(0, 3).toUpperCase(),
            logo: m.home_team_logo || m.team1?.logo || '',
          },
          team2: awayTeam || {
            id: String(m.away_team_id || ''),
            name: fallbackAwayName,
            shortName: fallbackAwayName.slice(0, 3).toUpperCase(),
            logo: m.away_team_logo || m.team2?.logo || '',
          },
          score1:
            m.home_score !== null && m.home_score !== undefined
              ? Number(m.home_score)
              : 0,
          score2:
            m.away_score !== null && m.away_score !== undefined
              ? Number(m.away_score)
              : 0,
          penaltyScore1: m.home_penalty_score ?? null,
          penaltyScore2: m.away_penalty_score ?? null,
          status: uiStatus as any,
          goalPlayers1: m.home_scorers || m.goalPlayers1 || '',
          goalPlayers2: m.away_scorers || m.goalPlayers2 || '',
          cardsT1: m.cardsT1 || null,
          cardsT2: m.cardsT2 || null,
          events: m.events || [],
        };
      });

      // Deduplicate by matchNumber strictly
      const deduped: Match[] = [];
      const seenNums = new Set<number>();
      for (const cand of transformed) {
        const num = Number(cand.matchNumber);
        if (num > 0) {
          if (seenNums.has(num)) continue;
          seenNums.add(num);
        }
        deduped.push(cand);
      }

      setMatches(deduped);
    } catch (err) {
      console.warn('[HomePage] Failed to fetch matches:', err);
      if (propMatches && propMatches.length > 0) {
        setMatches(propMatches);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId, propMatches]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Check if final match is completed and resolve champion data
  const champion: ChampionData | null = useMemo(() => {
    // 1. ตรวจสอบจาก matches list
    const finalMatchInList = matches.find((m) => {
      const r = String(m.round || '').toLowerCase();
      return (
        (r.includes('ชิงชนะเลิศ') || r.includes('รอบชิง') || r.includes('final')) &&
        !r.includes('รอง') &&
        !r.includes('semi') &&
        !r.includes('quarter')
      );
    });

    if (finalMatchInList) {
      const isCompleted =
        finalMatchInList.status === 'FT' ||
        (finalMatchInList.score1 !== null &&
          finalMatchInList.score2 !== null &&
          (finalMatchInList.score1 > 0 ||
            finalMatchInList.score2 > 0 ||
            finalMatchInList.penaltyScore1 !== null));

      if (isCompleted) {
        let winnerTeam = null;
        let runnerUpTeam = null;
        let scoreWinner = 0;
        let scoreRunnerUp = 0;
        let penaltyWinner: number | null = null;
        let penaltyRunnerUp: number | null = null;

        if (finalMatchInList.score1 > finalMatchInList.score2) {
          winnerTeam = finalMatchInList.team1;
          runnerUpTeam = finalMatchInList.team2;
          scoreWinner = finalMatchInList.score1;
          scoreRunnerUp = finalMatchInList.score2;
          penaltyWinner = finalMatchInList.penaltyScore1 ?? null;
          penaltyRunnerUp = finalMatchInList.penaltyScore2 ?? null;
        } else if (finalMatchInList.score2 > finalMatchInList.score1) {
          winnerTeam = finalMatchInList.team2;
          runnerUpTeam = finalMatchInList.team1;
          scoreWinner = finalMatchInList.score2;
          scoreRunnerUp = finalMatchInList.score1;
          penaltyWinner = finalMatchInList.penaltyScore2 ?? null;
          penaltyRunnerUp = finalMatchInList.penaltyScore1 ?? null;
        } else if (
          finalMatchInList.penaltyScore1 !== null &&
          finalMatchInList.penaltyScore2 !== null &&
          finalMatchInList.penaltyScore1 !== finalMatchInList.penaltyScore2
        ) {
          if (finalMatchInList.penaltyScore1 > finalMatchInList.penaltyScore2) {
            winnerTeam = finalMatchInList.team1;
            runnerUpTeam = finalMatchInList.team2;
            scoreWinner = finalMatchInList.score1;
            scoreRunnerUp = finalMatchInList.score2;
            penaltyWinner = finalMatchInList.penaltyScore1;
            penaltyRunnerUp = finalMatchInList.penaltyScore2;
          } else {
            winnerTeam = finalMatchInList.team2;
            runnerUpTeam = finalMatchInList.team1;
            scoreWinner = finalMatchInList.score2;
            scoreRunnerUp = finalMatchInList.score1;
            penaltyWinner = finalMatchInList.penaltyScore2;
            penaltyRunnerUp = finalMatchInList.penaltyScore1;
          }
        }

        if (
          winnerTeam &&
          winnerTeam.name &&
          winnerTeam.name !== '-' &&
          winnerTeam.name !== 'รอระบุทีม'
        ) {
          return {
            team: winnerTeam,
            runnerUp: runnerUpTeam,
            scoreWinner,
            scoreRunnerUp,
            penaltyWinner,
            penaltyRunnerUp,
            venue: finalMatchInList.venue,
            finalMatch: finalMatchInList,
          };
        }
      }
    }

    // 2. Fallback ตรวจสอบจาก finalBracketMatch (สายการแข่งขัน)
    if (finalBracketMatch) {
      const s1 = finalBracketMatch.team1?.score;
      const s2 = finalBracketMatch.team2?.score;
      const p1 = finalBracketMatch.team1?.penaltyScore;
      const p2 = finalBracketMatch.team2?.penaltyScore;
      const w = finalBracketMatch.winner;

      let winnerTeam = null;
      let runnerUpTeam = null;
      let scoreWinner = 0;
      let scoreRunnerUp = 0;
      let penaltyWinner: number | null = null;
      let penaltyRunnerUp: number | null = null;

      if (
        w === 1 ||
        (s1 !== null && s1 !== undefined && s2 !== null && s2 !== undefined && s1 > s2) ||
        (p1 !== null && p1 !== undefined && p2 !== null && p2 !== undefined && p1 > p2)
      ) {
        winnerTeam = finalBracketMatch.team1;
        runnerUpTeam = finalBracketMatch.team2;
        scoreWinner = s1 ?? 0;
        scoreRunnerUp = s2 ?? 0;
        penaltyWinner = p1 ?? null;
        penaltyRunnerUp = p2 ?? null;
      } else if (
        w === 2 ||
        (s1 !== null && s1 !== undefined && s2 !== null && s2 !== undefined && s2 > s1) ||
        (p1 !== null && p1 !== undefined && p2 !== null && p2 !== undefined && p2 > p1)
      ) {
        winnerTeam = finalBracketMatch.team2;
        runnerUpTeam = finalBracketMatch.team1;
        scoreWinner = s2 ?? 0;
        scoreRunnerUp = s1 ?? 0;
        penaltyWinner = p2 ?? null;
        penaltyRunnerUp = p1 ?? null;
      }

      if (
        winnerTeam &&
        winnerTeam.name &&
        winnerTeam.name !== '-' &&
        winnerTeam.name !== 'รอระบุทีม'
      ) {
        return {
          team: winnerTeam,
          runnerUp: runnerUpTeam,
          scoreWinner,
          scoreRunnerUp,
          penaltyWinner,
          penaltyRunnerUp,
          venue: finalBracketMatch.venue,
          finalMatch: null,
        };
      }
    }

    return null;
  }, [matches, finalBracketMatch]);

  // Find featured match: Prioritize LIVE match, otherwise first upcoming match, otherwise first match
  const featuredMatch =
    matches.find((m) => m.status === 'LIVE') ||
    matches.find((m) => m.status === 'UPCOMING') ||
    (matches.length > 0 ? matches[0] : null);

  const effectiveIsDraft =
    propIsDraft !== undefined ? propIsDraft : status === 'DRAFT';

  if (effectiveIsDraft) {
    return (
      <div className="max-w-4xl mx-auto w-full pt-4">
        <div className="bg-white rounded-3xl border border-[#efeded] p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#f5f3f3] text-[#7d7765] flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-8 h-8 text-[#786607]" />
          </div>
          <h3 className="font-display text-xl font-bold text-[#1b1c1c]">ยังไม่มีตารางการแข่งขัน</h3>
          <p className="text-xs sm:text-sm text-[#7d7765] mt-2 max-w-md mx-auto">
            ขณะนี้ยังไม่มีโปรแกรมการแข่งขัน กรุณารอฝ่ายจัดการแข่งขันอัปเดตตารางแข่งขันอีกครั้ง
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Featured Match Hero Banner / Champion Showcase */}
      {(champion || featuredMatch) && (
        <FeaturedMatchHero
          champion={champion}
          match={featuredMatch}
          onMatchClick={handleMatchClick}
        />
      )}

      {/* 2. Match Queue Header & View Mode Switcher */}
      <div className="max-w-4xl mx-auto w-full space-y-3 pt-1">
        <MatchHeaderBar
          totalMatches={matches.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* 3. Match List or Empty State */}
        {matches.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#efeded] p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#f5f3f3] text-[#7d7765] flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-[#786607]" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#1b1c1c]">ยังไม่มีโปรแกรมการแข่งขัน</h3>
            <p className="text-xs text-[#7d7765] mt-1 max-w-sm mx-auto">
              ทัวร์นาเมนต์นี้ยังไม่มีการจัดตารางแข่งขัน หรืออยู่ระหว่างรอผู้ดูแลระบบประกาศสายการแข่งขัน
            </p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="space-y-3.5">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onSelectMatch={handleMatchClick}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {matches.map((match) => (
              <MatchTableRow
                key={match.id}
                match={match}
                onSelectMatch={handleMatchClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. Match Details Modal */}
      <MatchDetailModal
        match={selectedDetailMatch}
        onClose={() => setSelectedDetailMatch(null)}
      />
    </div>
  );
};

export default HomePage;
