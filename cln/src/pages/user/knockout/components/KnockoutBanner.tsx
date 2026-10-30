import React from 'react';
import { GitFork } from 'lucide-react';

export interface KnockoutBannerProps {
  tournamentName?: string;
  tagText?: string;
  title?: string;
  subtitle?: string;
}

export const KnockoutBanner: React.FC<KnockoutBannerProps> = ({
  tournamentName,
  tagText,
  title = 'การแข่งขันรอบน็อคเอาท์',
  subtitle,
}) => {
  const displayTagText =
    tagText ||
    (tournamentName
      ? `เส้นทางสู่แชมป์ • ${tournamentName}`
      : 'เส้นทางสู่แชมป์');

  const displaySubtitle =
    subtitle ||
    (tournamentName
      ? `การแข่งขันแบบแพ้คัดออกสู่นัดชิงชนะเลิศ ${tournamentName}`
      : 'การแข่งขันแบบแพ้คัดออกสู่นัดชิงชนะเลิศ');

  return (
    <div className="w-full bg-white rounded-2xl border border-[#efeded] p-5 sm:p-6 shadow-2xs">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fef9c3] text-[#854d0e] border border-[#fef08a] shadow-2xs mb-2">
        <GitFork className="w-3.5 h-3.5 text-[#854d0e]" />
        <span>{displayTagText}</span>
      </div>

      <h1 className="text-xl sm:text-2xl font-black text-[#1b1c1c] tracking-tight">
        {title}
      </h1>

      <p className="text-xs text-[#7d7765] mt-1">
        {displaySubtitle}
      </p>
    </div>
  );
};
