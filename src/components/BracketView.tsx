import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  CheckCircle2,
  Edit3,
  Sparkles,
  Users,
  ChevronRight,
  Filter,
  Layers,
  X,
  Check,
  Calendar,
  Settings2,
  RotateCcw,
  Save,
  ArrowRight,
  Lock,
  Unlock,
} from 'lucide-react';
import { BracketMatchup, Team, GroupMap, Match } from '../types';
import {
  INITIAL_R16_MATCHES,
  INITIAL_QF_MATCHES,
  INITIAL_SF_MATCHES,
  INITIAL_FINAL_MATCH,
} from '../data/bracketData';
import { calculateGroupStandings, resolveSeedFromStandings, isSeedPlaceholder } from '../utils/standingsCalculator';

const BracketConnector: React.FC<{ color?: string }> = ({ color = '#c5beab' }) => {
  return (
    <div className="w-6 sm:w-10 h-full flex items-center justify-center shrink-0 py-1">
      <svg
        className="w-full h-full overflow-visible shrink-0 pointer-events-none"
        viewBox="0 0 40 100"
        preserveAspectRatio="none"
      >
        <path
          d="M 0 25 H 20 V 75 H 0 M 20 50 H 40"
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};

const cleanName = (str?: string) => {
  if (!str) return '';
  if (str.startsWith('ทีมชนะ') || str.startsWith('ผู้ชนะ') || str.startsWith('รอผล')) return str;
  return str.replace(/\s*\(.*?\)/g, '').trim();
};

const isSlotEmptyOrPlaceholder = (
  name: string | undefined,
  stage: 'r16' | 'qf' | 'sf' | 'final',
  startingRound?: 'r16' | 'qf' | 'sf' | 'final'
) => {
  if (!name || name === '-' || name.trim() === '') return true;
  const s = name.trim();
  if (s.startsWith('รอผล') || s === 'TBD') return true;
  if (s.startsWith('ทีมชนะ') || s.startsWith('ผู้ชนะ')) return true;
  return false;
};

interface MatchupCardProps {
  matchup: BracketMatchup;
  stage: 'r16' | 'qf' | 'sf' | 'final';
  startingRound?: 'r16' | 'qf' | 'sf' | 'final';
  matchIndex: number;
  isFinal?: boolean;
  isBracketLocked?: boolean;
  placeholder1?: string;
  placeholder2?: string;
  scheduleMatch?: Match;
  onOpenEditSlot: (slot: 1 | 2) => void;
}

const MatchupCard: React.FC<MatchupCardProps> = ({
  matchup,
  stage,
  startingRound,
  matchIndex,
  isFinal = false,
  isBracketLocked = false,
  placeholder1,
  placeholder2,
  scheduleMatch,
  onOpenEditSlot,
}) => {
  const team1DisplayName = cleanName(matchup.team1.name);
  const team2DisplayName = cleanName(matchup.team2.name);
  const isTeam1Empty = isSlotEmptyOrPlaceholder(matchup.team1.name, stage, startingRound);
  const isTeam2Empty = isSlotEmptyOrPlaceholder(matchup.team2.name, stage, startingRound);

  const hasPenalties = scheduleMatch?.penaltyScore1 !== undefined && scheduleMatch?.penaltyScore1 !== null && scheduleMatch?.penaltyScore2 !== undefined && scheduleMatch?.penaltyScore2 !== null;
  const isFT = scheduleMatch?.status === 'FT' || scheduleMatch?.currentMinute === 'FT';
  const isLive = scheduleMatch?.status === 'LIVE';
  const hasScores = (isFT || isLive) && scheduleMatch?.score1 !== undefined && scheduleMatch?.score2 !== undefined;
  const isT1Winner = isFT && (scheduleMatch.score1 > scheduleMatch.score2 || (scheduleMatch.score1 === scheduleMatch.score2 && hasPenalties && (scheduleMatch.penaltyScore1 || 0) > (scheduleMatch.penaltyScore2 || 0)));
  const isT2Winner = isFT && (scheduleMatch.score2 > scheduleMatch.score1 || (scheduleMatch.score1 === scheduleMatch.score2 && hasPenalties && (scheduleMatch.penaltyScore2 || 0) > (scheduleMatch.penaltyScore1 || 0)));

  return (
    <div
      className={`p-3 rounded-2xl border transition-all space-y-2 ${
        isFinal
          ? 'bg-[#ffe680]/20 border-2 border-[#ffe680] shadow-md'
          : 'bg-[#f8f9fa] border-[#efeded] shadow-2xs hover:border-[#ffe680]'
      }`}
    >
      <div className="flex items-center justify-between text-[10px] text-[#4b4737]">
        <span className="font-bold text-[#786607]">{matchup.roundName}</span>
        <span>{matchup.time || '18:00 น.'}</span>
      </div>

      {/* Team 1 Slot */}
      <div
        onClick={() => {
          if (!isBracketLocked) onOpenEditSlot(1);
        }}
        className={`p-2.5 rounded-xl flex items-center justify-between gap-1.5 border transition-all min-h-[40px] ${
          isTeam1Empty
            ? 'bg-[#eef0f2] border-dashed border-[#cbd2d9] text-gray-400'
            : 'bg-white text-[#1b1c1c] border-[#efeded] shadow-2xs'
        } ${!isBracketLocked ? 'cursor-pointer hover:border-[#ffe680] hover:bg-[#fffdf0]' : ''}`}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {!isBracketLocked && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditSlot(1);
              }}
              className="p-1 rounded hover:bg-[#ffe680] text-[#786607] shrink-0"
              title="ระบุทีม/เปลี่ยนทีม"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          {matchup.team1?.logo && !isTeam1Empty && (
            <img src={matchup.team1.logo} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
          )}
          {isTeam1Empty ? (
            <span className="text-[11px] text-gray-400 font-medium italic">
              {placeholder1 || '-'}
            </span>
          ) : (
            <span className={`truncate text-xs ${isT1Winner ? 'font-black text-[#1b1c1c]' : 'font-bold text-[#1b1c1c]'}`}>
              {team1DisplayName}
            </span>
          )}
        </div>
        {hasScores && (
          <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ml-1 ${isT1Winner ? 'bg-[#ffe680] text-[#786607] font-black' : isLive ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
            {scheduleMatch.score1}
            {hasPenalties && <span className="text-[10px] text-amber-700 font-bold ml-0.5">({scheduleMatch.penaltyScore1})</span>}
          </span>
        )}
      </div>

      {/* Team 2 Slot */}
      <div
        onClick={() => {
          if (!isBracketLocked) onOpenEditSlot(2);
        }}
        className={`p-2.5 rounded-xl flex items-center justify-between gap-1.5 border transition-all min-h-[40px] ${
          isTeam2Empty
            ? 'bg-[#eef0f2] border-dashed border-[#cbd2d9] text-gray-400'
            : 'bg-white text-[#1b1c1c] border-[#efeded] shadow-2xs'
        } ${!isBracketLocked ? 'cursor-pointer hover:border-[#ffe680] hover:bg-[#fffdf0]' : ''}`}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {!isBracketLocked && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditSlot(2);
              }}
              className="p-1 rounded hover:bg-[#ffe680] text-[#786607] shrink-0"
              title="ระบุทีม/เปลี่ยนทีม"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          {matchup.team2?.logo && !isTeam2Empty && (
            <img src={matchup.team2.logo} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
          )}
          {isTeam2Empty ? (
            <span className="text-[11px] text-gray-400 font-medium italic">
              {placeholder2 || '-'}
            </span>
          ) : (
            <span className={`truncate text-xs ${isT2Winner ? 'font-black text-[#1b1c1c]' : 'font-bold text-[#1b1c1c]'}`}>
              {team2DisplayName}
            </span>
          )}
        </div>
        {hasScores && (
          <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ml-1 ${isT2Winner ? 'bg-[#ffe680] text-[#786607] font-black' : isLive ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
            {scheduleMatch.score2}
            {hasPenalties && <span className="text-[10px] text-amber-700 font-bold ml-0.5">({scheduleMatch.penaltyScore2})</span>}
          </span>
        )}
      </div>
    </div>
  );
};

interface FocusedMatchCardProps {
  matchup: BracketMatchup;
  stage: 'r16' | 'qf' | 'sf' | 'final';
  startingRound?: 'r16' | 'qf' | 'sf' | 'final';
  matchIndex: number;
  isFinal?: boolean;
  isBracketLocked?: boolean;
  placeholder1?: string;
  placeholder2?: string;
  scheduleMatch?: Match;
  onOpenEditSlot: (slot: 1 | 2) => void;
}

const FocusedMatchCard: React.FC<FocusedMatchCardProps> = ({
  matchup,
  stage,
  startingRound,
  matchIndex,
  isFinal = false,
  isBracketLocked = false,
  placeholder1,
  placeholder2,
  scheduleMatch,
  onOpenEditSlot,
}) => {
  const team1DisplayName = cleanName(matchup.team1.name);
  const team2DisplayName = cleanName(matchup.team2.name);
  const isTeam1Empty = isSlotEmptyOrPlaceholder(matchup.team1.name, stage, startingRound);
  const isTeam2Empty = isSlotEmptyOrPlaceholder(matchup.team2.name, stage, startingRound);

  const hasPenalties = scheduleMatch?.penaltyScore1 !== undefined && scheduleMatch?.penaltyScore1 !== null && scheduleMatch?.penaltyScore2 !== undefined && scheduleMatch?.penaltyScore2 !== null;
  const isFT = scheduleMatch?.status === 'FT' || scheduleMatch?.currentMinute === 'FT';
  const isLive = scheduleMatch?.status === 'LIVE';
  const hasScores = (isFT || isLive) && scheduleMatch?.score1 !== undefined && scheduleMatch?.score2 !== undefined;
  const isT1Winner = isFT && (scheduleMatch.score1 > scheduleMatch.score2 || (scheduleMatch.score1 === scheduleMatch.score2 && hasPenalties && (scheduleMatch.penaltyScore1 || 0) > (scheduleMatch.penaltyScore2 || 0)));
  const isT2Winner = isFT && (scheduleMatch.score2 > scheduleMatch.score1 || (scheduleMatch.score1 === scheduleMatch.score2 && hasPenalties && (scheduleMatch.penaltyScore2 || 0) > (scheduleMatch.penaltyScore1 || 0)));

  return (
    <div
      className={`p-5 rounded-3xl border shadow-xs space-y-4 ${
        isFinal ? 'bg-[#ffe680]/20 border-2 border-[#ffe680]' : 'bg-[#f5f3f3] border-[#efeded]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#efeded] pb-2 text-xs">
        <span className="font-bold text-[#786607]">{matchup.roundName}</span>
        <span className="text-[#4b4737]">{matchup.date} • {matchup.time}</span>
      </div>

      <div className="space-y-3">
        {/* Team 1 Row */}
        <div
          onClick={() => {
            if (!isBracketLocked) onOpenEditSlot(1);
          }}
          className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all min-h-[48px] ${
            isTeam1Empty
              ? 'bg-[#eef0f2] border-dashed border-[#cbd2d9] text-gray-400'
              : 'bg-white text-[#1b1c1c] border-[#efeded] shadow-2xs'
          } ${!isBracketLocked ? 'cursor-pointer hover:border-[#ffe680] hover:bg-[#fffdf0]' : ''}`}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {!isBracketLocked && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEditSlot(1);
                }}
                className="p-1.5 rounded-lg bg-[#f5f3f3] hover:bg-[#ffe680] text-[#786607] text-xs shrink-0"
                title="เปลี่ยนชื่อทีม"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {matchup.team1?.logo && !isTeam1Empty && (
              <img src={matchup.team1.logo} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
            )}
            {isTeam1Empty ? (
              <span className="text-xs text-gray-400 font-medium italic">
                {placeholder1 || '-'}
              </span>
            ) : (
              <span className={`font-display text-sm truncate ${isT1Winner ? 'font-black text-[#1b1c1c]' : 'font-bold text-[#1b1c1c]'}`}>
                {team1DisplayName}
              </span>
            )}
          </div>
          {hasScores && (
            <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded shrink-0 ml-2 ${isT1Winner ? 'bg-[#ffe680] text-[#786607] font-black' : isLive ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
              {scheduleMatch.score1}
              {hasPenalties && <span className="text-xs text-amber-700 font-bold ml-0.5">({scheduleMatch.penaltyScore1})</span>}
            </span>
          )}
        </div>

        {/* Team 2 Row */}
        <div
          onClick={() => {
            if (!isBracketLocked) onOpenEditSlot(2);
          }}
          className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all min-h-[48px] ${
            isTeam2Empty
              ? 'bg-[#eef0f2] border-dashed border-[#cbd2d9] text-gray-400'
              : 'bg-white text-[#1b1c1c] border-[#efeded] shadow-2xs'
          } ${!isBracketLocked ? 'cursor-pointer hover:border-[#ffe680] hover:bg-[#fffdf0]' : ''}`}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {!isBracketLocked && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEditSlot(2);
                }}
                className="p-1.5 rounded-lg bg-[#f5f3f3] hover:bg-[#ffe680] text-[#786607] text-xs shrink-0"
                title="เปลี่ยนชื่อทีม"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {matchup.team2?.logo && !isTeam2Empty && (
              <img src={matchup.team2.logo} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
            )}
            {isTeam2Empty ? (
              <span className="text-xs text-gray-400 font-medium italic">
                {placeholder2 || '-'}
              </span>
            ) : (
              <span className={`font-display text-sm truncate ${isT2Winner ? 'font-black text-[#1b1c1c]' : 'font-bold text-[#1b1c1c]'}`}>
                {team2DisplayName}
              </span>
            )}
          </div>
          {hasScores && (
            <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded shrink-0 ml-2 ${isT2Winner ? 'bg-[#ffe680] text-[#786607] font-black' : isLive ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
              {scheduleMatch.score2}
              {hasPenalties && <span className="text-xs text-amber-700 font-bold ml-0.5">({scheduleMatch.penaltyScore2})</span>}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

interface BracketViewProps {
  knockoutStartingRound?: 'r16' | 'qf' | 'sf' | 'final';
  setKnockoutStartingRound?: React.Dispatch<React.SetStateAction<'r16' | 'qf' | 'sf' | 'final'>>;
  r16Matches?: BracketMatchup[];
  setR16Matches?: React.Dispatch<React.SetStateAction<BracketMatchup[]>>;
  qfMatches?: BracketMatchup[];
  setQfMatches?: React.Dispatch<React.SetStateAction<BracketMatchup[]>>;
  sfMatches?: BracketMatchup[];
  setSfMatches?: React.Dispatch<React.SetStateAction<BracketMatchup[]>>;
  finalMatch?: BracketMatchup;
  setFinalMatch?: React.Dispatch<React.SetStateAction<BracketMatchup>>;
  isBracketLocked?: boolean;
  setIsBracketLocked?: (locked: boolean) => void;
  isKnockoutCreated?: boolean;
  setIsKnockoutCreated?: (created: boolean) => void;
  teams?: Team[];
  groups?: GroupMap;
  matches?: Match[];
  onSyncKnockoutToMatches?: (list: Match[]) => void;
  onSaveBracket?: (bracketData?: {
    knockoutStartingRound?: 'r16' | 'qf' | 'sf' | 'final';
    r16Matches?: BracketMatchup[];
    qfMatches?: BracketMatchup[];
    sfMatches?: BracketMatchup[];
    finalMatch?: BracketMatchup;
    isBracketLocked?: boolean;
    isKnockoutCreated?: boolean;
    knockoutMatchesList?: Match[];
  }) => Promise<boolean>;
  onGoToMatches?: () => void;
}

export const BracketView: React.FC<BracketViewProps> = ({
  knockoutStartingRound: propsStartingRound,
  setKnockoutStartingRound: propsSetStartingRound,
  r16Matches: propsR16,
  setR16Matches: propsSetR16,
  qfMatches: propsQf,
  setQfMatches: propsSetQf,
  sfMatches: propsSf,
  setSfMatches: propsSetSf,
  finalMatch: propsFinal,
  setFinalMatch: propsSetFinal,
  isBracketLocked = false,
  setIsBracketLocked,
  isKnockoutCreated: propsIsKnockoutCreated,
  setIsKnockoutCreated: propsSetIsKnockoutCreated,
  teams = [],
  groups = {},
  matches = [],
  onSyncKnockoutToMatches,
  onSaveBracket,
  onGoToMatches,
}) => {
  const [internalIsKnockoutCreated, setInternalIsKnockoutCreated] = useState<boolean>(false);
  const isKnockoutCreated = propsIsKnockoutCreated ?? internalIsKnockoutCreated;
  const setIsKnockoutCreated = propsSetIsKnockoutCreated ?? setInternalIsKnockoutCreated;

  const [internalStartingRound, setInternalStartingRound] = useState<'r16' | 'qf' | 'sf' | 'final'>('sf');
  const [internalR16, setInternalR16] = useState<BracketMatchup[]>(INITIAL_R16_MATCHES);
  const [internalQf, setInternalQf] = useState<BracketMatchup[]>(INITIAL_QF_MATCHES);
  const [internalSf, setInternalSf] = useState<BracketMatchup[]>(INITIAL_SF_MATCHES);
  const [internalFinal, setInternalFinal] = useState<BracketMatchup>(INITIAL_FINAL_MATCH);

  const startingRound = propsStartingRound ?? internalStartingRound;
  const setStartingRound = propsSetStartingRound ?? setInternalStartingRound;
  const r16Matches = propsR16 ?? internalR16;
  const setR16Matches = propsSetR16 ?? setInternalR16;
  const qfMatches = propsQf ?? internalQf;
  const setQfMatches = propsSetQf ?? setInternalQf;
  const sfMatches = propsSf ?? internalSf;
  const setSfMatches = propsSetSf ?? setInternalSf;
  const finalMatch = propsFinal ?? internalFinal;
  const setFinalMatch = propsSetFinal ?? setInternalFinal;

  // Creation modal & format selection states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedRoundFormat, setSelectedRoundFormat] = useState<'r16' | 'qf' | 'sf' | 'final'>('qf');

  // Active Round Filter Tab: 'all' | 'r16' | 'qf' | 'sf' | 'final'
  const [activeRound, setActiveRound] = useState<'all' | 'r16' | 'qf' | 'sf' | 'final'>('all');

  // Modal for changing team in a slot
  const [editingSlot, setEditingSlot] = useState<{
    stage: 'r16' | 'qf' | 'sf' | 'final';
    matchIndex: number;
    teamSlot: 1 | 2;
  } | null>(null);

  const [customTeamInput, setCustomTeamInput] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSavingBracket, setIsSavingBracket] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Calculate dynamic base match number continuing after actual group matches count
  const getBaseMatchNumber = (): number => {
    const groupMatches = matches.filter(
      (m) =>
        m.group !== 'Knockout' &&
        !m.group?.includes('น็อคเอาท์') &&
        !m.round?.includes('16 ทีม') &&
        !m.round?.includes('8 ทีม') &&
        !m.round?.includes('รอง') &&
        !m.round?.includes('ชิง')
    );
    const maxNo = groupMatches.reduce((max, m) => Math.max(max, m.matchNumber || 0), 0);
    return maxNo > 0 ? maxNo : groupMatches.length;
  };

  const baseNo = getBaseMatchNumber();
  const qf1MatchNo = baseNo + 1; // 19
  const qf2MatchNo = baseNo + 2; // 20
  const qf3MatchNo = baseNo + 3; // 21
  const qf4MatchNo = baseNo + 4; // 22
  const sf1MatchNo = baseNo + 5; // 23
  const sf2MatchNo = baseNo + 6; // 24
  const finalMatchNo = baseNo + 7; // 25

  /**
   * AUTOMATIC REACTIVE PROPAGATION:
   * Whenever QF or SF matches finish in match schedule (status === 'FT'),
   * automatically push winning team names into next round slots.
   * If match is not finished yet, set downstream slot to '-'.
   */
  /**
   * AUTOMATIC REACTIVE PROPAGATION:
   * Whenever R16, QF, or SF matches finish in match schedule (status === 'FT'),
   * or when a winner is explicitly selected in the bracket view,
   * automatically push winning team names and logos into downstream round slots.
   */
  useEffect(() => {
    const findLogo = (name: string, explicitLogo?: string) => {
      if (explicitLogo) return explicitLogo;
      if (!name || name === '-' || name.trim() === '') return '';
      const found = teams.find((t) => t.name.trim().toLowerCase() === name.trim().toLowerCase());
      return found?.logo || '';
    };

    const getMatchWinner = (
      stageMatch: BracketMatchup | undefined,
      matchId: string
    ): { name: string; logo: string } | null => {
      // 1. Check if match in matches schedule is FT (Finished) or has scores recorded
      const m = matches.find((item) => item.id === matchId);
      if (
        m &&
        (m.status === 'FT' || m.currentMinute === 'FT') &&
        m.score1 !== undefined &&
        m.score2 !== undefined
      ) {
        if (m.score1 !== m.score2) {
          if (m.score1 > m.score2) {
            return { name: m.team1.name, logo: findLogo(m.team1.name, m.team1.logo) };
          }
          if (m.score2 > m.score1) {
            return { name: m.team2.name, logo: findLogo(m.team2.name, m.team2.logo) };
          }
        } else if (
          m.penaltyScore1 !== undefined &&
          m.penaltyScore1 !== null &&
          m.penaltyScore2 !== undefined &&
          m.penaltyScore2 !== null &&
          m.penaltyScore1 !== m.penaltyScore2
        ) {
          if (m.penaltyScore1 > m.penaltyScore2) {
            return { name: m.team1.name, logo: findLogo(m.team1.name, m.team1.logo) };
          }
          if (m.penaltyScore2 > m.penaltyScore1) {
            return { name: m.team2.name, logo: findLogo(m.team2.name, m.team2.logo) };
          }
        }
      }

      // 2. Check if stageMatch has winner explicitly selected in BracketView (1 or 2)
      if (stageMatch && stageMatch.winner) {
        if (stageMatch.winner === 1 && stageMatch.team1?.name && stageMatch.team1.name !== '-') {
          return { name: stageMatch.team1.name, logo: findLogo(stageMatch.team1.name, stageMatch.team1.logo) };
        }
        if (stageMatch.winner === 2 && stageMatch.team2?.name && stageMatch.team2.name !== '-') {
          return { name: stageMatch.team2.name, logo: findLogo(stageMatch.team2.name, stageMatch.team2.logo) };
        }
      }

      return null;
    };

    // 1. Propagate R16 -> QF (Only if starting from R16)
    if (startingRound === 'r16' && r16Matches.length === 8) {
      let qfChanged = false;
      const newQf = qfMatches.map((qf, idx) => {
        const m1 = r16Matches[idx * 2];
        const m2 = r16Matches[idx * 2 + 1];
        const winner1Obj = getMatchWinner(m1, m1.id);
        const winner2Obj = getMatchWinner(m2, m2.id);

        let updated = { ...qf };
        if (winner1Obj && (qf.team1.name !== winner1Obj.name || (qf.team1.logo || '') !== winner1Obj.logo)) {
          updated.team1 = { ...updated.team1, name: winner1Obj.name, logo: winner1Obj.logo };
          qfChanged = true;
        }
        if (winner2Obj && (qf.team2.name !== winner2Obj.name || (qf.team2.logo || '') !== winner2Obj.logo)) {
          updated.team2 = { ...updated.team2, name: winner2Obj.name, logo: winner2Obj.logo };
          qfChanged = true;
        }
        return updated;
      });
      if (qfChanged) {
        setQfMatches(newQf);
      }
    }

    // 2. Propagate QF -> SF
    if ((startingRound === 'r16' || startingRound === 'qf') && qfMatches.length === 4) {
      let sfChanged = false;
      const newSf = sfMatches.map((sf, idx) => {
        const m1 = qfMatches[idx * 2];
        const m2 = qfMatches[idx * 2 + 1];
        const winner1Obj = getMatchWinner(m1, m1.id);
        const winner2Obj = getMatchWinner(m2, m2.id);

        let updated = { ...sf };
        if (winner1Obj && (sf.team1.name !== winner1Obj.name || (sf.team1.logo || '') !== winner1Obj.logo)) {
          updated.team1 = { ...updated.team1, name: winner1Obj.name, logo: winner1Obj.logo };
          sfChanged = true;
        }
        if (winner2Obj && (sf.team2.name !== winner2Obj.name || (sf.team2.logo || '') !== winner2Obj.logo)) {
          updated.team2 = { ...updated.team2, name: winner2Obj.name, logo: winner2Obj.logo };
          sfChanged = true;
        }
        return updated;
      });
      if (sfChanged) {
        setSfMatches(newSf);
      }
    }

    // 3. Propagate SF -> Final
    if (sfMatches.length === 2) {
      const m1 = sfMatches[0];
      const m2 = sfMatches[1];
      const winner1Obj = getMatchWinner(m1, m1.id);
      const winner2Obj = getMatchWinner(m2, m2.id);

      let finalChanged = false;
      let updatedFinal = { ...finalMatch };

      if (winner1Obj && (finalMatch.team1.name !== winner1Obj.name || (finalMatch.team1.logo || '') !== winner1Obj.logo)) {
        updatedFinal.team1 = { ...updatedFinal.team1, name: winner1Obj.name, logo: winner1Obj.logo };
        finalChanged = true;
      }
      if (winner2Obj && (finalMatch.team2.name !== winner2Obj.name || (finalMatch.team2.logo || '') !== winner2Obj.logo)) {
        updatedFinal.team2 = { ...updatedFinal.team2, name: winner2Obj.name, logo: winner2Obj.logo };
        finalChanged = true;
      }

      if (finalChanged) {
        setFinalMatch(updatedFinal);
      }
    }
  }, [r16Matches, qfMatches, sfMatches, matches, startingRound, teams]);



  /**
   * AUTOMATIC REAL-TIME SYNC TO MATCH SCHEDULE TABLE (MatchesFixturesView)
   * Includes all knockout matches from starting round to Grand Final,
   * using dynamic match numbers (19, 20, 21, 22, 23, 24, 25) and team name placeholders.
   */
  const buildKnockoutMatchList = (
    customStartingRound?: 'r16' | 'qf' | 'sf' | 'final',
    customR16?: BracketMatchup[],
    customQf?: BracketMatchup[],
    customSf?: BracketMatchup[],
    customFinal?: BracketMatchup
  ): Match[] => {
    const list: Match[] = [];
    const activeRound = customStartingRound || startingRound;
    const activeR16 = customR16 || r16Matches;
    const activeQf = customQf || qfMatches;
    const activeSf = customSf || sfMatches;
    const activeFinal = customFinal !== undefined ? customFinal : finalMatch;

    const getTeamLogoByName = (teamName: string, explicitLogo?: string) => {
      if (explicitLogo) return explicitLogo;
      if (!teamName || teamName === '-' || teamName.trim() === '') return '';
      const found = teams.find(
        (t) => t.name.trim().toLowerCase() === teamName.trim().toLowerCase()
      );
      return found?.logo || '';
    };

    const makeKnockoutTeamObj = (name: string, explicitLogo?: string): Team => ({
      id: name,
      name,
      logo: getTeamLogoByName(name, explicitLogo),
    });

    const cleanSeedName = (str: string) => {
      if (!str) return str;
      return str.replace(/ที่\s*(\d+)\s*สาย\s*([A-Z])/gi, '$2$1');
    };

    const formatTeamName = (name: string, fallbackPlaceholder: string) => {
      if (!name || name === '-' || name.trim() === '') {
        return fallbackPlaceholder;
      }
      return cleanSeedName(name);
    };

    const cleanTimeStr = (t?: string) => {
      return (t || '18:00').replace(/\s*น\.?$/g, '').trim();
    };

    if (activeRound === 'r16') {
      const defaultR16Seed1 = ['ทีมที่ 1', 'ทีมที่ 3', 'ทีมที่ 5', 'ทีมที่ 7', 'ทีมที่ 9', 'ทีมที่ 11', 'ทีมที่ 13', 'ทีมที่ 15'];
      const defaultR16Seed2 = ['ทีมที่ 2', 'ทีมที่ 4', 'ทีมที่ 6', 'ทีมที่ 8', 'ทีมที่ 10', 'ทีมที่ 12', 'ทีมที่ 14', 'ทีมที่ 16'];
      activeR16.forEach((m, idx) => {
        const existing = matches.find((item) => item.id === m.id);
        const name1 = formatTeamName(m.team1.name, defaultR16Seed1[idx] || `ทีมที่ ${idx * 2 + 1}`);
        const name2 = formatTeamName(m.team2.name, defaultR16Seed2[idx] || `ทีมที่ ${idx * 2 + 2}`);
        list.push({
          id: m.id,
          matchday: 10,
          matchNumber: baseNo + 1 + idx,
          dateStr: existing?.dateStr || m.date || '30 ต.ค. 2026',
          timeStr: cleanTimeStr(existing?.timeStr || m.time || '18:00'),
          round: 'รอบ 16 ทีมสุดท้าย',
          group: 'Knockout',
          venue: existing?.venue || m.venue || 'สนามหลัก',
          team1: makeKnockoutTeamObj(name1, m.team1.logo),
          team2: makeKnockoutTeamObj(name2, m.team2.logo),
          score1: 0,
          score2: 0,
          status: 'UPCOMING',
          statusLabel: 'รอบ 16 ทีม',
        });
      });
    }

    if (activeRound === 'r16' || activeRound === 'qf') {
      const defaultQfSeed1 = ['ทีมที่ 1', 'ทีมที่ 3', 'ทีมที่ 5', 'ทีมที่ 7'];
      const defaultQfSeed2 = ['ทีมที่ 2', 'ทีมที่ 4', 'ทีมที่ 6', 'ทีมที่ 8'];

      activeQf.forEach((m, idx) => {
        const existing = matches.find((item) => item.id === m.id);
        const qfNo = activeRound === 'r16' ? baseNo + 9 + idx : baseNo + 1 + idx;
        const r16_1Idx = idx * 2;
        const r16_2Idx = idx * 2 + 1;
        const r16_1Match = activeR16[r16_1Idx];
        const r16_2Match = activeR16[r16_2Idx];
        const r16_1Sm = r16_1Match ? matches.find((item) => item.id === r16_1Match.id) : undefined;
        const r16_2Sm = r16_2Match ? matches.find((item) => item.id === r16_2Match.id) : undefined;
        const r16_1No = r16_1Sm?.matchNumber ?? (baseNo + 1 + r16_1Idx);
        const r16_2No = r16_2Sm?.matchNumber ?? (baseNo + 1 + r16_2Idx);

        const fallback1 = activeRound === 'r16' ? `ทีมชนะ (คู่ที่ ${r16_1No})` : defaultQfSeed1[idx] || `ทีมที่ ${idx * 2 + 1}`;
        const fallback2 = activeRound === 'r16' ? `ทีมชนะ (คู่ที่ ${r16_2No})` : defaultQfSeed2[idx] || `ทีมที่ ${idx * 2 + 2}`;

        const name1 = formatTeamName(m.team1.name, fallback1);
        const name2 = formatTeamName(m.team2.name, fallback2);

        list.push({
          id: m.id,
          matchday: qfNo,
          matchNumber: qfNo,
          dateStr: existing?.dateStr || m.date || '31 ต.ค. 2026',
          timeStr: cleanTimeStr(existing?.timeStr || m.time || '18:00'),
          round: 'รอบ 8 ทีมสุดท้าย',
          group: 'Knockout',
          venue: existing?.venue || m.venue || 'สนามหลัก',
          team1: makeKnockoutTeamObj(name1, m.team1.logo),
          team2: makeKnockoutTeamObj(name2, m.team2.logo),
          score1: 0,
          score2: 0,
          status: 'UPCOMING',
          statusLabel: 'รอบ 8 ทีม',
        });
      });
    }

    if (activeRound === 'r16' || activeRound === 'qf' || activeRound === 'sf') {
      const defaultSfSeed1 = ['ทีมที่ 1', 'ทีมที่ 3'];
      const defaultSfSeed2 = ['ทีมที่ 2', 'ทีมที่ 4'];
      activeSf.forEach((m, idx) => {
        const existing = matches.find((item) => item.id === m.id);
        const sfNo = activeRound === 'r16' ? baseNo + 13 + idx : activeRound === 'qf' ? baseNo + 5 + idx : baseNo + 1 + idx;

        let name1 = '';
        let name2 = '';

        if (activeRound === 'sf') {
          const fallback1 = defaultSfSeed1[idx] || `ทีมที่ ${idx * 2 + 1}`;
          const fallback2 = defaultSfSeed2[idx] || `ทีมที่ ${idx * 2 + 2}`;
          name1 = formatTeamName(m.team1.name, fallback1);
          name2 = formatTeamName(m.team2.name, fallback2);
        } else {
          const qf1Idx = idx * 2;
          const qf2Idx = idx * 2 + 1;
          const qf1 = activeQf[qf1Idx];
          const qf2 = activeQf[qf2Idx];
          const sm1 = qf1 ? matches.find((item) => item.id === qf1.id) : undefined;
          const sm2 = qf2 ? matches.find((item) => item.id === qf2.id) : undefined;

          const isQf1FT = sm1 ? sm1.status === 'FT' : (qf1?.winner !== null && qf1?.winner !== undefined);
          const isQf2FT = sm2 ? sm2.status === 'FT' : (qf2?.winner !== null && qf2?.winner !== undefined);

          const qf1No = sm1?.matchNumber ?? (activeRound === 'r16' ? baseNo + 9 + qf1Idx : baseNo + 1 + qf1Idx);
          const qf2No = sm2?.matchNumber ?? (activeRound === 'r16' ? baseNo + 9 + qf2Idx : baseNo + 1 + qf2Idx);

          if (isQf1FT && m.team1.name && m.team1.name !== '-' && !m.team1.name.startsWith('ผู้ชนะ') && !m.team1.name.startsWith('ทีมชนะ')) {
            name1 = cleanSeedName(m.team1.name);
          } else {
            name1 = `ทีมชนะ (คู่ที่ ${qf1No})`;
          }

          if (isQf2FT && m.team2.name && m.team2.name !== '-' && !m.team2.name.startsWith('ผู้ชนะ') && !m.team2.name.startsWith('ทีมชนะ')) {
            name2 = cleanSeedName(m.team2.name);
          } else {
            name2 = `ทีมชนะ (คู่ที่ ${qf2No})`;
          }
        }

        list.push({
          id: m.id,
          matchday: sfNo,
          matchNumber: sfNo,
          dateStr: existing?.dateStr || m.date || '1 พ.ย. 2026',
          timeStr: cleanTimeStr(existing?.timeStr || m.time || '18:00'),
          round: 'รอบรองชนะเลิศ',
          group: 'Knockout',
          venue: existing?.venue || m.venue || 'สนามหลัก',
          team1: makeKnockoutTeamObj(name1, m.team1.logo),
          team2: makeKnockoutTeamObj(name2, m.team2.logo),
          score1: 0,
          score2: 0,
          status: 'UPCOMING',
          statusLabel: 'รอบรองฯ',
        });
      });
    }

    // 3rd Place Match (3rd Place Playoff between Losers of SF 1 and SF 2)
    if (activeRound === 'r16' || activeRound === 'qf' || activeRound === 'sf') {
      const tpNo = activeRound === 'r16' ? baseNo + 15 : activeRound === 'qf' ? baseNo + 7 : baseNo + 3;
      const existingTp = matches.find((item) => item.id === 'third_place' || item.round?.includes('3') || item.round?.includes('อันดับ'));

      const sf1 = activeSf[0];
      const sf2 = activeSf[1];
      const sm1 = sf1 ? matches.find((item) => item.id === sf1.id) : undefined;
      const sm2 = sf2 ? matches.find((item) => item.id === sf2.id) : undefined;

      const isSf1FT = sm1 ? sm1.status === 'FT' : (sf1?.winner !== null && sf1?.winner !== undefined);
      const isSf2FT = sm2 ? sm2.status === 'FT' : (sf2?.winner !== null && sf2?.winner !== undefined);

      const sf1No = sm1?.matchNumber ?? (activeRound === 'r16' ? baseNo + 13 : activeRound === 'qf' ? baseNo + 5 : baseNo + 1);
      const sf2No = sm2?.matchNumber ?? (activeRound === 'r16' ? baseNo + 14 : activeRound === 'qf' ? baseNo + 6 : baseNo + 2);

      let tpName1 = '';
      let tpLogo1 = '';
      let tpName2 = '';
      let tpLogo2 = '';

      if (isSf1FT) {
        let loserName = '';
        let loserLogo = '';
        if (sm1 && sm1.score1 !== undefined && sm1.score2 !== undefined) {
          const hasPens = sm1.penaltyScore1 !== undefined && sm1.penaltyScore1 !== null && sm1.penaltyScore2 !== undefined && sm1.penaltyScore2 !== null;
          const isT1Win = sm1.score1 > sm1.score2 || (sm1.score1 === sm1.score2 && hasPens && (sm1.penaltyScore1 || 0) > (sm1.penaltyScore2 || 0));
          loserName = isT1Win ? sm1.team2.name : sm1.team1.name;
          loserLogo = isT1Win ? (sm1.team2.logo || '') : (sm1.team1.logo || '');
        } else if (sf1?.winner === 1) {
          loserName = sf1.team2.name;
          loserLogo = sf1.team2.logo || '';
        } else if (sf1?.winner === 2) {
          loserName = sf1.team1.name;
          loserLogo = sf1.team1.logo || '';
        }
        tpName1 = loserName && loserName !== '-' ? cleanSeedName(loserName) : `ทีมแพ้ (คู่ที่ ${sf1No})`;
        tpLogo1 = loserLogo;
      } else {
        tpName1 = `ทีมแพ้ (คู่ที่ ${sf1No})`;
      }

      if (isSf2FT) {
        let loserName = '';
        let loserLogo = '';
        if (sm2 && sm2.score1 !== undefined && sm2.score2 !== undefined) {
          const hasPens = sm2.penaltyScore1 !== undefined && sm2.penaltyScore1 !== null && sm2.penaltyScore2 !== undefined && sm2.penaltyScore2 !== null;
          const isT1Win = sm2.score1 > sm2.score2 || (sm2.score1 === sm2.score2 && hasPens && (sm2.penaltyScore1 || 0) > (sm2.penaltyScore2 || 0));
          loserName = isT1Win ? sm2.team2.name : sm2.team1.name;
          loserLogo = isT1Win ? (sm2.team2.logo || '') : (sm2.team1.logo || '');
        } else if (sf2?.winner === 1) {
          loserName = sf2.team2.name;
          loserLogo = sf2.team2.logo || '';
        } else if (sf2?.winner === 2) {
          loserName = sf2.team1.name;
          loserLogo = sf2.team1.logo || '';
        }
        tpName2 = loserName && loserName !== '-' ? cleanSeedName(loserName) : `ทีมแพ้ (คู่ที่ ${sf2No})`;
        tpLogo2 = loserLogo;
      } else {
        tpName2 = `ทีมแพ้ (คู่ที่ ${sf2No})`;
      }

      list.push({
        id: 'third_place',
        matchday: tpNo,
        matchNumber: tpNo,
        dateStr: existingTp?.dateStr || '2 พ.ย. 2026',
        timeStr: cleanTimeStr(existingTp?.timeStr || '15:00'),
        round: 'นัดชิงอันดับ 3',
        group: 'Knockout',
        venue: existingTp?.venue || 'สนามหลัก',
        team1: makeKnockoutTeamObj(tpName1, tpLogo1),
        team2: makeKnockoutTeamObj(tpName2, tpLogo2),
        score1: 0,
        score2: 0,
        status: 'UPCOMING',
        statusLabel: 'ชิงอันดับ 3',
      });
    }

    if (activeFinal) {
      const existing = matches.find((item) => item.id === activeFinal.id || (item.round?.includes('ชิง') && !item.round?.includes('รอง') && !item.round?.includes('3') && !item.round?.includes('อันดับ')));
      const fnNo = activeRound === 'r16' ? baseNo + 16 : activeRound === 'qf' ? baseNo + 8 : activeRound === 'sf' ? baseNo + 4 : baseNo + 1;

      let name1 = '';
      let name2 = '';

      if (activeRound === 'final') {
        name1 = formatTeamName(activeFinal.team1.name, 'ทีมชิงชนะเลิศ 1');
        name2 = formatTeamName(activeFinal.team2.name, 'ทีมชิงชนะเลิศ 2');
      } else {
        const sf1 = activeSf[0];
        const sf2 = activeSf[1];
        const sm1 = sf1 ? matches.find((item) => item.id === sf1.id) : undefined;
        const sm2 = sf2 ? matches.find((item) => item.id === sf2.id) : undefined;

        const isSf1FT = sm1 ? sm1.status === 'FT' : (sf1?.winner !== null && sf1?.winner !== undefined);
        const isSf2FT = sm2 ? sm2.status === 'FT' : (sf2?.winner !== null && sf2?.winner !== undefined);

        const sf1No = sm1?.matchNumber ?? (activeRound === 'r16' ? baseNo + 13 : activeRound === 'qf' ? baseNo + 5 : baseNo + 1);
        const sf2No = sm2?.matchNumber ?? (activeRound === 'r16' ? baseNo + 14 : activeRound === 'qf' ? baseNo + 6 : baseNo + 2);

        if (isSf1FT && activeFinal.team1.name && activeFinal.team1.name !== '-' && !activeFinal.team1.name.startsWith('ผู้ชนะ') && !activeFinal.team1.name.startsWith('ทีมชนะ')) {
          name1 = cleanSeedName(activeFinal.team1.name);
        } else {
          name1 = `ทีมชนะ (คู่ที่ ${sf1No})`;
        }

        if (isSf2FT && activeFinal.team2.name && activeFinal.team2.name !== '-' && !activeFinal.team2.name.startsWith('ผู้ชนะ') && !activeFinal.team2.name.startsWith('ทีมชนะ')) {
          name2 = cleanSeedName(activeFinal.team2.name);
        } else {
          name2 = `ทีมชนะ (คู่ที่ ${sf2No})`;
        }
      }

      list.push({
        id: activeFinal.id,
        matchday: fnNo,
        matchNumber: fnNo,
        dateStr: existing?.dateStr || activeFinal.date || '2 พ.ย. 2026',
        timeStr: cleanTimeStr(existing?.timeStr || activeFinal.time || '18:00'),
        round: 'นัดชิงชนะเลิศ',
        group: 'Knockout',
        venue: existing?.venue || activeFinal.venue || 'สนามหลัก',
        team1: makeKnockoutTeamObj(name1, activeFinal.team1.logo),
        team2: makeKnockoutTeamObj(name2, activeFinal.team2.logo),
        score1: 0,
        score2: 0,
        status: 'UPCOMING',
        statusLabel: 'นัดชิงชนะเลิศ',
      });
    }

    return list;
  };

  // Real-time automatic sync to matches list whenever bracket changes
  useEffect(() => {
    if (onSyncKnockoutToMatches && isKnockoutCreated) {
      const list = buildKnockoutMatchList();
      onSyncKnockoutToMatches(list);
    }
  }, [r16Matches, qfMatches, sfMatches, finalMatch, startingRound, isKnockoutCreated]);

  /**
   * DIRECT CLICK TO ADVANCE TEAM (Optional)
   */
  const handleSelectWinner = (
    stage: 'r16' | 'qf' | 'sf' | 'final',
    matchIndex: number,
    winner: 1 | 2
  ) => {
    if (stage === 'r16') {
      const targetMatch = r16Matches[matchIndex];
      const newWinner = targetMatch.winner === winner ? null : winner;
      setR16Matches(r16Matches.map((m, idx) => (idx === matchIndex ? { ...m, winner: newWinner } : m)));
    } else if (stage === 'qf') {
      const targetMatch = qfMatches[matchIndex];
      const newWinner = targetMatch.winner === winner ? null : winner;
      setQfMatches(qfMatches.map((m, idx) => (idx === matchIndex ? { ...m, winner: newWinner } : m)));
    } else if (stage === 'sf') {
      const targetMatch = sfMatches[matchIndex];
      const newWinner = targetMatch.winner === winner ? null : winner;
      setSfMatches(sfMatches.map((m, idx) => (idx === matchIndex ? { ...m, winner: newWinner } : m)));
    } else if (stage === 'final') {
      const newWinner = finalMatch.winner === winner ? null : winner;
      setFinalMatch({
        ...finalMatch,
        winner: newWinner,
      });
    }
  };

  const handleOpenEditSlot = (stage: 'r16' | 'qf' | 'sf' | 'final', matchIndex: number, teamSlot: 1 | 2) => {
    if (isBracketLocked) {
      showToast('สายแข่งขันถูกล็อคอยู่ กดปุ่ม "แก้ไขสายแข่ง" มุมล่างขวาก่อนทำการแก้ไข');
      return;
    }
    setEditingSlot({ stage, matchIndex, teamSlot });
  };

  /**
   * Directly assign team name/logo to slot
   */
  const handleAssignTeamToSlot = (name: string, logo: string = '') => {
    if (!editingSlot) return;
    const { stage, matchIndex, teamSlot } = editingSlot;

    if (stage === 'r16') {
      setR16Matches(r16Matches.map((m, idx) => idx === matchIndex ? (teamSlot === 1 ? { ...m, team1: { ...m.team1, name, logo } } : { ...m, team2: { ...m.team2, name, logo } }) : m));
    } else if (stage === 'qf') {
      setQfMatches(qfMatches.map((m, idx) => idx === matchIndex ? (teamSlot === 1 ? { ...m, team1: { ...m.team1, name, logo } } : { ...m, team2: { ...m.team2, name, logo } }) : m));
    } else if (stage === 'sf') {
      setSfMatches(sfMatches.map((m, idx) => idx === matchIndex ? (teamSlot === 1 ? { ...m, team1: { ...m.team1, name, logo } } : { ...m, team2: { ...m.team2, name, logo } }) : m));
    } else if (stage === 'final') {
      if (teamSlot === 1) setFinalMatch({ ...finalMatch, team1: { ...finalMatch.team1, name, logo } });
      else setFinalMatch({ ...finalMatch, team2: { ...finalMatch.team2, name, logo } });
    }

    showToast(`ระบุทีม "${name}" เรียบร้อยแล้ว (สามารถเลือกแก้ไขสล็อตอื่นต่อได้เลย)`);
    setEditingSlot(null);
    setCustomTeamInput('');
  };

  /**
   * Auto-fill teams based on group standings
   */
  const handleAutoFillFromStandings = () => {
    if (!groups || Object.keys(groups).length === 0) {
      showToast('ไม่พบข้อมูลกลุ่มสำหรับเติมทีม');
      return;
    }

    const standings = calculateGroupStandings(groups, matches);
    const groupKeys = Object.keys(standings);

    if (groupKeys.length === 0) {
      showToast('ยังไม่มีข้อมูลตารางคะแนนกลุ่ม');
      return;
    }

    const fillMatchup = (m: BracketMatchup, defaultSeed1: string, defaultSeed2: string): BracketMatchup => {
      const isT1P = isSeedPlaceholder(m.team1?.name);
      const isT2P = isSeedPlaceholder(m.team2?.name);

      const seed1Str = m.team1?.name && m.team1.name !== '-' ? m.team1.name : defaultSeed1;
      const seed2Str = m.team2?.name && m.team2.name !== '-' ? m.team2.name : defaultSeed2;

      const res1 = isT1P ? resolveSeedFromStandings(seed1Str, standings, matches, { requireAllGroupMatchesFinished: true, groups }) : null;
      const res2 = isT2P ? resolveSeedFromStandings(seed2Str, standings, matches, { requireAllGroupMatchesFinished: true, groups }) : null;

      return {
        ...m,
        team1: { ...m.team1, name: res1?.name || m.team1.name || seed1Str, logo: res1?.logo || m.team1.logo || '' },
        team2: { ...m.team2, name: res2?.name || m.team2.name || seed2Str, logo: res2?.logo || m.team2.logo || '' },
      };
    };

    if (startingRound === 'r16') {
      const defaultSeeds: [string, string][] = [
        ['A1', 'B2'],
        ['C1', 'D2'],
        ['B1', 'A2'],
        ['D1', 'C2'],
        ['E1', 'F2'],
        ['G1', 'H2'],
        ['F1', 'E2'],
        ['H1', 'G2'],
      ];
      setR16Matches((prev) =>
        prev.map((m, idx) => fillMatchup(m, defaultSeeds[idx]?.[0] || `A${idx + 1}`, defaultSeeds[idx]?.[1] || `B${idx + 1}`))
      );
    } else if (startingRound === 'qf') {
      const defaultSeeds: [string, string][] = [
        ['A1', 'B2'],
        ['B1', 'C2'],
        ['C1', 'A2'],
        ['D1', 'D2'],
      ];
      setQfMatches((prev) =>
        prev.map((m, idx) => fillMatchup(m, defaultSeeds[idx]?.[0] || `A${idx + 1}`, defaultSeeds[idx]?.[1] || `B${idx + 1}`))
      );
    } else if (startingRound === 'sf') {
      const defaultSeeds: [string, string][] = [
        ['A1', 'B2'],
        ['B1', 'A2'],
      ];
      setSfMatches((prev) =>
        prev.map((m, idx) => fillMatchup(m, defaultSeeds[idx]?.[0] || `A${idx + 1}`, defaultSeeds[idx]?.[1] || `B${idx + 1}`))
      );
    }

    if (setIsBracketLocked) setIsBracketLocked(false);
    showToast('ดึงทีมจากตารางคะแนนเรียบร้อยแล้ว (ตรวจสอบและกดบันทึกสายแข่งขันได้เลย)');
  };

  const handleConfirmCreateKnockout = async () => {
    setStartingRound(selectedRoundFormat);
    setIsKnockoutCreated(true);
    if (setIsBracketLocked) setIsBracketLocked(false);
    setIsCreateModalOpen(false);

    // Reset initial matches so they start as clean empty placeholders
    setR16Matches(INITIAL_R16_MATCHES);
    setQfMatches(INITIAL_QF_MATCHES);
    setSfMatches(INITIAL_SF_MATCHES);
    setFinalMatch(INITIAL_FINAL_MATCH);

    const list = buildKnockoutMatchList(
      selectedRoundFormat,
      INITIAL_R16_MATCHES,
      INITIAL_QF_MATCHES,
      INITIAL_SF_MATCHES,
      INITIAL_FINAL_MATCH
    );

    if (onSyncKnockoutToMatches) {
      onSyncKnockoutToMatches(list);
    }

    if (onSaveBracket) {
      await onSaveBracket({
        knockoutStartingRound: selectedRoundFormat,
        r16Matches: INITIAL_R16_MATCHES,
        qfMatches: INITIAL_QF_MATCHES,
        sfMatches: INITIAL_SF_MATCHES,
        finalMatch: INITIAL_FINAL_MATCH,
        isBracketLocked: false,
        isKnockoutCreated: true,
        knockoutMatchesList: list,
      });
    }

    showToast('สร้างสายการแข่งขันรอบน็อคเอาท์เรียบร้อยแล้ว!');
  };

  const handleRecreateKnockout = () => {
    if (confirm('คุณต้องการรีเซ็ตและสร้างสายแข่งขันใหม่ใช่หรือไม่?')) {
      handleResetBracket();
      setIsKnockoutCreated(false);
      setIsCreateModalOpen(true);
    }
  };

  const handleResetBracket = () => {
    setIsKnockoutCreated(false);
    if (setIsBracketLocked) setIsBracketLocked(false);
    setR16Matches(INITIAL_R16_MATCHES);
    setQfMatches(INITIAL_QF_MATCHES);
    setSfMatches(INITIAL_SF_MATCHES);
    setFinalMatch(INITIAL_FINAL_MATCH);
    if (onSyncKnockoutToMatches) {
      onSyncKnockoutToMatches([]);
    }
    if (onSaveBracket) {
      onSaveBracket({
        knockoutStartingRound: startingRound,
        r16Matches: INITIAL_R16_MATCHES,
        qfMatches: INITIAL_QF_MATCHES,
        sfMatches: INITIAL_SF_MATCHES,
        finalMatch: INITIAL_FINAL_MATCH,
        isBracketLocked: false,
        isKnockoutCreated: false,
        knockoutMatchesList: [],
      });
    }
    showToast('รีเซ็ตสายการแข่งขันและลบแมตช์น็อคเอาท์ในตารางเรียบร้อยแล้ว!');
  };

  /**
   * Save bracket & lock, staying on current page
   */
  const handleSaveBracket = async () => {
    setIsSavingBracket(true);
    if (setIsBracketLocked) setIsBracketLocked(true);
    const list = buildKnockoutMatchList();
    if (onSyncKnockoutToMatches) {
      onSyncKnockoutToMatches(list);
    }
    if (onSaveBracket) {
      try {
        await onSaveBracket({
          knockoutStartingRound: startingRound,
          r16Matches,
          qfMatches,
          sfMatches,
          finalMatch,
          isBracketLocked: true,
          isKnockoutCreated: true,
          knockoutMatchesList: list,
        });
      } catch (err) {
        console.error('Save bracket error:', err);
      }
    }
    setIsSavingBracket(false);
    showToast('บันทึกและล็อคสายการแข่งขันเรียบร้อยแล้ว!');
  };

  /**
   * Explicitly navigate to match schedule page
   */
  const handleGoToMatches = async () => {
    await handleSaveBracket();
    if (onGoToMatches) {
      setTimeout(() => {
        onGoToMatches();
      }, 100);
    }
  };

  const championName =
    finalMatch?.winner === 1
      ? finalMatch?.team1?.name
      : finalMatch?.winner === 2
      ? finalMatch?.team2?.name
      : undefined;

  // Dynamically generate preset seed options from actual groups (4 ranks per group: A1, A2, A3, A4...)
  const getGroupPresetSeeds = () => {
    const groupKeys = Object.keys(groups || {});
    if (groupKeys.length === 0) {
      const defaultLetters = ['A', 'B', 'C', 'D'];
      const list: { label: string; value: string }[] = [];
      defaultLetters.forEach((letter) => {
        [1, 2, 3, 4].forEach((rank) => {
          list.push({ label: `${letter}${rank}`, value: `${letter}${rank}` });
        });
      });
      return list;
    }

    const list: { label: string; value: string }[] = [];
    groupKeys.forEach((gKey) => {
      const letter = gKey.replace(/^กลุ่ม\s*|^สาย\s*/gi, '').trim().toUpperCase() || gKey;
      const count = Math.max(4, (groups[gKey] || []).length);
      for (let i = 1; i <= Math.min(count, 4); i++) {
        list.push({ label: `${letter}${i}`, value: `${letter}${i}` });
      }
    });

    return list;
  };

  const groupPresetSeeds = getGroupPresetSeeds();

  if (!isKnockoutCreated) {
    return (
      <div className="space-y-6 relative min-h-[70vh] flex flex-col justify-center items-center">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-[#1b1c1c] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#ffe680] flex items-center gap-3 text-xs font-bold animate-bounce">
            <Sparkles className="w-4 h-4 text-[#ffe680]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* EMPTY UNCREATED STATE CARD */}
        <div className="bg-white rounded-3xl p-8 lg:p-12 border-2 border-dashed border-[#ffe680] shadow-sm text-center max-w-2xl w-full mx-auto space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 rounded-full bg-[#ffe680]/40 flex items-center justify-center text-[#786607] mx-auto shadow-inner">
            <Trophy className="w-10 h-10" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffe680] text-[#786607] text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> รอบน็อคเอาท์ (Knockout Stage)
            </span>
            <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-[#1b1c1c]">
              ยังไม่ได้สร้างสายการแข่งขันรอบน็อคเอาท์
            </h1>
            <p className="text-xs sm:text-sm text-[#4b4737] mt-2 max-w-lg mx-auto">
              กดปุ่มด้านล่างเพื่อเลือกจำนวนทีม และสร้างตารางสายการแข่งขันรอบน็อคเอาท์ประจำทัวร์นาเมนต์
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#1b1c1c] hover:bg-[#333] text-[#ffe680] text-sm font-black transition-all shadow-xl hover:scale-105 cursor-pointer border border-[#ffe680]/40"
            >
              <Sparkles className="w-5 h-5 text-[#ffe680]" />
              <span>สร้างรอบน็อคเอาท์</span>
              <ArrowRight className="w-5 h-5 text-[#ffe680]" />
            </button>
          </div>
        </div>

        {/* CREATION MODAL */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 lg:p-8 shadow-2xl border border-[#efeded] space-y-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#efeded]">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#786607]" />
                  <h3 className="font-display text-lg font-bold text-[#1b1c1c]">
                    เลือกรอบน็อคเอาท์ที่ต้องการสร้าง
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#f5f3f3] hover:bg-[#efeded] flex items-center justify-center text-[#4b4737]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-[#4b4737]">
                  เลือกรอบเริ่มต้นสำหรับสายการแข่งขัน ระบบจะสร้างตารางและคู่แข่งให้อัตโนมัติ:
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedRoundFormat('r16')}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      selectedRoundFormat === 'r16'
                        ? 'bg-[#ffe680] border-[#786607] shadow-sm font-bold text-[#786607]'
                        : 'bg-white border-[#efeded] hover:bg-[#f5f3f3] text-[#4b4737]'
                    }`}
                  >
                    <div>
                      <span className="font-display font-bold text-sm block">รอบ 16 ทีมสุดท้าย (Round of 16)</span>
                      <span className="text-[11px] text-[#4b4737]">16 ทีมเข้ารอบ (8 คู่แข่งขัน)</span>
                    </div>
                    {selectedRoundFormat === 'r16' && <Check className="w-5 h-5 text-[#786607]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRoundFormat('qf')}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      selectedRoundFormat === 'qf'
                        ? 'bg-[#ffe680] border-[#786607] shadow-sm font-bold text-[#786607]'
                        : 'bg-white border-[#efeded] hover:bg-[#f5f3f3] text-[#4b4737]'
                    }`}
                  >
                    <div>
                      <span className="font-display font-bold text-sm block">รอบ 8 ทีมสุดท้าย (Quarter-Finals) (แนะนำ)</span>
                      <span className="text-[11px] text-[#4b4737]">8 ทีมเข้ารอบ (4 คู่แข่งขัน)</span>
                    </div>
                    {selectedRoundFormat === 'qf' && <Check className="w-5 h-5 text-[#786607]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRoundFormat('sf')}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      selectedRoundFormat === 'sf'
                        ? 'bg-[#ffe680] border-[#786607] shadow-sm font-bold text-[#786607]'
                        : 'bg-white border-[#efeded] hover:bg-[#f5f3f3] text-[#4b4737]'
                    }`}
                  >
                    <div>
                      <span className="font-display font-bold text-sm block">รอบรองชนะเลิศ (Semi-Finals)</span>
                      <span className="text-[11px] text-[#4b4737]">4 ทีมเข้ารอบ (2 คู่แข่งขัน)</span>
                    </div>
                    {selectedRoundFormat === 'sf' && <Check className="w-5 h-5 text-[#786607]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRoundFormat('final')}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      selectedRoundFormat === 'final'
                        ? 'bg-[#ffe680] border-[#786607] shadow-sm font-bold text-[#786607]'
                        : 'bg-white border-[#efeded] hover:bg-[#f5f3f3] text-[#4b4737]'
                    }`}
                  >
                    <div>
                      <span className="font-display font-bold text-sm block">นัดชิงชนะเลิศ (Grand Final)</span>
                      <span className="text-[11px] text-[#4b4737]">2 ทีมเข้ารอบ (1 คู่แข่งขัน)</span>
                    </div>
                    {selectedRoundFormat === 'final' && <Check className="w-5 h-5 text-[#786607]" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#efeded]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#f5f3f3] hover:bg-[#efeded] text-[#4b4737] text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCreateKnockout}
                  className="px-6 py-2.5 rounded-xl bg-[#007746] hover:bg-[#005e37] text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#ffe680]" />
                  <span>ยืนยันสร้างสายแข่งขัน</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1b1c1c] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#ffe680] flex items-center gap-3 text-xs font-bold animate-bounce">
          <Sparkles className="w-4 h-4 text-[#ffe680]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* FLOATING ACTION BUTTON AT BOTTOM-RIGHT */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        {isBracketLocked ? (
          <button
            type="button"
            onClick={() => {
              if (setIsBracketLocked) setIsBracketLocked(false);
              showToast('เข้าสู่โหมดแก้ไข สามารถปรับเปลี่ยนทีมได้แล้ว');
            }}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-linear-to-r from-[#1b1c1c] via-[#2d2e2e] to-[#1b1c1c] hover:scale-105 text-[#ffe680] text-sm font-black transition-all shadow-2xl cursor-pointer border-2 border-[#ffe680]"
          >
            <Edit3 className="w-5 h-5 text-[#ffe680]" />
            <span>แก้ไขสายแข่ง</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={isSavingBracket}
            onClick={() => {
              handleSaveBracket();
            }}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-linear-to-r from-[#007746] to-[#00a862] hover:scale-105 text-white text-sm font-black transition-all shadow-2xl cursor-pointer border-2 border-white disabled:opacity-75 disabled:cursor-not-allowed"
          >
            <Lock className="w-5 h-5 text-white" />
            <span>{isSavingBracket ? 'กำลังบันทึก...' : 'บันทึกสายแข่งขัน'}</span>
          </button>
        )}
      </div>

      {/* HEADER BAR & QUICK ACTIONS */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-xs border border-[#efeded] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#6f5d00] text-xs font-bold uppercase mb-1">
            <Trophy className="w-4 h-4 text-[#786607]" />
            <span>ผังการแข่งขันรอบน็อคเอาท์ (Knockout Bracket)</span>
            {isBracketLocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e6f4ea] text-[#007746] text-[10px] font-bold border border-[#a8dab5]">
                <Lock className="w-3 h-3" /> ล็อคแล้ว
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fef7e0] text-[#786607] text-[10px] font-bold border border-[#ffe680]">
                <Unlock className="w-3 h-3" /> โหมดแก้ไข
              </span>
            )}
          </div>
          <h1 className="font-display text-xl lg:text-2xl font-extrabold text-[#1b1c1c]">
            {startingRound === 'r16' && 'รอบ 16 ทีมสุดท้าย (Round of 16)'}
            {startingRound === 'qf' && 'รอบ 8 ทีมสุดท้าย (Quarter-Finals)'}
            {startingRound === 'sf' && 'รอบรองชนะเลิศ (Semi-Finals)'}
            {startingRound === 'final' && 'นัดชิงชนะเลิศ (Grand Final)'}
          </h1>
          <p className="text-xs text-[#4b4737] mt-0.5">
            กดปุ่มแก้ไขมุมล่างขวาเพื่อปรับเปลี่ยนคู่แข่งขัน เมื่อแก้ไขเสร็จตารางแข่งจะถูกสร้างให้อัตโนมัติ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!isBracketLocked && (
            <button
              type="button"
              onClick={handleAutoFillFromStandings}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#ffe680] hover:bg-[#fbe27c] text-[#786607] text-xs font-bold transition-all shadow-xs cursor-pointer border border-[#786607]/20"
            >
              <Sparkles className="w-4 h-4 text-[#786607]" />
              <span>ดึงทีมจากตารางคะแนน</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRecreateKnockout}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5f3f3] hover:bg-[#efeded] text-[#4b4737] text-xs font-bold transition-all border border-[#efeded] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>เปลี่ยนรอบ / สร้างใหม่</span>
          </button>

          <button
            type="button"
            onClick={handleGoToMatches}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#1b1c1c] hover:bg-[#333] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#ffe680]" />
            <span>ไปตารางแข่ง</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#ffe680]" />
          </button>
        </div>
      </div>

      {/* Champion Spotlight Card */}
      <div className="rounded-3xl bg-linear-to-r from-[#ffe680]/50 via-white to-[#95fcbc]/40 p-6 border border-[#ffe680] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-[#ffe680] flex items-center justify-center text-[#6f5d00] shadow-sm">
            <Trophy className="w-9 h-9" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#786607] tracking-wider block">
              ผู้ชนะเลิศประจำทัวร์นาเมนต์ (Tournament Champion)
            </span>
            <h2 className="font-display text-2xl font-black text-[#1b1c1c] mt-0.5">
              {championName || 'รอผลการแข่งขัน'}
            </h2>
            <p className="text-xs text-[#006d40] font-semibold mt-0.5">
              {championName ? 'ชนะเลิศทัวร์นาเมนต์ รับถ้วยเกียรติยศ' : 'เมื่อผลนัดชิงชนะเลิศบันทึกเสร็จ ทีมคว้าแชมป์จะปรากฏที่นี่'}
            </p>
          </div>
        </div>
      </div>

      {/* STEP 2: ROUND SELECTOR TABS */}
      <div className="bg-white p-3 rounded-2xl border border-[#efeded] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#4b4737]">
          <Layers className="w-4 h-4 text-[#786607]" />
          <span>เลือกรอบการแข่งขัน:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveRound('all')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeRound === 'all'
                ? 'bg-[#1b1c1c] text-[#ffe680] shadow-xs'
                : 'bg-[#f5f3f3] text-[#4b4737] hover:bg-[#efeded]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>ทุกรอบ (All Bracket)</span>
          </button>

          {startingRound === 'r16' && (
            <button
              type="button"
              onClick={() => setActiveRound('r16')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeRound === 'r16'
                  ? 'bg-[#ffe680] text-[#786607] shadow-xs font-black'
                  : 'bg-[#f5f3f3] text-[#4b4737] hover:bg-[#efeded]'
              }`}
            >
              <span>รอบ 16 ทีม</span>
            </button>
          )}

          {(startingRound === 'r16' || startingRound === 'qf') && (
            <button
              type="button"
              onClick={() => setActiveRound('qf')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeRound === 'qf'
                  ? 'bg-[#ffe680] text-[#786607] shadow-xs font-black'
                  : 'bg-[#f5f3f3] text-[#4b4737] hover:bg-[#efeded]'
              }`}
            >
              <span>รอบ 8 ทีม</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveRound('sf')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeRound === 'sf'
                ? 'bg-[#ffe680] text-[#786607] shadow-xs font-black'
                : 'bg-[#f5f3f3] text-[#4b4737] hover:bg-[#efeded]'
            }`}
          >
            <span>รอบรองชนะเลิศ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRound('final')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeRound === 'final'
                ? 'bg-[#ffe680] text-[#786607] shadow-xs font-black'
                : 'bg-[#f5f3f3] text-[#4b4737] hover:bg-[#efeded]'
            }`}
          >
            <span>นัดชิงชนะเลิศ</span>
          </button>
        </div>
      </div>

      {/* Render View Based on Active Round Filter */}
      {activeRound === 'all' ? (
        <div className="rounded-3xl bg-white p-6 lg:p-8 shadow-xs border border-[#efeded] overflow-x-auto">
          <div className="flex items-stretch justify-between gap-1 sm:gap-2 min-w-[920px]">
            {/* Column 0: R16 (If starting from R16) */}
            {startingRound === 'r16' && (
              <>
                <div className="flex-1 flex flex-col min-w-[200px]">
                  <div className="text-center pb-2 mb-4 border-b border-[#efeded]">
                    <h3 className="font-display font-bold text-xs text-[#1b1c1c]">
                      รอบ 16 ทีมสุดท้าย (R16)
                    </h3>
                    <p className="text-[10px] text-[#4b4737]">คู่แข่งขันรอบ 16 ทีม</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-around gap-3">
                    {r16Matches.map((m, idx) => (
                      <MatchupCard
                        key={m.id}
                        matchup={m}
                        stage="r16"
                        startingRound={startingRound}
                        matchIndex={idx}
                        isBracketLocked={isBracketLocked}
                        scheduleMatch={matches.find((item) => item.id === m.id)}
                        onOpenEditSlot={(slot) => handleOpenEditSlot('r16', idx, slot)}
                      />
                    ))}
                  </div>
                </div>

                {/* Connector R16 -> QF (4 SVG pairs) */}
                <div className="flex flex-col min-w-[32px] sm:min-w-[48px] pt-12">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex-1 flex items-center justify-center">
                      <BracketConnector />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Column 1: Quarter Finals */}
            {(startingRound === 'r16' || startingRound === 'qf') && (
              <>
                <div className="flex-1 flex flex-col min-w-[220px]">
                  <div className="text-center pb-2 mb-4 border-b border-[#efeded]">
                    <h3 className="font-display font-bold text-sm text-[#1b1c1c]">
                      รอบ 8 ทีมสุดท้าย (Quarter-Finals)
                    </h3>
                    <p className="text-[11px] text-[#4b4737]">คู่แข่งขันรอบ 8 ทีม</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-around gap-6">
                    {qfMatches.map((m, idx) => {
                      const r16_1Idx = idx * 2;
                      const r16_2Idx = idx * 2 + 1;
                      const r16_1Match = r16Matches[r16_1Idx];
                      const r16_2Match = r16Matches[r16_2Idx];
                      const r16_1Sm = r16_1Match ? matches.find((item) => item.id === r16_1Match.id) : undefined;
                      const r16_2Sm = r16_2Match ? matches.find((item) => item.id === r16_2Match.id) : undefined;
                      const r16_1No = r16_1Sm?.matchNumber ?? (baseNo + 1 + r16_1Idx);
                      const r16_2No = r16_2Sm?.matchNumber ?? (baseNo + 1 + r16_2Idx);
                      return (
                        <MatchupCard
                          key={m.id}
                          matchup={m}
                          stage="qf"
                          startingRound={startingRound}
                          matchIndex={idx}
                          isBracketLocked={isBracketLocked}
                          scheduleMatch={matches.find((item) => item.id === m.id)}
                          placeholder1={startingRound === 'r16' ? `ทีมชนะ (คู่ที่ ${r16_1No})` : undefined}
                          placeholder2={startingRound === 'r16' ? `ทีมชนะ (คู่ที่ ${r16_2No})` : undefined}
                          onOpenEditSlot={(slot) => handleOpenEditSlot('qf', idx, slot)}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Connector QF -> SF (2 SVG pairs) */}
                <div className="flex flex-col min-w-[32px] sm:min-w-[48px] pt-12">
                  <div className="flex-1 flex items-center justify-center">
                    <BracketConnector />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <BracketConnector />
                  </div>
                </div>
              </>
            )}

            {/* Column 2: Semi Finals */}
            {(startingRound === 'r16' || startingRound === 'qf' || startingRound === 'sf') && (
              <>
                <div className="flex-1 flex flex-col min-w-[220px]">
                  <div className="text-center pb-2 mb-4 border-b border-[#efeded]">
                    <h3 className="font-display font-bold text-sm text-[#1b1c1c]">
                      รอบรองชนะเลิศ (Semi-Finals)
                    </h3>
                    <p className="text-[11px] text-[#4b4737]">รอผลผู้ชนะเข้าสู่รอบรองฯ</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-around gap-12">
                    {sfMatches.map((m, idx) => {
                      const qf1Idx = idx * 2;
                      const qf2Idx = idx * 2 + 1;
                      const qf1Match = qfMatches[qf1Idx];
                      const qf2Match = qfMatches[qf2Idx];
                      const qf1Sm = qf1Match ? matches.find((item) => item.id === qf1Match.id) : undefined;
                      const qf2Sm = qf2Match ? matches.find((item) => item.id === qf2Match.id) : undefined;
                      const qf1No = qf1Sm?.matchNumber ?? (startingRound === 'r16' ? baseNo + 9 + qf1Idx : baseNo + 1 + qf1Idx);
                      const qf2No = qf2Sm?.matchNumber ?? (startingRound === 'r16' ? baseNo + 9 + qf2Idx : baseNo + 1 + qf2Idx);
                      return (
                        <MatchupCard
                          key={m.id}
                          matchup={m}
                          stage="sf"
                          startingRound={startingRound}
                          matchIndex={idx}
                          isBracketLocked={isBracketLocked}
                          scheduleMatch={matches.find((item) => item.id === m.id)}
                          placeholder1={
                            startingRound === 'sf'
                              ? '-'
                              : `ทีมชนะ (คู่ที่ ${qf1No})`
                          }
                          placeholder2={
                            startingRound === 'sf'
                              ? '-'
                              : `ทีมชนะ (คู่ที่ ${qf2No})`
                          }
                          onOpenEditSlot={(slot) => handleOpenEditSlot('sf', idx, slot)}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Connector SF -> Final (1 SVG pair) */}
                <div className="flex flex-col min-w-[32px] sm:min-w-[48px] pt-12">
                  <div className="flex-1 flex items-center justify-center">
                    <BracketConnector />
                  </div>
                </div>
              </>
            )}

            {/* Column 3: Grand Final */}
            <div className="flex-1 flex flex-col min-w-[220px]">
              <div className="text-center pb-2 mb-4 border-b border-[#efeded]">
                <h3 className="font-display font-bold text-sm text-[#1b1c1c]">
                  นัดชิงชนะเลิศ (Grand Final)
                </h3>
                <p className="text-[11px] text-[#4b4737]">รอผลผู้ชนะเข้าสู่นัดชิงชนะเลิศ</p>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                {(() => {
                  const sf1Sm = sfMatches[0] ? matches.find((item) => item.id === sfMatches[0].id) : undefined;
                  const sf2Sm = sfMatches[1] ? matches.find((item) => item.id === sfMatches[1].id) : undefined;
                  const sf1No = sf1Sm?.matchNumber ?? (startingRound === 'r16' ? baseNo + 13 : startingRound === 'qf' ? baseNo + 5 : baseNo + 1);
                  const sf2No = sf2Sm?.matchNumber ?? (startingRound === 'r16' ? baseNo + 14 : startingRound === 'qf' ? baseNo + 6 : baseNo + 2);
                  return (
                    <MatchupCard
                      matchup={finalMatch}
                      stage="final"
                      startingRound={startingRound}
                      matchIndex={0}
                      isFinal={true}
                      isBracketLocked={isBracketLocked}
                      scheduleMatch={matches.find((item) => item.id === finalMatch.id)}
                      placeholder1={
                        startingRound === 'final'
                          ? 'ทีมชิงชนะเลิศ 1'
                          : `ทีมชนะ (คู่ที่ ${sf1No})`
                      }
                      placeholder2={
                        startingRound === 'final'
                          ? 'ทีมชิงชนะเลิศ 2'
                          : `ทีมชนะ (คู่ที่ ${sf2No})`
                      }
                      onOpenEditSlot={(slot) => handleOpenEditSlot('final', 0, slot)}
                    />
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* FOCUSED ROUND VIEW */
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-[#efeded] shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#efeded]">
            <div>
              <span className="text-xs font-bold uppercase text-[#786607] tracking-wider block">
                ข้อมูลคู่แข่งขันประจำรอบ
              </span>
              <h3 className="font-display text-xl font-bold text-[#1b1c1c] mt-0.5">
                {activeRound === 'r16' && 'รอบ 16 ทีมสุดท้าย (Round of 16)'}
                {activeRound === 'qf' && 'รอบ 8 ทีมสุดท้าย (Quarter-Finals)'}
                {activeRound === 'sf' && 'รอบรองชนะเลิศ (Semi-Finals)'}
                {activeRound === 'final' && 'นัดชิงชนะเลิศ (Grand Final)'}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeRound === 'r16' &&
              r16Matches.map((m, idx) => (
                <FocusedMatchCard
                  key={m.id}
                  matchup={m}
                  stage="r16"
                  startingRound={startingRound}
                  matchIndex={idx}
                  isBracketLocked={isBracketLocked}
                  scheduleMatch={matches.find((item) => item.id === m.id)}
                  onOpenEditSlot={(slot) => handleOpenEditSlot('r16', idx, slot)}
                />
              ))}

            {activeRound === 'qf' &&
              qfMatches.map((m, idx) => (
                <FocusedMatchCard
                  key={m.id}
                  matchup={m}
                  stage="qf"
                  startingRound={startingRound}
                  matchIndex={idx}
                  isBracketLocked={isBracketLocked}
                  scheduleMatch={matches.find((item) => item.id === m.id)}
                  onOpenEditSlot={(slot) => handleOpenEditSlot('qf', idx, slot)}
                />
              ))}

            {activeRound === 'sf' &&
              sfMatches.map((m, idx) => {
                const qf1Idx = idx * 2;
                const qf2Idx = idx * 2 + 1;
                const qf1Match = qfMatches[qf1Idx];
                const qf2Match = qfMatches[qf2Idx];
                const qf1Sm = qf1Match ? matches.find((item) => item.id === qf1Match.id) : undefined;
                const qf2Sm = qf2Match ? matches.find((item) => item.id === qf2Match.id) : undefined;
                const qf1No = qf1Sm?.matchNumber ?? (startingRound === 'r16' ? baseNo + 9 + qf1Idx : baseNo + 1 + qf1Idx);
                const qf2No = qf2Sm?.matchNumber ?? (startingRound === 'r16' ? baseNo + 9 + qf2Idx : baseNo + 1 + qf2Idx);
                return (
                  <FocusedMatchCard
                    key={m.id}
                    matchup={m}
                    stage="sf"
                    startingRound={startingRound}
                    matchIndex={idx}
                    isBracketLocked={isBracketLocked}
                    scheduleMatch={matches.find((item) => item.id === m.id)}
                    placeholder1={
                      startingRound === 'sf'
                        ? '-'
                        : `ทีมชนะ (คู่ที่ ${qf1No})`
                    }
                    placeholder2={
                      startingRound === 'sf'
                        ? '-'
                        : `ทีมชนะ (คู่ที่ ${qf2No})`
                    }
                    onOpenEditSlot={(slot) => handleOpenEditSlot('sf', idx, slot)}
                  />
                );
              })}

            {activeRound === 'final' && (
              <div className="col-span-full max-w-xl mx-auto w-full">
                {(() => {
                  const sf1Sm = sfMatches[0] ? matches.find((item) => item.id === sfMatches[0].id) : undefined;
                  const sf2Sm = sfMatches[1] ? matches.find((item) => item.id === sfMatches[1].id) : undefined;
                  const sf1No = sf1Sm?.matchNumber ?? (startingRound === 'r16' ? baseNo + 13 : startingRound === 'qf' ? baseNo + 5 : baseNo + 1);
                  const sf2No = sf2Sm?.matchNumber ?? (startingRound === 'r16' ? baseNo + 14 : startingRound === 'qf' ? baseNo + 6 : baseNo + 2);
                  return (
                    <FocusedMatchCard
                      matchup={finalMatch}
                      stage="final"
                      startingRound={startingRound}
                      matchIndex={0}
                      isFinal={true}
                      isBracketLocked={isBracketLocked}
                      scheduleMatch={matches.find((item) => item.id === finalMatch.id)}
                      placeholder1={
                        startingRound === 'final'
                          ? '-'
                          : `ทีมชนะ (คู่ที่ ${sf1No})`
                      }
                      placeholder2={
                        startingRound === 'final'
                          ? '-'
                          : `ทีมชนะ (คู่ที่ ${sf2No})`
                      }
                      onOpenEditSlot={(slot) => handleOpenEditSlot('final', 0, slot)}
                    />
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT TEAM SLOT MODAL */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#efeded] space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#efeded]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#786607]" />
                <h3 className="font-display font-bold text-base text-[#1b1c1c]">
                  ระบุทีมประจำสล็อต (Slot Assignment)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="w-8 h-8 rounded-full bg-[#f5f3f3] hover:bg-[#efeded] flex items-center justify-center text-[#4b4737]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#4b4737] block">
                1. เลือกอันดับสายการแข่งขัน (Group Seeds)
              </span>
              <div className="grid grid-cols-4 gap-2">
                {groupPresetSeeds.map((seed) => (
                  <button
                    key={seed.value}
                    type="button"
                    onClick={() => handleAssignTeamToSlot(seed.value)}
                    className="p-2.5 rounded-xl bg-[#f5f3f3] hover:bg-[#ffe680] text-xs font-semibold text-[#1b1c1c] text-center transition-all border border-[#efeded]"
                  >
                    {seed.label}
                  </button>
                ))}
              </div>
            </div>

            {teams.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#4b4737] block">
                  2. เลือกทีมจริงจากทัวร์นาเมนต์ ({teams.length} ทีม)
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleAssignTeamToSlot(t.name, t.logo || '')}
                      className="w-full p-2 rounded-xl bg-white hover:bg-[#ffe680]/40 border border-[#efeded] flex items-center gap-2 text-xs font-semibold text-[#1b1c1c] text-left transition-colors"
                    >
                      {t.logo ? (
                        <img src={t.logo} alt={t.name} className="w-5 h-5 object-contain rounded-full" />
                      ) : (
                        <Users className="w-4 h-4 text-[#786607]" />
                      )}
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-[#efeded]">
              <span className="text-xs font-bold text-[#4b4737] block">
                3. ระบุชื่อทีมแบบกำหนดเอง (Custom Name)
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTeamInput}
                  onChange={(e) => setCustomTeamInput(e.target.value)}
                  placeholder="พิมพ์ชื่อทีม..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#efeded] text-xs focus:outline-none focus:border-[#786607]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customTeamInput.trim()) {
                      handleAssignTeamToSlot(customTeamInput.trim());
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[#ffe680] hover:bg-[#fbe27c] text-[#786607] text-xs font-bold transition-all"
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
