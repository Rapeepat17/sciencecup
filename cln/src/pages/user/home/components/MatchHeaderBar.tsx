import React from 'react';
import { ListOrdered, LayoutGrid, List } from 'lucide-react';

export type ViewMode = 'card' | 'table';

export interface MatchHeaderBarProps {
  totalMatches: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  title?: string;
}

export const MatchHeaderBar: React.FC<MatchHeaderBarProps> = ({
  totalMatches,
  viewMode,
  onViewModeChange,
  title,
}) => {
  const displayTitle = title || `โปรแกรมการแข่งขันเรียงตามลำดับคิว (${totalMatches} คู่)`;

  return (
    <div className="flex items-center justify-between px-1 text-xs text-[#4b4737] mb-1">
      {/* Left: Queue Title */}
      <span className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#1b1c1c]">
        <ListOrdered className="w-4 h-4 text-[#786607]" />
        {displayTitle}
      </span>

      {/* Right: View Mode Toggle */}
      <div className="flex items-center gap-1 bg-[#f5f3f3] p-1 rounded-xl border border-[#efeded]">
        <button
          type="button"
          onClick={() => onViewModeChange('card')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
            viewMode === 'card'
              ? 'bg-white text-[#1b1c1c] shadow-2xs font-black'
              : 'text-[#4b4737] hover:text-[#1b1c1c]'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>มุมมองการ์ด</span>
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange('table')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
            viewMode === 'table'
              ? 'bg-white text-[#1b1c1c] shadow-2xs font-black'
              : 'text-[#4b4737] hover:text-[#1b1c1c]'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>มุมมองตาราง</span>
        </button>
      </div>
    </div>
  );
};
