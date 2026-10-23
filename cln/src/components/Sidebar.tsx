import React from 'react';
import { ActiveView } from '../types';
import {
  LayoutDashboard,
  Layers,
  CalendarDays,
  Award,
  GitFork,
  Users,
  Settings,
  Radio,
  Trophy,
  Eye,
  ExternalLink,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  tournamentName: string;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  onSwitchToUser?: () => void;
  onAdminLogout?: () => void;
  teamsCount?: number;
  isUserPortalEnabled?: boolean;
  onSwitchTournament?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  tournamentName,
  isMobileOpen,
  setIsMobileOpen,
  onSwitchToUser,
  onAdminLogout,
  teamsCount,
  isUserPortalEnabled = true,
  onSwitchTournament,
}) => {
  const navItems = [
    {
      id: 'tournament-hub' as ActiveView,
      label: 'รวมรายการแข่งขัน (Hub)',
      icon: Trophy,
      category: 'hub',
    },
    {
      id: 'dashboard' as ActiveView,
      label: 'แดชบอร์ดรายการนี้',
      icon: LayoutDashboard,
      category: 'main',
    },
    {
      id: 'tournament-setup-and-groups' as ActiveView,
      label: 'สร้างทีมและจัดกลุ่ม',
      icon: Layers,
      category: 'tournament',
    },
    {
      id: 'matches-and-fixtures' as ActiveView,
      label: 'ตารางการแข่งขัน',
      icon: CalendarDays,
      category: 'tournament',
    },
    {
      id: 'standings-and-leaderboard' as ActiveView,
      label: 'ตารางคะแนน',
      icon: Award,
      category: 'tournament',
    },
    {
      id: 'bracket' as ActiveView,
      label: 'สายแข่งน็อคเอาท์',
      icon: GitFork,
      category: 'tournament',
    },
    {
      id: 'teams' as ActiveView,
      label: teamsCount !== undefined ? `ข้อมูลทีม (${teamsCount} สโมสร)` : 'ข้อมูลทีมและสโมสร',
      icon: Users,
      category: 'management',
    },
    {
      id: 'tournament-settings' as ActiveView,
      label: 'ตั้งค่าการแข่งขัน',
      icon: Settings,
      category: 'management',
    },
  ];

  const handleNavClick = (viewId: ActiveView) => {
    setActiveView(viewId);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-[#ffffff] z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-[#efeded] transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Logo Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-[#f5f3f3]">
            <div className="flex items-center gap-3">
              <img
                src="/science_cup_logo.png"
                alt="Science Cup Logo"
                className="h-10 sm:h-12 w-auto object-contain shrink-0 drop-shadow-xs"
              />
              <span className="font-display text-xl font-bold tracking-tight text-[#1b1c1c]">
                SCI
                <span className="text-[#6f5d00] ml-1">CUP</span>
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffe680]/60 text-[#786607] font-semibold">
              Multi-Tourney
            </span>
          </div>

          {/* Active Tournament Status Pill with Switch Button */}
          <div className="px-4 py-3">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-[#f9f8f6] to-[#f4f2ee] border border-gray-200/80 shadow-2xs">
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                  รายการที่กำลังจัดการ
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (onSwitchTournament) onSwitchTournament();
                    else handleNavClick('tournament-hub');
                  }}
                  className="text-[10px] font-bold text-[#786607] hover:underline cursor-pointer"
                >
                  สลับรายการ ↺
                </button>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    tournamentName && tournamentName.trim()
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-gray-300'
                  }`}
                />
                <span
                  className={`text-xs font-bold truncate ${
                    tournamentName && tournamentName.trim()
                      ? 'text-gray-900'
                      : 'text-gray-400 italic'
                  }`}
                >
                  {tournamentName && tournamentName.trim()
                    ? tournamentName
                    : 'ไม่มีทัวร์นาเมนต์'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-4 py-1 space-y-4">
            {/* Tournament Hub Button */}
            <div className="space-y-1.5">
              <button
                onClick={() => handleNavClick('tournament-hub')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeView === 'tournament-hub'
                    ? 'bg-[#1b1c1c] text-white font-bold shadow-xs'
                    : 'bg-amber-50 text-[#786607] hover:bg-amber-100/70 border border-amber-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-[18px] h-[18px] text-[#786607]" />
                  <span>รวมรายการแข่งขันทั้งหมด</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#786607] font-extrabold border border-amber-200">
                  Hub
                </span>
              </button>
            </div>

            {/* Current Tournament Group Header */}
            <div>
              <div className="flex items-center justify-between px-3 pt-1 pb-1.5">
                <span className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                  ควบคุมการแข่งขันรายการนี้
                </span>
              </div>
              <div className="space-y-1">
                {navItems
                  .filter((item) => item.category === 'main' || item.category === 'tournament')
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#ffe680] text-[#786607] font-bold shadow-xs'
                            : 'text-[#4b4737] hover:bg-[#efeded] hover:text-[#1b1c1c]'
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Management Group */}
            <div>
              <div className="flex items-center justify-between px-3 pt-1 pb-1.5">
                <span className="text-[11px] uppercase tracking-wider text-[#4b4737] font-bold">
                  การจัดการ
                </span>
              </div>
              <div className="space-y-1">
                {navItems
                  .filter((item) => item.category === 'management')
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                          isActive
                            ? 'bg-[#ffe680] text-[#786607] font-bold shadow-xs'
                            : 'text-[#4b4737] hover:bg-[#efeded] hover:text-[#1b1c1c]'
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Public Spectator / User View Shortcut */}
            {onSwitchToUser && (
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    onSwitchToUser();
                    if (setIsMobileOpen) setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left hover:shadow-xs transition-all cursor-pointer group ${
                    isUserPortalEnabled
                      ? 'bg-gradient-to-r from-[#ffe680]/40 via-white to-[#95fcbc]/30 border-[#ffe680]'
                      : 'bg-gray-100 border-gray-300 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                      isUserPortalEnabled ? 'bg-[#ffe680] text-[#786607]' : 'bg-gray-200 text-gray-600'
                    }`}>
                      <Eye className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-[#1b1c1c] truncate">
                          หน้าผู้ชม (User View)
                        </p>
                        {!isUserPortalEnabled && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-red-100 text-red-600 font-bold shrink-0">
                            ปิดอยู่
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#4b4737] truncate">
                        {isUserPortalEnabled ? 'ตารางแข่ง • คะแนน • น็อคเอาท์' : 'ปิดการเข้าชมชั่วคราว'}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#786607] shrink-0 ml-1" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Admin Logout */}
        {onAdminLogout && (
          <div className="p-4 border-t border-[#f5f3f3]">
            <button
              type="button"
              id="btn-admin-logout-sidebar"
              onClick={() => {
                onAdminLogout();
                if (setIsMobileOpen) setIsMobileOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0 group-hover:scale-105 transition-transform">
                  <LogOut className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-red-700 truncate">
                    ออกจากระบบ Admin
                  </p>
                  <p className="text-[10px] text-red-500 truncate">
                    จบเซสชันผู้ดูแลระบบ
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
