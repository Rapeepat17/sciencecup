import React from 'react';
import { Search, X } from 'lucide-react';

export interface TournamentFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
}

export const TournamentFilterBar: React.FC<TournamentFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  totalCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ค้นหาชื่อทัวร์นาเมนต์ หรือรายละเอียด..."
          className="w-full pl-10 pr-9 py-2 rounded-xl bg-gray-50/80 border border-gray-200/80 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#786607] focus:bg-white transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5 rounded-full"
            title="ล้างคำค้นหา"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="text-xs text-gray-500 font-medium px-1">
        พบข้อมูลทั้งหมด <span className="font-bold text-gray-800">{totalCount}</span> รายการ
      </div>
    </div>
  );
};
