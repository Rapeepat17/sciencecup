import React, { useState } from 'react';
import { X, Clock, Calendar, MapPin, Sparkles } from 'lucide-react';

export interface AutoScheduleConfig {
  startDate: string;
  startTime: string;
  matchIntervalMinutes: number;
  matchesPerDay: number;
  venues: string[];
}

interface AutoScheduleModalProps {
  isOpen: boolean;
  totalMatches: number;
  onClose: () => void;
  onApply: (config: AutoScheduleConfig) => void;
}

export const AutoScheduleModal: React.FC<AutoScheduleModalProps> = ({
  isOpen,
  totalMatches,
  onClose,
  onApply,
}) => {
  const todayIso = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayIso);
  const [startTime, setStartTime] = useState('16:00');
  const [matchIntervalMinutes, setMatchIntervalMinutes] = useState(60);
  const [matchesPerDay, setMatchesPerDay] = useState(4);
  const [venuesText, setVenuesText] = useState('สนาม 1, สนาม 2');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const venues = venuesText
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    onApply({
      startDate,
      startTime,
      matchIntervalMinutes: Math.max(15, Number(matchIntervalMinutes) || 60),
      matchesPerDay: Math.max(1, Number(matchesPerDay) || 4),
      venues: venues.length > 0 ? venues : ['สนาม 1'],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-[28px] w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                ตั้งเวลาและสนามแข่งขันอัตโนมัติ
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                จัดสรรวัน เวลา และสนามให้ทั้ง {totalMatches} คู่ตามลำดับในตาราง
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                วันเริ่มการแข่งขันวันแรก
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                เวลาเริ่มคู่แรกของแต่ละวัน
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                ระยะห่างระหว่างคู่ (นาที)
              </label>
              <input
                type="number"
                min={15}
                max={240}
                step={5}
                value={matchIntervalMinutes}
                onChange={(e) => setMatchIntervalMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                จำนวนคู่แข่งขันสูงสุดต่อวัน
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={matchesPerDay}
                onChange={(e) => setMatchesPerDay(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
              รายชื่อสนามแข่งขัน (คั่นด้วยเครื่องหมายจุลภาค , )
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={venuesText}
                onChange={(e) => setVenuesText(e.target.value)}
                placeholder="เช่น สนาม 1, สนาม 2"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              ระบบจะสลับสนามแข่งขันให้แต่ละคู่อัตโนมัติตามลำดับ
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-slate-900 text-primary hover:bg-slate-800 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>คำนวณวัน-เวลาอัตโนมัติ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

