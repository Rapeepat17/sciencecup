import React, { useState } from 'react';
import { Team, Match, TopScorer, GroupMap } from '../types';
import { calculateGroupStandings, calculateTopScorers } from '../utils/standingsCalculator';
import {
  Download,
  Share2,
  Users,
  Trophy,
  Activity,
  CheckCircle,
  Shield,
  ArrowRight,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { SoccerBall } from './icons/SoccerBall';

interface StandingsViewProps {
  groups: GroupMap;
  matches: Match[];
  teams?: Team[];
  tournamentName?: string;
  knockoutStartingRound?: 'r16' | 'qf' | 'sf' | 'final';
  onGoToBracket?: () => void;
  onGoToMatches?: () => void;
}

export const StandingsView: React.FC<StandingsViewProps> = ({
  groups,
  matches,
  teams,
  tournamentName = 'SCICUP',
  knockoutStartingRound = 'sf',
  onGoToBracket = () => {},
  onGoToMatches = () => {},
}) => {
  const [selectedGroupTab, setSelectedGroupTab] = useState<string>('all');
  const [shareSuccess, setShareSuccess] = useState(false);

  // Calculate live standings & top scorers
  const computedStandings = calculateGroupStandings(groups, matches);
  const topScorers = calculateTopScorers(
    matches,
    teams && teams.length > 0 ? teams : (Object.values(groups || {}).flat() as Team[])
  );

  const groupKeys = Object.keys(groups);

  const knockoutRoundLabel = (() => {
    switch (knockoutStartingRound) {
      case 'r16':
        return 'รอบ 16 ทีม';
      case 'qf':
        return 'รอบ 8 ทีม';
      case 'sf':
        return 'รอบรองชนะเลิศ';
      case 'final':
        return 'รอบชิงชนะเลิศ';
      default:
        return 'รอบน็อคเอาท์';
    }
  })();

  const totalKnockoutSlots = (() => {
    switch (knockoutStartingRound) {
      case 'r16':
        return 16;
      case 'qf':
        return 8;
      case 'sf':
        return 4;
      case 'final':
        return 2;
      default:
        return 4;
    }
  })();

  const numGroups = groupKeys.length || 1;
  const qualifyCountPerGroup = Math.max(1, Math.floor(totalKnockoutSlots / numGroups));

  const qualificationZoneText = qualifyCountPerGroup === 1
    ? `อันดับ 1 : เข้ารอบ${knockoutRoundLabel}`
    : `อันดับ 1 - ${qualifyCountPerGroup} : เข้ารอบ${knockoutRoundLabel}`;
  const groupMeta: Record<string, { name: string }> = {};
  groupKeys.forEach((gKey) => {
    groupMeta[gKey] = {
      name: gKey.startsWith('กลุ่ม') || gKey.startsWith('Group') ? gKey : `กลุ่ม ${gKey}`,
    };
  });

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const handleExportData = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ groups, matches }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `standings-${tournamentName}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  let totalTeamsCount = 0;
  for (const k of groupKeys) {
    totalTeamsCount += groups[k]?.length || 0;
  }
  const completedMatchesCount = matches.filter((m) => m.status === 'FT').length;
  const totalGoalsCount = matches
    .filter((m) => m.status === 'FT' || m.status === 'LIVE')
    .reduce((acc, m) => acc + (m.score1 || 0) + (m.score2 || 0), 0);
  const avgGoals =
    completedMatchesCount > 0
      ? (totalGoalsCount / completedMatchesCount).toFixed(1)
      : '0.0';

  const availableGroups = groupKeys;
  const visibleGroups: string[] =
    selectedGroupTab === 'all' ? availableGroups : [selectedGroupTab];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Overview */}
      <div className="relative overflow-hidden rounded-3xl bg-white shadow-xs border border-[#efeded] p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-[#ffe680] text-[#786607] text-xs font-bold">
              รอบแบ่งกลุ่ม (Group Stage)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#95fcbc] text-[#007746] text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006d40] animate-ping" />
              ซิงค์ผลการแข่งล่าสุด
            </span>
          </div>

          <h1 className="font-display text-2xl lg:text-3xl font-bold text-[#1b1c1c] tracking-tight">
            ตารางคะแนนรอบแบ่งกลุ่ม
          </h1>
          <p className="text-sm text-[#4b4737] max-w-2xl leading-relaxed">
            อัปเดตคะแนน อันดับทีม และสถิติการแข่งขันแบบเรียลไทม์ ทัวร์นาเมนต์ {tournamentName} อันดับที่ 1-2 ของแต่ละกลุ่มเข้าสู่รอบน็อคเอาท์ต่อไป
          </p>
        </div>

        {/* Quick Action Ribbon */}
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#f5f3f3] hover:bg-[#efeded] text-[#1b1c1c] text-xs font-bold transition-colors shadow-2xs border border-[#efeded]"
          >
            <Download className="w-4 h-4 text-[#4b4737]" />
            <span>ส่งออกข้อมูล (Export)</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ffe680] hover:bg-[#fbe27c] text-[#786607] font-display font-bold text-xs transition-all shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>{shareSuccess ? 'คัดลอกลิงก์แล้ว!' : 'แชร์ตารางคะแนน'}</span>
          </button>
        </div>

        {/* Ambient Decorative Glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#ffe680]/30 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Group Selection Filter & Qualification Legend */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#f5f3f3] rounded-full self-start overflow-x-auto max-w-full border border-[#efeded]">
          {[
            { id: 'all', label: 'ภาพรวมทุกกลุ่ม (All)' },
            ...availableGroups.map((g) => ({
              id: g,
              label: g.startsWith('กลุ่ม') || g.startsWith('Group') ? g : `กลุ่ม ${g}`,
            })),
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedGroupTab(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${selectedGroupTab === tab.id
                  ? 'bg-white text-[#1b1c1c] font-bold shadow-2xs'
                  : 'text-[#4b4737] hover:text-[#1b1c1c]'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Qualification Legend */}
        <div className="flex items-center gap-4 text-[#4b4737] text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-[#ffe680] border border-[#ddc664]" />
            <span className="font-semibold text-[#1b1c1c]">{qualificationZoneText}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-[#e9e8e7]" />
            <span>ตกรอบ</span>
          </div>
        </div>
      </div>

      {/* Tables Section: Groups Grid Layout */}
      {groupKeys.length === 0 && (
        <div className="bg-white rounded-3xl p-8 text-center border border-[#efeded] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#f5f3f3] text-[#6f5d00] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-base text-[#1b1c1c]">
            ยังไม่มีกลุ่มหรือทีมในการแข่งขัน
          </h3>
          <p className="text-xs text-[#4b4737] max-w-md mx-auto">
            โปรดเพิ่มทีมและสร้างกลุ่มในหน้าจัดทีมและกลุ่ม เพื่อให้ระบบคำนวณอันดับ คะแนน และประตูได้-เสียแบบอัตโนมัติ
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {visibleGroups.map((groupKey) => {
          const meta = groupMeta[groupKey as 'A' | 'B' | 'C' | 'D'] || {
            name: groupKey.startsWith('กลุ่ม') || groupKey.startsWith('Group') ? groupKey : `กลุ่ม ${groupKey}`,
            nameEn: `Group ${groupKey}`,
            stadium: 'สนามกีฬาหลัก',
          };
          const dynamicList = computedStandings[groupKey] || [];
          const groupTeams = groups[groupKey] || [];
          const hasRealTeams = groupTeams.length > 0;

          // Group matches stats
          const groupMatches = matches.filter(
            (m) => m.group === groupKey || m.group === `กลุ่ม ${groupKey}`
          );
          const playedCount = groupMatches.filter((m) => m.status === 'FT').length;

          // Normalize rows to render
          const rowsToRender = dynamicList.map((item, idx) => ({
            rank: idx + 1,
            teamName: item.team.name,
            short: item.team.shortName || item.team.name.slice(0, 3).toUpperCase(),
            logoUrl: item.team.logo,
            p: item.p,
            w: item.w,
            d: item.d,
            l: item.l,
            gf: item.gf,
            ga: item.ga,
            gd: item.gd,
            pts: item.pts,
            form: item.form,
          }));

          return (
            <div
              key={groupKey}
              className="rounded-3xl bg-white shadow-xs border border-[#efeded] overflow-hidden flex flex-col justify-between"
            >
              {/* Group Table Header */}
              <div className="p-4 bg-[#f5f3f3] flex items-center justify-between border-b border-[#efeded]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src="/science_cup_logo.png"
                      alt="Science Cup"
                      className="w-full h-full object-contain scale-[1.75] transform"
                    />
                  </div>
                  <div>
                    <h2 className="font-display text-sm md:text-base font-bold text-[#1b1c1c]">
                      {meta.name}
                    </h2>
                    <p className="text-xs text-[#4b4737]">
                      {hasRealTeams ? `${groupTeams.length} ทีมในกลุ่ม` : `การแข่งขันรอบแบ่งกลุ่ม`}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#efeded] text-[#4b4737] text-xs font-semibold">
                  {groupMatches.length > 0
                    ? `แข่งแล้ว ${playedCount} / ${groupMatches.length} นัด`
                    : `สมาชิก ${groupTeams.length} ทีม`}
                </span>
              </div>

              {/* Table Data */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#efeded] text-[#4b4737] uppercase font-bold text-[11px]">
                      <th className="py-2.5 px-3 text-center w-10">#</th>
                      <th className="py-2.5 px-3">ทีม (Club)</th>
                      <th className="py-2.5 px-2 text-center" title="แข่ง (Played)">
                        P
                      </th>
                      <th className="py-2.5 px-2 text-center" title="ชนะ (Won)">
                        W
                      </th>
                      <th className="py-2.5 px-2 text-center" title="เสมอ (Draw)">
                        D
                      </th>
                      <th className="py-2.5 px-2 text-center" title="แพ้ (Lost)">
                        L
                      </th>
                      <th className="py-2.5 px-2 text-center" title="ได้ (GF)">
                        GF
                      </th>
                      <th className="py-2.5 px-2 text-center" title="เสีย (GA)">
                        GA
                      </th>
                      <th className="py-2.5 px-2 text-center" title="ผลต่าง (GD)">
                        +/-
                      </th>
                      <th
                        className="py-2.5 px-3 text-center font-bold text-[#1b1c1c]"
                        title="คะแนน (Points)"
                      >
                        PTS
                      </th>
                      <th className="py-2.5 px-4 text-center">ฟอร์ม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efeded]">
                    {rowsToRender.map((row) => {
                      const isRank1 = row.rank === 1;
                      const isRank2 = row.rank === 2;
                      const isQualified = row.rank <= qualifyCountPerGroup;

                      let rowBg = 'hover:bg-[#f5f3f3]';
                      if (isQualified) {
                        rowBg = isRank1 ? 'bg-[#ffe680]/30 hover:bg-[#ffe680]/50' : 'bg-[#ffe680]/15 hover:bg-[#ffe680]/30';
                      }

                      return (
                        <tr key={row.rank} className={`${rowBg} transition-colors`}>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                isQualified
                                  ? 'bg-[#ffe680] text-[#786607]'
                                  : 'text-[#4b4737]'
                              }`}
                            >
                              {row.rank}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              {row.logoUrl ? (
                                <img
                                  src={row.logoUrl}
                                  alt=""
                                  className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-black/5 bg-[#f5f3f3]"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-[#efeded] flex items-center justify-center font-bold text-[#6f5d00] text-xs shrink-0">
                                  {row.short}
                                </div>
                              )}
                              <div>
                                <span className="font-display text-xs font-bold text-[#1b1c1c] block">
                                  {row.teamName}
                                </span>
                                {isRank1 && (
                                  <span className="text-[10px] text-[#006d40] font-semibold flex items-center gap-0.5">
                                    <CheckCircle className="w-3 h-3" /> จ่าฝูง • โซนเข้ารอบ
                                  </span>
                                )}
                                {isRank2 && (
                                  <span className="text-[10px] text-[#786607] font-semibold flex items-center gap-0.5">
                                    <Shield className="w-3 h-3" /> รองจ่าฝูง • โซนเข้ารอบ
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-2 text-center text-[#1b1c1c]">{row.p}</td>
                          <td className="py-3 px-2 text-center font-semibold text-[#006d40]">
                            {row.w}
                          </td>
                          <td className="py-3 px-2 text-center text-[#4b4737]">{row.d}</td>
                          <td className="py-3 px-2 text-center text-[#4b4737]">{row.l}</td>
                          <td className="py-3 px-2 text-center">{row.gf}</td>
                          <td className="py-3 px-2 text-center">{row.ga}</td>
                          <td
                            className={`py-3 px-2 text-center font-semibold ${row.gd > 0
                                ? 'text-[#006d40]'
                                : row.gd < 0
                                  ? 'text-[#ba1a1a]'
                                  : 'text-[#4b4737]'
                              }`}
                          >
                            {row.gd > 0 ? `+${row.gd}` : row.gd}
                          </td>
                          <td className="py-3 px-3 text-center font-display font-bold text-sm text-[#1b1c1c]">
                            {row.pts}
                          </td>

                          {/* Recent Form */}
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                              {row.form.length > 0 ? (
                                row.form.map((f, fIdx) => (
                                  <span
                                    key={fIdx}
                                    className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${f === 'W'
                                        ? 'bg-[#006d40] text-white'
                                        : f === 'D'
                                          ? 'bg-[#c8c6c5] text-[#1b1c1c]'
                                          : 'bg-[#ba1a1a] text-white'
                                      }`}
                                  >
                                    {f}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-[#4b4737]">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section: Top Scorers */}
      <div className="rounded-3xl bg-white p-6 shadow-xs border border-[#efeded] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#6f5d00]" />
            <div>
              <h3 className="font-display text-base font-bold text-[#1b1c1c]">
                อันดับดาวซัลโวสูงสุด (Top Scorers)
              </h3>
              <p className="text-xs text-[#4b4737]">
                ผู้เล่นที่ทำประตูได้มากที่สุดในการแข่งขัน {tournamentName}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#f5f3f3] text-[#4b4737] text-xs font-semibold border border-[#efeded]">
            Golden Boot
          </span>
        </div>

        {topScorers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-[#efeded] text-[#4b4737] uppercase font-bold text-[11px]">
                  <th className="py-2.5 px-4 text-center w-12">อันดับ</th>
                  <th className="py-2.5 px-4">ชื่อผู้เล่น</th>
                  <th className="py-2.5 px-4">สโมสร/ทีม</th>
                  <th className="py-2.5 px-4 text-center font-bold text-[#1b1c1c]">ประตูรวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efeded]">
                {topScorers.map((scorer) => (
                  <tr key={scorer.id} className="hover:bg-[#f5f3f3] transition-colors">
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${scorer.rank === 1
                            ? 'bg-[#ffe680] text-[#786607]'
                            : 'bg-[#efeded] text-[#4b4737]'
                          }`}
                      >
                        {scorer.rank}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#ffe680]/50 flex items-center justify-center font-bold text-[#6f5d00] text-xs shrink-0">
                          {scorer.initials}
                        </div>
                        <div>
                          <span className="font-display font-bold text-xs text-[#1b1c1c] block">
                            {scorer.name}
                          </span>
                          <span className="text-[11px] text-[#4b4737]">
                            เบอร์ {scorer.number} • {scorer.position}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[#1b1c1c] font-medium">{scorer.teamName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-display font-bold text-base text-[#6f5d00]">
                        {scorer.goals}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 px-4 text-center bg-[#faf9f8] rounded-2xl border border-dashed border-[#efeded] my-2">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#ffe680]/40 flex items-center justify-center text-xl">
              <SoccerBall className="w-6 h-6 text-[#786607]" />
            </div>
            <h4 className="font-display font-bold text-sm text-[#1b1c1c]">
              ยังไม่มีผู้ทำประตูในขณะนี้
            </h4>
          </div>
        )}
      </div>

      {/* Bottom CTA Action Bar */}
      <div className="rounded-3xl bg-white p-5 shadow-xs border border-[#efeded] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#ffe680] flex items-center justify-center text-[#6f5d00]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-[#1b1c1c]">
              พร้อมสำหรับการแข่งขันรอบน็อคเอาท์?
            </h4>
            <p className="text-xs text-[#4b4737]">
              ตรวจสอบสายการประกบคู่รอบก่อนรองชนะเลิศ (Quarter-Finals) ตามอันดับคะแนนปัจจุบัน
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={onGoToMatches}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#f5f3f3] hover:bg-[#efeded] text-[#1b1c1c] text-xs font-bold transition-colors border border-[#efeded]"
          >
            <Calendar className="w-4 h-4 text-[#4b4737]" />
            <span>ดูโปรแกรมนัดถัดไป</span>
          </button>

          <button
            type="button"
            onClick={onGoToBracket}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#ffe680] hover:bg-[#fbe27c] text-[#786607] font-display font-bold text-xs shadow-xs transition-all"
          >
            <span>ดูสายการแข่งขันรอบน็อคเอาท์ (Bracket)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
