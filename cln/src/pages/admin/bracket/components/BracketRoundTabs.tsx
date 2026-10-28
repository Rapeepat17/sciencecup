import React from 'react';
import { GitFork } from 'lucide-react';

export type BracketTabRound = 'all' | 'qf' | 'sf' | 'third_place' | 'final';

interface BracketRoundTabsProps {
  startingRound: 'qf' | 'sf' | 'final';
  selectedTab: BracketTabRound;
  onSelectTab: (tab: BracketTabRound) => void;
}

export const BracketRoundTabs: React.FC<BracketRoundTabsProps> = ({
  startingRound,
  selectedTab,
  onSelectTab,
}) => {
  const tabs: Array<{ id: BracketTabRound; label: string }> = [
    { id: 'all', label: 'ผังสายแข่งทั้งหมด' },
    ...(startingRound === 'qf'
      ? [{ id: 'qf' as const, label: 'รอบ 8 ทีมสุดท้าย (4 คู่)' }]
      : []),
    ...(startingRound === 'qf' || startingRound === 'sf'
      ? [
          { id: 'sf' as const, label: 'รอบรองชนะเลิศ (2 คู่)' },
          { id: 'third_place' as const, label: 'นัดชิงอันดับ 3' },
        ]
      : []),
    { id: 'final', label: 'นัดชิงชนะเลิศ' },
  ];

  return (
    <div className="bg-white p-4 rounded-3xl border border-[#efeded] shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
        <span className="text-xs font-bold text-[#4b4737] shrink-0 mr-1 inline-flex items-center gap-1">
          <GitFork className="w-3.5 h-3.5 text-[#786607]" />
          <span>มุมมองสายแข่ง:</span>
        </span>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedTab === tab.id
                ? 'bg-[#1b1c1c] text-[#ffe680] shadow-2xs font-black'
                : 'bg-[#f5f3f3] text-[#4b4737] hover:bg-[#efeded]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <span className="text-[11px] font-semibold text-[#7d7765]">
        คลิกที่แถวชื่อทีมในแต่ละคู่เพื่อเลือกหรือเปลี่ยนทีมในสายการแข่งขัน
      </span>
    </div>
  );
};

