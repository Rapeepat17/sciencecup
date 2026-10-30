import React from 'react';
import { Users, CalendarCheck, Radio, Trophy } from 'lucide-react';

export interface DashboardStats {
  totalTeams: number;
  totalGroups: number;
  totalMatches: number;
  completedMatches: number;
  liveMatches: number;
  totalGoals: number;
}

interface DashboardStatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({
  stats,
  isLoading = false,
}) => {
  const completionPercentage =
    stats.totalMatches > 0
      ? Math.round((stats.completedMatches / stats.totalMatches) * 100)
      : 0;

  const avgGoalsPerMatch =
    stats.completedMatches > 0
      ? (stats.totalGoals / stats.completedMatches).toFixed(1)
      : '0.0';

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-[#efeded] p-5 shadow-2xs animate-pulse"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100" />
              <div className="w-16 h-4 rounded-md bg-gray-100" />
            </div>
            <div className="w-20 h-7 rounded-md bg-gray-200 mb-2" />
            <div className="w-28 h-3 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. การ์ดจำนวนทีม */}
      <div className="bg-white rounded-2xl border border-[#efeded] p-5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#ffe680]/30 border border-[#ffe680] text-[#786607] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-[#7d7765] bg-[#f8f7f5] px-2.5 py-1 rounded-full border border-[#efeded]">
            {stats.totalGroups > 0 ? `${stats.totalGroups} กลุ่ม` : 'ยังไม่จัดกลุ่ม'}
          </span>
        </div>
        <div className="text-2xl font-bold font-display text-[#1b1c1c]">
          {stats.totalTeams}{' '}
          <span className="text-sm font-normal text-[#7d7765]">ทีม</span>
        </div>
        <p className="text-xs text-[#7d7765] mt-1">ทีมทั้งหมดในทัวร์นาเมนต์</p>
      </div>

      {/* 2. การ์ดแมตช์ที่แข่งแล้ว */}
      <div className="bg-white rounded-2xl border border-[#efeded] p-5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            {completionPercentage}%
          </span>
        </div>
        <div className="text-2xl font-bold font-display text-[#1b1c1c]">
          {stats.completedMatches}{' '}
          <span className="text-sm font-normal text-[#7d7765]">
            / {stats.totalMatches} นัด
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-[#f0eee9] h-1.5 rounded-full mt-2.5 overflow-hidden">
          <div
            className="bg-blue-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(completionPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* 3. การ์ดแมตช์ที่กำลังแข่งสด */}
      <div className="bg-white rounded-2xl border border-[#efeded] p-5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              stats.liveMatches > 0
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
          >
            <Radio
              className={`w-5 h-5 ${
                stats.liveMatches > 0 ? 'animate-pulse' : ''
              }`}
            />
          </div>
          {stats.liveMatches > 0 ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              ถ่ายทอดสด
            </span>
          ) : (
            <span className="text-xs font-medium text-[#7d7765] bg-[#f8f7f5] px-2.5 py-1 rounded-full border border-[#efeded]">
              ไม่มีคู่สด
            </span>
          )}
        </div>
        <div className="text-2xl font-bold font-display text-[#1b1c1c]">
          {stats.liveMatches}{' '}
          <span className="text-sm font-normal text-[#7d7765]">คู่</span>
        </div>
        <p className="text-xs text-[#7d7765] mt-1">กำลังแข่งขันอยู่ในขณะนี้</p>
      </div>

      {/* 4. การ์ดประตูรวม */}
      <div className="bg-white rounded-2xl border border-[#efeded] p-5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            เฉลี่ย {avgGoalsPerMatch} ลูก/นัด
          </span>
        </div>
        <div className="text-2xl font-bold font-display text-[#1b1c1c]">
          {stats.totalGoals}{' '}
          <span className="text-sm font-normal text-[#7d7765]">ประตู</span>
        </div>
        <p className="text-xs text-[#7d7765] mt-1">ประตูรวมทั้งทัวร์นาเมนต์</p>
      </div>
    </div>
  );
};

