import React, { useState } from 'react';
import { Series } from '../types';
import { useApp } from '../context/AppContext';
import { Play, Heart, Film, Star, Sparkles, Layers } from 'lucide-react';

interface HeroBannerProps {
  featuredSeries: Series[];
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ featuredSeries }) => {
  const { openPlayer, openSeriesDetails, toggleFavorite, favorites } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  if (!featuredSeries.length) return null;
  const current = featuredSeries[currentIndex] || featuredSeries[0];
  const isFav = favorites.includes(current.id);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-[#12131D] border border-white/10 shadow-2xl group">
      {/* Background Backdrop Image */}
      <div className="relative h-[340px] sm:h-[420px] w-full">
        <img
          src={current.backdropUrl}
          alt={current.title}
          className="w-full h-full object-cover object-top scale-100 group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F] via-[#0B0B0F]/40 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 z-10 text-right">
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {current.isExclusive && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-black flex items-center gap-1 shadow-md shadow-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" /> حصري
            </span>
          )}
          {current.isNew && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FF2A55] text-white">
              جديد
            </span>
          )}
          <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-black/60 backdrop-blur-md text-gray-300 border border-white/10 flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#FF2A55]" /> {current.episodesCount} حلقات
          </span>
          <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-black/60 backdrop-blur-md text-amber-400 border border-white/10 flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400" /> {current.rating}
          </span>
        </div>

        {/* Title */}
        <h2
          onClick={() => openSeriesDetails(current.id)}
          className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-2 hover:text-[#FF2A55] transition-colors cursor-pointer"
        >
          {current.title}
        </h2>

        {/* Synopsis */}
        <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 max-w-2xl font-normal mb-4 leading-relaxed">
          {current.synopsis}
        </p>

        {/* Tags */}
        <div className="flex items-center gap-1.5 mb-5 flex-wrap">
          {current.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium text-gray-300 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-md"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Watch Now */}
          <button
            onClick={() => openPlayer(current.id)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2A55] to-[#FF4E3E] text-white font-bold text-sm hover:opacity-95 active:scale-95 transition-all shadow-lg shadow-[#FF2A55]/30 cursor-pointer"
            aria-label="شاهد الآن"
          >
            <Play className="w-4 h-4 fill-white" />
            شاهد الآن
          </button>

          {/* Details / Episodes */}
          <button
            onClick={() => openSeriesDetails(current.id)}
            className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md text-white font-semibold text-sm hover:bg-white/20 transition-all border border-white/10 cursor-pointer"
          >
            تفاصيل الحلقات
          </button>

          {/* Trailer Button */}
          {current.trailerUrl && (
            <button
              onClick={() => setShowTrailerModal(true)}
              className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md text-gray-200 hover:text-white hover:bg-white/20 transition-all border border-white/10 cursor-pointer"
              title="مشاهدة الإعلان الترويجي"
              aria-label="مشاهدة الإعلان الترويجي"
            >
              <Film className="w-4 h-4" />
            </button>
          )}

          {/* Favorite Button */}
          <button
            onClick={() => toggleFavorite(current.id)}
            className={`p-2.5 rounded-xl backdrop-blur-md transition-all border border-white/10 cursor-pointer ${
              isFav
                ? 'bg-[#FF2A55] text-white border-[#FF2A55]'
                : 'bg-white/10 text-gray-300 hover:text-white hover:bg-white/20'
            }`}
            title="إضافة إلى المفضلة"
            aria-label="إضافة إلى المفضلة"
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Slide indicators if multiple featured */}
        {featuredSeries.length > 1 && (
          <div className="flex items-center gap-1.5 mt-4">
            {featuredSeries.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  currentIndex === idx
                    ? 'w-6 bg-[#FF2A55]'
                    : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`الشريحة ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      {showTrailerModal && current.trailerUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-black border border-white/20 shadow-2xl">
            <div className="p-3 bg-[#12131D] flex items-center justify-between border-b border-white/10">
              <span className="text-sm font-bold text-white">إعلان: {current.title}</span>
              <button
                onClick={() => setShowTrailerModal(false)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/10"
              >
                إغلاق ✕
              </button>
            </div>
            <div className="aspect-[9/16] bg-black">
              <video
                src={current.trailerUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3 bg-[#12131D] text-center">
              <button
                onClick={() => {
                  setShowTrailerModal(false);
                  openPlayer(current.id);
                }}
                className="w-full py-2.5 rounded-xl bg-[#FF2A55] text-white font-bold text-sm hover:bg-[#e02449]"
              >
                بدء مشاهدة المسلسل الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
