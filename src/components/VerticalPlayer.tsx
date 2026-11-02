import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Episode, Series } from '../types';
import { StorageService } from '../services/storage';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  List,
  Sparkles,
  Lock,
  Coins,
  X,
  CheckCircle2,
  Settings as SettingsIcon,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { CommentsDrawer } from './CommentsDrawer';
import { EpisodeSheet } from './EpisodeSheet';

export const VerticalPlayer: React.FC = () => {
  const {
    isPlayerOpen,
    closePlayer,
    playingSeriesId,
    playingEpisodeId,
    openPlayer,
    user,
    isAdmin,
    isEpisodeUnlocked,
    unlockEpisode,
    toggleFavorite,
    favorites,
    toggleFollow,
    follows,
    recordWatchProgress,
    showToast,
    series: allSeries,
  } = useApp();

  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  // Video playback & control states
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [quality, setQuality] = useState('1080p');

  // Interactive overlays
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isEpisodeSheetOpen, setIsEpisodeSheetOpen] = useState(false);
  const [heartBurst, setHeartBurst] = useState<{ id: number; x: number; y: number }[]>([]);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [countdown, setCountdown] = useState(4);

  // In-player ad state
  const [showAd, setShowAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [canSkipAd, setCanSkipAd] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);
  const lastWheelTime = useRef<number>(0);
  const hideControlsTimeout = useRef<number | null>(null);
  const lastRecordedTimeRef = useRef<number>(0);

  // Lock background document scroll while the vertical player is open
  useEffect(() => {
    if (!isPlayerOpen) return;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    const origBodyOverflow = document.body.style.overflow;
    const origBodyPosition = document.body.style.position;
    const origBodyTop = document.body.style.top;
    const origBodyWidth = document.body.style.width;
    const origBodyOverscroll = document.body.style.overscrollBehavior;

    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.documentElement.style.overflow = origHtmlOverflow;
      document.documentElement.style.overscrollBehavior = origHtmlOverscroll;
      document.body.style.overflow = origBodyOverflow;
      document.body.style.overscrollBehavior = origBodyOverscroll;
      document.body.style.position = origBodyPosition;
      document.body.style.top = origBodyTop;
      document.body.style.width = origBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isPlayerOpen]);

  // Get current Series & its episodes
  const currentSeries = useMemo<Series | undefined>(() => {
    return allSeries.find((s) => s.id === playingSeriesId);
  }, [allSeries, playingSeriesId]);

  const seriesEpisodes = useMemo<Episode[]>(() => {
    if (!playingSeriesId) return [];
    return StorageService.getEpisodes(playingSeriesId);
  }, [playingSeriesId, isPlayerOpen, allSeries]);

  // Sync current episode index
  useEffect(() => {
    if (!seriesEpisodes.length) return;
    const idx = seriesEpisodes.findIndex((e) => e.id === playingEpisodeId);
    if (idx >= 0) {
      setCurrentEpisodeIndex(idx);
    } else {
      setCurrentEpisodeIndex(0);
    }
  }, [playingEpisodeId, seriesEpisodes]);

  const currentEpisode: Episode | undefined = seriesEpisodes[currentEpisodeIndex];

  // Episode like status
  const isEpisodeLiked = useMemo(() => {
    if (!user || !currentEpisode) return false;
    return StorageService.getEpisodeLikes(user.id).includes(currentEpisode.id);
  }, [user, currentEpisode]);

  const isFav = currentSeries ? favorites.includes(currentSeries.id) : false;
  const isFollowing = currentSeries ? follows.includes(currentSeries.id) : false;

  // Unlocked check
  const isUnlocked = useMemo(() => {
    if (!currentEpisode) return true;
    if (currentEpisode.isFree) return true;
    if (isAdmin || user?.vipLevel !== 'free') return true;
    return isEpisodeUnlocked(currentEpisode.id);
  }, [currentEpisode, isAdmin, user, isEpisodeUnlocked]);

  // Comments for current episode
  const commentsCount = useMemo(() => {
    if (!currentEpisode) return 0;
    return StorageService.getComments(currentEpisode.id).length;
  }, [currentEpisode, isCommentsOpen]);

  // Episode change setup & Autoplay handler
  useEffect(() => {
    setCurrentTime(0);
    setDuration(currentEpisode?.duration || 0);
    setShowEndScreen(false);
    setCountdown(4);
    setHasVideoError(false);

    // Subtle ad chance for free users on later episodes
    if (currentEpisodeIndex > 1 && user?.vipLevel === 'free' && Math.random() < 0.25) {
      setShowAd(true);
      setAdCountdown(5);
      setCanSkipAd(false);
    } else {
      setShowAd(false);
    }
  }, [currentEpisodeIndex, playingSeriesId]);

  // Active Video Autoplay & Cleanup lifecycle
  useEffect(() => {
    if (!isPlayerOpen || !isUnlocked || !currentEpisode?.videoUrl) return;

    const video = videoRef.current;
    if (!video) return;

    setIsBuffering(true);
    setHasVideoError(false);

    video.pause();
    video.currentTime = 0;
    video.src = currentEpisode.videoUrl;
    video.load();
    video.muted = isMuted;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
          setHasVideoError(false);
        })
        .catch((err) => {
          console.warn('Playback with audio prevented by browser, falling back to muted:', err);
          video.muted = true;
          setIsMuted(true);
          video.play()
            .then(() => {
              setIsPlaying(true);
              setIsBuffering(false);
              setHasVideoError(false);
            })
            .catch((e) => {
              console.warn('Video paused waiting for user gesture:', e);
              setIsPlaying(false);
              setIsBuffering(false);
              // Do NOT mark video file as broken when browser simply requires a tap
            });
        });
    }

    return () => {
      video.pause();
    };
  }, [currentEpisode?.id, isPlayerOpen, isUnlocked]);

  // Keep playback rate synced
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Ad timer
  useEffect(() => {
    if (!showAd) return;
    const interval = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          setCanSkipAd(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showAd]);

  // Auto-hide controls
  const handleUserActivity = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    hideControlsTimeout.current = window.setTimeout(() => {
      if (isPlaying && !showSettingsMenu) {
        setShowControls(false);
      }
    }, 4500);
  };

  // Video Loaded Metadata
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (dur && !isNaN(dur) && isFinite(dur)) {
      setDuration(dur);
    }
    setIsBuffering(false);
    setHasVideoError(false);
  };

  // Video time update
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration;
    setCurrentTime(curr);
    if (dur && !isNaN(dur) && isFinite(dur)) {
      setDuration(dur);
      if (currentEpisode && Math.abs(curr - lastRecordedTimeRef.current) >= 4) {
        lastRecordedTimeRef.current = curr;
        recordWatchProgress(currentEpisode, curr, dur);
      }
    }
  };

  // Video ended -> trigger end screen
  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (currentEpisode && duration > 0) {
      recordWatchProgress(currentEpisode, duration, duration);
    }
    setShowEndScreen(true);
  };

  // Auto-advance countdown on end screen
  useEffect(() => {
    if (!showEndScreen) return;
    if (currentEpisodeIndex >= seriesEpisodes.length - 1) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleNextEpisode();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showEndScreen, currentEpisodeIndex, seriesEpisodes.length]);

  // Swiping & Next/Previous navigation
  const handleNextEpisode = () => {
    if (currentEpisodeIndex < seriesEpisodes.length - 1) {
      const nextEp = seriesEpisodes[currentEpisodeIndex + 1];
      openPlayer(playingSeriesId!, nextEp.id);
    } else {
      showToast('أنت الآن تشاهد آخر حلقة متاحة في المسلسل!');
    }
  };

  const handlePrevEpisode = () => {
    if (currentEpisodeIndex > 0) {
      const prevEp = seriesEpisodes[currentEpisodeIndex - 1];
      openPlayer(playingSeriesId!, prevEp.id);
    } else {
      showToast('أنت في الحلقة الأولى');
    }
  };

  // Touch Swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diffY = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (diffY > 8) {
      isDragging.current = true;
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const endX = e.changedTouches[0].clientX;
    const diffY = touchStartY.current - endY;
    const diffX = (touchStartX.current || 0) - endX;

    // Trigger next/previous episode if vertical swipe exceeds threshold and is dominantly vertical
    if (Math.abs(diffY) > 40 && Math.abs(diffY) > Math.abs(diffX) * 1.1) {
      if (diffY > 0) {
        // Swiped Up -> Next Episode
        handleNextEpisode();
      } else {
        // Swiped Down -> Previous Episode
        handlePrevEpisode();
      }
    }
    touchStartY.current = null;
    touchStartX.current = null;
    // Suppress click for 150ms after dragging
    setTimeout(() => {
      isDragging.current = false;
    }, 150);
  };

  // Mouse wheel handler to switch episodes without scrolling background page
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastWheelTime.current < 450) return;
    if (e.deltaY > 30) {
      lastWheelTime.current = now;
      handleNextEpisode();
    } else if (e.deltaY < -30) {
      lastWheelTime.current = now;
      handlePrevEpisode();
    }
  };

  // Double tap to like or single tap to toggle play/pause
  const lastTapRef = useRef<number>(0);
  const handleScreenClick = (e: React.MouseEvent) => {
    // If user just dragged/swiped, ignore click
    if (isDragging.current) return;

    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (now - lastTapRef.current < 300) {
      // Double tap!
      if (user && currentEpisode) {
        if (!isEpisodeLiked) {
          StorageService.toggleEpisodeLike(user.id, currentEpisode.id);
        }
        const burstId = Date.now();
        setHeartBurst((prev) => [...prev, { id: burstId, x, y }]);
        setTimeout(() => {
          setHeartBurst((prev) => prev.filter((h) => h.id !== burstId));
        }, 900);
      }
    } else {
      // Single tap -> toggle Play/Pause
      togglePlayPause();
    }
    lastTapRef.current = now;
  };

  // Play / Pause toggle
  const togglePlayPause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch((err) => {
        console.warn('Play interrupted:', err);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
    handleUserActivity();
  };

  // Volume & Mute handlers
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      if (newVol > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      } else if (newVol === 0 && !isMuted) {
        videoRef.current.muted = true;
        setIsMuted(true);
      }
    }
    handleUserActivity();
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted && volume === 0) {
        setVolume(0.8);
        videoRef.current.volume = 0.8;
      }
    }
    handleUserActivity();
  };

  // Seek bar handler
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    handleUserActivity();
  };

  // 10-second skip
  const handleSkip = (seconds: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    const dur = duration || currentEpisode?.duration || 0;
    const targetTime = Math.max(0, Math.min(dur, (videoRef.current.currentTime || 0) + seconds));
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
    handleUserActivity();
  };

  // Like episode
  const handleLike = () => {
    if (!user) {
      showToast('يرجى تسجيل الدخول للإعجاب بالحلقة');
      return;
    }
    if (currentEpisode) {
      const liked = StorageService.toggleEpisodeLike(user.id, currentEpisode.id);
      showToast(liked ? 'أعجبتك هذه الحلقة ❤️' : 'تم إلغاء الإعجاب');
    }
  };

  // Share episode
  const handleShare = () => {
    if (navigator.share && currentEpisode) {
      navigator.share({
        title: currentSeries?.title || 'ShortDrama',
        text: `شاهد ${currentEpisode.title} على منصة ShortDrama`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast('تم نسخ رابط الحلقة إلى الحافظة 📋');
    }
  };

  if (!isPlayerOpen || !currentSeries || !currentEpisode) return null;

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center select-none overflow-hidden h-[100dvh] max-h-[100dvh] w-full overscroll-none touch-none"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        overflow: 'hidden',
        height: '100dvh',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onWheel={handleWheel}
      onMouseMove={handleUserActivity}
    >
      {/* 9:16 Responsive Container (full screen on mobile, phone frame on desktop) */}
      <div
        className="relative w-full h-[100dvh] max-h-[100dvh] max-w-[480px] aspect-[9/16] bg-black flex flex-col justify-between overflow-hidden shadow-2xl overscroll-none touch-none"
        style={{ aspectRatio: '9/16' }}
      >
        {/* Main Video Element */}
        {isUnlocked ? (
          <div
            className="absolute inset-0 bg-black flex items-center justify-center cursor-pointer overflow-hidden touch-none aspect-[9/16]"
            style={{ aspectRatio: '9/16' }}
            onClick={handleScreenClick}
          >
            {/* Real HTML5 Video Player connected to episode videoUrl */}
            {currentEpisode.videoUrl && !hasVideoError ? (
              <video
                ref={videoRef}
                src={currentEpisode.videoUrl}
                poster={currentEpisode.thumbnailUrl}
                playsInline
                preload="auto"
                loop={false}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => {
                  setIsBuffering(false);
                  setIsPlaying(true);
                }}
                onEnded={handleVideoEnded}
                onError={() => {
                  const mediaErr = videoRef.current?.error;
                  console.warn('Video error on episode:', currentEpisode.id, mediaErr);
                  if (mediaErr && mediaErr.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                    setHasVideoError(true);
                  }
                  setIsBuffering(false);
                }}
                className="w-full h-full object-cover aspect-[9/16]"
                style={{ aspectRatio: '9/16' }}
              />
            ) : (
              /* Requirement: Explicit message when video is missing or invalid */
              <div className="absolute inset-0 bg-[#0B0B0F]/95 flex flex-col items-center justify-center p-6 text-center z-20">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-white mb-2">
                  عذراً، ملف الفيديو غير متاح حالياً لهذه الحلقة
                </h4>
                <p className="text-xs text-gray-400 max-w-xs mb-6 leading-relaxed">
                  لم يتم العثور على ملف الفيديو. يمكنك الانتقال إلى الحلقة التالية أو تجربة حلقة أخرى.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextEpisode();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#FF2A55] text-white text-xs font-bold hover:bg-[#e02449]"
                  >
                    الحلقة التالية ←
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closePlayer();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white/10 text-gray-300 text-xs font-semibold hover:bg-white/20"
                  >
                    إغلاق المشغل
                  </button>
                </div>
              </div>
            )}

            {/* Buffering Spinner */}
            {isBuffering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 pointer-events-none">
                <div className="p-3 rounded-2xl bg-black/70 backdrop-blur-md flex items-center gap-2 text-white text-xs">
                  <Loader2 className="w-5 h-5 text-[#FF2A55] animate-spin" />
                  <span>جاري التحميل...</span>
                </div>
              </div>
            )}

            {/* Center Play Button Overlay when Paused */}
            {!isPlaying && !isBuffering && !hasVideoError && isUnlocked && !showEndScreen && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className="absolute inset-0 flex items-center justify-center z-25 cursor-pointer touch-auto"
                aria-label="تشغيل"
              >
                <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-2xl active:scale-90 transition-transform">
                  <Play className="w-8 h-8 fill-white ml-0.5 text-white" />
                </div>
              </div>
            )}

            {/* Unmute floating banner if started muted for autoplay */}
            {isMuted && isPlaying && !hasVideoError && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="absolute top-[calc(4rem+env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-xl flex items-center gap-1.5 animate-bounce cursor-pointer hover:bg-black touch-auto"
                title="اضغط لتشغيل الصوت"
              >
                <VolumeX className="w-4 h-4 text-amber-400" />
                <span>اضغط لتشغيل الصوت 🔊</span>
              </button>
            )}

            {/* Subtle Top & Bottom Gradients for Overlays */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none" />

            {/* Double Tap Heart Bursts */}
            {heartBurst.map((h) => (
              <div
                key={h.id}
                style={{ left: `${h.x}px`, top: `${h.y}px` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-ping duration-700"
              >
                <Heart className="w-20 h-20 fill-[#FF2A55] text-[#FF2A55] drop-shadow-xl" />
              </div>
            ))}

            {/* Center Play indicator when paused */}
            {!isPlaying && !showEndScreen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                aria-label="تشغيل الفيديو"
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-2xl hover:scale-110 active:scale-95 transition-transform cursor-pointer z-20 pointer-events-auto"
              >
                <Play className="w-8 h-8 fill-white ml-0.5" />
              </button>
            )}
          </div>
        ) : (
          /* Locked Episode Paywall Overlay */
          <div className="absolute inset-0 bg-[#0B0B0F]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-600/30 border border-amber-500/50 flex items-center justify-center text-amber-400 mb-4 animate-bounce">
              <Lock className="w-8 h-8" />
            </div>

            <span className="text-xs font-bold text-amber-400 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-2">
              حلقة مقفلة 🔒
            </span>

            <h3 className="text-xl font-black text-white mb-1">
              {currentEpisode.title}
            </h3>
            <p className="text-xs text-gray-400 mb-6 max-w-xs">
              لمتابعة الأحداث المشوقة، يرجى فتح هذه الحلقة باستخدام العملات أو شحن محفظتك.
            </p>

            <div className="w-full max-w-xs rounded-2xl bg-[#141522] border border-white/10 p-4 mb-6">
              <div className="flex items-center justify-between text-xs text-gray-300 pb-2 border-b border-white/5">
                <span>سعر فتح الحلقة:</span>
                <span className="font-bold text-amber-400 flex items-center gap-1 font-mono">
                  <Coins className="w-4 h-4" /> {currentEpisode.unlockPrice || 10} عملة
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-300 pt-2">
                <span>رصيدك الحالي:</span>
                <span className="font-bold text-white font-mono">
                  {user ? `${user.coins} عملة` : 'غير مسجل'}
                </span>
              </div>
            </div>

            <div className="w-full max-w-xs space-y-2.5">
              <button
                onClick={() => unlockEpisode(currentEpisode)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                فتح الحلقة الآن ({currentEpisode.unlockPrice || 10} عملة)
              </button>

              {currentEpisode.isAdUnlockable && (
                <button
                  onClick={() => {
                    showToast('جاري تحضير الإعلان لفتح الحلقة مجاناً...');
                    setShowAd(true);
                    setAdCountdown(5);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  مشاهدة إعلان لفتح الحلقة مجاناً 🎁
                </button>
              )}

              <button
                onClick={closePlayer}
                className="w-full py-2 text-xs text-gray-400 hover:text-white cursor-pointer"
              >
                العودة إلى المسلسلات
              </button>
            </div>
          </div>
        )}

        {/* Pre-roll Ad Overlay */}
        {showAd && (
          <div className="absolute inset-0 bg-black/90 z-40 flex flex-col justify-between p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-1 bg-amber-500 text-black rounded-lg">
                إعلان دعائي
              </span>
              {canSkipAd ? (
                <button
                  onClick={() => {
                    setShowAd(false);
                    if (!isUnlocked && currentEpisode) {
                      unlockEpisode(currentEpisode);
                    }
                  }}
                  className="px-4 py-1.5 rounded-lg bg-[#FF2A55] text-white text-xs font-bold hover:bg-[#e02449] transition-all cursor-pointer"
                >
                  تخطي الإعلان ✕
                </button>
              ) : (
                <span className="text-xs text-gray-300 font-mono">
                  تخطي بعد {adCountdown}ث...
                </span>
              )}
            </div>

            <div className="text-center my-auto">
              <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-3 animate-spin" />
              <h4 className="text-lg font-bold text-white mb-2">
                اشحن محفظتك بكروت فودافون كاش وإنستاباي
              </h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                احصل على باقات عملات إضافية واستمتع بمشاهدة بدون إعلانات وبجودة 4K!
              </p>
            </div>

            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-1000"
                style={{ width: `${((5 - adCountdown) / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* End of Episode Screen */}
        {showEndScreen && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <CheckCircle2 className="w-12 h-12 text-green-400 mb-2" />
            <h3 className="text-lg font-black text-white mb-1">
              انتهت الحلقة {currentEpisode.episodeNumber}
            </h3>

            {currentEpisodeIndex < seriesEpisodes.length - 1 ? (
              <>
                <p className="text-xs text-gray-300 mb-6">
                  تشغيل الحلقة {currentEpisode.episodeNumber + 1} تلقائياً بعد {countdown} ثوانٍ...
                </p>
                <div className="flex flex-col gap-2.5 w-full max-w-xs">
                  <button
                    onClick={handleNextEpisode}
                    className="w-full py-3 rounded-xl bg-[#FF2A55] text-white font-bold text-sm shadow-lg shadow-[#FF2A55]/30 hover:bg-[#e02449] cursor-pointer"
                  >
                    مشاهدة الحلقة التالية الآن
                  </button>
                  <button
                    onClick={() => {
                      setShowEndScreen(false);
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        videoRef.current.play();
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-white/10 text-white font-semibold text-xs border border-white/10 hover:bg-white/15 cursor-pointer"
                  >
                    إعادة تشغيل الحلقة
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-amber-400 font-semibold mb-6">
                  تهانينا! لقد أكملت جميع حلقات هذا المسلسل بنجاح 🎉
                </p>
                <button
                  onClick={closePlayer}
                  className="px-6 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 cursor-pointer"
                >
                  استكشاف مسلسلات أخرى
                </button>
              </>
            )}
          </div>
        )}

        {/* Top Header Overlay */}
        <div
          className={`absolute top-0 inset-x-0 z-30 flex items-center justify-between pt-[max(0.75rem,env(safe-area-inset-top))] px-4 pb-2 transition-opacity duration-300 touch-auto ${
            showControls ? 'opacity-100' : 'opacity-85'
          }`}
        >
          {/* Back / Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closePlayer();
            }}
            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/90 border border-white/15 cursor-pointer shadow-lg active:scale-90 transition-transform"
            aria-label="إغلاق المشغل"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Episode Info Pill */}
          <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-bold text-white border border-white/10 flex items-center gap-1.5 shadow-md">
            <span className="text-[#FF2A55]">{currentSeries.title}</span>
            <span className="text-gray-400">•</span>
            <span>ح {currentEpisode.episodeNumber}</span>
          </div>

          {/* Right Action Icons: Sound & Settings */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const nextMuted = !isMuted;
                if (videoRef.current) {
                  videoRef.current.muted = nextMuted;
                }
                setIsMuted(nextMuted);
              }}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/90 border border-white/15 cursor-pointer"
              aria-label={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettingsMenu(!showSettingsMenu);
              }}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/90 border border-white/15 cursor-pointer"
              aria-label="إعدادات الفيديو"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Flyout Menu */}
        {showSettingsMenu && (
          <div className="absolute top-[calc(3.75rem+env(safe-area-inset-top,0px))] left-4 z-40 w-44 rounded-2xl bg-[#141522]/95 backdrop-blur-lg border border-white/15 p-3 text-right shadow-2xl text-xs space-y-3 touch-auto">
            <div>
              <p className="text-[11px] text-gray-400 mb-1 font-bold">سرعة التشغيل:</p>
              <div className="grid grid-cols-4 gap-1">
                {[1, 1.25, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setPlaybackSpeed(s);
                      if (videoRef.current) videoRef.current.playbackRate = s;
                      setShowSettingsMenu(false);
                    }}
                    className={`py-1 rounded text-center font-mono cursor-pointer ${
                      playbackSpeed === s ? 'bg-[#FF2A55] text-white font-bold' : 'bg-white/10 text-gray-300'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] text-gray-400 mb-1 font-bold">جودة الفيديو:</p>
              <div className="grid grid-cols-3 gap-1">
                {['1080p', '720p', 'تلقائي'].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setQuality(q);
                      setShowSettingsMenu(false);
                      showToast(`تم ضبط الجودة على: ${q}`);
                    }}
                    className={`py-1 rounded text-center text-[10px] cursor-pointer ${
                      quality === q ? 'bg-[#FF2A55] text-white font-bold' : 'bg-white/10 text-gray-300'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Up/Down Quick Navigation Chevrons on Screen */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20 touch-auto">
          <button
            onClick={handlePrevEpisode}
            disabled={currentEpisodeIndex === 0}
            className={`w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center border border-white/10 transition-all ${
              currentEpisodeIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/70 cursor-pointer'
            }`}
            title="الحلقة السابقة"
            aria-label="الحلقة السابقة"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextEpisode}
            disabled={currentEpisodeIndex >= seriesEpisodes.length - 1}
            className={`w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center border border-white/10 transition-all ${
              currentEpisodeIndex >= seriesEpisodes.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/70 cursor-pointer'
            }`}
            title="الحلقة التالية"
            aria-label="الحلقة التالية"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Right Floating Sidebar (TikTok / DramaBox Style) */}
        <div className="absolute right-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] z-20 flex flex-col items-center gap-4 text-center touch-auto">
          {/* Series / Poster Avatar */}
          <div className="relative group cursor-pointer" onClick={() => setIsEpisodeSheetOpen(true)}>
            <img
              src={currentSeries.posterUrl}
              alt={currentSeries.title}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-[#FF2A55] shadow-lg"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFollow(currentSeries.id);
              }}
              className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md ${
                isFollowing ? 'bg-gray-700' : 'bg-[#FF2A55]'
              }`}
            >
              {isFollowing ? '✓' : '+'}
            </button>
          </div>

          {/* Like Button */}
          <button
            onClick={handleLike}
            className="flex flex-col items-center group focus:outline-none cursor-pointer"
            aria-label="إعجاب"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10 group-hover:scale-110 active:scale-90 transition-transform">
              <Heart className={`w-6 h-6 ${isEpisodeLiked ? 'fill-[#FF2A55] text-[#FF2A55]' : 'text-white'}`} />
            </div>
            <span className="text-[11px] font-bold text-white mt-1 drop-shadow font-mono">
              {currentEpisode.likesCount + (isEpisodeLiked ? 1 : 0)}
            </span>
          </button>

          {/* Comments Button */}
          <button
            onClick={() => setIsCommentsOpen(true)}
            className="flex flex-col items-center group focus:outline-none cursor-pointer"
            aria-label="التعليقات"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10 group-hover:scale-110 active:scale-90 transition-transform">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-[11px] font-bold text-white mt-1 drop-shadow font-mono">
              {commentsCount}
            </span>
          </button>

          {/* Favorite / Bookmark Series */}
          <button
            onClick={() => toggleFavorite(currentSeries.id)}
            className="flex flex-col items-center group focus:outline-none cursor-pointer"
            aria-label="إضافة للمفضلة"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10 group-hover:scale-110 active:scale-90 transition-transform">
              <Bookmark className={`w-6 h-6 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-white'}`} />
            </div>
            <span className="text-[10px] font-bold text-white mt-1 drop-shadow">
              {isFav ? 'محفوظ' : 'حفظ'}
            </span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center group focus:outline-none cursor-pointer"
            aria-label="مشاركة الحلقة"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10 group-hover:scale-110 active:scale-90 transition-transform">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-bold text-white mt-1 drop-shadow">
              مشاركة
            </span>
          </button>

          {/* Episodes List Drawer Button */}
          <button
            onClick={() => setIsEpisodeSheetOpen(true)}
            className="flex flex-col items-center group focus:outline-none cursor-pointer"
            aria-label="قائمة الحلقات"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
              <List className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-amber-300 mt-1 drop-shadow">
              الحلقات
            </span>
          </button>
        </div>

        {/* Bottom Details Overlay (Series Name, Episode Title, Episode list trigger) */}
        <div className="absolute bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] inset-x-0 z-20 px-4 text-right pointer-events-none">
          <div className="max-w-[75%] pointer-events-auto">
            {/* Series Title & Badges */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-sm font-black text-white hover:text-[#FF2A55] transition-colors drop-shadow-md">
                {currentSeries.title}
              </h2>
              {currentEpisode.isFree ? (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-green-500/90 text-white">
                  مجانية
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500 text-black flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> مدفوعة
                </span>
              )}
            </div>

            {/* Episode Title */}
            <p className="text-xs font-bold text-gray-200 mb-1 drop-shadow">
              {currentEpisode.title}
            </p>

            {/* Synopsis Excerpt */}
            {currentEpisode.synopsis && (
              <p className="text-[11px] text-gray-300 line-clamp-1 font-normal drop-shadow">
                {currentEpisode.synopsis}
              </p>
            )}
          </div>
        </div>

        {/* Essential Video Controls (Seek bar, Play/Pause, Volume, 10s skip) */}
        <div
          className={`absolute bottom-0 inset-x-0 z-30 px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black via-black/85 to-transparent transition-opacity duration-300 touch-auto ${
            showControls ? 'opacity-100' : 'opacity-85'
          }`}
        >
          {/* Time Display */}
          <div className="flex items-center justify-between text-[11px] text-gray-300 font-mono mb-1 px-1">
            <span id="player-current-time">{formatSeconds(currentTime)}</span>
            <span id="player-duration">{formatSeconds(duration || currentEpisode.duration)}</span>
          </div>

          {/* Interactive Seek Bar */}
          <div className="relative h-2 w-full flex items-center group cursor-pointer mb-2">
            {/* Visual Track & Progress Fill */}
            <div className="absolute inset-x-0 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF2A55] to-amber-500 rounded-full transition-all"
                style={{
                  width: `${
                    (duration || currentEpisode.duration) > 0
                      ? (currentTime / (duration || currentEpisode.duration)) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            {/* Range input slider overlaid for accessible drag-seeking & click */}
            <input
              type="range"
              min={0}
              max={duration || currentEpisode.duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeekChange}
              aria-label="شريط التقدم"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>

          {/* Essential Controls Row: Play/Pause, 10s Rewind, Volume (Button + Slider), Speed */}
          <div className="flex items-center justify-between text-white pt-0.5">
            {/* Left: Play/Pause & Quick Rewind */}
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 flex items-center justify-center text-white transition-all cursor-pointer border border-white/10"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                )}
              </button>

              <button
                onClick={(e) => handleSkip(-10, e)}
                aria-label="رجوع 10 ثوانٍ"
                title="رجوع 10 ثوانٍ"
                className="h-7 px-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center gap-1 text-[10px] text-gray-200 transition-all cursor-pointer border border-white/10"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span className="font-mono">10s-</span>
              </button>
            </div>

            {/* Right: Volume Controls (Button + Range Slider) & Speed */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full border border-white/10">
                <button
                  onClick={toggleMute}
                  aria-label={isMuted || volume === 0 ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                  className="text-white hover:text-amber-400 transition-colors cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  aria-label="مستوى الصوت"
                  className="w-14 sm:w-16 h-1 accent-[#FF2A55] bg-white/20 rounded-full cursor-pointer"
                />
              </div>

              {/* Speed indicator button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettingsMenu(!showSettingsMenu);
                }}
                className="h-7 px-2 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[10px] font-mono text-gray-200 border border-white/10 cursor-pointer"
                aria-label="سرعة التشغيل"
              >
                {playbackSpeed}x
              </button>
            </div>
          </div>
        </div>

        {/* Comments Drawer (Non-blocking) */}
        <CommentsDrawer
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          episodeId={currentEpisode.id}
          seriesId={currentSeries.id}
        />

        {/* Episode Sheet Drawer */}
        <EpisodeSheet
          isOpen={isEpisodeSheetOpen}
          onClose={() => setIsEpisodeSheetOpen(false)}
          series={currentSeries}
          episodes={seriesEpisodes}
          currentEpisodeId={currentEpisode.id}
          onSelectEpisode={(epId) => {
            setIsEpisodeSheetOpen(false);
            openPlayer(currentSeries.id, epId);
          }}
        />
      </div>
    </div>
  );
};
