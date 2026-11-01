import React, { useState } from 'react';
import { Lock, User, KeyRound, AlertCircle, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/authService';

export interface LoginPageProps {
  onSuccess: () => void;
  onBack?: () => void;
  tournamentName?: string;
  logoUrl?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onBack,
  tournamentName = 'SCI CUP',
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      // Format email if username was entered without domain
      let email = emailInput.trim();
      if (!email.includes('@')) {
        email = `${email}@scicup.local`;
      }

      await authService.login({
        email,
        password: passwordInput.trim(),
      });

      setErrorMsg('');
      onSuccess();
    } catch (err: any) {
      console.error('[LoginPage] Authentication failed:', err);
      const rawMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        '';
      const status = err?.status || err?.response?.status;
      const code = err?.code || err?.response?.data?.error?.code;

      let message = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง';

      if (
        status === 429 ||
        code === 'RATE_LIMIT_EXCEEDED' ||
        /too many requests/i.test(rawMsg)
      ) {
        message = 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง';
      } else if (
        status === 401 ||
        code === 'UNAUTHORIZED' ||
        /invalid/i.test(rawMsg) ||
        /credential/i.test(rawMsg)
      ) {
        message = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง';
      } else if (
        rawMsg.includes('Failed to fetch') ||
        status === 0 ||
        status === 502 ||
        status === 503
      ) {
        message = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต';
      } else if (rawMsg && /[\u0E00-\u0E7F]/.test(rawMsg)) {
        message = rawMsg;
      }

      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf9f8] via-[#f7f5f2] to-[#ede9e3] text-[#1b1c1c] font-body flex flex-col justify-center items-center p-4 sm:p-6 relative select-none">
      {/* Background Subtle Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Top Return Button */}
      {onBack && (
        <div className="w-full max-w-md mb-3 flex justify-start z-10">
          <button
            onClick={onBack}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ย้อนกลับ</span>
          </button>
        </div>
      )}

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#efeded] overflow-hidden z-10 transition-all duration-300">
        {/* Card Header (Without Logo - Compact) */}
        <div className="bg-gradient-to-r from-[#ffe680] via-[#ffd633] to-[#f7c815] px-6 py-4 sm:py-5 text-[#786607] relative flex flex-col items-center text-center">
          <h2 className="font-display text-lg sm:text-xl font-black text-[#635304]">
            ผู้ดูแลระบบ (Admin Login)
          </h2>
          <p className="text-[11px] sm:text-xs text-[#786607]/90 mt-0.5 font-medium max-w-xs">
            เข้าสู่ระบบเพื่อจัดการแข่งขัน ตารางคะแนน และสายแข่ง
          </p>
        </div>

        {/* Card Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs flex items-start gap-2.5 animate-shake shadow-2xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Username / Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              ชื่อผู้ใช้หรืออีเมล (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                disabled={isLoading}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="username"
                className="w-full pl-10 pr-4 py-3 bg-[#faf9f8] border border-gray-200 rounded-2xl text-sm text-[#1b1c1c] placeholder:text-gray-400 focus:outline-none focus:border-[#d4af37] focus:bg-white focus:ring-2 focus:ring-[#d4af37]/20 transition-all"
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isLoading}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="password"
                className="w-full pl-10 pr-11 py-3 bg-[#faf9f8] border border-gray-200 rounded-2xl text-sm text-[#1b1c1c] placeholder:text-gray-400 focus:outline-none focus:border-[#d4af37] focus:bg-white focus:ring-2 focus:ring-[#d4af37]/20 transition-all"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-amber-950 font-display font-black text-sm rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>เข้าสู่ระบบ (Sign In)</span>
              </>
            )}
          </button>
        </form>

        {/* Card Footer */}
        <div className="bg-[#faf9f8] px-6 py-4 border-t border-[#efeded] text-center">
          <p className="text-[11px] text-[#716e68]">
            ระบบจัดการการแข่งขันฟุตบอล {tournamentName}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
