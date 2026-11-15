const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const PgSessionStore = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const authRoutes = require('./server/routes/auth');
const userRoutes = require('./server/routes/users');
const scriptRoutes = require('./server/routes/scripts');
const rawRoutes = require('./server/routes/raw');

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in production.');
}

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1
});

const app = express();

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  store: new PgSessionStore({
    pool,
    tableName: 'express_sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'development-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use(authRoutes);
app.use(userRoutes);
app.use(scriptRoutes);
app.use(rawRoutes);

app.get('/dashboard', (req, res) => res.redirect('/dashboard.html'));
app.get('/scripts', (req, res) => res.redirect('/scripts.html'));
app.get('/upload', (req, res) => res.redirect('/upload.html'));
app.get('/explore', (req, res) => res.redirect('/explore.html'));
app.get('/settings', (req, res) => res.redirect('/settings.html'));
app.get('/login', (req, res) => res.redirect('/login.html'));

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/raw')) {
    return res.status(404).json({ error: 'Not found.' });
  }

  return res.sendFile(path.join(__dirname, 'public/index.html'));
});

module.exports = app;
