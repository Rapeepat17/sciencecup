import React from 'react';
import { Trophy } from 'lucide-react';
import { GroupStandingItem } from '../../../../services/standingsService';

interface AdminGroupStandingCardProps {
  groupName: string;
  standings: GroupStandingItem[];
}

export const AdminGroupStandingCard: React.FC<AdminGroupStandingCardProps> = ({
  groupName,
  standings,
}) => {
  const displayName =
    groupName.startsWith('กลุ่ม') ||
    groupName.startsWith('สาย') ||
    groupName.startsWith('Group')
      ? groupName
      : `กลุ่ม ${groupName}`;

  return (
    <div className="bg-white rounded-3xl border border-[#efeded] shadow-xs overflow-hidden flex flex-col">
      {/* Card Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-[#f5f3f3] bg-[#fcfbf9]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1b1c1c] text-[#ffe680] flex items-center justify-center font-display font-black text-xs shadow-2xs">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-[#1b1c1c] tracking-tight">
              {displayName}
            </h3>
            <p className="text-[11px] text-[#7d7765] font-medium">
              ทั้งหมด {standings.length} ทีม
            </p>
          </div>
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-[#ffe680]/40 text-[#786607] border border-[#ffe680]">
          รอบแบ่งกลุ่ม
        </span>
      </div>

      {/* Standings Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#f5f3f3] text-[#7d7765] font-bold bg-[#faf9f8]/70">
              <th className="py-3 pl-5 pr-2 w-10 text-center">#</th>
              <th className="py-3 px-3 min-w-[150px]">ทีม</th>
              <th className="py-3 px-2 text-center w-10">แข่ง</th>
              <th className="py-3 px-2 text-center w-10 text-emerald-600">ชนะ</th>
              <th className="py-3 px-2 text-center w-10">เสมอ</th>
              <th className="py-3 px-2 text-center w-10 text-rose-600">แพ้</th>
              <th className="py-3 px-2 text-center w-10">ได้</th>
              <th className="py-3 px-2 text-center w-10">เสีย</th>
              <th className="py-3 px-2 text-center w-12">+/-</th>
              <th className="py-3 px-2 text-center w-12 font-extrabold text-[#1b1c1c]">
                แต้ม
              </th>
              <th className="py-3 pr-5 pl-2 text-center w-24">ฟอร์ม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f5f3f3]">
            {standings.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-xs text-[#7d7765]">
                  ยังไม่มีทีมในกลุ่มนี้
                </td>
              </tr>
            ) : (
              standings.map((row, idx) => {
                const rank = row.rank || idx + 1;
                const isQualified = row.isQualified ?? rank <= 2;

                return (
                  <tr
                    key={row.teamId}
                    className={`transition-colors ${
                      isQualified ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-[#fbf9f9]'
                    }`}
                  >
                    <td className="py-3 pl-5 pr-2 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-black ${
                          isQualified
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-[#f3f4f6] text-[#6b7280]'
                        }`}
                      >
                        {rank}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        {row.teamLogo ? (
                          <img
                            src={row.teamLogo}
                            alt={row.teamName}
                            className="w-7 h-7 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 shrink-0">
                            {(row.shortName || row.teamName || 'TM').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-[#1b1c1c] truncate max-w-[160px]">
                          {row.teamName}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-2 text-center text-[#4b4737] font-semibold">
                      {row.played}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-emerald-600">
                      {row.won}
                    </td>
                    <td className="py-3 px-2 text-center text-[#4b4737] font-semibold">
                      {row.drawn}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-rose-600">
                      {row.lost}
                    </td>
                    <td className="py-3 px-2 text-center text-[#7d7765] font-medium">
                      {row.goalsFor}
                    </td>
                    <td className="py-3 px-2 text-center text-[#7d7765] font-medium">
                      {row.goalsAgainst}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-[#4b4737]">
                      {row.goalDifference > 0
                        ? `+${row.goalDifference}`
                        : row.goalDifference}
                    </td>
                    <td className="py-3 px-2 text-center font-black text-emerald-700 text-sm">
                      {row.points}
                    </td>
                    <td className="py-3 pr-5 pl-2 text-center">
                      {row.form && row.form.length > 0 ? (
                        <div className="inline-flex items-center gap-1 justify-center">
                          {row.form.map((res, i) => (
                            <span
                              key={i}
                              className={`w-4 h-4 rounded-full text-[9px] font-black inline-flex items-center justify-center text-white ${
                                res === 'W'
                                  ? 'bg-emerald-600'
                                  : res === 'D'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
