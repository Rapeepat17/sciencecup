import React, { useMemo } from 'react';
import { ListOrdered, CalendarRange } from 'lucide-react';

export type KnockoutStartingRound = 'r16' | 'qf' | 'sf' | 'final';

export function getTournamentRoundItems(
  knockoutStartingRound: KnockoutStartingRound | string = 'sf'
): Array<{ id: string; label: string }> {
  const base = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'รอบแบ่งกลุ่ม (Group Stage)', label: 'รอบแบ่งกลุ่ม' },
  ];

  if (knockoutStartingRound === 'r16') {
    return [
      ...base,
      { id: 'รอบ 16 ทีมสุดท้าย', label: 'รอบ 16 ทีม' },
      { id: 'รอบ 8 ทีมสุดท้าย', label: 'รอบ 8 ทีม' },
      { id: 'รอบรองชนะเลิศ', label: 'รอบรองฯ' },
      { id: 'นัดชิงอันดับ 3', label: 'ชิงอันดับ 3' },
      { id: 'นัดชิงชนะเลิศ', label: 'นัดชิงฯ' },
    ];
  }

  if (knockoutStartingRound === 'qf') {
    return [
      ...base,
      { id: 'รอบ 8 ทีมสุดท้าย', label: 'รอบ 8 ทีม' },
      { id: 'รอบรองชนะเลิศ', label: 'รอบรองฯ' },
      { id: 'นัดชิงอันดับ 3', label: 'ชิงอันดับ 3' },
      { id: 'นัดชิงชนะเลิศ', label: 'นัดชิงฯ' },
    ];
  }

  if (knockoutStartingRound === 'final') {
    return [
      ...base,
      { id: 'นัดชิงชนะเลิศ', label: 'นัดชิงฯ' },
    ];
  }

  // Default: 'sf' (รอบรองชนะเลิศ)
  return [
    ...base,
    { id: 'รอบรองชนะเลิศ', label: 'รอบรองฯ' },
    { id: 'นัดชิงอันดับ 3', label: 'ชิงอันดับ 3' },
    { id: 'นัดชิงชนะเลิศ', label: 'นัดชิงฯ' },
  ];
}

interface MatchFilterBarProps {
  selectedRound: string;
  onSelectRound: (round: string) => void;
  selectedGroup: string;
  onSelectGroup: (group: string) => void;
  groupOptions: string[];
  knockoutStartingRound?: KnockoutStartingRound;
  viewMode: 'sequence' | 'byDate';
  onChangeViewMode: (mode: 'sequence' | 'byDate') => void;
}

export const MatchFilterBar: React.FC<MatchFilterBarProps> = ({
  selectedRound,
  onSelectRound,
  selectedGroup,
  onSelectGroup,
  groupOptions,
  knockoutStartingRound = 'sf',
  viewMode,
  onChangeViewMode,
}) => {
  const roundItems = useMemo(
    () => getTournamentRoundItems(knockoutStartingRound),
    [knockoutStartingRound]
  );

  return (
    <div className="bg-white p-4 rounded-3xl border border-[#efeded] shadow-xs space-y-3">
      {/* Row 1: Round & View Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          <span className="text-xs font-bold text-[#4b4737] shrink-0 mr-1">รอบ:</span>
          {roundItems.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectRound(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedRound === r.id
                  ? 'bg-[#1b1c1c] text-[#ffe680] shadow-2xs font-black'
                  : 'bg-[#f5f3f3] text-[#4b4737] hover:bg-[#efeded]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#f5f3f3] p-1 rounded-xl border border-[#efeded] shrink-0">
          <button
            type="button"
            onClick={() => onChangeViewMode('sequence')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'sequence'
                ? 'bg-white text-[#1b1c1c] shadow-2xs'
                : 'text-[#7d7765] hover:text-[#1b1c1c]'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>เรียงตามลำดับคู่</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('byDate')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'byDate'
                ? 'bg-white text-[#1b1c1c] shadow-2xs'
                : 'text-[#7d7765] hover:text-[#1b1c1c]'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>แยกตามวันแข่งขัน</span>
          </button>
        </div>
      </div>

      {/* Row 2: Group Filter Pills */}
      {groupOptions.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto w-full pt-2 border-t border-[#f5f3f3]">
          <span className="text-xs font-bold text-[#4b4737] shrink-0 mr-1">กลุ่ม:</span>
          <button
            type="button"
            onClick={() => onSelectGroup('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedGroup === 'all'
                ? 'bg-[#786607] text-white shadow-2xs'
                : 'bg-[#f5f3f3] text-[#4b4737] hover:bg-[#efeded]'
            }`}
          >
            ทุกกลุ่ม
          </button>
          {groupOptions.map((g) => {
            const displayLabel = g.startsWith('กลุ่ม') || g.startsWith('สาย') ? g : `กลุ่ม ${g}`;
            return (
              <button
                key={g}
                type="button"
                onClick={() => onSelectGroup(g)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedGroup === g
                    ? 'bg-[#786607] text-white shadow-2xs'
                    : 'bg-[#f5f3f3] text-[#4b4737] hover:bg-[#efeded]'
                }`}
              >
                {displayLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
