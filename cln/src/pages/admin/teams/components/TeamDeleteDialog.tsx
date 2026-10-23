import React, { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { Team } from '../../../../types';

export interface TeamDeleteDialogProps {
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (teamId: string) => Promise<void>;
}

export const TeamDeleteDialog: React.FC<TeamDeleteDialogProps> = ({
  team,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !team) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await onConfirm(String(team.id));
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'ไม่สามารถลบทีมได้');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-gray-900 font-display">
              ยืนยันการลบทีม
            </h3>
            <p className="text-xs text-gray-500">
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {errorMessage}
          </div>
        )}

        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/70 text-xs text-gray-700 space-y-1">
          <p>
            คุณต้องการลบทีม <strong className="text-gray-900">{team.name}</strong> หรือไม่?
          </p>
          <p className="text-[11px] text-gray-500">
            รายชื่อนักกีฬาในทีมนี้จะถูกลบออกจากฐานข้อมูลด้วยเช่นกัน
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-60"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>{isDeleting ? 'กำลังลบ...' : 'ยืนยันการลบทีม'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
