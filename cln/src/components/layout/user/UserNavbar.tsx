import React from 'react';
import { Shield } from 'lucide-react';

export interface UserNavbarProps {
  title?: string;
  subtitle?: string;
  isLive?: boolean;
  logoUrl?: string;
  onAdminClick?: () => void;
}

export const UserNavbar: React.FC<UserNavbarProps> = ({
  title = 'SCIENCE CUP 2026',
  subtitle = 'การแข่งขันฟุตบอลภายในคณะวิทยาศาสตร์',
  isLive = true,
  logoUrl = '/science_cup_logo.png',
  onAdminClick,
}) => {
  return (
    <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
      {/* Logo & Tournament Name */}
      <div className="flex items-center gap-3.5 min-w-0">
        <img
          src={logoUrl}
          alt="Science Cup Logo"
          className="h-12 sm:h-16 w-auto object-contain shrink-0 drop-shadow-xs"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-black text-base sm:text-lg text-[#1b1c1c] truncate">
              {title}
            </h1>
            {isLive && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#95fcbc]/40 text-[#007746] border border-[#007746]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#007746] animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#4b4737] truncate mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: Admin Button */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onAdminClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f5f3f3] hover:bg-[#ffe680] hover:text-[#786607] text-[#4b4737] text-xs font-bold transition-all cursor-pointer border border-[#efeded] shadow-2xs active:scale-95"
        >
          <Shield className="w-3.5 h-3.5 text-[#786607]" />
          <span className="hidden sm:inline">ผู้ดูแลระบบ</span>
        </button>
      </div>
    </div>
  );
};
