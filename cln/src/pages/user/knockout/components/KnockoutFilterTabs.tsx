import React from 'react';

export type KnockoutFilterRound = 'all' | 'qf' | 'sf' | 'final';

export interface KnockoutFilterTabsProps {
  selectedRound: KnockoutFilterRound;
  onSelectRound: (round: KnockoutFilterRound) => void;
  startingRound?: 'qf' | 'sf' | 'final';
}

export const KnockoutFilterTabs: React.FC<KnockoutFilterTabsProps> = ({
  selectedRound,
  onSelectRound,
  startingRound = 'sf',
}) => {
  const allOptions: { id: KnockoutFilterRound; label: string }[] = [
    { id: 'all', label: 'ทุกรอบ (All Bracket)' },
    { id: 'qf', label: 'รอบ 8 ทีม (QF)' },
    { id: 'sf', label: 'รอบรองฯ (SF)' },
    { id: 'final', label: 'รอบชิงฯ (Final)' },
  ];

  const filterOptions = allOptions.filter((opt) => {
    if (opt.id === 'qf' && startingRound !== 'qf') return false;
    if (opt.id === 'sf' && startingRound === 'final') return false;
    return true;
  });

  return (
    <div className="w-full flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
      {filterOptions.map((opt) => {
        const isActive = selectedRound === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelectRound(opt.id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-95 shadow-2xs ${
              isActive
                ? 'bg-[#ffe680] text-[#786607] shadow-xs'
                : 'bg-white text-[#4b4737] border border-[#efeded] hover:bg-[#fbf9f9] hover:text-[#1b1c1c]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
