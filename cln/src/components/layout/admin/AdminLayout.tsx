import React, { useState } from 'react';
import { AdminHeader, AdminHeaderProps } from './AdminHeader';
import { AdminSidebar, AdminSidebarProps } from './AdminSidebar';
import { ActiveView } from '../../../types';

export interface AdminLayoutProps {
  children: React.ReactNode;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  tournamentName: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSwitchToUser?: () => void;
  onAdminLogout?: () => void;
  onSwitchTournament?: () => void;
  teamsCount?: number;
  isUserPortalEnabled?: boolean;
  version?: string;
  headerProps?: Partial<AdminHeaderProps>;
  sidebarProps?: Partial<AdminSidebarProps>;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeView,
  setActiveView,
  tournamentName,
  searchQuery,
  setSearchQuery,
  onSwitchToUser,
  onAdminLogout,
  onSwitchTournament,
  teamsCount,
  isUserPortalEnabled = true,
  version = 'v2.6',
  headerProps,
  sidebarProps,
}) => {
  // Sidebar open/collapse state (default open on desktop)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-body">
      {/* 1. Full-Width Top Header (Row spanning entire top) */}
      <AdminHeader
        tournamentName={tournamentName}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSwitchToUser={onSwitchToUser}
        activeView={activeView}
        setActiveView={setActiveView}
        onAdminLogout={onAdminLogout}
        version={version}
        {...headerProps}
      />

      <div className="flex-1 flex min-w-0">
        {/* 2. Admin Sidebar Navigation (Directly below Header) */}
        <AdminSidebar
          activeView={activeView}
          setActiveView={setActiveView}
          tournamentName={tournamentName}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          onSwitchToUser={onSwitchToUser}
          onAdminLogout={onAdminLogout}
          onSwitchTournament={onSwitchTournament}
          teamsCount={teamsCount}
          isUserPortalEnabled={isUserPortalEnabled}
          version={version}
          {...sidebarProps}
        />

        {/* 3. Main Page Content - Automatically adjusts with Sidebar */}
        <div
          className={`flex-1 flex flex-col min-w-0 pt-16 transition-all duration-200 ease-in-out ${
            isSidebarOpen ? 'lg:pl-72' : 'pl-0'
          }`}
        >
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
