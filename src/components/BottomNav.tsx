import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Compass, PlayCircle, Bookmark, User as UserIcon } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, openPlayer, series, isPlayerOpen } = useApp();

  if (isPlayerOpen) return null;

  const handleWatchClick = () => {
    // Open vertical player on the first available series or trending series
    if (series.length > 0) {
      openPlayer(series[0].id);
    } else {
      setActiveTab('watch');
    }
  };

  const navItems = [
    {
      id: 'home',
      label: 'الرئيسية',
      icon: Home,
      action: () => setActiveTab('home'),
    },
    {
      id: 'explore',
      label: 'اكتشف',
      icon: Compass,
      action: () => setActiveTab('explore'),
    },
    {
      id: 'watch',
      label: 'مشاهدة',
      icon: PlayCircle,
      isSpecial: true,
      action: handleWatchClick,
    },
    {
      id: 'library',
      label: 'مكتبتي',
      icon: Bookmark,
      action: () => setActiveTab('library'),
    },
    {
      id: 'profile',
      label: 'حسابي',
      icon: UserIcon,
      action: () => setActiveTab('profile'),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0B0F]/95 backdrop-blur-lg border-t border-[#1C1D2A] pb-safe transition-all"
      aria-label="شريط التنقل السفلي"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="relative -top-3 flex flex-col items-center group focus:outline-none"
                aria-label={item.label}
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#FF2A55] to-[#FF5E3A] flex items-center justify-center text-white shadow-xl shadow-[#FF2A55]/40 group-hover:scale-105 active:scale-95 transition-all">
                  <Icon className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-bold text-[#FF2A55] mt-1">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all focus:outline-none ${
                isActive
                  ? 'text-[#FF2A55]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              aria-label={item.label}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                }`}
              />
              <span
                className={`text-[10px] font-semibold mt-1 transition-all ${
                  isActive ? 'text-white font-bold' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A55] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
