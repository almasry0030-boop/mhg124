import {
  Advertisement,
  Category,
  CoinPackage,
  Comment,
  Coupon,
  Episode,
  EpisodeUnlock,
  NotificationItem,
  PaymentRequest,
  Series,
  SystemSettings,
  User,
  WalletTransaction,
  WatchHistoryItem
} from '../types';
import {
  DEFAULT_ADMIN_USER,
  DEFAULT_TEST_USER,
  INITIAL_ADS,
  INITIAL_CATEGORIES,
  INITIAL_COIN_PACKAGES,
  INITIAL_COMMENTS,
  INITIAL_COUPONS,
  INITIAL_EPISODES,
  INITIAL_SERIES,
  INITIAL_SETTINGS
} from '../data/seedData';

const STORAGE_KEYS = {
  CURRENT_USER: 'shortdrama_current_user',
  ALL_USERS: 'shortdrama_all_users',
  CATEGORIES: 'shortdrama_categories',
  SERIES: 'shortdrama_series',
  EPISODES: 'shortdrama_episodes',
  UNLOCKS: 'shortdrama_unlocks',
  FAVORITES: 'shortdrama_favorites',
  FOLLOWS: 'shortdrama_follows',
  EPISODE_LIKES: 'shortdrama_episode_likes',
  SERIES_LIKES: 'shortdrama_series_likes',
  COMMENTS: 'shortdrama_comments',
  WATCH_HISTORY: 'shortdrama_watch_history',
  PAYMENTS: 'shortdrama_payments',
  TRANSACTIONS: 'shortdrama_transactions',
  COIN_PACKAGES: 'shortdrama_coin_packages',
  NOTIFICATIONS: 'shortdrama_notifications',
  ADS: 'shortdrama_ads',
  COUPONS: 'shortdrama_coupons',
  SETTINGS: 'shortdrama_settings',
  DAILY_CHECKINS: 'shortdrama_daily_checkins',
};

function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error('Storage read error for key:', key, e);
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('shortdrama_storage_change'));
  } catch (e) {
    console.error('Storage write error for key:', key, e);
  }
}

const DATA_VERSION = 'shortdrama_v3_real_actors_vertical';

export const StorageService = {
  // Initialize seed data if empty
  init() {
    const curVersion = localStorage.getItem('shortdrama_data_version');
    if (curVersion !== DATA_VERSION) {
      safeSet(STORAGE_KEYS.SERIES, INITIAL_SERIES);
      safeSet(STORAGE_KEYS.EPISODES, INITIAL_EPISODES);
      safeSet(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
      localStorage.setItem('shortdrama_data_version', DATA_VERSION);
    } else {
      if (!localStorage.getItem(STORAGE_KEYS.SERIES)) {
        safeSet(STORAGE_KEYS.SERIES, INITIAL_SERIES);
      }
      if (!localStorage.getItem(STORAGE_KEYS.EPISODES)) {
        safeSet(STORAGE_KEYS.EPISODES, INITIAL_EPISODES);
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      safeSet(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COIN_PACKAGES)) {
      safeSet(STORAGE_KEYS.COIN_PACKAGES, INITIAL_COIN_PACKAGES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
      safeSet(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ADS)) {
      safeSet(STORAGE_KEYS.ADS, INITIAL_ADS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COUPONS)) {
      safeSet(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      safeSet(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ALL_USERS)) {
      safeSet(STORAGE_KEYS.ALL_USERS, [DEFAULT_ADMIN_USER, DEFAULT_TEST_USER]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      safeSet(STORAGE_KEYS.CURRENT_USER, DEFAULT_TEST_USER);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      const welcomeNotice: NotificationItem = {
        id: 'notif_welcome',
        userId: 'all',
        title: 'مرحباً بك في منصة ShortDrama! 🎬',
        body: 'استمتع بأقوى مسلسلات الدراما القصيرة بدقة عالية ومشغل عمودي متطور. حصلت على 45 عملة مجانية كهدية ترحيبية!',
        type: 'system',
        read: false,
        createdAt: new Date().toISOString(),
      };
      safeSet(STORAGE_KEYS.NOTIFICATIONS, [welcomeNotice]);
    }
  },

  // USERS & AUTH
  getCurrentUser(): User | null {
    return safeGet<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  },

  setCurrentUser(user: User | null): void {
    safeSet(STORAGE_KEYS.CURRENT_USER, user);
    if (user) {
      // update in all users list too
      const users = this.getAllUsers();
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        users[idx] = user;
      } else {
        users.push(user);
      }
      safeSet(STORAGE_KEYS.ALL_USERS, users);
    }
  },

  getAllUsers(): User[] {
    return safeGet<User[]>(STORAGE_KEYS.ALL_USERS, [DEFAULT_ADMIN_USER, DEFAULT_TEST_USER]);
  },

  login(email: string): User | null {
    const users = this.getAllUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      this.setCurrentUser(found);
      return found;
    }
    return null;
  },

  register(name: string, email: string, phone?: string): User {
    const users = this.getAllUsers();
    const newUser: User = {
      id: 'user_' + Date.now(),
      name,
      email,
      phone,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160`,
      role: 'user',
      isAdmin: false,
      coins: 50, // Welcome bonus!
      vipLevel: 'free',
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    safeSet(STORAGE_KEYS.ALL_USERS, users);
    this.setCurrentUser(newUser);

    // Add welcome transaction
    this.addTransaction({
      userId: newUser.id,
      type: 'reward_daily',
      amount: 50,
      description: 'هدية الترحيب بالانضمام إلى ShortDrama 🎁',
    });

    return newUser;
  },

  updateUserCoins(userId: string, delta: number, description: string): number {
    const users = this.getAllUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return 0;
    user.coins = Math.max(0, user.coins + delta);
    safeSet(STORAGE_KEYS.ALL_USERS, users);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      this.setCurrentUser(user);
    }

    this.addTransaction({
      userId,
      type: delta >= 0 ? 'deposit' : 'unlock_episode',
      amount: delta,
      description,
    });

    return user.coins;
  },

  // SERIES
  getSeries(): Series[] {
    return safeGet<Series[]>(STORAGE_KEYS.SERIES, INITIAL_SERIES);
  },

  getSeriesById(id: string): Series | undefined {
    return this.getSeries().find((s) => s.id === id);
  },

  saveSeries(series: Series): void {
    const list = this.getSeries();
    const idx = list.findIndex((s) => s.id === series.id);
    if (idx >= 0) {
      list[idx] = series;
    } else {
      list.unshift(series);
    }
    safeSet(STORAGE_KEYS.SERIES, list);
  },

  deleteSeries(id: string): void {
    const list = this.getSeries().filter((s) => s.id !== id);
    safeSet(STORAGE_KEYS.SERIES, list);
    // Also delete its episodes
    const eps = this.getEpisodes().filter((e) => e.seriesId !== id);
    safeSet(STORAGE_KEYS.EPISODES, eps);
  },

  // EPISODES
  getEpisodes(seriesId?: string): Episode[] {
    const all = safeGet<Episode[]>(STORAGE_KEYS.EPISODES, INITIAL_EPISODES);
    if (seriesId) {
      return all
        .filter((e) => e.seriesId === seriesId)
        .sort((a, b) => a.episodeNumber - b.episodeNumber);
    }
    return all.sort((a, b) => a.episodeNumber - b.episodeNumber);
  },

  getEpisodeById(id: string): Episode | undefined {
    return this.getEpisodes().find((e) => e.id === id);
  },

  saveEpisode(episode: Episode): void {
    const list = this.getEpisodes();
    const idx = list.findIndex((e) => e.id === episode.id);
    if (idx >= 0) {
      list[idx] = episode;
    } else {
      list.push(episode);
    }
    safeSet(STORAGE_KEYS.EPISODES, list);

    // Update series episodesCount
    const allForSeries = list.filter((e) => e.seriesId === episode.seriesId);
    const seriesList = this.getSeries();
    const series = seriesList.find((s) => s.id === episode.seriesId);
    if (series) {
      series.episodesCount = allForSeries.length;
      safeSet(STORAGE_KEYS.SERIES, seriesList);
    }
  },

  deleteEpisode(id: string): void {
    const list = this.getEpisodes().filter((e) => e.id !== id);
    safeSet(STORAGE_KEYS.EPISODES, list);
  },

  // CATEGORIES
  getCategories(): Category[] {
    return safeGet<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES)
      .sort((a, b) => a.order - b.order);
  },

  saveCategory(category: Category): void {
    const list = this.getCategories();
    const idx = list.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      list[idx] = category;
    } else {
      list.push(category);
    }
    safeSet(STORAGE_KEYS.CATEGORIES, list);
  },

  deleteCategory(id: string): void {
    const list = this.getCategories().filter((c) => c.id !== id);
    safeSet(STORAGE_KEYS.CATEGORIES, list);
  },

  // UNLOCKS
  getUserUnlocks(userId: string): EpisodeUnlock[] {
    const all = safeGet<EpisodeUnlock[]>(STORAGE_KEYS.UNLOCKS, []);
    return all.filter((u) => u.userId === userId);
  },

  isEpisodeUnlocked(userId: string, episodeId: string): boolean {
    const unlocks = this.getUserUnlocks(userId);
    return unlocks.some((u) => u.episodeId === episodeId);
  },

  unlockEpisode(userId: string, seriesId: string, episode: Episode): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.id !== userId) return false;

    // Check if already unlocked
    if (this.isEpisodeUnlocked(userId, episode.id)) return true;

    // Check coins
    const cost = episode.unlockPrice || 10;
    if (currentUser.coins < cost) return false;

    // Deduct coins
    this.updateUserCoins(userId, -cost, `فتح ${episode.title}`);

    // Record unlock
    const all = safeGet<EpisodeUnlock[]>(STORAGE_KEYS.UNLOCKS, []);
    all.push({
      id: 'unlock_' + Date.now(),
      userId,
      seriesId,
      episodeId: episode.id,
      unlockedAt: new Date().toISOString(),
      costCoins: cost,
    });
    safeSet(STORAGE_KEYS.UNLOCKS, all);

    return true;
  },

  // FAVORITES & FOLLOWS
  getFavorites(userId: string): string[] {
    const map = safeGet<Record<string, string[]>>(STORAGE_KEYS.FAVORITES, {});
    return map[userId] || [];
  },

  toggleFavorite(userId: string, seriesId: string): boolean {
    const map = safeGet<Record<string, string[]>>(STORAGE_KEYS.FAVORITES, {});
    const list = map[userId] || [];
    const index = list.indexOf(seriesId);
    let isFav = false;
    if (index >= 0) {
      list.splice(index, 1);
      isFav = false;
    } else {
      list.push(seriesId);
      isFav = true;
    }
    map[userId] = list;
    safeSet(STORAGE_KEYS.FAVORITES, map);

    // Update series totalLikes
    const series = this.getSeriesById(seriesId);
    if (series) {
      series.totalLikes = Math.max(0, series.totalLikes + (isFav ? 1 : -1));
      this.saveSeries(series);
    }
    return isFav;
  },

  getFollows(userId: string): string[] {
    const map = safeGet<Record<string, string[]>>(STORAGE_KEYS.FOLLOWS, {});
    return map[userId] || [];
  },

  toggleFollow(userId: string, seriesId: string): boolean {
    const map = safeGet<Record<string, string[]>>(STORAGE_KEYS.FOLLOWS, {});
    const list = map[userId] || [];
    const idx = list.indexOf(seriesId);
    let isFollowing = false;
    if (idx >= 0) {
      list.splice(idx, 1);
      isFollowing = false;
    } else {
      list.push(seriesId);
      isFollowing = true;
    }
    map[userId] = list;
    safeSet(STORAGE_KEYS.FOLLOWS, map);
    return isFollowing;
  },

  // EPISODE LIKES
  getEpisodeLikes(userId: string): string[] {
    const map = safeGet<Record<string, string[]>>(STORAGE_KEYS.EPISODE_LIKES, {});
    return map[userId] || [];
  },

  toggleEpisodeLike(userId: string, episodeId: string): boolean {
    const map = safeGet<Record<string, string[]>>(STORAGE_KEYS.EPISODE_LIKES, {});
    const list = map[userId] || [];
    const idx = list.indexOf(episodeId);
    let liked = false;
    if (idx >= 0) {
      list.splice(idx, 1);
      liked = false;
    } else {
      list.push(episodeId);
      liked = true;
    }
    map[userId] = list;
    safeSet(STORAGE_KEYS.EPISODE_LIKES, map);

    // Update episode likes count
    const ep = this.getEpisodeById(episodeId);
    if (ep) {
      ep.likesCount = Math.max(0, ep.likesCount + (liked ? 1 : -1));
      this.saveEpisode(ep);
    }
    return liked;
  },

  // COMMENTS
  getComments(episodeId: string): Comment[] {
    const all = safeGet<Comment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    return all.filter((c) => c.episodeId === episodeId);
  },

  addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'likesCount'>): Comment {
    const all = safeGet<Comment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    const newComment: Comment = {
      ...comment,
      id: 'comm_' + Date.now(),
      likesCount: 0,
      createdAt: new Date().toISOString(),
    };
    all.unshift(newComment);
    safeSet(STORAGE_KEYS.COMMENTS, all);
    return newComment;
  },

  deleteComment(id: string): void {
    const all = safeGet<Comment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    safeSet(STORAGE_KEYS.COMMENTS, all.filter((c) => c.id !== id));
  },

  likeComment(commentId: string): void {
    const all = safeGet<Comment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    const comm = all.find((c) => c.id === commentId);
    if (comm) {
      comm.likesCount += 1;
      comm.isLikedByMe = true;
      safeSet(STORAGE_KEYS.COMMENTS, all);
    }
  },

  // WATCH HISTORY
  getWatchHistory(userId: string): WatchHistoryItem[] {
    const all = safeGet<WatchHistoryItem[]>(STORAGE_KEYS.WATCH_HISTORY, []);
    return all
      .filter((h) => h.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  saveWatchProgress(item: Omit<WatchHistoryItem, 'id' | 'updatedAt'>): void {
    const all = safeGet<WatchHistoryItem[]>(STORAGE_KEYS.WATCH_HISTORY, []);
    const idx = all.findIndex((h) => h.userId === item.userId && h.episodeId === item.episodeId);
    const updated: WatchHistoryItem = {
      ...item,
      id: idx >= 0 ? all[idx].id : 'hist_' + Date.now(),
      updatedAt: new Date().toISOString(),
    };
    if (idx >= 0) {
      all[idx] = updated;
    } else {
      all.unshift(updated);
    }
    safeSet(STORAGE_KEYS.WATCH_HISTORY, all);

    // Increment episode views
    const ep = this.getEpisodeById(item.episodeId);
    if (ep && item.percent > 10) {
      ep.viewsCount += 1;
      this.saveEpisode(ep);
    }
  },

  clearWatchHistory(userId: string): void {
    const all = safeGet<WatchHistoryItem[]>(STORAGE_KEYS.WATCH_HISTORY, []);
    safeSet(STORAGE_KEYS.WATCH_HISTORY, all.filter((h) => h.userId !== userId));
  },

  // COIN PACKAGES
  getCoinPackages(): CoinPackage[] {
    return safeGet<CoinPackage[]>(STORAGE_KEYS.COIN_PACKAGES, INITIAL_COIN_PACKAGES);
  },

  // PAYMENTS & APPROVALS (EGYPTIAN CASH & METHODS)
  getPayments(): PaymentRequest[] {
    return safeGet<PaymentRequest[]>(STORAGE_KEYS.PAYMENTS, []);
  },

  submitPaymentRequest(req: Omit<PaymentRequest, 'id' | 'status' | 'createdAt'>): PaymentRequest {
    const all = this.getPayments();
    const newPayment: PaymentRequest = {
      ...req,
      id: 'pay_' + Date.now(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    all.unshift(newPayment);
    safeSet(STORAGE_KEYS.PAYMENTS, all);

    // Notify user
    this.addNotification({
      userId: req.userId,
      title: 'تم استلام طلب الشحن بنجاح ⏳',
      body: `طلب شحن بقيمة ${req.priceEgp} ج.م للحصول على ${req.coinsAmount} عملة قيد المراجعة والاعتماد السريع.`,
      type: 'payment',
    });

    return newPayment;
  },

  approvePayment(paymentId: string, adminNote?: string): boolean {
    const all = this.getPayments();
    const payment = all.find((p) => p.id === paymentId);
    if (!payment || payment.status !== 'pending') return false;

    payment.status = 'approved';
    payment.adminNote = adminNote || 'تم التحقق من التحويل واعتماده بنجاح';
    payment.processedAt = new Date().toISOString();
    safeSet(STORAGE_KEYS.PAYMENTS, all);

    // Credit coins to user!
    this.updateUserCoins(
      payment.userId,
      payment.coinsAmount,
      `شحن رصيد - ${payment.packageName} (${payment.priceEgp} ج.م)`
    );

    // Send notification
    this.addNotification({
      userId: payment.userId,
      title: 'تهانينا! تم شحن العملات في محفظتك 🪙',
      body: `تم اعتماد عملية الدفع بنجاح وإضافة ${payment.coinsAmount} عملة إلى رصيدك. شاهد الآن!`,
      type: 'coins',
    });

    return true;
  },

  rejectPayment(paymentId: string, reason: string): boolean {
    const all = this.getPayments();
    const payment = all.find((p) => p.id === paymentId);
    if (!payment || payment.status !== 'pending') return false;

    payment.status = 'rejected';
    payment.adminNote = reason || 'لم نتمكن من التحقق من عملية التحويل';
    payment.processedAt = new Date().toISOString();
    safeSet(STORAGE_KEYS.PAYMENTS, all);

    // Send notification
    this.addNotification({
      userId: payment.userId,
      title: 'تنبيه: تعذر اعتماد طلب الشحن ⚠️',
      body: `سبب الرفض: ${reason}. يمكنك التواصل مع الدعم الفني أو إعادة إرسال رقم العملية الصحيح.`,
      type: 'payment',
    });

    return true;
  },

  // WALLET TRANSACTIONS
  getTransactions(userId: string): WalletTransaction[] {
    const all = safeGet<WalletTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    return all
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addTransaction(t: Omit<WalletTransaction, 'id' | 'createdAt'>): void {
    const all = safeGet<WalletTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    all.unshift({
      ...t,
      id: 'tx_' + Date.now(),
      createdAt: new Date().toISOString(),
    });
    safeSet(STORAGE_KEYS.TRANSACTIONS, all);
  },

  // NOTIFICATIONS
  getNotifications(userId: string): NotificationItem[] {
    const all = safeGet<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return all
      .filter((n) => n.userId === 'all' || n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addNotification(n: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>): void {
    const all = safeGet<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    all.unshift({
      ...n,
      id: 'notif_' + Date.now(),
      read: false,
      createdAt: new Date().toISOString(),
    });
    safeSet(STORAGE_KEYS.NOTIFICATIONS, all);
  },

  markNotificationAsRead(id: string): void {
    const all = safeGet<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const notif = all.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      safeSet(STORAGE_KEYS.NOTIFICATIONS, all);
    }
  },

  // ADS
  getAds(): Advertisement[] {
    return safeGet<Advertisement[]>(STORAGE_KEYS.ADS, INITIAL_ADS);
  },

  saveAd(ad: Advertisement): void {
    const all = this.getAds();
    const idx = all.findIndex((a) => a.id === ad.id);
    if (idx >= 0) {
      all[idx] = ad;
    } else {
      all.push(ad);
    }
    safeSet(STORAGE_KEYS.ADS, all);
  },

  recordAdImpression(adId: string): void {
    const all = this.getAds();
    const ad = all.find((a) => a.id === adId);
    if (ad) {
      ad.impressions += 1;
      safeSet(STORAGE_KEYS.ADS, all);
    }
  },

  // COUPONS
  getCoupons(): Coupon[] {
    return safeGet<Coupon[]>(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
  },

  saveCoupon(coupon: Coupon): void {
    const all = this.getCoupons();
    const idx = all.findIndex((c) => c.code.toUpperCase() === coupon.code.toUpperCase());
    if (idx >= 0) {
      all[idx] = coupon;
    } else {
      all.push(coupon);
    }
    safeSet(STORAGE_KEYS.COUPONS, all);
  },

  // SYSTEM SETTINGS
  getSettings(): SystemSettings {
    return safeGet<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },

  saveSettings(settings: SystemSettings): void {
    safeSet(STORAGE_KEYS.SETTINGS, settings);
  },

  // DAILY CHECK-IN TRACKER
  getCheckinData(userId: string): { lastDate: string; consecutiveDays: number } {
    const map = safeGet<Record<string, { lastDate: string; consecutiveDays: number }>>(
      STORAGE_KEYS.DAILY_CHECKINS,
      {}
    );
    return map[userId] || { lastDate: '', consecutiveDays: 0 };
  },

  claimDailyCheckin(userId: string, rewardCoins: number): { success: boolean; consecutiveDays: number } {
    const map = safeGet<Record<string, { lastDate: string; consecutiveDays: number }>>(
      STORAGE_KEYS.DAILY_CHECKINS,
      {}
    );
    const today = new Date().toISOString().split('T')[0];
    const userCheckin = map[userId] || { lastDate: '', consecutiveDays: 0 };

    if (userCheckin.lastDate === today) {
      return { success: false, consecutiveDays: userCheckin.consecutiveDays };
    }

    // Check if yesterday or first time
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newStreak = 1;
    if (userCheckin.lastDate === yesterday) {
      newStreak = (userCheckin.consecutiveDays % 7) + 1;
    }

    map[userId] = {
      lastDate: today,
      consecutiveDays: newStreak,
    };
    safeSet(STORAGE_KEYS.DAILY_CHECKINS, map);

    // Give coins
    this.updateUserCoins(userId, rewardCoins, `مكافأة تسجيل الدخول اليومي (اليوم ${newStreak}) 🎯`);

    return { success: true, consecutiveDays: newStreak };
  },
};
