import React from 'react';
import { Users, Plus, Shield } from 'lucide-react';

export interface TeamHeaderProps {
  totalTeams: number;
  totalPlayers: number;
  tournamentName?: string;
  onAddTeam: () => void;
  disabled?: boolean;
}

export const TeamHeader: React.FC<TeamHeaderProps> = ({
  totalTeams,
  totalPlayers,
  tournamentName,
  onAddTeam,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl border border-[#efeded] p-5 sm:p-6 shadow-2xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold font-display text-[#1b1c1c] tracking-tight">
            สร้างและจัดการทีม
          </h1>
          {tournamentName && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#786607] bg-[#ffe680]/40 px-2.5 py-0.5 rounded-full border border-[#ffe680]">
              <Shield className="w-3 h-3 text-[#786607]" />
              <span>{tournamentName}</span>
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-[#7d7765]">
          เพิ่มสโมสร แก้ไขข้อมูล โลโก้ และรายชื่อนักกีฬาของแต่ละทีม
        </p>

        {/* Stats chips */}
        <div className="flex items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-50 px-2.5 py-0.5 rounded-lg border border-gray-200/80">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            ทั้งหมด {totalTeams} ทีม
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-50 px-2.5 py-0.5 rounded-lg border border-gray-200/80">
            <Users className="w-3.5 h-3.5 text-gray-500" />
            นักกีฬารวม {totalPlayers} คน
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onAddTeam}
          disabled={disabled}
          className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-2xs ${
            disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : 'bg-[#ffe680] hover:bg-[#fedb56] text-[#786607] active:scale-95 cursor-pointer shadow-xs'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มทีมใหม่</span>
        </button>
      </div>
    </div>
  );
};
