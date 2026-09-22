import React, { useState } from 'react';
import { Lock, User, KeyRound, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { AdminCredentials } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  adminCredentials?: AdminCredentials;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  adminCredentials = { username: 'admin', passwordHash: '1234' },
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetUsername = adminCredentials.username || 'admin';
    const targetPassword = adminCredentials.passwordHash || '1234';

    if (
      usernameInput.trim().toLowerCase() === targetUsername.trim().toLowerCase() &&
      passwordInput.trim() === targetPassword.trim()
    ) {
      setUsernameInput('');
      setPasswordInput('');
      setErrorMsg('');
      onSuccess();
    } else {
      setErrorMsg('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#efeded] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#ffe680] to-[#f7d648] p-6 text-[#786607] relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/60 backdrop-blur-xs flex items-center justify-center shadow-xs">
            <Lock className="w-5 h-5 text-[#786607]" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">เข้าสู่ระบบผู้ดูแล (Admin Mode)</h3>
            <p className="text-xs text-[#786607]/80">กรอกรหัสผ่านเพื่อสลับไปยังแผงควบคุมระบบ</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#786607] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs uppercase font-bold text-[#4b4737] block mb-1.5">
              ชื่อผู้ใช้งาน (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#786607]" />
              <input
                type="text"
                required
                placeholder="username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-[#f5f3f3] border border-[#efeded] text-sm text-[#1b1c1c] font-semibold focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase font-bold text-[#4b4737] block mb-1.5">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#786607]" />
              <input
                type="password"
                required
                placeholder="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-[#f5f3f3] border border-[#efeded] text-sm text-[#1b1c1c] font-semibold focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-display font-bold text-xs transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-full bg-[#ffe680] hover:bg-[#f7d648] text-[#786607] font-display font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ยืนยันเข้าสู่ระบบ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
