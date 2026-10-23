import React from 'react';
import { Search, X, Filter } from 'lucide-react';

export type TeamStatusFilter = 'ALL' | 'ASSIGNED' | 'UNASSIGNED';

export interface TeamFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: TeamStatusFilter;
  onStatusFilterChange: (status: TeamStatusFilter) => void;
  totalFilteredCount: number;
}

export const TeamFilterBar: React.FC<TeamFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalFilteredCount,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#efeded] p-3 sm:p-4 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อทีม, รหัสทีม, หรือชื่อย่อ..."
            className="w-full pl-9 pr-8 py-2 bg-gray-50/80 hover:bg-gray-50 focus:bg-white border border-gray-200/80 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffe680] focus:border-amber-400 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Result Count */}
        <div className="text-xs font-medium text-gray-500 shrink-0 px-1">
          พบข้อมูล {totalFilteredCount} รายการ
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none text-xs">
        <div className="flex items-center gap-1 text-gray-400 mr-1 text-[11px] font-medium shrink-0">
          <Filter className="w-3 h-3" />
          <span>สถานะ:</span>
        </div>

        <button
          type="button"
          onClick={() => onStatusFilterChange('ALL')}
          className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer shrink-0 ${
            statusFilter === 'ALL'
              ? 'bg-[#ffe680] text-[#786607] font-bold shadow-2xs'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60'
          }`}
        >
          ทั้งหมด
        </button>

        <button
          type="button"
          onClick={() => onStatusFilterChange('ASSIGNED')}
          className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer shrink-0 ${
            statusFilter === 'ASSIGNED'
              ? 'bg-[#ffe680] text-[#786607] font-bold shadow-2xs'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60'
          }`}
        >
          จัดสายแล้ว
        </button>

        <button
          type="button"
          onClick={() => onStatusFilterChange('UNASSIGNED')}
          className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer shrink-0 ${
            statusFilter === 'UNASSIGNED'
              ? 'bg-[#ffe680] text-[#786607] font-bold shadow-2xs'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60'
          }`}
        >
          ยังไม่จัดสาย
        </button>
      </div>
    </div>
  );
};
