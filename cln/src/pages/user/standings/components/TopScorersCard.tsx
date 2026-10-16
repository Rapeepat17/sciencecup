import React from 'react';
import { TopScorer } from '../../../../types';
import { SoccerBall } from '../../../../components/icons/SoccerBall';

export interface TopScorersCardProps {
  topScorers: TopScorer[];
}

export const TopScorersCard: React.FC<TopScorersCardProps> = ({ topScorers }) => {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#efeded] shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#efeded] gap-3">
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

      {/* Top Scorers Grid or Empty State */}
      {topScorers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topScorers.map((scorer) => {
            const isRank1 = scorer.rank === 1;
            const isRank2 = scorer.rank === 2;
            const isRank3 = scorer.rank === 3;

            return (
              <div
                key={scorer.id}
                className={`p-4 rounded-3xl border transition-all duration-200 flex items-center gap-3.5 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 ${
                  isRank1
                    ? 'bg-blue-50/60 border-2 border-blue-400/90 hover:bg-blue-50/80 shadow-sm'
                    : isRank2
                    ? 'bg-blue-50/35 border border-blue-300/80 hover:bg-blue-50/60'
                    : isRank3
                    ? 'bg-blue-50/15 border border-blue-200/70 hover:bg-blue-50/40'
                    : 'bg-white border-[#efeded] hover:bg-[#faf9f8]'
                }`}
              >
                {/* Rank Badge */}
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-display font-black text-sm shrink-0 shadow-xs ${
                    isRank1
                      ? 'bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 text-white border border-blue-600 shadow-blue-900/30 ring-1 ring-blue-400/30'
                      : isRank2
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white border border-blue-400 shadow-blue-500/20'
                      : isRank3
                      ? 'bg-gradient-to-br from-sky-400 to-blue-400 text-white border border-sky-300 shadow-sky-400/20'
                      : 'bg-zinc-100 text-zinc-600 border border-zinc-200/80'
                  }`}
                >
                  #{scorer.rank}
                </div>

                {/* Player & Team Info */}
                <div className="min-w-0 flex-1">
                  <p className="font-display font-extrabold text-base text-[#1b1c1c] truncate">
                    {scorer.name}
                  </p>
                  <p className="text-xs text-[#716e68] truncate font-medium">
                    {scorer.teamName}
                  </p>
                  <span className="inline-block text-[10px] font-semibold text-zinc-600 bg-white px-2 py-0.5 rounded-lg border border-[#efeded] mt-1 shadow-2xs">
                    เบอร์ {scorer.number}
                  </span>
                </div>

                {/* Goal Count */}
                <div className="shrink-0 flex flex-col items-center justify-center min-w-[36px] text-center">
                  <span
                    className={`font-display font-black text-lg sm:text-xl leading-tight text-center ${
                      isRank1
                        ? 'text-blue-950'
                        : isRank2
                        ? 'text-blue-800'
                        : isRank3
                        ? 'text-blue-700'
                        : 'text-[#1b1c1c]'
                    }`}
                  >
                    {scorer.goals}
                  </span>
                  <span className="text-[10px] text-[#716e68] font-bold text-center">
                    ประตู
                  </span>
                </div>
              </div>
            );
          })}
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
