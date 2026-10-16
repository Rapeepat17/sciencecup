import React, { useState } from 'react';
import { Lock, User, KeyRound, AlertCircle, X, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      // Format email if username was entered
      let email = emailInput.trim();
      if (!email.includes('@')) {
        email = `${email}@scicup.local`;
      }

      await authService.login({
        email,
        password: passwordInput.trim(),
      });

      setEmailInput('');
      setPasswordInput('');
      setErrorMsg('');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
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
            <h3 className="font-display text-lg font-bold">เข้าสู่ระบบผู้ดูแลระบบ (Admin)</h3>
            <p className="text-xs text-[#786607]/80">ยืนยันตัวตนผ่าน Supabase Auth เพื่อจัดการข้อมูล</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            disabled={isLoading}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#786607] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">อีเมลหรือชื่อผู้ใช้</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                disabled={isLoading}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@scicup.local หรือ admin"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#d4af37] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">รหัสผ่าน</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                disabled={isLoading}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#d4af37] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="p-2.5 bg-amber-50/80 border border-amber-200/60 rounded-2xl text-[11px] text-amber-900">
            <span>บัญชีทดสอบระบบ: ชื่อผู้ใช้ <strong>admin</strong> | รหัสผ่าน <strong>1234</strong> หรือ <strong>Admin@2026</strong></span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1e293b] text-white hover:bg-black shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังตรวจสอบ...</span>
                </>
              ) : (
                <span>เข้าสู่ระบบ</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
