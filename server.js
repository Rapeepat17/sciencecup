import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

app.use(express.json({ limit: '10mb' }));

// Enable CORS for development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Default initial database fallback
const DEFAULT_DATA = {
  tournamentName: 'SCI CUP 2026',
  teams: [],
  groups: {},
  matches: [],
  qfMatches: [],
  sfMatches: [],
  finalMatch: null,
};

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readDb() {
  ensureDataDirectory();
  if (!fs.existsSync(DB_FILE)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file:', err);
    return null;
  }
}

function writeDb(data) {
  ensureDataDirectory();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

// Routes
app.get('/api/db', (req, res) => {
  const db = readDb();
  if (!db) {
    return res.status(404).json({ error: 'Database not initialized yet' });
  }
  res.json(db);
});

app.post('/api/db', (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid data format' });
  }
  const success = writeDb(data);
  if (success) {
    res.json({ success: true, message: 'Database saved successfully' });
  } else {
    res.status(500).json({ error: 'Failed to write to database file' });
  }
});

app.post('/api/db/reset', (req, res) => {
  if (fs.existsSync(DB_FILE)) {
    fs.unlinkSync(DB_FILE);
  }
  res.json({ success: true, message: 'Database reset successfully' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SCI CUP Server] Database API running on http://0.0.0.0:${PORT}`);
});
