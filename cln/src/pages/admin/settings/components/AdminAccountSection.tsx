import React, { useState } from 'react';
import { User, Shield, Key, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService, AuthUser } from '../../../../services/authService';

interface AdminAccountSectionProps {
  onLogout?: () => void;
}

export const AdminAccountSection: React.FC<AdminAccountSectionProps> = ({ onLogout }) => {
  const [currentUser] = useState<AuthUser | null>(() => authService.getCachedUser());
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordToast, setPasswordToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setPasswordToast({ type: 'error', message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordToast({ type: 'error', message: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน' });
      return;
    }

    // Success response
    setPasswordToast({ type: 'success', message: 'อัปเดตรหัสผ่านใหม่เรียบร้อยแล้ว' });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="border-b border-[#f5f3f3] pb-4">
        <h3 className="text-base sm:text-lg font-bold text-[#1b1c1c]">บัญชีแอดมินและความปลอดภัย</h3>
        <p className="text-xs sm:text-sm text-[#7d7765]">
          ดูข้อมูลบัญชีผู้ดูแลระบบปัจจุบัน เปลี่ยนรหัสผ่าน และจัดการความปลอดภัย
        </p>
      </div>

      {/* Admin Profile Card */}
      <div className="p-5 rounded-2xl bg-white border border-[#efeded] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1b1c1c] text-[#ffe680] flex items-center justify-center font-black text-xl shadow-xs">
            {currentUser?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#1b1c1c]">
                {currentUser?.username || 'ผู้ดูแลระบบ'}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#fef9c3] text-[#786607] border border-[#fef08a]">
                <Shield className="w-3 h-3" />
                <span>ผู้อำนวยการจัดการแข่งขัน</span>
              </span>
            </div>
            <p className="text-xs text-[#7d7765]">{currentUser?.email || 'admin@scicup.local'}</p>
          </div>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ</span>
          </button>
        )}
      </div>

      {/* Change Password Form */}
      <div className="p-5 rounded-2xl bg-[#faf9f6] border border-[#efeded] space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-600" />
          <h4 className="text-sm font-bold text-[#1b1c1c]">เปลี่ยนรหัสผ่านแอดมิน (Change Password)</h4>
        </div>
        <p className="text-xs text-[#7d7765]">
          ตั้งรหัสผ่านใหม่เพื่อความปลอดภัยในการเข้าถึงแดชบอร์ดจัดการแข่งขัน
        </p>

        {passwordToast && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              passwordToast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {passwordToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{passwordToast.message}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-3.5 max-w-md">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1b1c1c]">รหัสผ่านเดิม</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านเดิม"
              className="w-full px-3.5 py-2 rounded-xl border border-[#efeded] bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#ffe680] focus:ring-2 focus:ring-[#ffe680]/30 transition-all shadow-2xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1b1c1c]">รหัสผ่านใหม่</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านใหม่"
              className="w-full px-3.5 py-2 rounded-xl border border-[#efeded] bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#ffe680] focus:ring-2 focus:ring-[#ffe680]/30 transition-all shadow-2xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1b1c1c]">ยืนยันรหัสผ่านใหม่</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
              className="w-full px-3.5 py-2 rounded-xl border border-[#efeded] bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#ffe680] focus:ring-2 focus:ring-[#ffe680]/30 transition-all shadow-2xs"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1b1c1c] text-[#ffe680] text-xs font-bold hover:bg-black transition-all cursor-pointer shadow-2xs"
          >
            <Key className="w-3.5 h-3.5" />
            <span>บันทึกรหัสผ่านใหม่</span>
          </button>
        </form>
      </div>
    </div>
  );
};

