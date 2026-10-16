import React from 'react';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import { Match } from '../../../../types';
import { TeamLogo } from '../../../../components/TeamLogo';

export interface MatchCardProps {
  match: Match;
  onSelectMatch?: (match: Match) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onSelectMatch,
}) => {
  const isLive = match.status === 'LIVE';
  const isFT = match.status === 'FT';
  const matchNum = match.matchNumber || 1;
  const groupLabel = match.group
    ? match.group.startsWith('กลุ่ม') || match.group.startsWith('สาย')
      ? match.group
      : `กลุ่ม ${match.group}`
    : 'รอบแบ่งกลุ่ม';
  const venueLabel = match.venue || 'สนามหลัก';

  const t1Name = match.team1?.name || 'ทีมเหย้า';
  const t2Name = match.team2?.name || 'ทีมเยือน';

  return (
    <div
      onClick={() => onSelectMatch?.(match)}
      className={`rounded-2xl bg-white border border-l-4 transition-all hover:shadow-md cursor-pointer overflow-hidden ${
        isLive
          ? 'border-emerald-500 border-l-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
          : 'border-[#efeded] border-l-[#fde68a] hover:border-l-[#f59e0b]'
      }`}
    >
      {/* Top Header Strip */}
      <div className="bg-[#faf9f8] px-4 sm:px-5 py-2.5 border-b border-[#efeded] flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-display font-bold text-xs text-[#854d0e] bg-[#fef9c3] px-3 py-1 rounded-xl border border-[#fde68a] shrink-0">
            คู่ที่ {matchNum}
          </span>
          <span className="font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-xl text-xs truncate border border-gray-200">
            {groupLabel}
          </span>
          {match.dateStr && (
            <span className="text-[#6b7280] text-[11px] flex items-center gap-1.5 ml-1">
              <Calendar className="w-3.5 h-3.5 text-[#786607]" /> {match.dateStr}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-[#4b4737] font-semibold">
            <MapPin className="w-3.5 h-3.5 text-[#786607] shrink-0" />
            <span className="truncate max-w-[120px] sm:max-w-none">{venueLabel}</span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-0.5 text-xs font-bold text-[#786607] hover:underline pl-2.5 border-l border-[#efeded]">
            ข้อมูลแมตช์ <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Main Match Arena: Centered with max-w-2xl so teams group near the center */}
      <div className="py-5 sm:py-6 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
          {/* Home Team */}
          <div className="flex items-center justify-end gap-3 sm:gap-4 flex-1 min-w-0">
            <span className="font-display text-sm sm:text-base text-right truncate font-bold text-gray-900 tracking-tight">
              {t1Name}
            </span>
            <TeamLogo
              id={match.team1?.id}
              logo={match.team1?.logo}
              name={t1Name}
              className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-gray-50 ring-1 ring-black/5"
            />
          </div>

          {/* Center Centerpiece: Time or Score Badge */}
          <div className="w-24 sm:w-28 shrink-0 text-center px-1">
            {isLive ? (
              <div className="bg-emerald-50 border border-emerald-300/60 rounded-2xl py-1.5 px-3">
                <div className="font-display font-black text-lg sm:text-2xl text-emerald-700 leading-none flex items-center justify-center gap-1.5">
                  <span>{match.score1}</span>
                  <span className="text-xs text-emerald-500">-</span>
                  <span>{match.score2}</span>
                </div>
                <span className="inline-block mt-1 text-[10px] sm:text-[11px] font-bold text-emerald-600 animate-pulse">
                  กำลังแข่งขัน
                </span>
              </div>
            ) : isFT ? (
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl py-1.5 px-3">
                <div className="font-display font-black text-base sm:text-xl leading-none flex items-center justify-center gap-1">
                  <span>{match.score1}</span>
                  <span className="text-xs text-gray-400">-</span>
                  <span>{match.score2}</span>
                </div>
                <span className="inline-block mt-1 text-[10px] sm:text-[11px] font-bold text-gray-500">
                  จบเกมส์
                </span>
              </div>
            ) : (
              <div className="bg-[#f1f5f9] border border-[#e2e8f0]/80 rounded-2xl py-2 px-4 sm:px-5 flex items-center justify-center shadow-2xs">
                <div className="font-display font-bold text-xs sm:text-sm text-gray-800 leading-none tracking-wide">
                  {match.timeStr ? `${match.timeStr} น.` : 'VS'}
                </div>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-start gap-3 sm:gap-4 flex-1 min-w-0">
            <TeamLogo
              id={match.team2?.id}
              logo={match.team2?.logo}
              name={t2Name}
              className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-gray-50 ring-1 ring-black/5"
            />
            <span className="font-display text-sm sm:text-base text-left truncate font-bold text-gray-900 tracking-tight">
              {t2Name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
