import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateUnlockEligibility,
  processCoinDeduction,
  getDailyCheckinReward,
  calculateWatchPercent,
  validateCoupon,
  filterAndSortSeries
} from './rules.ts';
import { Episode, Series, User } from '../types';

const mockUser: User = {
  id: 'user_1',
  name: 'أحمد محمود',
  email: 'ahmed@example.com',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
  role: 'user',
  isAdmin: false,
  coins: 25,
  vipLevel: 'free',
  createdAt: '2025-01-01T00:00:00Z',
};

const freeEpisode: Episode = {
  id: 'ep_1',
  seriesId: 'series_1',
  episodeNumber: 1,
  title: 'الحلقة الأولى: البداية الصادمة',
  duration: 90,
  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300',
  isFree: true,
  unlockPrice: 0,
  viewsCount: 1200,
  likesCount: 340,
  createdAt: '2025-01-01T00:00:00Z',
};

const paidEpisode: Episode = {
  id: 'ep_3',
  seriesId: 'series_1',
  episodeNumber: 3,
  title: 'الحلقة الثالثة: كشف الحقيقة',
  duration: 95,
  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300',
  isFree: false,
  unlockPrice: 10,
  viewsCount: 900,
  likesCount: 210,
  createdAt: '2025-01-01T00:00:00Z',
};

test('free episodes can always be watched by anyone', () => {
  const result = calculateUnlockEligibility(null, freeEpisode, []);
  assert.equal(result.canWatch, true);
  assert.equal(result.reason, 'free');
});

test('locked episode requires login and coins if user not authenticated', () => {
  const result = calculateUnlockEligibility(null, paidEpisode, []);
  assert.equal(result.canWatch, false);
  assert.equal(result.requiresCoins, 10);
});

test('user with sufficient coins can afford to unlock episode', () => {
  const result = calculateUnlockEligibility(mockUser, paidEpisode, []);
  assert.equal(result.canWatch, false);
  assert.equal(result.canAfford, true);
  assert.equal(result.missingCoins, 0);
});

test('user without enough coins is flagged as missing coins', () => {
  const poorUser = { ...mockUser, coins: 4 };
  const result = calculateUnlockEligibility(poorUser, paidEpisode, []);
  assert.equal(result.canWatch, false);
  assert.equal(result.canAfford, false);
  assert.equal(result.missingCoins, 6);
});

test('already unlocked episode can be watched directly', () => {
  const result = calculateUnlockEligibility(mockUser, paidEpisode, ['ep_3']);
  assert.equal(result.canWatch, true);
  assert.equal(result.reason, 'already_unlocked');
});

test('VIP user can watch any episode for free', () => {
  const vipUser: User = { ...mockUser, vipLevel: 'vip' };
  const result = calculateUnlockEligibility(vipUser, paidEpisode, []);
  assert.equal(result.canWatch, true);
  assert.equal(result.reason, 'vip');
});

test('processCoinDeduction calculates correct new balance and rejects insufficient balance', () => {
  const success = processCoinDeduction(25, 10);
  assert.equal(success.success, true);
  assert.equal(success.newBalance, 15);

  const fail = processCoinDeduction(5, 10);
  assert.equal(fail.success, false);
  assert.equal(fail.newBalance, 5);
});

test('daily check-in rewards scale correctly across 7-day streak', () => {
  assert.equal(getDailyCheckinReward(1), 5);
  assert.equal(getDailyCheckinReward(2), 10);
  assert.equal(getDailyCheckinReward(7), 50);
  // Day 8 wraps to day 1
  assert.equal(getDailyCheckinReward(8), 5);
});

test('calculateWatchPercent clamps bounds to 0-100', () => {
  assert.equal(calculateWatchPercent(45, 90), 50);
  assert.equal(calculateWatchPercent(120, 90), 100);
  assert.equal(calculateWatchPercent(-5, 90), 0);
});

test('validateCoupon checks validity, expiry, and user usage', () => {
  const coupon = {
    code: 'DRAMA50',
    bonusCoins: 50,
    maxUses: 100,
    usedCount: 10,
    active: true,
    expiresAt: '2030-01-01T00:00:00Z',
  };

  const valid = validateCoupon('DRAMA50', coupon, false);
  assert.equal(valid.valid, true);
  assert.equal(valid.bonusCoins, 50);

  const alreadyUsed = validateCoupon('DRAMA50', coupon, true);
  assert.equal(alreadyUsed.valid, false);

  const invalidCode = validateCoupon('WRONG', coupon, false);
  assert.equal(invalidCode.valid, false);
});
