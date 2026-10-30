import React, { useState } from 'react';
import { Trophy, ChevronRight, Shield } from 'lucide-react';
import { GroupStandingItem } from '../../../../services/standingsService';
import { TeamLogo } from '../../../../components/TeamLogo';

interface MiniStandingsWidgetProps {
  groups: Record<string, GroupStandingItem[]>;
  isLoading?: boolean;
  onNavigateToStandings?: () => void;
}

export const MiniStandingsWidget: React.FC<MiniStandingsWidgetProps> = ({
  groups,
  isLoading = false,
  onNavigateToStandings,
}) => {
  const groupNames = Object.keys(groups || {}).sort();
  const [selectedGroup, setSelectedGroup] = useState<string>(
    groupNames[0] || 'A'
  );

  // Sync selected group if groups change
  React.useEffect(() => {
    if (groupNames.length > 0 && !groups[selectedGroup]) {
      setSelectedGroup(groupNames[0]);
    }
  }, [groups, groupNames, selectedGroup]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-[#efeded] p-6 shadow-2xs">
        <div className="flex items-center gap-2.5 border-b border-[#efeded] pb-4 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 animate-pulse" />
          <div className="space-y-1.5 flex-1">
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-44 h-3 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 bg-gray-50 rounded-xl border border-[#efeded] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const currentGroupTeams = (groups && groups[selectedGroup]) || [];

  return (
    <div className="bg-white rounded-2xl border border-[#efeded] p-6 shadow-2xs flex flex-col justify-between">
      <div>
        {/* หัวการ์ด */}
        <div className="flex items-center justify-between border-b border-[#efeded] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-[#1b1c1c]">
                สรุปตารางคะแนนย่อ
              </h2>
              <p className="text-xs text-[#7d7765]">
                อันดับทีมและคะแนนในแต่ละกลุ่ม
              </p>
            </div>
          </div>
          {onNavigateToStandings && (
            <button
              onClick={onNavigateToStandings}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 group"
            >
              ดูตารางเต็ม
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {groupNames.length === 0 ? (
          <div className="border border-dashed border-[#e2dfd5] rounded-xl p-8 text-center bg-[#faf9f6]/50">
            <Trophy className="w-8 h-8 text-[#a8a395] mx-auto mb-2 opacity-60" />
            <h4 className="text-xs font-bold text-[#1b1c1c]">
              ยังไม่มีการจัดกลุ่มการแข่งขัน
            </h4>
            <p className="text-[11px] text-[#7d7765] mt-1 max-w-xs mx-auto">
              เมื่อมีการแบ่งสายและแข่งขัน ข้อมูลตารางคะแนนจะแสดงที่นี่
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* แท็บเลือกกลุ่ม A, B, C, D... */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {groupNames.map((gName) => (
                <button
                  key={gName}
                  onClick={() => setSelectedGroup(gName)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                    selectedGroup === gName
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-[#f8f7f5] text-[#5c5746] hover:bg-[#efece6] border border-[#efeded]'
                  }`}
                >
                  กลุ่ม {gName}
                </button>
              ))}
            </div>

            {/* ตารางย่อ */}
            <div className="border border-[#efeded] rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#faf9f6] text-[#7d7765] border-b border-[#efeded]">
                    <th className="py-2 px-3 text-left font-semibold">อันดับ / ทีม</th>
                    <th className="py-2 px-2 text-center font-semibold w-9">แข่ง</th>
                    <th className="py-2 px-2 text-center font-semibold w-9">+/-</th>
                    <th className="py-2 px-3 text-right font-bold w-12 text-[#1b1c1c]">
                      แต้ม
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#efeded]">
                  {currentGroupTeams.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-[#a8a395] text-xs">
                        ยังไม่มีทีมในกลุ่มนี้
                      </td>
                    </tr>
                  ) : (
                    currentGroupTeams.slice(0, 4).map((team, idx) => {
                      const rank = team.rank || idx + 1;
                      const isTopTwo = rank <= 2;

                      return (
                        <tr
                          key={team.teamId || idx}
                          className={`hover:bg-[#faf9f6]/70 transition-colors ${
                            isTopTwo ? 'bg-emerald-50/20' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-4 text-center font-bold text-xs ${
                                  isTopTwo ? 'text-emerald-700' : 'text-[#7d7765]'
                                }`}
                              >
                                {rank}
                              </span>
                              <TeamLogo
                                id={team.teamId}
                                logo={team.teamLogo || undefined}
                                name={team.teamName}
                                className="w-5 h-5 rounded-md flex-shrink-0"
                              />
                              <span className="font-semibold text-[#1b1c1c] truncate max-w-[140px] block">
                                {team.teamName}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center text-[#5c5746]">
                            {team.played}
                          </td>
                          <td
                            className={`py-2.5 px-2 text-center font-medium ${
                              team.goalDifference > 0
                                ? 'text-emerald-600'
                                : team.goalDifference < 0
                                ? 'text-rose-600'
                                : 'text-[#7d7765]'
                            }`}
                          >
                            {team.goalDifference > 0
                              ? `+${team.goalDifference}`
                              : team.goalDifference}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold font-display text-[#1b1c1c]">
                            {team.points}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Note ใต้ตาราง */}
            <p className="text-[10px] text-[#a8a395] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              อันดับ 1-2 ของกลุ่มจะผ่านเข้าสู่รอบน็อคเอาท์
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

