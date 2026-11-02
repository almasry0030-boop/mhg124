import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SeriesCard } from '../components/SeriesCard';
import { filterAndSortSeries } from '../utils/rules';
import {
  Search,
  SlidersHorizontal,
  X,
  History,
  Sparkles,
  Layers,
  ArrowUpDown
} from 'lucide-react';

const RECENT_SEARCHES_KEY = 'shortdrama_recent_searches';

export const ExplorePage: React.FC = () => {
  const { series, categories } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'completed' | 'ongoing'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest' | 'views'>('popular');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {}
  }, []);

  const saveSearchTerm = (term: string) => {
    if (!term.trim()) return;
    const updated = [term.trim(), ...recentSearches.filter((s) => s !== term.trim())].slice(0, 8);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      saveSearchTerm(searchTerm);
    }
  };

  // Filtered and sorted results using pure rules
  const results = useMemo(() => {
    return filterAndSortSeries(series, {
      searchTerm,
      categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
      status: selectedStatus,
      sortBy,
    });
  }, [series, searchTerm, selectedCategory, selectedStatus, sortBy]);

  // Suggestions while typing
  const liveSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    return series
      .filter((s) => s.title.toLowerCase().includes(term) || s.tags.some((t) => t.toLowerCase().includes(term)))
      .slice(0, 5);
  }, [series, searchTerm]);

  return (
    <div className="space-y-6 pb-24 text-right">
      {/* Search Header */}
      <div className="space-y-3">
        <h1 className="text-2xl font-black text-white">اكتشف المسلسلات والدراما 🔍</h1>
        <p className="text-xs text-gray-400">
          ابحث في أضخم مكتبة مسلسلات قصيرة، اختر التصنيف، واستمتع بالمشاهدة
        </p>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم المسلسل، الأبطال، أو الهاشتاج (مثال: انتقام)..."
              className="w-full rounded-2xl bg-[#141522] border border-white/10 px-10 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF2A55] transition-colors"
            />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFiltersModal(!showFiltersModal)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              showFiltersModal || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'bg-[#FF2A55] text-white border-[#FF2A55]'
                : 'bg-[#141522] text-gray-300 border-white/10 hover:text-white'
            }`}
            title="خيارات الفلترة المتقدمة"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </form>

        {/* Recent searches history tags */}
        {!searchTerm && recentSearches.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <History className="w-3 h-3" /> عمليات البحث الأخيرة:
            </span>
            {recentSearches.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setSearchTerm(s)}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#141522] text-gray-300 hover:text-white border border-white/5 hover:border-white/20 transition-colors"
              >
                {s}
              </button>
            ))}
            <button
              onClick={clearRecentSearches}
              className="text-[10px] text-red-400/80 hover:text-red-400 underline mr-1"
            >
              مسح السجل
            </button>
          </div>
        )}

        {/* Live suggestions dropdown */}
        {searchTerm && liveSuggestions.length > 0 && (
          <div className="rounded-2xl bg-[#141522] border border-white/10 p-2 shadow-xl divide-y divide-white/5">
            {liveSuggestions.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  setSearchTerm(s.title);
                  saveSearchTerm(s.title);
                }}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer text-xs"
              >
                <img src={s.posterUrl} alt={s.title} className="w-8 h-10 object-cover rounded-md" />
                <div className="flex-1">
                  <p className="font-bold text-white">{s.title}</p>
                  <p className="text-[10px] text-gray-400">{s.tags.join(' • ')}</p>
                </div>
                <span className="text-amber-400 text-[11px] font-bold">★ {s.rating}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Filters Panel (Collapsible) */}
      {showFiltersModal && (
        <div className="rounded-2xl bg-[#141522] border border-white/10 p-4 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-[#FF2A55]" />
              تصفية النتائج
            </span>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSortBy('popular');
              }}
              className="text-[11px] text-[#FF2A55] hover:underline"
            >
              إعادة تعيين
            </button>
          </div>

          {/* Categories Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              التصنيف:
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-[#FF2A55] text-white'
                    : 'bg-[#1D1F30] text-gray-400 hover:text-white'
                }`}
              >
                الكل
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === c.id
                      ? 'bg-[#FF2A55] text-white'
                      : 'bg-[#1D1F30] text-gray-400 hover:text-white'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                حالة المسلسل:
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF2A55]"
              >
                <option value="all">الكل (مكتمل ومستمر)</option>
                <option value="ongoing">مسلسلات مستمرة</option>
                <option value="completed">مسلسلات مكتملة</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                الترتيب حسب:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF2A55]"
              >
                <option value="popular">الأكثر شعبية</option>
                <option value="rating">الأعلى تقييماً</option>
                <option value="views">الأكثر مشاهدة</option>
                <option value="newest">أحدث الإضافات</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Count & Quick Sort Indicator */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span>عُثر على ({results.length}) مسلسل</span>
        <div className="flex items-center gap-1.5 text-[11px]">
          <ArrowUpDown className="w-3 h-3 text-[#FF2A55]" />
          <span>مرتب حسب: </span>
          <span className="text-white font-bold">
            {sortBy === 'popular'
              ? 'الأكثر شعبية'
              : sortBy === 'rating'
              ? 'الأعلى تقييماً'
              : sortBy === 'views'
              ? 'المشاهدات'
              : 'الأحدث'}
          </span>
        </div>
      </div>

      {/* Results Grid */}
      {results.length === 0 ? (
        <div className="text-center py-16 rounded-3xl bg-[#141522] border border-white/5 p-6">
          <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            لم نجد نتائج مطابقة لبحثك
          </h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto mb-4">
            جرب البحث بكلمات مختلفة أو اختر تصنيفاً آخر من القائمة أعلاه
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedStatus('all');
            }}
            className="px-4 py-2 rounded-xl bg-[#FF2A55] text-white text-xs font-bold hover:bg-[#e02449]"
          >
            عرض جميع المسلسلات
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {results.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      )}
    </div>
  );
};
