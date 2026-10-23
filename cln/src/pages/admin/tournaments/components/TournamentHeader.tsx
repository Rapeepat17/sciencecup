import React from 'react';
import { PlusCircle, Trophy } from 'lucide-react';

export interface TournamentHeaderProps {
  totalCount: number;
  onCreateClick: () => void;
}

export const TournamentHeader: React.FC<TournamentHeaderProps> = ({
  totalCount,
  onCreateClick,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/80">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50/90 border border-amber-200/70 text-[#786607] flex items-center justify-center shrink-0 shadow-2xs">
            <Trophy className="w-5 h-5 text-[#b45309]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-display text-[#1b1c1c] tracking-tight">
                เลือกทัวร์นาเมนต์
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {totalCount} รายการ
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#7d7765]">
              รายการทัวร์นาเมนต์ทั้งหมด และสลับทัวร์นาเมนต์ที่ต้องการจัดการ
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onCreateClick}
        className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-[#ffe680] hover:bg-[#fedb56] text-[#786607] text-xs sm:text-sm font-bold shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
      >
        <PlusCircle className="w-4 h-4 text-[#786607]" />
        <span>สร้างทัวร์นาเมนต์ใหม่</span>
      </button>
    </div>
  );
};
