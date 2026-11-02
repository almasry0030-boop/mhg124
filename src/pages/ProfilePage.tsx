import React from 'react';
import { useApp } from '../context/AppContext';
import {
  User as UserIcon,
  Coins,
  Crown,
  Heart,
  Clock,
  Settings,
  ShieldCheck,
  LogOut,
  HelpCircle,
  FileText,
  Bell,
  Sparkles,
  ChevronLeft,
  Smartphone
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const ProfilePage: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const {
    user,
    setAuthModalOpen,
    setActiveTab,
    changeTab,
    favorites,
    watchHistory,
    logout,
    settings,
    showToast,
  } = useApp();

  if (!user) {
    return (
      <div className="py-16 text-center max-w-sm mx-auto space-y-4 text-right">
        <div className="w-20 h-20 rounded-full bg-[#141522] text-gray-500 mx-auto flex items-center justify-center border border-white/10">
          <UserIcon className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black text-white text-center">
          سجّل الدخول إلى ShortDrama
        </h2>
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          سجل دخولك الآن لمزامنة مكتبتك المفضلة، متابعة سجل المشاهدة، وشحن العملات!
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="w-full py-3.5 rounded-2xl bg-[#FF2A55] text-white font-bold text-sm shadow-xl shadow-[#FF2A55]/30 hover:bg-[#e02449] transition-all cursor-pointer"
        >
          تسجيل الدخول / إنشاء حساب جديد
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 text-right">
      {/* User Header Profile Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[#141522] border border-white/10 p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[#FF2A55] shadow-lg"
            />
            {user.vipLevel !== 'free' && (
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-gradient-to-r from-amber-400 to-amber-600 text-black shadow-md flex items-center gap-0.5">
                <Crown className="w-2.5 h-2.5" /> VIP
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white truncate">
                {user.name}
              </h2>
              {user.role === 'admin' && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  مدير النظام
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate mt-0.5 font-mono">
              {user.email}
            </p>
            {user.phone && (
              <p className="text-xs text-gray-500 mt-0.5 font-mono">
                {user.phone}
              </p>
            )}
            <p className="text-[10px] text-gray-500 mt-1">
              عضو منذ {new Date(user.createdAt).toLocaleDateString('ar-EG')}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-white/5 text-center">
          <div
            onClick={() => setActiveTab('library')}
            className="p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
          >
            <span className="text-lg font-black text-white font-mono block">
              {favorites.length}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">في المفضلة</span>
          </div>

          <div
            onClick={() => setActiveTab('library')}
            className="p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
          >
            <span className="text-lg font-black text-white font-mono block">
              {watchHistory.length}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">حلقات شاهدتها</span>
          </div>

          <div
            onClick={() => setActiveTab('rewards')}
            className="p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
          >
            <span className="text-lg font-black text-amber-400 font-mono block">
              {user.coins}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">عملات رقمية</span>
          </div>
        </div>
      </div>

      {/* Wallet Quick Action Banner */}
      <div
        onClick={() => setActiveTab('wallet')}
        className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 hover:border-amber-400 transition-all cursor-pointer group shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Coins className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">محفظة العملات: {user.coins} عملة</p>
            <p className="text-xs text-amber-300/80">شحن فودافون كاش وإنستاباي فوري ⚡</p>
          </div>
        </div>
        <span className="text-xs font-bold text-amber-400 px-3 py-1.5 rounded-xl bg-amber-500/20 group-hover:bg-amber-500/30">
          شحن الرصيد ←
        </span>
      </div>

      {/* Options & Settings List */}
      <div className="rounded-2xl bg-[#141522] border border-white/5 divide-y divide-white/5 overflow-hidden">
        {user.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className="w-full flex items-center justify-between p-4 text-xs font-bold text-purple-300 hover:bg-white/5 transition-colors text-right"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span>لوحة التحكم الإدارية الكاملة</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
        )}

        <button
          onClick={() => setActiveTab('rewards')}
          className="w-full flex items-center justify-between p-4 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-right"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>مركز المكافآت وجوائز الحضور اليومي</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>

        <button
          onClick={() => {
            if (isInstalled) {
              showToast('التطبيق مثبت بالفعل على جهازك بصيغة PWA ✅');
            } else if (isInstallable) {
              install();
            } else if (isIOS) {
              showToast('على iPhone: اضغط زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"');
            } else {
              showToast('يمكنك تثبيت التطبيق من قائمة المتصفح "تثبيت التطبيق"');
            }
          }}
          className="w-full flex items-center justify-between p-4 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-right"
        >
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-[#FF2A55]" />
            <span>تثبيت تطبيق ShortDrama على هاتفك</span>
          </div>
          <span className="text-[11px] font-bold text-[#FF2A55] bg-[#FF2A55]/10 px-2.5 py-1 rounded-lg border border-[#FF2A55]/20">
            {isInstalled ? 'مثبت ✓' : 'تثبيت الآن'}
          </span>
        </button>

        <button
          onClick={() => showToast('الإشعارات مفعلة تلقائياً للتطبيق')}
          className="w-full flex items-center justify-between p-4 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-right"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-400" />
            <span>إعدادات الإشعارات والتنبيهات</span>
          </div>
          <span className="text-[11px] text-green-400 font-bold">مفعلة ✓</span>
        </button>

        <button
          onClick={() => showToast(`للتواصل والدعم: ${settings.contactEmail} أو واتساب ${settings.supportPhone}`)}
          className="w-full flex items-center justify-between p-4 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-right"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-gray-400" />
            <span>مركز المساعدة والدعم الفني</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>

        <button
          onClick={() => showToast('ShortDrama مرخصة لتقديم محتوى الدراما القصيرة الأصلية 2026')}
          className="w-full flex items-center justify-between p-4 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-right"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-400" />
            <span>شروط الاستخدام وسياسة الخصوصية</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>

        {/* Admin Dashboard Entry (Visible only to verified admins) */}
        {user.role === 'admin' && user.isAdmin && (
          <button
            onClick={() => changeTab('admin')}
            className="w-full flex items-center justify-between p-4 text-xs font-bold text-amber-300 hover:text-white hover:bg-amber-500/10 transition-colors text-right border-y border-amber-500/20 bg-amber-500/5"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>لوحة تحكم مدير المنصة (Admin Dashboard)</span>
            </div>
            <span className="text-[11px] bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-md border border-amber-500/30">
              دخول ⚙️
            </span>
          </button>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-4 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors text-right"
        >
          <LogOut className="w-5 h-5" />
          <span>تسجيل الخروج من الحساب</span>
        </button>
      </div>
    </div>
  );
};
