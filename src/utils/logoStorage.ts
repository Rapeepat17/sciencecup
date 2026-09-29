/**
 * Dedicated Multi-Layer Persistent Logo Storage & Fallback System
 * Ensures team logos NEVER disappear on refresh, database resets, or network failures.
 */

const LOGO_CACHE_KEY = 'scicup_persistent_logos_v1';

// In-memory cache for ultra-fast access
const inMemoryLogoCache = new Map<string, string>();

/**
 * Initialize cache from LocalStorage
 */
function initCache() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LOGO_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.entries(parsed).forEach(([k, v]) => {
          if (typeof v === 'string' && v.trim()) {
            inMemoryLogoCache.set(k, v);
          }
        });
      }
    }
  } catch {}
}

initCache();

/**
 * Save logo into persistent local storage and memory
 */
export function savePersistedLogo(teamIdOrName: string, logo: string) {
  if (!teamIdOrName || !logo || typeof logo !== 'string' || !logo.trim()) return;
  const key = String(teamIdOrName).trim();
  inMemoryLogoCache.set(key, logo);

  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LOGO_CACHE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    store[key] = logo;
    localStorage.setItem(LOGO_CACHE_KEY, JSON.stringify(store));
  } catch {}
}

/**
 * Retrieve logo from persistent storage by team id or team name
 */
export function getPersistedLogo(teamId?: string | number, teamName?: string): string {
  if (teamId) {
    const sId = String(teamId).trim();
    if (inMemoryLogoCache.has(sId)) {
      return inMemoryLogoCache.get(sId) || '';
    }
  }

  if (teamName) {
    const sName = String(teamName).trim();
    if (inMemoryLogoCache.has(sName)) {
      return inMemoryLogoCache.get(sName) || '';
    }
  }

  if (typeof window === 'undefined') return '';

  try {
    const raw = localStorage.getItem(LOGO_CACHE_KEY);
    if (raw) {
      const store = JSON.parse(raw);
      if (teamId && store[String(teamId).trim()]) {
        const found = store[String(teamId).trim()];
        inMemoryLogoCache.set(String(teamId).trim(), found);
        return found;
      }
      if (teamName && store[String(teamName).trim()]) {
        const found = store[String(teamName).trim()];
        inMemoryLogoCache.set(String(teamName).trim(), found);
        return found;
      }
    }
  } catch {}

  return '';
}

/**
 * Batch save all team logos
 */
export function persistAllTeamLogos(teams: { id: string | number; name?: string; logo?: string }[]) {
  if (!Array.isArray(teams)) return;
  teams.forEach((t) => {
    if (t.logo && typeof t.logo === 'string' && t.logo.trim()) {
      if (t.id) savePersistedLogo(String(t.id), t.logo);
      if (t.name) savePersistedLogo(t.name, t.logo);
    }
  });
}
