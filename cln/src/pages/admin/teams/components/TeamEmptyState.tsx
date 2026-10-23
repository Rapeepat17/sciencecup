import React from 'react';
import { Users, Plus, SearchX } from 'lucide-react';

export interface TeamEmptyStateProps {
  isSearch?: boolean;
  onResetSearch?: () => void;
  onAddTeam?: () => void;
  noTournament?: boolean;
  onSelectTournament?: () => void;
}

export const TeamEmptyState: React.FC<TeamEmptyStateProps> = ({
  isSearch = false,
  onResetSearch,
  onAddTeam,
  noTournament = false,
  onSelectTournament,
}) => {
  if (noTournament) {
    return (
      <div className="bg-white rounded-2xl border border-[#efeded] p-12 sm:p-16 flex flex-col items-center justify-center text-center space-y-3.5 shadow-2xs">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-200/80 text-[#786607] flex items-center justify-center mb-1 shadow-2xs">
          <Users className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="font-display text-base sm:text-lg font-bold text-[#1b1c1c]">
            ยังไม่ได้เลือกทัวร์นาเมนต์
          </h3>
          <p className="text-xs text-[#7d7765]">
            กรุณาเลือกหรือสร้างรายการแข่งขันก่อน จึงจะสามารถจัดการข้อมูลทีมและนักกีฬาได้
          </p>
        </div>
        {onSelectTournament && (
          <button
            type="button"
            onClick={onSelectTournament}
            className="mt-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[#ffe680] hover:bg-[#fedb56] text-[#786607] transition-all cursor-pointer shadow-xs active:scale-95"
          >
            เลือกรายการแข่งขัน
          </button>
        )}
      </div>
    );
  }

  if (isSearch) {
    return (
      <div className="bg-white rounded-2xl border border-[#efeded] p-12 sm:p-16 flex flex-col items-center justify-center text-center space-y-3 shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 text-gray-400 flex items-center justify-center mb-1">
          <SearchX className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="font-display text-base font-bold text-gray-800">
            ไม่พบทีมที่ตรงกับคำค้นหา
          </h3>
          <p className="text-xs text-gray-500">
            ลองตรวจสอบคำสะกด หรือล้างคำค้นหาเพื่อดูรายชื่อทีมทั้งหมด
          </p>
        </div>
        {onResetSearch && (
          <button
            type="button"
            onClick={onResetSearch}
            className="px-4 py-2 rounded-xl font-semibold text-xs text-[#786607] bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 transition-colors cursor-pointer"
          >
            ล้างคำค้นหา
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#efeded] p-12 sm:p-16 flex flex-col items-center justify-center text-center space-y-3.5 shadow-2xs">
      <div className="w-14 h-14 rounded-2xl bg-[#ffe680]/30 border-2 border-[#ffe680] text-[#786607] flex items-center justify-center mb-1 shadow-2xs">
        <Users className="w-7 h-7" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="font-display text-base sm:text-lg font-bold text-[#1b1c1c]">
          ยังไม่มีทีมในทัวร์นาเมนต์นี้
        </h3>
        <p className="text-xs text-[#7d7765]">
          เริ่มต้นเพิ่มทีมแรกเพื่อจัดการรายชื่อสโมสร และนักกีฬา
        </p>
      </div>
      {onAddTeam && (
        <button
          type="button"
          onClick={onAddTeam}
          className="mt-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[#ffe680] hover:bg-[#fedb56] text-[#786607] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มทีมแรก</span>
        </button>
      )}
    </div>
  );
};
