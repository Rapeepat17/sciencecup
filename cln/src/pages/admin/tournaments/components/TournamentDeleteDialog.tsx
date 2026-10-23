import React, { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { TournamentItem } from '../../../../types';

export interface TournamentDeleteDialogProps {
  tournament: TournamentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export const TournamentDeleteDialog: React.FC<TournamentDeleteDialogProps> = ({
  tournament,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !tournament) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await onConfirm(tournament.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการลบทัวร์นาเมนต์');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-fadeIn">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
          <AlertTriangle className="w-6 h-6 text-rose-600" />
        </div>

        <div className="text-center space-y-1.5">
          <h3 className="font-display font-bold text-base sm:text-lg text-[#1b1c1c]">
            ยืนยันการลบทัวร์นาเมนต์
          </h3>
          <p className="text-xs text-gray-500">
            คุณต้องการลบ <span className="font-bold text-gray-800">"{tournament.name}"</span> ออกจากระบบหรือไม่?
          </p>
          <p className="text-[11px] text-rose-500">
            การดำเนินการนี้จะลบข้อมูลที่เกี่ยวข้องกับทัวร์นาเมนต์นี้ออกจากฐานข้อมูลอย่างถาวร
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 text-center">
            {errorMessage}
          </div>
        )}

        <div className="pt-2 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>กำลังลบ...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบข้อมูล</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
