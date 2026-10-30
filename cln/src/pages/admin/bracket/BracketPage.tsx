import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { tournamentService } from '../../../services/tournamentService';
import {
  BracketHeader,
  BracketRoundTabs,
  BracketTabRound,
  AdminBracketTree,
  BracketDataShape,
  BracketSlotMatchup,
  AssignBracketSlotModal,
  GroupSeedOption,
} from './components';

export interface BracketPageProps {
  currentTournamentId?: string;
  tournamentName?: string;
}

const createEmptyBracketData = (): BracketDataShape => {
  const seedTeam = (seedCode: string) => ({
    id: null,
    name: seedCode,
    seedCode,
    shortName: seedCode,
    logo: '',
    score: null,
    penaltyScore: null,
  });

  const placeholderTeam = (label: string) => ({
    id: null,
    name: label,
    shortName: '',
    logo: '',
    score: null,
    penaltyScore: null,
  });

  return {
    qfMatches: [
      {
        id: 'qf1',
        matchId: null,
        matchNumber: 16,
        roundName: 'รอบ 8 ทีมสุดท้าย',
        slotLabel: 'รอบ 8 ทีม (คู่ที่ 1)',
        seed1Label: 'A1',
        seed2Label: 'B2',
        date: 'TBD',
        time: '16:00',
        venue: 'สนาม 1',
        team1: seedTeam('A1'),
        team2: seedTeam('B2'),
        winner: null,
      },
      {
        id: 'qf2',
        matchId: null,
        matchNumber: 17,
        roundName: 'รอบ 8 ทีมสุดท้าย',
        slotLabel: 'รอบ 8 ทีม (คู่ที่ 2)',
        seed1Label: 'B1',
        seed2Label: 'A2',
        date: 'TBD',
        time: '17:00',
        venue: 'สนาม 1',
        team1: seedTeam('B1'),
        team2: seedTeam('A2'),
        winner: null,
      },
      {
        id: 'qf3',
        matchId: null,
        matchNumber: 18,
        roundName: 'รอบ 8 ทีมสุดท้าย',
        slotLabel: 'รอบ 8 ทีม (คู่ที่ 3)',
        seed1Label: 'C1',
        seed2Label: 'D2',
        date: 'TBD',
        time: '18:00',
        venue: 'สนาม 1',
        team1: seedTeam('C1'),
        team2: seedTeam('D2'),
        winner: null,
      },
      {
        id: 'qf4',
        matchId: null,
        matchNumber: 19,
        roundName: 'รอบ 8 ทีมสุดท้าย',
        slotLabel: 'รอบ 8 ทีม (คู่ที่ 4)',
        seed1Label: 'D1',
        seed2Label: 'C2',
        date: 'TBD',
        time: '19:00',
        venue: 'สนาม 1',
        team1: seedTeam('D1'),
        team2: seedTeam('C2'),
        winner: null,
      },
    ],
    sfMatches: [
      {
        id: 'sf1',
        matchId: null,
        matchNumber: 20,
        roundName: 'รอบรองชนะเลิศ',
        slotLabel: 'รอบรองชนะเลิศ (คู่ที่ 1)',
        seed1Label: 'ทีมชนะคู่ 16',
        seed2Label: 'ทีมชนะคู่ 17',
        date: 'TBD',
        time: '16:00',
        venue: 'สนาม 1',
        team1: placeholderTeam('ทีมชนะคู่ 16'),
        team2: placeholderTeam('ทีมชนะคู่ 17'),
        winner: null,
      },
      {
        id: 'sf2',
        matchId: null,
        matchNumber: 21,
        roundName: 'รอบรองชนะเลิศ',
        slotLabel: 'รอบรองชนะเลิศ (คู่ที่ 2)',
        seed1Label: 'ทีมชนะคู่ 18',
        seed2Label: 'ทีมชนะคู่ 19',
        date: 'TBD',
        time: '17:00',
        venue: 'สนาม 1',
        team1: placeholderTeam('ทีมชนะคู่ 18'),
        team2: placeholderTeam('ทีมชนะคู่ 19'),
        winner: null,
      },
    ],
    thirdPlaceMatch: {
      id: 'third_place',
      matchId: null,
      matchNumber: 22,
      roundName: 'นัดชิงอันดับ 3',
      slotLabel: 'นัดชิงอันดับ 3',
      seed1Label: 'ทีมแพ้คู่ 20',
      seed2Label: 'ทีมแพ้คู่ 21',
      date: 'TBD',
      time: '16:00',
      venue: 'สนาม 1',
      team1: placeholderTeam('ทีมแพ้คู่ 20'),
      team2: placeholderTeam('ทีมแพ้คู่ 21'),
      winner: null,
    },
    finalMatch: {
      id: 'final',
      matchId: null,
      matchNumber: 23,
      roundName: 'นัดชิงชนะเลิศ',
      slotLabel: 'นัดชิงชนะเลิศ (Final)',
      seed1Label: 'ทีมชนะคู่ 20',
      seed2Label: 'ทีมชนะคู่ 21',
      date: 'TBD',
      time: '18:00',
      venue: 'สนาม 1',
      team1: placeholderTeam('ทีมชนะคู่ 20'),
      team2: placeholderTeam('ทีมชนะคู่ 21'),
      winner: null,
    },
  };
};

export const BracketPage: React.FC<BracketPageProps> = ({
  currentTournamentId: propTournamentId,
  tournamentName = 'SCI CUP',
}) => {
  const currentTournamentId = useMemo(() => {
    if (propTournamentId) return propTournamentId;
    try {
      return localStorage.getItem('scicup_current_tournament_id') || '1000';
    } catch {
      return '1000';
    }
  }, [propTournamentId]);

  const [startingRound, setStartingRound] = useState<'qf' | 'sf' | 'final'>('sf');
  const [isKnockoutCreated, setIsKnockoutCreated] = useState<boolean>(false);
  const [knockoutMatchesCount, setKnockoutMatchesCount] = useState<number>(0);
  const [bracketData, setBracketData] = useState<BracketDataShape>(createEmptyBracketData);
  const [groupSeeds, setGroupSeeds] = useState<GroupSeedOption[]>([]);

  const [selectedTab, setSelectedTab] = useState<BracketTabRound>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Modal state for assigning a seed to a slot
  const [editingSlot, setEditingSlot] = useState<{
    stage: 'qf' | 'sf' | 'third_place' | 'final';
    matchIndex: number;
    teamSlot: 1 | 2;
  } | null>(null);

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  const applyBracketResponse = useCallback((res: any) => {
    const rawRound = res?.knockout_starting_round;
    if (rawRound === 'qf' || rawRound === 'sf' || rawRound === 'final') {
      setStartingRound(rawRound);
    } else {
      setStartingRound('sf');
    }

    setIsKnockoutCreated(Boolean(res?.is_knockout_created));
    setKnockoutMatchesCount(Number(res?.knockout_matches_count) || 0);

    if (Array.isArray(res?.group_seeds)) {
      setGroupSeeds(res.group_seeds);
    }

    const def = createEmptyBracketData();
    const incoming = res?.bracket_data || {};

    const mergeClientTeam = (defTeam: any, incTeam?: any) => {
      if (!incTeam || typeof incTeam !== 'object') return defTeam;
      const incName =
        incTeam.name !== undefined && incTeam.name !== null
          ? String(incTeam.name).trim()
          : '';
      const isCleared =
        incName === '-' ||
        (incTeam.seedCode === null && !incTeam.id && (!incName || incName === '-'));
      if (isCleared) {
        return {
          id: null,
          name: '-',
          seedCode: null,
          shortName: '',
          logo: '',
          score: null,
          penaltyScore: null,
        };
      }
      const hasReal = incTeam.id || (incName && incName !== '-' && incName !== 'TBD');
      if (hasReal || incTeam.seedCode) {
        return {
          ...defTeam,
          ...incTeam,
          name: incName || incTeam.seedCode || defTeam.name,
          seedCode:
            incTeam.seedCode ||
            (hasReal && /^([A-Z])(\d+)$/i.test(incName)
              ? incName.toUpperCase()
              : defTeam.seedCode),
        };
      }
      return defTeam;
    };

    const mergeClientSlot = (defSlot: any, incSlot?: any) => {
      if (!incSlot || typeof incSlot !== 'object') return defSlot;
      const t1 = mergeClientTeam(defSlot.team1, incSlot.team1);
      const t2 = mergeClientTeam(defSlot.team2, incSlot.team2);
      return {
        ...defSlot,
        ...incSlot,
        roundName: defSlot.roundName,
        slotLabel: incSlot.slotLabel || defSlot.slotLabel,
        seed1Label:
          t1?.seedCode ||
          (t1?.name && t1.name !== '-' ? t1.name : null) ||
          incSlot.seed1Label ||
          defSlot.seed1Label,
        seed2Label:
          t2?.seedCode ||
          (t2?.name && t2.name !== '-' ? t2.name : null) ||
          incSlot.seed2Label ||
          defSlot.seed2Label,
        team1: t1,
        team2: t2,
      };
    };

    setBracketData({
      qfMatches: def.qfMatches.map((d, i) => mergeClientSlot(d, incoming.qfMatches?.[i])),
      sfMatches: def.sfMatches.map((d, i) => mergeClientSlot(d, incoming.sfMatches?.[i])),
      thirdPlaceMatch: mergeClientSlot(def.thirdPlaceMatch, incoming.thirdPlaceMatch),
      finalMatch: mergeClientSlot(def.finalMatch, incoming.finalMatch),
    });
  }, []);

  const loadBracketData = useCallback(async () => {
    if (!currentTournamentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await tournamentService.getBracket(currentTournamentId);
      applyBracketResponse(res);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('Failed to load bracket:', err);
      showToast('error', 'ไม่สามารถโหลดข้อมูลสายแข่งน็อคเอาท์ได้');
    } finally {
      setIsLoading(false);
    }
  }, [currentTournamentId, applyBracketResponse, showToast]);

  useEffect(() => {
    loadBracketData();
  }, [loadBracketData]);

  // 1. Auto-seed from Backend Standings
  const handleAutoSeed = async () => {
    if (!currentTournamentId) return;
    setIsSeeding(true);
    try {
      const seededRes = await tournamentService.autoSeedBracket(currentTournamentId);
      applyBracketResponse(seededRes);
      setIsKnockoutCreated(true);
      setHasUnsavedChanges(true);
      showToast(
        'success',
        'ดึงทีมจากตารางคะแนนมาจัดสายเรียบร้อย (กด "บันทึกสายการแข่งขัน" เพื่อสร้างแมตช์ลงตารางแข่ง)'
      );
    } catch (err: any) {
      console.error('Auto-seed failed:', err);
      showToast(
        'error',
        err?.response?.data?.message || 'ไม่สามารถดึงทีมจากตารางคะแนนได้'
      );
    } finally {
      setIsSeeding(false);
    }
  };

  // 3. Assign or clear a Group Seed (e.g. A1, B2) in a bracket slot
  const handleSelectSeedForSlot = (seedCode: string | null) => {
    if (!editingSlot) return;
    const { stage, matchIndex, teamSlot } = editingSlot;

    const newTeamObj = seedCode
      ? {
          id: null,
          name: seedCode,
          seedCode,
          shortName: seedCode,
          logo: '',
          score: null,
          penaltyScore: null,
        }
      : {
          id: null,
          name: '-',
          seedCode: null,
          shortName: '',
          logo: '',
          score: null,
          penaltyScore: null,
        };

    const clearDuplicateSeed = (
      m: BracketSlotMatchup,
      idx: number,
      stg: string
    ): BracketSlotMatchup => {
      let t1 = m.team1;
      let t2 = m.team2;
      let s1Label = m.seed1Label;
      let s2Label = m.seed2Label;

      if (seedCode) {
        const isTarget = stg === stage && idx === matchIndex;
        if (!isTarget || teamSlot !== 1) {
          const c1 =
            t1?.seedCode ||
            (/^[A-Z]\d+$/i.test(t1?.name || '') ? t1.name.toUpperCase() : null);
          if (c1 === seedCode.toUpperCase()) {
            t1 = {
              id: null,
              name: '-',
              seedCode: null,
              shortName: '',
              logo: '',
              score: null,
              penaltyScore: null,
            };
            s1Label = '-';
          }
        }
        if (!isTarget || teamSlot !== 2) {
          const c2 =
            t2?.seedCode ||
            (/^[A-Z]\d+$/i.test(t2?.name || '') ? t2.name.toUpperCase() : null);
          if (c2 === seedCode.toUpperCase()) {
            t2 = {
              id: null,
              name: '-',
              seedCode: null,
              shortName: '',
              logo: '',
              score: null,
              penaltyScore: null,
            };
            s2Label = '-';
          }
        }
      }
      return { ...m, team1: t1, team2: t2, seed1Label: s1Label, seed2Label: s2Label };
    };

    const updateMatchupSlot = (m: BracketSlotMatchup): BracketSlotMatchup => ({
      ...m,
      seed1Label: teamSlot === 1 ? seedCode || '-' : m.seed1Label,
      seed2Label: teamSlot === 2 ? seedCode || '-' : m.seed2Label,
      team1: teamSlot === 1 ? newTeamObj : m.team1,
      team2: teamSlot === 2 ? newTeamObj : m.team2,
      winner: null,
    });

    setBracketData((prev) => {
      if (stage === 'qf') {
        return {
          ...prev,
          qfMatches: prev.qfMatches.map((m, i) =>
            i === matchIndex
              ? updateMatchupSlot(m)
              : clearDuplicateSeed(m, i, 'qf')
          ),
        };
      }
      if (stage === 'sf') {
        return {
          ...prev,
          sfMatches: prev.sfMatches.map((m, i) =>
            i === matchIndex
              ? updateMatchupSlot(m)
              : clearDuplicateSeed(m, i, 'sf')
          ),
        };
      }
      if (stage === 'third_place') {
        return {
          ...prev,
          thirdPlaceMatch: updateMatchupSlot(prev.thirdPlaceMatch),
        };
      }
      return {
        ...prev,
        finalMatch: updateMatchupSlot(prev.finalMatch),
      };
    });

    setIsKnockoutCreated(true);
    setHasUnsavedChanges(true);
  };

  // Save Bracket & Sync Knockout Matches to public.matches on Backend
  const handleSaveBracket = async () => {
    if (!currentTournamentId) return;
    setIsSaving(true);
    try {
      const updatedRes = await tournamentService.updateBracket(currentTournamentId, {
        bracket_data: bracketData,
        is_knockout_created: isKnockoutCreated,
        knockout_starting_round: startingRound,
      });
      applyBracketResponse(updatedRes);
      setHasUnsavedChanges(false);
      showToast(
        'success',
        `บันทึกสายการแข่งขันและซิงค์แมตช์รอบน็อคเอาท์ (${updatedRes?.knockout_matches_count || 0} คู่) ลงตารางการแข่งขันเรียบร้อยแล้ว`
      );
    } catch (err: any) {
      console.error('Failed to save bracket:', err);
      showToast(
        'error',
        err?.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกสายการแข่งขัน'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const usedSeedCodes = useMemo(() => {
    const used = new Set<string>();
    const collectFromMatch = (m: BracketSlotMatchup) => {
      for (const t of [m.team1, m.team2]) {
        const code =
          t?.seedCode ||
          (t?.name && /^([A-Z])(\d+)$/i.test(t.name.trim()) ? t.name.trim() : null);
        if (code) used.add(code.toUpperCase());
      }
    };
    const activeMatches =
      startingRound === 'qf'
        ? bracketData.qfMatches
        : startingRound === 'sf'
        ? bracketData.sfMatches
        : [bracketData.finalMatch];
    activeMatches.forEach(collectFromMatch);
    return used;
  }, [bracketData, startingRound]);

  const activeModalInfo = useMemo(() => {
    if (!editingSlot) return { title: '', currentSeedCode: null };
    const { stage, matchIndex, teamSlot } = editingSlot;
    const matchup =
      stage === 'qf'
        ? bracketData.qfMatches[matchIndex]
        : stage === 'sf'
        ? bracketData.sfMatches[matchIndex]
        : stage === 'third_place'
        ? bracketData.thirdPlaceMatch
        : bracketData.finalMatch;

    const currentTeam = teamSlot === 1 ? matchup?.team1 : matchup?.team2;
    const currentSeedCode =
      currentTeam?.seedCode ||
      (currentTeam?.name && /^([A-Z])(\d+)$/i.test(currentTeam.name.trim())
        ? currentTeam.name.trim().toUpperCase()
        : null);
    const matchNoText =
      matchup?.matchNumber !== undefined ? `คู่ ${matchup.matchNumber}` : '';
    const roundTitle = matchup?.roundName || '';
    return {
      title: `${roundTitle} ${matchNoText} • ช่องที่ ${teamSlot}`.trim(),
      currentSeedCode,
    };
  }, [editingSlot, bracketData]);

  if (isLoading) {
    return (
      <div className="min-h-[420px] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm font-bold">กำลังโหลดข้อมูลผังสายการแข่งขัน...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-bold transition-all ${
            toast.type === 'success'
              ? 'bg-[#1b1c1c] text-[#ffe680] border-slate-800'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <BracketHeader
        tournamentName={tournamentName}
        startingRound={startingRound}
        knockoutMatchesCount={knockoutMatchesCount}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        isSeeding={isSeeding}
        onAutoSeed={handleAutoSeed}
        onSave={handleSaveBracket}
      />

      {/* Round Filter Tabs */}
      <BracketRoundTabs
        startingRound={startingRound}
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
      />

      {/* Bracket Content */}
      <AdminBracketTree
        tournamentName={tournamentName}
        startingRound={startingRound}
        selectedTab={selectedTab}
        bracketData={bracketData}
        onOpenAssignModal={(stage, matchIndex, teamSlot) =>
          setEditingSlot({ stage, matchIndex, teamSlot })
        }
      />

      {/* Assign Slot Modal */}
      <AssignBracketSlotModal
        isOpen={Boolean(editingSlot)}
        slotTitle={activeModalInfo.title}
        currentSeedCode={activeModalInfo.currentSeedCode}
        usedSeedCodes={usedSeedCodes}
        groupSeeds={groupSeeds}
        onClose={() => setEditingSlot(null)}
        onSelectSeed={handleSelectSeedForSlot}
      />
    </div>
  );
};
