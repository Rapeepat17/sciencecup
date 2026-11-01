import React from 'react';
import { TopScorer } from '../../../../types';
import { SoccerBall } from '../../../../components/icons/SoccerBall';
import { TeamLogo } from '../../../../components/TeamLogo';

export interface TopScorersCardProps {
  topScorers: TopScorer[];
}

export const TopScorersCard: React.FC<TopScorersCardProps> = ({ topScorers }) => {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#efeded] shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-[#efeded] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 flex items-center justify-center font-bold shadow-xs border border-amber-400/40">
            <SoccerBall className="w-5 h-5 text-amber-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-lg text-[#1b1c1c]">
                อันดับดาวซัลโวประจำทัวร์นาเมนต์
              </h3>
            </div>
            <p className="text-xs text-[#716e68]">
              รวมสถิติการทำประตูของผู้เล่นทุกคน
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard Table (แบบ A) */}
      {topScorers.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-[#efeded]">
          {/* Table Header (Desktop) */}
          <div className="hidden sm:grid sm:grid-cols-12 items-center px-5 py-3 bg-[#faf9f8] border-b border-[#efeded] text-xs font-bold text-[#716e68] tracking-wider uppercase">
            <div className="col-span-1 text-center">อันดับ</div>
            <div className="col-span-6">ผู้เล่น</div>
            <div className="col-span-3">สโมสร</div>
            <div className="col-span-2 text-right pr-2">ประตู</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#efeded]/70">
            {topScorers.map((scorer) => {
              const isRank1 = scorer.rank === 1;
              const isRank2 = scorer.rank === 2;
              const isRank3 = scorer.rank === 3;

              return (
                <div
                  key={scorer.id}
                  className={`flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center px-4 sm:px-5 py-3.5 gap-2.5 sm:gap-0 transition-colors duration-150 ${
                    isRank1
                      ? 'bg-blue-50/40 hover:bg-blue-50/60'
                      : isRank2
                      ? 'bg-blue-50/20 hover:bg-blue-50/40'
                      : isRank3
                      ? 'bg-blue-50/10 hover:bg-blue-50/25'
                      : 'bg-white hover:bg-[#faf9f8]'
                  }`}
                >
                  {/* Rank & Mobile Top Row */}
                  <div className="w-full sm:w-auto flex items-center justify-between sm:justify-center sm:col-span-1">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-display font-black text-xs shrink-0 shadow-2xs ${
                        isRank1
                          ? 'bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 text-white border border-blue-600 shadow-blue-900/20 ring-1 ring-blue-400/30'
                          : isRank2
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white border border-blue-400 shadow-blue-500/20'
                          : isRank3
                          ? 'bg-gradient-to-br from-sky-400 to-blue-400 text-white border border-sky-300 shadow-sky-400/20'
                          : 'bg-[#f5f3f3] text-zinc-600 border border-zinc-200/70'
                      }`}
                    >
                      #{scorer.rank}
                    </div>

                    {/* Mobile Only: Goals badge on top right */}
                    <div className="sm:hidden flex items-baseline gap-1">
                      <span className="font-display font-black text-lg text-blue-950">
                        {scorer.goals}
                      </span>
                      <span className="text-[11px] font-semibold text-[#716e68]">
                        ประตู
                      </span>
                    </div>
                  </div>

                  {/* Player Info */}
                  <div className="w-full sm:w-auto flex items-center gap-3 sm:col-span-6 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-100/80 text-blue-900 border border-blue-200 flex items-center justify-center font-display font-black text-xs sm:text-sm shrink-0 shadow-2xs">
                      {scorer.number ? scorer.number : (scorer.initials || '-')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-extrabold text-sm sm:text-base text-[#1b1c1c] truncate">
                        {scorer.name}
                      </p>
                      {/* Mobile Only: Team line under player name */}
                      <div className="sm:hidden flex items-center gap-1.5 mt-0.5 text-xs text-[#716e68]">
                        <TeamLogo
                          id={scorer.teamId}
                          logo={scorer.teamLogo}
                          name={scorer.teamName}
                          className="w-4 h-4"
                        />
                        <span className="truncate">{scorer.teamName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Team Info (Desktop) */}
                  <div className="hidden sm:flex items-center gap-2 sm:col-span-3 min-w-0">
                    <TeamLogo
                      id={scorer.teamId}
                      logo={scorer.teamLogo}
                      name={scorer.teamName}
                      className="w-6 h-6"
                    />
                    <span className="text-xs sm:text-sm font-medium text-[#1b1c1c] truncate">
                      {scorer.teamName}
                    </span>
                  </div>

                  {/* Goal Count (Desktop) */}
                  <div className="hidden sm:flex items-center justify-end sm:col-span-2 text-right pr-2">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`font-display font-black text-lg sm:text-xl ${
                          isRank1
                            ? 'text-blue-950 font-black'
                            : isRank2
                            ? 'text-blue-900 font-extrabold'
                            : isRank3
                            ? 'text-blue-800 font-extrabold'
                            : 'text-[#1b1c1c]'
                        }`}
                      >
                        {scorer.goals}
                      </span>
                      <span className="text-xs text-[#716e68] font-medium">
                        ประตู
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-10 px-4 text-center bg-[#faf9f8] rounded-2xl border border-dashed border-[#efeded]">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center text-xl">
            <SoccerBall className="w-6 h-6 text-amber-700" />
          </div>
          <h4 className="font-display font-bold text-sm text-[#1b1c1c]">
            ยังไม่มีผู้ทำประตูในขณะนี้
          </h4>
        </div>
      )}
    </div>
  );
};

export default TopScorersCard;
