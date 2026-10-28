import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Match, Team, GroupMap, MatchStatus } from '../../../types';
import { matchService, SyncMatchItemPayload } from '../../../services/matchService';
import { groupService } from '../../../services/groupService';
import { teamService } from '../../../services/teamService';
import { tournamentService } from '../../../services/tournamentService';
import {
  generateInterleavedRoundRobinMatches,
  realignMatchTimesAndNumbers,
} from '../../../utils/fixtureGenerator';
import {
  MatchHeader,
  MatchFilterBar,
  KnockoutStartingRound,
  MatchCard,
  MatchTimeVenueModal,
  AutoScheduleModal,
  AutoScheduleConfig,
  CreateMatchModal,
  CreateMatchDraftInput,
  ClearMatchesDialog,
  MatchEmptyState,
} from './components';

interface MatchesPageProps {
  currentTournamentId?: string;
  tournamentName?: string;
}

const mapBackendStatusToFrontend = (status?: string): MatchStatus => {
  const s = (status || '').toUpperCase();
  if (s === 'LIVE') return 'LIVE';
  if (s === 'FINISHED' || s === 'COMPLETED' || s === 'FT') return 'FT';
  if (s === 'POSTPONED') return 'POSTPONED';
  return 'UPCOMING';
};

const mapFrontendStatusToBackend = (
  status?: string
): 'SCHEDULED' | 'LIVE' | 'FINISHED' => {
  const s = (status || '').toUpperCase();
  if (s === 'LIVE') return 'LIVE';
  if (s === 'FINISHED' || s === 'COMPLETED' || s === 'FT') return 'FINISHED';
  return 'SCHEDULED';
};

export const MatchesPage: React.FC<MatchesPageProps> = ({
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

  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<GroupMap>({});
  const [knockoutStartingRound, setKnockoutStartingRound] =
    useState<KnockoutStartingRound>('sf');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Filters & View Mode
  const [selectedRound, setSelectedRound] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'sequence' | 'byDate'>('sequence');

  // Drag & Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Modals State
  const [editingTimeVenueMatch, setEditingTimeVenueMatch] = useState<Match | null>(null);
  const [isAutoScheduleOpen, setIsAutoScheduleOpen] = useState(false);
  const [isCreateMatchOpen, setIsCreateMatchOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  // Toast Notification
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

  const transformBackendMatches = useCallback(
    (rawMatches: any[], allTeams: Team[]): Match[] => {
      const teamMap = new Map<string, Team>();
      allTeams.forEach((t) => teamMap.set(String(t.id), t));

      return rawMatches.map((m, idx) => {
        const homeTeam = m.home_team_id ? teamMap.get(String(m.home_team_id)) : undefined;
        const awayTeam = m.away_team_id ? teamMap.get(String(m.away_team_id)) : undefined;

        const normalizedGroup = m.group_name
          ? String(m.group_name).replace('Group ', '').trim()
          : m.stage === 'knockout'
          ? 'Knockout'
          : 'A';

        return {
          id: String(m.id),
          tournamentId: String(m.tournament_id || currentTournamentId || ''),
          matchNumber: m.match_number || idx + 1,
          matchday: m.matchday || 1,
          round:
            m.round_name ||
            m.round ||
            (m.stage === 'knockout' ? 'รอบน็อคเอาท์' : 'รอบแบ่งกลุ่ม (Group Stage)'),
          group: normalizedGroup,
          dateStr: m.match_date || 'TBD',
          timeStr: m.match_time || 'TBD',
          venue: m.venue || m.pitch || 'สนาม 1',
          team1: homeTeam || {
            id: String(m.home_team_id || ''),
            name:
              m.home_team_name ||
              (m.home_team_id ? String(m.home_team_id) : 'รอระบุทีมเหย้า'),
            shortName: (
              m.home_team_name || String(m.home_team_id || 'HOM')
            )
              .slice(0, 3)
              .toUpperCase(),
            logo: m.home_team_logo || '',
          },
          team2: awayTeam || {
            id: String(m.away_team_id || ''),
            name:
              m.away_team_name ||
              (m.away_team_id ? String(m.away_team_id) : 'รอระบุทีมเยือน'),
            shortName: (
              m.away_team_name || String(m.away_team_id || 'AWY')
            )
              .slice(0, 3)
              .toUpperCase(),
            logo: m.away_team_logo || '',
          },
          score1: m.home_score !== null && m.home_score !== undefined ? Number(m.home_score) : 0,
          score2: m.away_score !== null && m.away_score !== undefined ? Number(m.away_score) : 0,
          penaltyScore1: m.home_penalty_score ?? null,
          penaltyScore2: m.away_penalty_score ?? null,
          status: mapBackendStatusToFrontend(m.status),
        };
      });
    },
    [currentTournamentId]
  );

  const fetchScheduleData = useCallback(async () => {
    if (!currentTournamentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [tourneyRes, rawTeams, rawGroups, rawMatches] = await Promise.all([
        tournamentService.getById(currentTournamentId).catch(() => null),
        teamService.getByTournament(currentTournamentId),
        groupService.getByTournament(currentTournamentId),
        matchService.getByTournament(currentTournamentId),
      ]);

      const rawStartRound =
        tourneyRes?.knockout_starting_round ||
        tourneyRes?.knockoutStartingRound ||
        tourneyRes?.data?.knockout_starting_round;
      if (
        rawStartRound === 'r16' ||
        rawStartRound === 'qf' ||
        rawStartRound === 'sf' ||
        rawStartRound === 'final'
      ) {
        setKnockoutStartingRound(rawStartRound);
      } else {
        setKnockoutStartingRound('sf');
      }

      const mappedTeams: Team[] = (rawTeams || []).map((t: any) => {
        const rawGroupName = t.group_name || t.group;
        const cleanGroupName = rawGroupName ? String(rawGroupName).trim() : undefined;
        return {
          id: String(t.id),
          name: t.name,
          shortName: t.short_name || t.shortName || t.name?.slice(0, 3)?.toUpperCase() || 'TM',
          logo: t.logo_url || t.logo || '',
          group: cleanGroupName,
          group_name: cleanGroupName,
        };
      });

      // Build GroupMap Record<string, Team[]> matching GroupsPage structure
      const mappedGroupMap: GroupMap = {};
      const groupRecords: any[] = Array.isArray((rawGroups as any)?.groups)
        ? (rawGroups as any).groups
        : Array.isArray(rawGroups)
        ? rawGroups
        : [];

      groupRecords.forEach((g: any) => {
        const gName = String(g?.name || g?.group_name || '').trim();
        if (gName) {
          mappedGroupMap[gName] = [];
        }
      });

      // Assign teams to their respective groups by group_name
      mappedTeams.forEach((t) => {
        if (t.group) {
          if (!mappedGroupMap[t.group]) {
            mappedGroupMap[t.group] = [];
          }
          mappedGroupMap[t.group].push(t);
        }
      });

      const formattedMatches = transformBackendMatches(rawMatches || [], mappedTeams);

      setTeams(mappedTeams);
      setGroups(mappedGroupMap);
      setMatches(formattedMatches);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('Failed to load schedule data:', err);
      showToast('error', 'ไม่สามารถโหลดข้อมูลตารางการแข่งขันได้');
    } finally {
      setIsLoading(false);
    }
  }, [currentTournamentId, transformBackendMatches, showToast]);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  const groupNames = useMemo(() => Object.keys(groups).sort(), [groups]);

  const canAutoGenerate = useMemo(
    () => groupNames.some((gKey) => (groups[gKey] || []).length >= 2),
    [groupNames, groups]
  );

  // Summary Stats for MatchHeader
  const totalDays = useMemo(() => {
    const validDates = new Set(
      matches
        .map((m) => m.dateStr)
        .filter((d) => d && d !== 'TBD' && d !== 'ยังไม่ระบุวันที่แข่งขัน')
    );
    return validDates.size;
  }, [matches]);

  const totalVenues = useMemo(() => {
    const validVenues = new Set(
      matches.map((m) => m.venue).filter((v) => v && v !== 'TBD')
    );
    return validVenues.size;
  }, [matches]);

  // 1. Auto-Generate Round-Robin Fixtures from Groups (Draft state)
  const handleAutoGenerate = () => {
    if (!canAutoGenerate) {
      showToast(
        'error',
        'กรุณาจัดทีมเข้ากลุ่มอย่างน้อย 2 ทีมในหน้า "จัดกลุ่มการแข่งขัน" ก่อนสร้างตารางอัตโนมัติ'
      );
      return;
    }

    try {
      const todayIso = new Date().toISOString().split('T')[0];
      const generated = generateInterleavedRoundRobinMatches(groups, {
        startDate: todayIso,
        startHour: 16,
        startMinute: 0,
        matchIntervalMinutes: 60,
        matchesPerDay: 4,
        venues: ['สนาม 1'],
      });

      const formattedGenerated: Match[] = generated.map((m, index) => ({
        ...m,
        id: `temp_gen_${Date.now()}_${index}`,
        tournamentId: currentTournamentId,
        matchNumber: index + 1,
        matchday: m.matchday || 1,
        round: m.round || 'รอบแบ่งกลุ่ม (Group Stage)',
        venue: m.venue || 'สนาม 1',
        status: 'UPCOMING',
      }));

      setMatches(formattedGenerated);
      setHasUnsavedChanges(true);
      showToast(
        'success',
        `จัดคู่แข่งขันอัตโนมัติสำเร็จ ${formattedGenerated.length} คู่ (กด "บันทึกตารางการแข่งขัน" เพื่อยืนยันลงระบบ)`
      );
    } catch (err) {
      console.error(err);
      showToast('error', 'เกิดข้อผิดพลาดในการสร้างตารางอัตโนมัติ');
    }
  };

  // 2. Add Custom Match (Draft state)
  const handleAddMatch = (input: CreateMatchDraftInput) => {
    const homeTeam = teams.find((t) => String(t.id) === String(input.homeTeamId));
    const awayTeam = teams.find((t) => String(t.id) === String(input.awayTeamId));
    if (!homeTeam || !awayTeam) return;

    const nextMatchNumber = matches.length + 1;
    const newMatch: Match = {
      id: `temp_${Date.now()}_${nextMatchNumber}`,
      tournamentId: currentTournamentId,
      matchNumber: nextMatchNumber,
      matchday: 1,
      round: input.roundName,
      group: input.stage === 'knockout' ? 'Knockout' : input.groupName || 'A',
      dateStr: input.dateStr,
      timeStr: input.timeStr,
      venue: input.venue,
      team1: homeTeam,
      team2: awayTeam,
      score1: 0,
      score2: 0,
      status: 'UPCOMING',
    };

    setMatches((prev) => [...prev, newMatch]);
    setHasUnsavedChanges(true);
    showToast('success', 'เพิ่มคู่แข่งขันเข้าตารางแล้ว (อย่าลืมกดบันทึกตารางการแข่งขัน)');
  };

  // 3. Reorder Matches (Up/Down or Drag & Drop)
  const reorderMatchList = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || toIndex >= matches.length) {
      return;
    }

    setMatches((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated.map((m, idx) => ({
        ...m,
        matchNumber: idx + 1,
      }));
    });
    setHasUnsavedChanges(true);
  };

  // 4. Update Single Match Date, Time & Venue
  const handleApplyTimeVenue = (
    matchId: string,
    payload: { timeStr: string; dateStr: string; venue: string }
  ) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              dateStr: payload.dateStr,
              timeStr: payload.timeStr,
              venue: payload.venue,
            }
          : m
      )
    );
    setHasUnsavedChanges(true);
    showToast('success', 'อัปเดตวัน เวลา และสนามในตารางแล้ว (รอกดบันทึกตาราง)');
  };

  // 5. Auto-Schedule All Matches Date, Time & Venues
  const handleApplyAutoSchedule = (config: AutoScheduleConfig) => {
    const [hourStr, minStr] = (config.startTime || '16:00').split(':');
    const startHour = Number(hourStr) || 16;
    const startMinute = Number(minStr) || 0;

    const realigned = realignMatchTimesAndNumbers(matches, {
      startDate: config.startDate,
      startHour,
      startMinute,
      matchIntervalMinutes: config.matchIntervalMinutes,
      matchesPerDay: config.matchesPerDay,
      venues: config.venues,
    }).map((m, index) => ({
      ...m,
      matchNumber: index + 1,
      venue: config.venues[index % config.venues.length] || m.venue || 'สนาม 1',
    }));

    setMatches(realigned);
    setHasUnsavedChanges(true);
    showToast(
      'success',
      `จัดสรรวัน เวลา และสนามให้ทั้ง ${realigned.length} คู่เรียบร้อย (รอกดบันทึกตาราง)`
    );
  };

  // 6. Delete Single Match
  const handleDeleteMatch = (matchId: string) => {
    setMatches((prev) =>
      prev
        .filter((m) => m.id !== matchId)
        .map((m, idx) => ({
          ...m,
          matchNumber: idx + 1,
        }))
    );
    setHasUnsavedChanges(true);
    showToast('success', 'นำคู่แข่งขันออกจากตารางแล้ว (รอกดบันทึกตาราง)');
  };

  // 7. Clear All Matches
  const handleConfirmClearAll = () => {
    setMatches([]);
    setHasUnsavedChanges(true);
    showToast('success', 'ล้างตารางการแข่งขันแล้ว กด "บันทึกตารางการแข่งขัน" เพื่อยืนยัน');
  };

  // 8. Save Entire Schedule to Backend & Supabase
  const handleSaveSchedule = async () => {
    if (!currentTournamentId) {
      showToast('error', 'ไม่พบรหัสทัวร์นาเมนต์ กรุณาเลือกทัวร์นาเมนต์ก่อน');
      return;
    }

    setIsSaving(true);
    try {
      const payload: SyncMatchItemPayload[] = matches.map((m, index) => {
        const isTempId =
          String(m.id).startsWith('temp_') || String(m.id).startsWith('match-gen-');
        const isKnockout =
          m.group === 'Knockout' ||
          (m.round && !m.round.includes('รอบแบ่งกลุ่ม'));

        return {
          ...(isTempId ? {} : { id: String(m.id) }),
          match_number: index + 1,
          matchday: m.matchday || 1,
          stage: isKnockout ? 'knockout' : 'group',
          round_name: m.round || 'รอบแบ่งกลุ่ม (Group Stage)',
          group_name: isKnockout
            ? null
            : m.group
            ? m.group.trim()
            : null,
          home_team_id: String(m.team1?.id || m.team1?.name || ''),
          away_team_id: String(m.team2?.id || m.team2?.name || ''),
          match_date: m.dateStr || 'TBD',
          match_time: m.timeStr || 'TBD',
          venue: m.venue || 'สนาม 1',
          status: mapFrontendStatusToBackend(m.status),
          home_score: m.score1 ?? 0,
          away_score: m.score2 ?? 0,
          home_penalty_score: m.penaltyScore1 ?? null,
          away_penalty_score: m.penaltyScore2 ?? null,
        };
      });

      const savedRawMatches = await matchService.syncMatches(currentTournamentId, payload);
      const refreshedMatches = transformBackendMatches(savedRawMatches || [], teams);
      setMatches(refreshedMatches);
      setHasUnsavedChanges(false);
      showToast('success', 'บันทึกตารางการแข่งขันลงฐานข้อมูลเรียบร้อยแล้ว');
    } catch (err: any) {
      console.error('Failed to save schedule:', err);
      showToast(
        'error',
        err?.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกตารางการแข่งขัน'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 9. Export Excel
  const handleExportExcel = () => {
    if (matches.length === 0) return;
    try {
      const rows = matches.map((m, idx) => ({
        คู่ที่: m.matchNumber || idx + 1,
        รอบการแข่งขัน: m.round || 'รอบแบ่งกลุ่ม',
        กลุ่ม: m.group && m.group !== 'Knockout' ? `กลุ่ม ${m.group}` : '-',
        วันที่แข่งขัน: m.dateStr || 'TBD',
        เวลา: m.timeStr || 'TBD',
        สนาม: m.venue || '-',
        ทีมเหย้า: m.team1?.name || '-',
        ทีมเยือน: m.team2?.name || '-',
      }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Match Schedule');
      XLSX.writeFile(workbook, `${tournamentName}_Schedule.xlsx`);
      showToast('success', 'ส่งออกไฟล์ตารางการแข่งขัน Excel สำเร็จ');
    } catch (err) {
      console.error(err);
      showToast('error', 'ไม่สามารถส่งออกไฟล์ Excel ได้');
    }
  };

  // Filtered Matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (selectedRound !== 'all') {
        const roundStr = m.round || 'รอบแบ่งกลุ่ม (Group Stage)';
        if (roundStr !== selectedRound) return false;
      }
      if (selectedGroup !== 'all') {
        const cleanMatchGroup = (m.group || '').replace('Group ', '').replace('กลุ่ม ', '').trim();
        const cleanFilterGroup = selectedGroup.replace('Group ', '').replace('กลุ่ม ', '').trim();
        if (cleanMatchGroup !== cleanFilterGroup) return false;
      }
      return true;
    });
  }, [matches, selectedRound, selectedGroup]);

  const canReorder =
    selectedRound === 'all' && selectedGroup === 'all' && viewMode === 'sequence';

  const groupedByDate = useMemo(() => {
    const map: Record<string, Match[]> = {};
    filteredMatches.forEach((m) => {
      const key = m.dateStr && m.dateStr !== 'TBD' ? m.dateStr : 'ยังไม่ระบุวันที่แข่งขัน';
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return map;
  }, [filteredMatches]);

  if (isLoading) {
    return (
      <div className="min-h-[420px] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm font-bold">กำลังโหลดข้อมูลตารางการแข่งขัน...</p>
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

      {/* Header & Summary Stats */}
      <MatchHeader
        tournamentName={tournamentName}
        totalMatches={matches.length}
        totalDays={totalDays}
        totalGroups={groupNames.length}
        totalVenues={totalVenues}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        canAutoGenerate={canAutoGenerate}
        onOpenCreateMatch={() => setIsCreateMatchOpen(true)}
        onAutoGenerateFixtures={handleAutoGenerate}
        onOpenAutoSchedule={() => setIsAutoScheduleOpen(true)}
        onExportExcel={handleExportExcel}
        onOpenClearModal={() => setIsClearDialogOpen(true)}
        onSave={handleSaveSchedule}
      />

      {/* Filter Bar */}
      {matches.length > 0 && (
        <MatchFilterBar
          selectedRound={selectedRound}
          onSelectRound={setSelectedRound}
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
          groupOptions={groupNames}
          knockoutStartingRound={knockoutStartingRound}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
        />
      )}

      {/* Main Schedule Content */}
      {matches.length === 0 ? (
        <MatchEmptyState
          canAutoGenerate={canAutoGenerate}
          onAutoGenerate={handleAutoGenerate}
          onOpenCreateMatch={() => setIsCreateMatchOpen(true)}
        />
      ) : filteredMatches.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-[28px] p-12 text-center">
          <p className="text-base font-extrabold text-slate-700">
            ไม่พบคู่แข่งขันที่ตรงกับตัวกรองที่เลือก
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedRound('all');
              setSelectedGroup('all');
            }}
            className="mt-3 px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : viewMode === 'sequence' ? (
        <div className="space-y-3">
          {filteredMatches.map((match, idx) => (
            <MatchCard
              key={match.id}
              match={match}
              displayOrder={idx + 1}
              canDrag={canReorder}
              canMoveUp={canReorder && idx > 0}
              canMoveDown={canReorder && idx < filteredMatches.length - 1}
              isDragging={draggedIndex === idx}
              isDragOver={dragOverIndex === idx}
              onDragStart={() => setDraggedIndex(idx)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverIndex !== idx) setDragOverIndex(idx);
              }}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              onDrop={() => {
                if (draggedIndex !== null && draggedIndex !== idx) {
                  reorderMatchList(draggedIndex, idx);
                }
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              onMoveUp={() => reorderMatchList(idx, idx - 1)}
              onMoveDown={() => reorderMatchList(idx, idx + 1)}
              onOpenTimeVenueModal={() => setEditingTimeVenueMatch(match)}
              onDelete={() => handleDeleteMatch(match.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(groupedByDate) as [string, Match[]][]).map(
            ([dateStr, matchGroup]) => (
              <div key={dateStr} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-8 h-8 rounded-xl bg-[#1b1c1c] text-[#ffe680] flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-800">
                    {dateStr}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-xs font-extrabold">
                    {matchGroup.length} คู่
                  </span>
                </div>
                <div className="space-y-3">
                  {matchGroup.map((match, idx) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      displayOrder={match.matchNumber || idx + 1}
                      canDrag={false}
                      canMoveUp={false}
                      canMoveDown={false}
                      isDragging={false}
                      isDragOver={false}
                      onDragStart={() => {}}
                      onDragOver={() => {}}
                      onDragEnd={() => {}}
                      onDrop={() => {}}
                      onMoveUp={() => {}}
                      onMoveDown={() => {}}
                      onOpenTimeVenueModal={() => setEditingTimeVenueMatch(match)}
                      onDelete={() => handleDeleteMatch(match.id)}
                    />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Modals */}
      <MatchTimeVenueModal
        isOpen={Boolean(editingTimeVenueMatch)}
        match={editingTimeVenueMatch}
        onClose={() => setEditingTimeVenueMatch(null)}
        onApply={handleApplyTimeVenue}
      />

      <AutoScheduleModal
        isOpen={isAutoScheduleOpen}
        totalMatches={matches.length}
        onClose={() => setIsAutoScheduleOpen(false)}
        onApply={handleApplyAutoSchedule}
      />

      <CreateMatchModal
        isOpen={isCreateMatchOpen}
        teams={teams}
        groupNames={groupNames}
        knockoutStartingRound={knockoutStartingRound}
        onClose={() => setIsCreateMatchOpen(false)}
        onAddMatch={handleAddMatch}
      />

      <ClearMatchesDialog
        isOpen={isClearDialogOpen}
        matchCount={matches.length}
        onClose={() => setIsClearDialogOpen(false)}
        onConfirm={handleConfirmClearAll}
      />
    </div>
  );
};
