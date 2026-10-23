import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Loader2,
  Save,
  Trophy,
  Calendar,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Trash2,
  GitFork,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { TournamentItem } from '../../../../types';

export interface TournamentEditModalProps {
  tournament: TournamentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<TournamentItem>) => Promise<void>;
}

export const TournamentEditModal: React.FC<TournamentEditModalProps> = ({
  tournament,
  isOpen,
  onClose,
  onSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [knockoutStartingRound, setKnockoutStartingRound] = useState<'qf' | 'sf' | 'final'>('sf');

  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (tournament) {
      setName(tournament.name || '');
      setDescription(tournament.description || '');
      setLogo(tournament.logo || '');
      // Pull dates from either camelCase or snake_case
      const rawStart = tournament.startDate || (tournament as any).start_date || '';
      const rawEnd = tournament.endDate || (tournament as any).end_date || '';
      const rawRound = (tournament.knockoutStartingRound || (tournament as any).knockout_starting_round || 'sf') as 'qf' | 'sf' | 'final';

      setStartDate(rawStart);
      setEndDate(rawEnd);
      setKnockoutStartingRound(['qf', 'sf', 'final'].includes(rawRound) ? rawRound : 'sf');
      setErrorMessage(null);
      setFileError(null);
      setShowUrlInput(Boolean(tournament.logo && !tournament.logo.startsWith('data:')));
    }
  }, [tournament]);

  if (!isOpen || !tournament) return null;

  // File Upload Handlers
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
      setLogo(result);
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

  const knockoutRounds = [
    {
      id: 'qf' as const,
      label: 'รอบ 8 ทีมสุดท้าย',
      subtitle: '8 ทีม (QF)',
      detail: 'คัด 8 ทีมเข้าสู่รอบน็อคเอาท์',
    },
    {
      id: 'sf' as const,
      label: 'รอบรองชนะเลิศ',
      subtitle: '4 ทีม (SF)',
      detail: 'คัด 4 ทีมเข้าสู่รอบรองชนะเลิศ',
    },
    {
      id: 'final' as const,
      label: 'รอบชิงชนะเลิศ',
      subtitle: '2 ทีม (Final)',
      detail: 'มีเฉพาะนัดชิงชนะเลิศ 2 ทีม',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('กรุณาระบุชื่อทัวร์นาเมนต์');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSave(tournament.id, {
        name: name.trim(),
        description: description.trim(),
        logo: logo.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        knockoutStartingRound,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-xl w-full my-8 overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-[#786607] flex items-center justify-center">
              <Trophy className="w-4 h-4 text-[#b45309]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#1b1c1c]">
                แก้ไขข้อมูลทัวร์นาเมนต์
              </h3>
              <p className="text-[11px] text-gray-500">
                แก้ไขชื่อ โลโก้ วันที่แข่งขัน และผังรอบน็อคเอาท์
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tournament Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-800">
              ชื่อทัวร์นาเมนต์ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น SCI CUP 2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-800 focus:outline-hidden focus:border-[#786607] focus:bg-white transition-all shadow-2xs"
              required
            />
          </div>

          {/* Tournament Logo Upload Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-800">
                รูปโลโก้ทัวร์นาเมนต์
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] text-[#786607] hover:underline cursor-pointer"
              >
                {showUrlInput ? 'ซ่อนการระบุ URL' : 'หรือระบุด้วยลิงก์ URL'}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={onFileInputChange}
              className="hidden"
            />

            {fileError && (
              <p className="text-[11px] text-rose-600 font-medium">{fileError}</p>
            )}

            {logo ? (
              /* Image Preview Box */
              <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 flex items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-13 h-13 rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                    <img
                      src={logo}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-gray-800 block truncate">
                      โลโก้ปัจจุบัน
                    </span>
                    <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">
                      พร้อมบันทึกลงระบบ
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
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
                      setLogo('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1.5 rounded-lg border border-rose-200 hover:border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                    title="ลบโลโก้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Drag & Drop / Click Upload Box */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-amber-400 bg-amber-50/50'
                    : 'border-gray-200 hover:border-amber-300 bg-gray-50/50 hover:bg-amber-50/20'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-[#786607] flex items-center justify-center shadow-2xs">
                    <Upload className="w-5 h-5 text-[#b45309]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-800">
                      คลิกเพื่อเลือกไฟล์รูปภาพ
                    </span>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      หรือลากไฟล์ภาพมาวางที่นี่ (PNG, JPG, WebP สูงสุด 5MB)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Optional URL input */}
            {showUrlInput && (
              <div className="pt-1.5">
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    placeholder="ใส่ URL รูปภาพโดยตรง เช่น https://... หรือ /science_cup_logo.png"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 focus:outline-hidden focus:border-[#786607] focus:bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Date Range Section */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-800">
              กำหนดการแข่งขัน
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#786607]" /> วันที่เริ่มต้น
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 focus:outline-hidden focus:border-[#786607] focus:bg-white shadow-2xs cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#786607]" /> วันที่สิ้นสุด
                </span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 focus:outline-hidden focus:border-[#786607] focus:bg-white shadow-2xs cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Knockout Starting Round Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 text-[#786607]" />
                <span>รอบเริ่มต้นของสายแข่งน็อคเอาท์</span>
              </label>
              <span className="text-[11px] text-gray-500">เลือกรูปแบบผังสายแข่ง</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {knockoutRounds.map((item) => {
                const isSelected = knockoutStartingRound === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setKnockoutStartingRound(item.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50/70 ring-2 ring-amber-300/40 shadow-2xs'
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="text-xs font-bold text-gray-900">
                        {item.label}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-[#786607] shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {item.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-800">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="ระบุรายละเอียดเพิ่มเติม เช่น วัตถุประสงค์ หรือเงื่อนไข..."
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 focus:outline-hidden focus:border-[#786607] focus:bg-white resize-none shadow-2xs"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-[#ffe680] hover:bg-[#fedb56] text-[#786607] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกการแก้ไข</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
