import React, { useState, useEffect } from 'react';
import {
  KnockoutBanner,
  KnockoutFilterTabs,
  KnockoutFilterRound,
  BracketTree,
} from './components';
import { fetchDatabase } from '../../../services/dbService';
import { BracketMatchup } from '../../../types';

export interface KnockoutPageProps {
  tournamentId?: string;
  tournamentName?: string;
  startingRound?: 'qf' | 'sf' | 'final';
  qfMatches?: BracketMatchup[];
  sfMatches?: BracketMatchup[];
  finalMatch?: BracketMatchup | null;
  onMatchClick?: (matchId: string) => void;
}

export const KnockoutPage: React.FC<KnockoutPageProps> = ({
  tournamentId,
  tournamentName,
  startingRound = 'sf',
  qfMatches: initialQf,
  sfMatches: initialSf,
  finalMatch: initialFinal,
  onMatchClick,
}) => {
  const [selectedRound, setSelectedRound] = useState<KnockoutFilterRound>('all');
  const [qfMatches, setQfMatches] = useState<BracketMatchup[]>(initialQf ?? []);
  const [sfMatches, setSfMatches] = useState<BracketMatchup[]>(initialSf ?? []);
  const [finalMatch, setFinalMatch] = useState<BracketMatchup | null>(initialFinal ?? null);

  // Sync state when props update
  useEffect(() => {
    if (initialQf !== undefined) setQfMatches(initialQf);
    if (initialSf !== undefined) setSfMatches(initialSf);
    if (initialFinal !== undefined) setFinalMatch(initialFinal);
  }, [initialQf, initialSf, initialFinal]);

  // Load bracket from database if not provided via props
  useEffect(() => {
    if (initialQf !== undefined || initialSf !== undefined || initialFinal !== undefined) return;
    let isMounted = true;
    const loadBracket = async () => {
      try {
        const data = await fetchDatabase(tournamentId);
        if (isMounted && data) {
          if (data.qfMatches) setQfMatches(data.qfMatches);
          if (data.sfMatches) setSfMatches(data.sfMatches);
          if (data.finalMatch) setFinalMatch(data.finalMatch);
        }
      } catch (err) {
        console.warn('Could not load bracket from database:', err);
      }
    };

    loadBracket();
    return () => {
      isMounted = false;
    };
  }, [tournamentId, initialQf, initialSf, initialFinal]);

  return (
    <div className="space-y-6">
      {/* 1. Knockout Header Banner */}
      <KnockoutBanner tournamentName={tournamentName} />

      {/* 2. Round Filter Tabs */}
      <KnockoutFilterTabs
        selectedRound={selectedRound}
        onSelectRound={setSelectedRound}
        startingRound={startingRound}
      />

      {/* 3. Visual Bracket Tree */}
      <BracketTree
        tournamentName={tournamentName}
        startingRound={startingRound}
        qfMatches={qfMatches}
        sfMatches={sfMatches}
        finalMatch={finalMatch}
        selectedRound={selectedRound}
        onMatchClick={onMatchClick}
      />
    </div>
  );
};

export default KnockoutPage;
