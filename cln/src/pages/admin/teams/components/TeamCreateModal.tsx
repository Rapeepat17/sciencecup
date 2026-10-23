import React, { useState, useRef } from 'react';
import { X, Upload, Trash2, Loader2, Shield, AlertCircle } from 'lucide-react';

export interface TeamCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    short_name?: string;
    manager?: string;
    logo?: string | null;
  }) => Promise<void>;
}

export const TeamCreateModal: React.FC<TeamCreateModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [manager, setManager] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process file upload
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('ขนาดไฟล์รูปภาพต้องไม่เกิน 2MB');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogo(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('กรุณาระบุชื่อทีม');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSave({
        name: trimmedName,
        short_name: shortName.trim().toUpperCase() || undefined,
        manager: manager.trim() || undefined,
        logo: logo || null,
      });

      // Reset form
      setName('');
      setShortName('');
      setManager('');
      setLogo(null);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลทีม');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#786607]">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-gray-900 font-display">
              เพิ่มทีมใหม่
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Logo Upload Section */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">
              โลโก้สโมสร / ตราทีม
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />

            {logo ? (
              <div className="flex items-center gap-4 p-3 rounded-xl border border-gray-200 bg-gray-50/60">
                <div className="w-16 h-16 rounded-full bg-white border border-gray-200/80 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  <img src={logo} alt="Team Logo Preview" className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">รูปโลโก้ทีมพร้อมใช้งาน</p>
                  <p className="text-[11px] text-gray-500">ระบบจะอัปโหลดขึ้น Cloud Storage โดยอัตโนมัติ</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-[#786607] hover:underline cursor-pointer"
                    >
                      เปลี่ยนรูป
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={() => setLogo(null)}
                      className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      ลบรูป
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-amber-400 bg-amber-50/50'
                    : 'border-gray-200 hover:border-amber-300 bg-gray-50/40 hover:bg-amber-50/20'
                }`}
              >
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <p className="text-xs font-semibold text-gray-700">
                  คลิกเพื่อเลือกรูป หรือลากไฟล์มาวางที่นี่
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  รองรับ PNG, JPG, WebP ขนาดไม่เกิน 2MB
                </p>
              </div>
            )}
          </div>

          {/* Team Name */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700">
              ชื่อทีม / สโมสร <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ภาควิชาเคมี, Computer Science FC"
              className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffe680] focus:border-amber-400 transition-all"
            />
          </div>

          {/* Short Name & Manager in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">
                ชื่อย่อทีม (เช่น CHEM, CS)
              </label>
              <input
                type="text"
                maxLength={8}
                value={shortName}
                onChange={(e) => setShortName(e.target.value.toUpperCase())}
                placeholder="เช่น CS"
                className="w-full px-3.5 py-2 text-sm uppercase font-mono bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffe680] focus:border-amber-400 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">
                ผู้จัดการทีม / โค้ช
              </label>
              <input
                type="text"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                placeholder="เช่น อ.สมศักดิ์ นำชัย"
                className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffe680] focus:border-amber-400 transition-all"
              />
            </div>
          </div>

          {/* Helper note */}
          <p className="text-[11px] text-gray-400 pt-1">
            หมายเหตุ: สายการแข่งขันจะสามารถจัดการและจับสลากแบ่งกลุ่มได้ที่หน้า &quot;จัดกลุ่มการแข่งขัน&quot;
          </p>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#ffe680] hover:bg-[#fedb56] text-[#786607] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกทีมใหม่'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
