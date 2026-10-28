import React from 'react';
import { Filter } from 'lucide-react';

interface StandingsFilterBarProps {
  groupOptions: string[];
  selectedGroup: string;
  onSelectGroup: (group: string) => void;
}

export const StandingsFilterBar: React.FC<StandingsFilterBarProps> = ({
  groupOptions,
  selectedGroup,
  onSelectGroup,
}) => {
  if (groupOptions.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-3xl border border-[#efeded] shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
        <span className="text-xs font-bold text-[#4b4737] shrink-0 mr-1 inline-flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-[#786607]" />
          <span>เลือกดูกลุ่ม:</span>
        </span>
        <button
          type="button"
          onClick={() => onSelectGroup('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            selectedGroup === 'all'
              ? 'bg-[#1b1c1c] text-[#ffe680] shadow-2xs font-black'
              : 'bg-[#f5f3f3] text-[#4b4737] hover:bg-[#efeded]'
          }`}
        >
          ทุกกลุ่ม ({groupOptions.length})
        </button>

        {groupOptions.map((g) => {
          const displayLabel =
            g.startsWith('กลุ่ม') || g.startsWith('สาย') || g.startsWith('Group')
              ? g
              : `กลุ่ม ${g}`;
          return (
            <button
              key={g}
              type="button"
              onClick={() => onSelectGroup(g)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedGroup === g
                  ? 'bg-[#1b1c1c] text-[#ffe680] shadow-2xs font-black'
                  : 'bg-[#f5f3f3] text-[#4b4737] hover:bg-[#efeded]'
              }`}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-[11px] font-semibold text-[#7d7765]">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
          <span>อันดับ 1–2 ผ่านเข้ารอบน็อคเอาท์</span>
        </span>
      </div>
    </div>
  );
};

