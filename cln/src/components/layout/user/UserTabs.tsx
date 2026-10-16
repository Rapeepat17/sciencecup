import React from 'react';
import { CalendarDays, Award, GitFork } from 'lucide-react';

export type UserTabType = 'fixtures' | 'standings' | 'bracket';

export interface UserTabsProps {
  activeTab: UserTabType;
  onTabChange: (tab: UserTabType) => void;
}

export const UserTabs: React.FC<UserTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex items-center gap-2 border-t border-[#efeded]/80 py-2.5 overflow-x-auto no-scrollbar">
      <button
        type="button"
        onClick={() => onTabChange('fixtures')}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-display font-bold transition-all shrink-0 cursor-pointer ${
          activeTab === 'fixtures'
            ? 'bg-[#ffe680] text-[#786607] shadow-xs'
            : 'text-[#4b4737] hover:bg-[#f5f3f3] hover:text-[#1b1c1c]'
        }`}
      >
        <CalendarDays className="w-4 h-4" />
        <span>ตารางการแข่งขัน</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('standings')}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-display font-bold transition-all shrink-0 cursor-pointer ${
          activeTab === 'standings'
            ? 'bg-[#ffe680] text-[#786607] shadow-xs'
            : 'text-[#4b4737] hover:bg-[#f5f3f3] hover:text-[#1b1c1c]'
        }`}
      >
        <Award className="w-4 h-4" />
        <span>ตารางคะแนน</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('bracket')}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-display font-bold transition-all shrink-0 cursor-pointer ${
          activeTab === 'bracket'
            ? 'bg-[#ffe680] text-[#786607] shadow-xs'
            : 'text-[#4b4737] hover:bg-[#f5f3f3] hover:text-[#1b1c1c]'
        }`}
      >
        <GitFork className="w-4 h-4" />
        <span>ตารางน็อคเอาท์ (Bracket)</span>
      </button>
    </div>
  );
};
