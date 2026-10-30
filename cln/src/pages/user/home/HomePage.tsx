import React, { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Loader2 } from 'lucide-react';
import {
  FeaturedMatchHero,
  MatchHeaderBar,
  MatchCard,
  MatchTableRow,
  MatchDetailModal,
  ViewMode,
} from './components';
import { Match, Team } from '../../../types';
import { matchService } from '../../../services/matchService';
import { teamService } from '../../../services/teamService';

export interface HomePageProps {
  tournamentId?: string;
  matches?: Match[];
  onSelectMatch?: (match: Match) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  tournamentId = '1000',
  matches: propMatches,
  onSelectMatch,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDetailMatch, setSelectedDetailMatch] = useState<Match | null>(null);

  const handleMatchClick = (match: Match) => {
    setSelectedDetailMatch(match);
    if (onSelectMatch) {
      onSelectMatch(match);
    }
  };

  // Direct fetch from API (Single Source of Truth - matching Admin schedule exactly)
  const fetchSchedule = useCallback(async () => {
    const tourneyId = tournamentId || '1000';
    setIsLoading(true);
    try {
      const [rawMatches, rawTeams] = await Promise.all([
        matchService.getByTournament(tourneyId),
        teamService.getByTournament(tourneyId),
      ]);

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

        const rawStatus = String(m.status || 'SCHEDULED').toUpperCase();
        const uiStatus =
          rawStatus === 'LIVE'
            ? 'LIVE'
            : rawStatus === 'COMPLETED' || rawStatus === 'FT' || rawStatus === 'FINISHED'
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

  // Find featured match: Prioritize LIVE match, otherwise first upcoming match, otherwise first match
  const featuredMatch =
    matches.find((m) => m.status === 'LIVE') ||
    matches.find((m) => m.status === 'UPCOMING') ||
    (matches.length > 0 ? matches[0] : null);

  return (
    <div className="space-y-6">
      {/* 1. Featured Match Hero Banner */}
      {featuredMatch && (
        <FeaturedMatchHero
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
