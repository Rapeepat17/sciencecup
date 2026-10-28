import React, { useState } from 'react';
import { Plus, X, Layers } from 'lucide-react';

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (groupName: string) => void;
  existingGroups: string[];
}

export const AddGroupModal: React.FC<AddGroupModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingGroups,
}) => {
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = groupName.trim();
    if (!trimmed) {
      setError('กรุณาระบุชื่อกลุ่ม');
      return;
    }
    if (existingGroups.some((g) => g.toLowerCase() === trimmed.toLowerCase())) {
      setError('มีกลุ่มชื่อนี้อยู่แล้ว');
      return;
    }

    onAdd(trimmed);
    setGroupName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#efeded] overflow-hidden">
        <div className="bg-gradient-to-r from-[#ffe680] to-[#f7d648] p-5 text-[#786607] relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center">
              <Layers className="w-5 h-5 text-[#786607]" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold">เพิ่มกลุ่มการแข่งขัน</h3>
              <p className="text-[11px] text-[#786607]/80">กำหนดชื่อสาย เช่น Group A, Group B</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#786607] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">ชื่อกลุ่ม</label>
            <input
              type="text"
              autoFocus
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                setError('');
              }}
              placeholder="เช่น Group C หรือ สาย C"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d4af37] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1b1c1c] text-white hover:bg-black transition-all cursor-pointer shadow-md"
            >
              เพิ่มกลุ่ม
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
