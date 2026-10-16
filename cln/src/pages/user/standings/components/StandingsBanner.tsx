import React from 'react';
import { Award } from 'lucide-react';

export interface StandingsBannerProps {
  title?: string;
  subtitle?: string;
  qualificationNote?: string;
}

export const StandingsBanner: React.FC<StandingsBannerProps> = ({
  title = 'ตารางคะแนนรอบแบ่งกลุ่ม',
  subtitle = 'สรุปอันดับคะแนนแบบเรียลไทม์',
  qualificationNote = 'อันดับ 1-2 ของแต่ละกลุ่มผ่านเข้าสู่รอบ 8 ทีม',
}) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-[#efeded] p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left: Title & Subtitle */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#b45309]">
          <Award className="w-4 h-4 text-[#d97706]" />
          <span>{subtitle}</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-[#1b1c1c] tracking-tight">
          {title}
        </h1>

        <p className="text-xs text-[#7d7765]">
          {qualificationNote}
        </p>
      </div>

      {/* Right: Qualification Legend Pill */}
      <div className="self-start sm:self-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#e8f8ef] text-[#16a34a] border border-[#bbf7d0] shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
          อันดับ 1-2 โซนเข้ารอบ 8 ทีม
        </span>
      </div>
    </div>
  );
};
