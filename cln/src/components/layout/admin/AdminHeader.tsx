import React from 'react';
import { Menu, User } from 'lucide-react';

export interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  onOpenMobileSidebar?: () => void;
  isSidebarOpen?: boolean;
  version?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleSidebar,
  onOpenMobileSidebar,
}) => {
  const handleMenuClick = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else if (onOpenMobileSidebar) {
      onOpenMobileSidebar();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-[#efeded] px-4 md:px-6 flex items-center justify-between shadow-2xs">
      {/* 1. ซ้ายสุด: ปุ่มเมนู 3 ขีด + 2. ถัดมา: โลโก้ SCI CUP อันเดียว */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <button
          type="button"
          onClick={handleMenuClick}
          className="p-2 -ml-1.5 rounded-xl text-[#4b4737] hover:bg-[#efeded] hover:text-[#1b1c1c] transition-colors cursor-pointer"
          aria-label="เปิด-ปิดเมนู"
          title="เปิด-ปิด Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 shrink-0">
          <img
            src="/science_cup_logo.png"
            alt="Science Cup Logo"
            className="h-8 w-auto object-contain shrink-0 drop-shadow-2xs"
          />
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[#1b1c1c]">
            SCI <span className="text-[#786607]">CUP</span>
          </span>
        </div>
      </div>

      {/* 3. ขวาสุด: โปรไฟล์ ผู้อำนวยการจัดการแข่งขัน (Tournament Director) + Avatar วงกลมสีทอง */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="font-display text-sm font-bold leading-tight text-[#1b1c1c]">
            ผู้อำนวยการจัดการแข่งขัน
          </p>
          <p className="text-[11px] text-[#7d7765]">Tournament Director</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#fef7da] border-2 border-[#ffe680] flex items-center justify-center text-[#786607] shadow-2xs shrink-0">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
};
