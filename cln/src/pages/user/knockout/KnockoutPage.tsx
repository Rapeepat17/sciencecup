import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import {
  KnockoutBanner,
  KnockoutFilterTabs,
  KnockoutFilterRound,
  BracketTree,
} from './components';
import { fetchDatabase } from '../../../services/dbService';
import { BracketMatchup, Match } from '../../../types';

export interface KnockoutPageProps {
  tournamentId?: string;
  tournamentName?: string;
  startingRound?: 'qf' | 'sf' | 'final';
  qfMatches?: BracketMatchup[];
  sfMatches?: BracketMatchup[];
  finalMatch?: BracketMatchup | null;
  tournamentStatus?: string;
  isDraft?: boolean;
  onMatchClick?: (matchId: string) => void;
  matches?: Match[];
}

export const KnockoutPage: React.FC<KnockoutPageProps> = ({
  tournamentId,
  tournamentName,
  startingRound = 'sf',
  qfMatches: initialQf,
  sfMatches: initialSf,
  finalMatch: initialFinal,
  tournamentStatus: propTournamentStatus,
  isDraft: propIsDraft,
  onMatchClick,
  matches,
}) => {
  const [selectedRound, setSelectedRound] = useState<KnockoutFilterRound>('all');
  const [qfMatches, setQfMatches] = useState<BracketMatchup[]>(initialQf ?? []);
  const [sfMatches, setSfMatches] = useState<BracketMatchup[]>(initialSf ?? []);
  const [finalMatch, setFinalMatch] = useState<BracketMatchup | null>(initialFinal ?? null);
  const [status, setStatus] = useState<string>(propTournamentStatus || 'ACTIVE');

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
          if (data.status) setStatus(String(data.status).toUpperCase());
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

  const effectiveIsDraft =
    propIsDraft !== undefined ? propIsDraft : status === 'DRAFT';

  if (effectiveIsDraft) {
    return (
      <div className="max-w-4xl mx-auto w-full pt-4">
        <div className="bg-white rounded-3xl border border-[#efeded] p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#f5f3f3] text-[#7d7765] flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-[#786607]" />
          </div>
          <h3 className="font-display text-xl font-bold text-[#1b1c1c]">ยังไม่มีข้อมูลสายการแข่งขัน</h3>
          <p className="text-xs sm:text-sm text-[#7d7765] mt-2 max-w-md mx-auto">
            ขณะนี้ยังไม่มีข้อมูลสายการแข่งขันรอบน็อคเอาท์ กรุณารอฝ่ายจัดการแข่งขันอัปเดตสายแข่งขันอีกครั้ง
          </p>
        </div>
      </div>
    );
  }

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
        matches={matches}
      />
    </div>
  );
};

export default KnockoutPage;
