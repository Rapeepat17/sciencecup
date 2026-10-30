import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Clock, CheckCircle2, Info } from 'lucide-react';
import { Match } from '../../../../types';
import { TeamLogo } from '../../../../components/TeamLogo';
import { matchService } from '../../../../services/matchService';

export interface MatchDetailModalProps {
  match: Match | null;
  onClose: () => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  match,
  onClose,
}) => {
  const [activeMatch, setActiveMatch] = useState<Match | null>(match);

  useEffect(() => {
    setActiveMatch(match);
  }, [match]);

  // Fetch fresh match events/details when modal opens to ensure scorers are always up-to-date
  useEffect(() => {
    if (!match?.id || !match?.tournamentId) return;

    let isSubscribed = true;
    matchService
      .getById(match.tournamentId, match.id)
      .then((res: any) => {
        if (!isSubscribed || !res) return;
        setActiveMatch((prev) => ({
          ...(prev || match),
          events: res.events || prev?.events || [],
          goalPlayers1: res.goalPlayers1 || res.home_scorers || prev?.goalPlayers1 || '',
          goalPlayers2: res.goalPlayers2 || res.away_scorers || prev?.goalPlayers2 || '',
          cardsT1: res.cardsT1 || prev?.cardsT1,
          cardsT2: res.cardsT2 || prev?.cardsT2,
        }));
      })
      .catch((err) => {
        console.warn('[MatchDetailModal] Could not fetch fresh match detail:', err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [match?.id, match?.tournamentId]);

  if (!match) return null;

  const currentMatch = activeMatch || match;
  const isLive = currentMatch.status === 'LIVE';
  const isFT = currentMatch.status === 'FT';
  const isUpcoming = currentMatch.status === 'UPCOMING' || (!isLive && !isFT);

  const t1Name = currentMatch.team1?.name || 'ทีมเหย้า';
  const t2Name = currentMatch.team2?.name || 'ทีมเยือน';

  const isKnockout =
    currentMatch.group === 'Knockout' ||
    (currentMatch.round && !currentMatch.round.includes('รอบแบ่งกลุ่ม'));

  const groupLabel = isKnockout
    ? currentMatch.round || 'รอบน็อคเอาท์'
    : currentMatch.group
    ? currentMatch.group.startsWith('กลุ่ม') || currentMatch.group.startsWith('สาย')
      ? currentMatch.group
      : `กลุ่ม ${currentMatch.group}`
    : currentMatch.round || 'รอบแบ่งกลุ่ม';

  const formatGoalscorers = (
    teamId?: string | number,
    goalDetails?: any[],
    goalPlayers?: string,
    events?: any[]
  ) => {
    // 1. ถ้ามี events จาก Backend
    if (events && events.length > 0) {
      const teamGoalEvents = teamId
        ? events.filter(
            (e) => e.event_type === 'goal' && String(e.team_id) === String(teamId)
          )
        : [];
      if (teamGoalEvents.length > 0) {
        const nums = teamGoalEvents
          .map((e) => (e.player_number ? String(e.player_number).trim() : ''))
          .filter(Boolean);
        if (nums.length > 0) {
          return `เบอร์ ${nums.join(', ')}`;
        }
        return teamGoalEvents
          .map((e) => e.detail || 'ผู้ทำประตู')
          .filter(Boolean)
          .join(', ');
      }
    }

    // 2. ถ้ามี goalDetails
    if (Array.isArray(goalDetails) && goalDetails.length > 0) {
      const nums = goalDetails
        .map((g) => (g.playerNumber ? String(g.playerNumber).trim() : ''))
        .filter(Boolean);
      if (nums.length > 0) {
        return `เบอร์ ${nums.join(', ')}`;
      }
      return goalDetails
        .map((g) => g.playerName || '')
        .filter(Boolean)
        .join(', ');
    }

    // 3. ถ้ามี goalPlayers string (เช่น "เบอร์ 10, เบอร์ 56" หรือ "10, 56")
    if (goalPlayers && goalPlayers.trim()) {
      const raw = goalPlayers.replace(/⚽/g, '').trim();
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
      return raw;
    }

    return '';
  };

  const g1Str = formatGoalscorers(
    currentMatch.team1?.id,
    currentMatch.goalDetails1,
    currentMatch.goalPlayers1 || (currentMatch as any).home_scorers,
    currentMatch.events
  );
  const g2Str = formatGoalscorers(
    currentMatch.team2?.id,
    currentMatch.goalDetails2,
    currentMatch.goalPlayers2 || (currentMatch as any).away_scorers,
    currentMatch.events
  );

  const cT1 = currentMatch.cardsT1 || {
    yellow: (currentMatch.events || []).filter(
      (e) => e.event_type === 'yellow_card' && String(e.team_id) === String(currentMatch.team1?.id)
    ).length,
    red: (currentMatch.events || []).filter(
      (e) => e.event_type === 'red_card' && String(e.team_id) === String(currentMatch.team1?.id)
    ).length,
    yellowPlayers: (currentMatch.events || [])
      .filter((e) => e.event_type === 'yellow_card' && String(e.team_id) === String(currentMatch.team1?.id))
      .map((e) => e.player_number)
      .filter(Boolean)
      .join(', '),
    redPlayers: (currentMatch.events || [])
      .filter((e) => e.event_type === 'red_card' && String(e.team_id) === String(currentMatch.team1?.id))
      .map((e) => e.player_number)
      .filter(Boolean)
      .join(', '),
  };

  const cT2 = currentMatch.cardsT2 || {
    yellow: (currentMatch.events || []).filter(
      (e) => e.event_type === 'yellow_card' && String(e.team_id) === String(currentMatch.team2?.id)
    ).length,
    red: (currentMatch.events || []).filter(
      (e) => e.event_type === 'red_card' && String(e.team_id) === String(currentMatch.team2?.id)
    ).length,
    yellowPlayers: (currentMatch.events || [])
      .filter((e) => e.event_type === 'yellow_card' && String(e.team_id) === String(currentMatch.team2?.id))
      .map((e) => e.player_number)
      .filter(Boolean)
      .join(', '),
    redPlayers: (currentMatch.events || [])
      .filter((e) => e.event_type === 'red_card' && String(e.team_id) === String(currentMatch.team2?.id))
      .map((e) => e.player_number)
      .filter(Boolean)
      .join(', '),
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#efeded] relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#efeded]">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xs text-[#854d0e] bg-[#fef9c3] px-3 py-1 rounded-xl border border-[#fde68a]">
              คู่ที่ {currentMatch.matchNumber || 1}
            </span>
            <span className="text-sm font-bold text-[#1b1c1c] ml-1">
              {groupLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#efeded] text-[#4b4737] transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Premium Match Arena Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#111520] via-[#0c0f17] to-[#07090e] p-5 text-white border border-white/[0.12] shadow-xl text-center">
          {/* Ambient Glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-32 bg-amber-400/[0.08] blur-2xl rounded-full" />
            <div className="absolute top-1/2 -left-10 w-48 h-48 bg-cyan-500/[0.06] blur-3xl rounded-full" />
            <div className="absolute top-1/2 -right-10 w-48 h-48 bg-emerald-500/[0.06] blur-3xl rounded-full" />
          </div>

          <div className="relative z-10 grid grid-cols-7 items-center gap-2">
            {/* Team 1 (Home) */}
            <div className="col-span-3 flex flex-col items-center min-w-0">
              <div className="p-1 rounded-full bg-white/10 ring-2 ring-white/20 shadow-lg mb-1.5 backdrop-blur-xs">
                <TeamLogo
                  id={currentMatch.team1?.id}
                  logo={currentMatch.team1?.logo}
                  name={t1Name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover bg-white"
                />
              </div>
              <span className="font-display font-extrabold text-sm sm:text-base text-white tracking-tight truncate max-w-full">
                {t1Name}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium mt-0.5">
                เจ้าบ้าน
              </span>
            </div>

            {/* Center: Score or VS */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              {isLive || isFT ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 font-display font-black text-2xl sm:text-4xl text-amber-300 tracking-tight drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]">
                    <span>{currentMatch.score1}</span>
                    <span className="text-white/30 text-lg sm:text-2xl select-none">:</span>
                    <span>{currentMatch.score2}</span>
                  </div>
                  {currentMatch.penaltyScore1 !== undefined && currentMatch.penaltyScore2 !== undefined && (
                    <span className="text-[10px] text-amber-400 font-bold mt-1 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30">
                      จุดโทษ ({currentMatch.penaltyScore1} - {currentMatch.penaltyScore2})
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs font-bold text-zinc-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                  VS
                </span>
              )}
            </div>

            {/* Team 2 (Away) */}
            <div className="col-span-3 flex flex-col items-center min-w-0">
              <div className="p-1 rounded-full bg-white/10 ring-2 ring-white/20 shadow-lg mb-1.5 backdrop-blur-xs">
                <TeamLogo
                  id={currentMatch.team2?.id}
                  logo={currentMatch.team2?.logo}
                  name={t2Name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover bg-white"
                />
              </div>
              <span className="font-display font-extrabold text-sm sm:text-base text-white tracking-tight truncate max-w-full">
                {t2Name}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium mt-0.5">
                ทีมเยือน
              </span>
            </div>
          </div>

          {/* Status / Kickoff Pill */}
          <div className="relative z-10 mt-3.5 flex justify-center">
            {isLive && (
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1.5 shadow-xs backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                กำลังแข่งขัน
              </span>
            )}
            {isFT && (
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-white/10 text-zinc-200 border border-white/15 inline-flex items-center gap-1.5 backdrop-blur-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> จบเกมส์
              </span>
            )}
            {isUpcoming && (
              <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-black/40 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1.5 backdrop-blur-xs">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> เริ่ม {currentMatch.timeStr ? `${currentMatch.timeStr} น.` : 'ตามกำหนดการ'}
              </span>
            )}
          </div>
        </div>

        {/* Venue & Date Strip */}
        <div className="bg-[#faf9f8] p-3 rounded-2xl border border-[#efeded] flex flex-wrap items-center justify-between gap-2 text-xs text-[#4b4737]">
          <div className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-[#1b1c1c] font-semibold">{currentMatch.venue || 'สนามหลัก'}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-[11px] text-[#716e68]">
            <Calendar className="w-3.5 h-3.5 text-[#716e68] shrink-0" />
            <span>{currentMatch.dateStr || 'ยังไม่ระบุวันที่'}</span>
          </div>
        </div>

        {/* Team Goalscorers & Discipline Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Team 1 Details */}
          <div className="p-3.5 bg-[#faf9f8] rounded-2xl border border-[#efeded] space-y-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-[#efeded]">
              <TeamLogo
                id={currentMatch.team1?.id}
                logo={currentMatch.team1?.logo}
                name={t1Name}
                className="w-4 h-4 rounded-full object-cover shrink-0"
              />
              <span className="font-bold text-xs text-[#1b1c1c] truncate">
                {t1Name}
              </span>
            </div>

            {/* Goals */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#716e68] flex items-center gap-1">
                ผู้ทำประตู:
              </span>
              {g1Str ? (
                <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  {g1Str}
                </span>
              ) : (
                <p className="text-[11px] text-[#888580]">-</p>
              )}
            </div>

            {/* Cards */}
            <div className="pt-1 border-t border-[#f0eeeb] flex flex-wrap items-center gap-2 text-[11px]">
              {(cT1.yellow || 0) > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                  <span className="w-2 h-3 bg-amber-400 rounded-xs inline-block shadow-2xs" />
                  {cT1.yellow} ใบเหลือง {cT1.yellowPlayers ? `(เบอร์ ${cT1.yellowPlayers})` : ''}
                </span>
              )}
              {(cT1.red || 0) > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-900 border border-rose-200 font-semibold">
                  <span className="w-2 h-3 bg-rose-500 rounded-xs inline-block shadow-2xs" />
                  {cT1.red} ใบแดง {cT1.redPlayers ? `(เบอร์ ${cT1.redPlayers})` : ''}
                </span>
              )}
              {(cT1.yellow || 0) === 0 && (cT1.red || 0) === 0 && (
                <span className="text-[10px] text-[#888580]">ไม่มีใบเตือน</span>
              )}
            </div>
          </div>

          {/* Team 2 Details */}
          <div className="p-3.5 bg-[#faf9f8] rounded-2xl border border-[#efeded] space-y-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-[#efeded]">
              <TeamLogo
                id={currentMatch.team2?.id}
                logo={currentMatch.team2?.logo}
                name={t2Name}
                className="w-4 h-4 rounded-full object-cover shrink-0"
              />
              <span className="font-bold text-xs text-[#1b1c1c] truncate">
                {t2Name}
              </span>
            </div>

            {/* Goals */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#716e68] flex items-center gap-1">
                ผู้ทำประตู:
              </span>
              {g2Str ? (
                <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  {g2Str}
                </span>
              ) : (
                <p className="text-[11px] text-[#888580]">-</p>
              )}
            </div>

            {/* Cards */}
            <div className="pt-1 border-t border-[#f0eeeb] flex flex-wrap items-center gap-2 text-[11px]">
              {(cT2.yellow || 0) > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                  <span className="w-2 h-3 bg-amber-400 rounded-xs inline-block shadow-2xs" />
                  {cT2.yellow} ใบเหลือง {cT2.yellowPlayers ? `(เบอร์ ${cT2.yellowPlayers})` : ''}
                </span>
              )}
              {(cT2.red || 0) > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-900 border border-rose-200 font-semibold">
                  <span className="w-2 h-3 bg-rose-500 rounded-xs inline-block shadow-2xs" />
                  {cT2.red} ใบแดง {cT2.redPlayers ? `(เบอร์ ${cT2.redPlayers})` : ''}
                </span>
              )}
              {(cT2.yellow || 0) === 0 && (cT2.red || 0) === 0 && (
                <span className="text-[10px] text-[#888580]">ไม่มีใบเตือน</span>
              )}
            </div>
          </div>
        </div>

        {/* Read-Only Spectator Notice */}
        <div className="text-center py-2 text-[11px] text-[#716e68] bg-[#faf9f8] rounded-xl flex items-center justify-center gap-1.5 border border-[#efeded]">
          <Info className="w-3.5 h-3.5 text-cyan-600 shrink-0" /> โหมดผู้ชม: ข้อมูลแสดงผลแบบเรียลไทม์
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#1b1c1c] text-white font-bold text-xs hover:bg-black transition-all shadow-md active:scale-98 cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchDetailModal;
