# SCI CUP - Football Tournament Management System

A full-stack football tournament management system featuring real-time group stages, fixtures, knockout brackets, team management, and role-based access control.

---

## 📁 Project Architecture (Client & Server)

```
SCICUP/
├── cln/                        # Frontend Application (React 19, Vite, Tailwind v4, Lucide Icons)
│   ├── public/                 # Static assets (logos, images, favicons)
│   ├── src/                    # UI Components, State, Services & API client
│   │   ├── components/         # Modular React UI views (Dashboard, Fixtures, Standings, etc.)
│   │   ├── data/               # Seed data & bracket templates
│   │   ├── services/           # API services & Supabase client
│   │   ├── utils/              # Calculators & helpers
│   │   ├── App.tsx             # Root Application Component
│   │   └── main.tsx            # Application Entry Point
│   ├── index.html              # HTML shell
│   ├── tsconfig.json           # Client TypeScript config
│   └── vite.config.ts          # Client Vite config
│
├── srv/                        # Backend API (Node.js, Express, TypeScript, Supabase PostgreSQL)
│   ├── src/
│   │   ├── config/             # Environment, Supabase admin client
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Auth, CORS, Logger, Rate-limiting, Error handling
│   │   ├── repositories/       # Database access layer
│   │   ├── routes/             # REST API routes (/api/v1)
│   │   ├── schemas/            # Zod validation schemas
│   │   ├── services/           # Business logic
│   │   ├── app.ts              # Express application factory
│   │   └── server.ts           # Server bootstrap
│   ├── API_DOCS.md             # Complete REST API specification
│   └── tsconfig.json           # Server TypeScript config
│
├── tests/                      # Automated Test Suite
│   └── server/                 # Integration & unit tests (46 passing tests)
│
├── package.json                # Root scripts and workspace dependencies
├── tsconfig.json               # Root TypeScript configuration
└── vite.config.ts              # Root Vite dev server configuration with proxy to :3001
```

---

## 🚀 Running the Project

### 1. Run Client & Server Concurrently (Recommended)
Runs both the Vite Frontend (`http://localhost:3000`) and Express API Server (`http://localhost:3001`) simultaneously with colored terminal output:
```bash
npm run dev
# or
npm run dev:all
```

### 2. Run Individually
- **Client only (Frontend):**
  ```bash
  npm run dev:client
  ```
- **Server only (Backend):**
  ```bash
  npm run dev:server
  ```

### 3. Build & Production
- **Build Client:**
  ```bash
  npm run build
  ```
- **Run Server:**
  ```bash
  npm run start:server
  ```

### 4. Testing & Validation
- **Run Server Tests:**
  ```bash
  npm run test:server
  ```
- **TypeScript Check:**
  ```bash
  npm run lint
  ```
