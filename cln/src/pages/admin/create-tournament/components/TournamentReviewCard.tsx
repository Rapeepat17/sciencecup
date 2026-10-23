import React from 'react';
import { Trophy, Calendar, GitFork, FileText } from 'lucide-react';

export interface TournamentReviewCardProps {
  name: string;
  description: string;
  logo?: string;
  startDate: string;
  endDate: string;
  knockoutStartingRound: 'qf' | 'sf' | 'final';
}

export const TournamentReviewCard: React.FC<TournamentReviewCardProps> = ({
  name,
  description,
  logo,
  startDate,
  endDate,
  knockoutStartingRound,
}) => {
  const getRoundLabel = (round: 'qf' | 'sf' | 'final') => {
    switch (round) {
      case 'qf':
        return 'รอบ 8 ทีมสุดท้าย (Quarter-Finals)';
      case 'sf':
        return 'รอบรองชนะเลิศ (Semi-Finals)';
      case 'final':
        return 'รอบชิงชนะเลิศ (Final Only)';
      default:
        return 'รอบรองชนะเลิศ (Semi-Finals)';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-2xs space-y-5">
      {/* Header */}
      <div className="pb-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-[#1b1c1c]">
            ตรวจสอบข้อมูลการแข่งขัน
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            สรุปข้อมูลที่กรอกก่อนยืนยันบันทึกเข้าสู่ระบบ
          </p>
        </div>
      </div>

      {/* Review Items */}
      <div className="space-y-3">
        {/* Name Block with Logo */}
        <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200/60 flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 text-[#786607] flex items-center justify-center shrink-0 shadow-2xs mt-0.5 overflow-hidden p-1">
            {logo ? (
              <img
                src={logo}
                alt="Tournament Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <Trophy className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-gray-500">ชื่อการแข่งขัน</span>
              {logo && (
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded-md">
                  แนบโลโก้แล้ว
                </span>
              )}
            </div>
            <p className="font-display font-bold text-base text-[#1b1c1c] truncate mt-0.5">
              {name || '-'}
            </p>
          </div>
        </div>

        {/* Dates */}
        <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200/60 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-gray-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-gray-500 block">ช่วงเวลาการแข่งขัน</span>
            <p className="text-sm font-bold text-[#1b1c1c] mt-0.5">
              {startDate ? `${startDate} ${endDate ? `ถึง ${endDate}` : ''}` : 'ยังไม่ได้ระบุวันที่'}
            </p>
          </div>
        </div>

        {/* Knockout Round */}
        <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200/60 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-gray-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <GitFork className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-gray-500 block">รูปแบบรอบน็อคเอาท์</span>
            <p className="text-sm font-bold text-[#1b1c1c] mt-0.5">
              {getRoundLabel(knockoutStartingRound)}
            </p>
          </div>
        </div>

        {/* Description Block */}
        {description ? (
          <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/60 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-gray-500 block">รายละเอียด / วัตถุประสงค์</span>
              <p className="text-xs text-gray-700 leading-relaxed mt-1">
                {description}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
