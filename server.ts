import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// No-cache middleware for API routes to guarantee fresh updates for non-technical users
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Clean and safe working directory resolution
const rootDir = process.cwd();
const DATA_DIR = path.join(rootDir, 'server_data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface AppDatabase {
  profile: {
    name: string;
    tagline: string;
    establishedDate?: string;
    establishedYear?: string;
    address: string;
    hotline?: string;
    emergencyContact?: string;
    regNumber?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  };
  members: any[];
  donors: any[];
  notices: any[];
  funds: any[];
  manualTotalBalance: number | null;
  paymentConfig: {
    bkashNumber: string;
    bkashType: string;
    bkashInstructions?: string;
    nagadNumber: string;
    nagadType: string;
    nagadInstructions?: string;
    rocketNumber: string;
    rocketType: string;
    rocketInstructions?: string;
  };
  adminPin: string;
  updatedAt: string;
}

const DEFAULT_DB: AppDatabase = {
  profile: {
    name: 'সিলেট মানব সেবা সংগঠন',
    tagline: 'মানবতার কল্যাণে নিবেদিত প্রাণ',
    establishedDate: '১৫/০৮/২০২২ইং',
    establishedYear: '২০২২',
    address: 'পতেঙ্গা, চট্টগ্রাম',
    hotline: '',
    emergencyContact: '',
    regNumber: '২০২২/০৮',
    phone: '',
    email: '',
    logoUrl: ''
  },
  members: [],
  donors: [],
  notices: [],
  funds: [],
  manualTotalBalance: null,
  paymentConfig: {
    bkashNumber: '01886122678',
    bkashType: 'Personal',
    bkashInstructions: 'আপনার বিকাশ অ্যাপ থেকে উপরের নম্বরে Send Money করুন। রেফারেন্সে আপনার নাম বা মেম্বার আইডি লিখুন এবং সফল ট্রানজেকশনের TrxID নিচে সাবমিট করুন।',
    nagadNumber: '01886122678',
    nagadType: 'Personal',
    nagadInstructions: 'নগদ অ্যাপ বা *167# ডায়াল করে Send Money করুন। সফল পেমেন্টের পর TrxID টি নিচের বক্সে লিখে সাবমিট করুন।',
    rocketNumber: '',
    rocketType: 'Personal',
    rocketInstructions: 'রকেট একাউন্ট থেকে Send Money করার পর ফিরতি এসএমএসের TrxID নিচে যুক্ত করে সাবমিট করুন।'
  },
  adminPin: '1234',
  updatedAt: new Date().toISOString()
};

function readDatabase(): AppDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      return DEFAULT_DB;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return { ...DEFAULT_DB, ...parsed };
  } catch (error) {
    console.error('Error reading server database:', error);
    return DEFAULT_DB;
  }
}

function writeDatabase(data: Partial<AppDatabase>): AppDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const current = readDatabase();
    const updated: AppDatabase = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString()
    };
    // Safe atomic write
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(updated, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return updated;
  } catch (error) {
    console.error('Error writing server database:', error);
    return readDatabase();
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// GET full synchronized database state
app.get('/api/data', (req, res) => {
  try {
    const db = readDatabase();
    res.json({ success: true, data: db });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST full or partial synchronized database update
app.post('/api/data', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid payload' });
    }
    const updated = writeDatabase(payload);
    res.json({ success: true, data: updated });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST key-specific sync update
app.post('/api/data/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const allowedKeys = [
      'profile',
      'members',
      'donors',
      'notices',
      'funds',
      'manualTotalBalance',
      'paymentConfig',
      'adminPin'
    ];

    if (!allowedKeys.includes(key)) {
      return res.status(400).json({ success: false, error: `Invalid key: ${key}` });
    }

    const updated = writeDatabase({ [key]: value });
    res.json({ success: true, data: updated });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Reset database
app.post('/api/data-action/reset', (req, res) => {
  try {
    const updated = writeDatabase(DEFAULT_DB);
    res.json({ success: true, data: updated });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Clear lists to empty
app.post('/api/data-action/clear', (req, res) => {
  try {
    const current = readDatabase();
    const updated = writeDatabase({
      ...current,
      members: [],
      donors: [],
      notices: [],
      funds: [],
      manualTotalBalance: null
    });
    res.json({ success: true, data: updated });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Vite middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(rootDir, 'dist');
    
    // Service worker must always be fresh
    app.get('/sw.js', (req, res, next) => {
      const swFile = path.join(distPath, 'sw.js');
      if (fs.existsSync(swFile)) {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.sendFile(swFile);
      }
      next();
    });

    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath && (filePath.endsWith('index.html') || filePath.endsWith('sw.js'))) {
          res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));
    
    app.get('*', (req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.sendFile(indexFile);
      }
      res.status(200).send('<!DOCTYPE html><html><head><title>সিলেট মানব সেবা সংগঠন</title></head><body><div id="root"></div></body></html>');
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] সিলেট মানব সেবা সংগঠন server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
