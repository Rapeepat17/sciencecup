import React, { useState } from 'react';
import { Search, Trophy, Bell, Menu, User } from 'lucide-react';
import { ActiveView } from '../types';

interface HeaderProps {
  tournamentName: string;
  onSelectTournament?: (name: string) => void;
  onOpenMobileSidebar: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSwitchToUser?: () => void;
  activeView?: ActiveView;
  setActiveView?: (view: ActiveView) => void;
  dbStatus?: string;
  isAdminLoggedIn?: boolean;
  onOpenAdminLogin?: () => void;
  onAdminLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tournamentName,
  onOpenMobileSidebar,
  searchQuery,
  setSearchQuery,
  onSwitchToUser,
  onAdminLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-[#ffffff]/90 backdrop-blur-xl z-40 border-b border-[#efeded] px-4 md:px-8 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Menu & Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl text-[#4b4737] hover:bg-[#efeded] lg:hidden"
          aria-label="เปิดเมนู"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b4737]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาคู่แข่งขัน, ทีม, สนาม หรือผู้เล่น..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-[#f5f3f3] text-[#1b1c1c] placeholder:text-[#4b4737] text-sm focus:outline-none focus:ring-2 focus:ring-[#ffe680] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#4b4737] hover:text-[#1b1c1c] bg-[#efeded] rounded-full w-4 h-4 flex items-center justify-center"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-2.5">

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="การแจ้งเตือน"
            className="relative p-2 rounded-full hover:bg-[#efeded] text-[#4b4737] hover:text-[#1b1c1c] transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#6f5d00] ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#efeded] p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-[#efeded]">
                <h4 className="text-xs font-bold text-[#1b1c1c]">การแจ้งเตือนล่าสุด</h4>
              </div>
              <div className="py-4 text-center text-xs text-[#4b4737]">
                ไม่มีการแจ้งเตือนในขณะนี้
              </div>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-3 pl-2 border-l border-[#efeded]">
          <div className="text-right hidden md:block">
            <p className="font-display text-sm font-bold leading-tight text-[#1b1c1c]">
              ผู้อำนวยการจัดการแข่งขัน
            </p>
            <p className="text-xs text-[#4b4737]">Tournament Director</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#fef7da] border-2 border-[#ffe680] flex items-center justify-center text-[#786607] shadow-xs">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};
