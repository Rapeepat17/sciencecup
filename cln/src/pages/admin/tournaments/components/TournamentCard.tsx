import React from 'react';
import {
  Trophy,
  Calendar,
  Pencil,
  Trash2,
  GitFork,
  Check,
} from 'lucide-react';
import { TournamentItem } from '../../../../types';

export interface TournamentCardProps {
  tournament: TournamentItem;
  isCurrent: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  isCurrent,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const round = tournament.knockoutStartingRound || (tournament as any).knockout_starting_round;
  const roundLabel =
    round === 'qf'
      ? '8 ทีม (QF)'
      : round === 'final'
      ? 'ชิง (Final)'
      : round === 'sf'
      ? '4 ทีม (SF)'
      : null;

  const startDate = tournament.startDate || (tournament as any).start_date;
  const endDate = tournament.endDate || (tournament as any).end_date;
  const hasDate = Boolean(startDate || endDate);

  return (
    <div
      className={`group relative bg-white rounded-xl border transition-all duration-150 px-4 py-3 flex items-center justify-between gap-3 sm:gap-4 shadow-2xs hover:shadow-xs ${
        isCurrent
          ? 'border-amber-400/90 bg-amber-50/30 ring-1 ring-amber-300/40'
          : 'border-gray-200/90 hover:border-gray-300 bg-white'
      }`}
    >
      {/* Left Section: Thumbnail + Name + ID + Description */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-amber-50/70 border border-amber-200/70 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
          {tournament.logo ? (
            <img
              src={tournament.logo}
              alt={tournament.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <Trophy className="w-5 h-5 text-[#b45309]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 tracking-tight truncate group-hover:text-[#786607] transition-colors">
              {tournament.name}
            </h3>
            <span className="inline-block text-[11px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              ID: {tournament.id}
            </span>
            {isCurrent && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                กำลังจัดการ
              </span>
            )}
          </div>

          {tournament.description && (
            <p className="text-xs text-gray-500 truncate max-w-md mt-0.5">
              {tournament.description}
            </p>
          )}
        </div>
      </div>

      {/* Middle Section: Date & Round badges with fixed column widths for straight vertical alignment */}
      <div className="hidden lg:flex items-center gap-3 shrink-0">
        <div className="w-52 flex items-center">
          {hasDate ? (
            <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200/70 w-full justify-center shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">
                {startDate || '-'} ถึง {endDate || '-'}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50/50 px-2.5 py-1 rounded-lg border border-gray-100 w-full justify-center">
              <Calendar className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              <span>ยังไม่กำหนดวันแข่ง</span>
            </div>
          )}
        </div>

        <div className="w-28 flex items-center justify-center">
          {roundLabel ? (
            <div className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/70 w-full justify-center shadow-2xs">
              <GitFork className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>{roundLabel}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-300">-</span>
          )}
        </div>
      </div>

      {/* Right Section: Action buttons with fixed container width and placeholder */}
      <div className="flex items-center justify-end gap-1.5 shrink-0 w-38">
        <button
          type="button"
          onClick={onSelect}
          disabled={isCurrent}
          className={`w-20 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            isCurrent
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
              : 'bg-[#ffe680] hover:bg-[#fedb56] text-[#786607] active:scale-95 shadow-2xs'
          }`}
        >
          {isCurrent ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>เลือกอยู่</span>
            </>
          ) : (
            <span>เลือก</span>
          )}
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="แก้ไขข้อมูล"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="w-7 h-7 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="ลบ"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
