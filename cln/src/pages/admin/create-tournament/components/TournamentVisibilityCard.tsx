import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface TournamentVisibilityCardProps {
  isUserPortalEnabled: boolean;
  onUserPortalEnabledChange: (enabled: boolean) => void;
}

export const TournamentVisibilityCard: React.FC<TournamentVisibilityCardProps> = ({
  isUserPortalEnabled,
  onUserPortalEnabledChange,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-[#efeded] p-6 sm:p-7 shadow-2xs space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#f5f3f3]">
        <div className="w-8 h-8 rounded-xl bg-[#ffe680]/30 text-[#786607] flex items-center justify-center font-bold text-sm">
          3
        </div>
        <div>
          <h3 className="font-display font-bold text-base text-[#1b1c1c]">
            การเผยแพร่และสิทธิ์การเข้าชม
          </h3>
          <p className="text-xs text-[#7d7765]">กำหนดว่าผู้ชมทั่วไปสามารถดูผลการแข่งขันได้หรือไม่</p>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#f8f9fa] border border-[#efeded]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ffe680]/50 text-[#786607] flex items-center justify-center shrink-0">
            {isUserPortalEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-xs font-bold text-[#1b1c1c]">เปิดใช้งานหน้าผู้ชมสาธารณะ (User View)</p>
            <p className="text-[11px] text-[#7d7765]">
              {isUserPortalEnabled
                ? 'นักศึกษาและผู้ชมทั่วไปสามารถดูตารางแข่งและผลคะแนนสดได้'
                : 'ปิดชั่วคราว มีเฉพาะแอดมินเท่านั้นที่มองเห็น'}
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
          <input
            type="checkbox"
            checked={isUserPortalEnabled}
            onChange={(e) => onUserPortalEnabledChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10b981]" />
        </label>
      </div>
    </div>
  );
};
