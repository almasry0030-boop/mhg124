import fs from 'fs';
import path from 'path';
import type { ServerUser } from './auth.ts';
import { hashPassword, generateSalt } from './auth.ts';
import {
  INITIAL_SERIES,
  INITIAL_EPISODES,
  INITIAL_SETTINGS,
  INITIAL_COUPONS,
  INITIAL_ADS,
} from '../data/seedData.ts';
import type { Series, Episode, SystemSettings, Coupon, Advertisement, WalletTransaction } from '../types/index.ts';

interface DatabaseSchema {
  users: ServerUser[];
  series: Series[];
  episodes: Episode[];
  settings: SystemSettings;
  coupons: Coupon[];
  ads: Advertisement[];
  transactions: WalletTransaction[];
}

const DB_PATH = path.resolve(process.cwd(), 'data', 'database.json');

function initializeSeedData(): DatabaseSchema {
  // Generate secure salts and initial password hashes
  const adminSalt1 = generateSalt();
  const adminSalt2 = generateSalt();
  const userSalt = generateSalt();

  // Initial Admin User 1 (The project owner: almasry0030@gmail.com)
  const ownerAdmin: ServerUser = {
    id: 'admin_owner',
    name: 'المهندس المصري (مالك المنصة)',
    email: 'almasry0030@gmail.com',
    phone: '01000000001',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160',
    role: 'admin',
    isAdmin: true,
    coins: 99999,
    vipLevel: 'premium',
    salt: adminSalt1,
    // Default initial password hash for owner
    passwordHash: hashPassword('Admin@123456', adminSalt1),
    createdAt: '2026-01-01T00:00:00Z',
  };

  // Initial Admin User 2 (admin@shortdrama.tv)
  const systemAdmin: ServerUser = {
    id: 'admin_system',
    name: 'مدير النظام (ShortDrama Admin)',
    email: 'admin@shortdrama.tv',
    phone: '01000000000',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160',
    role: 'admin',
    isAdmin: true,
    coins: 9999,
    vipLevel: 'premium',
    salt: adminSalt2,
    passwordHash: hashPassword('Admin@123456', adminSalt2),
    createdAt: '2026-01-01T00:00:00Z',
  };

  // Normal Viewer User (علي المنشاوي - isAdmin: false)
  const normalUser: ServerUser = {
    id: 'user_active',
    name: 'علي المنشاوي',
    email: 'ali@example.com',
    phone: '01023456789',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160',
    role: 'user',
    isAdmin: false,
    coins: 45,
    vipLevel: 'free',
    salt: userSalt,
    passwordHash: hashPassword('User@123456', userSalt),
    createdAt: '2026-01-10T14:00:00Z',
  };

  return {
    users: [ownerAdmin, systemAdmin, normalUser],
    series: INITIAL_SERIES,
    episodes: INITIAL_EPISODES,
    settings: INITIAL_SETTINGS,
    coupons: INITIAL_COUPONS,
    ads: INITIAL_ADS,
    transactions: [],
  };
}

class ServerDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure owner email is always present and marked admin
        const hasOwner = parsed.users?.some((u: ServerUser) => u.email === 'almasry0030@gmail.com');
        if (!hasOwner) {
          const seed = initializeSeedData();
          parsed.users = [...(parsed.users || []), seed.users[0]];
          this.save(parsed);
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read existing database.json, initializing fresh seed:', e);
    }

    const initial = initializeSeedData();
    this.save(initial);
    return initial;
  }

  private save(data: DatabaseSchema): void {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database.json:', e);
    }
  }

  // Users
  getUserById(id: string): ServerUser | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): ServerUser | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  getAllUsers(): ServerUser[] {
    return this.data.users;
  }

  createUser(user: ServerUser): ServerUser {
    // Critical: New user registrations can NEVER be admin
    user.role = 'user';
    user.isAdmin = false;
    this.data.users.push(user);
    this.save(this.data);
    return user;
  }

  updateUser(id: string, updates: Partial<ServerUser>): ServerUser | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save(this.data);
    return this.data.users[idx];
  }

  // Series
  getAllSeries(): Series[] {
    return this.data.series;
  }

  getSeriesById(id: string): Series | undefined {
    return this.data.series.find((s) => s.id === id);
  }

  addSeries(series: Series): Series {
    this.data.series.unshift(series);
    this.save(this.data);
    return series;
  }

  updateSeries(id: string, updates: Partial<Series>): Series | null {
    const idx = this.data.series.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.data.series[idx] = { ...this.data.series[idx], ...updates };
    this.save(this.data);
    return this.data.series[idx];
  }

  deleteSeries(id: string): boolean {
    const initialLen = this.data.series.length;
    this.data.series = this.data.series.filter((s) => s.id !== id);
    this.data.episodes = this.data.episodes.filter((e) => e.seriesId !== id);
    this.save(this.data);
    return this.data.series.length < initialLen;
  }

  // Episodes
  getAllEpisodes(seriesId?: string): Episode[] {
    if (seriesId) {
      return this.data.episodes.filter((e) => e.seriesId === seriesId);
    }
    return this.data.episodes;
  }

  addEpisode(episode: Episode): Episode {
    this.data.episodes.push(episode);
    this.save(this.data);
    return episode;
  }

  updateEpisode(id: string, updates: Partial<Episode>): Episode | null {
    const idx = this.data.episodes.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    this.data.episodes[idx] = { ...this.data.episodes[idx], ...updates };
    this.save(this.data);
    return this.data.episodes[idx];
  }

  deleteEpisode(id: string): boolean {
    const initialLen = this.data.episodes.length;
    this.data.episodes = this.data.episodes.filter((e) => e.id !== id);
    this.save(this.data);
    return this.data.episodes.length < initialLen;
  }

  // Settings
  getSettings(): SystemSettings {
    return this.data.settings;
  }

  updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save(this.data);
    return this.data.settings;
  }

  // Coupons
  getCoupons(): Coupon[] {
    return this.data.coupons;
  }

  addCoupon(coupon: Coupon): Coupon {
    this.data.coupons.unshift(coupon);
    this.save(this.data);
    return coupon;
  }

  deleteCoupon(code: string): boolean {
    const initialLen = this.data.coupons.length;
    this.data.coupons = this.data.coupons.filter((c) => c.code !== code);
    this.save(this.data);
    return this.data.coupons.length < initialLen;
  }

  // Ads
  getAds(): Advertisement[] {
    return this.data.ads;
  }

  addAd(ad: Advertisement): Advertisement {
    this.data.ads.unshift(ad);
    this.save(this.data);
    return ad;
  }

  deleteAd(id: string): boolean {
    const initialLen = this.data.ads.length;
    this.data.ads = this.data.ads.filter((a) => a.id !== id);
    this.save(this.data);
    return this.data.ads.length < initialLen;
  }
}

export const db = new ServerDatabase();
