export type UserRole = 'admin' | 'user';
export type VipLevel = 'free' | 'vip' | 'premium';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  role: UserRole;
  isAdmin: boolean;
  coins: number;
  vipLevel: VipLevel;
  vipExpiresAt?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  icon?: string;
  order: number;
  active: boolean;
}

export type SeriesStatus = 'completed' | 'ongoing';

export interface Series {
  id: string;
  title: string;
  titleEn: string;
  slug: string;
  synopsis: string;
  backdropUrl: string;
  posterUrl: string;
  trailerUrl?: string;
  categoryIds: string[];
  tags: string[];
  status: SeriesStatus;
  isExclusive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  rating: number;
  totalViews: number;
  totalLikes: number;
  releaseYear: number;
  productionStudio: string;
  episodesCount: number;
  createdAt: string;
}

export interface Episode {
  id: string;
  seriesId: string;
  episodeNumber: number;
  title: string;
  synopsis?: string;
  duration: number; // in seconds
  videoUrl: string;
  thumbnailUrl: string;
  isFree: boolean;
  unlockPrice: number; // coins needed if not free (e.g. 5, 10)
  viewsCount: number;
  likesCount: number;
  isAdUnlockable?: boolean;
  createdAt: string;
}

export interface EpisodeUnlock {
  id: string;
  userId: string;
  seriesId: string;
  episodeId: string;
  unlockedAt: string;
  costCoins: number;
}

export interface Comment {
  id: string;
  seriesId: string;
  episodeId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  likesCount: number;
  isLikedByMe?: boolean;
  isPinned?: boolean;
  createdAt: string;
  replies?: Comment[];
}

export interface WatchHistoryItem {
  id: string;
  userId: string;
  seriesId: string;
  episodeId: string;
  episodeNumber: number;
  seriesTitle: string;
  posterUrl: string;
  progressSeconds: number;
  durationSeconds: number;
  percent: number;
  updatedAt: string;
}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  priceEgp: number;
  isPopular?: boolean;
  badge?: string;
  active: boolean;
}

export type PaymentMethod = 
  | 'vodafone_cash' 
  | 'instapay' 
  | 'etisalat_cash' 
  | 'orange_cash' 
  | 'we_pay' 
  | 'fawry' 
  | 'card';

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  packageId: string;
  packageName: string;
  coinsAmount: number;
  priceEgp: number;
  method: PaymentMethod;
  senderNumber: string;
  referenceCode: string;
  receiptNote?: string;
  receiptImage?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 
    | 'deposit' 
    | 'unlock_episode' 
    | 'reward_daily' 
    | 'reward_ad' 
    | 'reward_referral' 
    | 'admin_adjust' 
    | 'refund' 
    | 'coupon';
  amount: number; // positive = credit, negative = debit
  description: string;
  relatedEpisodeId?: string;
  createdAt: string;
}

export interface RewardClaim {
  id: string;
  userId: string;
  rewardType: 'daily_checkin' | 'watch_ad' | 'complete_episodes' | 'referral';
  coinsEarned: number;
  claimedDate: string; // YYYY-MM-DD
}

export interface NotificationItem {
  id: string;
  userId: string; // 'all' or specific userId
  title: string;
  body: string;
  type: 'payment' | 'coins' | 'episode' | 'reward' | 'system';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface Advertisement {
  id: string;
  title: string;
  type: 'pre_roll' | 'interstitial' | 'banner';
  mediaUrl: string;
  targetUrl?: string;
  durationSeconds: number;
  skippableAfterSeconds: number;
  impressions: number;
  clicks: number;
  active: boolean;
}

export interface Coupon {
  code: string;
  bonusCoins: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiresAt: string;
}

export interface SystemSettings {
  appName: string;
  appNameEn: string;
  logoUrl?: string;
  defaultCurrency: string;
  contactEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  vodafoneCashNumber: string;
  instapayHandle: string;
  orangeCashNumber: string;
  etisalatCashNumber: string;
  wePayNumber: string;
  fawryMerchantCode: string;
  dailyRewardBaseCoins: number;
  watchAdRewardCoins: number;
}
