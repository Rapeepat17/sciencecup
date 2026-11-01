import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Info,
  User,
  AlertTriangle,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { tournamentService } from '../../../services/tournamentService';
import {
  TournamentGeneralSection,
  AdminAccountSection,
  DangerZoneSection,
} from './components';

export type SettingsTab = 'general' | 'account' | 'danger';

interface SettingsPageProps {
  currentTournamentId?: string;
  tournamentName?: string;
  onTournamentUpdated?: (updated: any) => void;
  onLogout?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentTournamentId: propTournamentId,
  tournamentName: propTournamentName = 'SCI CUP',
  onTournamentUpdated,
  onLogout,
}) => {
  const currentTournamentId = useMemo(() => {
    if (propTournamentId) return propTournamentId;
    try {
      return localStorage.getItem('scicup_current_tournament_id') || '1000';
    } catch {
      return '1000';
    }
  }, [propTournamentId]);

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: propTournamentName,
    description: '',
    logo: '',
    start_date: '',
    end_date: '',
    status: 'ACTIVE',
  });

  const [initialData, setInitialData] = useState(formData);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  // 1. Fetch Current Tournament Settings
  const loadTournamentData = useCallback(async () => {
    if (!currentTournamentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await tournamentService.getById(currentTournamentId);
      if (data) {
        const loaded = {
          name: data.name || propTournamentName,
          description: data.description || '',
          logo: data.logo || '',
          start_date: data.start_date || '',
          end_date: data.end_date || '',
          status: data.status || 'ACTIVE',
        };
        setFormData(loaded);
        setInitialData(loaded);
        setHasUnsavedChanges(false);
      }
    } catch (err: any) {
      console.warn('Could not load tournament details from API, using defaults:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentTournamentId, propTournamentName]);

  useEffect(() => {
    loadTournamentData();
  }, [loadTournamentData]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);
  };

  const handleResetForm = () => {
    setFormData(initialData);
    setHasUnsavedChanges(false);
    showToast('success', 'คืนค่าการเปลี่ยนแปลงกลับเป็นค่าเดิมแล้ว');
  };

  // 2. Save Settings
  const handleSaveSettings = async () => {
    if (!currentTournamentId) return;

    if (!formData.name.trim()) {
      showToast('error', 'กรุณาระบุชื่อทัวร์นาเมนต์');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        status: formData.status,
      };

      if (formData.logo) {
        payload.logo = formData.logo;
      }
      if (formData.start_date) {
        payload.start_date = formData.start_date;
      }
      if (formData.end_date) {
        payload.end_date = formData.end_date;
      }

      const res = await tournamentService.update(currentTournamentId, payload);
      setInitialData(formData);
      setHasUnsavedChanges(false);

      if (onTournamentUpdated) {
        onTournamentUpdated(res || payload);
      }

      showToast('success', 'บันทึกการตั้งค่าทัวร์นาเมนต์เรียบร้อยแล้ว');
    } catch (err: any) {
      console.error('Failed to save tournament settings:', err);
      const errorMsg =
        err?.message ||
        err?.response?.data?.message ||
        'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า';
      showToast('error', errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'general', label: 'ข้อมูลทั่วไป', icon: Info },
    { id: 'account', label: 'บัญชีแอดมิน', icon: User },
    { id: 'danger', label: 'โซนอันตราย', icon: AlertTriangle },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm font-bold">กำลังโหลดข้อมูลการตั้งค่าทัวร์นาเมนต์...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-bold transition-all ${
            toast.type === 'success'
              ? 'bg-[#1b1c1c] text-[#ffe680] border-slate-800'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-display text-[#1b1c1c]">ตั้งค่าการแข่งขัน</h1>
          <p className="text-sm text-[#7d7765]">ปรับแต่งข้อมูลทั่วไป บัญชีแอดมิน และจัดการการแข่งขัน</p>
        </div>

        {/* Action Button Desktop */}
        <div className="flex items-center gap-2.5">
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleResetForm}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#efeded] text-[#7d7765] hover:text-[#1b1c1c] text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ต</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-xs ${
              hasUnsavedChanges
                ? 'bg-[#1b1c1c] text-[#ffe680] hover:bg-black scale-102'
                : 'bg-[#1b1c1c] text-[#ffe680] hover:bg-black'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#faf9f6] border border-[#efeded] overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDanger = tab.id === 'danger';

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? isDanger
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-[#1b1c1c] text-[#ffe680] shadow-xs'
                  : isDanger
                  ? 'text-rose-600 hover:bg-rose-50'
                  : 'text-[#7d7765] hover:text-[#1b1c1c] hover:bg-[#efeded]/70'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-[#efeded] p-5 sm:p-8 shadow-2xs">
        {activeTab === 'general' && (
          <TournamentGeneralSection
            formData={{
              name: formData.name,
              description: formData.description,
              logo: formData.logo,
              start_date: formData.start_date,
              end_date: formData.end_date,
              status: formData.status,
            }}
            onChange={handleFieldChange}
          />
        )}

        {activeTab === 'account' && <AdminAccountSection onLogout={onLogout} />}

        {activeTab === 'danger' && (
          <DangerZoneSection
            tournamentId={currentTournamentId}
            tournamentName={formData.name || propTournamentName}
            onResetMatches={() => {
              showToast('success', 'ส่งคำขอรีเซ็ตข้อมูลผลการแข่งขันเรียบร้อย');
            }}
            onDeleteTournament={() => {
              showToast('error', 'ระบบป้องกันการลบทัวร์นาเมนต์หลัก');
            }}
          />
        )}
      </div>
    </div>
  );
};
