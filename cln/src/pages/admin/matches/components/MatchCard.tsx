import React from 'react';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Clock,
  MapPin,
  Calendar,
  Trash2,
} from 'lucide-react';
import { Match } from '../../../../types';

interface MatchCardProps {
  match: Match;
  displayOrder: number;
  canDrag: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onOpenTimeVenueModal: () => void;
  onDelete: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  displayOrder,
  canDrag,
  canMoveUp,
  canMoveDown,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onMoveUp,
  onMoveDown,
  onOpenTimeVenueModal,
  onDelete,
}) => {
  const venueLabel = match.venue || 'ยังไม่ระบุสนาม';
  const groupOrRoundLabel =
    match.group && match.group !== 'Knockout'
      ? match.group.startsWith('กลุ่ม') || match.group.startsWith('Group')
        ? match.group
        : `กลุ่ม ${match.group}`
      : match.round || 'รอบทั่วไป';

  const hasTimeVenue = Boolean(
    match.dateStr &&
      match.dateStr !== 'TBD' &&
      match.timeStr &&
      match.timeStr !== 'TBD'
  );

  return (
    <div
      draggable={canDrag}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      className={`bg-white border rounded-[24px] p-4 sm:p-5 transition-all duration-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 relative group ${
        isDragging
          ? 'opacity-40 scale-[0.99] border-[#ffe680] bg-yellow-50/30 shadow-inner'
          : isDragOver
          ? 'border-2 border-[#786607] bg-yellow-50/40 shadow-md scale-[1.005]'
          : 'border-[#efeded] shadow-xs hover:shadow-md hover:border-slate-300'
      }`}
    >
      {/* Left Meta: Drag handle + Order + Group/Round + Date/Venue */}
      <div className="flex items-center justify-between lg:justify-start gap-3 lg:w-[270px] shrink-0 border-b lg:border-b-0 border-slate-100 pb-3 lg:pb-0">
        <div className="flex items-center gap-2">
          {canDrag && (
            <div className="flex items-center gap-0.5 text-slate-400">
              <div
                className="cursor-grab active:cursor-grabbing p-1 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="ลากเพื่อสลับลำดับคู่แข่งขัน"
              >
                <GripVertical className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <button
                  type="button"
                  disabled={!canMoveUp}
                  onClick={onMoveUp}
                  className="p-0.5 hover:text-slate-700 disabled:opacity-25 transition-colors cursor-pointer"
                  title="เลื่อนขึ้น"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  disabled={!canMoveDown}
                  onClick={onMoveDown}
                  className="p-0.5 hover:text-slate-700 disabled:opacity-25 transition-colors cursor-pointer"
                  title="เลื่อนลง"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-[#1b1c1c] text-[#ffe680] text-[11px] font-black rounded-lg tracking-wide">
                คู่ที่ #{match.matchNumber || displayOrder}
              </span>
              <span className="px-2.5 py-0.5 bg-[#f5f3f3] text-[#4b4737] text-[11px] font-extrabold rounded-lg">
                {groupOrRoundLabel}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-[#7d7765] font-semibold">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {match.dateStr && match.dateStr !== 'TBD' ? match.dateStr : 'ยังไม่ระบุวัน'}
              </span>
              <span className="inline-flex items-center gap-1 truncate max-w-[125px]">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{venueLabel}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Team 1 vs Time/VS vs Team 2 */}
      <div className="flex-1 flex items-center justify-between gap-2 sm:gap-4 px-2">
        {/* Team 1 */}
        <div className="flex-1 flex items-center justify-end gap-2.5 text-right min-w-0">
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-extrabold text-[#1b1c1c] truncate">
              {match.team1?.name || 'รอระบุทีมเหย้า'}
            </p>
            <p className="text-[11px] font-semibold text-[#7d7765]">ทีมเหย้า (Home)</p>
          </div>
          {match.team1?.logo ? (
            <img
              src={match.team1.logo}
              alt={match.team1.name}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border border-slate-200 bg-slate-50 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">
              {(match.team1?.shortName || match.team1?.name || 'H').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Center Kick-off Time Box */}
        <div className="shrink-0 flex flex-col items-center justify-center min-w-[96px] sm:min-w-[116px]">
          <div
            className={`px-3.5 py-1.5 rounded-2xl border text-center transition-colors ${
              hasTimeVenue
                ? 'bg-slate-50 border-slate-200/90'
                : 'bg-amber-50/70 border-amber-200/80'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              VS
            </span>
            <span
              className={`text-xs sm:text-sm font-black flex items-center justify-center gap-1 mt-0.5 ${
                hasTimeVenue ? 'text-slate-700' : 'text-amber-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              {match.timeStr && match.timeStr !== 'TBD' ? `${match.timeStr} น.` : 'รอระบุเวลา'}
            </span>
          </div>
        </div>

        {/* Team 2 */}
        <div className="flex-1 flex items-center justify-start gap-2.5 text-left min-w-0">
          {match.team2?.logo ? (
            <img
              src={match.team2.logo}
              alt={match.team2.name}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border border-slate-200 bg-slate-50 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">
              {(match.team2?.shortName || match.team2?.name || 'A').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-extrabold text-[#1b1c1c] truncate">
              {match.team2?.name || 'รอระบุทีมเยือน'}
            </p>
            <p className="text-[11px] font-semibold text-[#7d7765]">ทีมเยือน (Away)</p>
          </div>
        </div>
      </div>

      {/* Right Actions: Schedule Time/Venue & Delete */}
      <div className="flex items-center justify-end gap-2 lg:w-[210px] shrink-0 border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
        <button
          type="button"
          onClick={onOpenTimeVenueModal}
          className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#f4f3ef] hover:bg-[#1b1c1c] text-[#1b1c1c] hover:text-[#ffe680] transition-all shadow-2xs cursor-pointer"
          title="กำหนดวัน เวลา และสนามแข่งขัน"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>ตั้งวัน เวลา & สนาม</span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
          title="ลบคู่แข่งขันนี้"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

