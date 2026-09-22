import React, { useState, useRef } from 'react';
import { Team, Player, GroupMap, Match } from '../types';
import {
  Shield,
  Search,
  User,
  Plus,
  X,
  Upload,
  Edit3,
  Trash2,
  Users,
  Check,
  Shirt,
  UserPlus,
  Save,
  Table as TableIcon,
  LayoutGrid,
  Filter,
} from 'lucide-react';
import { TeamLogo } from './TeamLogo';

interface TeamsViewProps {
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  setGroups?: React.Dispatch<React.SetStateAction<GroupMap>>;
  setMatches?: React.Dispatch<React.SetStateAction<Match[]>>;
  onClearAllTeams?: () => void;
}

export const TeamsView: React.FC<TeamsViewProps> = ({ teams, setTeams, setGroups, setMatches, onClearAllTeams }) => {
  const [viewMode, setViewMode] = useState<'clubs' | 'playersTable'>('clubs');
  const [search, setSearch] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [activeTab, setActiveTab] = useState<'players' | 'edit'>('players');

  // Add Team Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamShort, setNewTeamShort] = useState('');
  const [newTeamCity, setNewTeamCity] = useState('กรุงเทพฯ');
  const [newTeamStadium, setNewTeamStadium] = useState('สนามกีฬาเทศบาล');
  const [newTeamManager, setNewTeamManager] = useState('หัวหน้าผู้ฝึกสอน');
  const [newTeamLogo, setNewTeamLogo] = useState('');

  // Add Player State (inside team modal or table view)
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [targetTeamIdForAdd, setTargetTeamIdForAdd] = useState<string | number>('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [newPlayerPos, setNewPlayerPos] = useState('กองหน้า');

  // Edit Player State
  const [editingPlayer, setEditingPlayer] = useState<{ teamId: string | number; player: Player } | null>(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerNumber, setEditPlayerNumber] = useState('');
  const [editPlayerPos, setEditPlayerPos] = useState('กองหน้า');

  // Edit Team State (inside modal)
  const [editName, setEditName] = useState('');
  const [editShort, setEditShort] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editStadium, setEditStadium] = useState('');
  const [editManager, setEditManager] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fileInputCreateRef = useRef<HTMLInputElement>(null);
  const fileInputEditRef = useRef<HTMLInputElement>(null);

  // Open modal for selected team
  const handleOpenTeamModal = (team: Team, tab: 'players' | 'edit' = 'players') => {
    setSelectedTeam(team);
    setActiveTab(tab);
    setEditName(team.name || '');
    setEditShort(team.shortName || '');
    setEditCity(team.city || 'กรุงเทพฯ');
    setEditStadium(team.stadium || 'สนามกีฬาเทศบาล');
    setEditManager(team.manager || 'หัวหน้าผู้ฝึกสอน');
    setEditLogo(team.logo || '');
    setNewPlayerName('');
    setNewPlayerNumber('');
    setNewPlayerPos('กองหน้า');
    setSavedSuccess(false);
  };

  // Create new team
  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTeamName.trim() || `ทีม ${teams.length + 1}`;
    const short = newTeamShort.trim()
      ? newTeamShort.trim().slice(0, 5).toUpperCase()
      : name.slice(0, 3).toUpperCase();

    const colors = [
      'bg-amber-100 text-amber-800 border-amber-300',
      'bg-emerald-100 text-emerald-800 border-emerald-300',
      'bg-sky-100 text-sky-800 border-sky-300',
      'bg-purple-100 text-purple-800 border-purple-300',
    ];

    const newTeam: Team = {
      id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      nameEn: name,
      shortName: short,
      logo: newTeamLogo || '',
      badgeIcon: 'sports_soccer',
      color: colors[teams.length % colors.length],
      stadium: newTeamStadium.trim() || 'สนามกีฬาเทศบาล',
      city: newTeamCity.trim() || 'กรุงเทพฯ',
      manager: newTeamManager.trim() || 'หัวหน้าผู้ฝึกสอน',
      players: [
        { id: `p-${Date.now()}-1`, name: 'กัปตันทีม', number: 10, position: 'กองหน้า' },
        { id: `p-${Date.now()}-2`, name: 'ผู้รักษาประตูหลัก', number: 1, position: 'ผู้รักษาประตู' },
      ],
    };

    setTeams((prev) => [...prev, newTeam]);
    setNewTeamName('');
    setNewTeamShort('');
    setNewTeamLogo('');
    setShowAddModal(false);
  };

  // Save Team Details & Logo Edit
  const handleSaveTeamEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    const updatedName = editName.trim() || selectedTeam.name;
    const updatedShort = editShort.trim()
      ? editShort.trim().slice(0, 5).toUpperCase()
      : updatedName.slice(0, 3).toUpperCase();

    const updatedTeam: Team = {
      ...selectedTeam,
      name: updatedName,
      nameEn: updatedName,
      shortName: updatedShort,
      city: editCity.trim() || 'กรุงเทพฯ',
      stadium: editStadium.trim() || 'สนามกีฬาเทศบาล',
      manager: editManager.trim() || 'หัวหน้าผู้ฝึกสอน',
      logo: editLogo,
    };

    setTeams((prev) => prev.map((t) => (String(t.id) === String(selectedTeam.id) ? updatedTeam : t)));

    if (setGroups) {
      setGroups((prevGroups) => {
        const updated: GroupMap = {};
        Object.keys(prevGroups).forEach((gKey) => {
          updated[gKey] = (prevGroups[gKey] || []).map((t) =>
            String(t.id) === String(selectedTeam.id)
              ? { ...t, name: updatedTeam.name, nameEn: updatedTeam.nameEn, shortName: updatedTeam.shortName, logo: updatedTeam.logo }
              : t
          );
        });
        return updated;
      });
    }

    if (setMatches) {
      setMatches((prevMatches) =>
        prevMatches.map((m) => {
          let t1 = m.team1;
          let t2 = m.team2;
          let changed = false;

          if (String(m.team1?.id) === String(selectedTeam.id) || m.team1?.name === selectedTeam.name) {
            t1 = { ...m.team1, name: updatedTeam.name, nameEn: updatedTeam.nameEn, shortName: updatedTeam.shortName, logo: updatedTeam.logo };
            changed = true;
          }
          if (String(m.team2?.id) === String(selectedTeam.id) || m.team2?.name === selectedTeam.name) {
            t2 = { ...m.team2, name: updatedTeam.name, nameEn: updatedTeam.nameEn, shortName: updatedTeam.shortName, logo: updatedTeam.logo };
            changed = true;
          }

          return changed ? { ...m, team1: t1, team2: t2 } : m;
        })
      );
    }

    setSelectedTeam(updatedTeam);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Add Player to specific team
  const handleAddPlayerToTeam = (teamId: string | number, name: string, numberStr: string, pos: string) => {
    if (!name.trim()) return;
    const targetTeam = teams.find((t) => String(t.id) === String(teamId));
    if (!targetTeam) return;

    const newPlayer: Player = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: name.trim(),
      number: numberStr.trim() ? numberStr.trim() : (targetTeam.players?.length || 0) + 1,
      position: pos || 'กองหน้า',
    };

    const updatedPlayers = [...(targetTeam.players || []), newPlayer];
    const updatedTeam = { ...targetTeam, players: updatedPlayers };

    setTeams((prev) => prev.map((t) => (String(t.id) === String(teamId) ? updatedTeam : t)));
    if (selectedTeam && String(selectedTeam.id) === String(teamId)) {
      setSelectedTeam(updatedTeam);
    }
  };

  // Delete Player from Team
  const handleDeletePlayer = (teamId: string | number, playerId: string) => {
    const targetTeam = teams.find((t) => String(t.id) === String(teamId));
    if (!targetTeam) return;

    const updatedPlayers = (targetTeam.players || []).filter((p) => p.id !== playerId);
    const updatedTeam = { ...targetTeam, players: updatedPlayers };

    setTeams((prev) => prev.map((t) => (String(t.id) === String(teamId) ? updatedTeam : t)));
    if (selectedTeam && String(selectedTeam.id) === String(teamId)) {
      setSelectedTeam(updatedTeam);
    }
  };

  // Start editing player
  const handleOpenEditPlayer = (teamId: string | number, player: Player) => {
    setEditingPlayer({ teamId, player });
    setEditPlayerName(player.name);
    setEditPlayerNumber(String(player.number));
    setEditPlayerPos(player.position || 'กองหน้า');
  };

  // Save edited player
  const handleSavePlayerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;

    const { teamId, player } = editingPlayer;
    const targetTeam = teams.find((t) => String(t.id) === String(teamId));
    if (!targetTeam) return;

    const updatedPlayers = (targetTeam.players || []).map((p) =>
      p.id === player.id
        ? {
            ...p,
            name: editPlayerName.trim() || p.name,
            number: editPlayerNumber.trim() ? editPlayerNumber.trim() : p.number,
            position: editPlayerPos,
          }
        : p
    );

    const updatedTeam = { ...targetTeam, players: updatedPlayers };

    setTeams((prev) => prev.map((t) => (String(t.id) === String(teamId) ? updatedTeam : t)));
    if (selectedTeam && String(selectedTeam.id) === String(teamId)) {
      setSelectedTeam(updatedTeam);
    }
    setEditingPlayer(null);
  };

  // Delete Single Team
  const handleDeleteTeam = (teamId: string | number, teamName: string) => {
    if (confirm(`คุณต้องการลบทีม "${teamName}" หรือไม่?`)) {
      setTeams((prev) => prev.filter((t) => String(t.id) !== String(teamId)));
      if (setGroups) {
        setGroups((prev) => {
          const updated: GroupMap = {};
          Object.keys(prev).forEach((gKey) => {
            updated[gKey] = (prev[gKey] || []).filter((t) => String(t.id) !== String(teamId));
          });
          return updated;
        });
      }
      if (setMatches) {
        setMatches((prev) => prev.filter((m) => String(m.team1?.id) !== String(teamId) && String(m.team2?.id) !== String(teamId)));
      }
      if (selectedTeam && String(selectedTeam.id) === String(teamId)) setSelectedTeam(null);
    }
  };

  // Clear All Teams
  const handleClearAll = () => {
    if (onClearAllTeams) {
      onClearAllTeams();
    } else if (confirm('คุณต้องการลบทีมทั้งหมดและล้างตารางแข่งขันใช่หรือไม่?')) {
      setTeams([]);
      if (setGroups) setGroups({});
      if (setMatches) setMatches([]);
      setSelectedTeam(null);
    }
  };

  // Flatten all players across teams for All Players Table
  const allPlayersList: { player: Player; team: Team }[] = [];
  teams.forEach((t) => {
    (t.players || []).forEach((p) => {
      allPlayersList.push({ player: p, team: t });
    });
  });

  // Filter teams / players
  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.shortName && t.shortName.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredAllPlayers = allPlayersList.filter(({ player, team }) => {
    // Team Filter
    if (selectedTeamFilter !== 'all' && String(team.id) !== selectedTeamFilter) {
      return false;
    }
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const pName = player.name.toLowerCase();
      const pNum = String(player.number).toLowerCase();
      const pPos = (player.position || '').toLowerCase();
      const tName = team.name.toLowerCase();
      if (!pName.includes(q) && !pNum.includes(q) && !pPos.includes(q) && !tName.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-white p-6 lg:p-8 shadow-xs border border-[#efeded] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#6f5d00] text-xs font-bold uppercase mb-1">
            <Shield className="w-4 h-4" />
            <span>สโมสรและรายชื่อนักเตะทั้งหมด</span>
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-[#1b1c1c]">
            ข้อมูลทีม ({teams.length} สโมสร) &amp; ตารางนักเตะ ({allPlayersList.length} คน)
          </h1>
          <p className="text-sm text-[#4b4737] mt-1">
            สร้างทีมใหม่, เปลี่ยนชื่อทีม/โลโก้สโมสร, และจัดการตารางเก็บข้อมูลนักเตะ (ชื่อและเบอร์เสื้อ)
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-[#f5f3f3] rounded-full border border-[#efeded]">
            <button
              type="button"
              onClick={() => setViewMode('clubs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'clubs'
                  ? 'bg-white text-[#1b1c1c] shadow-2xs'
                  : 'text-[#4b4737] hover:text-[#1b1c1c]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>สโมสร ({teams.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('playersTable')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'playersTable'
                  ? 'bg-white text-[#1b1c1c] shadow-2xs'
                  : 'text-[#4b4737] hover:text-[#1b1c1c]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>ตารางนักเตะ ({allPlayersList.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {teams.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs shadow-2xs transition-all cursor-pointer border border-red-200"
                title="ลบทีมทั้งหมด"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ล้างทีมทั้งหมด</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#ffe680] hover:bg-[#fbe27c] text-[#786607] font-display font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างทีมใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODE 1: มุมมองการ์ดสโมสร (Clubs Grid View)
         ========================================================================= */}
      {viewMode === 'clubs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b4737]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อทีม หรือตัวย่อ..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-white border border-[#efeded] text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
              />
            </div>
          </div>

          {filteredTeams.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#efeded] shadow-2xs space-y-3">
              <Shield className="w-12 h-12 text-[#4b4737] mx-auto opacity-40" />
              <h3 className="font-display font-bold text-base text-[#1b1c1c]">ไม่พบข้อมูลทีม</h3>
              <p className="text-xs text-[#4b4737]">ลองเปลี่ยนคำค้นหา หรือกดปุ่มสร้างทีมใหม่</p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-full bg-[#ffe680] text-[#786607] font-bold text-xs"
              >
                + สร้างทีมใหม่
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredTeams.map((t) => {
                const playerCount = t.players?.length || 0;

                return (
                  <div
                    key={t.id}
                    className="group rounded-3xl bg-white p-5 shadow-2xs border border-[#efeded] hover:shadow-md hover:border-[#ffe680] transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header: Logo & Short Name & Action Menu */}
                      <div className="flex items-center justify-between mb-4">
                        <TeamLogo
                          logo={t.logo}
                          name={t.name}
                          className="w-14 h-14 group-hover:scale-105 transition-transform"
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-[#f5f3f3] text-[#4b4737] font-bold">
                            {t.shortName || 'FC'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTeam(t.id, t.name);
                            }}
                            className="p-1.5 rounded-full hover:bg-rose-50 text-rose-500 transition-colors cursor-pointer"
                            title="ลบทีมนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Team Name */}
                      <h2 className="font-display text-base font-bold text-[#1b1c1c] group-hover:text-[#6f5d00] transition-colors">
                        {t.name}
                      </h2>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-[#4b4737]">{t.nameEn || 'Football Club'}</span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#95fcbc]/30 text-[#007746] font-bold">
                          นักเตะ {playerCount} คน
                        </span>
                      </div>

                      {/* Details (Only Manager) */}
                      <div className="mt-4 pt-3 border-t border-[#efeded] text-xs text-[#4b4737]">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-[#006d40]" />
                          <span>{t.manager || 'หัวหน้าผู้ฝึกสอน'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-4 pt-3 border-t border-[#efeded] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenTeamModal(t, 'players')}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#ffe680] hover:bg-[#fbe27c] text-[#786607] font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Shirt className="w-3.5 h-3.5" />
                        <span>จัดการนักเตะ ({playerCount})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenTeamModal(t, 'edit')}
                        className="p-2 rounded-xl bg-[#f5f3f3] hover:bg-[#efeded] text-[#4b4737] hover:text-[#1b1c1c] transition-colors cursor-pointer"
                        title="แก้ไขชื่อทีมและโลโก้"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODE 2: ตารางเก็บข้อมูลนักเตะทั้งหมด (All Players Data Table View)
         ========================================================================= */}
      {viewMode === 'playersTable' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#efeded] space-y-4">
          {/* Table Header Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#efeded]">
            <div className="flex items-center gap-2">
              <Shirt className="w-5 h-5 text-[#6f5d00]" />
              <div>
                <h3 className="font-display text-base font-bold text-[#1b1c1c]">
                  ตารางเก็บข้อมูลรายชื่อนักเตะ (Player Database)
                </h3>
                <p className="text-xs text-[#4b4737]">
                  รวบรวมรายชื่อ หมายเลขเสื้อ และสโมสรของนักเตะทั้งหมด ({filteredAllPlayers.length} รายการ)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter by Team */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f3f3] border border-[#efeded] text-xs">
                <Filter className="w-3.5 h-3.5 text-[#4b4737]" />
                <select
                  value={selectedTeamFilter}
                  onChange={(e) => setSelectedTeamFilter(e.target.value)}
                  className="bg-transparent text-[#1b1c1c] font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all">ทุกสโมสร ({allPlayersList.length} คน)</option>
                  {teams.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name} ({(t.players || []).length} คน)
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Players */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#4b4737]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหานักเตะ/เบอร์..."
                  className="pl-8 pr-3 py-1.5 rounded-full bg-[#f5f3f3] text-xs text-[#1b1c1c] border border-[#efeded] focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                />
              </div>

              {/* Add Player to Team Button */}
              {teams.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setTargetTeamIdForAdd(teams[0].id);
                    setNewPlayerName('');
                    setNewPlayerNumber('');
                    setNewPlayerPos('กองหน้า');
                    setShowAddPlayerModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#ffe680] text-[#786607] font-bold text-xs hover:bg-[#fbe27c] transition-all cursor-pointer shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มนักเตะเข้าทีม</span>
                </button>
              )}
            </div>
          </div>

          {/* Full Player Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-[#f5f3f3] text-[#4b4737] uppercase font-bold text-[11px] border-b border-[#efeded]">
                  <th className="py-3 px-4 text-center w-16">เบอร์เสื้อ #</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล นักเตะ</th>
                  <th className="py-3 px-4">ตำแหน่ง</th>
                  <th className="py-3 px-4">สโมสร / ทีมสังกัด</th>
                  <th className="py-3 px-4 text-center w-28">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efeded]">
                {filteredAllPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#4b4737]">
                      <Shirt className="w-8 h-8 text-[#4b4737] mx-auto mb-2 opacity-30" />
                      <p className="font-bold text-xs text-[#1b1c1c]">ไม่พบข้อมูลนักเตะในตาราง</p>
                      <p className="text-[11px] text-[#4b4737] mt-0.5">
                        ลองเปลี่ยนตัวกรองสโมสร หรือกดปุ่มเพิ่มนักเตะเข้าทีม
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAllPlayers.map(({ player, team }) => (
                    <tr key={`${team.id}-${player.id}`} className="hover:bg-[#fcf9f8] transition-colors">
                      {/* Jersey Number Badge */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#ffe680] text-[#786607] font-display font-black text-xs shadow-2xs">
                          #{player.number}
                        </span>
                      </td>

                      {/* Player Name */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#1b1c1c] block text-xs">
                          {player.name}
                        </span>
                      </td>

                      {/* Position Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            player.position === 'กองหน้า'
                              ? 'bg-rose-100 text-rose-700'
                              : player.position === 'กองกลาง'
                              ? 'bg-amber-100 text-amber-800'
                              : player.position === 'ผู้รักษาประตู'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {player.position || 'ผู้เล่น'}
                        </span>
                      </td>

                      {/* Team Logo & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <TeamLogo logo={team.logo} name={team.name} className="w-6 h-6 shrink-0" />
                          <span className="font-bold text-[#1b1c1c] text-xs">{team.name}</span>
                          <span className="text-[10px] text-[#4b4737]">({team.shortName || 'FC'})</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPlayer(team.id, player)}
                            className="p-1.5 rounded-lg bg-[#f5f3f3] hover:bg-[#efeded] text-[#4b4737] hover:text-[#1b1c1c] transition-colors cursor-pointer"
                            title="แก้ไขข้อมูลนักเตะ"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePlayer(team.id, player.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                            title="ลบนักเตะคนนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ทีม & จัดการนักเตะ & แก้ไขโลโก้ชื่อทีม
         ========================================================================= */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#efeded] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#ffe680]/50 via-white to-[#f5f3f3] p-5 border-b border-[#efeded] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TeamLogo logo={selectedTeam.logo} name={selectedTeam.name} className="w-12 h-12 shadow-xs" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-bold text-lg text-[#1b1c1c]">
                      {selectedTeam.name}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#ffe680] text-[#786607] font-bold">
                      {selectedTeam.shortName || 'FC'}
                    </span>
                  </div>
                  <p className="text-xs text-[#4b4737]">
                    โค้ช: {selectedTeam.manager || 'หัวหน้าผู้ฝึกสอน'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTeam(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#efeded] hover:bg-[#f5f3f3] flex items-center justify-center text-[#4b4737] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-[#efeded] bg-[#faf9f8] px-4 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('players')}
                className={`flex-1 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-b-2 ${
                  activeTab === 'players'
                    ? 'border-[#6f5d00] text-[#6f5d00] bg-white rounded-t-xl'
                    : 'border-transparent text-[#4b4737] hover:text-[#1b1c1c]'
                }`}
              >
                <Shirt className="w-4 h-4 text-[#786607]" />
                <span>ตารางรายชื่อนักเตะ ({selectedTeam.players?.length || 0} คน)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex-1 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-b-2 ${
                  activeTab === 'edit'
                    ? 'border-[#6f5d00] text-[#6f5d00] bg-white rounded-t-xl'
                    : 'border-transparent text-[#4b4737] hover:text-[#1b1c1c]'
                }`}
              >
                <Edit3 className="w-4 h-4 text-[#786607]" />
                <span>แก้ไขชื่อทีม &amp; โลโก้</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* TAB 1: รายชื่อนักเตะ */}
              {activeTab === 'players' && (
                <div className="space-y-4">
                  {/* Add Player Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddPlayerToTeam(selectedTeam.id, newPlayerName, newPlayerNumber, newPlayerPos);
                      setNewPlayerName('');
                      setNewPlayerNumber('');
                    }}
                    className="p-3.5 bg-[#f5f3f3] rounded-2xl border border-[#efeded] space-y-3"
                  >
                    <h4 className="font-display font-bold text-xs uppercase text-[#1b1c1c] flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-[#786607]" />
                      <span>ลงทะเบียนเพิ่มนักเตะใหม่</span>
                    </h4>

                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-3">
                        <label className="block text-[11px] font-bold text-[#4b4737] mb-1">
                          เบอร์เสื้อ #
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="เช่น 10"
                          value={newPlayerNumber}
                          onChange={(e) => setNewPlayerNumber(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#efeded] text-xs font-bold text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                        />
                      </div>

                      <div className="col-span-5">
                        <label className="block text-[11px] font-bold text-[#4b4737] mb-1">
                          ชื่อ - นามสกุล นักเตะ
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="เช่น ธีรศิลป์ แดงดา"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#efeded] text-xs text-[#1b1c1c] font-semibold focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                        />
                      </div>

                      <div className="col-span-4">
                        <label className="block text-[11px] font-bold text-[#4b4737] mb-1">
                          ตำแหน่ง
                        </label>
                        <select
                          value={newPlayerPos}
                          onChange={(e) => setNewPlayerPos(e.target.value)}
                          className="w-full px-2 py-2 rounded-xl bg-white border border-[#efeded] text-xs text-[#1b1c1c] font-semibold focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                        >
                          <option value="กองหน้า">กองหน้า (FW)</option>
                          <option value="กองกลาง">กองกลาง (MF)</option>
                          <option value="กองหลัง">กองหลัง (DF)</option>
                          <option value="ผู้รักษาประตู">ผู้รักษาประตู (GK)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-[#ffe680] hover:bg-[#fbe27c] text-[#786607] font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>บันทึกเพิ่มนักเตะ</span>
                    </button>
                  </form>

                  {/* Player Table Roster */}
                  <div>
                    <h4 className="font-display font-bold text-xs uppercase text-[#1b1c1c] mb-2">
                      ตารางรายชื่อผู้เล่น ({selectedTeam.players?.length || 0} คน)
                    </h4>

                    {(!selectedTeam.players || selectedTeam.players.length === 0) ? (
                      <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-[#efeded] text-[#4b4737]">
                        <Shirt className="w-8 h-8 text-[#4b4737] mx-auto mb-1.5 opacity-40" />
                        <p className="font-bold text-xs text-[#1b1c1c]">ยังไม่มีรายชื่อนักเตะ</p>
                        <p className="text-[11px] text-[#4b4737]">
                          กรอกชื่อและเบอร์เสื้อในฟอร์มด้านบนเพื่อลงทะเบียนนักเตะ
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-[#efeded] rounded-2xl">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead>
                            <tr className="bg-[#f5f3f3] text-[#4b4737] uppercase font-bold text-[10px]">
                              <th className="py-2 px-3 text-center w-12">เบอร์ #</th>
                              <th className="py-2 px-3">ชื่อ - นามสกุล นักเตะ</th>
                              <th className="py-2 px-3">ตำแหน่ง</th>
                              <th className="py-2 px-3 text-center w-20">จัดการ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#efeded]">
                            {selectedTeam.players.map((p) => (
                              <tr key={p.id} className="hover:bg-[#fcf9f8]">
                                <td className="py-2 px-3 text-center font-bold">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#ffe680] text-[#786607]">
                                    #{p.number}
                                  </span>
                                </td>
                                <td className="py-2 px-3 font-bold text-[#1b1c1c]">{p.name}</td>
                                <td className="py-2 px-3 text-[#4b4737]">{p.position || 'ผู้เล่น'}</td>
                                <td className="py-2 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditPlayer(selectedTeam.id, p)}
                                      className="p-1 rounded hover:bg-[#efeded] text-[#4b4737]"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePlayer(selectedTeam.id, p.id)}
                                      className="p-1 rounded hover:bg-rose-50 text-rose-600"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: แก้ไขข้อมูลทีม & โลโก้ */}
              {activeTab === 'edit' && (
                <form onSubmit={handleSaveTeamEdit} className="space-y-3.5">
                  {savedSuccess && (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>บันทึกการแก้ไขชื่อทีมและโลโก้เรียบร้อยแล้ว!</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">
                      ชื่อทีม / สโมสร (Official Team Name)
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="เช่น สิงห์เจ้าท่า FC"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#f5f3f3] border border-[#efeded] text-xs font-semibold text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">
                        ตัวย่อ (Short Code)
                      </label>
                      <input
                        type="text"
                        value={editShort}
                        onChange={(e) => setEditShort(e.target.value)}
                        placeholder="เช่น PAT"
                        maxLength={5}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#f5f3f3] border border-[#efeded] text-xs font-bold text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">
                        ผู้จัดการทีม / โค้ช
                      </label>
                      <input
                        type="text"
                        value={editManager}
                        onChange={(e) => setEditManager(e.target.value)}
                        placeholder="ชื่อหัวหน้าผู้ฝึกสอน"
                        className="w-full px-3.5 py-2 rounded-xl bg-[#f5f3f3] border border-[#efeded] text-xs text-[#1b1c1c] font-semibold focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                      />
                    </div>
                  </div>

                  {/* Logo Image Upload / URL */}
                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">
                      รูปภาพโลโก้สโมสร
                    </label>

                    <div className="p-3 bg-[#f5f3f3] rounded-2xl border border-[#efeded] space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-white p-1 border border-[#efeded] flex items-center justify-center shrink-0 shadow-xs">
                          {editLogo ? (
                            <img
                              src={editLogo}
                              alt="Logo preview"
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Shield className="w-7 h-7 text-[#786607]" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <button
                            type="button"
                            onClick={() => fileInputEditRef.current?.click()}
                            className="w-full py-1.5 px-3 rounded-xl bg-white border border-[#efeded] hover:bg-[#faf9f8] text-xs font-bold text-[#1b1c1c] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Upload className="w-3.5 h-3.5 text-[#786607]" />
                            <span>อัปโหลดรูปภาพใหม่ (PNG, JPG)</span>
                          </button>
                          {editLogo && (
                            <button
                              type="button"
                              onClick={() => setEditLogo('')}
                              className="text-[11px] text-rose-600 hover:underline font-bold block"
                            >
                              ลบรูปภาพโลโก้
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <input
                      ref={fileInputEditRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) setEditLogo(ev.target.result as string);
                          };
                          reader.readAsDataURL(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </div>

                  <div className="pt-3 border-t border-[#efeded] flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-[#ffe680] hover:bg-[#fbe27c] text-[#786607] font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>บันทึกการแก้ไข</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#faf9f8] border-t border-[#efeded] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTeam(null)}
                className="px-5 py-2 rounded-full bg-[#1b1c1c] hover:bg-black text-white font-bold text-xs transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: แก้ไขข้อมูลนักเตะ (Edit Player Modal)
         ========================================================================= */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[#efeded] space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-[#efeded]">
              <h3 className="font-display font-bold text-base text-[#1b1c1c]">แก้ไขข้อมูลนักเตะ</h3>
              <button
                type="button"
                onClick={() => setEditingPlayer(null)}
                className="p-1 rounded-full hover:bg-[#efeded]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlayerEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">หมายเลขเสื้อ / เบอร์ #</label>
                <input
                  type="text"
                  required
                  value={editPlayerNumber}
                  onChange={(e) => setEditPlayerNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f5f3f3] text-xs font-bold text-[#1b1c1c] border border-[#efeded]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">ชื่อ - นามสกุล นักเตะ</label>
                <input
                  type="text"
                  required
                  value={editPlayerName}
                  onChange={(e) => setEditPlayerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f5f3f3] text-xs text-[#1b1c1c] font-semibold border border-[#efeded]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">ตำแหน่ง</label>
                <select
                  value={editPlayerPos}
                  onChange={(e) => setEditPlayerPos(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f5f3f3] text-xs text-[#1b1c1c] font-semibold border border-[#efeded]"
                >
                  <option value="กองหน้า">กองหน้า (FW)</option>
                  <option value="กองกลาง">กองกลาง (MF)</option>
                  <option value="กองหลัง">กองหลัง (DF)</option>
                  <option value="ผู้รักษาประตู">ผู้รักษาประตู (GK)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#efeded] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="px-4 py-2 rounded-full bg-[#f5f3f3] text-xs font-semibold text-[#4b4737]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#ffe680] text-[#786607] font-bold text-xs"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: เพิ่มนักเตะเข้าทีมจากตาราง (Add Player from Table View Modal)
         ========================================================================= */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[#efeded] space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-[#efeded]">
              <h3 className="font-display font-bold text-base text-[#1b1c1c]">เพิ่มนักเตะเข้าทีม</h3>
              <button
                type="button"
                onClick={() => setShowAddPlayerModal(false)}
                className="p-1 rounded-full hover:bg-[#efeded]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddPlayerToTeam(targetTeamIdForAdd, newPlayerName, newPlayerNumber, newPlayerPos);
                setShowAddPlayerModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">สังกัดทีม / สโมสร</label>
                <select
                  value={targetTeamIdForAdd}
                  onChange={(e) => setTargetTeamIdForAdd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f5f3f3] text-xs font-semibold text-[#1b1c1c] border border-[#efeded]"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.shortName || 'FC'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">หมายเลขเสื้อ / เบอร์ #</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 7"
                  value={newPlayerNumber}
                  onChange={(e) => setNewPlayerNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f5f3f3] text-xs font-bold text-[#1b1c1c] border border-[#efeded]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">ชื่อ - นามสกุล นักเตะ</label>
                <input
                  type="text"
                  required
                  placeholder="ชื่อนักเตะ"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f5f3f3] text-xs text-[#1b1c1c] font-semibold border border-[#efeded]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">ตำแหน่ง</label>
                <select
                  value={newPlayerPos}
                  onChange={(e) => setNewPlayerPos(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f5f3f3] text-xs text-[#1b1c1c] font-semibold border border-[#efeded]"
                >
                  <option value="กองหน้า">กองหน้า (FW)</option>
                  <option value="กองกลาง">กองกลาง (MF)</option>
                  <option value="กองหลัง">กองหลัง (DF)</option>
                  <option value="ผู้รักษาประตู">ผู้รักษาประตู (GK)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#efeded] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPlayerModal(false)}
                  className="px-4 py-2 rounded-full bg-[#f5f3f3] text-xs font-semibold text-[#4b4737]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#ffe680] text-[#786607] font-bold text-xs"
                >
                  + เพิ่มนักเตะ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: สร้างทีมใหม่ (Create Team Modal)
         ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#efeded] space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#efeded]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#ffe680] text-[#786607] flex items-center justify-center font-bold shadow-xs">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#1b1c1c]">สร้างทีมใหม่</h3>
                  <p className="text-xs text-[#4b4737]">ลงทะเบียนสโมสรเข้าร่วมการแข่งขัน</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-[#f5f3f3] hover:bg-[#efeded] flex items-center justify-center text-[#4b4737] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">
                  ชื่อทีม / สโมสร
                </label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder={`ระบุชื่อทีม (หรือกดเพื่อสร้าง ทีม ${teams.length + 1})`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f5f3f3] text-xs text-[#1b1c1c] font-semibold border border-[#efeded] focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">
                    ตัวย่อ (Short Code)
                  </label>
                  <input
                    type="text"
                    value={newTeamShort}
                    onChange={(e) => setNewTeamShort(e.target.value)}
                    placeholder="เช่น BKK"
                    maxLength={5}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#f5f3f3] text-xs font-bold text-[#1b1c1c] border border-[#efeded] focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">ผู้จัดการทีม</label>
                  <input
                    type="text"
                    value={newTeamManager}
                    onChange={(e) => setNewTeamManager(e.target.value)}
                    placeholder="ชื่อผู้จัดการทีม"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#f5f3f3] text-xs text-[#1b1c1c] font-semibold border border-[#efeded] focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">
                  รูปภาพทีม / โลโก้
                </label>
                {newTeamLogo ? (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#f5f3f3] border border-[#efeded]">
                    <div className="w-12 h-12 rounded-lg bg-white p-1 border border-[#efeded] shrink-0">
                      <img
                        src={newTeamLogo}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputCreateRef.current?.click()}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-[#efeded]"
                      >
                        เปลี่ยนรูป
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTeamLogo('')}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white text-rose-600 border border-[#efeded]"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputCreateRef.current?.click()}
                    className="border border-dashed border-[#efeded] hover:border-[#ffe680] p-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer bg-[#fbf9f8] hover:bg-[#faf8f7] transition-colors"
                  >
                    <Upload className="w-4 h-4 text-[#786607]" />
                    <span className="text-xs text-[#4b4737] font-semibold">
                      อัปโหลดรูปภาพทีม (PNG, JPG)
                    </span>
                  </div>
                )}
                <input
                  ref={fileInputCreateRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) setNewTeamLogo(ev.target.result as string);
                      };
                      reader.readAsDataURL(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </div>

              <div className="pt-3 border-t border-[#efeded] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full bg-[#f5f3f3] text-xs font-semibold text-[#4b4737]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#ffe680] hover:bg-[#fbe27c] text-[#786607] font-bold text-xs shadow-xs cursor-pointer"
                >
                  สร้างทีม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
