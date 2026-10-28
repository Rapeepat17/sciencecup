import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, AlertCircle, RefreshCw, Layers, Plus } from 'lucide-react';
import { Team } from '../../../types';
import { teamService } from '../../../services/teamService';
import { tournamentService } from '../../../services/tournamentService';
import {
  GroupHeader,
  UnassignedPool,
  GroupColumn,
  AddGroupModal,
} from './components';

export interface GroupRecord {
  id: number | string;
  name: string;
}

export interface GroupsPageProps {
  currentTournamentId?: string;
  tournamentName?: string;
}

export const GroupsPage: React.FC<GroupsPageProps> = ({
  currentTournamentId: propTournamentId,
  tournamentName,
}) => {
  // Resolve active tournament ID from props or storage
  const tournamentId = useMemo(() => {
    if (propTournamentId) return propTournamentId;
    try {
      return localStorage.getItem('scicup_current_tournament_id') || '1000';
    } catch {
      return '1000';
    }
  }, [propTournamentId]);

  const [teams, setTeams] = useState<Team[]>([]);
  const [dbGroups, setDbGroups] = useState<GroupRecord[]>([]);
  const [draggedTeamId, setDraggedTeamId] = useState<string | number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);

  // Load teams and groups directly tied to tournament_id from backend API / Database
  const loadData = useCallback(async () => {
    if (!tournamentId) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [groupResponse, fetchedTeams] = await Promise.all([
        tournamentService.getGroups(tournamentId),
        teamService.getByTournament(tournamentId),
      ]);

      const loadedGroups: GroupRecord[] = (groupResponse?.groups || []).map((g: any) => ({
        id: g.id,
        name: g.name,
      }));

      // In case teams have group_name that is not yet in groups table
      const existingNames = new Set(loadedGroups.map((g) => g.name));
      (fetchedTeams || []).forEach((t) => {
        if (t.group_name && t.group_name.trim() !== '' && !existingNames.has(t.group_name.trim())) {
          loadedGroups.push({
            id: `temp_${t.group_name.trim()}`,
            name: t.group_name.trim(),
          });
          existingNames.add(t.group_name.trim());
        }
      });

      // NO DEFAULT A/B: If no groups in database, it stays empty ([])!
      setDbGroups(loadedGroups);
      setTeams(fetchedTeams || []);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('[GroupsPage] Load error:', err);
      setErrorMessage(err.message || 'ไม่สามารถโหลดข้อมูลกลุ่มและทีมได้');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived: All unique group names
  const allGroupNames = useMemo(() => {
    return dbGroups.map((g) => g.name);
  }, [dbGroups]);

  // Derived: Teams unassigned vs assigned
  const unassignedTeams = useMemo(() => {
    return teams.filter((t) => !t.group_name || t.group_name.trim() === '');
  }, [teams]);

  const assignedCount = teams.length - unassignedTeams.length;

  // Handlers for modifying team assignments
  const handleAssignToGroup = (teamId: string | number, groupName: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, group_name: groupName } : t))
    );
    setHasUnsavedChanges(true);
  };

  const handleRemoveFromGroup = (teamId: string | number) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, group_name: undefined } : t))
    );
    setHasUnsavedChanges(true);
  };

  const handleMoveTeam = (teamId: string | number, targetGroup: string) => {
    handleAssignToGroup(teamId, targetGroup);
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, teamId: string | number) => {
    setDraggedTeamId(teamId);
    e.dataTransfer.setData('text/plain', String(teamId));
  };

  const handleDropOnGroup = (groupName: string) => {
    if (draggedTeamId != null) {
      handleAssignToGroup(draggedTeamId, groupName);
      setDraggedTeamId(null);
    }
  };

  // Random Draw feature (สุ่มกระจายทีมทั้งหมดลงในกลุ่มที่มีอยู่จริง)
  const handleRandomDraw = () => {
    if (allGroupNames.length === 0) {
      alert('กรุณาสร้างกลุ่มก่อนสุ่มจับสลาก');
      return;
    }
    if (teams.length === 0) return;

    // Shuffle all teams
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const updated = shuffled.map((team, idx) => {
      const targetGroup = allGroupNames[idx % allGroupNames.length];
      return {
        ...team,
        group_name: targetGroup,
      };
    });

    setTeams(updated);
    setHasUnsavedChanges(true);
  };

  // Reset all groups (ล้างกลุ่มทั้งหมด)
  const handleResetGroups = () => {
    if (!window.confirm('คุณต้องการนำทีมทั้งหมดออกจากกลุ่มใช่หรือไม่?')) return;
    setTeams((prev) => prev.map((t) => ({ ...t, group_name: undefined })));
    setHasUnsavedChanges(true);
  };

  // Group Management (mark hasUnsavedChanges = true, saving will be done via Save button)
  const handleAddGroup = (groupName: string) => {
    const trimmed = groupName.trim();
    if (!trimmed) return;
    if (dbGroups.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())) return;

    setDbGroups((prev) => [
      ...prev,
      { id: `temp_${Date.now()}`, name: trimmed },
    ]);
    setHasUnsavedChanges(true);
  };

  const handleDeleteGroup = (groupId?: number | string, groupName?: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ ${groupName || 'กลุ่มนี้'}?`)) {
      return;
    }
    setDbGroups((prev) => prev.filter((g) => g.id !== groupId && g.name !== groupName));
    if (groupName) {
      setTeams((prev) =>
        prev.map((t) => (t.group_name === groupName ? { ...t, group_name: undefined } : t))
      );
    }
    setHasUnsavedChanges(true);
  };

  const handleRenameGroup = (oldName: string, newName: string, groupId?: number | string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;

    setDbGroups((prev) =>
      prev.map((g) => (g.id === groupId || g.name === oldName ? { ...g, name: trimmed } : g))
    );
    setTeams((prev) =>
      prev.map((t) => (t.group_name === oldName ? { ...t, group_name: trimmed } : t))
    );
    setHasUnsavedChanges(true);
  };

  // Single unified Save: syncs both groups list and team assignments to backend
  const handleSave = async () => {
    if (!tournamentId) return;

    setIsSaving(true);
    setErrorMessage(null);
    try {
      const groupNames = dbGroups.map((g) => g.name);
      const assignments = teams.map((t) => ({
        teamId: t.id,
        groupName: t.group_name || null,
      }));

      const res: any = await tournamentService.updateGroups(tournamentId, {
        groups: groupNames,
        assignments,
      });

      // Reload fresh state from backend to sync real database IDs
      const returnedGroups = res?.groups || res?.data?.groups;
      if (returnedGroups && Array.isArray(returnedGroups)) {
        setDbGroups(returnedGroups);
      }
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('[GroupsPage] Save error:', err);
      setErrorMessage(err.message || 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats and Actions */}
      <GroupHeader
        tournamentName={tournamentName}
        totalTeams={teams.length}
        assignedCount={assignedCount}
        groupsCount={dbGroups.length}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        onRandomDraw={handleRandomDraw}
        onResetGroups={handleResetGroups}
        onAddGroup={() => setIsAddGroupModalOpen(true)}
        onSave={handleSave}
      />

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1 font-bold text-xs underline cursor-pointer hover:text-red-900"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            ลองใหม่
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-[#efeded] p-16 shadow-2xs flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#786607] mb-3" />
          <p className="text-sm font-bold text-[#1b1c1c]">กำลังโหลดข้อมูลกลุ่มและทีม...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#efeded] p-12 text-center shadow-xs">
          <p className="text-base font-bold text-[#1b1c1c] mb-1">ยังไม่มีทีมในทัวร์นาเมนต์นี้</p>
          <p className="text-xs text-[#7d7765]">
            กรุณาไปที่เมนู "สร้างและจัดการทีม" เพื่อเพิ่มทีมก่อนทำการจัดกลุ่ม
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unassigned Teams Drawer */}
          <UnassignedPool
            teams={unassignedTeams}
            groupNames={allGroupNames}
            onAssignToGroup={handleAssignToGroup}
            onDragStart={handleDragStart}
          />

          {/* Group Grid (Columns) or Empty State if 0 groups */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[#1b1c1c]">
                สายการแข่งขัน ({dbGroups.length} กลุ่ม)
              </h3>
              {dbGroups.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAddGroupModalOpen(true)}
                  className="text-xs font-bold text-[#786607] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มกลุ่ม
                </button>
              )}
            </div>

            {dbGroups.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#efeded] p-12 shadow-xs flex flex-col items-center justify-center text-center min-h-[220px]">
                <div className="w-12 h-12 rounded-2xl bg-[#ffe680]/30 border border-[#ffe680] text-[#786607] flex items-center justify-center mb-3">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="font-display text-base font-bold text-[#1b1c1c]">
                  ยังไม่มีการสร้างกลุ่มในทัวร์นาเมนต์นี้
                </h4>
                <p className="text-xs text-[#7d7765] max-w-sm mt-1 mb-4">
                  สร้างกลุ่ม เช่น กลุ่ม A, กลุ่ม B เพื่อเริ่มจัดสรรทีมลงสายการแข่งขัน
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddGroupModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1b1c1c] hover:bg-black text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>สร้างกลุ่มแรก</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {dbGroups.map((grp) => {
                  const groupTeams = teams.filter((t) => t.group_name === grp.name);
                  return (
                    <GroupColumn
                      key={grp.id}
                      groupId={grp.id}
                      groupName={grp.name}
                      teams={groupTeams}
                      allGroupNames={allGroupNames}
                      unassignedTeams={unassignedTeams}
                      onAddTeamToGroup={handleAssignToGroup}
                      onRemoveFromGroup={handleRemoveFromGroup}
                      onMoveTeam={handleMoveTeam}
                      onDeleteGroup={handleDeleteGroup}
                      onRenameGroup={handleRenameGroup}
                      onDropOnGroup={handleDropOnGroup}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for adding group */}
      <AddGroupModal
        isOpen={isAddGroupModalOpen}
        onClose={() => setIsAddGroupModalOpen(false)}
        onAdd={handleAddGroup}
        existingGroups={allGroupNames}
      />
    </div>
  );
};
