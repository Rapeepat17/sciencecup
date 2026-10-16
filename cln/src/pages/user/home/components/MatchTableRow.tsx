import React from 'react';
import { Clock, MapPin, ChevronRight } from 'lucide-react';
import { Match } from '../../../../types';
import { TeamLogo } from '../../../../components/TeamLogo';

export interface MatchTableRowProps {
  match: Match;
  onSelectMatch?: (match: Match) => void;
}

export const MatchTableRow: React.FC<MatchTableRowProps> = ({
  match,
  onSelectMatch,
}) => {
  const matchNum = match.matchNumber || 1;
  const groupLabel = match.group ? `กลุ่ม ${match.group}` : 'รอบแบ่งกลุ่ม';
  const venueLabel = match.venue || 'สนามหลัก';
  const isFinished = match.status === 'FT';
  const isLive = match.status === 'LIVE';

  return (
    <div
      onClick={() => onSelectMatch?.(match)}
      className="w-full bg-white rounded-2xl border border-[#efeded] shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row items-stretch cursor-pointer group relative"
    >
      {/* Left Yellow Accent Border */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ffe680] rounded-l-2xl" />

      {/* 1. Left Section: Match Number & Time/Group */}
      <div className="pl-5 pr-4 py-3.5 sm:py-4 flex sm:flex-col justify-between sm:justify-center items-start sm:items-start gap-1 sm:min-w-[130px] border-b sm:border-b-0 sm:border-r border-[#f5f3f3]">
        <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]">
          คู่ที่ {matchNum}
        </span>

        <div className="flex items-center gap-1.5 text-xs text-[#7d7765] mt-0.5">
          <Clock className="w-3.5 h-3.5 text-[#7d7765]" />
          <span className="truncate">{groupLabel}</span>
        </div>
      </div>

      {/* 2. Middle Section: Two Team Rows with Scores */}
      <div className="flex-1 px-4 sm:px-6 py-3 flex flex-col justify-center gap-2">
        {/* Team 1 (Home) */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <TeamLogo
              id={match.team1?.id}
              logo={match.team1?.logo}
              name={match.team1?.name}
              className="w-6 h-6"
            />
            <span className="text-sm font-semibold text-[#1b1c1c] truncate">
              {match.team1?.name || 'ทีมเหย้า'}
            </span>
          </div>

          <span className="text-sm sm:text-base font-bold text-[#1b1c1c] w-6 text-right">
            {isFinished || isLive ? match.score1 : '-'}
          </span>
        </div>

        {/* Team 2 (Away) */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <TeamLogo
              id={match.team2?.id}
              logo={match.team2?.logo}
              name={match.team2?.name}
              className="w-6 h-6"
            />
            <span className="text-sm font-semibold text-[#1b1c1c] truncate">
              {match.team2?.name || 'ทีมเยือน'}
            </span>
          </div>

          <span className="text-sm sm:text-base font-bold text-[#1b1c1c] w-6 text-right">
            {isFinished || isLive ? match.score2 : '-'}
          </span>
        </div>
      </div>

      {/* 3. Right Section: Venue & Detail Link */}
      <div className="px-4 py-3 sm:py-4 flex sm:flex-col justify-between sm:justify-center items-end sm:items-end gap-1.5 border-t sm:border-t-0 sm:border-l border-[#f5f3f3] sm:min-w-[130px] bg-[#faf9f8]/60 sm:bg-transparent">
        <div className="flex items-center gap-1.5 text-xs text-[#7d7765]">
          <MapPin className="w-3.5 h-3.5 text-[#854d0e]" />
          <span>{venueLabel}</span>
        </div>

        <div className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#854d0e] group-hover:text-[#6f5d00] transition-colors">
          <span>ข้อมูล</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  );
};
