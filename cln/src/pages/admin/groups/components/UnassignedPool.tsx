import React from 'react';
import { Users, Plus, MoveRight, ArrowRight } from 'lucide-react';
import { Team } from '../../../../types';
import { TeamLogo } from '../../../../components/TeamLogo';

interface UnassignedPoolProps {
  teams: Team[];
  groupNames: string[];
  onAssignToGroup: (teamId: string | number, groupName: string) => void;
  onDragStart: (e: React.DragEvent, teamId: string | number) => void;
}

export const UnassignedPool: React.FC<UnassignedPoolProps> = ({
  teams,
  groupNames,
  onAssignToGroup,
  onDragStart,
}) => {
  if (teams.length === 0) {
    return (
      <div className="bg-[#f0fdf4] border border-emerald-200 rounded-3xl p-5 text-center flex items-center justify-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        <p className="text-xs font-bold text-emerald-800">
          ยอดเยี่ยม! จัดทีมครบทุกทีมแล้ว ไม่มีทีมตกค้าง
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#efeded] p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
            {teams.length}
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-[#1b1c1c]">
              ทีมที่ยังไม่ได้จัดกลุ่ม (Unassigned Pool)
            </h3>
            <p className="text-[11px] text-[#7d7765]">
              ลากการ์ดทีมไปวางในกลุ่ม หรือคลิกเลือกกลุ่มปลายทาง
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {teams.map((team) => (
          <div
            key={team.id}
            draggable
            onDragStart={(e) => onDragStart(e, team.id)}
            className="p-3 bg-[#faf9f5] hover:bg-white rounded-2xl border border-[#e8e6df] hover:border-[#ffe680] hover:shadow-md transition-all flex items-center justify-between gap-2.5 cursor-grab active:cursor-grabbing group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <TeamLogo logo={team.logo} name={team.name} className="w-8 h-8 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1b1c1c] truncate">{team.name}</p>
                <p className="text-[10px] text-[#7d7765] truncate">
                  {team.short_name || team.shortName || team.manager || 'ไม่มีชื่อย่อ'}
                </p>
              </div>
            </div>

            {/* Quick dropdown to assign */}
            {groupNames.length > 0 && (
              <select
                aria-label={`เลือกกลุ่มสำหรับ ${team.name}`}
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onAssignToGroup(team.id, e.target.value);
                  }
                }}
                className="text-[11px] font-bold py-1 px-2 bg-white hover:bg-[#ffe680]/30 border border-gray-200 rounded-lg text-gray-700 cursor-pointer focus:outline-none focus:border-[#786607]"
              >
                <option value="" disabled>
                  + ใส่กลุ่ม
                </option>
                {groupNames.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
