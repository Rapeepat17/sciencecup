import React from 'react';
import { Trophy, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { TournamentItem } from '../../../../types';

export interface TournamentRecentListProps {
  tournaments: TournamentItem[];
  isLoading: boolean;
  onRefresh?: () => void;
  onViewAll?: () => void;
}

export const TournamentRecentList: React.FC<TournamentRecentListProps> = ({
  tournaments,
  isLoading,
  onRefresh,
  onViewAll,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50/80 border border-amber-200/60 text-[#786607] flex items-center justify-center shrink-0 shadow-2xs">
            <Trophy className="w-5 h-5 text-[#b45309]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-base sm:text-lg text-[#1b1c1c]">
                ทัวร์นาเมนต์ทั้งหมดในระบบ
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {tournaments.length} รายการ
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              รายการการแข่งขันที่ถูกสร้างและพร้อมใช้งานในระบบ
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onViewAll) {
              onViewAll();
            } else {
              try {
                localStorage.setItem('scicup_app_mode', 'admin');
                localStorage.setItem('scicup_active_view', 'tournaments');
              } catch {}
              window.location.hash = '#tournaments';
            }
          }}
          className="self-start sm:self-auto px-4 py-2 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-[#1b1c1c] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs group"
          title="ดูรายการทัวร์นาเมนต์ทั้งหมด"
        >
          <span>ดูทั้งหมด</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#786607] group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center text-gray-500 gap-2.5">
          <Loader2 className="w-6 h-6 animate-spin text-[#786607]" />
          <span className="text-xs font-medium text-gray-600">กำลังดึงข้อมูลทัวร์นาเมนต์ล่าสุด...</span>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-500 bg-[#fbfbfb] rounded-xl border border-dashed border-gray-200 p-6 space-y-1.5">
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-400 mx-auto flex items-center justify-center shadow-2xs">
            <Trophy className="w-5 h-5 text-gray-400" />
          </div>
          <p className="font-bold text-[#1b1c1c]">ยังไม่มีทัวร์นาเมนต์ในระบบ</p>
          <p className="text-[11px] text-gray-400">เมื่อคุณสร้างทัวร์นาเมนต์ใหม่ รายการจะมาปรากฏที่นี่โดยอัตโนมัติ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => {
            return (
              <div
                key={t.id}
                className="w-full p-4 sm:p-5 rounded-xl border border-gray-200/90 bg-white hover:border-amber-300/80 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left group"
              >
                {/* Left: Thumbnail & Main Info */}
                <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                  <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
                    {t.logo ? (
                      <img
                        src={t.logo}
                        alt={t.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Trophy className="w-6 h-6 text-[#b45309]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display font-bold text-base text-[#1b1c1c] tracking-tight truncate">
                        {t.name}
                      </h4>
                    </div>

                    {t.description ? (
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {t.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Right: Status / Active Indicator */}
                <div className="shrink-0 flex items-center justify-end sm:border-l sm:border-gray-100 sm:pl-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50/70 border border-emerald-200/60 px-3 py-1.5 rounded-xl shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>พร้อมจัดการแข่งขัน</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
