import React from 'react';
import { useApp } from '../context/AppContext';
import { StorageService } from '../services/storage';
import { X, Bell, CheckCheck, Coins, CreditCard, Sparkles, Film } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { notifications, refreshData } = useApp();

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    notifications.forEach((n) => StorageService.markNotificationAsRead(n.id));
    refreshData();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'coins':
        return <Coins className="w-5 h-5 text-amber-400" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-blue-400" />;
      case 'episode':
        return <Film className="w-5 h-5 text-[#FF2A55]" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 text-right animate-in fade-in">
      <div className="w-full max-w-md max-h-[85vh] rounded-3xl bg-[#141522] border border-white/15 p-5 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#FF2A55]" />
            <h3 className="font-bold text-sm text-white">مركز الإشعارات</h3>
          </div>
          <div className="flex items-center gap-3">
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> قراءة الكل
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 no-scrollbar pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs">لا توجد إشعارات جديدة حالياً</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  StorageService.markNotificationAsRead(n.id);
                  refreshData();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 items-start ${
                  !n.read
                    ? 'bg-[#1D1F32] border-[#FF2A55]/30 shadow-md'
                    : 'bg-[#11121C] border-white/5 opacity-80'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-xs font-bold text-white truncate">{n.title}</h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-[#FF2A55] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed font-normal">
                    {n.body}
                  </p>
                  <span className="text-[9px] text-gray-500 mt-1 block">
                    {new Date(n.createdAt).toLocaleDateString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
