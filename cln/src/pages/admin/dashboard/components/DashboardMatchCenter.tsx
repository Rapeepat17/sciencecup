import React, { useState, useMemo } from 'react';
import {
  Swords,
  Clock,
  MapPin,
  Edit3,
  CheckCircle2,
  Play,
  RotateCcw,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Match, MatchStatus } from '../../../../types';
import { TeamLogo } from '../../../../components/TeamLogo';

interface DashboardMatchCenterProps {
  matches: Match[];
  onOpenScoreModal: (match: Match) => void;
  onQuickStatusChange?: (match: Match, newStatus: MatchStatus) => void;
  onNavigateToMatches?: () => void;
}

type TabType = 'LIVE' | 'TODAY' | 'UPCOMING' | 'FINISHED' | 'ALL';

const formatGoalScorersDisplay = (raw?: string) => {
  if (!raw || !raw.trim()) return '';

  const numbers = raw
    .split(',')
    .map((s) => {
      const match = s.match(/\d+/);
      return match ? match[0] : s.trim().replace(/^ผู้เล่นหมายเลข\s*|^เบอร์\s*/, '');
    })
    .filter(Boolean);

  if (numbers.length > 0) {
    return `เบอร์ ${numbers.join(', ')}`;
  }

  return raw.replace(/⚽/g, '').trim();
};

export const DashboardMatchCenter: React.FC<DashboardMatchCenterProps> = ({
  matches,
  onOpenScoreModal,
  onQuickStatusChange,
  onNavigateToMatches,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('LIVE');

  // ตรวจสอบแมตช์วันนี้
  const todayStr = useMemo(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  // นับจำนวนในแต่ละแท็บ
  const counts = useMemo(() => {
    let live = 0;
    let today = 0;
    let upcoming = 0;
    let finished = 0;

    matches.forEach((m) => {
      const status = (m.status || '').toUpperCase();
      if (status === 'LIVE') live++;
      else if (status === 'FT' || status === 'FINISHED' || status === 'COMPLETED') finished++;
      else if (status === 'UPCOMING' || status === 'SCHEDULED') upcoming++;

      if (m.dateStr === todayStr) today++;
    });

    return { live, today, upcoming, finished, all: matches.length };
  }, [matches, todayStr]);

  // ตั้งค่าเริ่มต้นของ Tab: ถ้ามีคู่ Live ให้เปิด Live ก่อน ถ้าไม่มีให้เปิด Today หรือ Upcoming
  React.useEffect(() => {
    if (counts.live > 0) {
      setActiveTab('LIVE');
    } else if (counts.today > 0) {
      setActiveTab('TODAY');
    } else if (counts.upcoming > 0) {
      setActiveTab('UPCOMING');
    } else {
      setActiveTab('ALL');
    }
  }, [counts.live, counts.today, counts.upcoming]);

  // กรองแมตช์ตาม Tab
  const filteredMatches = useMemo(() => {
    switch (activeTab) {
      case 'LIVE':
        return matches.filter((m) => (m.status || '').toUpperCase() === 'LIVE');
      case 'TODAY':
        return matches.filter(
          (m) =>
            m.dateStr === todayStr ||
            (m.status || '').toUpperCase() === 'LIVE'
        );
      case 'UPCOMING':
        return matches.filter(
          (m) =>
            (m.status || '').toUpperCase() === 'UPCOMING' ||
            (m.status || '').toUpperCase() === 'SCHEDULED'
        );
      case 'FINISHED':
        return matches.filter((m) => {
          const s = (m.status || '').toUpperCase();
          return s === 'FT' || s === 'FINISHED' || s === 'COMPLETED';
        });
      case 'ALL':
      default:
        return matches;
    }
  }, [matches, activeTab, todayStr]);

  return (
    <div className="bg-white rounded-2xl border border-[#efeded] p-5 sm:p-6 shadow-2xs space-y-5">
      {/* ส่วนหัว และปุ่มแท็บกรอง */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#efeded] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ffe680]/30 border border-[#ffe680] text-[#786607] flex items-center justify-center">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold font-display text-[#1b1c1c]">
              ศูนย์ควบคุมแมตช์ & อัปเดตผลการแข่งขัน
            </h2>
            <p className="text-xs text-[#7d7765]">
              ติดตามผลคะแนนสด และแก้ไขผลการแข่งขัน
            </p>
          </div>
        </div>

        {/* แถบ Tabs สำหรับกรอง */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('LIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'LIVE'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-[#f8f7f5] text-[#5c5746] hover:bg-[#efece6]'
            }`}
          >
            {counts.live > 0 && (
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            )}
            กำลังแข่ง
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'LIVE'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {counts.live}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('TODAY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'TODAY'
                ? 'bg-[#1b1c1c] text-white'
                : 'bg-[#f8f7f5] text-[#5c5746] hover:bg-[#efece6]'
            }`}
          >
            แมตช์วันนี้
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-200 text-gray-700">
              {counts.today}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'UPCOMING'
                ? 'bg-[#1b1c1c] text-white'
                : 'bg-[#f8f7f5] text-[#5c5746] hover:bg-[#efece6]'
            }`}
          >
            รอแข่ง
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-200 text-gray-700">
              {counts.upcoming}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('FINISHED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'FINISHED'
                ? 'bg-[#1b1c1c] text-white'
                : 'bg-[#f8f7f5] text-[#5c5746] hover:bg-[#efece6]'
            }`}
          >
            จบแล้ว
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-200 text-gray-700">
              {counts.finished}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'ALL'
                ? 'bg-[#1b1c1c] text-white'
                : 'bg-[#f8f7f5] text-[#5c5746] hover:bg-[#efece6]'
            }`}
          >
            ทั้งหมด ({counts.all})
          </button>
        </div>
      </div>

      {/* รายการแมตช์ (กรอบแสดงประมาณ 6 คู่ พร้อมแถบเลื่อน Scrollable) */}
      {filteredMatches.length === 0 ? (
        <div className="border border-dashed border-[#e2dfd5] rounded-xl p-8 text-center bg-[#faf9f6]/40">
          <Calendar className="w-8 h-8 text-[#a8a395] mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-[#1b1c1c]">
            ไม่มีรายการแข่งขันในหมวดนี้
          </h3>
          <p className="text-xs text-[#7d7765] mt-1 max-w-sm mx-auto">
            {activeTab === 'LIVE'
              ? 'ขณะนี้ยังไม่มีคู่ที่อยู่ในสถานะกำลังแข่งขัน (LIVE)'
              : activeTab === 'TODAY'
              ? 'ไม่มีโปรแกรมการแข่งขันที่ตรงกับวันปัจจุบัน'
              : 'ยังไม่มีข้อมูลการแข่งขันในตัวกรองที่เลือก'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* กรอบเลื่อนความสูงพอดีประมาณ 6 คู่ */}
          <div className="flex flex-col gap-2.5 max-h-[560px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scroll-smooth">
            {filteredMatches.map((m) => {
              const status = (m.status || '').toUpperCase();
              const isLive = status === 'LIVE';
              const isFinished =
                status === 'FT' || status === 'FINISHED' || status === 'COMPLETED';

              const groupOrRoundLabel =
                m.group && m.group !== 'Knockout'
                  ? m.group.startsWith('กลุ่ม') || m.group.startsWith('Group')
                    ? m.group
                    : `กลุ่ม ${m.group}`
                  : m.round || 'รอบทั่วไป';

              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border transition-all p-3 sm:px-5 sm:py-3 flex flex-col md:flex-row items-center justify-between gap-3 ${
                    isLive
                      ? 'border-rose-300 bg-rose-50/20 shadow-xs ring-1 ring-rose-200'
                      : 'border-[#efeded] bg-white hover:border-[#dfdcce] shadow-2xs'
                  }`}
                >
                  {/* 1. ข้อมูลแมตช์: กลุ่ม, เวลา, สนาม, สถานะ (ฝั่งซ้าย) */}
                  <div className="flex items-center gap-2.5 flex-shrink-0 w-full md:w-auto justify-between md:justify-start">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-[#f4f2ee] text-[#4d493a]">
                        {groupOrRoundLabel}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-[#1b1c1c] bg-[#faf9f6] px-2 py-1 rounded-lg border border-[#efeded]">
                        <Clock className="w-3 h-3 text-[#7d7765]" />
                        {m.timeStr || 'TBD'}
                      </span>
                    </div>

                    <span className="text-[11px] text-[#7d7765] hidden lg:flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#a8a395]" />
                      {m.venue || 'สนาม 1'}
                    </span>

                    {/* Status Badge */}
                    <div>
                      {isLive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          LIVE
                        </span>
                      ) : isFinished ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                          จบแล้ว (FT)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f0eee9] text-[#7d7765]">
                          รอแข่ง
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. คู่แข่งขันและสกอร์ตรงกลาง (จัดสมส่วน ไม่เว้นช่องว่างโหวงเหวง) */}
                  <div className="flex items-center justify-center gap-2.5 sm:gap-4 flex-1 max-w-xl mx-auto w-full my-1 md:my-0">
                    {/* ทีมเหย้า */}
                    <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                      <div className="text-right truncate">
                        <span className="text-xs sm:text-sm font-bold text-[#1b1c1c] truncate block">
                          {m.team1.name}
                        </span>
                        {m.goalPlayers1 && (
                          <span className="text-[10px] sm:text-[11px] text-[#786607] block truncate font-medium">
                            {formatGoalScorersDisplay(m.goalPlayers1)}
                          </span>
                        )}
                        {m.cardsT1 && (m.cardsT1.yellow > 0 || m.cardsT1.red > 0) && (
                          <div className="flex items-center justify-end gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                            {m.cardsT1.yellow > 0 && (
                              <span className="inline-flex items-center gap-0.5 font-semibold text-amber-800">
                                <span className="w-1.5 h-2.5 bg-amber-400 rounded-xs inline-block" />
                                {m.cardsT1.yellow}
                              </span>
                            )}
                            {m.cardsT1.red > 0 && (
                              <span className="inline-flex items-center gap-0.5 font-semibold text-rose-800">
                                <span className="w-1.5 h-2.5 bg-rose-500 rounded-xs inline-block" />
                                {m.cardsT1.red}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <TeamLogo
                        id={m.team1.id}
                        logo={m.team1.logo}
                        name={m.team1.name}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex-shrink-0"
                      />
                    </div>

                    {/* สกอร์ตรงกลาง */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="flex items-center gap-1.5 bg-[#f8f7f5] px-3 py-1 rounded-xl border border-[#efeded] shadow-2xs">
                        <span className="text-sm sm:text-base font-extrabold font-display text-[#1b1c1c] min-w-[16px] text-center">
                          {isLive || isFinished ? m.score1 : '-'}
                        </span>
                        <span className="text-xs text-[#a8a395] font-semibold">:</span>
                        <span className="text-sm sm:text-base font-extrabold font-display text-[#1b1c1c] min-w-[16px] text-center">
                          {isLive || isFinished ? m.score2 : '-'}
                        </span>
                      </div>
                      {(m.penaltyScore1 !== null && m.penaltyScore1 !== undefined) && (
                        <span className="text-[9px] text-[#7d7765] mt-0.5 font-medium">
                          (จุดโทษ {m.penaltyScore1}-{m.penaltyScore2})
                        </span>
                      )}
                    </div>

                    {/* ทีมเยือน */}
                    <div className="flex items-center justify-start gap-2 flex-1 min-w-0">
                      <TeamLogo
                        id={m.team2.id}
                        logo={m.team2.logo}
                        name={m.team2.name}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex-shrink-0"
                      />
                      <div className="text-left truncate">
                        <span className="text-xs sm:text-sm font-bold text-[#1b1c1c] truncate block">
                          {m.team2.name}
                        </span>
                        {m.goalPlayers2 && (
                          <span className="text-[10px] sm:text-[11px] text-[#786607] block truncate font-medium">
                            {formatGoalScorersDisplay(m.goalPlayers2)}
                          </span>
                        )}
                        {m.cardsT2 && (m.cardsT2.yellow > 0 || m.cardsT2.red > 0) && (
                          <div className="flex items-center justify-start gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                            {m.cardsT2.yellow > 0 && (
                              <span className="inline-flex items-center gap-0.5 font-semibold text-amber-800">
                                <span className="w-1.5 h-2.5 bg-amber-400 rounded-xs inline-block" />
                                {m.cardsT2.yellow}
                              </span>
                            )}
                            {m.cardsT2.red > 0 && (
                              <span className="inline-flex items-center gap-0.5 font-semibold text-rose-800">
                                <span className="w-1.5 h-2.5 bg-rose-500 rounded-xs inline-block" />
                                {m.cardsT2.red}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. ปุ่ม Action (ฝั่งขวา) */}
                  <div className="flex items-center gap-2 flex-shrink-0 justify-end w-full md:w-auto">
                    {/* ปุ่มสลับสถานะด่วน */}
                    {isLive ? (
                      <button
                        onClick={() =>
                          onQuickStatusChange && onQuickStatusChange(m, 'FT')
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
                        title="จบการแข่งขัน"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        จบเกม (FT)
                      </button>
                    ) : !isFinished ? (
                      <button
                        onClick={() =>
                          onQuickStatusChange && onQuickStatusChange(m, 'LIVE')
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                        title="เริ่มการแข่งขัน (LIVE)"
                      >
                        <Play className="w-3.5 h-3.5" />
                        เริ่มเตะ (LIVE)
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          onQuickStatusChange && onQuickStatusChange(m, 'LIVE')
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-colors"
                        title="กลับมาแข่งต่อ (LIVE)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        แข่งต่อ
                      </button>
                    )}

                    {/* ปุ่มเปิดแก้ไขสกอร์ */}
                    <button
                      onClick={() => onOpenScoreModal(m)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1b1c1c] bg-[#ffe680] hover:bg-[#ffd84d] border border-[#f0cb2e] rounded-xl transition-colors shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      บันทึก / แก้ไขสกอร์
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* แถบด้านล่างสำหรับเลื่อน/สรุปข้อมูล (Footer Scroll Bar) */}
          <div className="flex items-center justify-between text-xs text-[#7d7765] pt-2 border-t border-[#efeded]">
            <span>
              กำลังแสดงทั้งหมด{' '}
              <strong className="text-[#1b1c1c]">{filteredMatches.length}</strong>{' '}
              คู่
            </span>
            {filteredMatches.length > 6 && (
              <span className="flex items-center gap-1 text-[11px] bg-[#f8f7f5] px-2.5 py-0.5 rounded-full border border-[#efeded] text-[#5c5746]">
                ↕ เลื่อนในกรอบเพื่อดูคู่ที่เหลือ
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

