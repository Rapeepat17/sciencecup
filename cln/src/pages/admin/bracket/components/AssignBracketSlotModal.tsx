import React from 'react';
import { X, Layers, Trash2, Check } from 'lucide-react';

export interface GroupSeedOption {
  groupName: string;
  seeds: string[];
}

interface AssignBracketSlotModalProps {
  isOpen: boolean;
  slotTitle: string;
  currentSeedCode?: string | null;
  usedSeedCodes?: Set<string>;
  groupSeeds: GroupSeedOption[];
  onClose: () => void;
  onSelectSeed: (seedCode: string | null) => void;
}

export const AssignBracketSlotModal: React.FC<AssignBracketSlotModalProps> = ({
  isOpen,
  slotTitle,
  currentSeedCode,
  usedSeedCodes = new Set(),
  groupSeeds,
  onClose,
  onSelectSeed,
}) => {
  if (!isOpen) return null;

  const displayGroups: GroupSeedOption[] =
    groupSeeds && groupSeeds.length > 0
      ? groupSeeds
      : [
          { groupName: 'A', seeds: ['A1', 'A2', 'A3', 'A4'] },
          { groupName: 'B', seeds: ['B1', 'B2', 'B3', 'B4'] },
          { groupName: 'C', seeds: ['C1', 'C2', 'C3', 'C4'] },
          { groupName: 'D', seeds: ['D1', 'D2', 'D3', 'D4'] },
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-[#efeded] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f5f3f3] bg-[#faf9f6]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1b1c1c] text-[#ffe680] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#1b1c1c]">
                เลือกอันดับสายการแข่งขัน (Group Seeds)
              </h3>
              <p className="text-xs font-semibold text-[#7d7765]">{slotTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#7d7765] hover:text-[#1b1c1c] hover:bg-[#efeded] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Group Seeds Grid */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {displayGroups.map((group) => (
            <div key={group.groupName} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#4b4737]">
                  กลุ่ม {group.groupName}
                </span>
                <span className="text-[10px] font-semibold text-[#7d7765]">
                  อันดับ 1 – {group.seeds.length}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {group.seeds.map((seed) => {
                  const isSelected =
                    currentSeedCode?.toUpperCase() === seed.toUpperCase();
                  const isUsedElsewhere =
                    !isSelected && usedSeedCodes.has(seed.toUpperCase());

                  return (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => {
                        onSelectSeed(seed);
                        onClose();
                      }}
                      className={`relative py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-[#1b1c1c] text-[#ffe680] border-[#1b1c1c] shadow-xs'
                          : isUsedElsewhere
                          ? 'bg-[#faf9f6] text-[#7d7765] border-dashed border-[#d8d5cc] hover:border-[#786607]'
                          : 'bg-[#f5f3f3] hover:bg-[#ffe680] text-[#1b1c1c] hover:text-[#786607] border-[#efeded]'
                      }`}
                    >
                      <span>{seed}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      {isUsedElsewhere && (
                        <span className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold">
                          ใช้แล้ว
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer: Clear Slot or Close */}
        <div className="px-6 py-3.5 border-t border-[#f5f3f3] bg-[#faf9f6] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onSelectSeed(null);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ล้างค่า (-)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#4b4737] hover:bg-[#efeded] transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
