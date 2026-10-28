import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ClearMatchesDialogProps {
  isOpen: boolean;
  matchCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

export const ClearMatchesDialog: React.FC<ClearMatchesDialogProps> = ({
  isOpen,
  matchCount,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-lg font-black text-slate-900 mt-4">
          ล้างตารางการแข่งขันทั้งหมด?
        </h3>
        <p className="text-xs font-semibold text-slate-500 mt-1.5 leading-relaxed">
          ตารางการแข่งขันทั้ง <span className="font-black text-rose-600">{matchCount} คู่</span>{' '}
          จะถูกนำออกจากหน้าจอจัดตาราง (และจะมีผลในฐานข้อมูลเมื่อคุณกดปุ่ม{' '}
          <span className="font-extrabold text-slate-800">"บันทึกตารางการแข่งขัน"</span>)
        </p>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>ยืนยันล้างตาราง</span>
          </button>
        </div>
      </div>
    </div>
  );
};

