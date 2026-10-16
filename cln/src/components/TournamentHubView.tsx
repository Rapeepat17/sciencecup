import React, { useState } from 'react';
import { TournamentItem, TournamentStatus } from '../types';
import {
  Trophy,
  Plus,
  Calendar,
  Users,
  Swords,
  ArrowRight,
  Sparkles,
  Search,
  SlidersHorizontal,
  Edit3,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface TournamentHubViewProps {
  tournaments: TournamentItem[];
  currentTournamentId: string;
  onSelectTournament: (tournamentId: string) => void;
  onCreateTournament: (meta: {
    name: string;
    status: TournamentStatus;
    startDate?: string;
    endDate?: string;
    description?: string;
  }) => Promise<void>;
  onUpdateTournament: (
    tournamentId: string,
    meta: Partial<TournamentItem>
  ) => Promise<void>;
  onDeleteTournament: (tournamentId: string) => Promise<void>;
  onOpenUserPortal?: (tournamentId?: string) => void;
}

export const TournamentHubView: React.FC<TournamentHubViewProps> = ({
  tournaments,
  currentTournamentId,
  onSelectTournament,
  onCreateTournament,
  onUpdateTournament,
  onDeleteTournament,
  onOpenUserPortal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TournamentStatus>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<TournamentItem | null>(null);
  const [deletingTournament, setDeletingTournament] = useState<TournamentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    name: '',
    status: 'ACTIVE' as TournamentStatus,
    startDate: '',
    endDate: '',
    description: '',
  });

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      status: 'UPCOMING',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      description: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (t: TournamentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTournament(t);
    setFormData({
      name: t.name,
      status: t.status,
      startDate: t.startDate || '',
      endDate: t.endDate || '',
      description: t.description || '',
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateTournament(formData);
      setIsCreateModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTournament || !formData.name.trim()) return;
    setIsSubmitting(true);
    try {
      await onUpdateTournament(editingTournament.id, formData);
      setEditingTournament(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTournament) return;
    setIsSubmitting(true);
    try {
      await onDeleteTournament(deletingTournament.id);
      setDeletingTournament(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: TournamentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            กำลังแข่งขัน (Active)
          </span>
        );
      case 'UPCOMING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            เตรียมการแข่งขัน (Upcoming)
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            สิ้นสุดการแข่งขัน (Completed)
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
            เก็บถาวร (Archived)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b1c1c] via-[#242626] to-[#121313] text-white p-8 sm:p-10 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#ffe680]/20 via-emerald-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-[#ffe680]">
              <Sparkles className="w-3.5 h-3.5 text-[#ffe680]" />
              <span>Multi-Tournament Management Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
              หน้ารวมรายการแข่งขันทั้งหมด
            </h1>
            <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
              สร้างและควบคุมการแข่งขันหลายรายการในระบบเดียว โดยแต่ละทัวร์นาเมนต์จะมีทีม ตารางแข่งขัน ตารางคะแนน และสายการแข่งขันแยกจากกันอย่างเด็ดขาด
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleOpenCreateModal}
              type="button"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#ffe680] to-[#f7d648] hover:from-[#f7d648] hover:to-[#ecd03d] text-[#524403] font-display font-extrabold text-sm shadow-lg shadow-[#ffe680]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>สร้างทัวร์นาเมนต์ใหม่</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="text-xs text-gray-400 font-medium">รายการทั้งหมด</div>
            <div className="text-2xl font-black font-display text-white mt-1">{tournaments.length}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="text-xs text-gray-400 font-medium">กำลังแข่งขัน</div>
            <div className="text-2xl font-black font-display text-emerald-400 mt-1">
              {tournaments.filter((t) => t.status === 'ACTIVE').length}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="text-xs text-gray-400 font-medium">เตรียมการแข่งขัน</div>
            <div className="text-2xl font-black font-display text-amber-300 mt-1">
              {tournaments.filter((t) => t.status === 'UPCOMING').length}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="text-xs text-gray-400 font-medium">แข่งขันเสร็จสิ้น</div>
            <div className="text-2xl font-black font-display text-blue-300 mt-1">
              {tournaments.filter((t) => t.status === 'COMPLETED').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหารายการแข่งขัน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ffe680] text-gray-800 placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'ACTIVE', 'UPCOMING', 'COMPLETED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#1b1c1c] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st === 'ALL'
                ? 'ทั้งหมด'
                : st === 'ACTIVE'
                ? 'กำลังแข่งขัน'
                : st === 'UPCOMING'
                ? 'เตรียมการ'
                : 'เสร็จสิ้น'}
            </button>
          ))}
        </div>
      </div>

      {/* Tournament Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments.map((t) => {
          const isSelected = t.id === currentTournamentId;

          return (
            <div
              key={t.id}
              onClick={() => onSelectTournament(t.id)}
              className={`group relative rounded-3xl p-6 bg-white border transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-[#ffe680] ring-2 ring-[#ffe680]/50 shadow-md bg-gradient-to-b from-white to-[#fffdf5]'
                  : 'border-gray-200/80 hover:border-gray-300'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-display font-black text-xl shadow-xs transition-transform group-hover:scale-105 ${
                        isSelected
                          ? 'bg-[#ffe680] text-[#786607]'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      {getStatusBadge(t.status)}
                      {isSelected && (
                        <span className="block mt-1 text-[11px] font-extrabold text-amber-700">
                          ● กำลังเลือกใช้งานอยู่
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Dropdown / Buttons */}
                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                    <button
                      onClick={(e) => handleOpenEditModal(t, e)}
                      title="แก้ไขข้อมูลรายการ"
                      className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {t.id !== 'sci_cup_main' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingTournament(t);
                        }}
                        title="ลบรายการนี้"
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold font-display text-gray-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                  {t.name}
                </h3>
                {t.description ? (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1 italic">ไม่มีคำอธิบายรายการ</p>
                )}
              </div>

              {/* Card Meta Stats */}
              <div className="mt-6 pt-5 border-t border-gray-100 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <Users className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-900">
                      {t.teamsCount ?? 0}
                    </span>
                    <span className="text-gray-500">ทีม</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <Swords className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-900">
                      {t.matchesCount ?? 0}
                    </span>
                    <span className="text-gray-500">แมตช์</span>
                  </div>
                </div>

                {t.startDate && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>เริ่ม: {t.startDate}</span>
                    {t.endDate && <span> - สิ้นสุด: {t.endDate}</span>}
                  </div>
                )}

                {/* Bottom Manage Button */}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTournament(t.id);
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1b1c1c] text-white hover:bg-black shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-[#ffe680] hover:text-[#786607]'
                    }`}
                  >
                    <span>{isSelected ? 'เปิดหน้าควบคุมรายการนี้' : 'สลับมาจัดการรายการนี้'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  {onOpenUserPortal && (
                    <button
                      type="button"
                      title="ดูหน้าแสดงผลสำหรับผู้ชม"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenUserPortal(t.id);
                      }}
                      className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTournaments.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800">ไม่พบรายการแข่งขันที่ค้นหา</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่มด้านล่างเพื่อสร้างรายการแข่งขันใหม่
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#ffe680] text-[#786607] font-bold text-xs hover:bg-[#f7d648] transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างทัวร์นาเมนต์ใหม่</span>
          </button>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#ffe680] to-[#f7d648] p-6 text-[#786607] relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/60 backdrop-blur-xs flex items-center justify-center shadow-xs">
                <Trophy className="w-5 h-5 text-[#786607]" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">สร้างทัวร์นาเมนต์ใหม่</h3>
                <p className="text-xs text-[#786607]/80">กำหนดชื่อและรายละเอียดของการแข่งขันใหม่</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#786607] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase font-bold text-gray-600 block mb-1.5">
                  ชื่อรายการแข่งขัน (Tournament Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Faculty Cup 2027 หรือ วิทยาศาสตร์คัพ 2569"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                />
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-gray-600 block mb-1.5">
                  สถานะการแข่งขัน (Status)
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TournamentStatus })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                >
                  <option value="UPCOMING">เตรียมการแข่งขัน (Upcoming)</option>
                  <option value="ACTIVE">กำลังแข่งขัน (Active)</option>
                  <option value="COMPLETED">แข่งขันเสร็จสิ้น (Completed)</option>
                  <option value="ARCHIVED">เก็บถาวร (Archived)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold text-gray-600 block mb-1.5">
                    วันที่เริ่มต้น
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-gray-600 block mb-1.5">
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-gray-600 block mb-1.5">
                  คำอธิบายรายการ (Description)
                </label>
                <textarea
                  rows={3}
                  placeholder="รายละเอียดเพิ่มเติม กฎ หรือสถานที่จัดการแข่งขัน..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                />
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-display font-bold text-xs cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-full bg-[#ffe680] hover:bg-[#f7d648] text-[#786607] font-display font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'กำลังสร้าง...' : 'ยืนยันสร้างรายการ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="bg-[#1b1c1c] p-6 text-white relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-[#ffe680]" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">แก้ไขข้อมูลรายการแข่งขัน</h3>
                <p className="text-xs text-gray-400">ID: {editingTournament.id}</p>
              </div>
              <button
                onClick={() => setEditingTournament(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase font-bold text-gray-600 block mb-1.5">
                  ชื่อรายการแข่งขัน *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                />
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-gray-600 block mb-1.5">
                  สถานะการแข่งขัน
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TournamentStatus })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                >
                  <option value="UPCOMING">เตรียมการแข่งขัน (Upcoming)</option>
                  <option value="ACTIVE">กำลังแข่งขัน (Active)</option>
                  <option value="COMPLETED">แข่งขันเสร็จสิ้น (Completed)</option>
                  <option value="ARCHIVED">เก็บถาวร (Archived)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold text-gray-600 block mb-1.5">
                    วันที่เริ่มต้น
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-gray-600 block mb-1.5">
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-gray-600 block mb-1.5">
                  คำอธิบายรายการ
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ffe680]"
                />
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTournament(null)}
                  className="flex-1 py-2.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-display font-bold text-xs cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-full bg-[#1b1c1c] hover:bg-black text-white font-display font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#ffe680]" />
                  <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-red-200 overflow-hidden">
            <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-red-900">
                  ยืนยันการลบรายการแข่งขัน?
                </h3>
                <p className="text-xs text-red-700 mt-1">
                  คุณกำลังจะลบรายการ <span className="font-bold">"{deletingTournament.name}"</span>
                </p>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                การลบรายการนี้จะทำการลบข้อมูลทีม, ผลการแข่งขัน, ตารางคะแนน และสายการแข่งขันทั้งหมดที่เป็นของรายการนี้อย่างถาวร ข้อมูลจะไม่สามารถกู้คืนได้
              </p>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingTournament(null)}
                  className="flex-1 py-2.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-display font-bold text-xs cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-display font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'กำลังลบ...' : 'ยืนยันลบรายการ'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
