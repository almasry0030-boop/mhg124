import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StorageService } from '../services/storage';
import {
  X,
  Play,
  Heart,
  Bookmark,
  Share2,
  Star,
  Eye,
  Lock,
  Layers,
  Sparkles,
  Building,
  RotateCcw,
  Check
} from 'lucide-react';

export const SeriesDetailsPage: React.FC = () => {
  const {
    viewingSeriesId,
    closeSeriesDetails,
    series: allSeries,
    openPlayer,
    toggleFavorite,
    favorites,
    toggleFollow,
    follows,
    isEpisodeUnlocked,
    isAdmin,
    user,
    watchHistory,
    showToast,
  } = useApp();

  const series = useMemo(() => {
    return allSeries.find((s) => s.id === viewingSeriesId);
  }, [allSeries, viewingSeriesId]);

  const episodes = useMemo(() => {
    if (!viewingSeriesId) return [];
    return StorageService.getEpisodes(viewingSeriesId);
  }, [viewingSeriesId]);

  // Check last watched episode for resume feature
  const lastWatchedItem = useMemo(() => {
    if (!viewingSeriesId) return null;
    return watchHistory.find((w) => w.seriesId === viewingSeriesId);
  }, [viewingSeriesId, watchHistory]);

  if (!viewingSeriesId || !series) return null;

  const isFav = favorites.includes(series.id);
  const isFollowing = follows.includes(series.id);

  const formattedViews = (views: number) => {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(0) + 'K';
    return views.toString();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: series.title,
        text: series.synopsis,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast('تم نسخ رابط المسلسل 📋');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0B0F]/95 backdrop-blur-xl overflow-y-auto pb-24 text-right animate-in fade-in duration-200">
      {/* Top Floating Close Button */}
      <div className="sticky top-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-[#0B0B0F] to-transparent">
        <button
          onClick={closeSeriesDetails}
          className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/90 border border-white/10 shadow-lg cursor-pointer"
          aria-label="إغلاق تفاصيل المسلسل"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold text-gray-300">تفاصيل المسلسل</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-14">
        {/* Backdrop Banner */}
        <div className="relative h-64 sm:h-96 w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl mb-6">
          <img
            src={series.backdropUrl}
            alt={series.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/60 to-transparent" />
        </div>

        {/* Header Metadata Section */}
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-8 -mt-24 sm:-mt-32 relative z-10 px-2">
          {/* Vertical Poster */}
          <div className="w-32 sm:w-44 aspect-[3/4.2] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0 mx-auto sm:mx-0">
            <img
              src={series.posterUrl}
              alt={series.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details & Badges */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {series.isExclusive && (
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-black flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" /> حصري
                </span>
              )}
              {series.isNew && (
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#FF2A55] text-white">
                  جديد
                </span>
              )}
              <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-white/10 text-emerald-400">
                {series.status === 'completed' ? 'مسلسل مكتمل' : 'مستمر'}
              </span>
              <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-white/10 text-amber-400 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400" /> {series.rating}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
              {series.title}
            </h1>

            <div className="flex items-center gap-3 text-xs text-gray-400 mb-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-[#FF2A55]" /> {formattedViews(series.totalViews)} مشاهدة
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#FF2A55]" /> {series.episodesCount} حلقات
              </span>
              <span>•</span>
              <span>سنة {series.releaseYear}</span>
              {series.productionStudio && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" /> {series.productionStudio}
                  </span>
                </>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Main Watch / Resume button */}
              <button
                onClick={() => {
                  closeSeriesDetails();
                  openPlayer(
                    series.id,
                    lastWatchedItem ? lastWatchedItem.episodeId : episodes[0]?.id
                  );
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF2A55] to-[#FF5E3A] hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-[#FF2A55]/30 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                {lastWatchedItem
                  ? `استكمال المشاهدة (حلقة ${lastWatchedItem.episodeNumber})`
                  : 'مشاهدة الحلقة الأولى'}
              </button>

              {/* Favorite Button */}
              <button
                onClick={() => toggleFavorite(series.id)}
                className={`p-3 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                  isFav
                    ? 'bg-[#FF2A55] text-white border-[#FF2A55]'
                    : 'bg-[#151724] border-white/10 text-gray-300 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                <span>{isFav ? 'في المفضلة' : 'أضف للمفضلة'}</span>
              </button>

              {/* Follow Button */}
              <button
                onClick={() => toggleFollow(series.id)}
                className={`p-3 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                  isFollowing
                    ? 'bg-purple-600 text-white border-purple-500'
                    : 'bg-[#151724] border-white/10 text-gray-300 hover:text-white'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isFollowing ? 'fill-white' : ''}`} />
                <span>{isFollowing ? 'تتابعه' : 'متابعة'}</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="p-3 rounded-xl bg-[#151724] border border-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="مشاركة"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Synopsis & Tags */}
        <div className="rounded-2xl bg-[#131420] border border-white/10 p-5 mb-8">
          <h3 className="font-bold text-sm text-white mb-2">قصة المسلسل:</h3>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal mb-4">
            {series.synopsis}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap">
            {series.tags.map((t, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#1D1F30] text-gray-300 border border-white/5"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Episodes List Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#FF2A55]" />
              قائمة الحلقات ({episodes.length})
            </h3>
            <span className="text-xs text-gray-400">
              الحلقات الأولى مجانية للاستمتاع
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {episodes.map((ep) => {
              const unlocked =
                ep.isFree ||
                isAdmin ||
                user?.vipLevel !== 'free' ||
                isEpisodeUnlocked(ep.id);

              const isWatched = watchHistory.find((w) => w.episodeId === ep.id);

              return (
                <div
                  key={ep.id}
                  onClick={() => {
                    closeSeriesDetails();
                    openPlayer(series.id, ep.id);
                  }}
                  className="group relative flex items-center gap-3 p-3 rounded-2xl bg-[#131420] border border-white/5 hover:border-[#FF2A55]/40 transition-all cursor-pointer hover:shadow-lg"
                >
                  {/* Thumbnail */}
                  <div className="relative w-24 aspect-video rounded-xl overflow-hidden bg-black shrink-0">
                    <img
                      src={ep.thumbnailUrl}
                      alt={ep.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      {unlocked ? (
                        <Play className="w-5 h-5 text-white fill-white group-hover:scale-110 transition-transform" />
                      ) : (
                        <Lock className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    {/* Watched progress bar */}
                    {isWatched && isWatched.percent > 0 && (
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                        <div
                          className="h-full bg-[#FF2A55]"
                          style={{ width: `${isWatched.percent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#FF2A55] transition-colors mb-1">
                      الحلقة {ep.episodeNumber}: {ep.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 line-clamp-1 mb-1 font-normal">
                      {ep.synopsis || 'أحداث درامية ومثيرة'}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span>{Math.floor(ep.duration / 60)} دقيقة</span>
                      <span>•</span>
                      <span>{ep.viewsCount} مشاهدة</span>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="shrink-0">
                    {ep.isFree ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                        مجانية
                      </span>
                    ) : unlocked ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> مفتوحة
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> {ep.unlockPrice || 10} عملة
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
