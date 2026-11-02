import React from 'react';
import { Series } from '../types';
import { useApp } from '../context/AppContext';
import { Star, Eye, Play, Sparkles } from 'lucide-react';

interface SeriesCardProps {
  series: Series;
  aspectRatio?: 'poster' | 'tall';
}

export const SeriesCard: React.FC<SeriesCardProps> = ({ series }) => {
  const { openSeriesDetails, openPlayer } = useApp();

  const formattedViews = (views: number) => {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(0) + 'K';
    return views.toString();
  };

  return (
    <div
      onClick={() => openSeriesDetails(series.id)}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#13141E] border border-[#212334] hover:border-[#FF2A55]/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#FF2A55]/15 cursor-pointer text-right"
    >
      {/* Poster Image Container (2:3 / 9:16 aspect ratio) */}
      <div className="relative aspect-[3/4.2] w-full overflow-hidden bg-[#0D0E15]">
        <img
          src={series.posterUrl}
          alt={series.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#13141E] via-transparent to-black/40 opacity-90 group-hover:opacity-75 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
          {series.isExclusive && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-black flex items-center gap-0.5 shadow-sm">
              <Sparkles className="w-2.5 h-2.5" /> حصري
            </span>
          )}
          {series.isNew && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FF2A55] text-white">
              جديد
            </span>
          )}
          {series.status === 'completed' && (
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-emerald-600/90 text-white">
              مكتمل
            </span>
          )}
        </div>

        {/* Top Left Rating */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-amber-400 text-[10px] font-bold border border-white/10">
          <Star className="w-2.5 h-2.5 fill-amber-400" />
          <span>{series.rating}</span>
        </div>

        {/* Bottom Poster Info (Episodes & Views) */}
        <div className="absolute bottom-2 inset-x-2 flex items-center justify-between text-[11px] text-gray-300 font-medium z-10">
          <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-gray-200 text-[10px]">
            {series.episodesCount} حلقات
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-300">
            <Eye className="w-3 h-3 text-[#FF2A55]" />
            {formattedViews(series.totalViews)}
          </span>
        </div>

        {/* Hover Quick Play Overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openPlayer(series.id);
            }}
            className="w-12 h-12 rounded-full bg-[#FF2A55] text-white flex items-center justify-center shadow-lg shadow-[#FF2A55]/50 transform scale-90 group-hover:scale-100 transition-transform"
            aria-label={`شاهد ${series.title}`}
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between">
        <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-[#FF2A55] transition-colors">
          {series.title}
        </h3>
        <p className="text-[11px] text-gray-400 line-clamp-1 mt-1 font-normal">
          {series.tags.slice(0, 2).map((t) => `#${t}`).join(' ')}
        </p>
      </div>
    </div>
  );
};
