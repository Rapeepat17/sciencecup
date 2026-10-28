import React from 'react';
import {
  Award,
  RefreshCw,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { TournamentStandingsSummary } from '../../../../services/standingsService';

interface StandingsHeaderProps {
  tournamentName?: string;
  summary: TournamentStandingsSummary;
  isRefreshing: boolean;
  onRefresh: () => void;
  onExportExcel: () => void;
}

export const StandingsHeader: React.FC<StandingsHeaderProps> = ({
  tournamentName,
  summary,
  isRefreshing,
  onRefresh,
  onExportExcel,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-[#efeded] p-6 shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ffe680]/60 text-[#786607] border border-[#ffe680] inline-flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span>{tournamentName || 'Tournament'}</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold font-display text-[#1b1c1c] tracking-tight">
            ตารางคะแนนรอบแบ่งกลุ่ม
          </h1>
          <p className="text-xs text-[#7d7765] mt-0.5">
            สรุปคะแนน อันดับทีม ประตูได้เสีย และผลงานในรอบแบ่งกลุ่ม (คำนวณจากระบบหลังบ้าน)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#f4f3ef] hover:bg-[#eae8e1] text-[#1b1c1c] border border-[#e5e3dc] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isRefreshing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#786607]" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-[#786607]" />
            )}
            <span>รีเฟรชข้อมูล</span>
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            disabled={summary.totalGroups === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>ส่งออกตารางคะแนน (Excel)</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Strip (from Backend) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#f4f3ef]">
        <div className="bg-[#fcfbf9] rounded-2xl p-3 border border-[#efeded]">
          <span className="text-[11px] font-medium text-[#7d7765] block">จำนวนสาย / กลุ่ม</span>
          <span className="text-lg font-bold font-display text-[#1b1c1c]">
            {summary.totalGroups} กลุ่ม ({summary.totalTeamsInGroups} ทีม)
          </span>
        </div>
        <div className="bg-[#fcfbf9] rounded-2xl p-3 border border-[#efeded]">
          <span className="text-[11px] font-medium text-[#7d7765] block">แมตช์รอบแบ่งกลุ่มทั้งหมด</span>
          <span className="text-lg font-bold font-display text-[#786607]">
            {summary.totalMatches} คู่
          </span>
        </div>
        <div className="bg-[#fcfbf9] rounded-2xl p-3 border border-[#efeded]">
          <span className="text-[11px] font-medium text-[#7d7765] block">แข่งขันจบแล้ว</span>
          <span className="text-lg font-bold font-display text-emerald-600">
            {summary.completedMatches} / {summary.totalMatches} คู่
          </span>
        </div>
        <div className="bg-[#fcfbf9] rounded-2xl p-3 border border-[#efeded]">
          <span className="text-[11px] font-medium text-[#7d7765] block">จำนวนประตูรวมในรอบแบ่งกลุ่ม</span>
          <span className="text-lg font-bold font-display text-[#1b1c1c]">
            {summary.totalGoals} ประตู
          </span>
        </div>
      </div>
    </div>
  );
};

