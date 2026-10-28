import React from 'react';
import { Layers, Dices, RotateCcw, Plus, Save, Loader2 } from 'lucide-react';

interface GroupHeaderProps {
  tournamentName?: string;
  totalTeams: number;
  assignedCount: number;
  groupsCount: number;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onRandomDraw: () => void;
  onResetGroups: () => void;
  onAddGroup: () => void;
  onSave: () => void;
}

export const GroupHeader: React.FC<GroupHeaderProps> = ({
  tournamentName,
  totalTeams,
  assignedCount,
  groupsCount,
  isSaving,
  hasUnsavedChanges,
  onRandomDraw,
  onResetGroups,
  onAddGroup,
  onSave,
  onProceedToMatches,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-[#efeded] p-6 shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ffe680]/60 text-[#786607] border border-[#ffe680]">
              {tournamentName || 'Tournament'}
            </span>
            {hasUnsavedChanges && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold font-display text-[#1b1c1c] tracking-tight">
            จัดกลุ่มการแข่งขัน (Group Stage)
          </h1>
          <p className="text-xs text-[#7d7765]">
            จัดสรรทีมลงกลุ่มการแข่งขัน สุ่มจับสลากอัตโนมัติ หรือลากย้ายทีมระหว่างกลุ่ม
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onAddGroup}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#f4f3ef] hover:bg-[#eae8e1] text-[#1b1c1c] border border-[#e5e3dc] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#786607]" />
            <span>เพิ่มกลุ่มใหม่</span>
          </button>

          <button
            type="button"
            onClick={onRandomDraw}
            disabled={totalTeams === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#ffe680] to-[#f5d95b] hover:from-[#fdd835] hover:to-[#fbc02d] text-[#594902] shadow-xs border border-[#eed050] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="สุ่มกระจายทีมทั้งหมดลงในแต่ละกลุ่มอย่างเท่ากัน"
          >
            <Dices className="w-4 h-4" />
            <span>สุ่มจับสลาก</span>
          </button>

          <button
            type="button"
            onClick={onResetGroups}
            disabled={assignedCount === 0}
            className="px-3 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            title="นำทุกทีมออกจากกลุ่มกลับสู่ถังพัก"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ล้างกลุ่ม</span>
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
                <span>บันทึกการจัดกลุ่ม</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#f4f3ef]">
        <div className="bg-[#fcfbf9] rounded-2xl p-3 border border-[#efeded]">
          <span className="text-[11px] font-medium text-[#7d7765] block">ทีมทั้งหมด</span>
          <span className="text-lg font-bold font-display text-[#1b1c1c]">{totalTeams} ทีม</span>
        </div>
        <div className="bg-[#fcfbf9] rounded-2xl p-3 border border-[#efeded]">
          <span className="text-[11px] font-medium text-[#7d7765] block">จัดเข้ากลุ่มแล้ว</span>
          <span className="text-lg font-bold font-display text-emerald-600">
            {assignedCount} / {totalTeams}
          </span>
        </div>
        <div className="bg-[#fcfbf9] rounded-2xl p-3 border border-[#efeded]">
          <span className="text-[11px] font-medium text-[#7d7765] block">ทีมยังไม่มีกลุ่ม</span>
          <span className="text-lg font-bold font-display text-amber-600">
            {totalTeams - assignedCount} ทีม
          </span>
        </div>
        <div className="bg-[#fcfbf9] rounded-2xl p-3 border border-[#efeded]">
          <span className="text-[11px] font-medium text-[#7d7765] block">จำนวนกลุ่ม</span>
          <span className="text-lg font-bold font-display text-[#1b1c1c]">{groupsCount} กลุ่ม</span>
        </div>
      </div>
    </div>
  );
};
