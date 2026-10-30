import React from 'react';
import { Medal, Trophy, Footprints } from 'lucide-react';

export interface TopScorerItem {
  id: string;
  rank: number;
  name: string;
  number?: string | number;
  teamId?: string;
  teamName: string;
  goals: number;
}

interface TopScorersWidgetProps {
  scorers: TopScorerItem[];
  isLoading?: boolean;
}

export const TopScorersWidget: React.FC<TopScorersWidgetProps> = ({
  scorers,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-[#efeded] p-6 shadow-2xs">
        <div className="flex items-center gap-2.5 border-b border-[#efeded] pb-4 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 animate-pulse" />
          <div className="space-y-1.5 flex-1">
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-44 h-3 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-10 bg-gray-50 rounded-xl border border-[#efeded] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#efeded] p-6 shadow-2xs flex flex-col justify-between">
      <div>
        {/* หัวการ์ด */}
        <div className="flex items-center justify-between border-b border-[#efeded] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <Medal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-[#1b1c1c] flex items-center gap-1.5">
                🥇 อันดับดาวซัลโว (Top Scorers)
              </h2>
              <p className="text-xs text-[#7d7765]">
                ผู้เล่นที่ทำประตูสูงสุดในทัวร์นาเมนต์
              </p>
            </div>
          </div>
        </div>

        {/* รายการดาวซัลโว */}
        {scorers.length === 0 ? (
          <div className="border border-dashed border-[#e2dfd5] rounded-xl p-8 text-center bg-[#faf9f6]/50">
            <Footprints className="w-8 h-8 text-[#a8a395] mx-auto mb-2 opacity-60" />
            <h4 className="text-xs font-bold text-[#1b1c1c]">
              ยังไม่มีข้อมูลการทำประตู
            </h4>
            <p className="text-[11px] text-[#7d7765] mt-1 max-w-xs mx-auto">
              เมื่อมีการบันทึกผลการแข่งขันและผู้ทำประตู อันดับดาวซัลโวจะปรากฏที่นี่โดยอัตโนมัติ
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {scorers.map((scorer, idx) => {
              const rank = scorer.rank || idx + 1;
              const isFirst = rank === 1;
              const isSecond = rank === 2;
              const isThird = rank === 3;

              return (
                <div
                  key={scorer.id || idx}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-colors ${
                    isFirst
                      ? 'bg-amber-50/40 border-amber-200/80'
                      : isSecond
                      ? 'bg-slate-50/60 border-slate-200/80'
                      : isThird
                      ? 'bg-amber-50/20 border-amber-100'
                      : 'bg-white border-[#efeded] hover:bg-[#faf9f6]'
                  }`}
                >
                  {/* อันดับ, เบอร์, ชื่อ และสังกัดทีม */}
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                        isFirst
                          ? 'bg-amber-400 text-white shadow-xs'
                          : isSecond
                          ? 'bg-slate-300 text-slate-800'
                          : isThird
                          ? 'bg-amber-600/70 text-white'
                          : 'bg-[#f4f2ee] text-[#7d7765]'
                      }`}
                    >
                      {rank}
                    </span>

                    <div className="truncate text-xs font-medium text-[#1b1c1c]">
                      {scorer.name && (scorer.name.startsWith('ผู้เล่นหมายเลข') || scorer.name.startsWith('เบอร์')) ? (
                        <span className="font-bold text-[#1b1c1c] mr-1.5">
                          {scorer.name.startsWith('เบอร์')
                            ? `ผู้เล่นหมายเลข ${scorer.name.replace('เบอร์', '').trim()}`
                            : scorer.name}
                        </span>
                      ) : (
                        <>
                          {scorer.number && (
                            <span className="text-[#7d7765] font-semibold mr-1.5">
                              [เบอร์ {scorer.number}]
                            </span>
                          )}
                          <span className="font-bold text-[#1b1c1c] mr-1.5">
                            {scorer.name || (scorer.number ? `ผู้เล่นหมายเลข ${scorer.number}` : 'ผู้เล่นไม่ระบุชื่อ')}
                          </span>
                        </>
                      )}
                      <span className="text-[11px] text-[#7d7765]">
                        ({scorer.teamName})
                      </span>
                    </div>
                  </div>

                  {/* จำนวนประตู */}
                  <div className="flex-shrink-0 text-right">
                    <span className="text-xs font-bold font-display text-[#786607] bg-[#ffe680]/30 px-2.5 py-1 rounded-lg border border-[#ffe680]">
                      {scorer.goals}{' '}
                      <span className="text-[10px] font-normal text-[#5c5746]">
                        ประตู
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

