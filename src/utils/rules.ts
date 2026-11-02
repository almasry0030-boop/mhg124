import { Episode, Series, User } from '../types';

export interface UnlockEligibility {
  canWatch: boolean;
  reason: 'free' | 'already_unlocked' | 'vip' | 'locked';
  requiresCoins: number;
  canAfford: boolean;
  missingCoins: number;
}

/**
 * Checks if a user is eligible to watch a specific episode
 */
export function calculateUnlockEligibility(
  user: User | null,
  episode: Episode,
  unlockedEpisodeIds: string[]
): UnlockEligibility {
  // Free episode
  if (episode.isFree) {
    return {
      canWatch: true,
      reason: 'free',
      requiresCoins: 0,
      canAfford: true,
      missingCoins: 0,
    };
  }

  // Not logged in -> must login and unlock
  if (!user) {
    return {
      canWatch: false,
      reason: 'locked',
      requiresCoins: episode.unlockPrice || 10,
      canAfford: false,
      missingCoins: episode.unlockPrice || 10,
    };
  }

  // VIP users have all episodes unlocked
  if (user.vipLevel === 'vip' || user.vipLevel === 'premium') {
    return {
      canWatch: true,
      reason: 'vip',
      requiresCoins: 0,
      canAfford: true,
      missingCoins: 0,
    };
  }

  // Already unlocked by this user
  if (unlockedEpisodeIds.includes(episode.id)) {
    return {
      canWatch: true,
      reason: 'already_unlocked',
      requiresCoins: 0,
      canAfford: true,
      missingCoins: 0,
    };
  }

  // Episode is locked and requires coins
  const price = episode.unlockPrice || 10;
  const canAfford = user.coins >= price;
  const missingCoins = canAfford ? 0 : price - user.coins;

  return {
    canWatch: false,
    reason: 'locked',
    requiresCoins: price,
    canAfford,
    missingCoins,
  };
}

/**
 * Safe coin deduction with double-spend protection
 */
export function processCoinDeduction(
  currentCoins: number,
  cost: number
): { success: boolean; newBalance: number; error?: string } {
  if (cost < 0) {
    return { success: false, newBalance: currentCoins, error: 'تكلفة غير صالحة' };
  }
  if (currentCoins < cost) {
    return { success: false, newBalance: currentCoins, error: 'رصيد العملات غير كافٍ' };
  }
  return {
    success: true,
    newBalance: currentCoins - cost,
  };
}

/**
 * Daily check-in rewards schedule (1-7 days cycle)
 */
export function getDailyCheckinReward(consecutiveDays: number): number {
  const day = ((consecutiveDays - 1) % 7) + 1;
  const schedule: Record<number, number> = {
    1: 5,
    2: 10,
    3: 15,
    4: 20,
    5: 25,
    6: 30,
    7: 50,
  };
  return schedule[day] || 5;
}

/**
 * Calculates watch progress percentage safely (0 - 100)
 */
export function calculateWatchPercent(progressSeconds: number, durationSeconds: number): number {
  if (!durationSeconds || durationSeconds <= 0) return 0;
  const clamped = Math.max(0, Math.min(progressSeconds, durationSeconds));
  return Math.round((clamped / durationSeconds) * 100);
}

/**
 * Validates a coupon code
 */
export interface CouponValidationResult {
  valid: boolean;
  message: string;
  bonusCoins: number;
}

export function validateCoupon(
  code: string,
  couponData?: { code: string; bonusCoins: number; maxUses: number; usedCount: number; active: boolean; expiresAt: string },
  alreadyUsedByUser: boolean = false
): CouponValidationResult {
  const trimmed = (code || '').trim().toUpperCase();
  if (!trimmed) {
    return { valid: false, message: 'يرجى إدخال كود الكوبون', bonusCoins: 0 };
  }

  if (!couponData || couponData.code.toUpperCase() !== trimmed) {
    return { valid: false, message: 'كود الكوبون غير صحيح', bonusCoins: 0 };
  }

  if (!couponData.active) {
    return { valid: false, message: 'هذا الكوبون غير مفعّل حالياً', bonusCoins: 0 };
  }

  if (alreadyUsedByUser) {
    return { valid: false, message: 'لقد استخدمت هذا الكوبون من قبل', bonusCoins: 0 };
  }

  if (couponData.usedCount >= couponData.maxUses) {
    return { valid: false, message: 'تم استنفاد الحد الأقصى لاستخدام الكوبون', bonusCoins: 0 };
  }

  const now = new Date().toISOString();
  if (couponData.expiresAt && couponData.expiresAt < now) {
    return { valid: false, message: 'انتهت صلاحية هذا الكوبون', bonusCoins: 0 };
  }

  return {
    valid: true,
    message: `تم تفعيل الكوبون بنجاح! حصلت على ${couponData.bonusCoins} عملة إضافية.`,
    bonusCoins: couponData.bonusCoins,
  };
}

/**
 * Filter and sort series
 */
export interface SeriesFilters {
  categoryId?: string;
  status?: 'all' | 'completed' | 'ongoing';
  isExclusive?: boolean;
  isFreeOnly?: boolean;
  searchTerm?: string;
  sortBy?: 'popular' | 'rating' | 'newest' | 'views';
}

export function filterAndSortSeries(seriesList: Series[], filters: SeriesFilters): Series[] {
  let result = [...seriesList];

  // Search filter
  if (filters.searchTerm && filters.searchTerm.trim() !== '') {
    const term = filters.searchTerm.toLowerCase().trim();
    result = result.filter(
      (s) =>
        s.title.toLowerCase().includes(term) ||
        s.titleEn?.toLowerCase().includes(term) ||
        s.synopsis.toLowerCase().includes(term) ||
        s.tags.some((t) => t.toLowerCase().includes(term))
    );
  }

  // Category filter
  if (filters.categoryId && filters.categoryId !== 'all') {
    result = result.filter((s) => s.categoryIds.includes(filters.categoryId!));
  }

  // Status filter
  if (filters.status && filters.status !== 'all') {
    result = result.filter((s) => s.status === filters.status);
  }

  // Exclusive filter
  if (filters.isExclusive) {
    result = result.filter((s) => s.isExclusive);
  }

  // Sorting
  const sort = filters.sortBy || 'popular';
  result.sort((a, b) => {
    if (sort === 'popular') {
      return b.totalViews + b.totalLikes * 2 - (a.totalViews + a.totalLikes * 2);
    }
    if (sort === 'rating') {
      return b.rating - a.rating;
    }
    if (sort === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sort === 'views') {
      return b.totalViews - a.totalViews;
    }
    return 0;
  });

  return result;
}
