import React from 'react';
import { Layers } from 'lucide-react';

export const GroupsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#1b1c1c]">จัดกลุ่มการแข่งขัน</h1>
          <p className="text-sm text-[#7d7765]">แบ่งสายการแข่งขัน จัดกลุ่มทีม และสุ่มจับสลาก</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#efeded] p-8 shadow-2xs min-h-[360px] flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#ffe680]/30 border-2 border-[#ffe680] text-[#786607] flex items-center justify-center mb-3 shadow-2xs">
          <Layers className="w-7 h-7" />
        </div>
        <h3 className="font-display text-lg font-bold text-[#1b1c1c]">หน้าจัดกลุ่มการแข่งขัน</h3>
        <p className="text-xs text-[#7d7765] max-w-sm mt-1">พร้อมสำหรับสร้างส่วนจัดกลุ่มและแบ่งสายการแข่งขัน</p>
      </div>
    </div>
  );
};
