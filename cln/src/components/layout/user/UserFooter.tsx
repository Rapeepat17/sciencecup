import React from 'react';

export interface UserFooterProps {
  tournamentName?: string;
  onAdminClick?: () => void;
}

export const UserFooter: React.FC<UserFooterProps> = ({
  tournamentName = 'SCIENCE CUP 2026',
  onAdminClick,
}) => {
  return (
    <footer className="bg-white border-t border-[#efeded] py-6 px-4 sm:px-6 lg:px-8 text-center text-xs text-[#4b4737] mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© {tournamentName} • ระบบจัดการแข่งขันฟุตบอล</p>
        <button
          type="button"
          onClick={onAdminClick}
          className="text-[#6f5d00] hover:underline font-semibold cursor-pointer transition-colors"
        >
          เข้าสู่ระบบผู้ดูแลการแข่งขัน (Admin Login)
        </button>
      </div>
    </footer>
  );
};
