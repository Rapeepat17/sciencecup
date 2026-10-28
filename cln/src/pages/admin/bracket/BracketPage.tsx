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
  const emptyTeam = () => ({
    id: null,
    name: '-',
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
        roundName: 'รอบ 8 ทีมสุดท้าย',
        slotLabel: 'รอบ 8 ทีม (คู่ที่ 1)',
        seed1Label: 'อันดับ 1 กลุ่ม A',
        seed2Label: 'อันดับ 2 กลุ่ม B',
        date: 'TBD',
        time: '16:00',
        venue: 'สนาม 1',
        team1: emptyTeam(),
        team2: emptyTeam(),
        winner: null,
      },
      {
        id: 'qf2',
        matchId: null,
        roundName: 'รอบ 8 ทีมสุดท้าย',
        slotLabel: 'รอบ 8 ทีม (คู่ที่ 2)',
        seed1Label: 'อันดับ 1 กลุ่ม B',
        seed2Label: 'อันดับ 2 กลุ่ม A',
        date: 'TBD',
        time: '17:00',
        venue: 'สนาม 1',
        team1: emptyTeam(),
        team2: emptyTeam(),
        winner: null,
      },
      {
        id: 'qf3',
        matchId: null,
        roundName: 'รอบ 8 ทีมสุดท้าย',
        slotLabel: 'รอบ 8 ทีม (คู่ที่ 3)',
        seed1Label: 'อันดับ 1 กลุ่ม C',
        seed2Label: 'อันดับ 2 กลุ่ม D',
        date: 'TBD',
        time: '18:00',
        venue: 'สนาม 1',
        team1: emptyTeam(),
        team2: emptyTeam(),
        winner: null,
      },
      {
        id: 'qf4',
        matchId: null,
        roundName: 'รอบ 8 ทีมสุดท้าย',
        slotLabel: 'รอบ 8 ทีม (คู่ที่ 4)',
        seed1Label: 'อันดับ 1 กลุ่ม D',
        seed2Label: 'อันดับ 2 กลุ่ม C',
        date: 'TBD',
        time: '19:00',
        venue: 'สนาม 1',
        team1: emptyTeam(),
        team2: emptyTeam(),
        winner: null,
      },
    ],
    sfMatches: [
      {
        id: 'sf1',
        matchId: null,
        roundName: 'รอบรองชนะเลิศ',
        slotLabel: 'รอบรองชนะเลิศ (คู่ที่ 1)',
        seed1Label: 'อันดับ 1 กลุ่ม A',
        seed2Label: 'อันดับ 2 กลุ่ม B',
        date: 'TBD',
        time: '16:00',
        venue: 'สนาม 1',
        team1: emptyTeam(),
        team2: emptyTeam(),
        winner: null,
      },
      {
        id: 'sf2',
        matchId: null,
        roundName: 'รอบรองชนะเลิศ',
        slotLabel: 'รอบรองชนะเลิศ (คู่ที่ 2)',
        seed1Label: 'อันดับ 1 กลุ่ม B',
        seed2Label: 'อันดับ 2 กลุ่ม A',
        date: 'TBD',
        time: '17:00',
        venue: 'สนาม 1',
        team1: emptyTeam(),
        team2: emptyTeam(),
        winner: null,
      },
    ],
    thirdPlaceMatch: {
      id: 'third_place',
      matchId: null,
      roundName: 'นัดชิงอันดับ 3',
      slotLabel: 'นัดชิงอันดับ 3',
      seed1Label: 'ผู้แพ้ รอบรองฯ 1',
      seed2Label: 'ผู้แพ้ รอบรองฯ 2',
      date: 'TBD',
      time: '16:00',
      venue: 'สนาม 1',
      team1: emptyTeam(),
      team2: emptyTeam(),
      winner: null,
    },
    finalMatch: {
      id: 'final',
      matchId: null,
      roundName: 'นัดชิงชนะเลิศ',
      slotLabel: 'นัดชิงชนะเลิศ (Final)',
      seed1Label: 'ผู้ชนะ รอบรองฯ 1',
      seed2Label: 'ผู้ชนะ รอบรองฯ 2',
      date: 'TBD',
      time: '18:00',
      venue: 'สนาม 1',
      team1: emptyTeam(),
      team2: emptyTeam(),
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

    setBracketData({
      qfMatches: def.qfMatches.map((d, i) => ({
        ...d,
        ...(incoming.qfMatches?.[i] || {}),
      })),
      sfMatches: def.sfMatches.map((d, i) => ({
        ...d,
        ...(incoming.sfMatches?.[i] || {}),
      })),
      thirdPlaceMatch: {
        ...def.thirdPlaceMatch,
        ...(incoming.thirdPlaceMatch || {}),
      },
      finalMatch: {
        ...def.finalMatch,
        ...(incoming.finalMatch || {}),
      },
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

    const updateMatchupSlot = (m: BracketSlotMatchup): BracketSlotMatchup => ({
      ...m,
      team1: teamSlot === 1 ? newTeamObj : m.team1,
      team2: teamSlot === 2 ? newTeamObj : m.team2,
      winner: null,
    });

    setBracketData((prev) => {
      if (stage === 'qf') {
        return {
          ...prev,
          qfMatches: prev.qfMatches.map((m, i) =>
            i === matchIndex ? updateMatchupSlot(m) : m
          ),
        };
      }
      if (stage === 'sf') {
        return {
          ...prev,
          sfMatches: prev.sfMatches.map((m, i) =>
            i === matchIndex ? updateMatchupSlot(m) : m
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
    bracketData.qfMatches.forEach(collectFromMatch);
    bracketData.sfMatches.forEach(collectFromMatch);
    collectFromMatch(bracketData.thirdPlaceMatch);
    collectFromMatch(bracketData.finalMatch);
    return used;
  }, [bracketData]);

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
