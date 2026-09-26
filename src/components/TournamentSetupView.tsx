import React, { useState, useRef } from 'react';
import { Team, GroupMap, Match } from '../types';
import { INITIAL_TEAMS } from '../data/initialData';
import { TeamLogo } from './TeamLogo';
import {
  Users,
  Plus,
  Trash2,
  Dices,
  RotateCcw,
  Shield,
  X,
  Layers,
  ArrowLeftRight,
  Edit2,
  Check,
  FolderPlus,
  UserPlus,
  ClipboardList,
  CheckCircle2,
  FileText,
  Upload,
  Image as ImageIcon,
  Save,
} from 'lucide-react';

interface TournamentSetupViewProps {
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  groups: GroupMap;
  setGroups: React.Dispatch<React.SetStateAction<GroupMap>>;
  setMatches?: React.Dispatch<React.SetStateAction<Match[]>>;
  tournamentName: string;
  setTournamentName: (name: string) => void;
  onProceedToFixtures: () => void;
  onClearAllTeams?: () => void;
}

export const TournamentSetupView: React.FC<TournamentSetupViewProps> = ({
  teams,
  setTeams,
  groups,
  setGroups,
  setMatches,
  tournamentName,
  setTournamentName,
  onProceedToFixtures,
  onClearAllTeams,
}) => {
  // Team addition modal state
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [modalTeamName, setModalTeamName] = useState('');
  const [modalTeamShort, setModalTeamShort] = useState('');
  const [modalTeamLogo, setModalTeamLogo] = useState('');
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Bulk add modal
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkInputText, setBulkInputText] = useState('');

  // Group creation state
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [modalGroupName, setModalGroupName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  // Quick state for adding a team to a specific group
  const [activeGroupAddDropdown, setActiveGroupAddDropdown] = useState<string | null>(null);

  // Group keys list
  const groupKeys = Object.keys(groups);

  // Set of team IDs that are currently assigned to any group
  const assignedTeamIdToGroup = new Map<string | number, string>();
  groupKeys.forEach((gKey) => {
    (groups[gKey] || []).forEach((t) => {
      assignedTeamIdToGroup.set(t.id, gKey);
    });
  });

  // Unassigned teams list
  const unassignedTeams = teams.filter((t) => !assignedTeamIdToGroup.has(t.id));
  const assignedCount = teams.length - unassignedTeams.length;

  const badgeColors = [
    'bg-amber-100 text-amber-800 border-amber-300',
    'bg-emerald-100 text-emerald-800 border-emerald-300',
    'bg-sky-100 text-sky-800 border-sky-300',
    'bg-purple-100 text-purple-800 border-purple-300',
    'bg-rose-100 text-rose-800 border-rose-300',
    'bg-orange-100 text-orange-800 border-orange-300',
    'bg-teal-100 text-teal-800 border-teal-300',
    'bg-indigo-100 text-indigo-800 border-indigo-300',
  ];

  // Helper to create team object
  const createTeamObject = (name: string, short?: string): Team => {
    const trimmed = name.trim();
    const finalName = trimmed || `ทีม ${teams.length + 1}`;
    const finalShort = short?.trim()
      ? short.trim().slice(0, 5).toUpperCase()
      : (trimmed ? trimmed.slice(0, 3).toUpperCase() : `T${teams.length + 1}`);

    const colorIndex = (teams.length + Math.floor(Math.random() * 8)) % badgeColors.length;

    return {
      id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: finalName,
      nameEn: finalName,
      shortName: finalShort,
      logo: '',
      badgeIcon: 'sports_soccer',
      color: badgeColors[colorIndex],
      stadium: 'สนามกีฬาเทศบาล',
      city: 'กรุงเทพฯ',
      manager: 'หัวหน้าผู้ฝึกสอน',
    };
  };

  // Helper to handle image file upload (PNG, JPG, SVG, WebP)
  const handleImageFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (PNG, JPG, WEBP, SVG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setModalTeamLogo(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Open modal with clean state
  const handleOpenAddModal = () => {
    setModalTeamName('');
    setModalTeamShort('');
    setModalTeamLogo('');
    setIsDraggingLogo(false);
    setShowAddTeamModal(true);
  };

  // Submit from modal
  const handleSubmitNewTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = modalTeamName.trim();
    const finalName = trimmed || `ทีม ${teams.length + 1}`;
    const finalShort = modalTeamShort.trim()
      ? modalTeamShort.trim().slice(0, 5).toUpperCase()
      : (trimmed ? trimmed.slice(0, 3).toUpperCase() : `T${teams.length + 1}`);

    const colorIndex = (teams.length + Math.floor(Math.random() * 8)) % badgeColors.length;

    const newTeam: Team = {
      id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: finalName,
      nameEn: finalName,
      shortName: finalShort,
      logo: modalTeamLogo || '',
      badgeIcon: 'sports_soccer',
      color: badgeColors[colorIndex],
      stadium: 'สนามกีฬาเทศบาล',
      city: 'กรุงเทพฯ',
      manager: 'หัวหน้าผู้ฝึกสอน',
    };

    setTeams((prev) => [...prev, newTeam]);
    setModalTeamName('');
    setModalTeamShort('');
    setModalTeamLogo('');
    setShowAddTeamModal(false);
    setSuccessToast(`เพิ่มทีม "${newTeam.name}" เรียบร้อยแล้ว`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // 1. Add team handler
  const handleAddTeam = (e?: React.FormEvent, customName?: string) => {
    if (e) e.preventDefault();
    const targetName = customName !== undefined ? customName : '';
    const newTeam = createTeamObject(targetName);

    setTeams((prev) => [...prev, newTeam]);
    setSuccessToast(`เพิ่มทีม "${newTeam.name}" เรียบร้อยแล้ว`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Bulk add multiple teams
  const handleBulkAddTeams = () => {
    const lines = bulkInputText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const newTeamsList: Team[] = lines.map((lineName, idx) => {
      const colorIndex = (teams.length + idx) % badgeColors.length;
      return {
        id: `team-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        name: lineName,
        nameEn: lineName,
        shortName: lineName.slice(0, 4).toUpperCase(),
        logo: '',
        badgeIcon: 'sports_soccer',
        color: badgeColors[colorIndex],
        stadium: 'สนามกีฬาเทศบาล',
        city: 'กรุงเทพฯ',
        manager: 'หัวหน้าผู้ฝึกสอน',
      };
    });

    setTeams((prev) => [...prev, ...newTeamsList]);
    setBulkInputText('');
    setShowBulkAddModal(false);
    setSuccessToast(`เพิ่ม ${newTeamsList.length} ทีมพร้อมกันเรียบร้อยแล้ว`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Delete team
  const handleDeleteTeam = (teamId: string | number) => {
    const sId = String(teamId);
    setTeams((prev) => prev.filter((t) => String(t.id) !== sId));
    // Also remove from any group it belongs to
    const updatedGroups: GroupMap = {};
    groupKeys.forEach((gKey) => {
      updatedGroups[gKey] = (groups[gKey] || []).filter((t) => String(t.id) !== sId);
    });
    setGroups(updatedGroups);
    // Also remove from matches
    if (setMatches) {
      setMatches((prev) => prev.filter((m) => String(m.team1?.id) !== sId && String(m.team2?.id) !== sId));
    }
  };

  // Clear all teams
  const handleClearAllTeams = () => {
    if (onClearAllTeams) {
      onClearAllTeams();
      setSuccessToast('ล้างรายชื่อทีมและข้อมูลทั้งหมดเรียบร้อยแล้ว');
      setTimeout(() => setSuccessToast(null), 3000);
    } else if (window.confirm('คุณต้องการล้างรายชื่อทีมและโปรแกรมการแข่งขันทั้งหมดใช่หรือไม่?')) {
      setTeams([]);
      setGroups({});
      if (setMatches) {
        setMatches([]);
      }
      setSuccessToast('ล้างรายชื่อทีมและข้อมูลทั้งหมดเรียบร้อยแล้ว');
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // 2. Create a new group
  const handleCreateGroup = (customName?: string) => {
    const nameToUse = (customName || newGroupName).trim();
    let finalGroupName = nameToUse;

    if (!finalGroupName) {
      // Auto-generate name based on alphabet: กลุ่ม A, กลุ่ม B, กลุ่ม C...
      const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const nextLetter = alphabet.find((l) => !groups[`กลุ่ม ${l}`] && !groups[l]);
      finalGroupName = nextLetter ? `กลุ่ม ${nextLetter}` : `กลุ่ม ${groupKeys.length + 1}`;
    }

    if (groups[finalGroupName]) {
      alert(`มี "${finalGroupName}" อยู่แล้ว กรุณาใช้ชื่อกลุ่มอื่น`);
      return;
    }

    setGroups({
      ...groups,
      [finalGroupName]: [],
    });
    setNewGroupName('');
  };

  const handleOpenAddGroupModal = () => {
    const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const nextLetter = alphabet.find((l) => !groups[`กลุ่ม ${l}`] && !groups[l]);
    setModalGroupName(nextLetter ? `กลุ่ม ${nextLetter}` : `กลุ่ม ${groupKeys.length + 1}`);
    setShowAddGroupModal(true);
  };

  const handleSubmitGroupModal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetName = modalGroupName.trim();
    if (!targetName) return;
    if (groups[targetName]) {
      alert(`มี "${targetName}" อยู่แล้ว กรุณาใช้ชื่อกลุ่มอื่น`);
      return;
    }
    handleCreateGroup(targetName);
    setShowAddGroupModal(false);
    setModalGroupName('');
  };

  // Quick Create Preset Groups (2 groups: A, B or 4 groups: A, B, C, D)
  const handleCreatePresetGroups = (count: 2 | 4) => {
    const letters = count === 2 ? ['A', 'B'] : ['A', 'B', 'C', 'D'];
    const updated: GroupMap = { ...groups };
    letters.forEach((l) => {
      const gName = `กลุ่ม ${l}`;
      if (!updated[gName]) {
        updated[gName] = [];
      }
    });
    setGroups(updated);
  };

  // Delete a group (teams inside become unassigned)
  const handleDeleteGroup = (groupKey: string) => {
    const updated: GroupMap = { ...groups };
    delete updated[groupKey];
    setGroups(updated);
  };

  // Rename a group
  const handleSaveRenameGroup = (oldKey: string) => {
    const trimmed = editingGroupName.trim();
    if (!trimmed || trimmed === oldKey) {
      setEditingGroupId(null);
      return;
    }
    if (groups[trimmed] && trimmed !== oldKey) {
      alert(`มีกลุ่มชื่อ "${trimmed}" อยู่แล้ว`);
      return;
    }

    const updated: GroupMap = {};
    groupKeys.forEach((k) => {
      if (k === oldKey) {
        updated[trimmed] = groups[oldKey];
      } else {
        updated[k] = groups[k];
      }
    });
    setGroups(updated);
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  // Add a specific team into a group
  const handleAddTeamToGroup = (groupKey: string, team: Team) => {
    // Remove team from any existing group first
    const updated: GroupMap = {};
    groupKeys.forEach((k) => {
      updated[k] = (groups[k] || []).filter((t) => t.id !== team.id);
    });
    // Add to target group
    updated[groupKey] = [...(updated[groupKey] || []), team];
    setGroups(updated);
    setActiveGroupAddDropdown(null);
  };

  // Remove a team from a group (becomes unassigned)
  const handleRemoveTeamFromGroup = (groupKey: string, teamId: string | number) => {
    setGroups({
      ...groups,
      [groupKey]: (groups[groupKey] || []).filter((t) => t.id !== teamId),
    });
  };

  // Move a team from one group to another
  const handleMoveTeamToOtherGroup = (fromGroup: string, toGroup: string, team: Team) => {
    if (fromGroup === toGroup) return;
    const updated: GroupMap = { ...groups };
    updated[fromGroup] = (updated[fromGroup] || []).filter((t) => t.id !== team.id);
    updated[toGroup] = [...(updated[toGroup] || []), team];
    setGroups(updated);
  };

  // Auto Distribute: distribute unassigned teams evenly into created groups
  const handleAutoDistributeTeams = () => {
    if (groupKeys.length === 0) {
      alert('กรุณาสร้างกลุ่มอย่างน้อย 1 กลุ่มก่อนสุ่มจัดทีม');
      return;
    }
    if (unassignedTeams.length === 0) {
      alert('จัดทีมเข้ากลุ่มครบทุกทีมแล้ว');
      return;
    }

    // Shuffle unassigned teams
    const shuffled = [...unassignedTeams];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Distribute round-robin to existing groups
    const updated: GroupMap = { ...groups };
    shuffled.forEach((team, idx) => {
      const targetGroupKey = groupKeys[idx % groupKeys.length];
      updated[targetGroupKey] = [...(updated[targetGroupKey] || []), team];
    });

    setGroups(updated);
  };

  // Reset all group assignments (empty all groups)
  const handleResetAllAssignments = () => {
    if (window.confirm('คุณต้องการนำทีมทั้งหมดออกจากกลุ่มหรือไม่? (กลุ่มจะยังคงอยู่)')) {
      const updated: GroupMap = {};
      groupKeys.forEach((k) => {
        updated[k] = [];
      });
      setGroups(updated);
      if (setMatches) {
        setMatches((prev) => prev.filter((m) => m.group === 'Knockout'));
      }
    }
  };

  // Clear all groups completely
  const handleClearAllGroups = () => {
    if (window.confirm('คุณต้องการลบกลุ่มทั้งหมดหรือไม่? (ทีมทั้งหมดจะกลับมาเป็นสถานะยังไม่จัดกลุ่ม)')) {
      setGroups({});
      if (setMatches) {
        setMatches((prev) => prev.filter((m) => m.group === 'Knockout'));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="rounded-3xl bg-white p-6 lg:p-7 shadow-xs border border-[#efeded] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-[#1b1c1c] tracking-tight">
            สร้างทีมและจัดกลุ่มการแข่งขัน
          </h1>
          <p className="text-sm text-[#4b4737] mt-1">
            เพิ่มรายชื่อทีมผู้เข้าแข่งขัน และสร้างกลุ่มเพื่อจัดสายการแข่งขันด้วยตนเอง
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f5f3f3] border border-[#efeded] text-xs font-semibold text-[#1b1c1c]">
            <Users className="w-3.5 h-3.5 text-[#6f5d00]" />
            <span>ทีมทั้งหมด: <strong>{teams.length}</strong> ทีม</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f5f3f3] border border-[#efeded] text-xs font-semibold text-[#1b1c1c]">
            <Layers className="w-3.5 h-3.5 text-[#006d40]" />
            <span>กลุ่มที่สร้าง: <strong>{groupKeys.length}</strong> กลุ่ม</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ส่วนที่ 1: เพิ่มและจัดการทีม (Add & Manage Teams)
         ========================================================================= */}
      <section className="rounded-3xl bg-white p-6 lg:p-7 shadow-xs border border-[#efeded] space-y-5">
        {/* Section Title & Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#efeded]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ffe680] text-[#786607] flex items-center justify-center font-bold text-sm font-display">
              1
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#1b1c1c] leading-tight">
                เพิ่มและจัดการทีม
              </h2>
              <p className="text-xs text-[#4b4737]">
                จัดการรายชื่อทีมและเพิ่มทีมเข้าสู่การแข่งขัน
              </p>
            </div>
          </div>

          {/* ฝั่งขวา: ปุ่มล้างทีม และปุ่มเพิ่มทีม */}
          <div className="flex items-center gap-2 flex-wrap">
            {teams.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllTeams}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f5f3f3] hover:bg-[#ffdad6] hover:text-[#ba1a1a] text-[#4b4737] text-xs font-semibold transition-colors shadow-2xs border border-[#efeded] cursor-pointer"
                title="ลบทีมทั้งหมด"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ล้างทีมทั้งหมด</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ffe680] hover:bg-[#fbe27c] active:scale-95 text-[#786607] font-display font-bold text-sm shadow-xs transition-all cursor-pointer border border-[#f2d863]"
            >
              <Plus className="w-4 h-4 text-[#786607]" />
              <span>เพิ่มทีม</span>
            </button>
          </div>
        </div>

        {/* Success Toast Notification */}
        {successToast && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Team Summary Counter & List */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#4b4737] mb-2.5">
            <span>
              รายชื่อทีมทั้งหมด (<strong>{teams.length}</strong> ทีม)
            </span>
            <span>
              จัดกลุ่มแล้ว: <strong className="text-[#007746]">{assignedCount}</strong> ทีม • ยังไม่จัดกลุ่ม: <strong className="text-[#b37400]">{unassignedTeams.length}</strong> ทีม
            </span>
          </div>

          {teams.length === 0 ? (
            <div className="py-10 text-center text-[#4b4737] text-sm border-2 border-dashed border-[#efeded] rounded-2xl bg-[#fbf9f9]">
              <Users className="w-8 h-8 mx-auto text-[#cec6b2] mb-2" />
              <p className="font-semibold text-[#1b1c1c]">ยังไม่มีทีมในรายการ</p>
              <p className="text-xs text-[#4b4737] mt-1">
                คลิกปุ่ม &quot;เพิ่มทีม&quot; ด้านบนเพื่อเพิ่มทีม หรือคลิกปุ่ม &quot;สุ่มสร้าง 8 ทีม / 16 ทีม&quot;
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {teams.map((team) => {
                const assignedGroupName = assignedTeamIdToGroup.get(team.id);

                return (
                  <div
                    key={team.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#f5f3f3] hover:bg-[#efeded] border border-[#efeded] transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamLogo logo={team.logo} name={team.name} className="w-7 h-7" />

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1b1c1c] truncate leading-tight">
                          {team.name}
                        </p>
                        <span className="text-[10px] text-[#4b4737] block">
                          {team.shortName || 'FC'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {assignedGroupName ? (
                        <span className="px-2 py-0.5 rounded-md bg-[#95fcbc]/60 text-[#006d40] text-[10px] font-bold">
                          {assignedGroupName}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-[#ffe680]/50 text-[#786607] text-[10px] font-semibold">
                          ยังไม่จัดกลุ่ม
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteTeam(team.id)}
                        className="text-[#4b4737] hover:text-[#ba1a1a] p-1 rounded transition-colors opacity-40 group-hover:opacity-100"
                        title="ลบทีมนี้"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          ส่วนที่ 2: สร้างกลุ่มและจัดกลุ่ม (Create Groups & Assign Teams)
         ========================================================================= */}
      <section className="rounded-3xl bg-white p-6 lg:p-7 shadow-xs border border-[#efeded] space-y-5">
        {/* Section Title & Creation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#efeded]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#006d40] text-white flex items-center justify-center font-bold text-sm font-display">
              2
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#1b1c1c] leading-tight">
                สร้างกลุ่มและจัดกลุ่มการแข่งขัน
              </h2>
              <p className="text-xs text-[#4b4737]">
                สร้างกลุ่มการแข่งขันตามที่ต้องการ แล้วเลือกจัดทีมเข้าแต่ละกลุ่ม
              </p>
            </div>
          </div>

          {/* ฝั่งขวา: เครื่องมือจัดการกลุ่ม และปุ่มสร้างกลุ่ม */}
          <div className="flex items-center gap-2 flex-wrap">
            {groupKeys.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleAutoDistributeTeams}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ffe680] hover:bg-[#fbe27c] text-[#786607] text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                  title="สุ่มแจกจ่ายทีมที่ยังไม่ได้จัดกลุ่มลงในกลุ่มที่มีอยู่อย่างเท่าเทียม"
                >
                  <Dices className="w-3.5 h-3.5 text-[#6f5d00]" />
                  <span>สุ่มจัดทีมอัตโนมัติ</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearAllGroups}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f5f3f3] hover:bg-[#ffdad6] hover:text-[#ba1a1a] text-[#4b4737] text-xs font-semibold transition-colors shadow-2xs border border-[#efeded] cursor-pointer"
                  title="ลบกลุ่มทั้งหมด"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบกลุ่มทั้งหมด</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleOpenAddGroupModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006d40] hover:bg-[#005733] active:scale-95 text-white font-display font-bold text-sm shadow-xs transition-all cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-white" />
              <span>สร้างกลุ่ม</span>
            </button>
          </div>
        </div>

        {/* Group Cards Grid */}
        {groupKeys.length === 0 ? (
          <div className="py-12 text-center text-[#4b4737] text-sm border-2 border-dashed border-[#efeded] rounded-2xl bg-[#fbf9f9]">
            <Layers className="w-8 h-8 mx-auto text-[#cec6b2] mb-2" />
            <p className="font-semibold text-[#1b1c1c]">ยังไม่มีกลุ่มการแข่งขัน</p>
            <p className="text-xs text-[#4b4737] mt-1 max-w-md mx-auto">
              คลิกปุ่ม &quot;สร้างกลุ่ม&quot; ด้านบนขวา เพื่อเริ่มเพิ่มกลุ่มการแข่งขัน
            </p>
            <button
              type="button"
              onClick={handleOpenAddGroupModal}
              className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#006d40] hover:bg-[#005733] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>สร้างกลุ่ม</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {groupKeys.map((groupKey) => {
              const groupTeams = groups[groupKey] || [];
              const isEditing = editingGroupId === groupKey;

              return (
                <div
                  key={groupKey}
                  className="rounded-2xl bg-[#f5f3f3] p-4 border border-[#efeded] shadow-2xs flex flex-col justify-between"
                >
                  {/* Group Header */}
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#efeded]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-[#ffe680] text-[#786607] font-bold text-xs flex items-center justify-center shrink-0">
                          {groupKey.replace(/กลุ่ม|Group|สาย/i, '').trim().slice(0, 2) || 'G'}
                        </span>

                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingGroupName}
                              onChange={(e) => setEditingGroupName(e.target.value)}
                              className="px-2 py-0.5 text-xs font-bold rounded border bg-white focus:outline-none w-28"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRenameGroup(groupKey)}
                              className="p-1 rounded bg-[#006d40] text-white hover:bg-[#005733]"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 min-w-0">
                            <h3 className="font-display font-bold text-sm text-[#1b1c1c] truncate">
                              {groupKey}
                            </h3>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingGroupId(groupKey);
                                setEditingGroupName(groupKey);
                              }}
                              className="text-[#4b4737] hover:text-[#1b1c1c] p-0.5 rounded opacity-50 hover:opacity-100"
                              title="เปลี่ยนชื่อกลุ่ม"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-white text-[11px] font-bold text-[#1b1c1c] border border-[#efeded]">
                          {groupTeams.length} ทีม
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(groupKey)}
                          className="p-1 rounded text-[#4b4737] hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
                          title="ลบกลุ่มนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Team Slots in this Group */}
                    <div className="space-y-2">
                      {groupTeams.map((team, idx) => (
                        <div
                          key={team.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#efeded] shadow-2xs group hover:border-[#ffe680] transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-[#f5f3f3] text-[#4b4737] font-bold text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <TeamLogo logo={team.logo} name={team.name} className="w-6 h-6" />
                            <span className="text-xs font-bold text-[#1b1c1c] truncate">
                              {team.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Move to other group selector */}
                            {groupKeys.length > 1 && (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleMoveTeamToOtherGroup(groupKey, e.target.value, team);
                                    e.target.value = '';
                                  }
                                }}
                                defaultValue=""
                                className="text-[10px] bg-[#f5f3f3] hover:bg-[#efeded] text-[#4b4737] border-0 rounded px-1 py-0.5 cursor-pointer"
                                title="ย้ายไปกลุ่มอื่น"
                              >
                                <option value="" disabled>
                                  ย้าย
                                </option>
                                {groupKeys
                                  .filter((k) => k !== groupKey)
                                  .map((k) => (
                                    <option key={k} value={k}>
                                      {k}
                                    </option>
                                  ))}
                              </select>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveTeamFromGroup(groupKey, team.id)}
                              className="text-[#4b4737] hover:text-[#ba1a1a] p-1 rounded transition-colors"
                              title="ถอดออกจากกลุ่ม"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {groupTeams.length === 0 && (
                        <div className="py-6 text-center text-xs text-[#7d7765] border border-dashed border-[#cec6b2] rounded-xl bg-white/40">
                          ยังไม่มีทีมในกลุ่มนี้
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unassigned team selection dropdown */}
                  {unassignedTeams.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#efeded]">
                      {activeGroupAddDropdown === groupKey ? (
                        <div className="space-y-1.5 bg-white p-2 rounded-xl border border-[#efeded] shadow-sm">
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#4b4737]">
                            <span>เลือกทีมที่ยังไม่จัดกลุ่ม:</span>
                            <button
                              type="button"
                              onClick={() => setActiveGroupAddDropdown(null)}
                              className="text-[#ba1a1a] hover:underline"
                            >
                              ปิด
                            </button>
                          </div>
                          <div className="max-h-36 overflow-y-auto space-y-1">
                            {unassignedTeams.map((team) => (
                              <button
                                key={team.id}
                                type="button"
                                onClick={() => {
                                  handleAddTeamToGroup(groupKey, team);
                                  if (unassignedTeams.length <= 1) {
                                    setActiveGroupAddDropdown(null);
                                  }
                                }}
                                className="w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#ffe680]/30 text-xs text-[#1b1c1c] transition-colors"
                              >
                                <span className="font-semibold truncate">{team.name}</span>
                                <Plus className="w-3 h-3 text-[#006d40] shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveGroupAddDropdown(groupKey)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#f5f3f3] hover:bg-[#efeded] text-[#4b4737] text-[11px] font-semibold transition-all border border-[#efeded]"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-[#006d40]" />
                          <span>เลือกจากทีมรอจัดกลุ่ม ({unassignedTeams.length})</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================================
          หน้าต่างป๊อปอัป: เพิ่มทีมใหม่ (Add Team Modal)
         ========================================================================= */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-[#efeded] space-y-4 animate-scaleUp max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#ffe680] text-[#786607] flex items-center justify-center font-bold shadow-2xs">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#1b1c1c]">
                    เพิ่มทีม
                  </h3>
                  <p className="text-xs text-[#4b4737]">
                    กรอกชื่อทีม ชื่อย่อ และเพิ่มรูปภาพทีม
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTeamModal(false)}
                className="w-8 h-8 rounded-full bg-[#f5f3f3] hover:bg-[#efeded] flex items-center justify-center text-[#4b4737] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewTeam} className="space-y-4 pt-1">
              {/* 1. พิมพ์ชื่อทีม */}
              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1.5">
                  ชื่อทีม <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d7765]" />
                  <input
                    type="text"
                    value={modalTeamName}
                    onChange={(e) => setModalTeamName(e.target.value)}
                    placeholder={`ระบุชื่อทีม (หรือกดเพิ่มเพื่อสร้าง 'ทีม ${teams.length + 1}')`}
                    maxLength={40}
                    autoFocus
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#f5f3f3] text-sm text-[#1b1c1c] placeholder:text-[#7d7765] border border-[#efeded] focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                  />
                </div>
              </div>

              {/* 2. ชื่อย่อ */}
              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1.5">
                  ชื่อย่อ (Short Name)
                </label>
                <input
                  type="text"
                  value={modalTeamShort}
                  onChange={(e) => setModalTeamShort(e.target.value)}
                  placeholder="เช่น CSU, BKK (ไม่เกิน 5 ตัวอักษร)"
                  maxLength={5}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f5f3f3] text-sm text-[#1b1c1c] placeholder:text-[#7d7765] border border-[#efeded] focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                />
              </div>

              {/* 3. เพิ่มรูปทีม */}
              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1.5">
                  เพิ่มรูปทีม / โลโก้สโมสร
                </label>

                {modalTeamLogo ? (
                  <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#f5f3f3] border border-[#efeded]">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-[#efeded] shadow-2xs shrink-0 flex items-center justify-center p-1.5">
                      <img
                        src={modalTeamLogo}
                        alt="Team Logo Preview"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <p className="text-xs font-semibold text-[#1b1c1c]">รูปภาพทีมปัจจุบัน</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-[#efeded] text-[#1b1c1c] border border-[#efeded] transition-colors cursor-pointer"
                        >
                          เปลี่ยนรูปภาพ
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalTeamLogo('')}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-[#ffdad6] text-[#ba1a1a] border border-[#efeded] transition-colors cursor-pointer"
                        >
                          ลบรูป
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(true);
                    }}
                    onDragLeave={() => setIsDraggingLogo(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleImageFileChange(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                      isDraggingLogo
                        ? 'border-[#ffe680] bg-[#fff9db]'
                        : 'border-[#d0cbbe] hover:border-[#ffe680] bg-[#fbf9f8]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#f0ede6] flex items-center justify-center text-[#6f5d00] mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-[#1b1c1c]">
                      คลิกเพื่ออัปโหลดรูปภาพทีม หรือลากไฟล์มาวาง
                    </p>
                    <p className="text-[11px] text-[#7d7765] mt-0.5">
                      รองรับ PNG, JPG, JPEG, WEBP, SVG
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageFileChange(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                </div>

              {/* ปุ่มดำเนินการ */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#efeded]">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#f5f3f3] hover:bg-[#efeded] text-xs font-semibold text-[#4b4737] transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#ffe680] hover:bg-[#fbe27c] text-[#786607] font-display font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#786607]" />
                  <span>เพิ่มทีม</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          หน้าต่างป๊อปอัป: สร้างกลุ่มใหม่ (Add Group Modal)
         ========================================================================= */}
      {showAddGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-[#efeded] space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#006d40] text-white flex items-center justify-center font-bold shadow-2xs">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#1b1c1c]">
                    สร้างกลุ่ม
                  </h3>
                  <p className="text-xs text-[#4b4737]">
                    ระบุชื่อกลุ่มสายการแข่งขัน
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddGroupModal(false)}
                className="w-8 h-8 rounded-full bg-[#f5f3f3] hover:bg-[#efeded] flex items-center justify-center text-[#4b4737] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitGroupModal} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1.5">
                  ชื่อกลุ่ม <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d7765]" />
                  <input
                    type="text"
                    value={modalGroupName}
                    onChange={(e) => setModalGroupName(e.target.value)}
                    placeholder="เช่น กลุ่ม A, กลุ่ม B, สายบน"
                    maxLength={30}
                    autoFocus
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#f5f3f3] text-sm text-[#1b1c1c] placeholder:text-[#7d7765] border border-[#efeded] focus:outline-none focus:ring-2 focus:ring-[#95fcbc]"
                  />
                </div>
              </div>

              {/* Quick suggestions */}
              <div>
                <p className="text-[11px] text-[#7d7765] mb-1.5 font-medium">ชื่อกลุ่มแนะนำ:</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['กลุ่ม A', 'กลุ่ม B', 'กลุ่ม C', 'กลุ่ม D', 'สายตะวันออก', 'สายตะวันตก'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setModalGroupName(suggestion)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        modalGroupName === suggestion
                          ? 'bg-[#006d40] text-white border-[#006d40]'
                          : 'bg-[#f5f3f3] hover:bg-[#efeded] text-[#1b1c1c] border-[#efeded]'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#efeded]">
                <button
                  type="button"
                  onClick={() => setShowAddGroupModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#f5f3f3] hover:bg-[#efeded] text-xs font-semibold text-[#4b4737] transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#006d40] hover:bg-[#005733] text-white font-display font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>สร้างกลุ่ม</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          หน้าต่างป๊อปอัป: วางรายชื่อหลายทีม (Bulk Add Modal)
         ========================================================================= */}
      {showBulkAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-xl border border-[#efeded] space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#ffe680] text-[#786607] flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#1b1c1c]">
                    วางรายชื่อหลายทีมพร้อมกัน
                  </h3>
                  <p className="text-xs text-[#4b4737]">
                    พิมพ์หรือคัดลอกรายชื่อทีมมาวาง โดย 1 บรรทัด = 1 ทีม
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkAddModal(false)}
                className="w-8 h-8 rounded-full bg-[#f5f3f3] hover:bg-[#efeded] flex items-center justify-center text-[#4b4737]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <textarea
                value={bulkInputText}
                onChange={(e) => setBulkInputText(e.target.value)}
                placeholder={`ช้างศึก ยูไนเต็ด\nพระนคร ซิตี้\nสิงห์เจ้าท่า FC\nสยาม สปิริต\nเชียงใหม่ วอริเออร์\nขอนแก่น ยูธ`}
                rows={6}
                className="w-full p-3 rounded-2xl bg-[#f5f3f3] border border-[#efeded] text-sm text-[#1b1c1c] placeholder:text-[#7d7765] focus:outline-none focus:ring-2 focus:ring-[#ffe680] font-sans"
              />
              <p className="text-[11px] text-[#7d7765]">
                ระบบจะสร้างทีมใหม่ทั้งหมดตามบรรทัดที่กรอก และสร้างตราสโมสรอัตโนมัติ
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#efeded]">
              <button
                type="button"
                onClick={() => setShowBulkAddModal(false)}
                className="px-4 py-2 rounded-xl bg-[#f5f3f3] hover:bg-[#efeded] text-xs font-semibold text-[#4b4737]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleBulkAddTeams}
                disabled={!bulkInputText.trim()}
                className="px-5 py-2 rounded-xl bg-[#ffe680] hover:bg-[#fbe27c] text-[#786607] font-bold text-xs shadow-xs disabled:opacity-50"
              >
                เพิ่มทีมทั้งหมด ({bulkInputText.split('\n').filter((l) => l.trim()).length} ทีม)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          แถบดำเนินการด้านล่าง (Bottom Action Bar)
         ========================================================================= */}
      <div className="sticky bottom-4 z-20 rounded-2xl bg-white/95 backdrop-blur-md p-4 shadow-lg border border-[#efeded] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs text-[#4b4737]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#006d40] shrink-0 animate-pulse" />
          <span>
            สร้างแล้ว <strong>{groupKeys.length}</strong> กลุ่ม • จัดกลุ่มแล้ว{' '}
            <strong className="text-[#007746]">{assignedCount}</strong> จากทั้งหมด{' '}
            <strong>{teams.length}</strong> ทีม
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onProceedToFixtures) {
              onProceedToFixtures();
            }
            setSuccessToast('บันทึกข้อมูลเรียบร้อยแล้ว');
            setTimeout(() => setSuccessToast(null), 3000);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#ffe680] hover:bg-[#fbe27c] active:scale-95 text-[#786607] font-display font-bold text-sm shadow-sm transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>บันทึก</span>
        </button>
      </div>
    </div>
  );
};
