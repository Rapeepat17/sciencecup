import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Team, Player } from '../../../types';
import { teamService } from '../../../services/teamService';
import { playerService } from '../../../services/playerService';
import {
  TeamHeader,
  TeamFilterBar,
  TeamStatusFilter,
  TeamCard,
  TeamCreateModal,
  TeamEditModal,
  TeamPlayersModal,
  TeamDeleteDialog,
  TeamEmptyState,
} from './components';

export interface TeamsPageProps {
  currentTournamentId?: string;
  tournamentName?: string;
  onSelectTournament?: () => void;
}

export const TeamsPage: React.FC<TeamsPageProps> = ({
  currentTournamentId,
  tournamentName,
  onSelectTournament,
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TeamStatusFilter>('ALL');

  // Modals & Dialogs states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [managingPlayersTeam, setManagingPlayersTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  // Load teams and players from Backend API
  const loadData = useCallback(async () => {
    if (!currentTournamentId) {
      setTeams([]);
      setPlayers([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [fetchedTeams, fetchedPlayers] = await Promise.all([
        teamService.getByTournament(currentTournamentId),
        playerService.getByTournament(currentTournamentId),
      ]);
      setTeams(fetchedTeams || []);
      setPlayers(fetchedPlayers || []);
    } catch (err: any) {
      console.error('Error fetching teams/players:', err);
      setErrorMessage(err?.message || 'ไม่สามารถโหลดข้อมูลทีมและนักกีฬาได้');
    } finally {
      setIsLoading(false);
    }
  }, [currentTournamentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered teams list based on search and status selection
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const hasGroup = Boolean((t as any).group_name || t.group);
      if (statusFilter === 'ASSIGNED' && !hasGroup) return false;
      if (statusFilter === 'UNASSIGNED' && hasGroup) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const matchName = t.name.toLowerCase().includes(q);
      const matchShort = ((t as any).short_name || t.shortName)?.toLowerCase().includes(q);
      const matchManager = t.manager?.toLowerCase().includes(q);
      const grp = (t as any).group_name || t.group;
      const matchGroup = grp?.toLowerCase().includes(q);

      return matchName || matchShort || matchManager || matchGroup;
    });
  }, [teams, statusFilter, searchQuery]);

  // Map team ID to players count
  const playersCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    players.forEach((p) => {
      const tId = String(p.team_id || (p as any).teamId || '');
      if (tId) {
        counts[tId] = (counts[tId] || 0) + 1;
      }
    });
    return counts;
  }, [players]);

  // Handle Team Create
  const handleSaveCreate = async (payload: {
    name: string;
    short_name?: string;
    manager?: string;
    logo?: string | null;
  }) => {
    if (!currentTournamentId) return;
    await teamService.create(currentTournamentId, payload);
    await loadData();
  };

  // Handle Team Edit
  const handleSaveEdit = async (teamId: string, payload: Partial<Team>) => {
    if (!currentTournamentId) return;
    await teamService.update(currentTournamentId, teamId, payload);
    await loadData();
  };

  // Handle Team Delete
  const handleConfirmDelete = async (teamId: string) => {
    if (!currentTournamentId) return;
    await teamService.delete(currentTournamentId, teamId);
    await loadData();
  };

  // If no tournament is currently selected
  if (!currentTournamentId) {
    return (
      <div className="space-y-6">
        <TeamHeader
          totalTeams={0}
          totalPlayers={0}
          tournamentName={tournamentName}
          onAddTeam={() => {}}
          disabled
        />
        <TeamEmptyState
          noTournament
          onSelectTournament={onSelectTournament}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats and Add Team button */}
      <TeamHeader
        totalTeams={teams.length}
        totalPlayers={players.length}
        tournamentName={tournamentName}
        onAddTeam={() => setIsCreateModalOpen(true)}
      />

      {/* Filter and Search Bar */}
      {teams.length > 0 && (
        <TeamFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          totalFilteredCount={filteredTeams.length}
        />
      )}

      {/* Error message alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {/* Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-[#efeded] p-12 flex flex-col items-center justify-center text-center space-y-3 shadow-2xs">
          <Loader2 className="w-7 h-7 text-[#786607] animate-spin" />
          <p className="text-xs text-[#7d7765]">กำลังโหลดข้อมูลทีมและนักกีฬา...</p>
        </div>
      ) : teams.length === 0 ? (
        <TeamEmptyState onAddTeam={() => setIsCreateModalOpen(true)} />
      ) : filteredTeams.length === 0 ? (
        <TeamEmptyState
          isSearch
          onResetSearch={() => {
            setSearchQuery('');
            setStatusFilter('ALL');
          }}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              playersCount={playersCountMap[String(team.id)] || 0}
              onManagePlayers={() => setManagingPlayersTeam(team)}
              onEdit={() => setEditingTeam(team)}
              onDelete={() => setDeletingTeam(team)}
            />
          ))}
        </div>
      )}

      {/* Modal: Create Team */}
      <TeamCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveCreate}
      />

      {/* Modal: Edit Team */}
      <TeamEditModal
        team={editingTeam}
        isOpen={Boolean(editingTeam)}
        onClose={() => setEditingTeam(null)}
        onSave={handleSaveEdit}
      />

      {/* Modal: Manage Players */}
      <TeamPlayersModal
        tournamentId={currentTournamentId}
        team={managingPlayersTeam}
        isOpen={Boolean(managingPlayersTeam)}
        onClose={() => setManagingPlayersTeam(null)}
        onPlayersUpdated={loadData}
      />

      {/* Dialog: Delete Team confirmation */}
      <TeamDeleteDialog
        team={deletingTeam}
        isOpen={Boolean(deletingTeam)}
        onClose={() => setDeletingTeam(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
