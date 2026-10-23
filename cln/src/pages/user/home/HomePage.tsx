import React, { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
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
  tournamentId?: string;
  matches?: Match[];
  onSelectMatch?: (match: Match) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  tournamentId,
  matches: initialMatches,
  onSelectMatch,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [matches, setMatches] = useState<Match[]>(initialMatches ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDetailMatch, setSelectedDetailMatch] = useState<Match | null>(null);

  const handleMatchClick = (match: Match) => {
    setSelectedDetailMatch(match);
    if (onSelectMatch) {
      onSelectMatch(match);
    }
  };

  // Sync matches whenever initialMatches prop updates from App.tsx
  useEffect(() => {
    if (initialMatches !== undefined) {
      setMatches(initialMatches);
    }
  }, [initialMatches]);

  // Load matches from database if not provided via props
  useEffect(() => {
    if (initialMatches !== undefined) return;
    let isMounted = true;
    const fetchTournamentData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchDatabase(tournamentId);
        if (isMounted && data && Array.isArray(data.matches)) {
          setMatches(data.matches);
        }
      } catch (err) {
        console.warn('Could not load live matches:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTournamentData();
    return () => {
      isMounted = false;
    };
  }, [tournamentId, initialMatches]);

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
