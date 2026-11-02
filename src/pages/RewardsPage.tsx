import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StorageService } from '../services/storage';
import { getDailyCheckinReward } from '../utils/rules';
import {
  Gift,
  Calendar,
  Sparkles,
  CheckCircle2,
  Tv,
  Share2,
  Trophy,
  Copy,
  Flame,
  Coins
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const RewardsPage: React.FC = () => {
  const { user, claimDailyCheckin, showToast, setAuthModalOpen, refreshData } = useApp();

  const [adWatchLoading, setAdWatchLoading] = useState(false);

  const checkinInfo = useMemo(() => {
    if (!user) return { lastDate: '', consecutiveDays: 0 };
    return StorageService.getCheckinData(user.id);
  }, [user]);

  const today = new Date().toISOString().split('T')[0];
  const isClaimedToday = checkinInfo.lastDate === today;

  const handleWatchAdReward = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setAdWatchLoading(true);
    setTimeout(() => {
      StorageService.updateUserCoins(user.id, 5, 'مكافأة مشاهدة إعلان قصير 📺');
      refreshData();
      setAdWatchLoading(false);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}
      showToast('أحسنت! تمت إضافة 5 عملات مجانية إلى محفظتك');
    }, 2500);
  };

  const handleShareReferral = () => {
    const code = user ? `SHORT-${user.id.slice(-5).toUpperCase()}` : 'SHORTDRAMA';
    navigator.clipboard?.writeText(`استخدم كود الدعوة ${code} واحصل على 25 عملة مجانية في تطبيق ShortDrama! https://shortdrama.tv`);
    showToast('تم نسخ رابط كود الدعوة 🎁 شاركه مع أصدقائك');
  };

  return (
    <div className="space-y-6 pb-24 text-right">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Gift className="w-6 h-6 text-[#FF2A55]" />
          مركز المكافآت والجوائز المجانية 🎁
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          اجمع العملات المجانية يومياً من خلال الحضور ومشاهدة الإعلانات ودعوة أصدقائك
        </p>
      </div>

      {/* 1. Daily Check-in 7-Day Streak Calendar */}
      <div className="rounded-3xl bg-[#141522] border border-white/10 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              مكافأة الحضور اليومي المتتالي
            </h3>
          </div>
          <span className="text-xs font-bold text-amber-400 font-mono">
            سلسلة الحضور: {checkinInfo.consecutiveDays} أيام 🔥
          </span>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const reward = getDailyCheckinReward(day);
            const isCompleted = checkinInfo.consecutiveDays >= day;
            const isCurrentTarget = checkinInfo.consecutiveDays + 1 === day && !isClaimedToday;

            return (
              <div
                key={day}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col justify-between items-center ${
                  isCompleted
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : isCurrentTarget
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40 animate-pulse'
                    : 'bg-[#1D1F30] border-white/5 text-gray-400'
                }`}
              >
                <span className="text-[10px] font-bold">اليوم {day}</span>
                <div className="my-1.5 flex items-center justify-center">
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Coins className="w-6 h-6 text-amber-400" />
                  )}
                </div>
                <span className="text-xs font-black font-mono">+{reward}</span>
              </div>
            );
          })}
        </div>

        {/* Claim Action Button */}
        <button
          onClick={claimDailyCheckin}
          disabled={isClaimedToday}
          className={`w-full py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
            isClaimedToday
              ? 'bg-white/10 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-black shadow-amber-500/20 active:scale-95 cursor-pointer'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {isClaimedToday ? 'تم استلام مكافأة اليوم بنجاح ✓' : 'استلام مكافأة اليوم الآن!'}
        </button>
      </div>

      {/* 2. Tasks & Activities */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#FF2A55]" />
          مهام يومية سريعة لكسب العملات:
        </h3>

        {/* Task: Watch ad */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#141522] border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">مشاهدة إعلان فيديو قصير</p>
              <p className="text-[11px] text-gray-400">شاهد إعلاناً واحصل على 5 عملات فوراً</p>
            </div>
          </div>
          <button
            onClick={handleWatchAdReward}
            disabled={adWatchLoading}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {adWatchLoading ? 'جاري التشغيل...' : '+5 عملات'}
          </button>
        </div>

        {/* Task: Referral Invite Friend */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#141522] border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">دعوة صديق جديد للمنصة</p>
              <p className="text-[11px] text-gray-400">احصل على 25 عملة لكل صديق يسجل بكودك</p>
            </div>
          </div>
          <button
            onClick={handleShareReferral}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" /> مشاركة الكود
          </button>
        </div>
      </div>
    </div>
  );
};
