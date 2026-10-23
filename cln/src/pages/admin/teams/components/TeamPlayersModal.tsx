import React, { useState, useEffect } from 'react';
import { X, Users, Plus, Trash2, Loader2, Shield, AlertCircle } from 'lucide-react';
import { Team, Player } from '../../../../types';
import { playerService } from '../../../../services/playerService';

export interface TeamPlayersModalProps {
  tournamentId: string;
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayersUpdated?: () => void;
}

export const TeamPlayersModal: React.FC<TeamPlayersModalProps> = ({
  tournamentId,
  team,
  isOpen,
  onClose,
  onPlayersUpdated,
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New player form states (Number + Name only)
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');

  // Load players for this team from Backend API
  const loadPlayers = async () => {
    if (!tournamentId || !team) return;
    setIsLoading(true);
    try {
      const list = await playerService.getByTournament(tournamentId, String(team.id));
      setPlayers(list || []);
    } catch (err) {
      console.error('Error loading players:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && team) {
      loadPlayers();
      setName('');
      setNumber('');
      setErrorMessage(null);
    }
  }, [isOpen, team, tournamentId]);

  if (!isOpen || !team) return null;

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('กรุณาระบุชื่อนักกีฬา');
      return;
    }

    setIsAdding(true);
    setErrorMessage(null);

    try {
      await playerService.create(tournamentId, {
        team_id: String(team.id),
        name: trimmedName,
        number: number.trim() || undefined,
      });

      setName('');
      setNumber('');
      await loadPlayers();
      if (onPlayersUpdated) onPlayersUpdated();
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการเพิ่มนักกีฬา');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    setDeletingId(playerId);
    setErrorMessage(null);
    try {
      await playerService.delete(tournamentId, playerId);
      await loadPlayers();
      if (onPlayersUpdated) onPlayersUpdated();
    } catch (err: any) {
      setErrorMessage(err?.message || 'ไม่สามารถลบนักกีฬาได้');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-amber-200/80 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <Shield className="w-5 h-5 text-[#b45309]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-gray-900 font-display">
                  รายชื่อนักกีฬา: {team.name}
                </h3>
                <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {players.length} คน
                </span>
              </div>
              <p className="text-xs text-gray-500">
                จัดการรายชื่อและหมายเลขเสื้อผู้เล่นในทีม
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Add Player Inline Form */}
          <form
            onSubmit={handleAddPlayer}
            className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/80 space-y-3"
          >
            <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#786607]" />
              <span>เพิ่มนักกีฬาใหม่</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-3">
                <input
                  type="text"
                  maxLength={4}
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="เบอร์เสื้อ (#)"
                  className="w-full px-3 py-2 text-xs font-mono text-center bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffe680] focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-7">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ชื่อ - นามสกุล นักกีฬา *"
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffe680] focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={isAdding}
                  className="w-full h-full py-2 px-3 rounded-lg text-xs font-bold bg-[#ffe680] hover:bg-[#fedb56] text-[#786607] transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 disabled:opacity-60 shadow-2xs"
                >
                  {isAdding ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่ม</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Players List Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-700 flex items-center justify-between">
              <span>รายชื่อในทีม ({players.length} คน)</span>
              {isLoading && (
                <span className="text-[11px] text-gray-400 flex items-center gap-1 font-normal">
                  <Loader2 className="w-3 h-3 animate-spin" /> กำลังโหลด...
                </span>
              )}
            </h4>

            {players.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-gray-200 text-center space-y-1.5 bg-gray-50/40">
                <Users className="w-6 h-6 text-gray-300 mx-auto" />
                <p className="text-xs font-semibold text-gray-600">ยังไม่มีรายชื่อนักกีฬาในทีมนี้</p>
                <p className="text-[11px] text-gray-400">
                  ใช้แบบฟอร์มด้านบนเพื่อเพิ่มนักกีฬาเข้าสู่ทีม
                </p>
              </div>
            ) : (
              <div className="border border-gray-200/90 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-2xs">
                {players.map((p, idx) => {
                  return (
                    <div
                      key={p.id || idx}
                      className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-gray-100 font-mono text-xs font-bold text-gray-700 flex items-center justify-center shrink-0">
                          {p.number ? `#${p.number}` : '-'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                            {p.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => p.id && handleDeletePlayer(p.id)}
                          disabled={deletingId === p.id}
                          className="w-7 h-7 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                          title="ลบนักกีฬา"
                        >
                          {deletingId === p.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-end bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
