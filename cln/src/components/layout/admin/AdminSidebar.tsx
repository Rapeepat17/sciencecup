import React from 'react';
import { ActiveView } from '../../../types';
import {
  LayoutDashboard,
  Layers,
  CalendarDays,
  Award,
  GitFork,
  Users,
  Settings,
  Trophy,
  Eye,
  ExternalLink,
  LogOut,
  PlusCircle,
} from 'lucide-react';

export interface AdminSidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  tournamentName?: string;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  // Legacy alias compatibility
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  onSwitchToUser?: () => void;
  onAdminLogout?: () => void;
  teamsCount?: number;
  isUserPortalEnabled?: boolean;
  version?: string;
  onSwitchTournament?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeView,
  setActiveView,
  tournamentName,
  isOpen = true,
  setIsOpen,
  isMobileOpen,
  setIsMobileOpen,
  onSwitchToUser,
  onAdminLogout,
  teamsCount = 11,
  isUserPortalEnabled = true,
  onSwitchTournament,
}) => {
  // Use isOpen if provided, fallback to isMobileOpen or true
  const effectiveIsOpen = isOpen ?? isMobileOpen ?? true;

  const handleClose = () => {
    if (setIsOpen) setIsOpen(false);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const handleNavClick = (viewId: ActiveView) => {
    setActiveView(viewId);
    // On mobile screens, close sidebar upon selection
    if (window.innerWidth < 1024) {
      handleClose();
    }
  };

  const tournamentItems = [
    {
      id: 'teams' as ActiveView,
      label: 'สร้างและจัดการทีม',
      icon: Users,
    },
    {
      id: 'groups' as ActiveView,
      label: 'จัดกลุ่มการแข่งขัน',
      icon: Layers,
    },
    {
      id: 'matches' as ActiveView,
      label: 'ตารางการแข่งขัน',
      icon: CalendarDays,
    },
    {
      id: 'standings' as ActiveView,
      label: 'ตารางคะแนน',
      icon: Award,
    },
    {
      id: 'bracket' as ActiveView,
      label: 'สายแข่งน็อคเอาท์',
      icon: GitFork,
    },
  ];

  const managementItems = [
    {
      id: 'settings' as ActiveView,
      label: 'ตั้งค่าการแข่งขัน',
      icon: Settings,
    },
  ];

  const isItemActive = (id: ActiveView) => {
    if (activeView === id) return true;
    if (id === 'tournaments' && (activeView === 'tournament-hub' || activeView === 'tournaments')) return true;
    if (id === 'groups' && activeView === 'tournament-setup-and-groups') return true;
    if (id === 'matches' && activeView === 'matches-and-fixtures') return true;
    if (id === 'standings' && activeView === 'standings-and-leaderboard') return true;
    if (id === 'settings' && activeView === 'tournament-settings') return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {effectiveIsOpen && (
        <div
          className="fixed inset-0 top-16 bg-black/40 z-30 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={handleClose}
        />
      )}

      {/* Main Admin Sidebar - Positioned under Top Header (top-16) */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 bg-white z-30 flex flex-col justify-between border-r border-[#efeded] shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-200 ease-in-out ${
          effectiveIsOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Navigation Section (No duplicated logo) */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* หน้าที่ 1: การ์ดทัวร์นาเมนต์ (คลิกเลือกทัวร์นาเมนต์) */}
            <button
              type="button"
              onClick={() => handleNavClick('tournaments')}
              className={`w-full p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs text-left ${
                isItemActive('tournaments')
                  ? 'bg-[#ffe680] border-[#ffe680] shadow-xs'
                  : 'bg-[#f4f4f5] border-gray-200/60 hover:bg-[#efeded]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    tournamentName && tournamentName.trim()
                      ? 'bg-[#10b981]'
                      : 'bg-gray-300'
                  }`}
                />
                <span
                  className={`text-xs font-bold truncate ${
                    isItemActive('tournaments') ? 'text-[#786607]' : 'text-[#1b1c1c]'
                  } ${!tournamentName || !tournamentName.trim() ? 'italic opacity-70' : ''}`}
                >
                  {tournamentName && tournamentName.trim()
                    ? tournamentName
                    : 'ไม่มีทัวร์นาเมนต์'}
                </span>
              </div>
              {tournamentName && tournamentName.trim() ? (
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${
                    isItemActive('tournaments')
                      ? 'bg-white text-[#786607]'
                      : 'bg-[#ffe680] text-[#786607]'
                  }`}
                >
                  Active
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 bg-white/70 text-gray-500">
                  ไม่มี
                </span>
              )}
            </button>

            {/* หน้าที่ 2: แดชบอร์ดภาพรวม */}
            <button
              type="button"
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer shadow-2xs ${
                activeView === 'dashboard'
                  ? 'bg-[#ffe680] text-[#1b1c1c] hover:bg-[#fedd55]'
                  : 'text-[#4b4737] hover:bg-[#f5f3f3] hover:text-[#1b1c1c]'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0 text-[#1b1c1c]" />
              <span className="truncate">แดชบอร์ดภาพรวม</span>
            </button>

            {/* หน้าที่ 3: สร้างทัวร์นาเมนต์ */}
            <button
              type="button"
              onClick={() => handleNavClick('create-tournament')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                activeView === 'create-tournament'
                  ? 'bg-[#ffe680] text-[#786607] font-bold shadow-2xs'
                  : 'text-[#1b1c1c] hover:bg-[#f5f3f3] font-medium'
              }`}
            >
              <PlusCircle className="w-5 h-5 shrink-0 text-[#4b4737]" />
              <span className="truncate">สร้างทัวร์นาเมนต์</span>
            </button>

            {/* Category: Tournament */}
            <div>
              <div className="flex items-center justify-between px-3 pt-2 pb-2">
                <span className="text-xs font-semibold text-[#4b4737]">
                  ทัวร์นาเมนต์
                </span>
                <Trophy className="w-4 h-4 text-[#4b4737]" />
              </div>
              <div className="space-y-1">
                {tournamentItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#ffe680] text-[#786607] font-bold shadow-2xs'
                          : 'text-[#1b1c1c] hover:bg-[#f5f3f3] font-medium'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0 text-[#4b4737]" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category: Management */}
            <div>
              <div className="flex items-center justify-between px-3 pt-2 pb-2">
                <span className="text-xs font-semibold text-[#4b4737]">
                  การจัดการ
                </span>
              </div>
              <div className="space-y-1">
                {managementItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#ffe680] text-[#786607] font-bold shadow-2xs'
                          : 'text-[#1b1c1c] hover:bg-[#f5f3f3] font-medium'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0 text-[#4b4737]" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Public Spectator (User View) Card */}
            {onSwitchToUser && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onSwitchToUser();
                    if (window.innerWidth < 1024) handleClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer group shadow-2xs ${
                    isUserPortalEnabled
                      ? 'bg-gradient-to-r from-[#fef9c3]/70 via-white to-[#dcfce7]/60 border-[#ffe680] hover:border-[#facc15]'
                      : 'bg-gray-100 border-gray-300 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform ${
                        isUserPortalEnabled
                          ? 'bg-[#ffe680] text-[#786607]'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1b1c1c] truncate">
                        หน้าผู้ชม (User View)
                      </p>
                      <p className="text-[10px] text-[#4b4737] truncate mt-0.5">
                        {isUserPortalEnabled
                          ? 'ตารางแข่ง • คะแนน • น็อคเอาท์'
                          : 'ปิดการเข้าชมชั่วคราว'}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#10b981] group-hover:text-[#059669] shrink-0 ml-1.5 transition-colors" />
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
                if (window.innerWidth < 1024) handleClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#fff1f2] hover:bg-[#ffe4e6] border border-red-200/80 text-left transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#fee2e2] flex items-center justify-center text-red-600 shrink-0 group-hover:scale-105 transition-transform">
                  <LogOut className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#b91c1c] truncate">
                    ออกจากระบบ <span className="font-extrabold text-[#991b1b]">Admin</span>
                  </p>
                  <p className="text-[10px] text-red-500 truncate mt-0.5">
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
