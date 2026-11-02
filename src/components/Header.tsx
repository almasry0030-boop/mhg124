import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Coins,
  Bell,
  Search,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onOpenNotifications }) => {
  const {
    user,
    isAdmin,
    activeTab,
    setActiveTab,
    unreadNotifCount,
    setAuthModalOpen,
    switchUserRole,
    logout,
  } = useApp();

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0B0B0F]/90 backdrop-blur-md border-b border-[#1A1B26] px-4 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 group text-right focus:outline-none cursor-pointer"
            aria-label="الصفحة الرئيسية"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#FF2A55] to-[#FF6B4A] flex items-center justify-center shadow-lg shadow-[#FF2A55]/25 group-hover:scale-105 transition-transform shrink-0">
              <span className="text-white font-black text-lg sm:text-xl italic tracking-tighter">SD</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-[#FF2A55] transition-colors">
                ShortDrama
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FF2A55]/20 text-[#FF2A55] border border-[#FF2A55]/30 hidden xs:inline">
                دراما
              </span>
            </div>
          </button>
        </div>

        {/* Center / Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Search Button */}
          <button
            onClick={() => {
              if (onOpenSearch) onOpenSearch();
              else setActiveTab('explore');
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-[#141522] text-gray-300 hover:text-white hover:bg-[#1E2030] transition-colors border border-white/5 cursor-pointer"
            aria-label="البحث عن مسلسلات"
            title="بحث"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Coins Balance Button */}
          {user ? (
            <button
              onClick={() => setActiveTab('wallet')}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-amber-600/10 border border-amber-500/30 hover:border-amber-500/60 transition-all text-amber-400 group cursor-pointer"
              title="رصيد العملات والمحفظة"
            >
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-bold font-mono">{user.coins}</span>
              <span className="text-[10px] text-amber-300/80 hidden sm:inline">عملة</span>
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-2.5 py-1 text-xs font-bold rounded-xl bg-[#FF2A55] text-white hover:bg-[#e02449] transition-colors shadow-sm shadow-[#FF2A55]/30"
            >
              دخول
            </button>
          )}

          {/* Notifications */}
          <button
            onClick={() => {
              if (onOpenNotifications) onOpenNotifications();
              else setActiveTab('profile');
            }}
            className="relative p-1.5 sm:p-2 rounded-xl bg-[#141522] text-gray-300 hover:text-white hover:bg-[#1E2030] transition-colors border border-white/5 cursor-pointer"
            aria-label="الإشعارات"
            title="الإشعارات"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FF2A55] text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-[#0B0B0F]">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* Admin Switcher / Mode Badge (hidden text on mobile, icon only) */}
          <button
            onClick={() => {
              if (isAdmin) {
                setActiveTab(activeTab === 'admin' ? 'home' : 'admin');
              } else {
                switchUserRole('admin');
              }
            }}
            className={`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isAdmin
                ? activeTab === 'admin'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                  : 'bg-purple-950/40 text-purple-300 border-purple-500/40 hover:bg-purple-900/50'
                : 'bg-gray-800/40 text-gray-400 border-gray-700/40 hover:text-gray-200'
            }`}
            title={isAdmin ? 'لوحة التحكم الإدارية' : 'التبديل إلى وضع المدير للتجربة'}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">
              {isAdmin ? (activeTab === 'admin' ? 'الخروج' : 'الإدارة') : 'مدير'}
            </span>
          </button>

          {/* User Profile Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141522] border border-white/10 hover:border-white/20 transition-all"
                aria-label="قائمة المستخدم"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-[#FF2A55]/40"
                />
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
              </button>

              {menuOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-[#141522] border border-[#232538] shadow-2xl p-2 z-50 text-right animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2 border-b border-white/5 mb-1">
                    <p className="text-sm font-bold text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {user.coins} عملة
                      </span>
                      {user.vipLevel !== 'free' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                          VIP 👑
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-right"
                  >
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    الملف الشخصي والإعدادات
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('wallet');
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors text-right"
                  >
                    <Coins className="w-4 h-4" />
                    المحفظة وشحن العملات
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-purple-400 hover:bg-purple-500/10 rounded-xl transition-colors text-right"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      لوحة تحكم الإدارة
                    </button>
                  )}

                  <div className="my-1 border-t border-white/5" />

                  <button
                    onClick={() => {
                      switchUserRole(user.role === 'admin' ? 'user' : 'admin');
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-xl transition-colors text-right"
                  >
                    تبديل الحساب ({user.role === 'admin' ? 'مستخدم عادي' : 'مدير'})
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-right"
                  >
                    <LogOut className="w-4 h-4" />
                    تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
