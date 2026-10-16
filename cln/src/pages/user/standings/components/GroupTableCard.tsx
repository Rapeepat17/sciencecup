import React from 'react';
import { TeamStanding } from '../../../../types';
import { TeamLogo } from '../../../../components/TeamLogo';

export interface GroupTableCardProps {
  groupName: string;
  standings: TeamStanding[];
  onTeamClick?: (teamId: string | number) => void;
}

export const GroupTableCard: React.FC<GroupTableCardProps> = ({
  groupName,
  standings,
  onTeamClick,
}) => {
  // Normalize display name: if "A" -> "กลุ่ม A"
  const displayName = groupName.startsWith('กลุ่ม') || groupName.startsWith('สาย')
    ? groupName
    : `กลุ่ม ${groupName}`;

  return (
    <div className="w-full bg-white rounded-2xl border border-[#efeded] shadow-2xs overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Card Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#f5f3f3]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-1">
            <img
              src="/science_cup_logo.png"
              alt="Tournament Icon"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h3 className="text-base font-bold text-[#1b1c1c] tracking-tight">
            {displayName}
          </h3>
        </div>

        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fffbeb] text-[#b45309] border border-[#fef3c7]">
          รอบแบ่งกลุ่ม
        </span>
      </div>

      {/* Standings Table */}
      <div className="w-full overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#f5f3f3] text-[#7d7765] font-medium bg-[#faf9f8]/60">
              <th className="py-2.5 pl-5 pr-2 w-10 text-center">#</th>
              <th className="py-2.5 px-3 min-w-[140px]">สโมสร</th>
              <th className="py-2.5 px-2 text-center w-10">แข่ง</th>
              <th className="py-2.5 px-2 text-center w-10 text-[#16a34a]">ชนะ</th>
              <th className="py-2.5 px-2 text-center w-10">เสมอ</th>
              <th className="py-2.5 px-2 text-center w-10 text-[#dc2626]">แพ้</th>
              <th className="py-2.5 px-2 text-center w-10">ได้</th>
              <th className="py-2.5 px-2 text-center w-10">เสีย</th>
              <th className="py-2.5 px-2 text-center w-10">+/-</th>
              <th className="py-2.5 px-2 text-center w-12 font-bold text-[#1b1c1c]">แต้ม</th>
              <th className="py-2.5 pr-5 pl-2 text-center w-16">ฟอร์ม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f5f3f3]">
            {standings.map((row, index) => {
              const rank = index + 1;
              const isQualified = rank <= 2;

              return (
                <tr
                  key={row.team?.id || index}
                  onClick={() => row.team?.id && onTeamClick?.(row.team.id)}
                  className="hover:bg-[#fbf9f9] transition-colors cursor-pointer group"
                >
                  {/* Rank Badge */}
                  <td className="py-3 pl-5 pr-2 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${
                        isQualified
                          ? 'bg-[#16a34a] text-white shadow-2xs'
                          : 'bg-[#f3f4f6] text-[#6b7280]'
                      }`}
                    >
                      {rank}
                    </span>
                  </td>

                  {/* Team Info */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <TeamLogo
                        id={row.team?.id}
                        logo={row.team?.logo}
                        name={row.team?.name}
                        className="w-6 h-6"
                      />
                      <span className="font-semibold text-[#1b1c1c] truncate max-w-[150px] group-hover:text-[#6f5d00] transition-colors">
                        {row.team?.name || 'สโมสร'}
                      </span>
                    </div>
                  </td>

                  {/* Played */}
                  <td className="py-3 px-2 text-center text-[#4b4737] font-medium">
                    {row.p}
                  </td>

                  {/* Won */}
                  <td className="py-3 px-2 text-center font-bold text-[#16a34a]">
                    {row.w}
                  </td>

                  {/* Draw */}
                  <td className="py-3 px-2 text-center text-[#4b4737] font-medium">
                    {row.d}
                  </td>

                  {/* Lost */}
                  <td className="py-3 px-2 text-center font-bold text-[#dc2626]">
                    {row.l}
                  </td>

                  {/* GF */}
                  <td className="py-3 px-2 text-center text-[#7d7765]">
                    {row.gf}
                  </td>

                  {/* GA */}
                  <td className="py-3 px-2 text-center text-[#7d7765]">
                    {row.ga}
                  </td>

                  {/* GD */}
                  <td className="py-3 px-2 text-center text-[#7d7765]">
                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                  </td>

                  {/* Points */}
                  <td className="py-3 px-2 text-center font-extrabold text-[#16a34a] text-sm">
                    {row.pts}
                  </td>

                  {/* Form */}
                  <td className="py-3 pr-5 pl-2 text-center text-[#7d7765]">
                    {row.form && row.form.length > 0 ? (
                      <div className="inline-flex items-center gap-1 justify-center">
                        {row.form.map((res, i) => (
                          <span
                            key={i}
                            className={`w-4 h-4 rounded-full text-[9px] font-bold inline-flex items-center justify-center text-white ${
                              res === 'W'
                                ? 'bg-[#16a34a]'
                                : res === 'D'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                          >
                            {res}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#a8a29e]">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
