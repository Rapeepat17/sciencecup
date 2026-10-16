import React, { useState, useEffect, useMemo } from 'react';
import { StandingsBanner, GroupTableCard, TopScorersCard } from './components';
import { fetchDatabase } from '../../../services/dbService';
import { calculateGroupStandings, calculateTopScorers } from '../../../utils/standingsCalculator';
import { GroupMap, Match, Team, TeamStanding } from '../../../types';

export interface StandingsPageProps {
  onTeamClick?: (teamId: string | number) => void;
}

// Fallback sample standings for demonstration when database is uninitialized
const SAMPLE_STANDINGS: Record<string, TeamStanding[]> = {
  'กลุ่ม A': [
    { team: { id: 'a1', name: 'ศิษย์ยิ่งวิทยา', logo: '' }, group: 'กลุ่ม A', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] },
    { team: { id: 'a2', name: 'BABY SCI', logo: '' }, group: 'กลุ่ม A', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] },
    { team: { id: 'a3', name: 'Sc NaSAN FC', logo: '' }, group: 'กลุ่ม A', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] },
    { team: { id: 'a4', name: 'SHABAB', logo: '' }, group: 'กลุ่ม A', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] },
  ],
  'กลุ่ม B': [
    { team: { id: 'b1', name: 'อาจารย์', logo: '' }, group: 'กลุ่ม B', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] },
    { team: { id: 'b2', name: 'โอเลี้ยง', logo: '' }, group: 'กลุ่ม B', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] },
    { team: { id: 'b3', name: 'NAMVIDYA', logo: '' }, group: 'กลุ่ม B', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] },
    { team: { id: 'b4', name: 'SCI-NITRO', logo: '' }, group: 'กลุ่ม B', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] },
  ],
  'กลุ่ม C': [
    { team: { id: 'c1', name: 'ศิษย์เก่าคณะวิทย์', logo: '' }, group: 'กลุ่ม C', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] },
  ],
};

export const StandingsPage: React.FC<StandingsPageProps> = ({ onTeamClick }) => {
  const [groups, setGroups] = useState<GroupMap>({});
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadStandingsData = async () => {
      try {
        const data = await fetchDatabase();
        if (isMounted && data) {
          if (data.groups && Object.keys(data.groups).length > 0) {
            setGroups(data.groups);
            setMatches(data.matches || []);
            setTeams(data.teams || []);
            setHasData(true);
          }
        }
      } catch (err) {
        console.warn('Could not load live standings, using sample:', err);
      }
    };

    loadStandingsData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute standings per group from live database, or use sample
  const calculatedStandings = useMemo(() => {
    if (hasData && Object.keys(groups).length > 0) {
      return calculateGroupStandings(groups, matches);
    }
    return SAMPLE_STANDINGS;
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

      {/* 2. Group Tables Grid */}
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

      {/* 3. Top Scorers Leaderboard */}
      <TopScorersCard topScorers={topScorers} />
    </div>
  );
};

export default StandingsPage;
