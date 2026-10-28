import React from 'react';
import { Trophy } from 'lucide-react';
import {
  BracketSlotMatchup,
  BracketMatchupCard,
} from './BracketMatchupCard';
import { BracketTabRound } from './BracketRoundTabs';

export interface BracketDataShape {
  qfMatches: BracketSlotMatchup[];
  sfMatches: BracketSlotMatchup[];
  thirdPlaceMatch: BracketSlotMatchup;
  finalMatch: BracketSlotMatchup;
}

interface AdminBracketTreeProps {
  tournamentName?: string;
  startingRound: 'qf' | 'sf' | 'final';
  selectedTab: BracketTabRound;
  bracketData: BracketDataShape;
  onOpenAssignModal: (
    stage: 'qf' | 'sf' | 'third_place' | 'final',
    matchIndex: number,
    teamSlot: 1 | 2
  ) => void;
}

export const AdminBracketTree: React.FC<AdminBracketTreeProps> = ({
  tournamentName = 'Science Cup',
  startingRound,
  selectedTab,
  bracketData,
  onOpenAssignModal,
}) => {
  const canEditQF = startingRound === 'qf';
  const canEditSF = startingRound === 'sf';
  const canEditFinal = startingRound === 'final';

  // Single-round filtered view
  if (selectedTab !== 'all') {
    if (selectedTab === 'qf') {
      return (
        <div className="w-full bg-white rounded-2xl border border-[#efeded] p-4 sm:p-8 shadow-2xs">
          <div className="text-center pb-3 mb-5 border-b border-[#f5f3f3]">
            <h3 className="text-sm font-bold text-[#1b1c1c]">รอบ 8 ทีม (QF)</h3>
            <p className="text-xs text-[#7d7765]">4 แมตช์</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bracketData.qfMatches.slice(0, 4).map((m, idx) => (
              <BracketMatchupCard
                key={m.id}
                matchup={m}
                onSelectSlot={
                  canEditQF ? (slot) => onOpenAssignModal('qf', idx, slot) : undefined
                }
              />
            ))}
          </div>
        </div>
      );
    }

    if (selectedTab === 'sf') {
      return (
        <div className="w-full bg-white rounded-2xl border border-[#efeded] p-4 sm:p-8 shadow-2xs">
          <div className="text-center pb-3 mb-5 border-b border-[#f5f3f3]">
            <h3 className="text-sm font-bold text-[#1b1c1c]">
              รอบรองชนะเลิศ (SF)
            </h3>
            <p className="text-xs text-[#7d7765]">2 แมตช์</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bracketData.sfMatches.slice(0, 2).map((m, idx) => (
              <BracketMatchupCard
                key={m.id}
                matchup={m}
                onSelectSlot={
                  canEditSF ? (slot) => onOpenAssignModal('sf', idx, slot) : undefined
                }
              />
            ))}
          </div>
        </div>
      );
    }

    if (selectedTab === 'third_place') {
      return (
        <div className="w-full bg-white rounded-2xl border border-[#efeded] p-4 sm:p-8 shadow-2xs">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-center pb-2 border-b border-[#f5f3f3]">
              <h3 className="text-sm font-bold text-[#1b1c1c]">นัดชิงอันดับ 3</h3>
              <p className="text-xs text-[#7d7765]">1 แมตช์</p>
            </div>
            <BracketMatchupCard
              matchup={bracketData.thirdPlaceMatch}
              isThirdPlace
            />
          </div>
        </div>
      );
    }

    return (
      <div className="w-full bg-white rounded-2xl border border-[#efeded] p-4 sm:p-8 shadow-2xs">
        <div className="max-w-md mx-auto flex flex-col justify-center gap-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#fef9c3] text-[#854d0e] border border-[#fef08a] shadow-2xs">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              ชิงชนะเลิศ (GRAND FINAL)
            </span>
            <p className="text-xs text-[#7d7765] mt-1">
              ชิงถ้วย {tournamentName}
            </p>
          </div>

          <div className="relative pt-4">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full bg-[#fde047] border-2 border-white shadow-md flex items-center justify-center text-[#786607]">
              <Trophy className="w-5 h-5 fill-amber-500 text-amber-600" />
            </div>

            <BracketMatchupCard
              matchup={bracketData.finalMatch}
              isFinal
              onSelectSlot={
                canEditFinal
                  ? (slot) => onOpenAssignModal('final', 0, slot)
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    );
  }

  // Full Visual Bracket Tree ('all')
  const showQF = startingRound === 'qf';
  const showSF = startingRound === 'qf' || startingRound === 'sf';
  const gridColsClass =
    startingRound === 'qf'
      ? 'grid-cols-3 min-w-[850px]'
      : startingRound === 'sf'
      ? 'grid-cols-2 min-w-[600px]'
      : 'grid-cols-1 max-w-md mx-auto';

  return (
    <div className="w-full bg-white rounded-2xl border border-[#efeded] p-4 sm:p-8 shadow-2xs overflow-x-auto">
      <div className={`${gridColsClass} grid gap-8 items-center relative`}>
        {/* =========================================
            COLUMN 1: รอบ 8 ทีม (QF)
           ========================================= */}
        {showQF && (
          <div className="flex flex-col gap-5">
            <div className="text-center pb-2 border-b border-[#f5f3f3]">
              <h3 className="text-sm font-bold text-[#1b1c1c]">
                รอบ 8 ทีม (QF)
              </h3>
              <p className="text-xs text-[#7d7765]">4 แมตช์</p>
            </div>

            <div className="space-y-4">
              {bracketData.qfMatches.slice(0, 4).map((m, idx) => (
                <BracketMatchupCard
                  key={m.id}
                  matchup={m}
                  onSelectSlot={
                    canEditQF ? (slot) => onOpenAssignModal('qf', idx, slot) : undefined
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* =========================================
            COLUMN 2: รอบรองชนะเลิศ (SF)
           ========================================= */}
        {showSF && (
          <div className="flex flex-col justify-around h-full py-12 gap-8">
            <div className="text-center pb-2 border-b border-[#f5f3f3]">
              <h3 className="text-sm font-bold text-[#1b1c1c]">
                รอบรองชนะเลิศ (SF)
              </h3>
              <p className="text-xs text-[#7d7765]">2 แมตช์</p>
            </div>

            <div className="space-y-16 flex flex-col justify-around my-auto">
              {bracketData.sfMatches.slice(0, 2).map((m, idx) => (
                <BracketMatchupCard
                  key={m.id}
                  matchup={m}
                  onSelectSlot={
                    canEditSF ? (slot) => onOpenAssignModal('sf', idx, slot) : undefined
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* =========================================
            COLUMN 3: ชิงชนะเลิศ (GRAND FINAL)
           ========================================= */}
        <div className="flex flex-col justify-center h-full gap-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#fef9c3] text-[#854d0e] border border-[#fef08a] shadow-2xs">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              ชิงชนะเลิศ (GRAND FINAL)
            </span>
            <p className="text-xs text-[#7d7765] mt-1">
              ชิงถ้วย {tournamentName}
            </p>
          </div>

          {/* Floating Trophy Icon Badge */}
          <div className="relative pt-4">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full bg-[#fde047] border-2 border-white shadow-md flex items-center justify-center text-[#786607]">
              <Trophy className="w-5 h-5 fill-amber-500 text-amber-600" />
            </div>

            <BracketMatchupCard
              matchup={bracketData.finalMatch}
              isFinal
              onSelectSlot={
                canEditFinal
                  ? (slot) => onOpenAssignModal('final', 0, slot)
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
