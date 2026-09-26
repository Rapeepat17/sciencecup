import React, { useState, useRef } from 'react';
import { Match, MatchStatus, GroupMap, Team, CardDetail, GoalDetail } from '../types';
import { realignMatchTimesAndNumbers } from '../utils/fixtureGenerator';
import { TeamLogo } from './TeamLogo';
import {
  CalendarDays,
  FileSpreadsheet,
  Zap,
  Radio,
  Clock,
  MapPin,
  Edit3,
  FileText,
  UserCheck,
  CheckCircle2,
  X,
  Play,
  Trophy,
  Filter,
  GripVertical,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Sparkles,
  Save,
} from 'lucide-react';
import { SoccerBall } from './icons/SoccerBall';
import * as XLSX from 'xlsx';

export const formatMatchGroupLabel = (group?: string, round?: string): string => {
  const g = (group || '').trim();
  const r = (round || '').trim();
  const rLower = r.toLowerCase();
  const gLower = g.toLowerCase();

  if (
    gLower === 'knockout' ||
    g === 'รอบน็อคเอาท์' ||
    gLower === 'knockout stage' ||
    r.includes('16') ||
    r.includes('8') ||
    r.includes('รอง') ||
    r.includes('ชิง') ||
    rLower.includes('semi') ||
    rLower.includes('quarter') ||
    rLower.includes('final') ||
    rLower.includes('qf') ||
    rLower.includes('sf')
  ) {
    if (r.includes('16 ทีม') || rLower.includes('r16') || rLower.includes('round of 16')) return 'รอบ 16 ทีม';
    if (r.includes('8 ทีม') || rLower.includes('quarter') || rLower.includes('qf')) return 'รอบ 8 ทีม';
    if ((r.includes('รอง') && !r.includes('ชิง')) || rLower.includes('semi') || rLower === 'sf') return 'รอบรองชนะเลิศ';
    if (r.includes('3') || r.includes('อันดับ') || rLower.includes('third')) return 'นัดชิงอันดับ 3';
    if (r.includes('ชิง') || rLower.includes('final') || rLower === 'f') return 'นัดชิงชนะเลิศ';
    if (r) return r;
    return 'รอบน็อคเอาท์';
  }
  if (!g) return 'รอบแบ่งกลุ่ม';
  return g.startsWith('กลุ่ม') || g.startsWith('สาย') ? g : `กลุ่ม ${g}`;
};

interface MatchesFixturesViewProps {
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  groups?: GroupMap;
  teams?: Team[];
  onAutoGenerateFixtures: () => void;
  tournamentName: string;
}

const formatTeamDisplayName = (name?: string, _isTeam2?: boolean, _m?: Match): string => {
  const trimmed = name?.trim();
  if (!trimmed || trimmed === '' || trimmed === '-' || trimmed.startsWith('ทีมที่') || trimmed.includes('รอผล')) {
    return '-';
  }
  return trimmed;
};

export const MatchesFixturesView: React.FC<MatchesFixturesViewProps> = ({
  matches,
  setMatches,
  groups,
  teams,
  onAutoGenerateFixtures,
  tournamentName,
}) => {
  const [selectedRound, setSelectedRound] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'sequence' | 'byDate'>('sequence');

  // Drag & Drop State
  const [draggedMatchId, setDraggedMatchId] = useState<string | null>(null);
  const [dragOverMatchId, setDragOverMatchId] = useState<string | null>(null);

  // Time & Venue Modal state
  const [timeEditMatch, setTimeEditMatch] = useState<Match | null>(null);
  const [tempTimeStr, setTempTimeStr] = useState<string>('09:00');
  const [tempDateStr, setTempDateStr] = useState<string>('');
  const [tempVenue, setTempVenue] = useState<string>('');

  // Auto-schedule times modal
  const [isAutoScheduleOpen, setIsAutoScheduleOpen] = useState<boolean>(false);
  const [autoStartDate, setAutoStartDate] = useState<string>(() => {
    return localStorage.getItem('scicup_auto_start_date') || '2026-10-17';
  });
  const [autoStartTime, setAutoStartTime] = useState<string>(() => {
    return localStorage.getItem('scicup_auto_start_time') || '09:00';
  });
  const [autoIntervalMins, setAutoIntervalMins] = useState<string>(() => {
    return localStorage.getItem('scicup_auto_interval') || '75';
  });
  const [autoMatchesPerDay, setAutoMatchesPerDay] = useState<string>(() => {
    return localStorage.getItem('scicup_auto_matches_per_day') || '6';
  });
  const [autoVenue, setAutoVenue] = useState<string>(() => {
    return localStorage.getItem('scicup_auto_venue') || '';
  });

  // Quick Score modal temporary values
  const [activeModalMatch, setActiveModalMatch] = useState<Match | null>(null);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [hasPenalties, setHasPenalties] = useState(false);
  const [penaltyScore1, setPenaltyScore1] = useState(0);
  const [penaltyScore2, setPenaltyScore2] = useState(0);
  const [minuteText, setMinuteText] = useState("68'");
  const [modalStatus, setModalStatus] = useState<MatchStatus>('LIVE');
  const [yellowCards1, setYellowCards1] = useState(0);
  const [redCards1, setRedCards1] = useState(0);
  const [yellowPlayers1, setYellowPlayers1] = useState('');
  const [redPlayers1, setRedPlayers1] = useState('');
  const [yellowCards2, setYellowCards2] = useState(0);
  const [redCards2, setRedCards2] = useState(0);
  const [yellowPlayers2, setYellowPlayers2] = useState('');
  const [redPlayers2, setRedPlayers2] = useState('');

  // Interactive Card Logger states
  const cardInputRef1 = useRef<HTMLInputElement>(null);
  const cardInputRef2 = useRef<HTMLInputElement>(null);
  const [tempPlayerNum1, setTempPlayerNum1] = useState('');
  const [tempCardType1, setTempCardType1] = useState<'yellow' | 'red'>('yellow');
  const [cardDetails1, setCardDetails1] = useState<CardDetail[]>([]);

  const [tempPlayerNum2, setTempPlayerNum2] = useState('');
  const [tempCardType2, setTempCardType2] = useState<'yellow' | 'red'>('yellow');
  const [cardDetails2, setCardDetails2] = useState<CardDetail[]>([]);

  // Interactive Goal Logger states
  const goalInputRef1 = useRef<HTMLInputElement>(null);
  const goalInputRef2 = useRef<HTMLInputElement>(null);
  const [tempGoalPlayerNum1, setTempGoalPlayerNum1] = useState('');
  const [goalDetails1, setGoalDetails1] = useState<GoalDetail[]>([]);

  const [tempGoalPlayerNum2, setTempGoalPlayerNum2] = useState('');
  const [goalDetails2, setGoalDetails2] = useState<GoalDetail[]>([]);

  const [reportModalMatch, setReportModalMatch] = useState<Match | null>(null);
  const [rosterModalMatch, setRosterModalMatch] = useState<Match | null>(null);

  // Dynamic group options from groups and matches
  const availableGroupKeys: string[] = Object.keys(groups || {});
  const matchGroupKeys: string[] = Array.from(new Set(matches.map((m) => String(m.group)).filter(Boolean)));
  const dynamicGroupOptions: string[] = Array.from(new Set([...availableGroupKeys, ...matchGroupKeys]));

  // Metrics
  const completedCount = matches.filter((m) => m.status === 'FT').length;
  const liveCount = matches.filter((m) => m.status === 'LIVE').length;
  const totalGoals = matches.reduce((acc, m) => {
    if (m.status === 'FT' || m.status === 'LIVE') {
      return acc + (m.score1 || 0) + (m.score2 || 0);
    }
    return acc;
  }, 0);

  // Filtered matches
  const filteredMatches = matches.filter((m) => {
    if (selectedRound !== 'all' && m.round !== selectedRound) {
      return false;
    }
    if (
      selectedGroup !== 'all' &&
      m.group !== selectedGroup &&
      m.group !== `กลุ่ม ${selectedGroup}`
    ) {
      return false;
    }
    if (selectedStatus === 'FT' && m.status !== 'FT') return false;
    if (selectedStatus === 'LIVE' && m.status !== 'LIVE') return false;
    if (selectedStatus === 'UPCOMING' && m.status !== 'UPCOMING') return false;
    return true;
  });

  // Group matches by dateStr
  const groupedByDate: { [dateStr: string]: Match[] } = {};
  filteredMatches.forEach((m) => {
    if (!groupedByDate[m.dateStr]) {
      groupedByDate[m.dateStr] = [];
    }
    groupedByDate[m.dateStr].push(m);
  });

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, matchId: string) => {
    e.dataTransfer.setData('text/plain', matchId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedMatchId(matchId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverMatchId !== targetId) {
      setDragOverMatchId(targetId);
    }
  };

  const handleDragLeave = () => {
    setDragOverMatchId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedMatchId || e.dataTransfer.getData('text/plain');
    setDraggedMatchId(null);
    setDragOverMatchId(null);

    if (!sourceId || sourceId === targetId) return;

    setMatches((prev) => {
      const fromIdx = prev.findIndex((m) => m.id === sourceId);
      const toIdx = prev.findIndex((m) => m.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;

      const updated = [...prev];
      const [movedItem] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, movedItem);

      return updated.map((m, idx) => ({
        ...m,
        matchNumber: idx + 1,
        currentMinute: m.status === 'UPCOMING' ? `คู่ที่ ${idx + 1}` : m.currentMinute,
      }));
    });
  };

  const handleDragEnd = () => {
    setDraggedMatchId(null);
    setDragOverMatchId(null);
  };

  // Move Up / Move Down Handlers
  const handleMoveMatch = (matchId: string, direction: 'up' | 'down') => {
    setMatches((prev) => {
      const idx = prev.findIndex((m) => m.id === matchId);
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.length - 1) return prev;

      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      const updated = [...prev];
      const temp = updated[idx];
      updated[idx] = updated[targetIdx];
      updated[targetIdx] = temp;

      return updated.map((m, i) => ({
        ...m,
        matchNumber: i + 1,
        currentMinute: m.status === 'UPCOMING' ? `คู่ที่ ${i + 1}` : m.currentMinute,
      }));
    });
  };

  // Open Time Edit Modal
  const openTimeEditModal = (match: Match) => {
    setTimeEditMatch(match);
    setTempTimeStr(match.timeStr || '09:00');
    setTempDateStr(match.dateStr || '');
    setTempVenue(match.venue || '');
  };

  // Save Time Edit
  const handleSaveTimeEdit = () => {
    if (!timeEditMatch) return;
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === timeEditMatch.id) {
          return {
            ...m,
            timeStr: tempTimeStr,
            dateStr: tempDateStr,
            venue: tempVenue,
            statusLabel: m.status === 'UPCOMING' ? `รอแข่ง ${tempTimeStr} น.` : m.statusLabel,
          };
        }
        return m;
      })
    );
    setTimeEditMatch(null);
  };

  // Auto-schedule times apply
  const handleApplyAutoSchedule = () => {
    const [hStr, mStr] = autoStartTime.split(':');
    const startHour = parseInt(hStr || '9', 10);
    const startMinute = parseInt(mStr || '0', 10);
    const intervalMins = parseInt(autoIntervalMins, 10) || 75;
    const perDayNum = parseInt(autoMatchesPerDay, 10) || 6;
    const parsedVenues = autoVenue
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    // Persist values in localStorage so re-opening modal remembers user's custom settings
    localStorage.setItem('scicup_auto_start_date', autoStartDate);
    localStorage.setItem('scicup_auto_start_time', autoStartTime);
    localStorage.setItem('scicup_auto_interval', autoIntervalMins);
    localStorage.setItem('scicup_auto_matches_per_day', autoMatchesPerDay);
    localStorage.setItem('scicup_auto_venue', autoVenue);

    const updated = realignMatchTimesAndNumbers(matches, {
      startDate: autoStartDate,
      startHour,
      startMinute,
      matchIntervalMinutes: intervalMins,
      matchesPerDay: perDayNum,
      venues: parsedVenues,
    });
    setMatches(updated);
    setIsAutoScheduleOpen(false);
  };

  const openScoreModal = (match: Match) => {
    setActiveModalMatch(match);
    setScore1(match.score1 ?? 0);
    setScore2(match.score2 ?? 0);
    const hasPen = match.penaltyScore1 !== undefined && match.penaltyScore1 !== null && match.penaltyScore2 !== undefined && match.penaltyScore2 !== null;
    setHasPenalties(hasPen);
    setPenaltyScore1(match.penaltyScore1 ?? 0);
    setPenaltyScore2(match.penaltyScore2 ?? 0);
    const initialStatus = match.status || 'UPCOMING';
    setModalStatus(initialStatus);
    setMinuteText(
      match.currentMinute ||
      (initialStatus === 'LIVE' ? "45'" : initialStatus === 'FT' ? 'FT' : '')
    );
    setYellowCards1(match.cardsT1?.yellow || 0);
    setRedCards1(match.cardsT1?.red || 0);
    setYellowPlayers1(match.cardsT1?.yellowPlayers || '');
    setRedPlayers1(match.cardsT1?.redPlayers || '');
    setYellowCards2(match.cardsT2?.yellow || 0);
    setRedCards2(match.cardsT2?.red || 0);
    setYellowPlayers2(match.cardsT2?.yellowPlayers || '');
    setRedPlayers2(match.cardsT2?.redPlayers || '');

    // Initialize cardDetails1
    let initDetails1: CardDetail[] = match.cardsT1?.details || [];
    if (initDetails1.length === 0) {
      const yellowList = (match.cardsT1?.yellowPlayers || '').split(',').map((s) => s.trim()).filter(Boolean);
      const redList = (match.cardsT1?.redPlayers || '').split(',').map((s) => s.trim()).filter(Boolean);
      initDetails1 = [
        ...yellowList.map((num, i) => ({ id: `y1_${i}_${num}`, type: 'yellow' as const, playerNumber: num })),
        ...redList.map((num, i) => ({ id: `r1_${i}_${num}`, type: 'red' as const, playerNumber: num })),
      ];
    }
    setCardDetails1(initDetails1);

    // Initialize cardDetails2
    let initDetails2: CardDetail[] = match.cardsT2?.details || [];
    if (initDetails2.length === 0) {
      const yellowList = (match.cardsT2?.yellowPlayers || '').split(',').map((s) => s.trim()).filter(Boolean);
      const redList = (match.cardsT2?.redPlayers || '').split(',').map((s) => s.trim()).filter(Boolean);
      initDetails2 = [
        ...yellowList.map((num, i) => ({ id: `y2_${i}_${num}`, type: 'yellow' as const, playerNumber: num })),
        ...redList.map((num, i) => ({ id: `r2_${i}_${num}`, type: 'red' as const, playerNumber: num })),
      ];
    }
    setCardDetails2(initDetails2);

    // Initialize goalDetails1
    let initGoals1: GoalDetail[] = match.goalDetails1 || [];
    if (initGoals1.length === 0 && match.goalPlayers1) {
      const list = match.goalPlayers1.split(',').map((s) => s.trim()).filter(Boolean);
      initGoals1 = list.map((num, i) => ({ id: `g1_${i}_${num}`, playerNumber: num }));
    }
    setGoalDetails1(initGoals1);

    // Initialize goalDetails2
    let initGoals2: GoalDetail[] = match.goalDetails2 || [];
    if (initGoals2.length === 0 && match.goalPlayers2) {
      const list = match.goalPlayers2.split(',').map((s) => s.trim()).filter(Boolean);
      initGoals2 = list.map((num, i) => ({ id: `g2_${i}_${num}`, playerNumber: num }));
    }
    setGoalDetails2(initGoals2);

    setTempPlayerNum1('');
    setTempCardType1('yellow');
    setTempPlayerNum2('');
    setTempCardType2('yellow');
    setTempGoalPlayerNum1('');
    setTempGoalPlayerNum2('');
  };

  const handleAddGoal1 = () => {
    if (!tempGoalPlayerNum1.trim()) return;
    const num = tempGoalPlayerNum1.trim();
    const teamObj = activeModalMatch?.team1;
    const matchedPlayer =
      teamObj?.players?.find((p) => String(p.number).trim() === num) ||
      teams?.find((t) => String(t.id) === String(teamObj?.id) || t.name === teamObj?.name)?.players?.find((p) => String(p.number).trim() === num);

    const newGoal: GoalDetail = {
      id: `g1_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      playerNumber: num,
      playerName: matchedPlayer?.name,
    };
    const updated = [...goalDetails1, newGoal];
    setGoalDetails1(updated);
    setTempGoalPlayerNum1('');
    goalInputRef1.current?.focus();
    if (score1 < updated.length) {
      setScore1(updated.length);
    }
  };

  const handleRemoveGoal1 = (goalId: string) => {
    const updated = goalDetails1.filter((g) => g.id !== goalId);
    setGoalDetails1(updated);
  };

  const handleAddGoal2 = () => {
    if (!tempGoalPlayerNum2.trim()) return;
    const num = tempGoalPlayerNum2.trim();
    const teamObj = activeModalMatch?.team2;
    const matchedPlayer =
      teamObj?.players?.find((p) => String(p.number).trim() === num) ||
      teams?.find((t) => String(t.id) === String(teamObj?.id) || t.name === teamObj?.name)?.players?.find((p) => String(p.number).trim() === num);

    const newGoal: GoalDetail = {
      id: `g2_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      playerNumber: num,
      playerName: matchedPlayer?.name,
    };
    const updated = [...goalDetails2, newGoal];
    setGoalDetails2(updated);
    setTempGoalPlayerNum2('');
    goalInputRef2.current?.focus();
    if (score2 < updated.length) {
      setScore2(updated.length);
    }
  };

  const handleRemoveGoal2 = (goalId: string) => {
    const updated = goalDetails2.filter((g) => g.id !== goalId);
    setGoalDetails2(updated);
  };

  const handleAddCard1 = () => {
    if (!tempPlayerNum1.trim()) return;
    const newCard: CardDetail = {
      id: `c1_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: tempCardType1,
      playerNumber: tempPlayerNum1.trim(),
    };
    const updated = [...cardDetails1, newCard];
    setCardDetails1(updated);
    setTempPlayerNum1(''); // Reset input field immediately for next player!
    cardInputRef1.current?.focus(); // Focus back to input box immediately for smooth continuous recording

    const yellowCount = updated.filter((c) => c.type === 'yellow').length;
    const redCount = updated.filter((c) => c.type === 'red').length;
    setYellowCards1(yellowCount);
    setRedCards1(redCount);
    setYellowPlayers1(updated.filter((c) => c.type === 'yellow').map((c) => c.playerNumber).join(', '));
    setRedPlayers1(updated.filter((c) => c.type === 'red').map((c) => c.playerNumber).join(', '));
  };

  const handleRemoveCard1 = (cardId: string) => {
    const updated = cardDetails1.filter((c) => c.id !== cardId);
    setCardDetails1(updated);

    const yellowCount = updated.filter((c) => c.type === 'yellow').length;
    const redCount = updated.filter((c) => c.type === 'red').length;
    setYellowCards1(yellowCount);
    setRedCards1(redCount);
    setYellowPlayers1(updated.filter((c) => c.type === 'yellow').map((c) => c.playerNumber).join(', '));
    setRedPlayers1(updated.filter((c) => c.type === 'red').map((c) => c.playerNumber).join(', '));
  };

  const handleAddCard2 = () => {
    if (!tempPlayerNum2.trim()) return;
    const newCard: CardDetail = {
      id: `c2_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: tempCardType2,
      playerNumber: tempPlayerNum2.trim(),
    };
    const updated = [...cardDetails2, newCard];
    setCardDetails2(updated);
    setTempPlayerNum2(''); // Reset input field immediately for next player!
    cardInputRef2.current?.focus(); // Focus back to input box immediately for smooth continuous recording

    const yellowCount = updated.filter((c) => c.type === 'yellow').length;
    const redCount = updated.filter((c) => c.type === 'red').length;
    setYellowCards2(yellowCount);
    setRedCards2(redCount);
    setYellowPlayers2(updated.filter((c) => c.type === 'yellow').map((c) => c.playerNumber).join(', '));
    setRedPlayers2(updated.filter((c) => c.type === 'red').map((c) => c.playerNumber).join(', '));
  };

  const handleRemoveCard2 = (cardId: string) => {
    const updated = cardDetails2.filter((c) => c.id !== cardId);
    setCardDetails2(updated);

    const yellowCount = updated.filter((c) => c.type === 'yellow').length;
    const redCount = updated.filter((c) => c.type === 'red').length;
    setYellowCards2(yellowCount);
    setRedCards2(redCount);
    setYellowPlayers2(updated.filter((c) => c.type === 'yellow').map((c) => c.playerNumber).join(', '));
    setRedPlayers2(updated.filter((c) => c.type === 'red').map((c) => c.playerNumber).join(', '));
  };

  const handleQuickChangeStatus = (matchId: string, newStatus: MatchStatus) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === matchId) {
          let updatedLabel = m.statusLabel;
          if (newStatus === 'LIVE') updatedLabel = 'กำลังแข่งขัน';
          else if (newStatus === 'FT') updatedLabel = 'จบการแข่งขัน (FT)';
          else if (newStatus === 'UPCOMING') updatedLabel = `รอแข่ง ${m.timeStr} น.`;

          return {
            ...m,
            status: newStatus,
            statusLabel: updatedLabel,
            currentMinute:
              newStatus === 'LIVE'
                ? m.currentMinute && m.currentMinute !== 'FT'
                  ? m.currentMinute
                  : "1'"
                : newStatus === 'FT'
                  ? 'FT'
                  : m.currentMinute,
          };
        }
        return m;
      })
    );
  };

  const handleSaveScoreModal = () => {
    if (!activeModalMatch) return;

    const y1Str = cardDetails1.filter((c) => c.type === 'yellow').map((c) => c.playerNumber).join(', ');
    const r1Str = cardDetails1.filter((c) => c.type === 'red').map((c) => c.playerNumber).join(', ');
    const y2Str = cardDetails2.filter((c) => c.type === 'yellow').map((c) => c.playerNumber).join(', ');
    const r2Str = cardDetails2.filter((c) => c.type === 'red').map((c) => c.playerNumber).join(', ');

    const g1Str = goalDetails1.map((g) => g.playerNumber).join(', ');
    const g2Str = goalDetails2.map((g) => g.playerNumber).join(', ');

    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === activeModalMatch.id) {
          const sc1 = Number(score1) || 0;
          const sc2 = Number(score2) || 0;
          const p1 = hasPenalties ? Number(penaltyScore1) || 0 : undefined;
          const p2 = hasPenalties ? Number(penaltyScore2) || 0 : undefined;

          const finalStatus = modalStatus;

          let updatedLabel = m.statusLabel;
          if (finalStatus === 'LIVE') updatedLabel = 'กำลังแข่งขัน';
          else if (finalStatus === 'FT') updatedLabel = 'จบการแข่งขัน (FT)';
          else if (finalStatus === 'POSTPONED') updatedLabel = 'เลื่อนการแข่งขัน';
          else updatedLabel = `รอแข่ง ${m.timeStr} น.`;

          return {
            ...m,
            score1: sc1,
            score2: sc2,
            penaltyScore1: p1,
            penaltyScore2: p2,
            team1: { ...m.team1, score: sc1, penaltyScore: p1 },
            team2: { ...m.team2, score: sc2, penaltyScore: p2 },
            status: finalStatus,
            statusLabel: updatedLabel,
            currentMinute: finalStatus === 'FT' && (!minuteText || minuteText === '') ? 'FT' : minuteText,
            cardsT1: {
              yellow: cardDetails1.filter((c) => c.type === 'yellow').length,
              red: cardDetails1.filter((c) => c.type === 'red').length,
              yellowPlayers: y1Str,
              redPlayers: r1Str,
              details: cardDetails1,
            },
            cardsT2: {
              yellow: cardDetails2.filter((c) => c.type === 'yellow').length,
              red: cardDetails2.filter((c) => c.type === 'red').length,
              yellowPlayers: y2Str,
              redPlayers: r2Str,
              details: cardDetails2,
            },
            goalPlayers1: g1Str,
            goalPlayers2: g2Str,
            goalDetails1: goalDetails1,
            goalDetails2: goalDetails2,
          };
        }
        return m;
      })
    );
    setActiveModalMatch(null);
  };


  // Export Excel (.xlsx) formatted to match schedule sheet with dedicated VS column
  const handleExportExcel = () => {
    // Sort all tournament matches in ascending order of matchNumber
    const sorted = [...matches].sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));

    const rows: (string | number)[][] = [
      ['ตารางการแข่งขัน', '', '', '', '', '', ''],
      ['คู่', 'กลุ่ม', 'แมตช์', '', '', 'เวลา', 'หมายเหตุ'],
    ];

    const getExcelGroupLabel = (m: Match): string => {
      const r = (m.round || '').trim();
      const g = (m.group || '').trim();

      if (r.includes('ชิงที่ 3') || r.includes('ชิงอันดับ 3') || r.includes('3rd Place')) return 'ชิงที่ 3';
      if (r.includes('ชิงชนะเลิศ') || r.includes('Grand Final')) return 'ชิงที่ 1';
      if (r.includes('รองชนะเลิศ') || r.includes('รอบรอง') || r.toLowerCase().includes('semi')) return 'รอบรอง';
      if (r.includes('8 ทีม') || r.toLowerCase().includes('qf') || r.toLowerCase().includes('quarter')) return 'รอบ 8 ทีม';
      if (r.includes('16 ทีม') || r.toLowerCase().includes('r16')) return 'รอบ 16 ทีม';

      const gMatch = g.match(/(?:กลุ่ม|สาย|group)\s*([A-Za-z0-9]+)/i);
      if (gMatch) return gMatch[1].toUpperCase();

      const rMatch = r.match(/(?:กลุ่ม|สาย|group)\s*([A-Za-z0-9]+)/i);
      if (rMatch) return rMatch[1].toUpperCase();

      if (g && g !== 'Knockout' && g !== 'รอบน็อคเอาท์') {
        return g.replace(/^(กลุ่ม|สาย)\s*/, '');
      }

      return 'รอบแบ่งกลุ่ม';
    };

    const getExcelTime = (timeStr?: string, fallbackTime?: string): string => {
      const raw = (timeStr || fallbackTime || '').trim();
      if (!raw || raw === '-') return '';

      let cleaned = raw.replace(/\s*น\.?$/i, '').trim();

      // If time has range e.g. "08.50-09.10" or "08:50 - 09:10", extract only start time
      if (cleaned.includes('-')) {
        cleaned = cleaned.split('-')[0].trim();
      }

      // Convert colon to dot (e.g. 08:50 -> 08.50)
      cleaned = cleaned.replace(':', '.');

      // Pad single-digit hour if needed (e.g. 8.50 -> 08.50)
      const parts = cleaned.split('.');
      if (parts.length === 2 && parts[0].length === 1) {
        cleaned = `0${parts[0]}.${parts[1]}`;
      }

      return cleaned;
    };

    sorted.forEach((m, idx) => {
      const matchNo = m.matchNumber || (idx + 1);
      const groupLabel = getExcelGroupLabel(m);
      const t1 = (m.team1?.name || '-').trim();
      const t2 = (m.team2?.name || '-').trim();
      const timeFormatted = getExcelTime(m.timeStr, m.time);
      const note = (m.venue && m.venue !== 'สนามหลัก') ? m.venue : '';

      rows.push([matchNo, groupLabel, t1, 'VS', t2, timeFormatted, note]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Merge A1:G1 for "ตารางการแข่งขัน" header and C2:E2 for "แมตช์" header
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // ตารางการแข่งขัน
      { s: { r: 1, c: 2 }, e: { r: 1, c: 4 } }  // แมตช์ (Team 1, VS, Team 2)
    ];

    // Column widths matching the requested format: คู่, กลุ่ม, ทีม 1, VS, ทีม 2, เวลา, หมายเหตุ
    ws['!cols'] = [
      { wch: 8 },   // คู่
      { wch: 14 },  // กลุ่ม
      { wch: 24 },  // ทีม 1
      { wch: 6 },   // VS
      { wch: 24 },  // ทีม 2
      { wch: 14 },  // เวลา
      { wch: 18 }   // หมายเหตุ
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ตารางการแข่งขัน');

    const fileName = `${(tournamentName || 'SCICUP').replace(/\s+/g, '_')}_ตารางการแข่งขัน.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Title Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[#6f5d00] text-xs font-bold uppercase tracking-wider mb-1">
            <CalendarDays className="w-4 h-4" />
            <span>{tournamentName} • โปรแกรมทางการ</span>
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-[#1b1c1c] tracking-tight">
            ตารางและโปรแกรมการแข่งขัน (Matches &amp; Fixtures)
          </h1>
          <p className="text-sm text-[#4b4737] mt-1">
            จัดการโปรแกรมแข่งขัน ตรวจสอบวันเวลา สนาม และบันทึกผลสกอร์สดแบบเรียลไทม์
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-800 font-display font-bold text-xs shadow-xs border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer"
            title="ส่งออกตารางการแข่งขันเป็นไฟล์ Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>ส่งออกตาราง / Export Excel</span>
          </button>


          <button
            type="button"
            onClick={() => setIsAutoScheduleOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#1b1c1c] font-display font-bold text-xs shadow-xs border border-[#efeded] hover:bg-[#f5f3f3] transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#6f5d00]" />
            <span>ตั้งเวลาแข่งอัตโนมัติ</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Round & Status Filters */}
      <div className="bg-white p-4 rounded-3xl border border-[#efeded] shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Round Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          <span className="text-xs font-bold text-[#4b4737] shrink-0 mr-1">รอบ:</span>
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'รอบแบ่งกลุ่ม (Group Stage)', label: 'รอบแบ่งกลุ่ม' },
            { id: 'รอบ 16 ทีมสุดท้าย', label: 'รอบ 16 ทีม' },
            { id: 'รอบ 8 ทีมสุดท้าย', label: 'รอบ 8 ทีม' },
            { id: 'รอบรองชนะเลิศ', label: 'รอบรองฯ' },
            { id: 'นัดชิงอันดับ 3', label: 'ชิงอันดับ 3' },
            { id: 'นัดชิงชนะเลิศ', label: 'นัดชิงฯ' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedRound(r.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${selectedRound === r.id
                ? 'bg-[#1b1c1c] text-[#ffe680] shadow-2xs font-black'
                : 'bg-[#f5f3f3] text-[#4b4737] hover:bg-[#efeded]'
                }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          <span className="text-xs font-bold text-[#4b4737] shrink-0 mr-1">สถานะ:</span>
          {[
            { id: 'all', label: 'ทุกสถานะ' },
            { id: 'LIVE', label: 'กำลังแข่ง' },
            { id: 'FT', label: 'จบเกมแล้ว' },
            { id: 'UPCOMING', label: 'ยังไม่แข่ง' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedStatus(s.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${selectedStatus === s.id
                ? 'bg-[#ffe680] text-[#786607] shadow-2xs font-black'
                : 'bg-[#f5f3f3] text-[#4b4737] hover:bg-[#efeded]'
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Match Cards Container */}
      {matches.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-[#4b4737] border border-[#efeded] shadow-xs space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-[#ffe680]/40 text-[#786607] flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-lg text-[#1b1c1c]">
            ยังไม่มีโปรแกรมการแข่งขันในระบบ
          </h3>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-[#4b4737] border border-[#efeded]">
          <Filter className="w-8 h-8 mx-auto text-[#4b4737]/60 mb-2" />
          <p className="font-display font-bold text-sm">ไม่พบการแข่งขันตามตัวกรองที่เลือก</p>
          <p className="text-xs mt-1">ลองเปลี่ยนกลุ่มหรือสถานะการแข่งขัน</p>
        </div>
      ) : viewMode === 'sequence' ? (
        /* Sequence View: Full continuous drag & drop list */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 text-xs text-[#4b4737]">
            <span className="flex items-center gap-1.5 font-semibold">
              <GripVertical className="w-4 h-4 text-[#6f5d00]" />
              ลำดับการแข่งขันทั้งหมด ({filteredMatches.length} นัด) — ลากการ์ดขึ้น-ลง หรือใช้ปุ่ม ▲▼ เพื่อสลับคิวแข่งขัน
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredMatches.map((m, idx) => {
              const isLive = m.status === 'LIVE';
              const isCompleted = m.status === 'FT';
              const isDragging = draggedMatchId === m.id;
              const isDragTarget = dragOverMatchId === m.id;

              return (
                <div
                  key={m.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, m.id)}
                  onDragOver={(e) => handleDragOver(e, m.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, m.id)}
                  onDragEnd={handleDragEnd}
                  className={`bg-white rounded-2xl sm:rounded-3xl border shadow-2xs hover:shadow-md hover:border-[#ffe680] transition-all overflow-hidden ${isLive
                    ? 'border-[#007746]/50 ring-2 ring-[#95fcbc]/40 shadow-xs'
                    : 'border-[#efeded]'
                    } ${isDragging ? 'opacity-40 scale-[0.99] border-dashed border-[#6f5d00]' : ''} ${isDragTarget ? 'ring-2 ring-[#786607] bg-[#ffe680]/20 scale-[1.01]' : ''
                    }`}
                >
                  {/* Top Header Strip (User-style header bar) */}
                  <div className="bg-[#faf9f8] px-3.5 sm:px-4 py-2 border-b border-[#efeded] flex flex-wrap items-center justify-between gap-2 text-xs">
                    {/* Left: Drag Handle, Match #, Group, Status */}
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <div
                        className="cursor-grab active:cursor-grabbing text-[#888580] hover:text-[#1b1c1c] p-1 rounded hover:bg-[#efeded] transition-colors"
                        title="ลากเพื่อสลับลำดับ"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <span className="font-mono font-bold text-[#4b4737] bg-white px-2 py-0.5 rounded border border-[#efeded] text-[11px] shadow-2xs">
                        #{m.matchNumber || idx + 1}
                      </span>
                      <span className="font-bold text-[#786607] bg-[#ffe680]/50 px-2.5 py-0.5 rounded-full text-[11px] truncate border border-[#ffe680]/60">
                        {formatMatchGroupLabel(m.group, m.round)}
                      </span>

                      {/* Status Badge */}
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#95fcbc] text-[#007746] text-[11px] font-black shadow-2xs animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#006d40]" />
                          สด
                        </span>
                      ) : isCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#efeded] text-[#4b4737] text-[11px] font-bold border border-[#efeded]">
                          จบเกม
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-[#888580] text-[11px] font-medium border border-[#efeded]">
                          ยังไม่แข่ง
                        </span>
                      )}
                    </div>

                    {/* Right: Interactive Date • Time • Stadium Button */}
                    <button
                      type="button"
                      onClick={() => openTimeEditModal(m)}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-[#4b4737] hover:text-[#1b1c1c] bg-white hover:bg-[#ffe680]/30 border border-[#efeded] hover:border-[#ffe680] px-2.5 py-1 rounded-full transition-all shadow-2xs shrink-0"
                      title="คลิกเพื่อแก้ไข วัน เวลา หรือสนาม"
                    >
                      <CalendarDays className="w-3.5 h-3.5 text-[#6f5d00]" />
                      <span>{m.dateStr || 'วันแข่ง'}</span>
                      <span className="text-[#888580]">•</span>
                      <Clock className="w-3.5 h-3.5 text-[#6f5d00]" />
                      <span className="font-bold text-[#1b1c1c]">{m.timeStr} น.</span>
                      <span className="text-[#888580]">•</span>
                      <MapPin className="w-3.5 h-3.5 text-[#6f5d00]" />
                      <span>{m.venue || 'ระบุสนาม'}</span>
                      <Edit3 className="w-3 h-3 text-[#786607] ml-0.5" />
                    </button>
                  </div>

                  {/* Main Arena: Team 1 vs Team 2 + Score/VS + Admin Action */}
                  <div className="p-3.5 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
                    {/* Teams Arena Centerpiece */}
                    {(() => {
                      const t1NameDisplay = formatTeamDisplayName(m.team1?.name, false, m);
                      const t2NameDisplay = formatTeamDisplayName(m.team2?.name, true, m);
                      const hasPenalties = m.penaltyScore1 !== undefined && m.penaltyScore1 !== null && m.penaltyScore2 !== undefined && m.penaltyScore2 !== null;
                      const isT1Winner = m.score1 > m.score2 || (m.score1 === m.score2 && hasPenalties && (m.penaltyScore1 || 0) > (m.penaltyScore2 || 0));
                      const isT2Winner = m.score2 > m.score1 || (m.score1 === m.score2 && hasPenalties && (m.penaltyScore2 || 0) > (m.penaltyScore1 || 0));
                      return (
                        <div className="flex items-center justify-between gap-2 sm:gap-4 flex-1 w-full">
                          {/* Team 1 (Home) */}
                          <div className="flex items-center justify-end gap-2.5 sm:gap-3.5 flex-1 min-w-0 text-right">
                            <span className="font-display font-bold text-sm sm:text-base md:text-lg text-[#1b1c1c] truncate">
                              {t1NameDisplay}
                            </span>
                            <TeamLogo
                              logo={m.team1?.logo}
                              name={t1NameDisplay}
                              className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 shadow-2xs"
                            />
                          </div>

                          {/* Centerpiece: Time or Score Badge */}
                          <div className="w-24 sm:w-32 shrink-0 text-center px-1">
                            {isLive ? (
                              <div className="bg-[#95fcbc]/30 border border-[#007746]/40 rounded-2xl py-1.5 px-2.5 ring-2 ring-[#95fcbc]/30">
                                <div className="font-display font-black text-xl sm:text-2xl text-[#007746] leading-none flex items-center justify-center gap-1.5">
                                  <span>{m.score1}{hasPenalties && <span className="text-xs sm:text-sm font-bold">({m.penaltyScore1})</span>}</span>
                                  <span className="text-xs text-[#007746]/70">-</span>
                                  <span>{m.score2}{hasPenalties && <span className="text-xs sm:text-sm font-bold">({m.penaltyScore2})</span>}</span>
                                </div>
                                <span className="inline-block mt-0.5 text-[10px] sm:text-[11px] font-bold text-[#007746] animate-pulse">
                                  กำลังแข่งขัน
                                </span>
                              </div>
                            ) : isCompleted ? (
                              <div className="bg-[#f5f3f3] border border-[#efeded] rounded-2xl py-1.5 px-2.5">
                                <div className="font-display font-black text-xl sm:text-2xl leading-none flex items-center justify-center gap-1.5">
                                  <span className={isT1Winner ? 'text-[#007746]' : 'text-[#1b1c1c]'}>
                                    {m.score1}{hasPenalties && <span className="text-xs sm:text-sm font-bold">({m.penaltyScore1})</span>}
                                  </span>
                                  <span className="text-xs text-[#888580]">-</span>
                                  <span className={isT2Winner ? 'text-[#007746]' : 'text-[#1b1c1c]'}>
                                    {m.score2}{hasPenalties && <span className="text-xs sm:text-sm font-bold">({m.penaltyScore2})</span>}
                                  </span>
                                </div>
                                <span className="inline-block mt-0.5 text-[10px] sm:text-[11px] font-bold text-[#4b4737]">
                                  จบเกมส์
                                </span>
                              </div>
                            ) : (
                              <div className="bg-[#f5f3f3] border border-[#efeded] rounded-2xl py-2 px-3 flex items-center justify-center">
                                <div className="font-display font-black text-sm sm:text-base text-[#1b1c1c] leading-none">
                                  {m.timeStr ? `${m.timeStr} น.` : 'VS'}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Team 2 (Away) */}
                          <div className="flex items-center justify-start gap-2.5 sm:gap-3.5 flex-1 min-w-0 text-left">
                            <TeamLogo
                              logo={m.team2?.logo}
                              name={t2NameDisplay}
                              className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 shadow-2xs"
                            />
                            <span className="font-display font-bold text-sm sm:text-base md:text-lg text-[#1b1c1c] truncate">
                              {t2NameDisplay}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Admin Action Button */}
                    <div className="shrink-0 w-full md:w-auto flex justify-end">
                      <button
                        type="button"
                        onClick={() => openScoreModal(m)}
                        className="w-full md:w-auto px-3 py-2 rounded-xl bg-[#007746] hover:bg-[#006038] text-white font-display font-bold text-xs sm:text-sm transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>ปรับสกอร์ &amp; สถานะ</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* By Date Grouped View */
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([dateStr, matchGroup], groupIdx) => (
            <section key={dateStr} className="space-y-3">
              {/* Date Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-[#f5f3f3] px-4 py-2.5 rounded-2xl border border-[#efeded]">
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-[#6f5d00]" />
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-display font-bold text-sm text-[#1b1c1c]">
                      {dateStr}
                    </span>
                    <span className="text-xs text-[#4b4737]">
                      • วันที่ {groupIdx + 1} ของการแข่งขัน
                    </span>
                  </div>
                </div>
                <span className="text-xs text-[#4b4737] font-medium">
                  {matchGroup.length} แมตช์ตามโปรแกรม
                </span>
              </div>

              {/* Fixture Cards */}
              <div className="grid grid-cols-1 gap-3">
                {matchGroup.map((m, mIdx) => {
                  const isLive = m.status === 'LIVE';
                  const isCompleted = m.status === 'FT';
                  const isDragging = draggedMatchId === m.id;
                  const isDragTarget = dragOverMatchId === m.id;

                  return (
                    <div
                      key={m.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, m.id)}
                      onDragOver={(e) => handleDragOver(e, m.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, m.id)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white rounded-2xl sm:rounded-3xl border shadow-2xs hover:shadow-md hover:border-[#ffe680] transition-all overflow-hidden ${isLive
                        ? 'border-[#007746]/50 ring-2 ring-[#95fcbc]/40 shadow-xs'
                        : 'border-[#efeded]'
                        } ${isDragging ? 'opacity-40 scale-[0.99] border-dashed border-[#6f5d00]' : ''} ${isDragTarget ? 'ring-2 ring-[#786607] bg-[#ffe680]/20 scale-[1.01]' : ''
                        }`}
                    >
                      {/* Top Header Strip (User-style header bar) */}
                      <div className="bg-[#faf9f8] px-3.5 sm:px-4 py-2 border-b border-[#efeded] flex flex-wrap items-center justify-between gap-2 text-xs">
                        {/* Left: Drag Handle, Match #, Group, Status */}
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <div
                            className="cursor-grab active:cursor-grabbing text-[#888580] hover:text-[#1b1c1c] p-1 rounded hover:bg-[#efeded] transition-colors"
                            title="ลากเพื่อสลับลำดับ"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <span className="font-mono font-bold text-[#4b4737] bg-white px-2 py-0.5 rounded border border-[#efeded] text-[11px] shadow-2xs">
                            #{m.matchNumber || mIdx + 1}
                          </span>
                          <span className="font-bold text-[#786607] bg-[#ffe680]/50 px-2.5 py-0.5 rounded-full text-[11px] truncate border border-[#ffe680]/60">
                            {formatMatchGroupLabel(m.group, m.round)}
                          </span>

                          {/* Status Badge */}
                          {isLive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#95fcbc] text-[#007746] text-[11px] font-black shadow-2xs animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#006d40]" />
                              สด
                            </span>
                          ) : isCompleted ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#efeded] text-[#4b4737] text-[11px] font-bold border border-[#efeded]">
                              จบเกม
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-white text-[#888580] text-[11px] font-medium border border-[#efeded]">
                              ยังไม่แข่ง
                            </span>
                          )}
                        </div>

                        {/* Right: Interactive Date • Time • Stadium Button */}
                        <button
                          type="button"
                          onClick={() => openTimeEditModal(m)}
                          className="flex items-center gap-1.5 text-[11px] font-medium text-[#4b4737] hover:text-[#1b1c1c] bg-white hover:bg-[#ffe680]/30 border border-[#efeded] hover:border-[#ffe680] px-2.5 py-1 rounded-full transition-all shadow-2xs shrink-0"
                          title="คลิกเพื่อแก้ไข วัน เวลา หรือสนาม"
                        >
                          <CalendarDays className="w-3.5 h-3.5 text-[#6f5d00]" />
                          <span>{m.dateStr || 'วันแข่ง'}</span>
                          <span className="text-[#888580]">•</span>
                          <Clock className="w-3.5 h-3.5 text-[#6f5d00]" />
                          <span className="font-bold text-[#1b1c1c]">{m.timeStr} น.</span>
                          <span className="text-[#888580]">•</span>
                          <MapPin className="w-3.5 h-3.5 text-[#6f5d00]" />
                          <span>{m.venue || 'ระบุสนาม'}</span>
                          <Edit3 className="w-3 h-3 text-[#786607] ml-0.5" />
                        </button>
                      </div>

                      {/* Main Arena: Team 1 vs Team 2 + Score/VS + Admin Action */}
                      <div className="p-3.5 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
                        {/* Teams Arena Centerpiece */}
                        {(() => {
                          const t1NameDisplay = formatTeamDisplayName(m.team1?.name, false, m);
                          const t2NameDisplay = formatTeamDisplayName(m.team2?.name, true, m);
                          const hasPenalties = m.penaltyScore1 !== undefined && m.penaltyScore1 !== null && m.penaltyScore2 !== undefined && m.penaltyScore2 !== null;
                          const isT1Winner = m.score1 > m.score2 || (m.score1 === m.score2 && hasPenalties && (m.penaltyScore1 || 0) > (m.penaltyScore2 || 0));
                          const isT2Winner = m.score2 > m.score1 || (m.score1 === m.score2 && hasPenalties && (m.penaltyScore2 || 0) > (m.penaltyScore1 || 0));
                          return (
                            <div className="flex items-center justify-between gap-2 sm:gap-4 flex-1 w-full">
                              {/* Team 1 (Home) */}
                              <div className="flex items-center justify-end gap-2.5 sm:gap-3.5 flex-1 min-w-0 text-right">
                                <span className="font-display font-bold text-sm sm:text-base md:text-lg text-[#1b1c1c] truncate">
                                  {t1NameDisplay}
                                </span>
                                <TeamLogo
                                  logo={m.team1?.logo}
                                  name={t1NameDisplay}
                                  className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 shadow-2xs"
                                />
                              </div>

                              {/* Centerpiece: Time or Score Badge */}
                              <div className="w-24 sm:w-32 shrink-0 text-center px-1">
                                {isLive ? (
                                  <div className="bg-[#95fcbc]/30 border border-[#007746]/40 rounded-2xl py-1.5 px-2.5 ring-2 ring-[#95fcbc]/30">
                                    <div className="font-display font-black text-xl sm:text-2xl text-[#007746] leading-none flex items-center justify-center gap-1.5">
                                      <span>{m.score1}{hasPenalties && <span className="text-xs sm:text-sm font-bold">({m.penaltyScore1})</span>}</span>
                                      <span className="text-xs text-[#007746]/70">-</span>
                                      <span>{m.score2}{hasPenalties && <span className="text-xs sm:text-sm font-bold">({m.penaltyScore2})</span>}</span>
                                    </div>
                                    <span className="inline-block mt-0.5 text-[10px] sm:text-[11px] font-bold text-[#007746] animate-pulse">
                                      กำลังแข่งขัน
                                    </span>
                                  </div>
                                ) : isCompleted ? (
                                  <div className="bg-[#f5f3f3] border border-[#efeded] rounded-2xl py-1.5 px-2.5">
                                    <div className="font-display font-black text-xl sm:text-2xl leading-none flex items-center justify-center gap-1.5">
                                      <span className={isT1Winner ? 'text-[#007746]' : 'text-[#1b1c1c]'}>
                                        {m.score1}{hasPenalties && <span className="text-xs sm:text-sm font-bold">({m.penaltyScore1})</span>}
                                      </span>
                                      <span className="text-xs text-[#888580]">-</span>
                                      <span className={isT2Winner ? 'text-[#007746]' : 'text-[#1b1c1c]'}>
                                        {m.score2}{hasPenalties && <span className="text-xs sm:text-sm font-bold">({m.penaltyScore2})</span>}
                                      </span>
                                    </div>
                                    <span className="inline-block mt-0.5 text-[10px] sm:text-[11px] font-bold text-[#4b4737]">
                                      จบเกมส์
                                    </span>
                                  </div>
                                ) : (
                                  <div className="bg-[#f5f3f3] border border-[#efeded] rounded-2xl py-2 px-3 flex items-center justify-center">
                                    <div className="font-display font-black text-sm sm:text-base text-[#1b1c1c] leading-none">
                                      {m.timeStr ? `${m.timeStr} น.` : 'VS'}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Team 2 (Away) */}
                              <div className="flex items-center justify-start gap-2.5 sm:gap-3.5 flex-1 min-w-0 text-left">
                                <TeamLogo
                                  logo={m.team2?.logo}
                                  name={t2NameDisplay}
                                  className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 shadow-2xs"
                                />
                                <span className="font-display font-bold text-sm sm:text-base md:text-lg text-[#1b1c1c] truncate">
                                  {t2NameDisplay}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Admin Action Button */}
                        <div className="shrink-0 w-full md:w-auto flex justify-end">
                          <button
                            type="button"
                            onClick={() => openScoreModal(m)}
                            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-[#007746] hover:bg-[#006038] text-white font-display font-bold text-xs sm:text-sm transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>ปรับสกอร์ &amp; สถานะ</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Edit Match Time, Date & Venue Modal */}
      {timeEditMatch && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#efeded] relative animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#efeded]">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#6f5d00]" />
                <h3 className="font-display text-base font-bold text-[#1b1c1c]">
                  แก้ไขวัน เวลา และสนามแข่งขัน
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTimeEditMatch(null)}
                className="p-1 rounded-full hover:bg-[#efeded] text-[#4b4737]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Match info preview */}
            <div className="p-3 bg-[#f5f3f3] rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1b1c1c]">
                <span className="px-2 py-0.5 rounded-full bg-[#1b1c1c] text-white text-[10px] font-mono">
                  #{timeEditMatch.matchNumber}
                </span>
                <span>{timeEditMatch.team1.name}</span>
                <span className="text-[#4b4737]">vs</span>
                <span>{timeEditMatch.team2.name}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#ffe680]/60 text-[#786607] font-semibold">
                {formatMatchGroupLabel(timeEditMatch.group, timeEditMatch.round)}
              </span>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#4b4737] uppercase mb-1">
                  เวลาคิกออฟ (Kick-off Time)
                </label>
                <input
                  type="text"
                  value={tempTimeStr}
                  onChange={(e) => setTempTimeStr(e.target.value)}
                  placeholder="เช่น 09:00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#efeded] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#ffe680] bg-white"
                />
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {['08:00', '09:00', '10:00', '13:00', '14:00', '15:30', '17:00'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTempTimeStr(preset)}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-medium border transition-all ${tempTimeStr === preset
                        ? 'bg-[#ffe680] text-[#786607] border-[#ffe680] font-bold'
                        : 'bg-[#faf9f8] text-[#4b4737] border-[#efeded] hover:bg-[#f5f3f3]'
                        }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4b4737] uppercase mb-1">
                  วันที่แข่งขัน (Date)
                </label>
                <input
                  type="text"
                  value={tempDateStr}
                  onChange={(e) => setTempDateStr(e.target.value)}
                  placeholder="เช่น วันพฤหัสบดีที่ 1 ตุลาคม 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#efeded] text-sm focus:outline-none focus:ring-2 focus:ring-[#ffe680] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4b4737] uppercase mb-1">
                  สถานที่ / สนามแข่งขัน (Venue)
                </label>
                <input
                  type="text"
                  value={tempVenue}
                  onChange={(e) => setTempVenue(e.target.value)}
                  placeholder="เช่น สนามสมาร์ท สเตเดียม หรือ สนาม 1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#efeded] text-sm focus:outline-none focus:ring-2 focus:ring-[#ffe680] bg-white text-[#1b1c1c]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#efeded] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTimeEditMatch(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#4b4737] hover:bg-[#f5f3f3]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveTimeEdit}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#ffe680] text-[#786607] font-display font-bold text-xs hover:bg-[#fbe27c] transition-all shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกการเปลี่ยนแปลง</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Schedule Times Modal */}
      {isAutoScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#efeded] relative animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#efeded]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#6f5d00]" />
                <h3 className="font-display text-base font-bold text-[#1b1c1c]">
                  จัดเวลาแข่งขันใหม่อัตโนมัติตามลำดับ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAutoScheduleOpen(false)}
                className="p-1 rounded-full hover:bg-[#efeded] text-[#4b4737]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#4b4737]">
              ระบบจะคำนวณเวลาคิกออฟและวันที่แข่งขันใหม่ ให้สัมพันธ์กับลำดับแมตช์ที่คุณจัดเรียงไว้โดยอัตโนมัติ
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#4b4737] uppercase mb-1">
                  วันที่เริ่มแข่งขัน
                </label>
                <input
                  type="date"
                  value={autoStartDate}
                  onChange={(e) => setAutoStartDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker?.();
                    } catch (_) { }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#efeded] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#ffe680] bg-white cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4b4737] uppercase mb-1">
                  เวลาเริ่มแมตช์แรกของแต่ละวัน
                </label>
                <input
                  type="text"
                  value={autoStartTime}
                  onChange={(e) => setAutoStartTime(e.target.value)}
                  placeholder="เช่น 09:00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#efeded] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#ffe680] bg-white"
                />
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {['08:00', '09:00', '10:00', '13:00', '14:00'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAutoStartTime(preset)}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-medium border transition-all ${autoStartTime === preset
                        ? 'bg-[#ffe680] text-[#786607] border-[#ffe680] font-bold'
                        : 'bg-[#faf9f8] text-[#4b4737] border-[#efeded] hover:bg-[#f5f3f3]'
                        }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4b4737] uppercase mb-1">
                  ระยะห่างระหว่างคู่ (นาที รวมพักและเตรียมสนาม)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={autoIntervalMins}
                  onChange={(e) => setAutoIntervalMins(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="เช่น 75"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#efeded] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#ffe680] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4b4737] uppercase mb-1">
                  จำนวนแมตช์สูงสุดต่อวัน (ก่อนเริ่มวันถัดไป)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={autoMatchesPerDay}
                  onChange={(e) => setAutoMatchesPerDay(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="เช่น 6"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#efeded] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#ffe680] bg-white text-[#1b1c1c]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4b4737] uppercase mb-1">
                  สนามแข่งขัน (Venue)
                </label>
                <input
                  type="text"
                  value={autoVenue}
                  onChange={(e) => setAutoVenue(e.target.value)}
                  placeholder="เช่น สนามฟุตบอลสมาร์ทวิทย์ (ใส่หลายสนามคั่นด้วย , ได้)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#efeded] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#ffe680] bg-white text-[#1b1c1c]"
                />
                <p className="text-[11px] text-[#888580] mt-1">
                  หากต้องการเวียนใช้หลายสนาม ให้พิมพ์คั่นด้วยเครื่องหมายจุลภาค เช่น: <span className="font-mono font-bold text-[#4b4737]">สนาม 1, สนาม 2</span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#efeded] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAutoScheduleOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#4b4737] hover:bg-[#f5f3f3]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleApplyAutoSchedule}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#ffe680] text-[#786607] font-display font-bold text-xs hover:bg-[#fbe27c] transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>คำนวณและปรับเวลา</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Score Entry Modal (Embedded Dynamic Controller) */}
      {activeModalMatch && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#efeded] relative animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#efeded]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#ffe680] text-[#786607] flex items-center justify-center font-bold">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-[#1b1c1c]">
                    ปรับสกอร์และสถานะการแข่งขัน
                  </h3>
                  <p className="text-xs text-[#4b4737]">
                    แมตช์ #{activeModalMatch.matchNumber || 1} • {formatMatchGroupLabel(activeModalMatch.group, activeModalMatch.round)} • เวลา {activeModalMatch.timeStr} น.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalMatch(null)}
                className="p-1.5 rounded-full hover:bg-[#efeded] text-[#4b4737] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Status Selector Segmented Controls */}
            <div className="my-4">
              <label className="text-xs uppercase font-bold text-[#4b4737] block mb-2">
                สถานะการแข่งขัน
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* LIVE */}
                <button
                  type="button"
                  onClick={() => {
                    setModalStatus('LIVE');
                    if (!minuteText || minuteText === 'FT') setMinuteText("45'");
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center ${modalStatus === 'LIVE'
                    ? 'bg-[#95fcbc]/30 border-[#007746] text-[#007746] ring-2 ring-[#007746]/20 font-bold shadow-xs'
                    : 'bg-[#f5f3f3] border-[#efeded] text-[#4b4737] hover:bg-white hover:border-[#1b1c1c]/20'
                    }`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#006d40] animate-ping" />
                    กำลังแข่ง
                  </span>
                  <span className="text-[10px] opacity-80 mt-0.5">LIVE Match</span>
                </button>

                {/* FULL TIME */}
                <button
                  type="button"
                  onClick={() => {
                    setModalStatus('FT');
                    setMinuteText('FT');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center ${modalStatus === 'FT'
                    ? 'bg-[#1b1c1c] border-[#1b1c1c] text-white ring-2 ring-black/20 font-bold shadow-xs'
                    : 'bg-[#f5f3f3] border-[#efeded] text-[#4b4737] hover:bg-white hover:border-[#1b1c1c]/20'
                    }`}
                >
                  <span className="text-xs font-bold inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> จบการแข่งขัน</span>
                  <span className="text-[10px] opacity-80 mt-0.5">Full Time (FT)</span>
                </button>

                {/* UPCOMING */}
                <button
                  type="button"
                  onClick={() => {
                    setModalStatus('UPCOMING');
                    if (minuteText === 'FT') setMinuteText('');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center ${modalStatus === 'UPCOMING'
                    ? 'bg-[#ffe680] border-[#786607] text-[#786607] ring-2 ring-[#786607]/20 font-bold shadow-xs'
                    : 'bg-[#f5f3f3] border-[#efeded] text-[#4b4737] hover:bg-white hover:border-[#1b1c1c]/20'
                    }`}
                >
                  <span className="text-xs font-bold inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> ยังไม่แข่ง</span>
                  <span className="text-[10px] opacity-80 mt-0.5">รอเริ่มแข่งขัน</span>
                </button>
              </div>

              {/* Helpful note based on selected status */}
              <div className="mt-2 px-3 py-1.5 rounded-xl bg-[#f5f3f3] text-[11px] text-[#4b4737] flex items-center gap-1.5">
                {modalStatus === 'FT' && (
                  <span className="inline-flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" /> <b>จบการแข่งขัน:</b> ผลคะแนนจะถูกนำไปคำนวณในตารางคะแนน (Standings) กลุ่ม {activeModalMatch.group} ทันที</span>
                )}
                {modalStatus === 'LIVE' && (
                  <span className="inline-flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> <b>กำลังแข่งขัน:</b> สกอร์จะแสดงผลสดพร้อมไฟกระพริบ LIVE บนหน้าจอ</span>
                )}
                {modalStatus === 'UPCOMING' && (
                  <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <b>ยังไม่แข่ง:</b> สกอร์จะถูกตั้งเป็นสกอร์เริ่มต้นหรือรอแข่ง</span>
                )}
              </div>
            </div>

            {/* 2. Match Score Adjuster Banner */}
            <div className="py-4 px-4 bg-[#f5f3f3] rounded-2xl mb-4 border border-[#efeded]">
              <div className="grid grid-cols-11 items-center gap-2">
                {/* Team 1 Score Adjuster */}
                <div className="col-span-5 flex flex-col items-center text-center">
                  <div className="flex items-center gap-2 mb-1 justify-center max-w-full">
                    <TeamLogo logo={activeModalMatch.team1.logo} name={activeModalMatch.team1.name} className="w-7 h-7" />
                    <span className="font-display font-bold text-sm text-[#1b1c1c] truncate max-w-[130px]">
                      {activeModalMatch.team1.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#4b4737] mb-2 font-medium">เจ้าบ้าน</span>

                  {/* Score Stepper */}
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setScore1(Math.max(0, score1 - 1))}
                      className="w-9 h-9 rounded-full bg-white border border-[#efeded] flex items-center justify-center font-bold text-base text-[#1b1c1c] hover:bg-[#efeded] shadow-xs active:scale-95 transition-all"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={score1}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setScore1(val === '' ? 0 : parseInt(val, 10));
                      }}
                      className="w-14 text-center font-display text-3xl font-black text-[#1b1c1c] bg-white border border-[#efeded] rounded-xl py-1 focus:ring-2 focus:ring-[#ffe680] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setScore1(score1 + 1)}
                      className="w-9 h-9 rounded-full bg-[#ffe680] text-[#786607] flex items-center justify-center font-bold text-base hover:bg-[#fbe27c] shadow-xs active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Center Divider / Minute */}
                <div className="col-span-1 flex flex-col items-center justify-center text-center">
                  <span className="font-display text-xl font-black text-[#888580] leading-none">
                    :
                  </span>
                </div>

                {/* Team 2 Score Adjuster */}
                <div className="col-span-5 flex flex-col items-center text-center">
                  <div className="flex items-center gap-2 mb-1 justify-center max-w-full">
                    <TeamLogo logo={activeModalMatch.team2.logo} name={activeModalMatch.team2.name} className="w-7 h-7" />
                    <span className="font-display font-bold text-sm text-[#1b1c1c] truncate max-w-[130px]">
                      {activeModalMatch.team2.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#4b4737] mb-2 font-medium">ทีมเยือน</span>

                  {/* Score Stepper */}
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setScore2(Math.max(0, score2 - 1))}
                      className="w-9 h-9 rounded-full bg-white border border-[#efeded] flex items-center justify-center font-bold text-base text-[#1b1c1c] hover:bg-[#efeded] shadow-xs active:scale-95 transition-all"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={score2}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setScore2(val === '' ? 0 : parseInt(val, 10));
                      }}
                      className="w-14 text-center font-display text-3xl font-black text-[#1b1c1c] bg-white border border-[#efeded] rounded-xl py-1 focus:ring-2 focus:ring-[#ffe680] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setScore2(score2 + 1)}
                      className="w-9 h-9 rounded-full bg-[#ffe680] text-[#786607] flex items-center justify-center font-bold text-base hover:bg-[#fbe27c] shadow-xs active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Penalty Shootout Section */}
            <div className="py-3 px-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-900">ดวลลูกจุดโทษตัดสิน (Penalty Shootout)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasPenalties}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasPenalties(checked);
                      if (checked && penaltyScore1 === 0 && penaltyScore2 === 0) {
                        setPenaltyScore1(0);
                        setPenaltyScore2(0);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  <span className="ml-2 text-xs font-semibold text-gray-700 w-8 inline-block text-center select-none">
                    {hasPenalties ? 'เปิด' : 'ปิด'}
                  </span>
                </label>
              </div>

              {hasPenalties && (
                <div className="pt-3 mt-2 border-t border-amber-200/60 grid grid-cols-11 items-center gap-2">
                  <div className="col-span-5 flex flex-col items-center">
                    <span className="text-[11px] text-amber-900 font-bold mb-1 truncate max-w-full">
                      {activeModalMatch.team1.name}
                    </span>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPenaltyScore1(Math.max(0, penaltyScore1 - 1))}
                        className="w-7 h-7 rounded-full bg-white border border-amber-200 flex items-center justify-center font-bold text-sm text-gray-800 hover:bg-amber-100 shadow-2xs active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={penaltyScore1}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setPenaltyScore1(val === '' ? 0 : parseInt(val, 10));
                        }}
                        className="w-12 text-center font-display text-xl font-black text-amber-900 bg-white border border-amber-300 rounded-lg py-0.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setPenaltyScore1(penaltyScore1 + 1)}
                        className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm hover:bg-amber-600 shadow-2xs active:scale-95 transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="col-span-1 text-center font-bold text-xs text-amber-700">
                    PK
                  </div>

                  <div className="col-span-5 flex flex-col items-center">
                    <span className="text-[11px] text-amber-900 font-bold mb-1 truncate max-w-full">
                      {activeModalMatch.team2.name}
                    </span>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPenaltyScore2(Math.max(0, penaltyScore2 - 1))}
                        className="w-7 h-7 rounded-full bg-white border border-amber-200 flex items-center justify-center font-bold text-sm text-gray-800 hover:bg-amber-100 shadow-2xs active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={penaltyScore2}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setPenaltyScore2(val === '' ? 0 : parseInt(val, 10));
                        }}
                        className="w-12 text-center font-display text-xl font-black text-amber-900 bg-white border border-amber-300 rounded-lg py-0.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setPenaltyScore2(penaltyScore2 + 1)}
                        className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm hover:bg-amber-600 shadow-2xs active:scale-95 transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Discipline & Cards Tracker */}
            <div className="space-y-3 mb-5">
              <span className="text-xs uppercase font-bold text-[#1b1c1c] block">
                เหตุการณ์สำคัญ (ใบเตือน &amp; บัตรโทษ)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Team 1 Discipline & Goal Logger */}
                <div className="p-3.5 bg-[#f5f3f3] rounded-2xl border border-[#efeded] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#efeded] pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamLogo logo={activeModalMatch.team1.logo} name={activeModalMatch.team1.name} className="w-5 h-5" />
                      <span className="text-xs font-bold text-[#1b1c1c] truncate">
                        ฝั่ง {activeModalMatch.team1.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-[#4b4737] flex items-center gap-2">
                      <span className="flex items-center gap-0.5"><SoccerBall className="w-3.5 h-3.5 text-emerald-600" /> {goalDetails1.length}</span>
                      <span>|</span>
                      <span className="flex items-center gap-0.5"><span className="w-2.5 h-3.5 bg-amber-400 rounded-xs inline-block shadow-2xs" /> {cardDetails1.filter((c) => c.type === 'yellow').length}</span>
                      <span>|</span>
                      <span className="flex items-center gap-0.5"><span className="w-2.5 h-3.5 bg-rose-500 rounded-xs inline-block shadow-2xs" /> {cardDetails1.filter((c) => c.type === 'red').length}</span>
                    </span>
                  </div>

                  {/* Add Goal Input Form */}
                  <div className="space-y-1.5 pb-2.5 border-b border-[#efeded]">
                    <label className="text-[11px] font-semibold text-[#1b1c1c] flex items-center gap-1">
                      <SoccerBall className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> บันทึกเบอร์เสื้อผู้ทำประตู :
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={goalInputRef1}
                        type="text"
                        value={tempGoalPlayerNum1}
                        onChange={(e) => setTempGoalPlayerNum1(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddGoal1();
                          }
                        }}
                        placeholder="เบอร์เสื้อผู้ทำประตู เช่น 10"
                        className="flex-1 min-w-0 text-xs px-2.5 py-1.5 rounded-xl border border-[#efeded] bg-white focus:outline-none focus:ring-2 focus:ring-[#ffe680] text-[#1b1c1c]"
                      />
                      <button
                        type="button"
                        onClick={handleAddGoal1}
                        disabled={!tempGoalPlayerNum1.trim()}
                        className="px-3 py-1.5 rounded-xl bg-[#ffe680] text-[#786607] text-xs font-bold hover:bg-[#fbe27c] disabled:opacity-40 transition-all shrink-0 shadow-2xs"
                      >
                        + ประตู
                      </button>
                    </div>
                    {goalDetails1.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {goalDetails1.map((g) => (
                          <span
                            key={g.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-[#ffe680]/60 text-[#786607] border border-[#ffe680]"
                          >
                            <span className="flex items-center gap-1"><SoccerBall className="w-3 h-3 text-emerald-700" /> เบอร์ {g.playerNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveGoal1(g.id)}
                              className="text-[#4b4737] hover:text-red-600 font-bold ml-1 cursor-pointer"
                              title="ลบเบอร์นี้"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Card Input Form */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <label className="text-[11px] font-semibold text-[#4b4737]">
                        บันทึกเบอร์เสื้อผู้ได้รับบัตร :
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setTempCardType1('yellow')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 border shrink-0 ${tempCardType1 === 'yellow'
                            ? 'bg-[#ffe680] text-[#786607] border-[#786607]/30 shadow-2xs'
                            : 'bg-white text-[#4b4737] border-[#efeded] hover:bg-[#faf9f8]'
                            }`}
                          title="ใบเหลือง"
                        >
                          <span className="w-2 h-3 bg-yellow-400 rounded-xs inline-block shadow-2xs" />
                          <span>เหลือง</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTempCardType1('red')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 border shrink-0 ${tempCardType1 === 'red'
                            ? 'bg-red-500 text-white border-red-600 shadow-2xs'
                            : 'bg-white text-[#4b4737] border-[#efeded] hover:bg-[#faf9f8]'
                            }`}
                          title="ใบแดง"
                        >
                          <span className="w-2 h-3 bg-red-500 rounded-xs inline-block shadow-2xs border border-white" />
                          <span>แดง</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={cardInputRef1}
                        type="text"
                        value={tempPlayerNum1}
                        onChange={(e) => setTempPlayerNum1(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCard1();
                          }
                        }}
                        placeholder="พิมพ์เบอร์เสื้อ เช่น 7"
                        className="flex-1 min-w-0 text-xs px-2.5 py-1.5 rounded-xl border border-[#efeded] bg-white focus:outline-none focus:ring-2 focus:ring-[#ffe680] text-[#1b1c1c]"
                      />

                      <button
                        type="button"
                        onClick={handleAddCard1}
                        disabled={!tempPlayerNum1.trim()}
                        className="px-3 py-1.5 rounded-xl bg-[#007746] text-white text-xs font-bold hover:bg-[#006038] disabled:opacity-40 transition-all shrink-0 shadow-2xs"
                      >
                        + บันทึก
                      </button>
                    </div>
                  </div>

                  {/* Registered Cards Badges List */}
                  {cardDetails1.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cardDetails1.map((c) => (
                        <span
                          key={c.id}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border transition-all ${c.type === 'yellow'
                            ? 'bg-[#ffe680]/60 text-[#786607] border-[#ffe680]'
                            : 'bg-red-100 text-red-700 border-red-200'
                            }`}
                        >
                          <span className={`w-2.5 h-3.5 rounded-xs inline-block shadow-2xs shrink-0 ${c.type === 'yellow' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                          <span>เบอร์ {c.playerNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCard1(c.id)}
                            className="text-[#4b4737] hover:text-red-600 font-bold ml-1 cursor-pointer"
                            title="ลบเบอร์นี้"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#888580] italic">ยังไม่มีประวัติใบเตือนในแมตช์นี้</p>
                  )}
                </div>

                {/* Team 2 Discipline & Goal Logger */}
                <div className="p-3.5 bg-[#f5f3f3] rounded-2xl border border-[#efeded] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#efeded] pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamLogo logo={activeModalMatch.team2.logo} name={activeModalMatch.team2.name} className="w-5 h-5" />
                      <span className="text-xs font-bold text-[#1b1c1c] truncate">
                        ฝั่ง {activeModalMatch.team2.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-[#4b4737] flex items-center gap-2">
                      <span className="flex items-center gap-0.5"><SoccerBall className="w-3.5 h-3.5 text-emerald-600" /> {goalDetails2.length}</span>
                      <span>|</span>
                      <span className="flex items-center gap-0.5"><span className="w-2.5 h-3.5 bg-amber-400 rounded-xs inline-block shadow-2xs" /> {cardDetails2.filter((c) => c.type === 'yellow').length}</span>
                      <span>|</span>
                      <span className="flex items-center gap-0.5"><span className="w-2.5 h-3.5 bg-rose-500 rounded-xs inline-block shadow-2xs" /> {cardDetails2.filter((c) => c.type === 'red').length}</span>
                    </span>
                  </div>

                  {/* Add Goal Input Form */}
                  <div className="space-y-1.5 pb-2.5 border-b border-[#efeded]">
                    <label className="text-[11px] font-semibold text-[#1b1c1c] flex items-center gap-1">
                      <SoccerBall className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> บันทึกเบอร์เสื้อผู้ทำประตู :
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={goalInputRef2}
                        type="text"
                        value={tempGoalPlayerNum2}
                        onChange={(e) => setTempGoalPlayerNum2(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddGoal2();
                          }
                        }}
                        placeholder="เบอร์เสื้อผู้ทำประตู เช่น 9"
                        className="flex-1 min-w-0 text-xs px-2.5 py-1.5 rounded-xl border border-[#efeded] bg-white focus:outline-none focus:ring-2 focus:ring-[#ffe680] text-[#1b1c1c]"
                      />
                      <button
                        type="button"
                        onClick={handleAddGoal2}
                        disabled={!tempGoalPlayerNum2.trim()}
                        className="px-3 py-1.5 rounded-xl bg-[#ffe680] text-[#786607] text-xs font-bold hover:bg-[#fbe27c] disabled:opacity-40 transition-all shrink-0 shadow-2xs"
                      >
                        + ประตู
                      </button>
                    </div>
                    {goalDetails2.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {goalDetails2.map((g) => (
                          <span
                            key={g.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-[#ffe680]/60 text-[#786607] border border-[#ffe680]"
                          >
                            <span className="flex items-center gap-1"><SoccerBall className="w-3 h-3 text-emerald-700" /> เบอร์ {g.playerNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveGoal2(g.id)}
                              className="text-[#4b4737] hover:text-red-600 font-bold ml-1 cursor-pointer"
                              title="ลบเบอร์นี้"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Card Input Form */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <label className="text-[11px] font-semibold text-[#4b4737]">
                        บันทึกเบอร์เสื้อผู้ได้รับบัตร :
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setTempCardType2('yellow')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 border shrink-0 ${tempCardType2 === 'yellow'
                            ? 'bg-[#ffe680] text-[#786607] border-[#786607]/30 shadow-2xs'
                            : 'bg-white text-[#4b4737] border-[#efeded] hover:bg-[#faf9f8]'
                            }`}
                          title="ใบเหลือง"
                        >
                          <span className="w-2 h-3 bg-yellow-400 rounded-xs inline-block shadow-2xs" />
                          <span>เหลือง</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTempCardType2('red')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 border shrink-0 ${tempCardType2 === 'red'
                            ? 'bg-red-500 text-white border-red-600 shadow-2xs'
                            : 'bg-white text-[#4b4737] border-[#efeded] hover:bg-[#faf9f8]'
                            }`}
                          title="ใบแดง"
                        >
                          <span className="w-2 h-3 bg-red-500 rounded-xs inline-block shadow-2xs border border-white" />
                          <span>แดง</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={cardInputRef2}
                        type="text"
                        value={tempPlayerNum2}
                        onChange={(e) => setTempPlayerNum2(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCard2();
                          }
                        }}
                        placeholder="พิมพ์เบอร์เสื้อ เช่น 10"
                        className="flex-1 min-w-0 text-xs px-2.5 py-1.5 rounded-xl border border-[#efeded] bg-white focus:outline-none focus:ring-2 focus:ring-[#ffe680] text-[#1b1c1c]"
                      />

                      <button
                        type="button"
                        onClick={handleAddCard2}
                        disabled={!tempPlayerNum2.trim()}
                        className="px-3 py-1.5 rounded-xl bg-[#007746] text-white text-xs font-bold hover:bg-[#006038] disabled:opacity-40 transition-all shrink-0 shadow-2xs"
                      >
                        + บันทึก
                      </button>
                    </div>
                  </div>

                  {/* Registered Cards Badges List */}
                  {cardDetails2.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cardDetails2.map((c) => (
                        <span
                          key={c.id}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border transition-all ${c.type === 'yellow'
                            ? 'bg-[#ffe680]/60 text-[#786607] border-[#ffe680]'
                            : 'bg-red-100 text-red-700 border-red-200'
                            }`}
                        >
                          <span className={`w-2.5 h-3.5 rounded-xs inline-block shadow-2xs shrink-0 ${c.type === 'yellow' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                          <span>เบอร์ {c.playerNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCard2(c.id)}
                            className="text-[#4b4737] hover:text-red-600 font-bold ml-1 cursor-pointer"
                            title="ลบเบอร์นี้"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#888580] italic">ยังไม่มีประวัติใบเตือนในแมตช์นี้</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-[#efeded]">
              <button
                type="button"
                onClick={() => setActiveModalMatch(null)}
                className="px-4 py-2.5 rounded-full text-xs font-bold text-[#4b4737] hover:bg-[#efeded] transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveScoreModal}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#ffe680] text-[#786607] font-display font-bold text-xs hover:bg-[#fbe27c] transition-all shadow-xs"
              >
                <Trophy className="w-4 h-4" />
                <span>บันทึกสกอร์และสถานะ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Report View Modal */}
      {reportModalMatch && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#efeded]">
            <div className="flex items-center justify-between pb-3 border-b border-[#efeded]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#6f5d00]" />
                <h3 className="font-display text-base font-bold text-[#1b1c1c]">
                  รายงานการแข่งขันทางการ (Match Report)
                </h3>
              </div>
              <button
                onClick={() => setReportModalMatch(null)}
                className="p-1 rounded-full hover:bg-[#efeded]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 text-center">
              <div className="text-xs text-[#4b4737]">{reportModalMatch.dateStr}</div>
              <div className="text-xs font-semibold text-[#6f5d00] mt-0.5">
                {reportModalMatch.venue}
              </div>

              <div className="flex items-center justify-center gap-6 my-4">
                <div>
                  <img
                    src={reportModalMatch.team1.logo}
                    alt=""
                    className="w-12 h-12 mx-auto rounded-full ring-1 ring-black/5"
                  />
                  <p className="font-display font-bold text-sm mt-1">
                    {reportModalMatch.team1.name}
                  </p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-[#f5f3f3] border font-display text-2xl font-black">
                  {reportModalMatch.score1}{reportModalMatch.penaltyScore1 !== undefined && reportModalMatch.penaltyScore1 !== null && reportModalMatch.penaltyScore2 !== undefined && reportModalMatch.penaltyScore2 !== null ? `(${reportModalMatch.penaltyScore1})` : ''} - {reportModalMatch.score2}{reportModalMatch.penaltyScore1 !== undefined && reportModalMatch.penaltyScore1 !== null && reportModalMatch.penaltyScore2 !== undefined && reportModalMatch.penaltyScore2 !== null ? `(${reportModalMatch.penaltyScore2})` : ''}
                </div>
                <div>
                  <img
                    src={reportModalMatch.team2.logo}
                    alt=""
                    className="w-12 h-12 mx-auto rounded-full ring-1 ring-black/5"
                  />
                  <p className="font-display font-bold text-sm mt-1">
                    {reportModalMatch.team2.name}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#f5f3f3] rounded-2xl text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#4b4737]">สถานะ:</span>
                  <span className="font-bold text-[#006d40]">สมบูรณ์ (Official Result)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4b4737]">ผู้ตัดสินหลัก:</span>
                  <span className="font-semibold">ศิวกร ภูอุดม (FIFA Elite)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4b4737]">ผู้เข้าชมในสนาม:</span>
                  <span className="font-semibold">2,850 คน</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#efeded] flex justify-end">
              <button
                onClick={() => setReportModalMatch(null)}
                className="px-5 py-2 rounded-full bg-[#f5f3f3] hover:bg-[#efeded] text-xs font-bold"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roster Entry Modal */}
      {rosterModalMatch && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#efeded]">
            <div className="flex items-center justify-between pb-3 border-b border-[#efeded]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#6f5d00]" />
                <h3 className="font-display text-base font-bold text-[#1b1c1c]">
                  ส่งรายชื่อผู้เล่นตัวจริง 11 คน
                </h3>
              </div>
              <button
                onClick={() => setRosterModalMatch(null)}
                className="p-1 rounded-full hover:bg-[#efeded]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-[#4b4737]">
                คู่แข่งขัน: {rosterModalMatch.team1.name} vs {rosterModalMatch.team2.name}
              </p>
              <div className="p-3 bg-[#95fcbc]/30 rounded-2xl text-xs text-[#007746] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>ทั้งสองทีมยืนยันรายชื่อเรียบร้อยแล้ว พร้อมลงทำการแข่งขันตามกำหนดเวลา</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#efeded] flex justify-end">
              <button
                onClick={() => setRosterModalMatch(null)}
                className="px-5 py-2 rounded-full bg-[#ffe680] text-[#786607] text-xs font-bold"
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
