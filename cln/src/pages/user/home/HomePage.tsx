import React, { useState, useEffect } from 'react';
import {
  FeaturedMatchHero,
  MatchHeaderBar,
  MatchCard,
  MatchTableRow,
  MatchDetailModal,
  ViewMode,
} from './components';
import { Match } from '../../../types';
import { fetchDatabase } from '../../../services/dbService';

export interface HomePageProps {
  onSelectMatch?: (match: Match) => void;
}

// Fallback matches matching reference screenshot exactly
const SAMPLE_MATCHES: Match[] = [
  {
    id: 'sample-m1',
    matchday: 1,
    matchNumber: 1,
    dateStr: 'วันเสาร์ที่ 17 ตุลาคม 2026',
    timeStr: '09:00',
    round: 'รอบแบ่งกลุ่ม (Group Stage)',
    group: 'Group A',
    venue: 'สนามหลัก',
    team1: { id: 't1', name: 'SHABAB', logo: '' },
    team2: { id: 't2', name: 'Sc NaSAN FC', logo: '' },
    score1: 0,
    score2: 0,
    status: 'UPCOMING',
  },
  {
    id: 'sample-m2',
    matchday: 1,
    matchNumber: 2,
    dateStr: 'วันเสาร์ที่ 17 ตุลาคม 2026',
    timeStr: '10:15',
    round: 'รอบแบ่งกลุ่ม (Group Stage)',
    group: 'Group B',
    venue: 'สนามหลัก',
    team1: { id: 't3', name: 'โอเลี้ยง', logo: '' },
    team2: { id: 't4', name: 'NAMVIDYA', logo: '' },
    score1: 0,
    score2: 0,
    status: 'UPCOMING',
  },
];

export const HomePage: React.FC<HomePageProps> = ({ onSelectMatch }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [matches, setMatches] = useState<Match[]>(SAMPLE_MATCHES);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDetailMatch, setSelectedDetailMatch] = useState<Match | null>(null);

  const handleMatchClick = (match: Match) => {
    setSelectedDetailMatch(match);
    if (onSelectMatch) {
      onSelectMatch(match);
    }
  };

  // Load matches from database on mount
  useEffect(() => {
    let isMounted = true;
    const fetchTournamentData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchDatabase();
        if (isMounted && data && Array.isArray(data.matches) && data.matches.length > 0) {
          setMatches(data.matches);
        }
      } catch (err) {
        console.warn('Could not load live matches, using sample matches:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTournamentData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Find featured match: Prioritize LIVE match, otherwise first upcoming match, otherwise first match
  const featuredMatch =
    matches.find((m) => m.status === 'LIVE') ||
    matches.find((m) => m.status === 'UPCOMING') ||
    matches[0] ||
    null;

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

        {/* 3. Match List in Selected View Mode */}
        {viewMode === 'card' ? (
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
