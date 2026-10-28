import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarDays,
  Zap,
  SlidersHorizontal,
  FileSpreadsheet,
  Plus,
  Trash2,
  Save,
  Loader2,
  ChevronDown,
} from 'lucide-react';

interface MatchHeaderProps {
  tournamentName?: string;
  totalMatches: number;
  totalDays: number;
  totalGroups: number;
  totalVenues: number;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  canAutoGenerate: boolean;
  onOpenCreateMatch: () => void;
  onAutoGenerateFixtures: () => void;
  onOpenAutoSchedule: () => void;
  onExportExcel: () => void;
  onOpenClearModal: () => void;
  onSave: () => void;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({
  tournamentName,
  totalMatches,
  totalDays,
  totalGroups,
  totalVenues,
  isSaving,
  hasUnsavedChanges,
  canAutoGenerate,
  onOpenCreateMatch,
  onAutoGenerateFixtures,
  onOpenAutoSchedule,
  onExportExcel,
  onOpenClearModal,
  onSave,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-[#efeded] p-6 shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ffe680]/60 text-[#786607] border border-[#ffe680] inline-flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              <span>{tournamentName || 'Tournament'}</span>
            </span>
            {hasUnsavedChanges && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold font-display text-[#1b1c1c] tracking-tight">
            จัดตารางการแข่งขัน
          </h1>
          <p className="text-xs text-[#7d7765] mt-0.5">
            สร้างโปรแกรมการแข่งขัน ลากสลับลำดับคู่ ตั้งค่าวัน-เวลา และกำหนดสนามแข่งขันก่อนกดบันทึก
          </p>
        </div>

        {/* Clean Action Bar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenCreateMatch}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#f4f3ef] hover:bg-[#eae8e1] text-[#1b1c1c] border border-[#e5e3dc] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#786607]" />
            <span>เพิ่มคู่แข่ง</span>
          </button>

          <button
            type="button"
            onClick={onAutoGenerateFixtures}
            disabled={!canAutoGenerate}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#ffe680] to-[#f5d95b] hover:from-[#fdd835] hover:to-[#fbc02d] text-[#594902] shadow-xs border border-[#eed050] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="สร้างตารางพบกันหมดจากกลุ่มที่มีอยู่ในระบบอัตโนมัติ"
          >
            <Zap className="w-4 h-4" />
            <span>สร้างตารางอัตโนมัติ</span>
          </button>

          {/* Tools Dropdown (Only active when matches exist) */}
          {totalMatches > 0 && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-[#f5f3f3] text-[#1b1c1c] border border-[#e5e3dc] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#786607]" />
                <span>เครื่องมือจัดการ</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#7d7765] transition-transform ${
                    isMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#efeded] shadow-xl py-1.5 z-30 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAutoSchedule();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-[#1b1c1c] hover:bg-[#f8f7f4] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-[#786607]" />
                    <span>ตั้งวัน-เวลาและสนามอัตโนมัติ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onExportExcel();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-emerald-700 hover:bg-emerald-50/60 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>ส่งออกตาราง (Export Excel)</span>
                  </button>

                  <div className="my-1 border-t border-[#f4f3ef]" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenClearModal();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>ล้างตารางการแข่งขันทั้งหมด</span>
                  </button>
                </div>
              )}
            </div>
          )}

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
                <span>บันทึกตาราง</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick schedule stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#f4f3ef]">
        <div className="bg-[#fcfbf9] rounded-2xl p-3 border border-[#efeded]">
          <span className="text-[11px] font-medium text-[#7d7765] block">จำนวนคู่แข่งขันทั้งหมด</span>
          <span className="text-lg font-bold font-display text-[#1b1c1c]">{totalMatches} คู่</span>
        </div>
        <div className="bg-[#fcfbf9] rounded-2xl p-3 border border-[#efeded]">
          <span className="text-[11px] font-medium text-[#7d7765] block">จำนวนสาย / กลุ่ม</span>
          <span className="text-lg font-bold font-display text-[#786607]">{totalGroups} กลุ่ม</span>
        </div>
        <div className="bg-[#fcfbf9] rounded-2xl p-3 border border-[#efeded]">
          <span className="text-[11px] font-medium text-[#7d7765] block">จำนวนวันที่มีโปรแกรม</span>
          <span className="text-lg font-bold font-display text-emerald-600">{totalDays} วัน</span>
        </div>
        <div className="bg-[#fcfbf9] rounded-2xl p-3 border border-[#efeded]">
          <span className="text-[11px] font-medium text-[#7d7765] block">สนามแข่งขันที่ใช้</span>
          <span className="text-lg font-bold font-display text-[#1b1c1c]">{totalVenues} สนาม</span>
        </div>
      </div>
    </div>
  );
};
