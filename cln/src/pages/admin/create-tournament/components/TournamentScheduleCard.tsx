import React from 'react';
import { Calendar, GitFork, Check } from 'lucide-react';

export interface TournamentScheduleCardProps {
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  knockoutStartingRound: 'qf' | 'sf' | 'final';
  onKnockoutStartingRoundChange: (value: 'qf' | 'sf' | 'final') => void;
}

export const TournamentScheduleCard: React.FC<TournamentScheduleCardProps> = ({
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  knockoutStartingRound,
  onKnockoutStartingRoundChange,
}) => {
  const knockoutRounds = [
    {
      id: 'qf' as const,
      label: 'รอบ 8 ทีมสุดท้าย',
      subtitle: 'Quarter-Finals',
      detail: 'คัดเลือก 8 ทีมเข้าสู่รอบน็อคเอาท์',
    },
    {
      id: 'sf' as const,
      label: 'รอบรองชนะเลิศ',
      subtitle: 'Semi-Finals',
      detail: 'คัดเลือก 4 ทีมเข้าสู่รอบรองชนะเลิศ',
    },
    {
      id: 'final' as const,
      label: 'รอบชิงชนะเลิศ',
      subtitle: 'Final Only',
      detail: 'มีเฉพาะนัดชิงชนะเลิศ 2 ทีม',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-2xs space-y-5">
      {/* Card Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 text-[#786607] flex items-center justify-center shrink-0 shadow-2xs">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-display font-bold text-base text-[#1b1c1c]">
            กำหนดการและรูปแบบการแข่งขัน
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            กำหนดช่วงเวลาการแข่งขันและรอบของสายแข่งน็อคเอาท์
          </p>
        </div>
      </div>

      {/* Date Range Grid */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-[#1b1c1c]">
          ช่วงเวลาจัดการแข่งขัน
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="text-[11px] text-[#7d7765] font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#786607]" /> วันที่เริ่มต้น
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200/90 bg-[#fbfbfb] text-sm text-[#1b1c1c] font-medium focus:bg-white focus:outline-hidden focus:border-[#facc15] focus:ring-4 focus:ring-[#ffe680]/30 transition-all shadow-2xs cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] text-[#7d7765] font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#786607]" /> วันที่สิ้นสุด
            </span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200/90 bg-[#fbfbfb] text-sm text-[#1b1c1c] font-medium focus:bg-white focus:outline-hidden focus:border-[#facc15] focus:ring-4 focus:ring-[#ffe680]/30 transition-all shadow-2xs cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Knockout Round Starting Selection */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-[#1b1c1c] flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-[#786607]" />
            <span>รอบเริ่มต้นของสายแข่งน็อคเอาท์</span>
          </label>
          <span className="text-[11px] text-[#7d7765]">เลือกรูปแบบผังสายแข่ง</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {knockoutRounds.map((item) => {
            const isSelected = knockoutStartingRound === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onKnockoutStartingRoundChange(item.id)}
                className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#fefdf5] border-[#ffe680] ring-2 ring-[#ffe680]/60 shadow-xs'
                    : 'bg-[#fbfbfb] border-gray-200/80 hover:bg-[#f4f4f5] hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#786607]">
                    {item.subtitle}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-[#ffe680] border-[#786607] text-[#786607]'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold text-[#1b1c1c]">{item.label}</p>
                  <p className="text-[11px] text-[#7d7765] mt-0.5 leading-snug">
                    {item.detail}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
