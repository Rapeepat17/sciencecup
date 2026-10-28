import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Calendar, Clock, MapPin } from 'lucide-react';
import { Team } from '../../../../types';
import { KnockoutStartingRound, getTournamentRoundItems } from './MatchFilterBar';

export interface CreateMatchDraftInput {
  homeTeamId: string;
  awayTeamId: string;
  groupName: string | null;
  roundName: string;
  stage: 'group' | 'knockout';
  dateStr: string;
  timeStr: string;
  venue: string;
}

interface CreateMatchModalProps {
  isOpen: boolean;
  teams: Team[];
  groupNames: string[];
  knockoutStartingRound?: KnockoutStartingRound;
  onClose: () => void;
  onAddMatch: (input: CreateMatchDraftInput) => void;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  teams,
  groupNames,
  knockoutStartingRound = 'sf',
  onClose,
  onAddMatch,
}) => {
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [roundName, setRoundName] = useState('รอบแบ่งกลุ่ม (Group Stage)');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('16:00');
  const [venue, setVenue] = useState('สนาม 1');
  const [error, setError] = useState<string | null>(null);

  const availableRounds = useMemo(
    () => getTournamentRoundItems(knockoutStartingRound).filter((r) => r.id !== 'all'),
    [knockoutStartingRound]
  );

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (teams.length >= 2) {
        setHomeTeamId(String(teams[0].id));
        setAwayTeamId(String(teams[1].id));
      } else if (teams.length === 1) {
        setHomeTeamId(String(teams[0].id));
        setAwayTeamId('');
      }
      if (groupNames.length > 0) {
        setGroupName(groupNames[0]);
      } else {
        setGroupName('A');
      }
      setRoundName('รอบแบ่งกลุ่ม (Group Stage)');
    }
  }, [isOpen, teams, groupNames]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeamId || !awayTeamId) {
      setError('กรุณาเลือกทั้งทีมเหย้าและทีมเยือน');
      return;
    }
    if (homeTeamId === awayTeamId) {
      setError('ทีมเหย้าและทีมเยือนต้องไม่ใช่ทีมเดียวกัน');
      return;
    }

    const isGroupStage = roundName.includes('รอบแบ่งกลุ่ม');
    onAddMatch({
      homeTeamId,
      awayTeamId,
      groupName: isGroupStage && groupName ? groupName.replace('Group ', '').trim() : null,
      roundName,
      stage: isGroupStage ? 'group' : 'knockout',
      dateStr: dateStr.trim() || 'TBD',
      timeStr: timeStr.trim() || 'TBD',
      venue: venue.trim() || 'สนาม 1',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-[28px] w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1b1c1c] text-[#ffe680] flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                เพิ่มคู่แข่งขันใหม่เข้าตาราง
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                กำหนดคู่แข่งขัน รอบ กลุ่ม วัน เวลา และสนาม
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
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                ทีมเหย้า (Home Team)
              </label>
              <select
                value={homeTeamId}
                onChange={(e) => setHomeTeamId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
              >
                <option value="">-- เลือกทีมเหย้า --</option>
                {teams.map((t) => (
                  <option key={String(t.id)} value={String(t.id)}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                ทีมเยือน (Away Team)
              </label>
              <select
                value={awayTeamId}
                onChange={(e) => setAwayTeamId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
              >
                <option value="">-- เลือกทีมเยือน --</option>
                {teams.map((t) => (
                  <option key={String(t.id)} value={String(t.id)}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                รอบการแข่งขัน
              </label>
              <select
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
              >
                {availableRounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id === 'รอบแบ่งกลุ่ม (Group Stage)' ? 'รอบแบ่งกลุ่ม' : r.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                กลุ่ม (ถ้าเป็นรอบแบ่งกลุ่ม)
              </label>
              <select
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={!roundName.includes('รอบแบ่งกลุ่ม')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680] disabled:opacity-50"
              >
                <option value="">ไม่ระบุกลุ่ม</option>
                {groupNames.map((g) => (
                  <option key={g} value={g}>
                    {g.startsWith('กลุ่ม') || g.startsWith('สาย') || g.startsWith('Group')
                      ? g
                      : `กลุ่ม ${g}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                วันที่แข่ง
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  placeholder="เช่น 25 ต.ค. 2026"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                เวลาแข่ง
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                สนามแข่ง
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="สนาม 1"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                />
              </div>
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
              <Plus className="w-4 h-4" />
              <span>เพิ่มเข้าตาราง</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
