import React from 'react';
import { Sparkles, Trophy, Shield, Calendar } from 'lucide-react';

export interface TournamentLivePreviewProps {
  name: string;
  description: string;
  tournamentId: string;
  startDate: string;
}

export const TournamentLivePreview: React.FC<TournamentLivePreviewProps> = ({
  name,
  description,
  tournamentId,
  startDate,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-[#efeded] p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#f5f3f3]">
        <span className="text-xs font-bold text-[#7d7765] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#eab308]" />
          ตัวอย่างการ์ดแบบเรียลไทม์
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f8f9fa] text-[#7d7765] border border-[#efeded]">
          Live Preview
        </span>
      </div>

      <div className="rounded-2xl border-2 border-[#ffe680] bg-[#fefdf5] p-5 shadow-2xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#ffe680] text-[#786607] flex items-center justify-center shrink-0 shadow-2xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-[#1b1c1c] line-clamp-1">
                {name.trim() || 'ชื่อการแข่งขันที่จะแสดง'}
              </h4>
              <p className="text-xs text-[#7d7765] line-clamp-1 mt-0.5">
                {description.trim() || 'คำอธิบายหรือวัตถุประสงค์ของการแข่งขัน'}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            Active
          </span>
        </div>

        <div className="pt-3 border-t border-[#f5f3f3] grid grid-cols-2 gap-2 text-xs text-[#4b4737]">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#786607]" />
            <span className="truncate">
              ID: <code className="font-mono text-[11px] text-[#786607]">{tournamentId || 'auto-id'}</code>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#786607]" />
            <span className="truncate">{startDate || 'ระบุวันที่'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
