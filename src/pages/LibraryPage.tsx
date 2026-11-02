import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SeriesCard } from '../components/SeriesCard';
import { StorageService } from '../services/storage';
import {
  Bookmark,
  Heart,
  Clock,
  CheckCircle,
  Play,
  Trash2,
  Sparkles
} from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const { user, series, favorites, follows, watchHistory, openPlayer, refreshData, showToast } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'favorites' | 'history' | 'follows' | 'completed'>('favorites');

  const favoriteSeries = useMemo(() => {
    return series.filter((s) => favorites.includes(s.id));
  }, [series, favorites]);

  const followSeries = useMemo(() => {
    return series.filter((s) => follows.includes(s.id));
  }, [series, follows]);

  const completedSeries = useMemo(() => {
    return series.filter((s) => s.status === 'completed');
  }, [series]);

  const handleClearHistory = () => {
    if (!user) return;
    StorageService.clearWatchHistory(user.id);
    refreshData();
    showToast('تم مسح سجل المشاهدة بالكامل');
  };

  return (
    <div className="space-y-6 pb-24 text-right">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-[#FF2A55]" />
          مكتبتي الشخصية 📚
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          مسلسلاتك المفضلة، المسلسلات التي تتابعها، وسجل المشاهدة المستمر
        </p>
      </div>

      {/* Sub-tabs pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveSubTab('favorites')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'favorites'
              ? 'bg-[#FF2A55] text-white shadow-md'
              : 'bg-[#141522] text-gray-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          المفضلة ({favoriteSeries.length})
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'history'
              ? 'bg-[#FF2A55] text-white shadow-md'
              : 'bg-[#141522] text-gray-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          سجل المشاهدة ({watchHistory.length})
        </button>

        <button
          onClick={() => setActiveSubTab('follows')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'follows'
              ? 'bg-[#FF2A55] text-white shadow-md'
              : 'bg-[#141522] text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          أتابعها ({followSeries.length})
        </button>

        <button
          onClick={() => setActiveSubTab('completed')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'completed'
              ? 'bg-[#FF2A55] text-white shadow-md'
              : 'bg-[#141522] text-gray-400 hover:text-white'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          مسلسلات مكتملة ({completedSeries.length})
        </button>
      </div>

      {/* Content based on sub-tab */}
      {activeSubTab === 'favorites' && (
        <div>
          {favoriteSeries.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-[#141522] border border-white/5 p-6">
              <Heart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">
                قائمة المفضلة فارغة
              </h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                أضف المسلسلات التي تنال إعجابك إلى المفضلة لتصل إليها بسهولة لاحقاً.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {favoriteSeries.map((s) => (
                <SeriesCard key={s.id} series={s} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'history' && (
        <div className="space-y-4">
          {watchHistory.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                آخر المسلسلات والحلقات التي شاهدتها
              </span>
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                مسح السجل
              </button>
            </div>
          )}

          {watchHistory.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-[#141522] border border-white/5 p-6">
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">
                لا يوجد سجل مشاهدة بعد
              </h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                ابدأ بمشاهدة أي حلقة وسيتم حفظ تقدمك تلقائياً هنا لتتمكن من استكمالها في أي وقت.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {watchHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openPlayer(item.seriesId, item.episodeId)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#141522] border border-white/5 hover:border-[#FF2A55]/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-20 aspect-video rounded-xl overflow-hidden bg-black shrink-0">
                      <img
                        src={item.posterUrl}
                        alt={item.seriesTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                        <div
                          className="h-full bg-[#FF2A55]"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#FF2A55] transition-colors">
                        {item.seriesTitle}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        الحلقة {item.episodeNumber} • تقدم {item.percent}%
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {new Date(item.updatedAt).toLocaleString('ar-EG')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openPlayer(item.seriesId, item.episodeId);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#FF2A55] text-white text-xs font-bold hover:bg-[#e02449] transition-all flex items-center gap-1"
                  >
                    استكمال
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'follows' && (
        <div>
          {followSeries.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-[#141522] border border-white/5 p-6">
              <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">
                لا تتابع أي مسلسل حالياً
              </h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                تابع مسلسلاتك المفضلة لتصلك إشعارات فورية بكل حلقة جديدة تصدر!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {followSeries.map((s) => (
                <SeriesCard key={s.id} series={s} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'completed' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {completedSeries.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      )}
    </div>
  );
};
