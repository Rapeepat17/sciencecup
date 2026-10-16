# SCI CUP Backend API v1 Specification & Inventory
**Version:** 1.0.0 (REST API /api/v1)  
**Base URL:** `http://localhost:3001/api/v1`  
**Architecture:** 3-Tier Multi-Tournament Architecture  
**Database:** Supabase PostgreSQL (Single Source of Truth)

---

## 1. Overview & Security Rules

1. **API Versioning:** All endpoints are standardized under the `/api/v1` prefix. Backward compatibility with `/api/db` is preserved.
2. **Authentication:**
   - Protected routes require `Authorization: Bearer <token>` (Supabase Auth JWT).
   - In local dev/test mode, `dev_admin_token` or `1234` is accepted.
3. **Cross-Tournament Isolation:**
   - Every tournament-scoped request validates that `:tournamentId` exists.
   - Resource existence checks verify that `:teamId`, `:matchId`, and `:playerId` actually belong to `:tournamentId`. If a resource belongs to another tournament, the request is immediately rejected with `400 Bad Request` (`CROSS_TOURNAMENT_MISMATCH`).
   - PostgreSQL trigger `trg_check_match_teams` rejects cross-tournament pairings at the database layer.
4. **Secret Key Safety:**
   - `SUPABASE_SERVICE_ROLE_KEY` is confined to server-side only and never logged or sent to clients.
5. **Rate Limiting:**
   - In-memory rate limiting at 120 req/min per client IP. Returns `429 Too Many Requests` when exceeded.

---

## 2. Full API Inventory Matrix
Connecting: **UI Action $\rightarrow$ API Endpoint $\rightarrow$ Backend Service $\rightarrow$ Database**

| UI Action | Method | API Endpoint | Backend Service | Database Table | Auth & Role | Error Cases |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **System Health Check** | `GET` | `/api/v1/health` | `testSupabaseConnection` | `tournaments` (ping) | Public | 503 Service Unavailable |
| **View Tournament Hub** | `GET` | `/api/v1/tournaments` | `tournamentService.getAllTournaments` | `tournaments` | Public | 500 Database Error |
| **Create Tournament Modal** | `POST` | `/api/v1/tournaments` | `tournamentService.createTournament` | `tournaments` | Admin / Global | 400 Validation, 401 Unauthorized, 409 Conflict |
| **Select Active Tournament** | `GET` | `/api/v1/tournaments/:id` | `tournamentService.getTournamentById` | `tournaments` | Public | 400 Bad ID, 404 Not Found |
| **Edit Tournament Settings** | `PATCH` | `/api/v1/tournaments/:id` | `tournamentService.updateTournament` | `tournaments` | Admin / Owner | 400 Validation, 401 Unauthorized, 403 Forbidden, 404 Not Found |
| **Delete Tournament Modal** | `DELETE` | `/api/v1/tournaments/:id` | `tournamentService.deleteTournament` | `tournaments` (Cascade) | Owner | 400 Protected Default, 401 Unauthorized, 403 Forbidden |
| **View Teams & Logos** | `GET` | `/api/v1/tournaments/:id/teams` | `teamService.getTeams` | `teams` | Public | 400 Bad ID, 404 Not Found |
| **Add Team Modal** | `POST` | `/api/v1/tournaments/:id/teams` | `teamService.createTeam` | `teams` | Admin / Owner | 400 Validation, 401 Unauthorized, 403 Forbidden, 409 Duplicate ID |
| **Edit Team Details** | `PATCH` | `/api/v1/tournaments/:id/teams/:teamId` | `teamService.updateTeam` | `teams` | Admin / Owner | 400 Cross-tournament, 401 Unauthorized, 403 Forbidden, 404 Not Found |
| **Delete Team** | `DELETE` | `/api/v1/tournaments/:id/teams/:teamId` | `teamService.deleteTeam` | `teams`, `players` | Admin / Owner | 400 Cross-tournament, 401 Unauthorized, 403 Forbidden |
| **View Groups Overview** | `GET` | `/api/v1/tournaments/:id/groups` | `tournamentService.getGroups` | `teams` | Public | 400 Bad ID, 404 Not Found |
| **View Fixture List** | `GET` | `/api/v1/tournaments/:id/matches` | `matchService.getMatches` | `matches` | Public | 400 Bad ID, 404 Not Found |
| **Create Fixture Modal** | `POST` | `/api/v1/tournaments/:id/matches` | `matchService.createMatch` | `matches` | Admin / Owner | 400 Cross-tournament Team, 401 Unauthorized, 403 Forbidden |
| **Edit Match Schedule** | `PATCH` | `/api/v1/tournaments/:id/matches/:matchId` | `matchService.updateMatchScore` | `matches` | Admin / Scorekeeper | 400 Cross-tournament Match, 401 Unauthorized, 403 Forbidden, 404 Not Found |
| **Record Match Score** | `PATCH` | `/api/v1/tournaments/:id/matches/:matchId/result` | `matchService.updateMatchScore` | `matches` | Admin / Scorekeeper | 400 Negative Score, 401 Unauthorized, 403 Forbidden, 404 Not Found |
| **View Group Standings** | `GET` | `/api/v1/tournaments/:id/standings` | `matchService.getGroupStandings` | `matches`, `teams` | Public | 400 Bad ID, 404 Not Found |
| **View Knockout Bracket** | `GET` | `/api/v1/tournaments/:id/bracket` | `tournamentService.getBracket` | `tournaments.bracket_data`| Public | 400 Bad ID, 404 Not Found |
| **Save/Lock Bracket** | `PATCH` | `/api/v1/tournaments/:id/bracket` | `tournamentService.updateBracket` | `tournaments.bracket_data`| Admin / Owner | 400 Validation, 401 Unauthorized, 403 Forbidden |
| **View Team Players** | `GET` | `/api/v1/tournaments/:id/players` | `playerService.getPlayers` | `players` | Public | 400 Bad ID, 404 Not Found |
| **Add Player Modal** | `POST` | `/api/v1/tournaments/:id/players` | `playerService.createPlayer` | `players` | Admin / Owner | 400 Cross-tournament Team, 401 Unauthorized, 403 Forbidden |
| **Delete Player** | `DELETE` | `/api/v1/tournaments/:id/players/:playerId`| `playerService.deletePlayer` | `players` | Admin / Owner | 400 Cross-tournament, 401 Unauthorized, 403 Forbidden |
| **View Match Events** | `GET` | `/api/v1/tournaments/:id/matches/:matchId/events` | `matchService.getMatchEvents` | `match_events` | Public | 400 Cross-tournament, 404 Not Found |
| **Upload Team Badge** | `POST` | `/api/v1/tournaments/:id/images/upload` | `imageService.uploadAndSaveTeamLogo` | Supabase Storage (`team-logos`) | Admin / Owner | 400 Bad Base64, 401 Unauthorized, 403 Forbidden |
| **Delete Team Badge** | `DELETE` | `/api/v1/tournaments/:id/images` | `imageService.deleteTeamLogo` | Supabase Storage (`team-logos`) | Admin / Owner | 400 Bad Param, 401 Unauthorized, 403 Forbidden |
| **Migrate Base64 Logos** | `POST` | `/api/v1/tournaments/:id/images/migrate` | `imageService.migrateLegacyBase64Logos` | Supabase Storage (`team-logos`) | Admin / Owner | 401 Unauthorized, 403 Forbidden |

---

## 3. Standard Request & Response Schemas

### 3.1 Standard Response Envelopes
**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 12,
    "timestamp": "2026-10-16T14:00:00.000Z"
  }
}
```

**Standard Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "CROSS_TOURNAMENT_MISMATCH",
    "message": "Team does not belong to tournament",
    "details": [],
    "timestamp": "2026-10-16T14:00:00.000Z"
  }
}
```

---

## 4. Test Verification
All 29 test cases covering:
- 400 Bad Request (Schema errors, invalid IDs, cross-tournament mismatches)
- 401 Unauthorized (Missing/invalid Bearer token)
- 403 Forbidden (Insufficient tournament membership role)
- 404 Not Found (Non-existent resources)
- Cross-Tournament boundary isolation
pass with 100% success rate (`npm run test:server`).
