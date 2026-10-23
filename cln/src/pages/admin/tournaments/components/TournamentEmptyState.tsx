import React from 'react';
import { Trophy, PlusCircle, Search } from 'lucide-react';

export interface TournamentEmptyStateProps {
  isSearch: boolean;
  onResetSearch?: () => void;
  onCreateClick?: () => void;
}

export const TournamentEmptyState: React.FC<TournamentEmptyStateProps> = ({
  isSearch,
  onResetSearch,
  onCreateClick,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center flex flex-col items-center justify-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-[#786607] flex items-center justify-center shadow-2xs">
        {isSearch ? (
          <Search className="w-7 h-7 text-[#b45309]" />
        ) : (
          <Trophy className="w-7 h-7 text-[#b45309]" />
        )}
      </div>

      <div className="space-y-1 max-w-sm">
        <h4 className="font-display font-bold text-base text-[#1b1c1c]">
          {isSearch ? 'ไม่พบทัวร์นาเมนต์ที่ตรงกับเงื่อนไข' : 'ยังไม่มีทัวร์นาเมนต์ในระบบ'}
        </h4>
        <p className="text-xs text-gray-500">
          {isSearch
            ? 'ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองสถานะใหม่อีกครั้ง'
            : 'เริ่มต้นสร้างทัวร์นาเมนต์แรกของคุณเพื่อจัดการทีมและโปรแกรมการแข่งขัน'}
        </p>
      </div>

      {isSearch && onResetSearch ? (
        <button
          type="button"
          onClick={onResetSearch}
          className="px-4 py-2 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition-all cursor-pointer shadow-2xs"
        >
          ล้างคำค้นหาทั้งหมด
        </button>
      ) : onCreateClick ? (
        <button
          type="button"
          onClick={onCreateClick}
          className="px-4 py-2.5 rounded-xl bg-[#ffe680] hover:bg-[#fedb56] text-[#786607] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95"
        >
          <PlusCircle className="w-4 h-4 text-[#786607]" />
          <span>สร้างทัวร์นาเมนต์แรก</span>
        </button>
      ) : null}
    </div>
  );
};
