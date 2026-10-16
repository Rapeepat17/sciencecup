import React from 'react';
import { Clock, Calendar, MapPin, Trophy } from 'lucide-react';
import { BracketMatchup } from '../../../../types';
import { TeamLogo } from '../../../../components/TeamLogo';
import { KnockoutFilterRound } from './KnockoutFilterTabs';

export interface BracketTreeProps {
  qfMatches: BracketMatchup[];
  sfMatches: BracketMatchup[];
  finalMatch?: BracketMatchup | null;
  selectedRound?: KnockoutFilterRound;
  onMatchClick?: (matchId: string) => void;
}

export const BracketTree: React.FC<BracketTreeProps> = ({
  qfMatches,
  sfMatches,
  finalMatch,
  selectedRound = 'all',
  onMatchClick,
}) => {
  // Fallback defaults matching screenshot
  const defaultQF: BracketMatchup[] = [
    {
      id: 'qf1',
      roundName: 'รอบ 8 ทีม (คู่ที่ 1)',
      date: '31 ต.ค. 2026',
      time: '13:00 น.',
      venue: 'สนามหลัก',
      team1: { name: 'คิดถึงวิทยา', score: null },
      team2: { name: 'อันดับ 2 สาย B', score: null },
    },
    {
      id: 'qf2',
      roundName: 'รอบ 8 ทีม (คู่ที่ 2)',
      date: '31 ต.ค. 2026',
      time: '15:00 น.',
      venue: 'สนามหลัก',
      team1: { name: 'อันดับ 1 สาย C', score: null },
      team2: { name: '3 ดีที่สุดอันดับ1', score: null },
    },
    {
      id: 'qf3',
      roundName: 'รอบ 8 ทีม (คู่ที่ 3)',
      date: '31 ต.ค. 2026',
      time: '17:00 น.',
      venue: 'สนามหลัก',
      team1: { name: 'BABY SCI', score: null },
      team2: { name: 'อันดับ 2 สาย C', score: null },
    },
    {
      id: 'qf4',
      roundName: 'รอบ 8 ทีม (คู่ที่ 4)',
      date: '31 ต.ค. 2026',
      time: '19:00 น.',
      venue: 'สนามหลัก',
      team1: { name: 'อันดับ 1 สาย B', score: null },
      team2: { name: '3 ดีที่สุดอันดับ2', score: null },
    },
  ];

  const defaultSF: BracketMatchup[] = [
    {
      id: 'sf1',
      roundName: 'รอบรองชนะเลิศ 1',
      date: '1 พ.ย. 2026',
      time: '15:00 น.',
      venue: 'สนามหลัก',
      team1: { name: 'ทีมเหย้า', score: null },
      team2: { name: 'ทีมเยือน', score: null },
    },
    {
      id: 'sf2',
      roundName: 'รอบรองชนะเลิศ 2',
      date: '1 พ.ย. 2026',
      time: '18:00 น.',
      venue: 'สนามหลัก',
      team1: { name: 'ทีมเหย้า', score: null },
      team2: { name: 'ทีมเยือน', score: null },
    },
  ];

  const defaultFinal: BracketMatchup = {
    id: 'final',
    roundName: 'นัดชิงชนะเลิศ',
    date: '2 พ.ย. 2026',
    time: '18:00 น.',
    venue: 'สนามหลัก',
    team1: { name: 'ทีมเหย้า', score: null },
    team2: { name: 'ทีมเยือน', score: null },
  };

  const qfList = qfMatches && qfMatches.length > 0 ? qfMatches : defaultQF;
  const sfList = sfMatches && sfMatches.length > 0 ? sfMatches : defaultSF;
  const final = finalMatch || defaultFinal;

  // Render individual matchup card
  const renderMatchCard = (m: BracketMatchup, isFinal = false) => {
    return (
      <div
        key={m.id}
        onClick={() => onMatchClick?.(m.id)}
        className={`w-full rounded-2xl transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md ${
          isFinal
            ? 'bg-[#fffdf5] border-2 border-[#fde047] p-4 relative'
            : 'bg-white border border-[#efeded] p-3 sm:p-3.5'
        }`}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between text-xs text-[#7d7765] pb-2 border-b border-[#f5f3f3] mb-2.5">
          <div className="flex items-center gap-1.5 font-bold text-[#1b1c1c]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="truncate">{m.roundName}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#7d7765]">
            {isFinal && m.date && (
              <>
                <Calendar className="w-3 h-3 text-amber-600" />
                <span>{m.date}</span>
                <span>•</span>
              </>
            )}
            <Clock className="w-3 h-3 text-[#7d7765]" />
            <span>{m.time}</span>
          </div>
        </div>

        {/* Team 1 Row */}
        <div className="flex items-center justify-between py-1.5 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <TeamLogo
              logo={m.team1?.logo}
              name={m.team1?.name}
              className="w-5 h-5 sm:w-6 sm:h-6"
            />
            <span className="text-xs sm:text-sm font-semibold text-[#1b1c1c] truncate">
              {m.team1?.name || '-'}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-[#1b1c1c] px-2 py-0.5 rounded bg-[#f5f3f3]">
            {m.team1?.score !== null && m.team1?.score !== undefined ? m.team1.score : '-'}
          </span>
        </div>

        {/* Team 2 Row */}
        <div className="flex items-center justify-between py-1.5 gap-2 border-t border-[#f5f3f3]/60 mt-1">
          <div className="flex items-center gap-2 min-w-0">
            <TeamLogo
              logo={m.team2?.logo}
              name={m.team2?.name}
              className="w-5 h-5 sm:w-6 sm:h-6"
            />
            <span className="text-xs sm:text-sm font-semibold text-[#1b1c1c] truncate">
              {m.team2?.name || '-'}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-[#1b1c1c] px-2 py-0.5 rounded bg-[#f5f3f3]">
            {m.team2?.score !== null && m.team2?.score !== undefined ? m.team2.score : '-'}
          </span>
        </div>

        {/* Final Venue Footer */}
        {isFinal && (
          <div className="flex items-center justify-center gap-1.5 pt-2.5 mt-2 border-t border-[#fef08a] text-xs font-semibold text-[#854d0e]">
            <MapPin className="w-3.5 h-3.5 text-[#854d0e]" />
            <span>{m.venue || 'สนามหลัก'}</span>
          </div>
        )}
      </div>
    );
  };

  const showQF = selectedRound === 'all' || selectedRound === 'qf';
  const showSF = selectedRound === 'all' || selectedRound === 'sf';
  const showFinal = selectedRound === 'all' || selectedRound === 'final';

  return (
    <div className="w-full bg-white rounded-2xl border border-[#efeded] p-4 sm:p-8 shadow-2xs overflow-x-auto">
      <div className="min-w-[850px] grid grid-cols-3 gap-8 items-center relative">
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
              {qfList.slice(0, 4).map((m) => renderMatchCard(m))}
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
              {sfList.slice(0, 2).map((m) => renderMatchCard(m))}
            </div>
          </div>
        )}

        {/* =========================================
            COLUMN 3: ชิงชนะเลิศ (GRAND FINAL)
           ========================================= */}
        {showFinal && (
          <div className="flex flex-col justify-center h-full gap-4">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#fef9c3] text-[#854d0e] border border-[#fef08a] shadow-2xs">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                ชิงชนะเลิศ (GRAND FINAL)
              </span>
              <p className="text-xs text-[#7d7765] mt-1">ชิงถ้วย Science Cup</p>
            </div>

            {/* Floating Trophy Icon Badge */}
            <div className="relative pt-4">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full bg-[#fde047] border-2 border-white shadow-md flex items-center justify-center text-[#786607]">
                <Trophy className="w-5 h-5 fill-amber-500 text-amber-600" />
              </div>

              {renderMatchCard(final, true)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
