import React from 'react';
import { useApp } from '../context/AppContext';
import { Episode, Series } from '../types';
import { X, Play, Lock, Sparkles, Check } from 'lucide-react';

interface EpisodeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  series: Series;
  episodes: Episode[];
  currentEpisodeId: string;
  onSelectEpisode: (episodeId: string) => void;
}

export const EpisodeSheet: React.FC<EpisodeSheetProps> = ({
  isOpen,
  onClose,
  series,
  episodes,
  currentEpisodeId,
  onSelectEpisode,
}) => {
  const { isEpisodeUnlocked, isAdmin, user } = useApp();

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-x-0 bottom-0 top-1/4 z-50 rounded-t-3xl bg-[#10111A]/95 backdrop-blur-xl border-t border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-250 text-right touch-auto"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h3 className="font-bold text-sm text-white">{series.title}</h3>
          <p className="text-[11px] text-gray-400">
            اختر حلقة للمشاهدة ({episodes.length} حلقة)
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="إغلاق قائمة الحلقات"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Episode Grid / List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar touch-pan-y overscroll-contain">
        {episodes.map((ep) => {
          const isCurrent = ep.id === currentEpisodeId;
          const unlocked =
            ep.isFree ||
            isAdmin ||
            user?.vipLevel !== 'free' ||
            isEpisodeUnlocked(ep.id);

          return (
            <div
              key={ep.id}
              onClick={() => onSelectEpisode(ep.id)}
              className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-[#FF2A55]/15 border-[#FF2A55] text-white shadow-md'
                  : 'bg-[#161826] border-white/5 hover:border-white/20 text-gray-300'
              }`}
            >
              {/* Thumbnail with overlay icon */}
              <div className="relative w-20 aspect-video rounded-xl overflow-hidden bg-black/60 shrink-0">
                <img
                  src={ep.thumbnailUrl}
                  alt={ep.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  {isCurrent ? (
                    <span className="w-3 h-3 rounded-full bg-[#FF2A55] animate-ping" />
                  ) : unlocked ? (
                    <Play className="w-4 h-4 text-white fill-white" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-400" />
                  )}
                </div>
              </div>

              {/* Episode Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-white truncate">
                    الحلقة {ep.episodeNumber}: {ep.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span>{Math.floor(ep.duration / 60)}د {ep.duration % 60}ث</span>
                  <span>•</span>
                  <span>{ep.viewsCount} مشاهدة</span>
                </div>
              </div>

              {/* Status Badge */}
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
  );
};
