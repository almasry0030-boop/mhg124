import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { HeroBanner } from '../components/HeroBanner';
import { SeriesCard } from '../components/SeriesCard';
import {
  Flame,
  Sparkles,
  TrendingUp,
  Clock,
  Play,
  ArrowLeft,
  Crown
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { series, categories, watchHistory, openPlayer, openSeriesDetails, setActiveTab } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('cat_all');

  // Featured series for Hero Banner
  const featuredList = useMemo(() => {
    const feat = series.filter((s) => s.isFeatured);
    return feat.length ? feat : series.slice(0, 3);
  }, [series]);

  // Filtered series by category
  const filteredSeries = useMemo(() => {
    if (selectedCategory === 'cat_all') return series;
    return series.filter((s) => s.categoryIds.includes(selectedCategory));
  }, [series, selectedCategory]);

  // Exclusive series
  const exclusiveSeries = useMemo(() => {
    return series.filter((s) => s.isExclusive);
  }, [series]);

  // Trending series (sorted by views + likes)
  const trendingSeries = useMemo(() => {
    return [...series].sort((a, b) => b.totalViews - a.totalViews);
  }, [series]);

  // Continue watching list from history
  const continueWatching = useMemo(() => {
    return watchHistory.slice(0, 4);
  }, [watchHistory]);

  return (
    <div className="space-y-8 pb-20 text-right">
      {/* 1. Hero Banner */}
      <HeroBanner featuredSeries={featuredList} />

      {/* 2. Horizontal Categories Navigation */}
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#FF2A55] text-white shadow-lg shadow-[#FF2A55]/30 scale-105'
                    : 'bg-[#141522] text-gray-400 hover:text-white hover:bg-[#1E2032] border border-white/5'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Continue Watching Rail (if history exists) */}
      {continueWatching.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF2A55]" />
              متابعة المشاهدة
            </h3>
            <button
              onClick={() => setActiveTab('library')}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>عرض الكل</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {continueWatching.map((item) => (
              <div
                key={item.id}
                onClick={() => openPlayer(item.seriesId, item.episodeId)}
                className="group relative rounded-2xl overflow-hidden bg-[#131420] border border-white/10 hover:border-[#FF2A55] transition-all cursor-pointer p-2 flex gap-2.5 items-center"
              >
                <div className="relative w-14 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                  <img
                    src={item.posterUrl}
                    alt={item.seriesTitle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Play className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    {item.seriesTitle}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    الحلقة {item.episodeNumber} • {item.percent}%
                  </p>
                  <div className="w-full bg-white/10 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-[#FF2A55] h-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Trending / Selected Category Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#FF2A55] animate-pulse" />
            <h3 className="text-lg font-black text-white">
              {selectedCategory === 'cat_all' ? 'الأكثر مشاهدة اليوم 🔥' : 'المسلسلات المختارة'}
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('explore')}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>اكتشف المزيد</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2-column mobile, 4-column tablet, 6-column desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filteredSeries.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      </section>

      {/* 5. Exclusive Dramas Rail */}
      {exclusiveSeries.length > 0 && selectedCategory === 'cat_all' && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-black text-white">
                إنتاجات حصرية لكبار الشخصيات 👑
              </h3>
            </div>
            <span className="text-xs text-amber-400 font-bold">بأعلى جودة</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {exclusiveSeries.map((s) => (
              <SeriesCard key={s.id} series={s} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Popular Dramas Ranking Rail */}
      {selectedCategory === 'cat_all' && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FF2A55]" />
              <h3 className="text-lg font-black text-white">
                توب 10: الأعلى مشاهدة في الشرق الأوسط ⚡
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {trendingSeries.slice(0, 3).map((s, idx) => (
              <div
                key={s.id}
                onClick={() => openSeriesDetails(s.id)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#141522] border border-white/5 hover:border-[#FF2A55]/40 transition-all cursor-pointer group"
              >
                <span className="text-3xl font-black italic text-gray-600 group-hover:text-[#FF2A55] transition-colors w-8 text-center">
                  #{idx + 1}
                </span>
                <div className="w-16 aspect-[3/4] rounded-xl overflow-hidden bg-black shrink-0">
                  <img
                    src={s.posterUrl}
                    alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate group-hover:text-[#FF2A55] transition-colors">
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                    {s.synopsis}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                    <span className="text-amber-400 font-bold">★ {s.rating}</span>
                    <span>•</span>
                    <span>{s.episodesCount} حلقات</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
