import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  standingsService,
  GroupStandingItem,
  TournamentStandingsSummary,
} from '../../../services/standingsService';
import {
  StandingsHeader,
  StandingsFilterBar,
  AdminGroupStandingCard,
  StandingsEmptyState,
} from './components';

export interface StandingsPageProps {
  currentTournamentId?: string;
  tournamentName?: string;
}

const DEFAULT_SUMMARY: TournamentStandingsSummary = {
  totalGroups: 0,
  totalTeamsInGroups: 0,
  totalMatches: 0,
  completedMatches: 0,
  liveMatches: 0,
  totalGoals: 0,
};

export const StandingsPage: React.FC<StandingsPageProps> = ({
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

  const [groupsData, setGroupsData] = useState<Record<string, GroupStandingItem[]>>({});
  const [summary, setSummary] = useState<TournamentStandingsSummary>(DEFAULT_SUMMARY);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

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

  const loadStandingsFromBackend = useCallback(
    async (silent = false) => {
      if (!currentTournamentId) {
        setIsLoading(false);
        return;
      }

      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const res = await standingsService.getByTournament(currentTournamentId);
        if (res && typeof res === 'object' && 'groups' in res && 'summary' in res) {
          setGroupsData(res.groups || {});
          setSummary(res.summary || DEFAULT_SUMMARY);
        } else {
          const legacyGroups = (res as unknown as Record<string, GroupStandingItem[]>) || {};
          setGroupsData(legacyGroups);
          setSummary({
            ...DEFAULT_SUMMARY,
            totalGroups: Object.keys(legacyGroups).length,
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch standings from backend:', err);
        showToast('error', 'ไม่สามารถดึงข้อมูลตารางคะแนนจากระบบหลังบ้านได้');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentTournamentId, showToast]
  );

  useEffect(() => {
    loadStandingsFromBackend(false);
  }, [loadStandingsFromBackend]);

  const groupNames = useMemo(() => Object.keys(groupsData), [groupsData]);

  const displayedGroups = useMemo(() => {
    if (selectedGroup === 'all') return groupNames;
    return groupNames.filter((g) => g === selectedGroup);
  }, [groupNames, selectedGroup]);

  const handleExportExcel = () => {
    if (groupNames.length === 0) return;
    try {
      const workbook = XLSX.utils.book_new();

      groupNames.forEach((gName) => {
        const rows = (groupsData[gName] || []).map((row, idx) => ({
          อันดับ: row.rank || idx + 1,
          ทีม: row.teamName,
          แข่ง: row.played,
          ชนะ: row.won,
          เสมอ: row.drawn,
          แพ้: row.lost,
          ได้: row.goalsFor,
          เสีย: row.goalsAgainst,
          ผลต่าง: row.goalDifference,
          คะแนน: row.points,
          ฟอร์ม: (row.form || []).join(' '),
        }));

        const sheetName = gName.slice(0, 31) || 'Group';
        const worksheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      XLSX.writeFile(workbook, `${tournamentName}_Standings.xlsx`);
      showToast('success', 'ส่งออกไฟล์ตารางคะแนน Excel สำเร็จ');
    } catch (err) {
      console.error(err);
      showToast('error', 'ไม่สามารถส่งออกไฟล์ Excel ได้');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[420px] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm font-bold">กำลังดึงข้อมูลตารางคะแนนจากระบบหลังบ้าน...</p>
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

      {/* Header & Summary Stats from Backend */}
      <StandingsHeader
        tournamentName={tournamentName}
        summary={summary}
        isRefreshing={isRefreshing}
        onRefresh={() => loadStandingsFromBackend(true)}
        onExportExcel={handleExportExcel}
      />

      {/* Group Filter Bar */}
      <StandingsFilterBar
        groupOptions={groupNames}
        selectedGroup={selectedGroup}
        onSelectGroup={setSelectedGroup}
      />

      {/* Group Standings Tables */}
      {groupNames.length === 0 ? (
        <StandingsEmptyState />
      ) : (
        <div
          className={`grid grid-cols-1 ${
            displayedGroups.length > 1 ? 'xl:grid-cols-2' : ''
          } gap-5`}
        >
          {displayedGroups.map((gName) => (
            <AdminGroupStandingCard
              key={gName}
              groupName={gName}
              standings={groupsData[gName] || []}
            />
          ))}
        </div>
      )}
    </div>
  );
};
