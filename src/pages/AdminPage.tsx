import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StorageService } from '../services/storage';
import { Category, Episode, Series } from '../types';
import {
  BarChart3,
  Film,
  Layers,
  Users,
  CreditCard,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Sparkles,
  Upload,
  Coins,
  Megaphone,
  Tag,
  Settings as SettingsIcon,
  Eye,
  Check,
  AlertTriangle
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const {
    series,
    categories,
    episodes,
    user,
    settings,
    refreshData,
    showToast,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'stats' | 'series' | 'episodes' | 'categories' | 'users' | 'payments' | 'ads' | 'coupons' | 'settings'
  >('stats');

  // Series modal state
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [seriesForm, setSeriesForm] = useState({
    title: '',
    titleEn: '',
    synopsis: '',
    backdropUrl: '',
    posterUrl: '',
    trailerUrl: '',
    categoryIds: [] as string[],
    tags: '',
    status: 'ongoing' as 'ongoing' | 'completed',
    isExclusive: false,
    isFeatured: true,
    isNew: true,
  });

  // Episode modal state
  const [selectedSeriesForEpisodes, setSelectedSeriesForEpisodes] = useState<string>(
    series[0]?.id || ''
  );
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const [episodeForm, setEpisodeForm] = useState({
    title: '',
    episodeNumber: 1,
    synopsis: '',
    duration: 90,
    videoUrl: '',
    thumbnailUrl: '',
    isFree: false,
    unlockPrice: 10,
  });

  // Category modal
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');

  // Payment requests
  const payments = StorageService.getPayments();
  const allUsers = StorageService.getAllUsers();
  const ads = StorageService.getAds();
  const coupons = StorageService.getCoupons();

  // Calculated Stats
  const totalViews = useMemo(() => {
    return series.reduce((acc, s) => acc + s.totalViews, 0);
  }, [series]);

  const totalRevenueEgp = useMemo(() => {
    return payments
      .filter((p) => p.status === 'approved')
      .reduce((acc, p) => acc + p.priceEgp, 0);
  }, [payments]);

  const pendingPaymentsCount = useMemo(() => {
    return payments.filter((p) => p.status === 'pending').length;
  }, [payments]);

  // File Upload Helper (converts selected device file into Data URL for preview & storage!)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onComplete(event.target.result as string);
        showToast('تم تحميل الملف بنجاح من جهازك 📁');
      }
    };
    reader.readAsDataURL(file);
  };

  // Series Save Handler
  const handleSaveSeries = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesForm.title.trim()) {
      showToast('يرجى كتابة عنوان المسلسل');
      return;
    }

    const newSeriesObj: Series = {
      id: editingSeries ? editingSeries.id : 'series_' + Date.now(),
      title: seriesForm.title.trim(),
      titleEn: seriesForm.titleEn.trim() || seriesForm.title.trim(),
      slug: (seriesForm.titleEn || seriesForm.title).toLowerCase().replace(/\s+/g, '-'),
      synopsis: seriesForm.synopsis.trim(),
      backdropUrl:
        seriesForm.backdropUrl ||
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=80',
      posterUrl:
        seriesForm.posterUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80',
      trailerUrl: seriesForm.trailerUrl || '',
      categoryIds: seriesForm.categoryIds.length ? seriesForm.categoryIds : ['cat_trending'],
      tags: seriesForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      status: seriesForm.status,
      isExclusive: seriesForm.isExclusive,
      isFeatured: seriesForm.isFeatured,
      isNew: seriesForm.isNew,
      rating: editingSeries ? editingSeries.rating : 4.8,
      totalViews: editingSeries ? editingSeries.totalViews : 0,
      totalLikes: editingSeries ? editingSeries.totalLikes : 0,
      releaseYear: 2026,
      productionStudio: 'ShortDrama Studios',
      episodesCount: editingSeries ? editingSeries.episodesCount : 0,
      createdAt: editingSeries ? editingSeries.createdAt : new Date().toISOString(),
    };

    StorageService.saveSeries(newSeriesObj);
    refreshData();
    setIsSeriesModalOpen(false);
    setEditingSeries(null);
    showToast(editingSeries ? 'تم تعديل المسلسل بنجاح' : 'تمت إضافة المسلسل ونشره بنجاح! 🎬');
  };

  // Delete Series
  const handleDeleteSeries = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المسلسل وجميع حلقاته؟')) {
      StorageService.deleteSeries(id);
      refreshData();
      showToast('تم حذف المسلسل');
    }
  };

  // Save Episode Handler
  const handleSaveEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeriesForEpisodes) {
      showToast('يرجى اختيار المسلسل أولاً');
      return;
    }
    if (!episodeForm.title.trim()) {
      showToast('يرجى كتابة عنوان الحلقة');
      return;
    }

    const newEp: Episode = {
      id: 'ep_' + Date.now(),
      seriesId: selectedSeriesForEpisodes,
      episodeNumber: Number(episodeForm.episodeNumber),
      title: episodeForm.title.trim(),
      synopsis: episodeForm.synopsis.trim(),
      duration: Number(episodeForm.duration) || 90,
      videoUrl:
        episodeForm.videoUrl ||
        'https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-a-woman-talking-on-her-phone-in-the-city-41487-large.mp4',
      thumbnailUrl:
        episodeForm.thumbnailUrl ||
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80',
      isFree: episodeForm.isFree,
      unlockPrice: episodeForm.isFree ? 0 : Number(episodeForm.unlockPrice) || 10,
      viewsCount: 0,
      likesCount: 0,
      createdAt: new Date().toISOString(),
    };

    StorageService.saveEpisode(newEp);
    refreshData();
    setIsEpisodeModalOpen(false);
    showToast(`تمت إضافة الحلقة ${newEp.episodeNumber} بنجاح! 🎞️`);
  };

  // Delete Episode
  const handleDeleteEpisode = (id: string) => {
    StorageService.deleteEpisode(id);
    refreshData();
    showToast('تم حذف الحلقة');
  };

  // Payment approval / rejection
  const handleApprovePayment = (id: string) => {
    const success = StorageService.approvePayment(id);
    if (success) {
      refreshData();
      showToast('تم اعتماد التحويل وإضافة العملات لحساب المستخدم بنجاح! 🪙');
    }
  };

  const handleRejectPayment = (id: string) => {
    const reason = prompt('يرجى كتابة سبب الرفض لإبلاغ المستخدم:') || 'لم يتم استلام التحويل';
    StorageService.rejectPayment(id, reason);
    refreshData();
    showToast('تم رفض الطلب');
  };

  return (
    <div className="space-y-6 pb-24 text-right">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/60 to-[#141522] border border-purple-500/30 rounded-3xl p-6">
        <div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            لوحة الإدارة الشاملة
          </span>
          <h1 className="text-2xl font-black text-white mt-1">
            إدارة منصة ShortDrama 👑
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            التحكم الكامل في المحتوى، الحلقات، المدفوعات المصرية، والمستخدمين
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingPaymentsCount > 0 && (
            <button
              onClick={() => setActiveAdminTab('payments')}
              className="px-3.5 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 animate-pulse"
            >
              <CreditCard className="w-4 h-4" />
              <span>{pendingPaymentsCount} طلبات دفع معلقة</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-white/10 pb-2">
        {[
          { id: 'stats', label: '📊 الإحصائيات', icon: BarChart3 },
          { id: 'series', label: '🎬 إدارة المسلسلات', icon: Film },
          { id: 'episodes', label: '🎞️ إدارة الحلقات', icon: Layers },
          { id: 'payments', label: `💳 المدفوعات (${pendingPaymentsCount})`, icon: CreditCard },
          { id: 'categories', label: '🗂️ التصنيفات', icon: Tag },
          { id: 'users', label: '👥 المستخدمين', icon: Users },
          { id: 'ads', label: '📢 الإعلانات', icon: Megaphone },
          { id: 'coupons', label: '🎟️ الكوبونات', icon: Sparkles },
          { id: 'settings', label: '⚙️ الإعدادات', icon: SettingsIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveAdminTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeAdminTab === tab.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-[#141522] text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: STATS */}
      {activeAdminTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#141522] border border-white/5">
              <span className="text-xs text-gray-400">إجمالي المسلسلات</span>
              <p className="text-2xl font-black text-white font-mono mt-1">
                {series.length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#141522] border border-white/5">
              <span className="text-xs text-gray-400">إجمالي الحلقات</span>
              <p className="text-2xl font-black text-white font-mono mt-1">
                {episodes.length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#141522] border border-white/5">
              <span className="text-xs text-gray-400">إجمالي المشاهدات</span>
              <p className="text-2xl font-black text-amber-400 font-mono mt-1">
                {(totalViews / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#141522] border border-white/5">
              <span className="text-xs text-gray-400">الإيرادات المعتمدة</span>
              <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {totalRevenueEgp} ج.م
              </p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[#141522] border border-white/5 space-y-3">
            <h3 className="font-bold text-sm text-white">نظرة عامة على نشاط المنصة</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              تعمل المنصة حالياً بنظام المشاهدة العمودية 9:16 مع محفظة الدفع بالجنيه المصري عبر فودافون كاش وإنستاباي. جميع البيانات محفوظة محلياً ومتصلة بالواجهة في الوقت الفعلي.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: SERIES MANAGEMENT */}
      {activeAdminTab === 'series' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">قائمة المسلسلات الحالية ({series.length}):</h3>
            <button
              onClick={() => {
                setEditingSeries(null);
                setSeriesForm({
                  title: '',
                  titleEn: '',
                  synopsis: '',
                  backdropUrl: '',
                  posterUrl: '',
                  trailerUrl: '',
                  categoryIds: ['cat_trending'],
                  tags: 'دراما, تشويق',
                  status: 'ongoing',
                  isExclusive: false,
                  isFeatured: true,
                  isNew: true,
                });
                setIsSeriesModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF2A55] text-white font-bold text-xs hover:bg-[#e02449] transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              إضافة مسلسل جديد
            </button>
          </div>

          <div className="space-y-2.5">
            {series.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141522] border border-white/5 hover:border-white/15 transition-all"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={s.posterUrl}
                    alt={s.title}
                    className="w-12 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{s.title}</h4>
                      {s.isExclusive && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                          حصري
                        </span>
                      )}
                      {s.isFeatured && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                          مميز
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                      {s.synopsis}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {s.episodesCount} حلقات • {s.totalViews} مشاهدة • {s.status === 'completed' ? 'مكتمل' : 'مستمر'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingSeries(s);
                      setSeriesForm({
                        title: s.title,
                        titleEn: s.titleEn || '',
                        synopsis: s.synopsis,
                        backdropUrl: s.backdropUrl,
                        posterUrl: s.posterUrl,
                        trailerUrl: s.trailerUrl || '',
                        categoryIds: s.categoryIds,
                        tags: s.tags.join(', '),
                        status: s.status,
                        isExclusive: s.isExclusive,
                        isFeatured: s.isFeatured,
                        isNew: s.isNew,
                      });
                      setIsSeriesModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-white/5 text-gray-300 hover:text-white transition-colors"
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSeries(s.id)}
                    className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SERIES CREATE/EDIT MODAL */}
      {isSeriesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#141522] border border-white/15 p-6 shadow-2xl text-right no-scrollbar">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="text-base font-black text-white">
                {editingSeries ? 'تعديل المسلسل' : 'إضافة مسلسل جديد'}
              </h3>
              <button
                onClick={() => setIsSeriesModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSeries} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  عنوان المسلسل بالعربية: *
                </label>
                <input
                  type="text"
                  required
                  value={seriesForm.title}
                  onChange={(e) => setSeriesForm({ ...seriesForm, title: e.target.value })}
                  placeholder="مثال: انتقام الملياردير المستتر"
                  className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  قصة ووصف المسلسل:
                </label>
                <textarea
                  rows={3}
                  value={seriesForm.synopsis}
                  onChange={(e) => setSeriesForm({ ...seriesForm, synopsis: e.target.value })}
                  placeholder="اكتب نبذة مشوقة عن أحداث المسلسل..."
                  className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Poster Upload from Device */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  صورة بوستر المسلسل (رفع من جهازك مباشرة):
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-bold border border-purple-500/40 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    اختر صورة البوستر من جهازك
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(e, (url) =>
                          setSeriesForm((prev) => ({ ...prev, posterUrl: url }))
                        )
                      }
                    />
                  </label>
                  {seriesForm.posterUrl && (
                    <img
                      src={seriesForm.posterUrl}
                      alt="معاينة"
                      className="w-10 h-14 object-cover rounded-lg border border-white/20"
                    />
                  )}
                </div>
              </div>

              {/* Backdrop Upload from Device */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  صورة الغلاف العريضة Backdrop (رفع من جهازك):
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-bold border border-white/10 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    اختر صورة الغلاف العريضة
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(e, (url) =>
                          setSeriesForm((prev) => ({ ...prev, backdropUrl: url }))
                        )
                      }
                    />
                  </label>
                  {seriesForm.backdropUrl && (
                    <img
                      src={seriesForm.backdropUrl}
                      alt="معاينة"
                      className="w-20 h-12 object-cover rounded-lg border border-white/20"
                    />
                  )}
                </div>
              </div>

              {/* Categories & Tags */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    الحالة:
                  </label>
                  <select
                    value={seriesForm.status}
                    onChange={(e) =>
                      setSeriesForm({ ...seriesForm, status: e.target.value as any })
                    }
                    className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-3 py-2 text-xs text-white"
                  >
                    <option value="ongoing">مستمر</option>
                    <option value="completed">مكتمل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    الكلمات المفتاحية (مفصولة بفواصل):
                  </label>
                  <input
                    type="text"
                    value={seriesForm.tags}
                    onChange={(e) => setSeriesForm({ ...seriesForm, tags: e.target.value })}
                    placeholder="انتقام, أثرياء, رومانسي"
                    className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Badges toggles */}
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seriesForm.isExclusive}
                    onChange={(e) =>
                      setSeriesForm({ ...seriesForm, isExclusive: e.target.checked })
                    }
                    className="rounded text-[#FF2A55]"
                  />
                  <span>مسلسل حصري</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seriesForm.isFeatured}
                    onChange={(e) =>
                      setSeriesForm({ ...seriesForm, isFeatured: e.target.checked })
                    }
                    className="rounded text-[#FF2A55]"
                  />
                  <span>مميز في البانر الرئيسي</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#FF2A55] text-white font-bold text-xs hover:bg-[#e02449] transition-all cursor-pointer shadow-lg shadow-[#FF2A55]/25"
              >
                {editingSeries ? 'حفظ التعديلات' : 'نشر المسلسل الآن'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: EPISODES MANAGEMENT */}
      {activeAdminTab === 'episodes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300 font-bold">اختر المسلسل:</span>
              <select
                value={selectedSeriesForEpisodes}
                onChange={(e) => setSelectedSeriesForEpisodes(e.target.value)}
                className="rounded-xl bg-[#141522] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF2A55]"
              >
                {series.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.episodesCount} حلقة)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                const currentEps = StorageService.getEpisodes(selectedSeriesForEpisodes);
                setEpisodeForm({
                  title: `الحلقة ${currentEps.length + 1}`,
                  episodeNumber: currentEps.length + 1,
                  synopsis: '',
                  duration: 90,
                  videoUrl: '',
                  thumbnailUrl: '',
                  isFree: currentEps.length < 2, // first 2 free by default
                  unlockPrice: 10,
                });
                setIsEpisodeModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF2A55] text-white font-bold text-xs hover:bg-[#e02449] transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              إضافة حلقة فيديو جديدة
            </button>
          </div>

          {/* Episodes list */}
          <div className="space-y-2">
            {StorageService.getEpisodes(selectedSeriesForEpisodes).map((ep) => (
              <div
                key={ep.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#141522] border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                    <img
                      src={ep.thumbnailUrl}
                      alt={ep.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      الحلقة {ep.episodeNumber}: {ep.title}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {ep.isFree ? (
                        <span className="text-green-400">مجانية</span>
                      ) : (
                        <span className="text-amber-400">
                          مدفوعة ({ep.unlockPrice} عملة)
                        </span>
                      )}{' '}
                      • {ep.duration} ثانية • {ep.viewsCount} مشاهدة
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteEpisode(ep.id)}
                  className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  title="حذف الحلقة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EPISODE CREATE MODAL WITH VIDEO UPLOAD */}
      {isEpisodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#141522] border border-white/15 p-6 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="text-base font-black text-white">إضافة حلقة جديدة</h3>
              <button
                onClick={() => setIsEpisodeModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEpisode} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    رقم الحلقة:
                  </label>
                  <input
                    type="number"
                    required
                    value={episodeForm.episodeNumber}
                    onChange={(e) =>
                      setEpisodeForm({ ...episodeForm, episodeNumber: Number(e.target.value) })
                    }
                    className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    مدة الحلقة (بالثواني):
                  </label>
                  <input
                    type="number"
                    value={episodeForm.duration}
                    onChange={(e) =>
                      setEpisodeForm({ ...episodeForm, duration: Number(e.target.value) })
                    }
                    className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  عنوان الحلقة: *
                </label>
                <input
                  type="text"
                  required
                  value={episodeForm.title}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, title: e.target.value })}
                  placeholder="مثال: الحلقة 3: كشف الحقيقة الصادمة"
                  className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Upload Video From Device */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  رفع ملف الفيديو العمودي من جهازك:
                </label>
                <label className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 text-xs font-bold border border-purple-500/40 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  اختر فيديو من جهازك (MP4 / WebM)
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e, (url) =>
                        setEpisodeForm((prev) => ({ ...prev, videoUrl: url }))
                      )
                    }
                  />
                </label>
                {episodeForm.videoUrl && (
                  <p className="text-[10px] text-emerald-400 mt-1 font-mono truncate">
                    ✓ تم تجهيز الفيديو بنجاح
                  </p>
                )}
              </div>

              {/* Free vs Paid & Price */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={episodeForm.isFree}
                    onChange={(e) =>
                      setEpisodeForm({ ...episodeForm, isFree: e.target.checked })
                    }
                    className="rounded text-[#FF2A55]"
                  />
                  <span>حلقة مجانية</span>
                </label>

                {!episodeForm.isFree && (
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">
                      سعر الفتح (عملة):
                    </label>
                    <input
                      type="number"
                      value={episodeForm.unlockPrice}
                      onChange={(e) =>
                        setEpisodeForm({ ...episodeForm, unlockPrice: Number(e.target.value) })
                      }
                      className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#FF2A55] text-white font-bold text-xs hover:bg-[#e02449] transition-all cursor-pointer shadow-lg shadow-[#FF2A55]/25"
              >
                حفظ وإضافة الحلقة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENTS APPROVAL (CRITICAL FOR EGYPTIAN FLOW) */}
      {activeAdminTab === 'payments' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white">
            طلبات الشحن والتحويلات المالية ({payments.length}):
          </h3>

          {payments.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">لا توجد طلبات شحن حالياً</p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => {
                const isPending = p.status === 'pending';
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isPending
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-[#141522] border-white/5'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">{p.userName}</span>
                          <span className="text-xs text-gray-400">({p.userEmail})</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : p.status === 'rejected'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {p.status === 'approved'
                              ? 'معتمد ✓'
                              : p.status === 'rejected'
                              ? 'مرفوض ✕'
                              : 'معلق ⏳'}
                          </span>
                        </div>
                        <p className="text-xs text-amber-400 font-bold mt-1">
                          الباقة: {p.packageName} • المبلغ: {p.priceEgp} ج.م • العملات:{' '}
                          {p.coinsAmount} عملة
                        </p>
                      </div>

                      <span className="text-[10px] text-gray-500">
                        {new Date(p.createdAt).toLocaleString('ar-EG')}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-gray-300 space-y-1 mb-3">
                      <p>
                        <strong className="text-white">طريقة الدفع:</strong> {p.method}
                      </p>
                      <p>
                        <strong className="text-white">الرقم/الحساب المحوِّل:</strong>{' '}
                        <span className="font-mono text-amber-300">{p.senderNumber}</span>
                      </p>
                      {p.referenceCode && (
                        <p>
                          <strong className="text-white">الرقم المرجعي:</strong>{' '}
                          <span className="font-mono">{p.referenceCode}</span>
                        </p>
                      )}
                      {p.receiptNote && (
                        <p>
                          <strong className="text-white">ملاحظات العميل:</strong> {p.receiptNote}
                        </p>
                      )}
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprovePayment(p.id)}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          اعتماد وقبول التحويل (+{p.coinsAmount} عملة)
                        </button>
                        <button
                          onClick={() => handleRejectPayment(p.id)}
                          className="px-4 py-2 rounded-xl bg-red-600/30 hover:bg-red-600/50 text-red-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          رفض
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CATEGORIES */}
      {activeAdminTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="اسم التصنيف الجديد (مثال: رعب وتشويق)..."
              className="flex-1 rounded-xl bg-[#141522] border border-white/10 px-3 py-2 text-xs text-white"
            />
            <button
              onClick={() => {
                if (!newCatName.trim()) return;
                StorageService.saveCategory({
                  id: 'cat_' + Date.now(),
                  name: newCatName.trim(),
                  nameEn: newCatName.trim(),
                  slug: newCatName.toLowerCase().replace(/\s+/g, '-'),
                  order: categories.length + 1,
                  active: true,
                });
                setNewCatName('');
                refreshData();
                showToast('تمت إضافة التصنيف');
              }}
              className="px-4 py-2 rounded-xl bg-[#FF2A55] text-white font-bold text-xs"
            >
              إضافة
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#141522] border border-white/5 text-xs text-white"
              >
                <span>{c.name}</span>
                {c.id !== 'cat_all' && (
                  <button
                    onClick={() => {
                      StorageService.deleteCategory(c.id);
                      refreshData();
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: USERS */}
      {activeAdminTab === 'users' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white">المستخدمون المسجلون ({allUsers.length}):</h3>
          {allUsers.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#141522] border border-white/5 text-xs"
            >
              <div className="flex items-center gap-3">
                <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{u.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                      {u.role}
                    </span>
                  </div>
                  <span className="text-gray-400 font-mono text-[11px]">{u.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-bold text-amber-400 font-mono">
                  {u.coins} عملة
                </span>
                <button
                  onClick={() => {
                    const delta = Number(prompt('أدخل عدد العملات المراد إضافتها (أو خصمها بعلامة سالب):', '50'));
                    if (!isNaN(delta) && delta !== 0) {
                      StorageService.updateUserCoins(u.id, delta, 'تعديل رصيد بواسطة إدارة المنصة ⚡');
                      refreshData();
                      showToast(`تم تعديل رصيد ${u.name}`);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-bold"
                >
                  تعديل الرصيد
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 7: ADS */}
      {activeAdminTab === 'ads' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white">الإعلانات الدعائية المدارة ({ads.length}):</h3>
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#141522] border border-white/5 text-xs"
            >
              <div>
                <p className="font-bold text-white">{ad.title}</p>
                <p className="text-[11px] text-gray-400">
                  النوع: {ad.type} • المشاهدات: {ad.impressions} • النقرات: {ad.clicks}
                </p>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  ad.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                }`}
              >
                {ad.active ? 'نشط' : 'معطل'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* TAB 8: COUPONS */}
      {activeAdminTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">الكوبونات وأكواد الهدايا:</h3>
            <button
              onClick={() => {
                const code = prompt('أدخل كود الكوبون الجديد: (مثال: EGYPT100)');
                if (code) {
                  StorageService.saveCoupon({
                    code: code.trim().toUpperCase(),
                    bonusCoins: 50,
                    maxUses: 500,
                    usedCount: 0,
                    active: true,
                    expiresAt: '2028-12-31T23:59:59Z',
                  });
                  refreshData();
                  showToast('تمت إضافة الكوبون');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
            >
              + إنشاء كوبون
            </button>
          </div>

          <div className="space-y-2">
            {coupons.map((c) => (
              <div
                key={c.code}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#141522] border border-white/5 text-xs"
              >
                <div>
                  <span className="font-black text-amber-400 font-mono text-sm tracking-wider">
                    {c.code}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    +{c.bonusCoins} عملة • استخدمه {c.usedCount} من أصل {c.maxUses}
                  </p>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">مفعّل ✓</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: SETTINGS */}
      {activeAdminTab === 'settings' && (
        <div className="rounded-3xl bg-[#141522] border border-white/10 p-6 space-y-4">
          <h3 className="font-black text-sm text-white mb-2">إعدادات بوابات الدفع المصرية:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                رقم فودافون كاش:
              </label>
              <input
                type="text"
                defaultValue={settings.vodafoneCashNumber}
                onChange={(e) => {
                  settings.vodafoneCashNumber = e.target.value;
                  StorageService.saveSettings(settings);
                }}
                className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                معرف إنستاباي (InstaPay Handle):
              </label>
              <input
                type="text"
                defaultValue={settings.instapayHandle}
                onChange={(e) => {
                  settings.instapayHandle = e.target.value;
                  StorageService.saveSettings(settings);
                }}
                className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            يتم تحديث الأرقام وحفظها فوراً لتظهر في صفحة الشحن للمستخدمين.
          </p>
        </div>
      )}
    </div>
  );
};
