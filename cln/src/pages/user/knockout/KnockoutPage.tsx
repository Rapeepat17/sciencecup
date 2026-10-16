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
  onMatchClick?: (matchId: string) => void;
}

export const KnockoutPage: React.FC<KnockoutPageProps> = ({ onMatchClick }) => {
  const [selectedRound, setSelectedRound] = useState<KnockoutFilterRound>('all');
  const [qfMatches, setQfMatches] = useState<BracketMatchup[]>([]);
  const [sfMatches, setSfMatches] = useState<BracketMatchup[]>([]);
  const [finalMatch, setFinalMatch] = useState<BracketMatchup | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadBracket = async () => {
      try {
        const data = await fetchDatabase();
        if (isMounted && data) {
          if (data.qfMatches && data.qfMatches.length > 0) setQfMatches(data.qfMatches);
          if (data.sfMatches && data.sfMatches.length > 0) setSfMatches(data.sfMatches);
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
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Knockout Header Banner */}
      <KnockoutBanner />

      {/* 2. Round Filter Tabs */}
      <KnockoutFilterTabs
        selectedRound={selectedRound}
        onSelectRound={setSelectedRound}
      />

      {/* 3. Visual Bracket Tree */}
      <BracketTree
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
