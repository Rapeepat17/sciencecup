import React from 'react';
import { Clock, Calendar, MapPin } from 'lucide-react';
import { TeamLogo } from '../../../../components/TeamLogo';

export interface BracketSlotTeam {
  id?: string | null;
  name: string;
  seedCode?: string | null;
  shortName?: string;
  logo?: string;
  score: number | null;
  penaltyScore?: number | null;
}

export interface BracketSlotMatchup {
  id: string;
  matchId?: string | null;
  matchNumber?: number;
  roundName: string;
  slotLabel?: string;
  seed1Label?: string;
  seed2Label?: string;
  date: string;
  time: string;
  venue: string;
  team1: BracketSlotTeam;
  team2: BracketSlotTeam;
  winner?: 1 | 2 | null;
}

interface BracketMatchupCardProps {
  matchup: BracketSlotMatchup;
  isFinal?: boolean;
  isThirdPlace?: boolean;
  onSelectSlot?: (teamSlot: 1 | 2) => void;
}

export const BracketMatchupCard: React.FC<BracketMatchupCardProps> = ({
  matchup,
  isFinal = false,
  onSelectSlot,
}) => {
  const isEditable = Boolean(onSelectSlot);

  const renderTeamRow = (slotNum: 1 | 2) => {
    const team = slotNum === 1 ? matchup.team1 : matchup.team2;
    const isAssigned = Boolean(team?.name && team.name !== '-');
    const displayScore =
      team?.score !== null && team?.score !== undefined ? team.score : '-';

    return (
      <div
        onClick={() => {
          if (onSelectSlot) onSelectSlot(slotNum);
        }}
        title={
          isEditable
            ? `คลิกเพื่อเลือกอันดับสาย (ช่องที่ ${slotNum})`
            : undefined
        }
        className={`flex items-center justify-between py-1.5 px-1.5 -mx-1.5 rounded-xl gap-2 transition-colors ${
          slotNum === 2 ? 'border-t border-[#f5f3f3]/60 mt-1 pt-2' : ''
        } ${isEditable ? 'cursor-pointer hover:bg-[#faf8f0]' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <TeamLogo
            id={team?.id || undefined}
            logo={team?.logo}
            name={isAssigned ? team?.name : undefined}
            className="w-5 h-5 sm:w-6 sm:h-6"
          />
          <span className="text-xs sm:text-sm font-semibold text-[#1b1c1c] truncate">
            {isAssigned ? team.name : '-'}
          </span>
          {team?.seedCode &&
            isAssigned &&
            team.name.toUpperCase() !== team.seedCode.toUpperCase() && (
              <span className="text-[10px] font-bold text-[#786607] bg-[#fef9c3] px-1.5 py-0.5 rounded shrink-0">
                {team.seedCode}
              </span>
            )}
        </div>

        <span className="text-xs sm:text-sm font-bold text-[#1b1c1c] px-2 py-0.5 rounded bg-[#f5f3f3] shrink-0">
          {displayScore}
        </span>
      </div>
    );
  };

  return (
    <div
      className={`w-full rounded-2xl transition-all duration-200 shadow-2xs hover:shadow-md ${
        isFinal
          ? 'bg-[#fffdf5] border-2 border-[#fde047] p-4 relative'
          : 'bg-white border border-[#efeded] p-3 sm:p-3.5'
      }`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between text-xs text-[#7d7765] pb-2 border-b border-[#f5f3f3] mb-2.5">
        <div className="flex items-center gap-1.5 font-bold text-[#1b1c1c] min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span className="truncate">{matchup.roundName}</span>
          {matchup.matchNumber !== undefined && (
            <span className="text-[11px] font-medium text-[#7d7765] shrink-0">
              คู่ {matchup.matchNumber}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-[#7d7765] shrink-0">
          {matchup.date &&
            matchup.date !== 'TBD' &&
            matchup.date !== 'ยังไม่ระบุวันที่แข่งขัน' && (
              <>
                <Calendar className="w-3 h-3 text-amber-600" />
                <span>{matchup.date}</span>
                <span>•</span>
              </>
            )}
          <Clock className="w-3 h-3 text-[#7d7765]" />
          <span>
            {matchup.time && matchup.time !== 'TBD' ? matchup.time : 'รอระบุเวลา'}
          </span>
        </div>
      </div>

      {/* Team 1 & Team 2 Rows */}
      {renderTeamRow(1)}
      {renderTeamRow(2)}

      {/* Venue Footer */}
      {matchup.venue && matchup.venue !== 'TBD' && (
        <div
          className={`flex items-center justify-center gap-1.5 pt-2 mt-2 border-t text-[11px] font-semibold ${
            isFinal
              ? 'border-[#fef08a] text-xs text-[#854d0e]'
              : 'border-[#f5f3f3] text-[#7d7765]'
          }`}
        >
          <MapPin
            className={`${
              isFinal ? 'w-3.5 h-3.5 text-[#854d0e]' : 'w-3 h-3 text-[#7d7765]'
            }`}
          />
          <span>{matchup.venue}</span>
        </div>
      )}
    </div>
  );
};
