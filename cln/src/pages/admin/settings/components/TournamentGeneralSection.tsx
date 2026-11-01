import React, { useRef } from 'react';
import { Upload, X, Calendar, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface TournamentGeneralSectionProps {
  formData: {
    name: string;
    description: string;
    logo: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  onChange: (field: string, value: any) => void;
}

export const TournamentGeneralSection: React.FC<TournamentGeneralSectionProps> = ({
  formData,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('ขนาดไฟล์รูปภาพต้องไม่เกิน 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onChange('logo', base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="border-b border-[#f5f3f3] pb-4">
        <h3 className="text-base sm:text-lg font-bold text-[#1b1c1c]">ข้อมูลทั่วไปของทัวร์นาเมนต์</h3>
        <p className="text-xs sm:text-sm text-[#7d7765]">
          ตั้งค่าชื่อ คำอธิบาย โลโก้ และช่วงเวลาการจัดการแข่งขัน
        </p>
      </div>

      {/* Logo Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-[#faf9f6] border border-[#efeded]">
        <div className="w-20 h-20 rounded-2xl bg-white border border-[#efeded] shadow-2xs flex items-center justify-center overflow-hidden shrink-0 relative group">
          {formData.logo ? (
            <img
              src={formData.logo}
              alt="Tournament Logo"
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-[#7d7765]" />
          )}
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#1b1c1c]">โลโก้การแข่งขัน</span>
            <span className="text-[11px] font-semibold text-[#7d7765]">
              (ขนาดแนะนำ 200x200px, PNG หรือ JPG)
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1b1c1c] text-[#ffe680] text-xs font-bold hover:bg-black transition-all cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>อัปโหลดโลโก้</span>
            </button>

            {formData.logo && (
              <button
                type="button"
                onClick={() => onChange('logo', '')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#efeded] text-rose-600 text-xs font-bold hover:bg-rose-50 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>ลบโลโก้</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inputs Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tournament Name */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-[#1b1c1c]">
            ชื่อทัวร์นาเมนต์ <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="เช่น SCIENCE CUP 2026"
            className="w-full px-4 py-2.5 rounded-xl border border-[#efeded] bg-white text-sm text-[#1b1c1c] font-semibold focus:outline-none focus:border-[#ffe680] focus:ring-2 focus:ring-[#ffe680]/30 transition-all shadow-2xs"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-[#1b1c1c]">
            คำอธิบาย / สโลแกนการแข่งขัน
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="อธิบายรายละเอียด สโลแกน หรือข้อมูลสำคัญของการแข่งขัน"
            className="w-full px-4 py-2.5 rounded-xl border border-[#efeded] bg-white text-sm text-[#1b1c1c] font-medium focus:outline-none focus:border-[#ffe680] focus:ring-2 focus:ring-[#ffe680]/30 transition-all shadow-2xs resize-none"
          />
        </div>

        {/* Start Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#1b1c1c] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>วันที่เริ่มต้นการแข่งขัน</span>
          </label>
          <input
            type="date"
            value={formData.start_date || ''}
            onChange={(e) => onChange('start_date', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#efeded] bg-white text-sm text-[#1b1c1c] font-semibold focus:outline-none focus:border-[#ffe680] focus:ring-2 focus:ring-[#ffe680]/30 transition-all shadow-2xs"
          />
        </div>

        {/* End Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#1b1c1c] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>วันที่สิ้นสุดการแข่งขัน</span>
          </label>
          <input
            type="date"
            value={formData.end_date || ''}
            onChange={(e) => onChange('end_date', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#efeded] bg-white text-sm text-[#1b1c1c] font-semibold focus:outline-none focus:border-[#ffe680] focus:ring-2 focus:ring-[#ffe680]/30 transition-all shadow-2xs"
          />
        </div>

        {/* Status Dropdown */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-[#1b1c1c]">
            สถานะการแข่งขัน (Tournament Status)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'ACTIVE', label: 'กำลังแข่งขัน (Active)', desc: 'ทัวร์นาเมนต์เปิดดำเนินการแข่งขัน ข้อมูลแสดงให้ผู้ชมตามปกติ' },
              { id: 'DRAFT', label: 'ฉบับร่าง (Draft)', desc: 'กำลังเตรียมความพร้อม ผู้ชมจะเห็นว่ายังไม่มีตารางการแข่งขัน' },
              { id: 'COMPLETED', label: 'จบการแข่งขัน (Completed)', desc: 'การแข่งขันสิ้นสุดลงแล้ว บันทึกผลการแข่งขันสมบูรณ์' },
            ].map((st) => {
              const isSelected = formData.status === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onChange('status', st.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#1b1c1c] text-[#ffe680] border-[#1b1c1c] shadow-xs'
                      : 'bg-white text-[#1b1c1c] border-[#efeded] hover:border-[#ffe680]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold">{st.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#ffe680]" />}
                  </div>
                  <span
                    className={`text-[11px] mt-1 ${
                      isSelected ? 'text-[#e5dfc9]' : 'text-[#7d7765]'
                    }`}
                  >
                    {st.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

