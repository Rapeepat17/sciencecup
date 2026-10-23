import React, { useState, useEffect, useMemo } from 'react';
import { Award } from 'lucide-react';
import { StandingsBanner, GroupTableCard, TopScorersCard } from './components';
import { fetchDatabase } from '../../../services/dbService';
import { calculateGroupStandings, calculateTopScorers } from '../../../utils/standingsCalculator';
import { GroupMap, Match, Team } from '../../../types';

export interface StandingsPageProps {
  tournamentId?: string;
  groups?: GroupMap;
  matches?: Match[];
  teams?: Team[];
  onTeamClick?: (teamId: string | number) => void;
}

export const StandingsPage: React.FC<StandingsPageProps> = ({
  tournamentId,
  groups: initialGroups,
  matches: initialMatches,
  teams: initialTeams,
  onTeamClick,
}) => {
  const [groups, setGroups] = useState<GroupMap>(initialGroups ?? {});
  const [matches, setMatches] = useState<Match[]>(initialMatches ?? []);
  const [teams, setTeams] = useState<Team[]>(initialTeams ?? []);
  const [hasData, setHasData] = useState(initialGroups !== undefined);

  // Sync state when props update
  useEffect(() => {
    if (initialGroups !== undefined) {
      setGroups(initialGroups);
      setMatches(initialMatches ?? []);
      setTeams(initialTeams ?? []);
      setHasData(true);
    }
  }, [initialGroups, initialMatches, initialTeams]);

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

  // Compute standings per group from database
  const calculatedStandings = useMemo(() => {
    if (hasData && Object.keys(groups).length > 0) {
      return calculateGroupStandings(groups, matches);
    }
    return {};
  }, [hasData, groups, matches]);

  // Compute top scorers
  const topScorers = useMemo(() => {
    return calculateTopScorers(matches, teams);
  }, [matches, teams]);

  const groupKeys = Object.keys(calculatedStandings);

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
