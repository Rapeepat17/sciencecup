import React from 'react';
import { UserNavbar, UserNavbarProps } from './UserNavbar';
import { UserTabs, UserTabType } from './UserTabs';
import { UserFooter } from './UserFooter';

export interface UserLayoutProps extends Partial<UserNavbarProps> {
  activeTab: UserTabType;
  onTabChange: (tab: UserTabType) => void;
  children: React.ReactNode;
}

export const UserLayout: React.FC<UserLayoutProps> = ({
  activeTab,
  onTabChange,
  title,
  subtitle,
  isLive,
  logoUrl,
  onAdminClick,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1b1c1c] font-body flex flex-col">
      {/* 1. Public Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#efeded] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <UserNavbar
            title={title}
            subtitle={subtitle}
            isLive={isLive}
            logoUrl={logoUrl}
            onAdminClick={onAdminClick}
          />
          <UserTabs activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      </header>

      {/* 2. Main Page Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* 3. Footer */}
      <UserFooter
        tournamentName={title}
        onAdminClick={onAdminClick}
      />
    </div>
  );
};
