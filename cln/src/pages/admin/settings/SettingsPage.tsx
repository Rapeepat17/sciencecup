import React from 'react';
import { Settings } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#1b1c1c]">ตั้งค่าการแข่งขัน</h1>
          <p className="text-sm text-[#7d7765]">ปรับแต่งกติกา บัญชีแอดมิน และเปิดปิดระบบผู้ชม</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#efeded] p-8 shadow-2xs min-h-[360px] flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#ffe680]/30 border-2 border-[#ffe680] text-[#786607] flex items-center justify-center mb-3 shadow-2xs">
          <Settings className="w-7 h-7" />
        </div>
        <h3 className="font-display text-lg font-bold text-[#1b1c1c]">หน้าตั้งค่าการแข่งขัน</h3>
        <p className="text-xs text-[#7d7765] max-w-sm mt-1">พร้อมสำหรับสร้างส่วนตั้งค่าระบบและการแข่งขัน</p>
      </div>
    </div>
  );
};
