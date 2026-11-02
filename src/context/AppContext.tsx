import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Category,
  Episode,
  NotificationItem,
  PaymentRequest,
  Series,
  SystemSettings,
  User,
  WatchHistoryItem
} from '../types';
import { StorageService } from '../services/storage';
import { DEFAULT_ADMIN_USER, DEFAULT_TEST_USER } from '../data/seedData';
import { ApiService } from '../services/api';
import confetti from 'canvas-confetti';

interface AppContextType {
  user: User | null;
  isAdmin: boolean;
  activeTab: 'home' | 'explore' | 'watch' | 'library' | 'profile' | 'admin' | 'wallet' | 'rewards';
  setActiveTab: (tab: 'home' | 'explore' | 'watch' | 'library' | 'profile' | 'admin' | 'wallet' | 'rewards') => void;
  series: Series[];
  categories: Category[];
  episodes: Episode[];
  settings: SystemSettings;
  favorites: string[];
  follows: string[];
  watchHistory: WatchHistoryItem[];
  notifications: NotificationItem[];
  unreadNotifCount: number;

  // Player state
  playingSeriesId: string | null;
  playingEpisodeId: string | null;
  isPlayerOpen: boolean;
  openPlayer: (seriesId: string, episodeId?: string) => void;
  closePlayer: () => void;

  // Series details modal/page
  viewingSeriesId: string | null;
  openSeriesDetails: (seriesId: string) => void;
  closeSeriesDetails: () => void;

  // Actions
  changeTab: (tab: 'home' | 'explore' | 'watch' | 'library' | 'profile' | 'admin' | 'wallet' | 'rewards') => void;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, phone?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleFavorite: (seriesId: string) => boolean;
  toggleFollow: (seriesId: string) => boolean;
  isEpisodeUnlocked: (episodeId: string) => boolean;
  unlockEpisode: (episode: Episode) => boolean;
  recordWatchProgress: (episode: Episode, seconds: number, duration: number) => void;
  submitPayment: (req: Omit<PaymentRequest, 'id' | 'status' | 'createdAt'>) => PaymentRequest;
  claimDailyCheckin: () => { success: boolean; consecutiveDays: number };
  refreshData: () => void;

  // Modals
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  paywallEpisode: Episode | null;
  setPaywallEpisode: (ep: Episode | null) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'watch' | 'library' | 'profile' | 'admin' | 'wallet' | 'rewards'>('home');
  const [series, setSeries] = useState<Series[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(StorageService.getSettings());
  const [favorites, setFavorites] = useState<string[]>([]);
  const [follows, setFollows] = useState<string[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Navigation / Modal States
  const [playingSeriesId, setPlayingSeriesId] = useState<string | null>(null);
  const [playingEpisodeId, setPlayingEpisodeId] = useState<string | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [viewingSeriesId, setViewingSeriesId] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [paywallEpisode, setPaywallEpisode] = useState<Episode | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const refreshData = () => {
    const curUser = StorageService.getCurrentUser();
    setUser(curUser);
    setSeries(StorageService.getSeries());
    setCategories(StorageService.getCategories());
    setEpisodes(StorageService.getEpisodes());
    setSettings(StorageService.getSettings());

    if (curUser) {
      setFavorites(StorageService.getFavorites(curUser.id));
      setFollows(StorageService.getFollows(curUser.id));
      setWatchHistory(StorageService.getWatchHistory(curUser.id));
      setNotifications(StorageService.getNotifications(curUser.id));
    } else {
      setFavorites([]);
      setFollows([]);
      setWatchHistory([]);
      setNotifications([]);
    }
  };

  // Check server session on mount
  useEffect(() => {
    StorageService.init();
    refreshData();

    // Verify session with server HttpOnly cookie
    ApiService.getMe().then((serverUser: User | null) => {
      if (serverUser) {
        setUser(serverUser);
        StorageService.setCurrentUser(serverUser);
      }
    }).catch(() => {});

    const handleStorageChange = () => {
      refreshData();
    };
    window.addEventListener('shortdrama_storage_change', handleStorageChange);
    return () => {
      window.removeEventListener('shortdrama_storage_change', handleStorageChange);
    };
  }, []);

  const isAdmin = user?.role === 'admin' && user?.isAdmin === true;

  const changeTab = (tab: 'home' | 'explore' | 'watch' | 'library' | 'profile' | 'admin' | 'wallet' | 'rewards') => {
    if (tab === 'admin') {
      if (!user) {
        setAuthModalOpen(true);
        showToast('يرجى تسجيل الدخول أولاً بحساب مدير (Admin)');
        return;
      }
      if (user.role !== 'admin' || !user.isAdmin) {
        showToast('وصول محظور (403): حسابك لا يمتلك صلاحية الإدارة (isAdmin=false)');
        return;
      }
    }
    setActiveTab(tab);
  };

  const unreadNotifCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const openPlayer = (seriesId: string, episodeId?: string) => {
    const allSeriesEps = StorageService.getEpisodes(seriesId);
    if (!allSeriesEps.length) {
      showToast('لا توجد حلقات متاحة لهذا المسلسل حالياً');
      return;
    }
    const targetEp = episodeId
      ? allSeriesEps.find((e) => e.id === episodeId) || allSeriesEps[0]
      : allSeriesEps[0];

    setPlayingSeriesId(seriesId);
    setPlayingEpisodeId(targetEp.id);
    setIsPlayerOpen(true);
  };

  const closePlayer = () => {
    setIsPlayerOpen(false);
  };

  const openSeriesDetails = (seriesId: string) => {
    setViewingSeriesId(seriesId);
  };

  const closeSeriesDetails = () => {
    setViewingSeriesId(null);
  };

  const login = async (email: string, password?: string): Promise<boolean> => {
    const res = await ApiService.login(email, password);
    if (res.success && res.user) {
      setUser(res.user);
      StorageService.setCurrentUser(res.user);
      refreshData();
      showToast(`أهلاً بك يا ${res.user.name}! 🎬`);
      return true;
    } else {
      showToast(res.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
      return false;
    }
  };

  const register = async (name: string, email: string, phone?: string, password?: string) => {
    const res = await ApiService.register(name, email, phone, password);
    if (res.success && res.user) {
      setUser(res.user);
      StorageService.setCurrentUser(res.user);
      refreshData();
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}
      showToast(`تم إنشاء حسابك بنجاح وحصلت على 30 عملة هدية! 🎁`);
    } else {
      showToast(res.error || 'فشل إنشاء الحساب');
    }
  };

  const logout = async () => {
    await ApiService.logout();
    StorageService.setCurrentUser(null);
    setUser(null);
    refreshData();
    showToast('تم تسجيل الخروج بنجاح');
  };

  const toggleFavorite = (seriesId: string): boolean => {
    if (!user) {
      setAuthModalOpen(true);
      return false;
    }
    const res = StorageService.toggleFavorite(user.id, seriesId);
    setFavorites(StorageService.getFavorites(user.id));
    showToast(res ? 'تمت الإضافة إلى المفضلة ❤️' : 'تمت الإزالة من المفضلة');
    return res;
  };

  const toggleFollow = (seriesId: string): boolean => {
    if (!user) {
      setAuthModalOpen(true);
      return false;
    }
    const res = StorageService.toggleFollow(user.id, seriesId);
    setFollows(StorageService.getFollows(user.id));
    showToast(res ? 'أنت الآن تتابع هذا المسلسل 🔔' : 'تم إلغاء المتابعة');
    return res;
  };

  const isEpisodeUnlocked = (episodeId: string): boolean => {
    if (!user) return false;
    if (user.vipLevel !== 'free' || user.role === 'admin') return true;
    return StorageService.isEpisodeUnlocked(user.id, episodeId);
  };

  const unlockEpisode = (episode: Episode): boolean => {
    if (!user) {
      setAuthModalOpen(true);
      return false;
    }
    const success = StorageService.unlockEpisode(user.id, episode.seriesId, episode);
    if (success) {
      refreshData();
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
      } catch {}
      showToast(`تم فتح ${episode.title} بنجاح! مشاهدة ممتعة 🍿`);
    } else {
      showToast('رصيدك من العملات غير كافٍ. يرجى شحن المحفظة');
    }
    return success;
  };

  const recordWatchProgress = (episode: Episode, seconds: number, duration: number) => {
    if (!user) return;
    const seriesItem = series.find((s) => s.id === episode.seriesId);
    const percent = duration > 0 ? Math.round((seconds / duration) * 100) : 0;
    StorageService.saveWatchProgress({
      userId: user.id,
      seriesId: episode.seriesId,
      episodeId: episode.id,
      episodeNumber: episode.episodeNumber,
      seriesTitle: seriesItem?.title || '',
      posterUrl: seriesItem?.posterUrl || episode.thumbnailUrl,
      progressSeconds: Math.round(seconds),
      durationSeconds: Math.round(duration),
      percent,
    });
  };

  const submitPayment = (req: Omit<PaymentRequest, 'id' | 'status' | 'createdAt'>): PaymentRequest => {
    const res = StorageService.submitPaymentRequest(req);
    refreshData();
    showToast('تم إرسال طلب الشحن بنجاح! سيتم اعتماده وإضافة العملات خلال دقائق');
    return res;
  };

  const claimDailyCheckin = () => {
    if (!user) {
      setAuthModalOpen(true);
      return { success: false, consecutiveDays: 0 };
    }
    const reward = 10;
    const res = StorageService.claimDailyCheckin(user.id, reward);
    if (res.success) {
      refreshData();
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
      } catch {}
      showToast(`مبروك! حصلت على ${reward} عملات بمناسبة تسجيل الدخول اليومي 🌟`);
    } else {
      showToast('لقد حصلت على مكافأة اليوم بالفعل! عُد غداً للمزيد');
    }
    return res;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAdmin,
        activeTab,
        setActiveTab,
        series,
        categories,
        episodes,
        settings,
        favorites,
        follows,
        watchHistory,
        notifications,
        unreadNotifCount,
        playingSeriesId,
        playingEpisodeId,
        isPlayerOpen,
        openPlayer,
        closePlayer,
        viewingSeriesId,
        openSeriesDetails,
        closeSeriesDetails,
        changeTab,
        login,
        register,
        logout,
        toggleFavorite,
        toggleFollow,
        isEpisodeUnlocked,
        unlockEpisode,
        recordWatchProgress,
        submitPayment,
        claimDailyCheckin,
        refreshData,
        authModalOpen,
        setAuthModalOpen,
        paywallEpisode,
        setPaywallEpisode,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
