import React from 'react';
import { Award } from 'lucide-react';

export const StandingsEmptyState: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-12 text-center text-[#4b4737] border border-[#efeded] shadow-xs space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-[#ffe680]/40 border border-[#ffe680] text-[#786607] flex items-center justify-center mx-auto">
        <Award className="w-8 h-8" />
      </div>
      <div className="space-y-1 max-w-md mx-auto">
        <h3 className="font-display font-bold text-lg text-[#1b1c1c]">
          ยังไม่มีข้อมูลตารางคะแนนในทัวร์นาเมนต์นี้
        </h3>
        <p className="text-xs text-[#7d7765] leading-relaxed">
          กรุณาจัดทีมลงกลุ่มในเมนู "จัดกลุ่มการแข่งขัน" และสร้างโปรแกรมการแข่งขันในเมนู "ตารางการแข่งขัน" ก่อน ระบบหลังบ้านจะคำนวณตารางคะแนนให้อัตโนมัติ
        </p>
      </div>
    </div>
  );
};

