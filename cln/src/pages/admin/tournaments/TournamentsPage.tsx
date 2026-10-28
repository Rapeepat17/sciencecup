import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { TournamentItem } from '../../../types';
import {
  fetchTournamentsList,
  updateTournamentMeta,
  deleteTournament,
  DEFAULT_TOURNAMENT_ID,
} from '../../../services/dbService';
import {
  TournamentHeader,
  TournamentFilterBar,
  TournamentCard,
  TournamentEmptyState,
  TournamentEditModal,
  TournamentDeleteDialog,
} from './components';

export interface TournamentsPageProps {
  tournaments?: TournamentItem[];
  currentTournamentId?: string;
  onSelectTournament?: (id: string) => Promise<void> | void;
  onUpdateTournament?: (id: string, meta: Partial<TournamentItem>) => Promise<void>;
  onDeleteTournament?: (id: string) => Promise<void>;
  onNavigateToCreate?: () => void;
  onNavigateToDashboard?: () => void;
  onOpenUserPortal?: (tournamentId?: string) => void;
}

export const TournamentsPage: React.FC<TournamentsPageProps> = ({
  tournaments: propTournaments,
  currentTournamentId: propCurrentTournamentId,
  onSelectTournament: propOnSelectTournament,
  onUpdateTournament: propOnUpdateTournament,
  onDeleteTournament: propOnDeleteTournament,
  onNavigateToCreate,
  onNavigateToDashboard,
  onOpenUserPortal,
}) => {
  // Internal state if props not provided
  const [internalTournaments, setInternalTournaments] = useState<TournamentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [internalCurrentId, setInternalCurrentId] = useState<string>(() => {
    try {
      return localStorage.getItem('scicup_current_tournament_id') || DEFAULT_TOURNAMENT_ID;
    } catch {
      return DEFAULT_TOURNAMENT_ID;
    }
  });

  const tournaments = propTournaments ?? internalTournaments;
  const currentTournamentId = propCurrentTournamentId ?? internalCurrentId;

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [editingTournament, setEditingTournament] = useState<TournamentItem | null>(null);
  const [deletingTournament, setDeletingTournament] = useState<TournamentItem | null>(null);

  // Load from Backend API
  const loadTournaments = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await fetchTournamentsList();
      setInternalTournaments(list || []);
    } catch (err) {
      console.error('Error fetching tournaments:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!propTournaments) {
      loadTournaments();
    }
  }, [propTournaments, loadTournaments]);

  // Filtered tournament list
  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    });
  }, [tournaments, searchQuery]);

  // Handle select tournament
  const handleSelect = async (id: string) => {
    if (propOnSelectTournament) {
      await propOnSelectTournament(id);
    } else {
      setInternalCurrentId(id);
      try {
        localStorage.setItem('scicup_current_tournament_id', id);
      } catch {}
    }
  };

  // Handle update tournament
  const handleUpdate = async (id: string, meta: Partial<TournamentItem>) => {
    if (propOnUpdateTournament) {
      await propOnUpdateTournament(id, meta);
    } else {
      await updateTournamentMeta(id, meta);
      await loadTournaments();
    }
  };

  // Handle delete tournament
  const handleDelete = async (id: string) => {
    if (propOnDeleteTournament) {
      await propOnDeleteTournament(id);
    } else {
      await deleteTournament(id);
      await loadTournaments();
    }
  };

  // Handle navigation to create tournament
  const handleCreateClick = () => {
    if (onNavigateToCreate) {
      onNavigateToCreate();
    } else {
      window.location.hash = '#create-tournament';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <TournamentHeader
        totalCount={tournaments.length}
        onCreateClick={handleCreateClick}
      />

      {/* Filter and Search Bar */}
      <TournamentFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={filteredTournaments.length}
      />

      {/* Main Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-16 flex flex-col items-center justify-center text-center space-y-3 shadow-2xs">
          <Loader2 className="w-7 h-7 text-[#786607] animate-spin" />
          <p className="text-xs font-semibold text-gray-600">
            กำลังโหลดรายการทัวร์นาเมนต์จากฐานข้อมูล...
          </p>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <TournamentEmptyState
          isSearch={Boolean(searchQuery)}
          onResetSearch={() => setSearchQuery('')}
          onCreateClick={handleCreateClick}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredTournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              isCurrent={String(tournament.id) === String(currentTournamentId)}
              onSelect={() => handleSelect(tournament.id)}
              onEdit={() => setEditingTournament(tournament)}
              onDelete={() => setDeletingTournament(tournament)}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <TournamentEditModal
        tournament={editingTournament}
        isOpen={Boolean(editingTournament)}
        onClose={() => setEditingTournament(null)}
        onSave={handleUpdate}
      />

      {/* Delete Confirmation Dialog */}
      <TournamentDeleteDialog
        tournament={deletingTournament}
        isOpen={Boolean(deletingTournament)}
        onClose={() => setDeletingTournament(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
