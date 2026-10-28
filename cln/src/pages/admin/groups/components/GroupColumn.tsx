import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Edit2, X, Check, Users, Plus, ChevronDown, Search } from 'lucide-react';
import { Team } from '../../../../types';
import { TeamLogo } from '../../../../components/TeamLogo';

interface GroupColumnProps {
  groupId?: number | string;
  groupName: string;
  teams: Team[];
  allGroupNames: string[];
  unassignedTeams: Team[];
  onAddTeamToGroup: (teamId: string | number, groupName: string) => void;
  onRemoveFromGroup: (teamId: string | number) => void;
  onMoveTeam: (teamId: string | number, targetGroup: string) => void;
  onDeleteGroup: (groupId?: number | string, groupName?: string) => void;
  onRenameGroup: (oldName: string, newName: string, groupId?: number | string) => void;
  onDropOnGroup: (groupName: string) => void;
}

export const GroupColumn: React.FC<GroupColumnProps> = ({
  groupId,
  groupName,
  teams,
  allGroupNames,
  unassignedTeams,
  onAddTeamToGroup,
  onRemoveFromGroup,
  onMoveTeam,
  onDeleteGroup,
  onRenameGroup,
  onDropOnGroup,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(groupName);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [searchTeamText, setSearchTeamText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    }
    if (isAddMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddMenuOpen]);

  const handleSaveName = () => {
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== groupName) {
      onRenameGroup(groupName, trimmed, groupId);
    }
    setIsEditingName(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDropOnGroup(groupName);
  };

  const filteredUnassigned = unassignedTeams.filter((t) =>
    t.name.toLowerCase().includes(searchTeamText.toLowerCase()) ||
    (t.short_name || t.shortName || '').toLowerCase().includes(searchTeamText.toLowerCase())
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-white rounded-3xl border ${
        isDragOver ? 'border-[#786607] ring-2 ring-[#ffe680] bg-[#fffdf0]' : 'border-[#efeded]'
      } p-4 shadow-xs flex flex-col transition-all min-h-[320px]`}
    >
      {/* Group Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#f4f3ef] mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ffe680] to-[#f5d95b] text-[#594902] font-black font-display text-sm flex items-center justify-center shadow-2xs">
            {groupName.replace(/^Group\s*|^กลุ่ม\s*/i, '').charAt(0) || 'G'}
          </div>

          {isEditingName ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                autoFocus
                className="text-sm font-bold px-2 py-0.5 border border-gray-300 rounded-lg w-28 focus:outline-none focus:border-[#786607]"
              />
              <button
                type="button"
                onClick={handleSaveName}
                className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditedName(groupName);
                  setIsEditingName(false);
                }}
                className="p-1 rounded-md text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-display text-sm font-bold text-[#1b1c1c]">{groupName}</h4>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-all cursor-pointer"
                  title="เปลี่ยนชื่อกลุ่ม"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
              <span className="text-[10px] text-[#7d7765] block font-medium">
                {teams.length} ทีม
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDeleteGroup(groupId, groupName)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
          title="ลบกลุ่มนี้"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Team Cards in Group */}
      <div className="flex-1 space-y-2 mb-3">
        {teams.length === 0 ? (
          <div className="h-full min-h-[140px] border-2 border-dashed border-[#e8e6df] rounded-2xl flex flex-col items-center justify-center p-4 text-center">
            <Users className="w-6 h-6 text-gray-300 mb-1" />
            <p className="text-xs font-semibold text-gray-400">ยังไม่มีทีมในกลุ่มนี้</p>
            <p className="text-[10px] text-gray-400 mt-0.5">กดปุ่ม "+ เพิ่มทีมเข้ากลุ่มนี้" ด้านล่าง</p>
          </div>
        ) : (
          teams.map((team, idx) => (
            <div
              key={team.id}
              className="p-2.5 bg-[#faf9f5] hover:bg-white rounded-2xl border border-[#eceae3] hover:border-[#ffe680] hover:shadow-xs transition-all flex items-center justify-between gap-2 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-5 h-5 rounded-full bg-white border border-gray-200 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <TeamLogo logo={team.logo} name={team.name} className="w-7 h-7 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1b1c1c] truncate">{team.name}</p>
                  <p className="text-[10px] text-[#7d7765] truncate">
                    {team.short_name || team.shortName || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Switch to other group */}
                {allGroupNames.filter((g) => g !== groupName).length > 0 && (
                  <select
                    aria-label={`ย้าย ${team.name} ไปกลุ่มอื่น`}
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        onMoveTeam(team.id, e.target.value);
                      }
                    }}
                    className="text-[10px] font-semibold py-0.5 px-1 bg-white border border-gray-200 rounded text-gray-500 hover:text-gray-800 cursor-pointer focus:outline-none"
                    title="ย้ายไปกลุ่มอื่น"
                  >
                    <option value="" disabled>
                      ย้าย
                    </option>
                    {allGroupNames
                      .filter((g) => g !== groupName)
                      .map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                  </select>
                )}

                {/* Remove team button */}
                <button
                  type="button"
                  onClick={() => onRemoveFromGroup(team.id)}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                  title="นำออกจากกลุ่ม"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Button to add team directly into this group */}
      <div className="relative pt-2 border-t border-[#f4f3ef]" ref={menuRef}>
        <button
          type="button"
          onClick={() => {
            setIsAddMenuOpen(!isAddMenuOpen);
            setSearchTeamText('');
          }}
          disabled={unassignedTeams.length === 0}
          className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-[#f8f7f2] hover:bg-[#ffe680]/30 text-[#594902] border border-[#e5e3dc] hover:border-[#ffe680] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ ใส่ทีมในกลุ่มนี้ ({unassignedTeams.length})</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAddMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu for selecting teams */}
        {isAddMenuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 z-30 max-h-56 flex flex-col animate-fadeIn">
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="ค้นหาทีม..."
                value={searchTeamText}
                onChange={(e) => setSearchTeamText(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#786607]"
              />
            </div>

            <div className="overflow-y-auto space-y-1 flex-1 pr-1">
              {filteredUnassigned.length === 0 ? (
                <div className="text-center py-3 text-[11px] text-gray-400">
                  ไม่พบทีมที่ตรงกับการค้นหา
                </div>
              ) : (
                filteredUnassigned.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onAddTeamToGroup(t.id, groupName);
                      setIsAddMenuOpen(false);
                    }}
                    className="w-full p-1.5 hover:bg-[#ffe680]/20 rounded-xl flex items-center gap-2 text-left transition-all cursor-pointer"
                  >
                    <TeamLogo logo={t.logo} name={t.name} className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-semibold text-gray-800 truncate flex-1">
                      {t.name}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {t.short_name || t.shortName || ''}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
