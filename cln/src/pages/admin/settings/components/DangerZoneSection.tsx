import React, { useState } from 'react';
import { AlertTriangle, Trash2, RefreshCw, X, ShieldAlert } from 'lucide-react';

interface DangerZoneSectionProps {
  tournamentId: string;
  tournamentName: string;
  onResetMatches?: () => void;
  onDeleteTournament?: () => void;
}

export const DangerZoneSection: React.FC<DangerZoneSectionProps> = ({
  tournamentId,
  tournamentName,
  onResetMatches,
  onDeleteTournament,
}) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="border-b border-[#f5f3f3] pb-4">
        <h3 className="text-base sm:text-lg font-bold text-rose-600 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>โซนอันตราย (Danger Zone)</span>
        </h3>
        <p className="text-xs sm:text-sm text-[#7d7765]">
          การกระทำในส่วนนี้มีผลกระทบต่อข้อมูลการแข่งขันทั้งหมดอย่างถาวร กรุณาใช้ความระมัดระวัง
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-4">
        {/* Reset Matches Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-200/60">
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-[#1b1c1c]">รีเซ็ตผลการแข่งขันและคะแนนทั้งหมด</span>
            <p className="text-xs text-[#7d7765]">
              ล้างสกอร์ผลบอล ใบเหลือง-แดง และอันดับตารางคะแนนทั้งหมดให้กลับเป็นค่าเริ่มต้น
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer shrink-0 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>รีเซ็ตผลการแข่งขัน</span>
          </button>
        </div>

        {/* Delete Tournament Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-rose-700">ลบทัวร์นาเมนต์นี้ถาวร</span>
            <p className="text-xs text-[#7d7765]">
              ลบข้อมูลทัวร์นาเมนต์ ทีม นักกีฬา และแมตช์ทั้งหมด ไม่สามารถกู้คืนได้
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmText('');
              setShowDeleteModal(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all cursor-pointer shrink-0 shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ลบทัวร์นาเมนต์</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#efeded]">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <RefreshCw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-[#1b1c1c]">ยืนยันรีเซ็ตผลการแข่งขันหรือไม่?</h4>
              <p className="text-xs text-[#7d7765]">
                คะแนน สกอร์การแข่งขัน และเหตุการณ์ทั้งหมดจะถูกล้างกลับเป็น 0
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#efeded] text-xs font-bold text-[#7d7765] hover:bg-[#faf9f6] transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  if (onResetMatches) onResetMatches();
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-all cursor-pointer shadow-xs"
              >
                ยืนยันรีเซ็ต
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#efeded]">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-[#1b1c1c]">ยืนยันการลบทัวร์นาเมนต์</h4>
              <p className="text-xs text-[#7d7765]">
                พิมพ์ชื่อทัวร์นาเมนต์ <span className="font-bold text-[#1b1c1c]">{tournamentName}</span> เพื่อยืนยันการลบถาวร
              </p>
            </div>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`พิมพ์ "${tournamentName}"`}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#efeded] text-xs font-semibold focus:outline-none focus:border-rose-500 text-center"
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#efeded] text-xs font-bold text-[#7d7765] hover:bg-[#faf9f6] transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={confirmText.trim() !== tournamentName.trim()}
                onClick={() => {
                  setShowDeleteModal(false);
                  if (onDeleteTournament) onDeleteTournament();
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  confirmText.trim() === tournamentName.trim()
                    ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                ลบถาวร
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

