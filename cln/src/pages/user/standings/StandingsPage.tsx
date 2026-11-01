import React, { useState, useEffect, useMemo } from 'react';
import { Award } from 'lucide-react';
import { StandingsBanner, GroupTableCard, TopScorersCard } from './components';
import { fetchDatabase } from '../../../services/dbService';
import { playerService } from '../../../services/playerService';
import { matchService } from '../../../services/matchService';
import { calculateGroupStandings, calculateTopScorers } from '../../../utils/standingsCalculator';
import { GroupMap, Match, Team, Player, TopScorer } from '../../../types';

export interface StandingsPageProps {
  tournamentId?: string;
  groups?: GroupMap;
  matches?: Match[];
  teams?: Team[];
  tournamentStatus?: string;
  isDraft?: boolean;
  onTeamClick?: (teamId: string | number) => void;
}

export const StandingsPage: React.FC<StandingsPageProps> = ({
  tournamentId,
  groups: initialGroups,
  matches: initialMatches,
  teams: initialTeams,
  tournamentStatus: propTournamentStatus,
  isDraft: propIsDraft,
  onTeamClick,
}) => {
  const [groups, setGroups] = useState<GroupMap>(initialGroups ?? {});
  const [matches, setMatches] = useState<Match[]>(initialMatches ?? []);
  const [teams, setTeams] = useState<Team[]>(initialTeams ?? []);
  const [hasData, setHasData] = useState(initialGroups !== undefined);
  const [status, setStatus] = useState<string>(propTournamentStatus || 'ACTIVE');
  const [players, setPlayers] = useState<Player[]>([]);
  const [backendTopScorers, setBackendTopScorers] = useState<TopScorer[]>([]);

  // Sync state when props update
  useEffect(() => {
    if (initialGroups !== undefined) {
      setGroups(initialGroups);
      setMatches(initialMatches ?? []);
      setTeams(initialTeams ?? []);
      setHasData(true);
    }
  }, [initialGroups, initialMatches, initialTeams]);

  // Load live players and backend top scorers
  useEffect(() => {
    const tourneyId = tournamentId || '1000';
    let isMounted = true;
    const loadTopScorersAndPlayers = async () => {
      try {
        const [playersList, scorersList] = await Promise.all([
          playerService.getByTournament(tourneyId).catch(() => []),
          matchService.getTopScorers(tourneyId, 10).catch(() => []),
        ]);
        if (isMounted) {
          if (Array.isArray(playersList)) setPlayers(playersList);
          if (Array.isArray(scorersList) && scorersList.length > 0) {
            setBackendTopScorers(scorersList as TopScorer[]);
          }
        }
      } catch (err) {
        console.warn('Could not load top scorers or players:', err);
      }
    };
    loadTopScorersAndPlayers();
    return () => {
      isMounted = false;
    };
  }, [tournamentId, matches]);

  // Load standings from database if not provided via props
  useEffect(() => {
    if (initialGroups !== undefined) return;
    let isMounted = true;
    const loadStandingsData = async () => {
      try {
        const data = await fetchDatabase(tournamentId);
        if (isMounted && data) {
          setGroups(data.groups || {});
          setMatches(data.matches || []);
          setTeams(data.teams || []);
          if (data.status) setStatus(String(data.status).toUpperCase());
          setHasData(true);
        }
      } catch (err) {
        console.warn('Could not load live standings:', err);
      }
    };

    loadStandingsData();
    return () => {
      isMounted = false;
    };
  }, [tournamentId, initialGroups]);

  // Attach players roster to teams for accurate name lookup
  const teamsWithPlayers = useMemo(() => {
    if (!players || players.length === 0) return teams;
    return teams.map((t) => {
      const teamPlayers = players.filter(
        (p) => String(p.team_id || p.teamId) === String(t.id)
      );
      return {
        ...t,
        players: teamPlayers.length > 0 ? teamPlayers : t.players,
      };
    });
  }, [teams, players]);

  // Compute standings per group from database
  const calculatedStandings = useMemo(() => {
    if (hasData && Object.keys(groups).length > 0) {
      return calculateGroupStandings(groups, matches);
    }
    return {};
  }, [hasData, groups, matches]);

  // Compute top scorers: prefer backend calculated scorers, or calculate with team player rosters
  const topScorers = useMemo(() => {
    if (backendTopScorers && backendTopScorers.length > 0) {
      return backendTopScorers;
    }
    return calculateTopScorers(matches, teamsWithPlayers);
  }, [matches, teamsWithPlayers, backendTopScorers]);

  const groupKeys = Object.keys(calculatedStandings);

  const effectiveIsDraft =
    propIsDraft !== undefined ? propIsDraft : status === 'DRAFT';

  if (effectiveIsDraft) {
    return (
      <div className="max-w-4xl mx-auto w-full pt-4">
        <div className="bg-white rounded-3xl border border-[#efeded] p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#f5f3f3] text-[#7d7765] flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-[#786607]" />
          </div>
          <h3 className="font-display text-xl font-bold text-[#1b1c1c]">ยังไม่มีข้อมูลตารางคะแนน</h3>
          <p className="text-xs sm:text-sm text-[#7d7765] mt-2 max-w-md mx-auto">
            ขณะนี้ยังไม่มีข้อมูลตารางคะแนน กรุณารอฝ่ายจัดการแข่งขันอัปเดตตารางคะแนนอีกครั้ง
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Top Real-time Standings Banner */}
      <StandingsBanner />

      {/* 2. Group Tables Grid or Empty State */}
      {groupKeys.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#efeded] p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#f5f3f3] text-[#7d7765] flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-[#786607]" />
          </div>
          <h3 className="font-display text-lg font-bold text-[#1b1c1c]">ยังไม่มีตารางคะแนน</h3>
          <p className="text-xs text-[#7d7765] mt-1 max-w-sm mx-auto">
            ทัวร์นาเมนต์นี้ยังไม่มีการจัดกลุ่มทีมแข่งขัน หรือยังไม่มีทีมที่ถูกแบ่งสาย
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {groupKeys.map((groupKey) => (
            <GroupTableCard
              key={groupKey}
              groupName={groupKey}
              standings={calculatedStandings[groupKey] || []}
              onTeamClick={onTeamClick}
            />
          ))}
        </div>
      )}

      {/* 3. Top Scorers Leaderboard */}
      {topScorers.length > 0 && <TopScorersCard topScorers={topScorers} />}
    </div>
  );
};

export default StandingsPage;
