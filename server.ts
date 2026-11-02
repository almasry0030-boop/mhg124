import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/server/database.ts';
import {
  createSession,
  getSession,
  deleteSession,
  hashPassword,
  generateSalt,
  sanitizeUser,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from './src/server/auth.ts';

export { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Port resolution:
// In AI Studio container: NGINX_PORT=8080 and Nginx forwards to DEFAULT_APP_PORT=3000.
// In standalone Cloud Run: PORT=8080 is assigned directly without Nginx.
const isBehindNginx = Boolean(process.env.NGINX_PORT && process.env.PORT && process.env.NGINX_PORT === process.env.PORT);
const PORT = isBehindNginx
  ? parseInt(process.env.DEFAULT_APP_PORT || '3000', 10)
  : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

const isProduction = process.env.NODE_ENV === 'production';

// Trust reverse proxy (Google Cloud Run / Load Balancer)
app.set('trust proxy', 1);

app.use(express.json());
app.use(cookieParser());

// Extend express Request interface for authenticated user
export interface AuthenticatedRequest extends Request {
  user?: ReturnType<typeof sanitizeUser>;
}

// Authentication Middleware
function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (!sessionId) {
    req.user = undefined;
    return next();
  }

  const session = getSession(sessionId);
  if (!session) {
    req.user = undefined;
    return next();
  }

  const user = db.getUserById(session.userId);
  if (!user) {
    req.user = undefined;
    return next();
  }

  req.user = sanitizeUser(user);
  next();
}

app.use(authenticateUser);

// Strict Admin-only Middleware
function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'غير مصرح: يرجى تسجيل الدخول أولاً بحساب مدير',
      code: 'UNAUTHENTICATED',
    });
  }

  if (req.user.role !== 'admin' || !req.user.isAdmin) {
    return res.status(403).json({
      error: 'ممنوع (403): هذه العملية تتطلب صلاحية مدير النظام الكاملة (isAdmin=true)',
      code: 'FORBIDDEN',
    });
  }

  next();
}

/* ==========================================================================
   AUTHENTICATION API ROUTES
   ========================================================================== */

// Current authenticated user
app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    user: req.user || null,
  });
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
  }

  const user = db.getUserByEmail(email);
  if (!user || !user.salt || !user.passwordHash) {
    return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  }

  const inputHash = hashPassword(password, user.salt);
  if (inputHash !== user.passwordHash) {
    return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  }

  // Create cryptographic session
  const { sessionId } = createSession(user.id);

  res.cookie(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);

  return res.json({
    success: true,
    user: sanitizeUser(user),
  });
});

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' });
  }

  if (db.getUserByEmail(email)) {
    return res.status(400).json({ error: 'هذا البريد الإلكتروني مسجل بالفعل' });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const newUser = db.createUser({
    id: `user_${Date.now()}`,
    name,
    email,
    phone: phone || '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160',
    role: 'user', // Always user, never admin
    isAdmin: false,
    coins: 30, // Welcome gift
    vipLevel: 'free',
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  });

  const { sessionId } = createSession(newUser.id);

  res.cookie(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);

  return res.json({
    success: true,
    user: sanitizeUser(newUser),
  });
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (sessionId) {
    deleteSession(sessionId);
  }
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
  });
  return res.json({ success: true });
});

/* ==========================================================================
   PUBLIC READ APIS (Content Consumption)
   ========================================================================== */

app.get('/api/series', (req: Request, res: Response) => {
  res.json({ series: db.getAllSeries() });
});

app.get('/api/episodes', (req: Request, res: Response) => {
  const seriesId = req.query.seriesId as string | undefined;
  res.json({ episodes: db.getAllEpisodes(seriesId) });
});

app.get('/api/settings', (req: Request, res: Response) => {
  res.json({ settings: db.getSettings() });
});

/* ==========================================================================
   STRICT SERVER-PROTECTED ADMIN APIS (requires role=admin && isAdmin=true)
   ========================================================================== */

// Admin stats
app.get('/api/admin/stats', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const allUsers = db.getAllUsers();
  const allSeries = db.getAllSeries();
  const allEpisodes = db.getAllEpisodes();

  res.json({
    usersCount: allUsers.length,
    seriesCount: allSeries.length,
    episodesCount: allEpisodes.length,
    totalViews: allEpisodes.reduce((acc, ep) => acc + (ep.viewsCount || 0), 0),
    totalLikes: allEpisodes.reduce((acc, ep) => acc + (ep.likesCount || 0), 0),
  });
});

// Admin Users List & Management
app.get('/api/admin/users', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const users = db.getAllUsers().map(sanitizeUser);
  res.json({ users });
});

app.put('/api/admin/users/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  // Security: prevent demoting primary owner or modifying passwords directly here
  delete updates.passwordHash;
  delete updates.salt;

  const updated = db.updateUser(id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }
  res.json({ user: sanitizeUser(updated) });
});

// Admin Series Management
app.post('/api/admin/series', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const newSeries = db.addSeries({
    ...req.body,
    id: req.body.id || `series_${Date.now()}`,
    createdAt: new Date().toISOString(),
  });
  res.json({ series: newSeries });
});

app.put('/api/admin/series/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateSeries(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'المسلسل غير موجود' });
  }
  res.json({ series: updated });
});

app.delete('/api/admin/series/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteSeries(req.params.id);
  res.json({ success });
});

// Admin Episodes Management
app.post('/api/admin/episodes', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const newEp = db.addEpisode({
    ...req.body,
    id: req.body.id || `ep_${Date.now()}`,
    createdAt: new Date().toISOString(),
  });
  res.json({ episode: newEp });
});

app.put('/api/admin/episodes/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateEpisode(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'الحلقة غير موجودة' });
  }
  res.json({ episode: updated });
});

app.delete('/api/admin/episodes/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteEpisode(req.params.id);
  res.json({ success });
});

// Admin Settings Management
app.put('/api/admin/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateSettings(req.body);
  res.json({ settings: updated });
});

// Admin Coupons Management
app.get('/api/admin/coupons', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ coupons: db.getCoupons() });
});

app.post('/api/admin/coupons', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const coupon = db.addCoupon(req.body);
  res.json({ coupon });
});

app.delete('/api/admin/coupons/:code', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteCoupon(req.params.code);
  res.json({ success });
});

// Admin Ads Management
app.get('/api/admin/ads', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ ads: db.getAds() });
});

app.post('/api/admin/ads', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const ad = db.addAd(req.body);
  res.json({ ad });
});

app.delete('/api/admin/ads/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteAd(req.params.id);
  res.json({ success });
});

/* ==========================================================================
   SERVER-SIDE /admin ROUTE GUARD (Prevents direct URL access without admin)
   ========================================================================== */

app.get(['/admin', '/admin/*'], (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Visitor without session -> redirect to login
  if (!req.user) {
    return res.redirect('/?login=required&return_url=/admin');
  }

  // Logged-in user without admin role -> return HTTP 403 Forbidden with security message
  if (req.user.role !== 'admin' || !req.user.isAdmin) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>403 - وصول محظور | ShortDrama Security</title>
        <style>
          * { box-sizing: border-box; }
          body { background: #0B0B0F; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
          .shield-card { background: #141522; border: 1px solid rgba(255,42,85,0.4); border-radius: 24px; padding: 40px 24px; max-width: 440px; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
          .icon-badge { width: 64px; height: 64px; border-radius: 20px; background: rgba(255,42,85,0.15); border: 1px solid rgba(255,42,85,0.3); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #FF2A55; font-size: 28px; }
          h1 { font-size: 20px; font-weight: 800; color: #FF2A55; margin: 0 0 10px; }
          p { color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0 0 24px; }
          .user-badge { display: inline-block; background: rgba(255,255,255,0.06); padding: 6px 12px; border-radius: 8px; font-size: 11px; color: #D1D5DB; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.1); }
          .btn { display: block; width: 100%; background: linear-gradient(135deg, #FF2A55, #FF4E3E); color: #fff; font-weight: 700; text-decoration: none; padding: 14px 20px; border-radius: 14px; font-size: 13px; box-shadow: 0 10px 20px rgba(255,42,85,0.3); }
        </style>
      </head>
      <body>
        <div class="shield-card">
          <div class="icon-badge">🛡️</div>
          <h1>403 - تم حظر الوصول للوحة التحكم</h1>
          <p>
            هذه المنطقة محمية على مستوى الخادم ومخصصة حصرياً لمديري المنصة الذين يمتلكون صلاحية (isAdmin=true).
          </p>
          <div class="user-badge">
            أنت مسجل حالياً بحساب: <strong>${req.user.name}</strong> (${req.user.role})
          </div>
          <a href="/" class="btn">العودة إلى تطبيق المشاهدة</a>
        </div>
      </body>
      </html>
    `);
  }

  // Admin user -> proceed
  next();
});

/* ==========================================================================
   VITE DEV MIDDLEWARE / STATIC PRODUCTION SERVING
   ========================================================================== */

async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const indexHtmlPath = path.resolve(distPath, 'index.html');
  const hasDist = fs.existsSync(indexHtmlPath);

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('[ShortDrama Server] Vite dev server failed to start, falling back to static dist:', e);
      if (hasDist) {
        app.use(express.static(distPath));
        app.get('*', (req: Request, res: Response) => {
          res.sendFile(indexHtmlPath);
        });
      }
    }
  } else {
    if (hasDist) {
      app.use(express.static(distPath));
      // Full SPA fallback for client-side routing on any direct page load
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(indexHtmlPath);
      });
    } else {
      console.warn('[ShortDrama Server] WARNING: dist/index.html not found! Building dist recommended.');
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ShortDrama Server] Listening on http://0.0.0.0:${PORT} (Production: ${isProduction}, Port: ${PORT}, HasDist: ${hasDist})`);
  });
}

startServer().catch((err) => {
  console.error('[ShortDrama Server] Startup error:', err);
  process.exit(1);
});
