import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Match, MatchStatus, Player } from '../../../../types';
import { TeamLogo } from '../../../../components/TeamLogo';
import { playerService } from '../../../../services/playerService';
import { matchService } from '../../../../services/matchService';

export interface ScorerItem {
  id?: string;
  team_id: string;
  player_id?: string;
  player_number?: string;
  player_name: string;
}

export interface CardItem {
  id?: string;
  team_id: string;
  player_id?: string;
  player_number?: string;
  player_name?: string;
  card_type: 'yellow_card' | 'red_card';
}

interface QuickScoreEditModalProps {
  isOpen: boolean;
  match: Match | null;
  tournamentId: string;
  onClose: () => void;
  onSave: (payload: {
    homeScore: number;
    awayScore: number;
    homePenaltyScore: number | null;
    awayPenaltyScore: number | null;
    status: MatchStatus;
    scorers: ScorerItem[];
    cards: CardItem[];
  }) => Promise<void>;
}

export const QuickScoreEditModal: React.FC<QuickScoreEditModalProps> = ({
  isOpen,
  match,
  tournamentId,
  onClose,
  onSave,
}) => {
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [homePenalty, setHomePenalty] = useState<number | null>(null);
  const [awayPenalty, setAwayPenalty] = useState<number | null>(null);
  const [status, setStatus] = useState<MatchStatus>('FT');
  const [showPenalty, setShowPenalty] = useState<boolean>(false);

  // Scorer lists
  const [homeScorers, setHomeScorers] = useState<ScorerItem[]>([]);
  const [awayScorers, setAwayScorers] = useState<ScorerItem[]>([]);

  // Card lists
  const [homeCards, setHomeCards] = useState<CardItem[]>([]);
  const [awayCards, setAwayCards] = useState<CardItem[]>([]);

  // Input states for numbers only
  const [homeInputNumber, setHomeInputNumber] = useState<string>('');
  const [awayInputNumber, setAwayInputNumber] = useState<string>('');

  // Card input states
  const [homeCardNumber, setHomeCardNumber] = useState<string>('');
  const [homeCardType, setHomeCardType] = useState<'yellow_card' | 'red_card'>('yellow_card');
  const [awayCardNumber, setAwayCardNumber] = useState<string>('');
  const [awayCardType, setAwayCardType] = useState<'yellow_card' | 'red_card'>('yellow_card');

  // Team players for name matching
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Populate data when match opens (คำนวณและดึงข้อมูลสดจาก Backend)
  useEffect(() => {
    if (!match || !isOpen) return;

    setHomeInputNumber('');
    setAwayInputNumber('');
    setHomeCardNumber('');
    setAwayCardNumber('');
    setHomeCardType('yellow_card');
    setAwayCardType('yellow_card');

    const applyMatchData = (m: Match) => {
      setHomeScore(m.score1 ?? 0);
      setAwayScore(m.score2 ?? 0);
      setHomePenalty(m.penaltyScore1 ?? null);
      setAwayPenalty(m.penaltyScore2 ?? null);
      setShowPenalty(
        m.penaltyScore1 !== null && m.penaltyScore1 !== undefined
      );

      const currentStatus = (m.status || '').toUpperCase();
      if (currentStatus === 'LIVE') {
        setStatus('LIVE');
      } else if (
        currentStatus === 'FT' ||
        currentStatus === 'FINISHED' ||
        currentStatus === 'COMPLETED'
      ) {
        setStatus('FT');
      } else {
        setStatus('UPCOMING');
      }

      // 1. ผู้ทำประตูทีมเหย้า
      const initialHomeScorers: ScorerItem[] = [];
      if (m.events && m.events.length > 0) {
        m.events
          .filter(
            (e) =>
              e.event_type === 'goal' &&
              String(e.team_id) === String(m.team1.id)
          )
          .forEach((e) => {
            const num = e.player_number ? String(e.player_number).trim() : '';
            initialHomeScorers.push({
              team_id: String(m.team1.id),
              player_id: e.player_id ? String(e.player_id) : undefined,
              player_number: num || undefined,
              player_name: e.detail || (num ? `เบอร์ ${num}` : 'ผู้ทำประตู'),
            });
          });
      }
      // Fallback จากข้อความสรุปผู้ทำประตูถ้า events ยังไม่ครอบคลุม
      if (initialHomeScorers.length === 0 && (m.goalPlayers1 || (m as any).home_scorers)) {
        const raw = m.goalPlayers1 || (m as any).home_scorers || '';
        raw.split(',').forEach((name: string) => {
          const trimmed = name.trim();
          if (trimmed) {
            const numMatch = trimmed.match(/\d+/);
            initialHomeScorers.push({
              team_id: String(m.team1.id),
              player_number: numMatch ? numMatch[0] : undefined,
              player_name: trimmed,
            });
          }
        });
      }
      setHomeScorers(initialHomeScorers);

      // 2. ผู้ทำประตูทีมเยือน
      const initialAwayScorers: ScorerItem[] = [];
      if (m.events && m.events.length > 0) {
        m.events
          .filter(
            (e) =>
              e.event_type === 'goal' &&
              String(e.team_id) === String(m.team2.id)
          )
          .forEach((e) => {
            const num = e.player_number ? String(e.player_number).trim() : '';
            initialAwayScorers.push({
              team_id: String(m.team2.id),
              player_id: e.player_id ? String(e.player_id) : undefined,
              player_number: num || undefined,
              player_name: e.detail || (num ? `เบอร์ ${num}` : 'ผู้ทำประตู'),
            });
          });
      }
      // Fallback จากข้อความสรุปผู้ทำประตูถ้า events ยังไม่ครอบคลุม
      if (initialAwayScorers.length === 0 && (m.goalPlayers2 || (m as any).away_scorers)) {
        const raw = m.goalPlayers2 || (m as any).away_scorers || '';
        raw.split(',').forEach((name: string) => {
          const trimmed = name.trim();
          if (trimmed) {
            const numMatch = trimmed.match(/\d+/);
            initialAwayScorers.push({
              team_id: String(m.team2.id),
              player_number: numMatch ? numMatch[0] : undefined,
              player_name: trimmed,
            });
          }
        });
      }
      setAwayScorers(initialAwayScorers);

      // 3. ใบเตือนทีมเหย้า
      const initialHomeCards: CardItem[] = [];
      if (m.events && m.events.length > 0) {
        m.events
          .filter(
            (e) =>
              (e.event_type === 'yellow_card' || e.event_type === 'red_card') &&
              String(e.team_id) === String(m.team1.id)
          )
          .forEach((e) => {
            const num = e.player_number ? String(e.player_number).trim() : '';
            initialHomeCards.push({
              team_id: String(m.team1.id),
              player_id: e.player_id ? String(e.player_id) : undefined,
              player_number: num || undefined,
              player_name: e.detail || (num ? `เบอร์ ${num}` : (e.event_type === 'yellow_card' ? 'ใบเหลือง' : 'ใบแดง')),
              card_type: e.event_type as 'yellow_card' | 'red_card',
            });
          });
      }
      if (initialHomeCards.length === 0 && m.cardsT1) {
        if (m.cardsT1.yellowPlayers) {
          m.cardsT1.yellowPlayers.split(',').forEach((num: string) => {
            const trimmed = num.trim();
            if (trimmed) {
              initialHomeCards.push({
                team_id: String(m.team1.id),
                player_number: trimmed,
                player_name: `เบอร์ ${trimmed}`,
                card_type: 'yellow_card',
              });
            }
          });
        }
        if (m.cardsT1.redPlayers) {
          m.cardsT1.redPlayers.split(',').forEach((num: string) => {
            const trimmed = num.trim();
            if (trimmed) {
              initialHomeCards.push({
                team_id: String(m.team1.id),
                player_number: trimmed,
                player_name: `เบอร์ ${trimmed}`,
                card_type: 'red_card',
              });
            }
          });
        }
      }
      setHomeCards(initialHomeCards);

      // 4. ใบเตือนทีมเยือน
      const initialAwayCards: CardItem[] = [];
      if (m.events && m.events.length > 0) {
        m.events
          .filter(
            (e) =>
              (e.event_type === 'yellow_card' || e.event_type === 'red_card') &&
              String(e.team_id) === String(m.team2.id)
          )
          .forEach((e) => {
            const num = e.player_number ? String(e.player_number).trim() : '';
            initialAwayCards.push({
              team_id: String(m.team2.id),
              player_id: e.player_id ? String(e.player_id) : undefined,
              player_number: num || undefined,
              player_name: e.detail || (num ? `เบอร์ ${num}` : (e.event_type === 'yellow_card' ? 'ใบเหลือง' : 'ใบแดง')),
              card_type: e.event_type as 'yellow_card' | 'red_card',
            });
          });
      }
      if (initialAwayCards.length === 0 && m.cardsT2) {
        if (m.cardsT2.yellowPlayers) {
          m.cardsT2.yellowPlayers.split(',').forEach((num: string) => {
            const trimmed = num.trim();
            if (trimmed) {
              initialAwayCards.push({
                team_id: String(m.team2.id),
                player_number: trimmed,
                player_name: `เบอร์ ${trimmed}`,
                card_type: 'yellow_card',
              });
            }
          });
        }
        if (m.cardsT2.redPlayers) {
          m.cardsT2.redPlayers.split(',').forEach((num: string) => {
            const trimmed = num.trim();
            if (trimmed) {
              initialAwayCards.push({
                team_id: String(m.team2.id),
                player_number: trimmed,
                player_name: `เบอร์ ${trimmed}`,
                card_type: 'red_card',
              });
            }
          });
        }
      }
      setAwayCards(initialAwayCards);
    };

    // แสดงผลข้อมูลเริ่มต้นจาก Props ก่อนทันที
    applyMatchData(match);

    // ดึงข้อมูลสดที่ Backend คำนวณล่าสุดเสมอ (Fresh Fetch from Backend API)
    let isSubscribed = true;
    const tourneyId = tournamentId || match.tournamentId || '1000';
    matchService
      .getById(tourneyId, match.id)
      .then((freshMatch: any) => {
        if (!isSubscribed || !freshMatch) return;
        applyMatchData(freshMatch);
      })
      .catch((err) => {
        console.warn('[QuickScoreEditModal] Could not fetch fresh match events:', err);
      });

    // ดึงรายชื่อผู้เล่นของทั้งสองทีมเพื่อผูกชื่อเบอร์เสื้อ
    Promise.all([
      playerService
        .getByTournament(tourneyId, String(match.team1.id))
        .catch(() => []),
      playerService
        .getByTournament(tourneyId, String(match.team2.id))
        .catch(() => []),
    ]).then(([hPlayers, aPlayers]) => {
      if (!isSubscribed) return;
      setHomePlayers(hPlayers || []);
      setAwayPlayers(aPlayers || []);
    });

    return () => {
      isSubscribed = false;
    };
  }, [match, isOpen, tournamentId]);

  if (!isOpen || !match) return null;

  // เพิ่มคนยิงทีมเหย้า: เฉพาะเบอร์ + ปรับสกอร์ขึ้นอัตโนมัติ (+1)
  const handleAddHomeScorer = () => {
    const num = homeInputNumber.trim();
    if (!num) return;

    // ค้นหาชื่อนักเตะในทีมเหย้าที่มีเบอร์ตรงกัน
    const matched = homePlayers.find(
      (p) => String(p.number).trim() === num
    );
    const playerName = matched?.name || `เบอร์ ${num}`;

    setHomeScorers((prev) => [
      ...prev,
      {
        team_id: String(match.team1.id),
        player_id: matched ? String(matched.id) : undefined,
        player_number: num,
        player_name: playerName,
      },
    ]);

    // เมื่อบันทึกคนยิง ให้สกอร์ขึ้นอัตโนมัติ
    setHomeScore((prev) => prev + 1);
    setHomeInputNumber('');
  };

  // ลบคนยิงทีมเหย้า: สกอร์ลดลงอัตโนมัติ (-1)
  const handleRemoveHomeScorer = (idx: number) => {
    setHomeScorers((prev) => prev.filter((_, i) => i !== idx));
    setHomeScore((prev) => Math.max(0, prev - 1));
  };

  // เพิ่มคนยิงทีมเยือน: เฉพาะเบอร์ + ปรับสกอร์ขึ้นอัตโนมัติ (+1)
  const handleAddAwayScorer = () => {
    const num = awayInputNumber.trim();
    if (!num) return;

    // ค้นหาชื่อนักเตะในทีมเยือนที่มีเบอร์ตรงกัน
    const matched = awayPlayers.find(
      (p) => String(p.number).trim() === num
    );
    const playerName = matched?.name || `เบอร์ ${num}`;

    setAwayScorers((prev) => [
      ...prev,
      {
        team_id: String(match.team2.id),
        player_id: matched ? String(matched.id) : undefined,
        player_number: num,
        player_name: playerName,
      },
    ]);

    // เมื่อบันทึกคนยิง ให้สกอร์ขึ้นอัตโนมัติ
    setAwayScore((prev) => prev + 1);
    setAwayInputNumber('');
  };

  // ลบคนยิงทีมเยือน: สกอร์ลดลงอัตโนมัติ (-1)
  const handleRemoveAwayScorer = (idx: number) => {
    setAwayScorers((prev) => prev.filter((_, i) => i !== idx));
    setAwayScore((prev) => Math.max(0, prev - 1));
  };

  // เพิ่มใบเตือนทีมเหย้า
  const handleAddHomeCard = () => {
    const num = homeCardNumber.trim();
    if (!num) return;
    const matched = homePlayers.find((p) => String(p.number).trim() === num);
    const cardLabel = homeCardType === 'yellow_card' ? 'ใบเหลือง' : 'ใบแดง';
    const playerName = matched?.name || `${cardLabel} เบอร์ ${num}`;

    setHomeCards((prev) => [
      ...prev,
      {
        team_id: String(match.team1.id),
        player_id: matched ? String(matched.id) : undefined,
        player_number: num,
        player_name: playerName,
        card_type: homeCardType,
      },
    ]);
    setHomeCardNumber('');
  };

  // ลบใบเตือนทีมเหย้า
  const handleRemoveHomeCard = (idx: number) => {
    setHomeCards((prev) => prev.filter((_, i) => i !== idx));
  };

  // เพิ่มใบเตือนทีมเยือน
  const handleAddAwayCard = () => {
    const num = awayCardNumber.trim();
    if (!num) return;
    const matched = awayPlayers.find((p) => String(p.number).trim() === num);
    const cardLabel = awayCardType === 'yellow_card' ? 'ใบเหลือง' : 'ใบแดง';
    const playerName = matched?.name || `${cardLabel} เบอร์ ${num}`;

    setAwayCards((prev) => [
      ...prev,
      {
        team_id: String(match.team2.id),
        player_id: matched ? String(matched.id) : undefined,
        player_number: num,
        player_name: playerName,
        card_type: awayCardType,
      },
    ]);
    setAwayCardNumber('');
  };

  // ลบใบเตือนทีมเยือน
  const handleRemoveAwayCard = (idx: number) => {
    setAwayCards((prev) => prev.filter((_, i) => i !== idx));
  };

  // กดปุ่มบันทึกใหญ่ (ส่งข้อมูลทั้งหมดไปยัง Backend)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const allScorers = [...homeScorers, ...awayScorers];
      const allCards = [...homeCards, ...awayCards];

      await onSave({
        homeScore,
        awayScore,
        homePenaltyScore: showPenalty ? homePenalty : null,
        awayPenaltyScore: showPenalty ? awayPenalty : null,
        status,
        scorers: allScorers,
        cards: allCards,
      });

      onClose();
    } catch (err: any) {
      console.error('Failed to save score and scorers:', err);
      setError(err.message || 'ไม่สามารถบันทึกผลการแข่งขันได้');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-[#efeded] shadow-2xl w-full max-w-xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header & Sticky Status Bar บนหัวสุด */}
        <div className="sticky top-0 z-20 bg-[#faf9f6] border-b border-[#efeded] px-6 py-4 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-display text-[#1b1c1c]">
                บันทึกผลสกอร์ & ผู้ทำประตู
              </h2>
              <p className="text-xs text-[#7d7765]">
                {match.group ? `กลุ่ม ${match.group}` : match.round} • {match.venue || 'สนาม 1'}
              </p>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-xl text-[#7d7765] hover:text-[#1b1c1c] hover:bg-gray-100 transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* แถบปรับสถานะบนหัวสุด ตรงนี้ชัดเจน 100% ไม่เลื่อนหลุดหาย */}
          <div className="flex flex-wrap items-center justify-between bg-white p-2.5 rounded-2xl border border-[#efeded] gap-2 shadow-2xs">
            <span className="text-xs font-semibold text-[#5c5746]">
              สถานะการแข่งขัน:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatus('LIVE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  status === 'LIVE'
                    ? 'bg-rose-500 text-white shadow-xs ring-2 ring-rose-300'
                    : 'bg-[#faf9f6] text-[#5c5746] hover:bg-gray-100 border border-[#efeded]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                กำลังแข่ง (LIVE)
              </button>

              <button
                type="button"
                onClick={() => setStatus('FT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  status === 'FT'
                    ? 'bg-[#1b1c1c] text-white shadow-xs ring-2 ring-gray-400'
                    : 'bg-[#faf9f6] text-[#5c5746] hover:bg-gray-100 border border-[#efeded]'
                }`}
              >
                จบเกม (FT)
              </button>

              <button
                type="button"
                onClick={() => setStatus('UPCOMING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  status === 'UPCOMING'
                    ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300'
                    : 'bg-[#faf9f6] text-[#5c5746] hover:bg-gray-100 border border-[#efeded]'
                }`}
              >
                รอแข่ง
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="m-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">

          {/* สกอร์หลัก (Home vs Away) */}
          <div className="grid grid-cols-5 items-center gap-3 bg-[#faf9f6] p-5 rounded-2xl border border-[#efeded]">
            {/* ฝั่งทีมเหย้า */}
            <div className="col-span-2 flex flex-col items-center text-center">
              <TeamLogo
                id={match.team1.id}
                logo={match.team1.logo}
                name={match.team1.name}
                className="w-12 h-12 rounded-xl mb-2"
              />
              <span className="text-xs font-bold text-[#1b1c1c] line-clamp-1">
                {match.team1.name}
              </span>
              <span className="text-[10px] text-[#7d7765]">เจ้าบ้าน</span>

              {/* ปุ่มปรับสกอร์ */}
              <div className="flex items-center gap-1.5 mt-3">
                <button
                  type="button"
                  onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-[#efeded] text-[#5c5746] flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={homeScore}
                  onChange={(e) => setHomeScore(Number(e.target.value) || 0)}
                  className="w-14 h-10 text-xl font-bold font-display text-center bg-white border border-[#efeded] rounded-xl text-[#1b1c1c]"
                />
                <button
                  type="button"
                  onClick={() => setHomeScore(homeScore + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-[#efeded] text-[#5c5746] flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* กลาง: สกอร์สดหรือ VS และสถานะ */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              <div className="font-display font-black text-xl sm:text-2xl text-[#1b1c1c] tracking-tight">
                {status === 'LIVE' || status === 'FT' ? (
                  <span>{homeScore} : {awayScore}</span>
                ) : (
                  <span className="text-[#7d7765] text-sm font-extrabold">VS</span>
                )}
              </div>
              <div className="mt-1">
                {status === 'LIVE' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    LIVE
                  </span>
                )}
                {status === 'FT' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-700">
                    จบเกม (FT)
                  </span>
                )}
                {status === 'UPCOMING' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#efeded] text-[#7d7765]">
                    รอแข่ง
                  </span>
                )}
              </div>
            </div>

            {/* ฝั่งทีมเยือน */}
            <div className="col-span-2 flex flex-col items-center text-center">
              <TeamLogo
                id={match.team2.id}
                logo={match.team2.logo}
                name={match.team2.name}
                className="w-12 h-12 rounded-xl mb-2"
              />
              <span className="text-xs font-bold text-[#1b1c1c] line-clamp-1">
                {match.team2.name}
              </span>
              <span className="text-[10px] text-[#7d7765]">ทีมเยือน</span>

              {/* ปุ่มปรับสกอร์ */}
              <div className="flex items-center gap-1.5 mt-3">
                <button
                  type="button"
                  onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-[#efeded] text-[#5c5746] flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={awayScore}
                  onChange={(e) => setAwayScore(Number(e.target.value) || 0)}
                  className="w-14 h-10 text-xl font-bold font-display text-center bg-white border border-[#efeded] rounded-xl text-[#1b1c1c]"
                />
                <button
                  type="button"
                  onClick={() => setAwayScore(awayScore + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-[#efeded] text-[#5c5746] flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* จุดโทษตัดสิน (Toggle Shootout) */}
          <div className="border border-[#efeded] rounded-2xl p-4 bg-white">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1b1c1c] flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPenalty}
                  onChange={(e) => setShowPenalty(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#786607] focus:ring-[#ffe680]"
                />
                ผลการยิงจุดโทษตัดสิน (กรณีเสมอรอบน็อคเอาท์)
              </label>
            </div>

            {showPenalty && (
              <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-[#efeded]">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={homePenalty ?? ''}
                  onChange={(e) =>
                    setHomePenalty(
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  className="w-14 h-9 text-center font-bold border border-[#efeded] rounded-xl"
                />
                <span className="text-xs text-[#7d7765]">จุดโทษ</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={awayPenalty ?? ''}
                  onChange={(e) =>
                    setAwayPenalty(
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  className="w-14 h-9 text-center font-bold border border-[#efeded] rounded-xl"
                />
              </div>
            )}
          </div>

          {/* ส่วนผู้ทำประตูและใบเตือน: จัดกลุ่มตามทีม */}
          <div className="space-y-4 pt-2 border-t border-[#efeded]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#1b1c1c] flex items-center gap-1.5">
                  ผู้ทำประตูและใบเตือน (Goals & Cards)
                </h3>
                <p className="text-[11px] text-[#7d7765]">
                  บันทึกผู้ทำประตู (+1 สกอร์อัตโนมัติ) และบันทึกใบเหลือง - ใบแดงของแต่ละทีม
                </p>
              </div>
            </div>

            {/* กล่องทีมเหย้า */}
            <div className="bg-[#faf9f6] p-4 rounded-2xl border border-[#efeded] space-y-3.5">
              {/* 1.1 ผู้ทำประตู ทีมเหย้า */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1b1c1c]">
                    ผู้ทำประตู: {match.team1.name}
                  </span>
                  <span className="text-[11px] font-semibold text-[#786607] bg-[#ffe680]/40 px-2.5 py-0.5 rounded-lg border border-[#ffe680]">
                    {homeScorers.length} ประตู
                  </span>
                </div>

                {/* ช่องกรอกเบอร์ + ปุ่มบันทึกคนยิง */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="กรอกเฉพาะเบอร์เสื้อ เช่น 10"
                    value={homeInputNumber}
                    onChange={(e) => setHomeInputNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddHomeScorer();
                      }
                    }}
                    className="flex-1 text-xs bg-white border border-[#efeded] focus:border-[#786607] focus:ring-1 focus:ring-[#ffe680] rounded-xl px-3.5 py-2 text-[#1b1c1c] font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddHomeScorer}
                    disabled={!homeInputNumber.trim()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1b1c1c] bg-[#ffe680] hover:bg-[#ffd84d] disabled:opacity-40 disabled:pointer-events-none px-4 py-2 rounded-xl transition-all shadow-2xs flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    บันทึกคนยิง
                  </button>
                </div>

                {/* แสดงชิปผู้ทำประตูที่บันทึกแล้ว */}
                {homeScorers.length === 0 ? (
                  <p className="text-[11px] text-[#a8a395] italic pt-0.5">
                    ยังไม่ได้บันทึกเบอร์ผู้ทำประตูของทีมนี้
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {homeScorers.map((scorer, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-[#efeded] text-[#1b1c1c] pl-2.5 pr-1.5 py-1 rounded-xl shadow-2xs group"
                      >
                        <span>เบอร์ {scorer.player_number || scorer.player_name}</span>
                        {scorer.player_name && !scorer.player_name.startsWith('เบอร์') && (
                          <span className="text-[11px] text-[#7d7765] font-normal">
                            ({scorer.player_name})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveHomeScorer(idx)}
                          className="w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-0.5"
                          title="ลบ"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 1.2 ใบเตือน ทีมเหย้า (ต่อจากผู้ทำประตู) */}
              <div className="pt-3 border-t border-[#eae8e1] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1b1c1c]">
                    ใบเตือน: {match.team1.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      <span className="w-2 h-3 bg-amber-400 rounded-xs inline-block" />
                      {homeCards.filter((c) => c.card_type === 'yellow_card').length} ใบเหลือง
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-900 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                      <span className="w-2 h-3 bg-rose-500 rounded-xs inline-block" />
                      {homeCards.filter((c) => c.card_type === 'red_card').length} ใบแดง
                    </span>
                  </div>
                </div>

                {/* ช่องกรอกเบอร์ + เลือกประเภทบัตร + ปุ่มบันทึก */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="เบอร์เสื้อ เช่น 7"
                    value={homeCardNumber}
                    onChange={(e) => setHomeCardNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddHomeCard();
                      }
                    }}
                    className="flex-1 min-w-[120px] text-xs bg-white border border-[#efeded] focus:border-[#786607] focus:ring-1 focus:ring-[#ffe680] rounded-xl px-3.5 py-2 text-[#1b1c1c] font-medium transition-all"
                  />

                  {/* ตัวเลือกประเภทบัตร */}
                  <div className="flex items-center rounded-xl bg-white border border-[#efeded] p-0.5">
                    <button
                      type="button"
                      onClick={() => setHomeCardType('yellow_card')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        homeCardType === 'yellow_card'
                          ? 'bg-amber-100 text-amber-950 shadow-2xs'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      <span className="w-2 h-3 bg-amber-400 rounded-xs inline-block" />
                      ใบเหลือง
                    </button>
                    <button
                      type="button"
                      onClick={() => setHomeCardType('red_card')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        homeCardType === 'red_card'
                          ? 'bg-rose-100 text-rose-950 shadow-2xs'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      <span className="w-2 h-3 bg-rose-500 rounded-xs inline-block" />
                      ใบแดง
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddHomeCard}
                    disabled={!homeCardNumber.trim()}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#1b1c1c] bg-[#ffe680] hover:bg-[#ffd84d] disabled:opacity-40 disabled:pointer-events-none px-3.5 py-2 rounded-xl transition-all shadow-2xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    บันทึกใบเตือน
                  </button>
                </div>

                {/* ชิปแสดงรายการใบเตือนของทีมเหย้า */}
                {homeCards.length === 0 ? (
                  <p className="text-[11px] text-[#a8a395] italic pt-0.5">
                    ยังไม่มีการบันทึกใบเตือนของทีมนี้
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {homeCards.map((card, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold pl-2.5 pr-1.5 py-1 rounded-xl shadow-2xs border ${
                          card.card_type === 'yellow_card'
                            ? 'bg-amber-50 text-amber-950 border-amber-200'
                            : 'bg-rose-50 text-rose-950 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-3 rounded-xs inline-block ${
                            card.card_type === 'yellow_card' ? 'bg-amber-400' : 'bg-rose-500'
                          }`}
                        />
                        <span>
                          {card.card_type === 'yellow_card' ? 'ใบเหลือง' : 'ใบแดง'} เบอร์{' '}
                          {card.player_number}
                        </span>
                        {card.player_name && !card.player_name.includes('ใบ') && (
                          <span className="text-[11px] text-[#7d7765] font-normal">
                            ({card.player_name})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveHomeCard(idx)}
                          className="w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-100 transition-colors ml-0.5"
                          title="ลบ"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* กล่องทีมเยือน */}
            <div className="bg-[#faf9f6] p-4 rounded-2xl border border-[#efeded] space-y-3.5">
              {/* 2.1 ผู้ทำประตู ทีมเยือน */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1b1c1c]">
                    ผู้ทำประตู: {match.team2.name}
                  </span>
                  <span className="text-[11px] font-semibold text-[#786607] bg-[#ffe680]/40 px-2.5 py-0.5 rounded-lg border border-[#ffe680]">
                    {awayScorers.length} ประตู
                  </span>
                </div>

                {/* ช่องกรอกเบอร์ + ปุ่มบันทึกคนยิง */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="กรอกเฉพาะเบอร์เสื้อ เช่น 9"
                    value={awayInputNumber}
                    onChange={(e) => setAwayInputNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAwayScorer();
                      }
                    }}
                    className="flex-1 text-xs bg-white border border-[#efeded] focus:border-[#786607] focus:ring-1 focus:ring-[#ffe680] rounded-xl px-3.5 py-2 text-[#1b1c1c] font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddAwayScorer}
                    disabled={!awayInputNumber.trim()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1b1c1c] bg-[#ffe680] hover:bg-[#ffd84d] disabled:opacity-40 disabled:pointer-events-none px-4 py-2 rounded-xl transition-all shadow-2xs flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    บันทึกคนยิง
                  </button>
                </div>

                {/* แสดงชิปผู้ทำประตูที่บันทึกแล้ว */}
                {awayScorers.length === 0 ? (
                  <p className="text-[11px] text-[#a8a395] italic pt-0.5">
                    ยังไม่ได้บันทึกเบอร์ผู้ทำประตูของทีมนี้
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {awayScorers.map((scorer, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-[#efeded] text-[#1b1c1c] pl-2.5 pr-1.5 py-1 rounded-xl shadow-2xs group"
                      >
                        <span>เบอร์ {scorer.player_number || scorer.player_name}</span>
                        {scorer.player_name && !scorer.player_name.startsWith('เบอร์') && (
                          <span className="text-[11px] text-[#7d7765] font-normal">
                            ({scorer.player_name})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveAwayScorer(idx)}
                          className="w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-0.5"
                          title="ลบ"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 2.2 ใบเตือน ทีมเยือน (ต่อจากผู้ทำประตู) */}
              <div className="pt-3 border-t border-[#eae8e1] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1b1c1c]">
                    ใบเตือน: {match.team2.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      <span className="w-2 h-3 bg-amber-400 rounded-xs inline-block" />
                      {awayCards.filter((c) => c.card_type === 'yellow_card').length} ใบเหลือง
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-900 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                      <span className="w-2 h-3 bg-rose-500 rounded-xs inline-block" />
                      {awayCards.filter((c) => c.card_type === 'red_card').length} ใบแดง
                    </span>
                  </div>
                </div>

                {/* ช่องกรอกเบอร์ + เลือกประเภทบัตร + ปุ่มบันทึก */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="เบอร์เสื้อ เช่น 4"
                    value={awayCardNumber}
                    onChange={(e) => setAwayCardNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAwayCard();
                      }
                    }}
                    className="flex-1 min-w-[120px] text-xs bg-white border border-[#efeded] focus:border-[#786607] focus:ring-1 focus:ring-[#ffe680] rounded-xl px-3.5 py-2 text-[#1b1c1c] font-medium transition-all"
                  />

                  {/* ตัวเลือกประเภทบัตร */}
                  <div className="flex items-center rounded-xl bg-white border border-[#efeded] p-0.5">
                    <button
                      type="button"
                      onClick={() => setAwayCardType('yellow_card')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        awayCardType === 'yellow_card'
                          ? 'bg-amber-100 text-amber-950 shadow-2xs'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      <span className="w-2 h-3 bg-amber-400 rounded-xs inline-block" />
                      ใบเหลือง
                    </button>
                    <button
                      type="button"
                      onClick={() => setAwayCardType('red_card')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        awayCardType === 'red_card'
                          ? 'bg-rose-100 text-rose-950 shadow-2xs'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      <span className="w-2 h-3 bg-rose-500 rounded-xs inline-block" />
                      ใบแดง
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddAwayCard}
                    disabled={!awayCardNumber.trim()}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#1b1c1c] bg-[#ffe680] hover:bg-[#ffd84d] disabled:opacity-40 disabled:pointer-events-none px-3.5 py-2 rounded-xl transition-all shadow-2xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    บันทึกใบเตือน
                  </button>
                </div>

                {/* ชิปแสดงรายการใบเตือนของทีมเยือน */}
                {awayCards.length === 0 ? (
                  <p className="text-[11px] text-[#a8a395] italic pt-0.5">
                    ยังไม่มีการบันทึกใบเตือนของทีมนี้
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {awayCards.map((card, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold pl-2.5 pr-1.5 py-1 rounded-xl shadow-2xs border ${
                          card.card_type === 'yellow_card'
                            ? 'bg-amber-50 text-amber-950 border-amber-200'
                            : 'bg-rose-50 text-rose-950 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-3 rounded-xs inline-block ${
                            card.card_type === 'yellow_card' ? 'bg-amber-400' : 'bg-rose-500'
                          }`}
                        />
                        <span>
                          {card.card_type === 'yellow_card' ? 'ใบเหลือง' : 'ใบแดง'} เบอร์{' '}
                          {card.player_number}
                        </span>
                        {card.player_name && !card.player_name.includes('ใบ') && (
                          <span className="text-[11px] text-[#7d7765] font-normal">
                            ({card.player_name})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveAwayCard(idx)}
                          className="w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-100 transition-colors ml-0.5"
                          title="ลบ"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ปุ่มบันทึกใหญ่ Submit (Sticky Bottom) */}
          <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-xs flex items-center justify-end gap-2.5 pt-4 pb-1 border-t border-[#efeded] -mx-6 -mb-6 px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-[#5c5746] bg-white hover:bg-gray-50 border border-[#efeded] rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-[#1b1c1c] bg-[#ffe680] hover:bg-[#ffd84d] border border-[#f0cb2e] rounded-xl transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  บันทึกผลและคำนวณอัตโนมัติ
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
