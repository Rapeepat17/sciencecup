import React, { useRef, useState } from 'react';
import { Trophy, Upload, Image as ImageIcon, Trash2, RefreshCw, AlertCircle } from 'lucide-react';

export interface TournamentBasicInfoCardProps {
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  logo: string;
  onLogoChange: (value: string) => void;
}

export const TournamentBasicInfoCard: React.FC<TournamentBasicInfoCardProps> = ({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  logo,
  onLogoChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    setFileError(null);

    // Validate size (5MB max)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setFileError('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setFileError('รองรับเฉพาะไฟล์ PNG, JPG, WebP หรือ SVG เท่านั้น');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onLogoChange(result);
    };
    reader.onerror = () => {
      setFileError('เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาลองใหม่อีกครั้ง');
    };
    reader.readAsDataURL(file);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-2xs space-y-5">
      {/* Card Header */}
      <div className="pb-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 text-[#786607] flex items-center justify-center shrink-0 shadow-2xs">
          <Trophy className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-display font-bold text-base text-[#1b1c1c]">
            ข้อมูลพื้นฐานการแข่งขัน
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            กำหนดชื่อ โลโก้ และคำอธิบายสำหรับการแข่งขันใหม่
          </p>
        </div>
      </div>

      {/* Field: Tournament Name */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#1b1c1c]">
          ชื่อการแข่งขัน <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          autoFocus
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="เช่น SCIENCE CUP 2026 หรือ ฟุตบอลประเพณีวิทยาศาสตร์"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#fbfbfb] text-sm text-[#1b1c1c] font-medium placeholder:text-gray-400 focus:bg-white focus:outline-hidden focus:border-[#facc15] focus:ring-2 focus:ring-[#ffe680]/40 transition-all shadow-2xs"
        />
      </div>

      {/* Field: Tournament Logo Upload */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-[#1b1c1c]">
            โลโก้การแข่งขัน (ไม่บังคับ)
          </label>
          <span className="text-[11px] text-gray-400">ขนาดแนะนำสี่เหลี่ยมจัตุรัส</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={onFileInputChange}
          className="hidden"
        />

        {logo ? (
          /* Preview state */
          <div className="p-3.5 rounded-xl border border-gray-200 bg-[#fbfbfb] flex items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                <img
                  src={logo}
                  alt="Tournament Logo Preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#1b1c1c] block truncate">
                  โลโก้ทัวร์นาเมนต์
                </span>
                <span className="text-[11px] text-[#059669] font-medium block mt-0.5">
                  พร้อมใช้งานสำหรับการบันทึก
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                <span>เปลี่ยนรูป</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogoChange('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-1.5 rounded-lg border border-red-200 hover:border-red-300 bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                title="ลบโลโก้"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Upload box */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#facc15] bg-[#fffbeb]'
                : 'border-gray-200 hover:border-gray-300 bg-[#fbfbfb] hover:bg-white'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-2xs mb-0.5">
                <Upload className="w-4 h-4 text-[#786607]" />
              </div>
              <p className="text-xs font-bold text-[#1b1c1c]">
                คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
              </p>
              <p className="text-[11px] text-gray-400">
                รองรับ PNG, JPG, WebP หรือ SVG (ขนาดไม่เกิน 5MB)
              </p>
            </div>
          </div>
        )}

        {fileError && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium pt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}
      </div>

      {/* Field: Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-[#1b1c1c]">
            รายละเอียด / คำอธิบาย (ไม่บังคับ)
          </label>
          <span className="text-[11px] text-gray-400">สูงสุด 500 ตัวอักษร</span>
        </div>
        <textarea
          rows={3}
          maxLength={500}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="ระบุคำอธิบาย วัตถุประสงค์ หรือระเบียบการแข่งขันโดยสังเขป..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#fbfbfb] text-sm text-[#1b1c1c] placeholder:text-gray-400 focus:bg-white focus:outline-hidden focus:border-[#facc15] focus:ring-2 focus:ring-[#ffe680]/40 transition-all resize-none leading-relaxed shadow-2xs"
        />
      </div>
    </div>
  );
};
