import React, { useState, useEffect } from 'react';
import { Settings, Trophy, Check, Save, Lock, User, KeyRound, Eye, ShieldCheck, LogOut, CheckCircle2 } from 'lucide-react';
import { AdminCredentials } from '../types';
import { authService, AuthUser } from '../services/authService';

interface TournamentSettingsViewProps {
  tournamentName: string;
  setTournamentName: (name: string) => void;
  adminCredentials?: AdminCredentials;
  setAdminCredentials?: (creds: AdminCredentials) => void;
  isUserPortalEnabled?: boolean;
  setIsUserPortalEnabled?: (enabled: boolean) => void;
  onSaveSettings?: (name: string, creds: AdminCredentials, isUserPortalEnabled: boolean) => void;
  onAdminLogout?: () => void;
}

export const TournamentSettingsView: React.FC<TournamentSettingsViewProps> = ({
  tournamentName,
  setTournamentName,
  adminCredentials = { username: 'admin', passwordHash: '******' },
  setAdminCredentials,
  isUserPortalEnabled = true,
  setIsUserPortalEnabled,
  onSaveSettings,
  onAdminLogout,
}) => {
  const [name, setName] = useState(tournamentName);
  const [userPortalOpen, setUserPortalOpen] = useState(isUserPortalEnabled);
  const [saved, setSaved] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCachedUser());

  useEffect(() => {
    setName(tournamentName);
  }, [tournamentName]);

  useEffect(() => {
    setUserPortalOpen(isUserPortalEnabled);
  }, [isUserPortalEnabled]);

  useEffect(() => {
    const user = authService.getCachedUser();
    setCurrentUser(user);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name || 'SCI CUP 2026';

    setTournamentName(finalName);
    if (setIsUserPortalEnabled) {
      setIsUserPortalEnabled(userPortalOpen);
    }
    if (onSaveSettings) {
      onSaveSettings(finalName, adminCredentials, userPortalOpen);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="rounded-3xl bg-white p-6 lg:p-8 shadow-xs border border-[#efeded] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#6f5d00] text-xs font-bold uppercase mb-1">
            <Settings className="w-4 h-4" />
            <span>กติกาและระเบียบการแข่งขัน</span>
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-[#1b1c1c]">
            ตั้งค่าการแข่งขัน (Tournament Settings)
          </h1>
          <p className="text-sm text-[#4b4737] mt-1">
            กำหนดข้อมูลหลักของทัวร์นาเมนต์ และตรวจสอบสิทธิ์ผู้ดูแลระบบผ่าน Supabase Auth
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="rounded-3xl bg-white p-6 lg:p-8 shadow-xs border border-[#efeded] space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase font-bold text-[#4b4737] block mb-1.5">
              ชื่อทัวร์นาเมนต์อย่างเป็นทางการ
            </label>
            <div className="relative">
              <Trophy className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#6f5d00]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-[#f5f3f3] border border-[#efeded] text-sm text-[#1b1c1c] font-semibold focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
              />
            </div>
          </div>

          {/* Supabase Auth Security Box */}
          <div className="p-5 bg-gradient-to-br from-[#fcfbf7] to-[#f7f5ed] rounded-2xl border border-[#ede9dc] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-xs uppercase text-[#1b1c1c] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#006d40]" />
                <span>การยืนยันตัวตนผู้ดูแลระบบ (Supabase Auth Security)</span>
              </h4>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                JWT Token Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-white rounded-xl border border-[#efeded] shadow-2xs">
                <span className="text-[11px] font-bold text-[#6f5d00] block mb-1">
                  บัญชีผู้ดูแลระบบที่ล็อกอินอยู่
                </span>
                <p className="font-semibold text-sm text-[#1b1c1c] truncate">
                  {currentUser?.email || 'admin@scicup.local'}
                </p>
                <p className="text-[11px] text-[#786607] mt-0.5">
                  บทบาท: <span className="font-bold uppercase">{currentUser?.role || 'ADMIN'}</span>
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#efeded] shadow-2xs">
                <span className="text-[11px] font-bold text-[#6f5d00] block mb-1">
                  มาตรฐานความปลอดภัย (RBAC & RLS)
                </span>
                <p className="text-xs text-[#4b4737] leading-relaxed">
                  Backend API ตรวจสอบสิทธิ์ผ่าน JSON Web Token ทุก Request โดยไม่เก็บรหัสผ่านเป็น Plain Text
                </p>
              </div>
            </div>

            {onAdminLogout && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onAdminLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ออกจากระบบ Admin</span>
                </button>
              </div>
            )}
          </div>

          {/* User Portal Access Control */}
          <div className="p-4 bg-[#f5f3f3] rounded-2xl border border-[#efeded] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-display font-bold text-xs uppercase text-[#1b1c1c] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#786607]" />
                  <span>การเข้าถึงหน้าผู้ชม (User View / Public Portal)</span>
                </h4>
                <p className="text-xs text-[#4b4737] mt-1">
                  {userPortalOpen
                    ? 'เปิดให้บุคคลทั่วไปและผู้ชมเข้าดูตารางการแข่งขัน ผลคะแนน และสายการแข่งขันได้'
                    : 'ปิดการแสดงผลหน้าผู้ชม (เมื่อปิด ผู้ชมทั่วไปจะเห็นข้อความ "ไม่มีโปรแกรมการแข่งขัน")'}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 self-start sm:self-center">
                <input
                  type="checkbox"
                  checked={userPortalOpen}
                  onChange={(e) => setUserPortalOpen(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#006d40]"></div>
                <span className={`ml-2 text-xs font-semibold w-8 inline-block text-center select-none ${userPortalOpen ? 'text-[#006d40]' : 'text-gray-500'}`}>
                  {userPortalOpen ? 'เปิด' : 'ปิด'}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#efeded] flex items-center justify-end gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#ffe680] hover:bg-[#fbe27c] text-[#786607] font-display font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-[#006d40]" />
                <span>บันทึกเรียบร้อย!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>บันทึกการตั้งค่า</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
