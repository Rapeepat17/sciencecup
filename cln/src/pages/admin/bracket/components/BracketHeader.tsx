import React from 'react';
import {
  GitFork,
  Zap,
  Save,
  Loader2,
} from 'lucide-react';

interface BracketHeaderProps {
  tournamentName?: string;
  startingRound: 'qf' | 'sf' | 'final';
  knockoutMatchesCount: number;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isSeeding: boolean;
  onAutoSeed: () => void;
  onSave: () => void;
}

export const BracketHeader: React.FC<BracketHeaderProps> = ({
  tournamentName,
  startingRound,
  knockoutMatchesCount,
  hasUnsavedChanges,
  isSaving,
  isSeeding,
  onAutoSeed,
  onSave,
}) => {
  const startingRoundLabel =
    startingRound === 'qf'
      ? 'เริ่มที่รอบ 8 ทีมสุดท้าย (Quarter-Finals)'
      : startingRound === 'final'
      ? 'เฉพาะนัดชิงชนะเลิศ (Final Only)'
      : 'เริ่มที่รอบรองชนะเลิศ (Semi-Finals)';

  const totalBracketMatches =
    startingRound === 'qf' ? 8 : startingRound === 'final' ? 1 : 4;

  return (
    <div className="bg-white rounded-3xl border border-[#efeded] p-6 shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ffe680]/60 text-[#786607] border border-[#ffe680] inline-flex items-center gap-1">
              <GitFork className="w-3 h-3" />
              <span>{tournamentName || 'Tournament'}</span>
            </span>
            {hasUnsavedChanges && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold font-display text-[#1b1c1c] tracking-tight">
            สายแข่งน็อคเอาท์
          </h1>
          <p className="text-xs text-[#7d7765] mt-0.5">
            วางทีมในผังรอบแพ้คัดออก หรือดึงทีมอันดับ 1–2 จากตารางคะแนน เมื่อกดบันทึกจะสร้างแมตช์ลงตารางการแข่งขันอัตโนมัติ
          </p>
        </div>

        {/* Clean Action Bar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onAutoSeed}
            disabled={isSeeding}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#ffe680] to-[#f5d95b] hover:from-[#fdd835] hover:to-[#fbc02d] text-[#594902] shadow-xs border border-[#eed050] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="ดึงทีมอันดับ 1 และ 2 จากตารางคะแนนรอบแบ่งกลุ่มมาจัดสายอัตโนมัติ"
          >
            {isSeeding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>ดึงทีมจากตารางคะแนน</span>
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1b1c1c] hover:bg-black text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกสายการแข่งขัน</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#f4f3ef]">
        <div className="bg-[#fcfbf9] rounded-2xl p-3 border border-[#efeded]">
          <span className="text-[11px] font-medium text-[#7d7765] block">
            รูปแบบรอบน็อคเอาท์ของทัวร์นาเมนต์
          </span>
          <span className="text-sm sm:text-base font-bold font-display text-[#1b1c1c]">
            {startingRoundLabel}
          </span>
        </div>
        <div className="bg-[#fcfbf9] rounded-2xl p-3 border border-[#efeded]">
          <span className="text-[11px] font-medium text-[#7d7765] block">
            จำนวนคู่ในผังน็อคเอาท์ทั้งหมด
          </span>
          <span className="text-lg font-bold font-display text-[#786607]">
            {totalBracketMatches} คู่
          </span>
        </div>
        <div className="bg-[#fcfbf9] rounded-2xl p-3 border border-[#efeded]">
          <span className="text-[11px] font-medium text-[#7d7765] block">
            ซิงค์เป็นแมตช์ในตารางการแข่งขันแล้ว
          </span>
          <span className="text-lg font-bold font-display text-emerald-600">
            {knockoutMatchesCount} / {totalBracketMatches} คู่
          </span>
        </div>
      </div>
    </div>
  );
};
