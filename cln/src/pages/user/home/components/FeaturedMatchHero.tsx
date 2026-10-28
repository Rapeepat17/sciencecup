import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { Match } from '../../../../types';
import { TeamLogo } from '../../../../components/TeamLogo';

export interface FeaturedMatchHeroProps {
  match?: Match | null;
  onMatchClick?: (match: Match) => void;
}

export const FeaturedMatchHero: React.FC<FeaturedMatchHeroProps> = ({
  match,
  onMatchClick,
}) => {
  if (!match) return null;

  const isLive = match.status === 'LIVE';
  const isKnockout =
    match.group === 'Knockout' ||
    (match.round && !match.round.includes('รอบแบ่งกลุ่ม'));

  const groupLabel = isKnockout
    ? match.round || 'รอบน็อคเอาท์'
    : match.group
    ? match.group.startsWith('กลุ่ม') || match.group.startsWith('สาย')
      ? match.group
      : `กลุ่ม ${match.group}`
    : 'รอบแบ่งกลุ่ม';

  const t1Name = match.team1?.name || 'ทีมเหย้า';
  const t2Name = match.team2?.name || 'ทีมเยือน';

  return (
    <div
      onClick={() => onMatchClick?.(match)}
      className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#0a101d] via-[#0d1627] to-[#080d18] border border-white/10 shadow-2xl p-4 sm:p-7 group cursor-pointer select-none"
    >
      {/* Background Vector Grid & Pitch Arcs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 border border-white/[0.04] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 sm:w-36 h-28 sm:h-36 border border-white/[0.03] rounded-full" />
      </div>

      {/* Banner Top Strip */}
      <div className="relative z-10 mb-4 sm:mb-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            {isLive ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#007746] text-white text-xs font-bold tracking-wide shadow-[0_0_12px_rgba(0,119,70,0.4)] border border-[#00995a]/40">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                กำลังแข่งขัน
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 rounded-full bg-white/10 text-amber-300 text-[11px] sm:text-xs font-medium tracking-wide border border-white/10 backdrop-blur-xs shrink-0">
                <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>
                  คู่ที่กำลังจะแข่ง {match.timeStr ? `(เวลา ${match.timeStr} น.)` : ''}
                </span>
              </span>
            )}

            <span className="text-xs text-zinc-400 font-medium">
              {groupLabel}
            </span>
          </div>

          {match.venue && (
            <span className="text-xs text-amber-400 font-medium flex items-center gap-1.5 shrink-0 py-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{match.venue}</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Match Arena: Team 1 vs Team 2 */}
      <div className="relative z-10 flex items-center justify-between gap-4 max-w-2xl mx-auto py-2">
        {/* Team 1 (Home) */}
        <div className="flex-1 flex flex-col items-center text-center gap-2 min-w-0">
          <div className="p-1 rounded-full bg-white/10 ring-2 ring-white/20 shadow-xl backdrop-blur-xs transition-transform duration-300 group-hover:scale-105">
            <TeamLogo
              id={match.team1?.id}
              logo={match.team1?.logo}
              name={t1Name}
              className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full object-cover bg-white"
            />
          </div>
          <span className="font-display font-black text-sm sm:text-base text-white tracking-wide text-center truncate max-w-full drop-shadow-sm uppercase">
            {t1Name}
          </span>
        </div>

        {/* Live / Upcoming Score Display */}
        <div className="flex flex-col items-center justify-center px-2 sm:px-6 shrink-0">
          <div className="flex items-center gap-2 font-display font-black text-2xl sm:text-4xl text-amber-300 tracking-wide drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)]">
            <span>{isLive || match.status === 'FT' ? match.score1 : 0}</span>
            <span className="text-white/40 text-xl sm:text-2xl font-light select-none">:</span>
            <span>{isLive || match.status === 'FT' ? match.score2 : 0}</span>
          </div>
          <div className="mt-2 text-center">
            <span className="px-3.5 py-0.5 rounded-full bg-[#004d2e] text-[#22c55e] border border-[#00663d] text-xs font-bold font-display shadow-xs">
              คู่ที่ {match.matchNumber || 1}
            </span>
          </div>
        </div>

        {/* Team 2 (Away) */}
        <div className="flex-1 flex flex-col items-center text-center gap-2 min-w-0">
          <div className="p-1 rounded-full bg-white/10 ring-2 ring-white/20 shadow-xl backdrop-blur-xs transition-transform duration-300 group-hover:scale-105">
            <TeamLogo
              id={match.team2?.id}
              logo={match.team2?.logo}
              name={t2Name}
              className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full object-cover bg-white"
            />
          </div>
          <span className="font-display font-black text-sm sm:text-base text-white tracking-wide text-center truncate max-w-full drop-shadow-sm uppercase">
            {t2Name}
          </span>
        </div>
      </div>
    </div>
  );
};
