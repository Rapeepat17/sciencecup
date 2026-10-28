import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, MapPin, Check } from 'lucide-react';
import { Match } from '../../../../types';

interface MatchTimeVenueModalProps {
  isOpen: boolean;
  match: Match | null;
  onClose: () => void;
  onApply: (
    matchId: string,
    payload: { timeStr: string; dateStr: string; venue: string }
  ) => void;
}

export const MatchTimeVenueModal: React.FC<MatchTimeVenueModalProps> = ({
  isOpen,
  match,
  onClose,
  onApply,
}) => {
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [venue, setVenue] = useState('');

  useEffect(() => {
    if (match && isOpen) {
      setDateStr(match.dateStr && match.dateStr !== 'TBD' ? match.dateStr : '');
      setTimeStr(match.timeStr && match.timeStr !== 'TBD' ? match.timeStr : '16:00');
      setVenue(match.venue || 'สนาม 1');
    }
  }, [match, isOpen]);

  if (!isOpen || !match) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(match.id, {
      dateStr: dateStr.trim() || 'TBD',
      timeStr: timeStr.trim() || 'TBD',
      venue: venue.trim() || 'สนาม 1',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                ตั้งวัน เวลา และสนามแข่งขัน
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                {match.team1?.name} vs {match.team2?.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
              วันที่แข่งขัน (เช่น วันเสาร์ที่ 24 ตุลาคม 2026)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                placeholder="เช่น วันเสาร์ที่ 24 ตุลาคม 2026"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
              เวลาแข่งขัน (24 ชั่วโมง)
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
              สนามแข่งขัน (Venue / Pitch)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="เช่น สนาม 1 (เมนสเตเดียม)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#1b1c1c] text-[#ffe680] hover:bg-black transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>ตกลง (รอกดบันทึกตาราง)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

