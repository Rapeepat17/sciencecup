import React from 'react';
import { GitFork, Zap, Plus } from 'lucide-react';

interface BracketEmptyStateProps {
  startingRound: 'qf' | 'sf' | 'final';
  isSeeding: boolean;
  onAutoSeed: () => void;
  onInitializeEmptyBracket: () => void;
}

export const BracketEmptyState: React.FC<BracketEmptyStateProps> = ({
  startingRound,
  isSeeding,
  onAutoSeed,
  onInitializeEmptyBracket,
}) => {
  const roundText =
    startingRound === 'qf'
      ? 'รอบ 8 ทีมสุดท้าย -> รอบรองชนะเลิศ -> นัดชิงชนะเลิศ'
      : startingRound === 'final'
      ? 'เฉพาะนัดชิงชนะเลิศ'
      : 'รอบรองชนะเลิศ -> นัดชิงชนะเลิศ';

  return (
    <div className="bg-white rounded-3xl p-12 text-center text-[#4b4737] border border-[#efeded] shadow-xs space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-[#ffe680]/40 border border-[#ffe680] text-[#786607] flex items-center justify-center mx-auto">
        <GitFork className="w-8 h-8" />
      </div>
      <div className="space-y-1 max-w-lg mx-auto">
        <h3 className="font-display font-bold text-lg text-[#1b1c1c]">
          พร้อมสร้างผังสายการแข่งขันรอบน็อคเอาท์
        </h3>
        <p className="text-xs text-[#7d7765] leading-relaxed">
          ทัวร์นาเมนต์นี้ตั้งค่ารอบน็อคเอาท์ไว้แบบ{' '}
          <span className="font-bold text-[#1b1c1c]">{roundText}</span>{' '}
          คุณสามารถดึงทีมอันดับ 1–2 จากตารางคะแนนมาจัดสายอัตโนมัติ หรือเปิดผังว่างเพื่อเลือกทีมเองได้เลย
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onAutoSeed}
          disabled={isSeeding}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b1c1c] text-[#ffe680] font-display font-bold text-xs shadow-md hover:bg-black transition-all cursor-pointer disabled:opacity-50"
        >
          <Zap className="w-4 h-4 text-[#ffe680]" />
          <span>ดึงทีมจากตารางคะแนนมาสร้างสายแข่งอัตโนมัติ</span>
        </button>

        <button
          type="button"
          onClick={onInitializeEmptyBracket}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f4f3ef] hover:bg-[#eae8e1] text-[#1b1c1c] border border-[#e5e3dc] font-display font-bold text-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#786607]" />
          <span>เปิดผังสายแข่งเพื่อเลือกทีมเอง</span>
        </button>
      </div>
    </div>
  );
};

