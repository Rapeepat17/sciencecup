import React from 'react';
import { Shield, Users, Pencil, Trash2 } from 'lucide-react';
import { Team } from '../../../../types';

export interface TeamCardProps {
  team: Team;
  playersCount: number;
  onManagePlayers: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  playersCount,
  onManagePlayers,
  onEdit,
  onDelete,
}) => {
  const groupLabel = (team as any).group_name || team.group || 'ยังไม่กำหนดสาย';
  const shortName = (team as any).short_name || team.shortName;

  return (
    <div className="group relative bg-white rounded-xl border border-gray-200/90 hover:border-gray-300 transition-all duration-150 px-4 py-3 flex items-center justify-between gap-3 sm:gap-4 shadow-2xs hover:shadow-xs">
      {/* Left Section: Logo + Team Name + Short Name + Group */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-full bg-white border border-amber-200/80 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
          {team.logo ? (
            <img
              src={team.logo}
              alt={team.name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <Shield className="w-5 h-5 text-[#b45309]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 tracking-tight truncate group-hover:text-[#786607] transition-colors">
              {team.name}
            </h3>

            {groupLabel ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                {groupLabel}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200/60">
                ยังไม่จัดสาย
              </span>
            )}
          </div>

          {(shortName || team.manager) && (
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
              {shortName && (
                <span className="inline-block text-[11px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-bold shrink-0">
                  {shortName}
                </span>
              )}
              {team.manager && (
                <span className="truncate">
                  {shortName ? `• ผู้จัดการ: ${team.manager}` : `ผู้จัดการ: ${team.manager}`}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Middle Section: Players count badge (Informative chip - not clickable) */}
      <div className="hidden sm:flex items-center shrink-0 w-32 justify-center">
        <div
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50/80 px-2.5 py-1 rounded-lg border border-gray-200/70 select-none cursor-default"
          title="จำนวนนักกีฬาในทีม"
        >
          <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span>{playersCount} นักกีฬา</span>
        </div>
      </div>

      {/* Right Section: Action buttons with fixed widths for straight vertical alignment */}
      <div className="flex items-center justify-end gap-1.5 shrink-0 w-44">
        <button
          type="button"
          onClick={onManagePlayers}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200/80 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          title="จัดการรายชื่อนักกีฬา"
        >
          <Users className="w-3.5 h-3.5 text-gray-500 sm:hidden" />
          <span className="hidden sm:inline">จัดการนักกีฬา</span>
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="แก้ไขข้อมูลทีม"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="w-7 h-7 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="ลบทีม"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
