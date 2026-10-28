import React from 'react';
import { Zap, Plus } from 'lucide-react';

interface MatchEmptyStateProps {
  canAutoGenerate: boolean;
  onAutoGenerate: () => void;
  onOpenCreateMatch: () => void;
}

export const MatchEmptyState: React.FC<MatchEmptyStateProps> = ({
  canAutoGenerate,
  onAutoGenerate,
  onOpenCreateMatch,
}) => {
  return (
    <div className="bg-white rounded-3xl p-12 text-center text-[#4b4737] border border-[#efeded] shadow-xs space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-[#ffe680]/40 border border-[#ffe680] text-[#786607] flex items-center justify-center mx-auto">
        <Zap className="w-8 h-8" />
      </div>
      <div className="space-y-1 max-w-md mx-auto">
        <h3 className="font-display font-bold text-lg text-[#1b1c1c]">
          ยังไม่มีโปรแกรมการแข่งขันในระบบ
        </h3>
        <p className="text-xs text-[#7d7765] leading-relaxed">
          {canAutoGenerate
            ? 'คุณสามารถกดสร้างโปรแกรมแข่งขันรอบแบ่งกลุ่มอัตโนมัติจากกลุ่มที่มีอยู่ หรือเพิ่มคู่แข่งขันเอง แล้วกด "บันทึกตารางการแข่งขัน"'
            : 'กรุณาจัดทีมลงกลุ่มในเมนู "จัดกลุ่มการแข่งขัน" อย่างน้อย 2 ทีมต่อกลุ่ม เพื่อสร้างโปรแกรมอัตโนมัติ หรือกดเพิ่มคู่แข่งขันเอง'}
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        {canAutoGenerate && (
          <button
            type="button"
            onClick={onAutoGenerate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b1c1c] text-[#ffe680] font-display font-bold text-xs shadow-md hover:bg-black transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-[#ffe680]" />
            <span>สร้างโปรแกรมแข่งขันรอบแบ่งกลุ่มอัตโนมัติ</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenCreateMatch}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f4f3ef] hover:bg-[#eae8e1] text-[#1b1c1c] border border-[#e5e3dc] font-display font-bold text-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#786607]" />
          <span>เพิ่มคู่แข่งขันเอง</span>
        </button>
      </div>
    </div>
  );
};

