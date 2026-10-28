import React, { useState, useEffect } from 'react';
import {
  TournamentBasicInfoCard,
  TournamentScheduleCard,
  TournamentReviewCard,
  TournamentRecentList,
} from './components';
import { createTournament, fetchTournamentsList } from '../../../services/dbService';
import { TournamentItem } from '../../../types';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  PlusCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export const CreateTournamentPage: React.FC = () => {
  // Step Wizard State (1: ข้อมูลพื้นฐาน, 2: กำหนดการและรูปแบบ, 3: ตรวจสอบข้อมูล)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [knockoutStartingRound, setKnockoutStartingRound] = useState<'qf' | 'sf' | 'final'>('sf');

  // Existing Tournaments List State
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(false);

  const loadTournaments = async () => {
    setIsLoadingTournaments(true);
    try {
      const list = await fetchTournamentsList();
      setTournaments(list || []);
    } catch (err) {
      console.error('Error fetching tournaments list:', err);
    } finally {
      setIsLoadingTournaments(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  // Status & Backend Communication
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1 Validation
  const canGoNextFromStep1 = name.trim().length > 0;

  // Submit to Backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('กรุณาระบุชื่อการแข่งขัน');
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createTournament({
        name: trimmedName,
        description: description.trim(),
        logo: logo || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        knockoutStartingRound,
        status: 'ACTIVE',
      });

      setSuccessMessage(`สร้างทัวร์นาเมนต์ "${created.name}" สำเร็จ! ข้อมูลถูกบันทึกลงในฐานข้อมูลเรียบร้อยแล้ว`);
      await loadTournaments();

      // Reset form
      setName('');
      setDescription('');
      setLogo('');
      setStartDate('');
      setEndDate('');
      setCurrentStep(1);
    } catch (err: any) {
      console.error('Error creating tournament:', err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการสร้างทัวร์นาเมนต์ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'ข้อมูลการแข่งขัน' },
    { num: 2, title: 'กำหนดการและรอบแข่ง' },
    { num: 3, title: 'ตรวจสอบและยืนยัน' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* Page Title & Subtitle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#1b1c1c]">
            สร้างทัวร์นาเมนต์
          </h1>
          <p className="text-sm text-[#7d7765]">
            กรอกข้อมูลตามขั้นตอน และตรวจสอบความถูกต้องก่อนบันทึกเข้าสู่ระบบ
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Stepper with Connected Lines */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between relative max-w-lg mx-auto">
          {/* Base Connecting Line */}
          <div className="absolute left-6 right-6 top-4 h-0.5 bg-gray-200 z-0" />
          
          {/* Active Progress Connecting Line */}
          <div
            className="absolute left-6 top-4 h-0.5 bg-[#10b981] z-0 transition-all duration-300 ease-in-out"
            style={{
              width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : 'calc(100% - 3rem)',
            }}
          />

          {steps.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num === 1 || (s.num === 2 && canGoNextFromStep1) || (s.num === 3 && canGoNextFromStep1)) {
                    setCurrentStep(s.num as any);
                  }
                }}
                className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group focus:outline-hidden"
              >
                {/* Step Circle Node */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-2xs ${
                    isCurrent
                      ? 'bg-[#ffe680] text-[#786607] ring-4 ring-[#ffe680]/40 font-extrabold scale-110'
                      : isCompleted
                      ? 'bg-[#10b981] text-white'
                      : 'bg-white text-gray-400 border-2 border-gray-200 group-hover:border-gray-300'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>

                {/* Step Text Label */}
                <span
                  className={`text-xs tracking-tight transition-colors ${
                    isCurrent
                      ? 'text-[#1b1c1c] font-bold'
                      : isCompleted
                      ? 'text-[#059669] font-medium'
                      : 'text-gray-400 font-normal'
                  }`}
                >
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-3xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-between gap-3 text-emerald-800 shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs sm:text-sm font-semibold">{successMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            ปิด
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-3xl bg-[#fff1f2] border border-[#fecdd3] flex items-center justify-between gap-3 text-red-800 shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-xs sm:text-sm font-semibold">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold text-red-700 hover:text-red-900 cursor-pointer"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Form Wizard Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: ข้อมูลพื้นฐานการแข่งขัน */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <TournamentBasicInfoCard
              name={name}
              onNameChange={setName}
              description={description}
              onDescriptionChange={setDescription}
              logo={logo}
              onLogoChange={setLogo}
            />

            {/* Bottom Actions for Step 1 */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  if (canGoNextFromStep1) {
                    setCurrentStep(2);
                  }
                }}
                disabled={!canGoNextFromStep1}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#ffe680] hover:bg-[#fedd55] text-[#1b1c1c] font-display font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:scale-[1.01]"
              >
                <span>ขั้นตอนถัดไป</span>
                <ArrowRight className="w-4 h-4 text-[#786607]" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: กำหนดการและรูปแบบการแข่งขัน */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <TournamentScheduleCard
              startDate={startDate}
              onStartDateChange={setStartDate}
              endDate={endDate}
              onEndDateChange={setEndDate}
              knockoutStartingRound={knockoutStartingRound}
              onKnockoutStartingRoundChange={setKnockoutStartingRound}
            />

            {/* Bottom Actions for Step 2 */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3.5 rounded-2xl bg-white border border-gray-200 hover:bg-[#f8f9fa] text-[#4b4737] font-display font-bold text-sm shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer hover:border-gray-300"
              >
                <ArrowLeft className="w-4 h-4 text-[#7d7765]" />
                <span>ย้อนกลับ</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-7 py-3.5 rounded-2xl bg-[#ffe680] hover:bg-[#fedd55] text-[#1b1c1c] font-display font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-md hover:scale-[1.01]"
              >
                <span>ตรวจสอบข้อมูล</span>
                <ArrowRight className="w-4 h-4 text-[#786607]" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ตรวจสอบข้อมูลก่อนบันทึก */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <TournamentReviewCard
              name={name}
              description={description}
              logo={logo}
              startDate={startDate}
              endDate={endDate}
              knockoutStartingRound={knockoutStartingRound}
            />

            {/* Bottom Actions for Step 3: Back & Submit */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3.5 rounded-2xl bg-white border border-gray-200 hover:bg-[#f8f9fa] text-[#4b4737] font-display font-bold text-sm shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer hover:border-gray-300"
              >
                <ArrowLeft className="w-4 h-4 text-[#7d7765]" />
                <span>ย้อนกลับแก้ไข</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="flex-1 sm:flex-initial px-8 py-3.5 rounded-2xl bg-[#ffe680] hover:bg-[#fedd55] text-[#1b1c1c] font-display font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:scale-[1.01]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#786607]" />
                    <span>กำลังบันทึกข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 text-[#786607]" />
                    <span>ยืนยันสร้างทัวร์นาเมนต์</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>

        {/* Existing Tournaments List */}
        <div className="pt-2">
          <TournamentRecentList
            tournaments={tournaments}
            isLoading={isLoadingTournaments}
            onRefresh={loadTournaments}
          />
        </div>
      </div>
    </div>
  );
};
