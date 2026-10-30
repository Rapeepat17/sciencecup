import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Team,
  GroupMap,
  Match,
  BracketMatchup,
  AppMode,
  ActiveView,
  TournamentDatabaseData,
  AdminCredentials,
  TournamentItem,
  TournamentStatus,
} from './types';
import {
  INITIAL_R16_MATCHES,
  INITIAL_QF_MATCHES,
  INITIAL_SF_MATCHES,
  INITIAL_FINAL_MATCH,
} from './data/bracketData';
import {
  fetchDatabase,
  saveDatabase,
  resetDatabase as resetDbService,
  loadDatabaseSync,
  loadTournamentsListSync,
  fetchTournamentsList,
  createTournament,
  updateTournamentMeta,
  deleteTournament,
  DEFAULT_TOURNAMENT_ID,
  LOCAL_STORAGE_KEY,
} from './services/dbService';
import { supabase } from './services/supabaseClient';
import { generateInterleavedRoundRobinMatches } from './utils/fixtureGenerator';
import { calculateGroupStandings, resolveSeedFromStandings, isSeedPlaceholder } from './utils/standingsCalculator';
import { UserLayout } from './components/layout/user';
import { AdminLayout } from './components/layout/admin';
import { HomePage, StandingsPage, KnockoutPage } from './pages/user';
import {
  TournamentsPage as AdminTournamentsPage,
  DashboardPage as AdminDashboardPage,
  CreateTournamentPage as AdminCreateTournamentPage,
  TeamsPage as AdminTeamsPage,
  GroupsPage as AdminGroupsPage,
  MatchesPage as AdminMatchesPage,
  StandingsPage as AdminStandingsPage,
  BracketPage as AdminBracketPage,
  SettingsPage as AdminSettingsPage,
} from './pages/admin';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { authService } from './services/authService';
type UserTab = 'fixtures' | 'standings' | 'bracket';

const ADMIN_VIEW_HASHES: Record<ActiveView, string> = {
  'tournaments': 'tournaments',
  'tournament-hub': 'tournaments',
  'dashboard': 'dashboard',
  'create-tournament': 'create-tournament',
  'teams': 'teams',
  'groups': 'groups',
  'tournament-setup-and-groups': 'groups',
  'matches': 'matches',
  'matches-and-fixtures': 'matches',
  'standings': 'standings',
  'standings-and-leaderboard': 'standings',
  'bracket': 'bracket',
  'settings': 'settings',
  'tournament-settings': 'settings',
  'user-portal': 'fixtures',
};

const USER_TAB_HASHES: Record<UserTab, string> = {
  'fixtures': 'fixtures',
  'standings': 'standings',
  'bracket': 'user-bracket',
};

function getRouteFromLocation(): { appMode: AppMode; activeView: ActiveView; userTab: UserTab } {
  const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '').trim() : '';
  const savedAppMode = typeof localStorage !== 'undefined' ? (localStorage.getItem('scicup_app_mode') as AppMode | null) : null;
  const savedActiveView = typeof localStorage !== 'undefined' ? (localStorage.getItem('scicup_active_view') as ActiveView | null) : null;
  const savedUserTab = typeof localStorage !== 'undefined' ? (localStorage.getItem('scicup_user_tab') as UserTab | null) : null;

  if (hash) {
    if (hash === 'tournament-hub' || hash === 'tournaments' || hash === 'hub') {
      return { appMode: 'admin', activeView: 'tournaments', userTab: 'fixtures' };
    }
    if (hash === 'dashboard' || hash === 'admin-dashboard') {
      return { appMode: 'admin', activeView: 'dashboard', userTab: 'fixtures' };
    }
    if (hash === 'create-tournament') {
      return { appMode: 'admin', activeView: 'create-tournament', userTab: 'fixtures' };
    }
    if (hash === 'teams' || hash === 'admin-teams') {
      return { appMode: 'admin', activeView: 'teams', userTab: 'fixtures' };
    }
    if (hash === 'groups' || hash === 'setup' || hash === 'tournament-setup' || hash === 'tournament-setup-and-groups') {
      return { appMode: 'admin', activeView: 'groups', userTab: 'fixtures' };
    }
    if (hash === 'matches' || hash === 'admin-matches' || hash === 'matches-and-fixtures') {
      return { appMode: 'admin', activeView: 'matches', userTab: 'fixtures' };
    }
    if (hash === 'standings' || hash === 'admin-standings' || hash === 'standings-and-leaderboard') {
      return { appMode: 'admin', activeView: 'standings', userTab: 'fixtures' };
    }
    if (hash === 'bracket' || hash === 'admin-bracket') {
      return { appMode: 'admin', activeView: 'bracket', userTab: 'fixtures' };
    }
    if (hash === 'settings' || hash === 'tournament-settings') {
      return { appMode: 'admin', activeView: 'settings', userTab: 'fixtures' };
    }
    if (hash === 'fixtures' || hash === 'user-fixtures' || hash === 'user-portal') {
      return { appMode: 'user', activeView: 'user-portal', userTab: 'fixtures' };
    }
    if (hash === 'standings' || hash === 'user-standings') {
      return { appMode: 'user', activeView: 'user-portal', userTab: 'standings' };
    }
    if (hash === 'user-bracket') {
      return { appMode: 'user', activeView: 'user-portal', userTab: 'bracket' };
    }
  }

  // Fallback to localStorage
  const appMode: AppMode = savedAppMode || 'user';
  let activeView: ActiveView = savedActiveView || 'user-portal';
  if (savedActiveView && savedActiveView !== 'user-portal') {
    activeView = savedActiveView;
  }
  const userTab: UserTab = (savedUserTab && ['fixtures', 'standings', 'bracket'].includes(savedUserTab))
    ? savedUserTab
    : 'fixtures';

  return { appMode, activeView, userTab };
}

export default function App() {
  const [initialDb] = useState(() => loadDatabaseSync());

  const [initialTournaments] = useState(() => loadTournamentsListSync());
  const [tournaments, setTournaments] = useState<TournamentItem[]>(initialTournaments);
  const [currentTournamentId, setCurrentTournamentId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('scicup_current_tournament_id');
      if (stored) return stored;
    } catch {}
    return initialTournaments.length > 0 ? String(initialTournaments[0].id) : '';
  });

  const [tournamentName, setTournamentName] = useState<string>(initialDb.tournamentName || '');
  const [tournamentDescription, setTournamentDescription] = useState<string>(initialDb.description || '');
  const [tournamentLogo, setTournamentLogo] = useState<string>(initialDb.logo || '');
  const [teams, setTeams] = useState<Team[]>(initialDb.teams ?? []);
  const [groups, setGroups] = useState<GroupMap>(initialDb.groups ?? {});
  const [matches, setMatches] = useState<Match[]>(initialDb.matches ?? []);
  const [knockoutStartingRound, setKnockoutStartingRound] = useState<'r16' | 'qf' | 'sf' | 'final'>(
    initialDb.knockoutStartingRound || 'sf'
  );
  const [r16Matches, setR16Matches] = useState<BracketMatchup[]>(initialDb.r16Matches ?? INITIAL_R16_MATCHES);
  const [qfMatches, setQfMatches] = useState<BracketMatchup[]>(initialDb.qfMatches ?? INITIAL_QF_MATCHES);
  const [sfMatches, setSfMatches] = useState<BracketMatchup[]>(initialDb.sfMatches ?? INITIAL_SF_MATCHES);
  const [finalMatch, setFinalMatch] = useState<BracketMatchup>(initialDb.finalMatch ?? INITIAL_FINAL_MATCH);
  const [isBracketLocked, setIsBracketLocked] = useState<boolean>(
    initialDb.isBracketLocked !== undefined ? Boolean(initialDb.isBracketLocked) : false
  );
  const [isKnockoutCreated, setIsKnockoutCreated] = useState<boolean>(
    initialDb.isKnockoutCreated !== undefined ? Boolean(initialDb.isKnockoutCreated) : false
  );
  const [isUserPortalEnabled, setIsUserPortalEnabled] = useState<boolean>(
    initialDb.isUserPortalEnabled !== undefined ? Boolean(initialDb.isUserPortalEnabled) : true
  );
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>(
    initialDb.adminCredentials || { username: 'admin', passwordHash: '1234' }
  );

  const [initialRoute] = useState(() => getRouteFromLocation());
  const [appMode, setAppMode] = useState<AppMode>(initialRoute.appMode);
  const [activeView, setActiveView] = useState<ActiveView>(initialRoute.activeView);
  const [userPortalTab, setUserPortalTab] = useState<UserTab>(initialRoute.userTab);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return authService.isAuthenticated();
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<string>('กำลังเชื่อมต่อฐานข้อมูล...');
  const [isDbLoaded, setIsDbLoaded] = useState<boolean>(false);
  const [isOfflineFallback, setIsOfflineFallback] = useState<boolean>(false);
  const isDbLoadedRef = useRef(false);
  const initialHydratedRef = useRef(false);
  const lastJsonRef = useRef<string>('');
  const lastUpdatedAtRef = useRef<number>(initialDb.updatedAt || 0);
  const lastLocalEditTimeRef = useRef<number>(0);
  const tournamentSwitchSeqRef = useRef<number>(0);
  const currentTournamentIdRef = useRef<string>(currentTournamentId);
  const switchAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    currentTournamentIdRef.current = currentTournamentId;
  }, [currentTournamentId]);

  // Listen for JWT expiration event from apiClient
  useEffect(() => {
    const handleAuthExpired = () => {
      setIsAdminLoggedIn(false);
      if (appMode === 'admin') {
        setIsAdminLoginModalOpen(true);
      }
    };
    window.addEventListener('scicup:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('scicup:auth-expired', handleAuthExpired);
  }, [appMode]);

  const applyDatabaseData = useCallback((data: TournamentDatabaseData, isInitial: boolean = false) => {
    if (!data) return;

    if (!isInitial) {
      if (Date.now() - lastLocalEditTimeRef.current < 10000) {
        return;
      }
      if (data.updatedAt && lastUpdatedAtRef.current && data.updatedAt < lastUpdatedAtRef.current) {
        return;
      }
    }

    const jsonStr = JSON.stringify(data);
    if (!isInitial && jsonStr === lastJsonRef.current) return;
    lastJsonRef.current = jsonStr;
    if (data.updatedAt) {
      lastUpdatedAtRef.current = data.updatedAt;
    } else {
      lastUpdatedAtRef.current = Date.now();
    }

    setTournamentName(data.tournamentName || '');
    setTournamentDescription(data.description || '');
    setTournamentLogo(data.logo || '');

    if (Array.isArray(data.teams)) {
      setTeams((prevTeams) => {
        return data.teams.map((inTeam) => {
          if (!inTeam.logo) {
            const existing = prevTeams.find((pt) => String(pt.id) === String(inTeam.id));
            if (existing?.logo) {
              return { ...inTeam, logo: existing.logo };
            }
          }
          return inTeam;
        });
      });
    }

    if (data.groups && typeof data.groups === 'object') {
      setGroups(data.groups);
    }

    if (Array.isArray(data.matches)) {
      setMatches(data.matches);
    }
    if (data.knockoutStartingRound) setKnockoutStartingRound(data.knockoutStartingRound);
    if (Array.isArray(data.r16Matches)) setR16Matches(data.r16Matches);
    if (Array.isArray(data.qfMatches)) setQfMatches(data.qfMatches);
    if (Array.isArray(data.sfMatches)) setSfMatches(data.sfMatches);
    if (data.finalMatch) setFinalMatch(data.finalMatch);
    if (typeof data.isBracketLocked === 'boolean') setIsBracketLocked(data.isBracketLocked);
    if (typeof data.isKnockoutCreated === 'boolean') setIsKnockoutCreated(data.isKnockoutCreated);
    if (typeof data.isUserPortalEnabled === 'boolean') setIsUserPortalEnabled(data.isUserPortalEnabled);
    if (data.adminCredentials) setAdminCredentials(data.adminCredentials);

    if ((data as any)?._isOfflineFallback) {
      setIsOfflineFallback(true);
      setDbStatus('ใช้ข้อมูลสำรองในเครื่อง (Offline Mode)');
    } else {
      setIsOfflineFallback(false);
      setDbStatus('เชื่อมต่อฐานข้อมูลเรียบร้อยแล้ว');
    }

    setIsDbLoaded(true);
    isDbLoadedRef.current = true;
  }, []);

  const handleSelectTournament = useCallback(async (tourneyId: string) => {
    // 1. Abort previous pending fetch request if any
    if (switchAbortControllerRef.current) {
      switchAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    switchAbortControllerRef.current = controller;

    const reqSeq = ++tournamentSwitchSeqRef.current;
    setCurrentTournamentId(tourneyId);
    currentTournamentIdRef.current = tourneyId;
    try {
      localStorage.setItem('scicup_current_tournament_id', tourneyId);
    } catch {}

    // 2. Immediately purge current states to prevent previous tournament's data from lingering
    setTournamentName('');
    setTeams([]);
    setGroups({});
    setMatches([]);
    setR16Matches(INITIAL_R16_MATCHES);
    setQfMatches(INITIAL_QF_MATCHES);
    setSfMatches(INITIAL_SF_MATCHES);
    setFinalMatch(INITIAL_FINAL_MATCH);
    setIsBracketLocked(false);
    setIsKnockoutCreated(false);

    setIsDbLoaded(false);
    setDbStatus('กำลังโหลดข้อมูลรายการแข่งขัน...');

    try {
      const data = await fetchDatabase(tourneyId, controller.signal);
      // Race condition defense: discard if a newer tournament selection request was launched
      if (reqSeq !== tournamentSwitchSeqRef.current) {
        console.warn(`[handleSelectTournament] Discarding stale response for tournament "${tourneyId}"`);
        return;
      }
      if (data) {
        applyDatabaseData(data, true);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Normal cancellation when user switched again
      }
      if (reqSeq === tournamentSwitchSeqRef.current) {
        console.error('Failed to load tournament:', err);
        setDbStatus('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } finally {
      if (reqSeq === tournamentSwitchSeqRef.current) {
        setIsDbLoaded(true);
      }
    }
  }, [applyDatabaseData]);

  // Async load from cloud/local DB + 8s Safe Auto-Polling + Cross-Tab Sync
  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      const reqSeq = ++tournamentSwitchSeqRef.current;
      try {
        const tourneysList = await fetchTournamentsList();
        if (reqSeq !== tournamentSwitchSeqRef.current) return;
        if (isMounted) setTournaments(tourneysList || []);

        if (!tourneysList || tourneysList.length === 0) {
          if (isMounted) {
            setCurrentTournamentId('');
            setTournamentName('');
            setTeams([]);
            setGroups({});
            setMatches([]);
            try {
              localStorage.removeItem('scicup_current_tournament_id');
            } catch {}
          }
          return;
        }

        const effectiveId = tourneysList.some((t) => String(t.id) === String(currentTournamentId))
          ? String(currentTournamentId)
          : String(tourneysList[0].id);

        if (effectiveId !== currentTournamentId && isMounted) {
          setCurrentTournamentId(effectiveId);
          try {
            localStorage.setItem('scicup_current_tournament_id', effectiveId);
          } catch {}
        }

        const data = await fetchDatabase(effectiveId);
        if (reqSeq !== tournamentSwitchSeqRef.current) return;
        if (data && isMounted) {
          applyDatabaseData(data, true);
          initialHydratedRef.current = true;
        }
      } catch (err) {
        if (reqSeq !== tournamentSwitchSeqRef.current) return;
        console.error('Failed to load tournament data:', err);
        if (isMounted) {
          setIsOfflineFallback(true);
          setDbStatus('ใช้ข้อมูลสำรองในเครื่อง (Offline Mode)');
          const cached = loadDatabaseSync(currentTournamentId);
          if (cached && Array.isArray(cached.teams) && cached.teams.length > 0) {
            initialHydratedRef.current = true;
          }
        }
      } finally {
        if (isMounted && reqSeq === tournamentSwitchSeqRef.current) {
          setIsDbLoaded(true);
          isDbLoadedRef.current = true;
        }
      }
    };

    fetchInitial();

    // 1. Supabase Realtime WebSocket Channel Subscription (Instant score updates without heavy polling)
    let realtimeChannel: any = null;
    if (supabase) {
      try {
        realtimeChannel = supabase
          .channel('scicup_realtime_sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tournaments' },
            async () => {
              if (Date.now() - lastLocalEditTimeRef.current < 4000) return;
              const activeId = currentTournamentIdRef.current;
              const fresh = await fetchDatabase(activeId);
              if (activeId === currentTournamentIdRef.current && fresh && isMounted) applyDatabaseData(fresh);
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'matches' },
            async () => {
              if (Date.now() - lastLocalEditTimeRef.current < 4000) return;
              const activeId = currentTournamentIdRef.current;
              const fresh = await fetchDatabase(activeId);
              if (activeId === currentTournamentIdRef.current && fresh && isMounted) applyDatabaseData(fresh);
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'teams' },
            async () => {
              if (Date.now() - lastLocalEditTimeRef.current < 4000) return;
              const activeId = currentTournamentIdRef.current;
              const fresh = await fetchDatabase(activeId);
              if (activeId === currentTournamentIdRef.current && fresh && isMounted) applyDatabaseData(fresh);
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'groups' },
            async () => {
              if (Date.now() - lastLocalEditTimeRef.current < 4000) return;
              const activeId = currentTournamentIdRef.current;
              const fresh = await fetchDatabase(activeId);
              if (activeId === currentTournamentIdRef.current && fresh && isMounted) applyDatabaseData(fresh);
            }
          )
          .subscribe();
      } catch (err) {}
    }

    // 2. Safety Heartbeat Polling: 45-second interval (Backup heartbeat to drastically reduce Egress bandwidth)
    const interval = setInterval(async () => {
      try {
        if (Date.now() - lastLocalEditTimeRef.current < 10000) return;
        const activeId = currentTournamentIdRef.current;
        const fresh = await fetchDatabase(activeId);
        if (activeId === currentTournamentIdRef.current && fresh && isMounted) {
          applyDatabaseData(fresh);
        }
      } catch (err) {}
    }, 45000);

    const handleStorage = (e: StorageEvent) => {
      if ((e.key === LOCAL_STORAGE_KEY || e.key === 'scicup_database_v3') && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          applyDatabaseData(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel);
      }
      window.removeEventListener('storage', handleStorage);
    };
  }, [applyDatabaseData]);

  // Debounced Auto-save database to cloud/local whenever state updates (after initial load)
  useEffect(() => {
    if (!initialHydratedRef.current) return;
    if (appMode !== 'admin' || !authService.isAuthenticated()) return;

    lastLocalEditTimeRef.current = Date.now();
    const now = Date.now();

    const payload: TournamentDatabaseData = {
      tournamentName,
      teams,
      groups,
      matches,
      knockoutStartingRound,
      r16Matches,
      qfMatches,
      sfMatches,
      finalMatch,
      isBracketLocked,
      isKnockoutCreated,
      isUserPortalEnabled,
      adminCredentials,
      updatedAt: now,
    };

    const payloadJson = JSON.stringify(payload);
    if (payloadJson === lastJsonRef.current) return;

    // Debounce save by 400ms to batch rapid interactions
    const timer = setTimeout(() => {
      lastJsonRef.current = payloadJson;
      lastUpdatedAtRef.current = now;
      saveDatabase(payload, currentTournamentId);
    }, 400);

    return () => clearTimeout(timer);
  }, [
    appMode,
    currentTournamentId,
    tournamentName,
    teams,
    groups,
    matches,
    knockoutStartingRound,
    r16Matches,
    qfMatches,
    sfMatches,
    finalMatch,
    isBracketLocked,
    isKnockoutCreated,
    isUserPortalEnabled,
    adminCredentials,
  ]);

  // Auto-sync team changes (name, shortName, logo, etc.) across groups and matches
  useEffect(() => {
    if (!isDbLoaded || !teams || teams.length === 0) return;

    // 1. Sync Groups
    setGroups((prevGroups) => {
      let changed = false;
      const updatedGroups: GroupMap = {};

      Object.keys(prevGroups).forEach((gKey) => {
        const teamList = prevGroups[gKey] || [];
        const newTeamList = teamList.map((gTeam) => {
          const matchingTeam = teams.find(
            (t) => String(t.id) === String(gTeam.id)
          );
          if (matchingTeam) {
            const resolvedLogo = matchingTeam.logo || gTeam.logo || '';
            if (
              gTeam.name !== matchingTeam.name ||
              gTeam.shortName !== matchingTeam.shortName ||
              (matchingTeam.logo && gTeam.logo !== matchingTeam.logo) ||
              gTeam.color !== matchingTeam.color
            ) {
              changed = true;
              return {
                ...gTeam,
                name: matchingTeam.name,
                nameEn: matchingTeam.nameEn || matchingTeam.name,
                shortName: matchingTeam.shortName,
                logo: resolvedLogo,
                color: matchingTeam.color,
                badgeIcon: matchingTeam.badgeIcon,
              };
            }
          }
          return gTeam;
        });
        updatedGroups[gKey] = newTeamList;
      });

      return changed ? updatedGroups : prevGroups;
    });

    // 2. Sync Matches
    setMatches((prevMatches) => {
      let changed = false;
      const updatedMatches = prevMatches.map((m) => {
        let newT1 = m.team1;
        let newT2 = m.team2;

        const matchingT1 = teams.find(
          (t) => String(t.id) === String(m.team1?.id)
        );
        if (matchingT1) {
          if (
            m.team1.name !== matchingT1.name ||
            m.team1.shortName !== matchingT1.shortName ||
            m.team1.logo !== matchingT1.logo
          ) {
            changed = true;
            newT1 = {
              ...m.team1,
              name: matchingT1.name,
              nameEn: matchingT1.nameEn || matchingT1.name,
              shortName: matchingT1.shortName,
              logo: matchingT1.logo,
            };
          }
        }

        const matchingT2 = teams.find(
          (t) => String(t.id) === String(m.team2?.id)
        );
        if (matchingT2) {
          if (
            m.team2.name !== matchingT2.name ||
            m.team2.shortName !== matchingT2.shortName ||
            m.team2.logo !== matchingT2.logo
          ) {
            changed = true;
            newT2 = {
              ...m.team2,
              name: matchingT2.name,
              nameEn: matchingT2.nameEn || matchingT2.name,
              shortName: matchingT2.shortName,
              logo: matchingT2.logo,
            };
          }
        }

        return changed ? { ...m, team1: newT1, team2: newT2 } : m;
      });

      return changed ? updatedMatches : prevMatches;
    });
  }, [teams, isDbLoaded]);

  // Automatically pull qualified teams from group standings into knockout bracket when group matches are played/completed
  useEffect(() => {
    if (!isDbLoaded || !groups || Object.keys(groups).length === 0) return;

    const standings = calculateGroupStandings(groups, matches);
    const groupKeys = Object.keys(standings);
    if (groupKeys.length === 0) return;

    const DEFAULT_R16_SEEDS: [string, string][] = [
      ['A1', 'B2'],
      ['C1', 'D2'],
      ['B1', 'A2'],
      ['D1', 'C2'],
      ['E1', 'F2'],
      ['G1', 'H2'],
      ['F1', 'E2'],
      ['H1', 'G2'],
    ];

    const DEFAULT_QF_SEEDS: [string, string][] = [
      ['A1', 'B2'],
      ['B1', 'C2'],
      ['C1', 'A2'],
      ['D1', 'D2'],
    ];

    const DEFAULT_SF_SEEDS: [string, string][] = [
      ['A1', 'B2'],
      ['B1', 'A2'],
    ];

    const resolveMatchSeeds = (
      matchList: BracketMatchup[],
      defaultSeeds: [string, string][]
    ): { list: BracketMatchup[]; changed: boolean } => {
      let changed = false;
      const newList = matchList.map((m, idx) => {
        let t1Name = m.team1.name;
        let t1Logo = m.team1.logo || '';
        let t2Name = m.team2.name;
        let t2Logo = m.team2.logo || '';
        let itemChanged = false;

        const isT1Placeholder = isSeedPlaceholder(m.team1.name);
        const isT2Placeholder = isSeedPlaceholder(m.team2.name);

        if (isT1Placeholder) {
          const seed1Code = (m.team1.name && m.team1.name !== '-')
            ? m.team1.name
            : defaultSeeds[idx]?.[0] || 'A1';

          const res1 = resolveSeedFromStandings(seed1Code, standings, matches, { requireAllGroupMatchesFinished: true, groups });
          if (res1 && (m.team1.name !== res1.name || (m.team1.logo || '') !== res1.logo)) {
            t1Name = res1.name;
            t1Logo = res1.logo;
            itemChanged = true;
            changed = true;
          }
        }

        if (isT2Placeholder) {
          const seed2Code = (m.team2.name && m.team2.name !== '-')
            ? m.team2.name
            : defaultSeeds[idx]?.[1] || 'B2';

          const res2 = resolveSeedFromStandings(seed2Code, standings, matches, { requireAllGroupMatchesFinished: true, groups });
          if (res2 && (m.team2.name !== res2.name || (m.team2.logo || '') !== res2.logo)) {
            t2Name = res2.name;
            t2Logo = res2.logo;
            itemChanged = true;
            changed = true;
          }
        }

        if (itemChanged) {
          return {
            ...m,
            team1: { ...m.team1, name: t1Name, logo: t1Logo },
            team2: { ...m.team2, name: t2Name, logo: t2Logo },
          };
        }
        return m;
      });

      return { list: newList, changed };
    };

    const syncBracketToMatches = (bracketList: BracketMatchup[]) => {
      setMatches((prevMatches) => {
        let matchesChanged = false;
        const updated = prevMatches.map((m) => {
          const matchInBracket = bracketList.find((b) => b.id === m.id);
          if (matchInBracket) {
            if (
              m.team1.name !== matchInBracket.team1.name ||
              m.team2.name !== matchInBracket.team2.name
            ) {
              matchesChanged = true;
              return {
                ...m,
                team1: { ...m.team1, name: matchInBracket.team1.name, logo: matchInBracket.team1.logo || m.team1.logo },
                team2: { ...m.team2, name: matchInBracket.team2.name, logo: matchInBracket.team2.logo || m.team2.logo },
              };
            }
          }
          return m;
        });
        return matchesChanged ? updated : prevMatches;
      });
    };

    if (knockoutStartingRound === 'r16') {
      const { list, changed } = resolveMatchSeeds(r16Matches, DEFAULT_R16_SEEDS);
      if (changed) {
        setR16Matches(list);
        syncBracketToMatches(list);
      }
    } else if (knockoutStartingRound === 'qf') {
      const { list, changed } = resolveMatchSeeds(qfMatches, DEFAULT_QF_SEEDS);
      if (changed) {
        setQfMatches(list);
        syncBracketToMatches(list);
      }
    } else if (knockoutStartingRound === 'sf') {
      const { list, changed } = resolveMatchSeeds(sfMatches, DEFAULT_SF_SEEDS);
      if (changed) {
        setSfMatches(list);
        syncBracketToMatches(list);
      }
    }
  }, [groups, matches, knockoutStartingRound, isDbLoaded]);

  // Advance winners from finished knockout matches (R16 -> QF -> SF -> Final) & sync to matches schedule table
  useEffect(() => {
    if (!isDbLoaded || !matches || matches.length === 0) return;

    const getMatchWinnerObj = (
      bracketMatch?: BracketMatchup,
      matchId?: string
    ): { name: string; logo: string } | null => {
      const scheduleMatch = matches.find((m) => m.id === matchId);
      if (
        scheduleMatch &&
        (scheduleMatch.status === 'FT' || scheduleMatch.currentMinute === 'FT') &&
        scheduleMatch.score1 !== undefined &&
        scheduleMatch.score2 !== undefined
      ) {
        if (scheduleMatch.score1 !== scheduleMatch.score2) {
          if (scheduleMatch.score1 > scheduleMatch.score2) {
            return { name: scheduleMatch.team1.name, logo: scheduleMatch.team1.logo || '' };
          }
          if (scheduleMatch.score2 > scheduleMatch.score1) {
            return { name: scheduleMatch.team2.name, logo: scheduleMatch.team2.logo || '' };
          }
        } else if (
          scheduleMatch.penaltyScore1 !== undefined &&
          scheduleMatch.penaltyScore1 !== null &&
          scheduleMatch.penaltyScore2 !== undefined &&
          scheduleMatch.penaltyScore2 !== null &&
          scheduleMatch.penaltyScore1 !== scheduleMatch.penaltyScore2
        ) {
          if (scheduleMatch.penaltyScore1 > scheduleMatch.penaltyScore2) {
            return { name: scheduleMatch.team1.name, logo: scheduleMatch.team1.logo || '' };
          }
          if (scheduleMatch.penaltyScore2 > scheduleMatch.penaltyScore1) {
            return { name: scheduleMatch.team2.name, logo: scheduleMatch.team2.logo || '' };
          }
        }
      }

      if (bracketMatch && bracketMatch.winner) {
        if (bracketMatch.winner === 1 && bracketMatch.team1?.name && bracketMatch.team1.name !== '-') {
          return { name: bracketMatch.team1.name, logo: bracketMatch.team1.logo || '' };
        }
        if (bracketMatch.winner === 2 && bracketMatch.team2?.name && bracketMatch.team2.name !== '-') {
          return { name: bracketMatch.team2.name, logo: bracketMatch.team2.logo || '' };
        }
      }

      return null;
    };

    const getMatchLoserObj = (
      bracketMatch?: BracketMatchup,
      matchId?: string
    ): { name: string; logo: string } | null => {
      const scheduleMatch = matches.find((m) => m.id === matchId);
      if (
        scheduleMatch &&
        (scheduleMatch.status === 'FT' || scheduleMatch.currentMinute === 'FT') &&
        scheduleMatch.score1 !== undefined &&
        scheduleMatch.score2 !== undefined
      ) {
        const hasPens = scheduleMatch.penaltyScore1 !== undefined && scheduleMatch.penaltyScore1 !== null && scheduleMatch.penaltyScore2 !== undefined && scheduleMatch.penaltyScore2 !== null;
        const isT1Win = scheduleMatch.score1 > scheduleMatch.score2 || (scheduleMatch.score1 === scheduleMatch.score2 && hasPens && (scheduleMatch.penaltyScore1 || 0) > (scheduleMatch.penaltyScore2 || 0));
        const isT2Win = scheduleMatch.score2 > scheduleMatch.score1 || (scheduleMatch.score1 === scheduleMatch.score2 && hasPens && (scheduleMatch.penaltyScore2 || 0) > (scheduleMatch.penaltyScore1 || 0));

        if (isT1Win) {
          return { name: scheduleMatch.team2.name, logo: scheduleMatch.team2.logo || '' };
        }
        if (isT2Win) {
          return { name: scheduleMatch.team1.name, logo: scheduleMatch.team1.logo || '' };
        }
      }

      if (bracketMatch && bracketMatch.winner) {
        if (bracketMatch.winner === 1 && bracketMatch.team2?.name && bracketMatch.team2.name !== '-') {
          return { name: bracketMatch.team2.name, logo: bracketMatch.team2.logo || '' };
        }
        if (bracketMatch.winner === 2 && bracketMatch.team1?.name && bracketMatch.team1.name !== '-') {
          return { name: bracketMatch.team1.name, logo: bracketMatch.team1.logo || '' };
        }
      }

      return null;
    };

    let qfChanged = false;
    let sfChanged = false;
    let finalChanged = false;

    // 1. R16 -> QF
    let updatedQf = [...qfMatches];
    if (knockoutStartingRound === 'r16' && r16Matches.length === 8) {
      updatedQf = qfMatches.map((qf, idx) => {
        const m1 = r16Matches[idx * 2];
        const m2 = r16Matches[idx * 2 + 1];
        const w1 = getMatchWinnerObj(m1, m1?.id);
        const w2 = getMatchWinnerObj(m2, m2?.id);
        let qfCopy = { ...qf };
        if (w1 && (qf.team1.name !== w1.name || (qf.team1.logo || '') !== w1.logo)) {
          qfCopy.team1 = { ...qfCopy.team1, name: w1.name, logo: w1.logo };
          qfChanged = true;
        }
        if (w2 && (qf.team2.name !== w2.name || (qf.team2.logo || '') !== w2.logo)) {
          qfCopy.team2 = { ...qfCopy.team2, name: w2.name, logo: w2.logo };
          qfChanged = true;
        }
        return qfCopy;
      });
    }

    // 2. QF -> SF
    let updatedSf = [...sfMatches];
    if ((knockoutStartingRound === 'r16' || knockoutStartingRound === 'qf') && updatedQf.length === 4) {
      updatedSf = sfMatches.map((sf, idx) => {
        const m1 = updatedQf[idx * 2];
        const m2 = updatedQf[idx * 2 + 1];
        const w1 = getMatchWinnerObj(m1, m1?.id);
        const w2 = getMatchWinnerObj(m2, m2?.id);
        let sfCopy = { ...sf };
        if (w1 && (sf.team1.name !== w1.name || (sf.team1.logo || '') !== w1.logo)) {
          sfCopy.team1 = { ...sfCopy.team1, name: w1.name, logo: w1.logo };
          sfChanged = true;
        }
        if (w2 && (sf.team2.name !== w2.name || (sf.team2.logo || '') !== w2.logo)) {
          sfCopy.team2 = { ...sfCopy.team2, name: w2.name, logo: w2.logo };
          sfChanged = true;
        }
        return sfCopy;
      });
    }

    // 3. SF -> Final & 3rd Place
    let updatedFinal = { ...finalMatch };
    let l1: { name: string; logo: string } | null = null;
    let l2: { name: string; logo: string } | null = null;
    if (updatedSf.length === 2) {
      const m1 = updatedSf[0];
      const m2 = updatedSf[1];
      const w1 = getMatchWinnerObj(m1, m1?.id);
      const w2 = getMatchWinnerObj(m2, m2?.id);
      l1 = getMatchLoserObj(m1, m1?.id);
      l2 = getMatchLoserObj(m2, m2?.id);

      if (w1 && (finalMatch.team1.name !== w1.name || (finalMatch.team1.logo || '') !== w1.logo)) {
        updatedFinal.team1 = { ...updatedFinal.team1, name: w1.name, logo: w1.logo };
        finalChanged = true;
      }
      if (w2 && (finalMatch.team2.name !== w2.name || (finalMatch.team2.logo || '') !== w2.logo)) {
        updatedFinal.team2 = { ...updatedFinal.team2, name: w2.name, logo: w2.logo };
        finalChanged = true;
      }
    }

    if (qfChanged) setQfMatches(updatedQf);
    if (sfChanged) setSfMatches(updatedSf);
    if (finalChanged) setFinalMatch(updatedFinal);

    // 4. Sync updated bracket match teams directly into `matches` schedule
    if (isKnockoutCreated) {
      const activeBracketList: BracketMatchup[] =
        knockoutStartingRound === 'r16'
          ? [...r16Matches, ...updatedQf, ...updatedSf, updatedFinal]
          : knockoutStartingRound === 'qf'
            ? [...updatedQf, ...updatedSf, updatedFinal]
            : knockoutStartingRound === 'sf'
              ? [...updatedSf, updatedFinal]
              : [updatedFinal];

      setMatches((prevMatches) => {
        let matchesChanged = false;

        const isAlreadyPresent = (bMatch: BracketMatchup) => {
          const bNum = (bMatch as any).matchNumber;
          return prevMatches.some(
            (m) =>
              m.id === bMatch.id ||
              m.id === `bracket_${bMatch.id}` ||
              (bNum && Number(m.matchNumber) === Number(bNum)) ||
              (m.round && bMatch.roundName && m.round === bMatch.roundName && Number(m.matchNumber) === Number(bNum))
          );
        };

        const missingBracketMatches: Match[] = [];

        const baseGroupMatchNumber = prevMatches
          .filter((m) => m.group !== 'Knockout' && !m.group?.includes('น็อคเอาท์'))
          .reduce((max, m) => Math.max(max, m.matchNumber || 0), 0);

        activeBracketList.forEach((bMatch, bIdx) => {
          if (!isAlreadyPresent(bMatch)) {
            matchesChanged = true;
            missingBracketMatches.push({
              id: bMatch.id,
              matchNumber: (bMatch as any).matchNumber || (baseGroupMatchNumber + 1 + bIdx),
              matchday: 1,
              round: bMatch.roundName || 'รอบน็อคเอาท์',
              group: 'Knockout',
              team1: { id: (bMatch.team1 as any)?.id || `t-${bMatch.id}-1`, name: bMatch.team1?.name || '-', logo: bMatch.team1?.logo || '' },
              team2: { id: (bMatch.team2 as any)?.id || `t-${bMatch.id}-2`, name: bMatch.team2?.name || '-', logo: bMatch.team2?.logo || '' },
              score1: bMatch.team1?.score ?? 0,
              score2: bMatch.team2?.score ?? 0,
              status: bMatch.winner ? 'FT' : 'UPCOMING',
              statusLabel: bMatch.winner ? 'จบเกมส์' : 'ยังไม่เริ่ม',
              dateStr: bMatch.date || 'TBD',
              timeStr: bMatch.time || '',
              venue: bMatch.venue || 'สนาม 1',
            });
          }
        });

        const updatedMatches = prevMatches.map((m) => {
          if (m.id === 'third_place') {
            let t1 = m.team1;
            let t2 = m.team2;
            let tpChanged = false;
            if (l1 && l1.name && l1.name !== '-' && l1.name !== m.team1.name) {
              t1 = { ...m.team1, name: l1.name, logo: l1.logo || m.team1.logo };
              tpChanged = true;
            }
            if (l2 && l2.name && l2.name !== '-' && l2.name !== m.team2.name) {
              t2 = { ...m.team2, name: l2.name, logo: l2.logo || m.team2.logo };
              tpChanged = true;
            }
            if (tpChanged) {
              matchesChanged = true;
              return { ...m, team1: t1, team2: t2 };
            }
            return m;
          }

          const bMatch = activeBracketList.find(
            (b) => b.id === m.id || `bracket_${b.id}` === m.id || ((b as any).matchNumber && Number((b as any).matchNumber) === Number(m.matchNumber))
          );
          if (bMatch) {
            let t1 = m.team1;
            let t2 = m.team2;
            let changed = false;
            if (bMatch.team1?.name && bMatch.team1.name !== '-' && bMatch.team1.name !== m.team1.name) {
              t1 = { ...m.team1, name: bMatch.team1.name, logo: bMatch.team1.logo || m.team1.logo };
              changed = true;
            }
            if (bMatch.team2?.name && bMatch.team2.name !== '-' && bMatch.team2.name !== m.team2.name) {
              t2 = { ...m.team2, name: bMatch.team2.name, logo: bMatch.team2.logo || m.team2.logo };
              changed = true;
            }
            if (changed) {
              matchesChanged = true;
              return { ...m, team1: t1, team2: t2 };
            }
          }
          return m;
        });

        // Always deduplicate by matchNumber
        const dedupedFinal: Match[] = [];
        const seenFinalNums = new Set<number>();
        const candidateList = matchesChanged
          ? [...updatedMatches, ...missingBracketMatches]
          : prevMatches;

        for (const cand of candidateList) {
          const num = Number(cand.matchNumber);
          if (num > 0) {
            if (seenFinalNums.has(num)) continue;
            seenFinalNums.add(num);
          }
          dedupedFinal.push(cand);
        }

        return dedupedFinal;
      });
    }
  }, [matches, r16Matches, qfMatches, sfMatches, finalMatch, knockoutStartingRound, isKnockoutCreated, isDbLoaded]);

  const handleResetDatabase = async () => {
    const now = Date.now();
    lastLocalEditTimeRef.current = now;
    lastUpdatedAtRef.current = now;
    lastJsonRef.current = '';
    await resetDbService(currentTournamentId);
    setTournamentName(currentTournamentId === DEFAULT_TOURNAMENT_ID ? 'SCI CUP 2026' : 'รายการแข่งขัน');
    setTeams([]);
    setGroups({});
    setMatches([]);
    setKnockoutStartingRound('sf');
    setR16Matches(INITIAL_R16_MATCHES);
    setQfMatches(INITIAL_QF_MATCHES);
    setSfMatches(INITIAL_SF_MATCHES);
    setFinalMatch(INITIAL_FINAL_MATCH);
    setIsBracketLocked(false);
    setIsKnockoutCreated(false);
    setDbStatus('รีเซ็ตฐานข้อมูลเรียบร้อยแล้ว');
  };

  const handleCreateTournament = useCallback(async (meta: {
    name: string;
    status: TournamentStatus;
    startDate?: string;
    endDate?: string;
    description?: string;
  }) => {
    const newTourney = await createTournament(meta);
    const freshList = await fetchTournamentsList();
    setTournaments(freshList);
    await handleSelectTournament(newTourney.id);
    navigateToAdminView('tournament-setup-and-groups');
  }, [handleSelectTournament]);

  const handleUpdateTournament = useCallback(async (
    tourneyId: string,
    meta: Partial<TournamentItem>
  ) => {
    await updateTournamentMeta(tourneyId, meta);
    const freshList = await fetchTournamentsList();
    setTournaments(freshList);
    if (tourneyId === currentTournamentId && meta.name) {
      setTournamentName(meta.name);
    }
  }, [currentTournamentId]);

  const handleDeleteTournament = useCallback(async (tourneyId: string) => {
    await deleteTournament(tourneyId);
    const freshList = await fetchTournamentsList();
    setTournaments(freshList);
    if (tourneyId === currentTournamentId) {
      const nextId = freshList && freshList.length > 0 ? freshList[0].id : '';
      if (nextId) {
        await handleSelectTournament(nextId);
      } else {
        setCurrentTournamentId('');
        setTournamentName('');
      }
    }
  }, [currentTournamentId, handleSelectTournament]);

  // Synchronize route state when location hash changes (browser back/forward or typing URL)
  useEffect(() => {
    const handleHashChange = () => {
      const route = getRouteFromLocation();
      setAppMode(route.appMode);
      setActiveView(route.activeView);
      setUserPortalTab(route.userTab);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigateToAdminView = (view: ActiveView) => {
    if (view === 'user-portal') {
      navigateToUserTab(userPortalTab);
      return;
    }
    setAppMode('admin');
    setActiveView(view);
    try {
      localStorage.setItem('scicup_app_mode', 'admin');
      localStorage.setItem('scicup_active_view', view);
    } catch {}
    const targetHash = ADMIN_VIEW_HASHES[view] || view;
    if (typeof window !== 'undefined' && window.location.hash !== `#${targetHash}`) {
      window.history.replaceState(null, '', `#${targetHash}`);
    }
  };

  const navigateToUserTab = (tab: UserTab) => {
    setAppMode('user');
    setActiveView('user-portal');
    setUserPortalTab(tab);
    try {
      localStorage.setItem('scicup_app_mode', 'user');
      localStorage.setItem('scicup_active_view', 'user-portal');
      localStorage.setItem('scicup_user_tab', tab);
    } catch {}
    const targetHash = USER_TAB_HASHES[tab] || tab;
    if (typeof window !== 'undefined' && window.location.hash !== `#${targetHash}`) {
      window.history.replaceState(null, '', `#${targetHash}`);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setIsAdminLoginModalOpen(false);
    navigateToAdminView('dashboard');
  };

  const handleAdminLogout = async () => {
    await authService.logout();
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem('scicup_is_admin');
    } catch {}
    navigateToUserTab('fixtures');
  };

  const handleSyncKnockoutToMatches = useCallback((knockoutList: Match[]) => {
    setMatches((prevMatches) => {
      const groupMatches = prevMatches.filter(
        (m) => m.group !== 'Knockout' && !m.group?.includes('น็อคเอาท์')
      );

      if (!knockoutList || knockoutList.length === 0) {
        return groupMatches;
      }

      const mergedKnockout = knockoutList.map((kMatch) => {
        const existing = prevMatches.find((m) => m.id === kMatch.id);
        if (existing) {
          return {
            ...kMatch,
            score1: existing.score1 ?? kMatch.score1,
            score2: existing.score2 ?? kMatch.score2,
            penaltyScore1: existing.penaltyScore1 ?? kMatch.penaltyScore1,
            penaltyScore2: existing.penaltyScore2 ?? kMatch.penaltyScore2,
            status: existing.status ?? kMatch.status,
            statusLabel: existing.statusLabel ?? kMatch.statusLabel,
            currentMinute: existing.currentMinute ?? kMatch.currentMinute,
            cardsT1: existing.cardsT1 ?? kMatch.cardsT1,
            cardsT2: existing.cardsT2 ?? kMatch.cardsT2,
            goalPlayers1: existing.goalPlayers1 ?? kMatch.goalPlayers1,
            goalPlayers2: existing.goalPlayers2 ?? kMatch.goalPlayers2,
            goalDetails1: existing.goalDetails1 ?? kMatch.goalDetails1,
            goalDetails2: existing.goalDetails2 ?? kMatch.goalDetails2,
            events: existing.events ?? kMatch.events,
            dateStr: existing.dateStr || kMatch.dateStr,
            timeStr: existing.timeStr || kMatch.timeStr,
            venue: existing.venue || kMatch.venue,
          };
        }
        return kMatch;
      });

      return [...groupMatches, ...mergedKnockout];
    });
  }, []);

  const handleSaveBracketData = useCallback(async (bracketData?: {
    knockoutStartingRound?: 'r16' | 'qf' | 'sf' | 'final';
    r16Matches?: BracketMatchup[];
    qfMatches?: BracketMatchup[];
    sfMatches?: BracketMatchup[];
    finalMatch?: BracketMatchup;
    isBracketLocked?: boolean;
    isKnockoutCreated?: boolean;
    knockoutMatchesList?: Match[];
  }) => {
    const updatedRound = bracketData?.knockoutStartingRound ?? knockoutStartingRound;
    const updatedR16 = bracketData?.r16Matches ?? r16Matches;
    const updatedQf = bracketData?.qfMatches ?? qfMatches;
    const updatedSf = bracketData?.sfMatches ?? sfMatches;
    const updatedFinal = bracketData?.finalMatch ?? finalMatch;
    const updatedLocked = bracketData?.isBracketLocked ?? isBracketLocked;
    const updatedCreated = bracketData?.isKnockoutCreated ?? isKnockoutCreated;

    if (bracketData?.knockoutStartingRound) setKnockoutStartingRound(bracketData.knockoutStartingRound);
    if (bracketData?.r16Matches) setR16Matches(bracketData.r16Matches);
    if (bracketData?.qfMatches) setQfMatches(bracketData.qfMatches);
    if (bracketData?.sfMatches) setSfMatches(bracketData.sfMatches);
    if (bracketData?.finalMatch) setFinalMatch(bracketData.finalMatch);
    if (bracketData?.isBracketLocked !== undefined) setIsBracketLocked(bracketData.isBracketLocked);
    if (bracketData?.isKnockoutCreated !== undefined) setIsKnockoutCreated(bracketData.isKnockoutCreated);

    let mergedMatches = matches;
    if (bracketData?.knockoutMatchesList) {
      const groupMatches = matches.filter(
        (m) => m.group !== 'Knockout' && !m.group?.includes('น็อคเอาท์')
      );
      const mergedKnockout = bracketData.knockoutMatchesList.map((kMatch) => {
        const existing = matches.find((m) => m.id === kMatch.id);
        if (existing) {
          return {
            ...kMatch,
            score1: existing.score1 ?? kMatch.score1,
            score2: existing.score2 ?? kMatch.score2,
            penaltyScore1: existing.penaltyScore1 ?? kMatch.penaltyScore1,
            penaltyScore2: existing.penaltyScore2 ?? kMatch.penaltyScore2,
            status: existing.status ?? kMatch.status,
            statusLabel: existing.statusLabel ?? kMatch.statusLabel,
            currentMinute: existing.currentMinute ?? kMatch.currentMinute,
            cardsT1: existing.cardsT1 ?? kMatch.cardsT1,
            cardsT2: existing.cardsT2 ?? kMatch.cardsT2,
            goalPlayers1: existing.goalPlayers1 ?? kMatch.goalPlayers1,
            goalPlayers2: existing.goalPlayers2 ?? kMatch.goalPlayers2,
            goalDetails1: existing.goalDetails1 ?? kMatch.goalDetails1,
            goalDetails2: existing.goalDetails2 ?? kMatch.goalDetails2,
            events: existing.events ?? kMatch.events,
            dateStr: existing.dateStr || kMatch.dateStr,
            timeStr: existing.timeStr || kMatch.timeStr,
            venue: existing.venue || kMatch.venue,
          };
        }
        return kMatch;
      });
      mergedMatches = [...groupMatches, ...mergedKnockout];
      setMatches(mergedMatches);
    }

    const now = Date.now();
    lastLocalEditTimeRef.current = now;
    lastUpdatedAtRef.current = now;

    const payload: TournamentDatabaseData = {
      tournamentName,
      teams,
      groups,
      matches: mergedMatches,
      knockoutStartingRound: updatedRound,
      r16Matches: updatedR16,
      qfMatches: updatedQf,
      sfMatches: updatedSf,
      finalMatch: updatedFinal,
      isBracketLocked: updatedLocked,
      isKnockoutCreated: updatedCreated,
      updatedAt: now,
    };

    lastJsonRef.current = JSON.stringify(payload);
    const success = await saveDatabase(payload, currentTournamentId);
    return success;
  }, [
    currentTournamentId,
    knockoutStartingRound,
    r16Matches,
    qfMatches,
    sfMatches,
    finalMatch,
    isBracketLocked,
    isKnockoutCreated,
    matches,
    tournamentName,
    teams,
    groups,
  ]);

  const handleSaveTournamentAndProceed = async () => {
    const groupKeys = Object.keys(groups);
    const validGroupKeys = groupKeys.filter((k) => (groups[k] || []).length >= 2);

    let currentMatches = matches;
    if (validGroupKeys.length > 0) {
      const generated = generateInterleavedRoundRobinMatches(groups);
      if (generated.length > 0) {
        const existingKnockout = matches.filter(
          (m) => m.group === 'Knockout' || m.group?.includes('น็อคเอาท์')
        );
        const combined = [...generated, ...existingKnockout];
        setMatches(combined);
        currentMatches = combined;
      }
    }
    const now = Date.now();
    lastLocalEditTimeRef.current = now;
    lastUpdatedAtRef.current = now;

    const payload: TournamentDatabaseData = {
      tournamentName,
      teams,
      groups,
      matches: currentMatches,
      knockoutStartingRound,
      r16Matches,
      qfMatches,
      sfMatches,
      finalMatch,
      isBracketLocked,
      isKnockoutCreated,
      updatedAt: now,
    };
    lastJsonRef.current = JSON.stringify(payload);
    await saveDatabase(payload, currentTournamentId);
    navigateToAdminView('matches-and-fixtures');
  };

  const handleClearAllTeams = async () => {
    const now = Date.now();
    lastLocalEditTimeRef.current = now;
    lastUpdatedAtRef.current = now;
    setTeams([]);
    setGroups({});
    setMatches([]);
    const payload: TournamentDatabaseData = {
      tournamentName,
      teams: [],
      groups: {},
      matches: [],
      knockoutStartingRound,
      r16Matches,
      qfMatches,
      sfMatches,
      finalMatch,
      isBracketLocked,
      isKnockoutCreated,
      updatedAt: now,
    };
    lastJsonRef.current = JSON.stringify(payload);
    await saveDatabase(payload, currentTournamentId);
  };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1b1c1c] font-sans antialiased flex flex-col selection:bg-[#ffe680] selection:text-[#786607]">
      {/* Loading Overlay */}
      {!isDbLoaded && (
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex items-center gap-3 animate-fadeIn">
            <Loader2 className="w-6 h-6 text-[#786607] animate-spin" />
            <span className="text-sm font-semibold text-gray-700">{dbStatus}</span>
          </div>
        </div>
      )}
      {appMode === 'admin' ? (
        <AdminLayout
          activeView={activeView}
          setActiveView={navigateToAdminView}
          tournamentName={tournamentName}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSwitchToUser={() => navigateToUserTab(userPortalTab)}
          onAdminLogout={handleAdminLogout}
          teamsCount={teams.length}
          isUserPortalEnabled={isUserPortalEnabled}
          onSwitchTournament={() => navigateToAdminView('tournaments')}
          headerProps={{
            dbStatus,
            isAdminLoggedIn,
            onOpenAdminLogin: () => setIsAdminLoginModalOpen(true),
          }}
        >
          {/* เชื่อมต่อ 9 หน้าแอดมิน */}
          {(activeView === 'tournaments' || activeView === 'tournament-hub') && (
            <AdminTournamentsPage
              tournaments={tournaments}
              currentTournamentId={currentTournamentId}
              onSelectTournament={handleSelectTournament}
              onUpdateTournament={handleUpdateTournament}
              onDeleteTournament={handleDeleteTournament}
              onNavigateToCreate={() => navigateToAdminView('create-tournament')}
              onNavigateToDashboard={() => navigateToAdminView('dashboard')}
              onOpenUserPortal={() => navigateToUserTab(userPortalTab)}
            />
          )}
          {activeView === 'dashboard' && (
            <AdminDashboardPage
              currentTournamentId={currentTournamentId}
              tournamentName={tournamentName}
              onNavigate={(view) => navigateToAdminView(view as any)}
            />
          )}
          {activeView === 'create-tournament' && <AdminCreateTournamentPage />}
          {activeView === 'teams' && (
            <AdminTeamsPage
              currentTournamentId={currentTournamentId}
              tournamentName={tournamentName}
              onSelectTournament={() => navigateToAdminView('tournaments')}
            />
          )}
          {(activeView === 'groups' || activeView === 'tournament-setup-and-groups') && (
            <AdminGroupsPage
              currentTournamentId={currentTournamentId}
              tournamentName={tournamentName}
            />
          )}
          {(activeView === 'matches' || activeView === 'matches-and-fixtures') && (
            <AdminMatchesPage
              currentTournamentId={currentTournamentId}
              tournamentName={tournamentName}
            />
          )}
          {(activeView === 'standings' || activeView === 'standings-and-leaderboard') && (
            <AdminStandingsPage
              currentTournamentId={currentTournamentId}
              tournamentName={tournamentName}
            />
          )}
          {activeView === 'bracket' && (
            <AdminBracketPage
              currentTournamentId={currentTournamentId}
              tournamentName={tournamentName}
            />
          )}
          {(activeView === 'settings' || activeView === 'tournament-settings') && <AdminSettingsPage />}
        </AdminLayout>
      ) : !isUserPortalEnabled && !isAdminLoggedIn ? (
        /* User Portal Closed / Maintenance View */
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#efeded] shadow-lg space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-3xl bg-[#ffe680]/30 border-2 border-[#ffe680] flex items-center justify-center p-3">
                <img
                  src="/science_cup_logo.png"
                  alt="Logo"
                  className="w-full h-full object-contain drop-shadow-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                {tournamentName || 'SCI CUP'}
              </span>
              <h2 className="font-display text-2xl font-bold text-[#1b1c1c]">
                ไม่มีโปรแกรมการแข่งขัน
              </h2>
              <p className="text-sm text-[#4b4737] leading-relaxed">
                ขณะนี้ยังไม่มีโปรแกรมหรือตารางการแข่งขัน กรุณาติดตามข้อมูลอัปเดตอีกครั้งในภายหลัง
              </p>
            </div>
            <div className="pt-4 border-t border-[#efeded]">
              <button
                type="button"
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="w-full py-3 px-4 rounded-2xl bg-[#ffe680] hover:bg-[#fbe27c] text-[#786607] font-display font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>เข้าสู่ระบบผู้ดูแล (Admin Login)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col min-h-screen">
          {!isUserPortalEnabled && isAdminLoggedIn && (
            <div className="bg-amber-100 border-b border-amber-300 px-4 py-2.5 text-xs text-amber-900 font-medium flex items-center justify-between gap-3 sticky top-0 z-50">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse"></span>
                <span className="truncate">
                  <strong>โหมดผู้ดูแลระบบ:</strong> หน้าผู้ชมถูกตั้งค่าเป็น <strong>"ปิด"</strong> อยู่ (ผู้ชมทั่วไปจะเห็นข้อความ "ไม่มีโปรแกรมการแข่งขัน")
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigateToAdminView('tournament-settings')}
                className="shrink-0 px-3 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold transition-colors cursor-pointer text-[11px]"
              >
                ไปที่หน้าตั้งค่า
              </button>
            </div>
          )}
          <UserLayout
            activeTab={userPortalTab}
            onTabChange={navigateToUserTab}
            onAdminClick={() => {
              if (isAdminLoggedIn) {
                navigateToAdminView('dashboard');
              } else {
                setIsAdminLoginModalOpen(true);
              }
            }}
            title={tournamentName}
            subtitle={tournamentDescription}
            logoUrl={tournamentLogo || '/science_cup_logo.png'}
          >
            {userPortalTab === 'fixtures' && (
              <HomePage
                tournamentId={currentTournamentId}
              />
            )}
            {userPortalTab === 'standings' && (
              <StandingsPage
                tournamentId={currentTournamentId}
                groups={groups}
                matches={matches}
                teams={teams}
              />
            )}
            {userPortalTab === 'bracket' && (
              <KnockoutPage
                tournamentId={currentTournamentId}
                tournamentName={tournamentName}
                startingRound={knockoutStartingRound}
                qfMatches={qfMatches}
                sfMatches={sfMatches}
                finalMatch={finalMatch}
              />
            )}
          </UserLayout>
        </div>
      )}

      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
        adminCredentials={adminCredentials}
      />
    </div>
  );
}
