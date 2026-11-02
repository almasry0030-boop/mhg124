import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CoinPackage, PaymentMethod } from '../types';
import { StorageService } from '../services/storage';
import { validateCoupon } from '../utils/rules';
import {
  Coins,
  CreditCard,
  History,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Tag,
  PhoneCall,
  Smartphone,
  Copy,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const WalletPage: React.FC = () => {
  const { user, setAuthModalOpen, submitPayment, showToast, settings, refreshData } = useApp();

  const [activeTab, setActiveTab] = useState<'packages' | 'history'>('packages');
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vodafone_cash');
  const [senderNumber, setSenderNumber] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [receiptNote, setReceiptNote] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const packages = StorageService.getCoinPackages();
  const transactions = useMemo(() => {
    if (!user) return [];
    return StorageService.getTransactions(user.id);
  }, [user]);

  const userPayments = useMemo(() => {
    if (!user) return [];
    return StorageService.getPayments().filter((p) => p.userId === user.id);
  }, [user]);

  // Payment method accounts
  const PAYMENT_DETAILS: Record<
    PaymentMethod,
    { name: string; icon: string; account: string; instructions: string }
  > = {
    vodafone_cash: {
      name: 'فودافون كاش (Vodafone Cash)',
      icon: '🔴',
      account: settings.vodafoneCashNumber || '01023456789',
      instructions: `حوّل المبلغ المطلوب عبر تطبيق أنا فودافون أو كود *9*7*الرقم*المبلغ# إلى رقم المحفظة.`,
    },
    instapay: {
      name: 'إنستاباي (InstaPay)',
      icon: '⚡',
      account: settings.instapayHandle || 'shortdrama@instapay',
      instructions: `افتح تطبيق إنستاباي، اختر إرسال نقود، وأدخل معرف الحساب (IPA). التحويل فوري ومجاني.`,
    },
    etisalat_cash: {
      name: 'اتصالات كاش (Etisalat Cash)',
      icon: '🟢',
      account: settings.etisalatCashNumber || '01198765432',
      instructions: `حوّل إلى محفظة اتصالات كاش عبر الكود *777# أو تطبيق My Etisalat.`,
    },
    orange_cash: {
      name: 'أورنج كاش (Orange Cash)',
      icon: '🟠',
      account: settings.orangeCashNumber || '01234567890',
      instructions: `حوّل عبر كود #115# أو تطبيق Orange Cash إلى الرقم المحدد.`,
    },
    we_pay: {
      name: 'WE Pay',
      icon: '🟣',
      account: settings.wePayNumber || '01555555555',
      instructions: `حوّل عبر تطبيق WE Pay إلى رقم المحفظة الموضح أدناه.`,
    },
    fawry: {
      name: 'فوري (Fawry)',
      icon: '🟡',
      account: settings.fawryMerchantCode || '94821',
      instructions: `ادفع عبر أقرب ماكينة فوري بكود الخدمة ورقم التاجر الموضح.`,
    },
    card: {
      name: 'بطاقة بنكية (فيزا / ماستركارد)',
      icon: '💳',
      account: 'بوابة الدفع الإلكتروني الآمنة',
      instructions: `ادفع مباشرة عبر البطاقة الائتمانية مع تشفير آمن 3D Secure.`,
    },
  };

  const handleCopyAccount = (text: string) => {
    navigator.clipboard?.writeText(text);
    showToast(`تم نسخ: ${text} 📋`);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!selectedPackage) {
      showToast('يرجى اختيار باقة العملات أولاً');
      return;
    }
    if (!senderNumber.trim() && paymentMethod !== 'card') {
      showToast('يرجى إدخال رقم المحفظة أو الحساب الذي قمت بالتحويل منه');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      submitPayment({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        coinsAmount: selectedPackage.coins + (selectedPackage.bonusCoins || 0),
        priceEgp: selectedPackage.priceEgp,
        method: paymentMethod,
        senderNumber: senderNumber.trim() || 'Credit Card',
        referenceCode: referenceCode.trim() || 'REF-' + Date.now().toString().slice(-6),
        receiptNote: receiptNote.trim(),
      });

      setIsSubmitting(false);
      setSelectedPackage(null);
      setSenderNumber('');
      setReferenceCode('');
      setReceiptNote('');
      setActiveTab('history');
    }, 600);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    const coupons = StorageService.getCoupons();
    const foundCoupon = coupons.find(
      (c) => c.code.toUpperCase() === couponCode.trim().toUpperCase()
    );
    const result = validateCoupon(couponCode, foundCoupon);

    if (result.valid) {
      StorageService.updateUserCoins(
        user.id,
        result.bonusCoins,
        `تفعيل كود الخصم: ${couponCode.toUpperCase()}`
      );
      if (foundCoupon) {
        foundCoupon.usedCount += 1;
        StorageService.saveCoupon(foundCoupon);
      }
      refreshData();
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}
      showToast(result.message);
      setCouponCode('');
    } else {
      showToast(result.message);
    }
  };

  return (
    <div className="space-y-6 pb-24 text-right">
      {/* Wallet Balance Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C1D2C] via-[#151624] to-[#0D0E15] border border-amber-500/25 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-300">محفظة العملات</h2>
              <p className="text-[11px] text-gray-400">
                {user ? user.name : 'سجل الدخول للمتابعة'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> محفظة آمنة ومحمية
          </span>
        </div>

        <div className="my-2">
          <span className="text-xs text-gray-400">الرصيد المتاح حالياً</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl sm:text-5xl font-black text-amber-400 font-mono tracking-tight">
              {user ? user.coins : 0}
            </span>
            <span className="text-sm font-bold text-amber-300/90">عملة رقمية</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed mt-3">
          تُستخدم العملات لفتح الحلقات المدفوعة والاستمتاع بمشاهدة الدراما دون أي انقطاع.
        </p>

        {/* Coupon Code Inline Input */}
        <form onSubmit={handleApplyCoupon} className="mt-4 pt-4 border-t border-white/10 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="هل لديك كود خصم أو هدية؟ (مثال: DRAMABOX)"
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs transition-colors cursor-pointer"
          >
            تطبيق
          </button>
        </form>
      </div>

      {/* Navigation Tabs (Packages vs Transactions History) */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('packages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'packages'
              ? 'bg-[#FF2A55] text-white shadow-md'
              : 'text-gray-400 hover:text-white bg-[#141522]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          باقات شحن العملات
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-[#FF2A55] text-white shadow-md'
              : 'text-gray-400 hover:text-white bg-[#141522]'
          }`}
        >
          <History className="w-4 h-4" />
          سجل المعاملات والطلبات
          {userPayments.some((p) => p.status === 'pending') && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>
      </div>

      {/* Tab 1: Packages & Egyptian Cash Flow */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white">اختر الباقة المناسبة لك:</h3>
            <span className="text-xs text-amber-400 font-bold">الأسعار بالجنيه المصري (EGP)</span>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {packages.map((pkg) => {
              const isSelected = selectedPackage?.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-400 shadow-xl shadow-amber-500/15 scale-[1.02]'
                      : 'bg-[#141522] border-white/10 hover:border-white/20'
                  }`}
                >
                  {pkg.badge && (
                    <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FF2A55] text-white shadow-md">
                      {pkg.badge}
                    </span>
                  )}

                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{pkg.name}</h4>
                    <div className="flex items-baseline gap-1 my-2">
                      <span className="text-3xl font-black text-amber-400 font-mono">
                        {pkg.coins}
                      </span>
                      <span className="text-xs text-gray-400 font-bold">عملة</span>
                      {pkg.bonusCoins > 0 && (
                        <span className="text-xs font-bold text-emerald-400 mr-2">
                          +{pkg.bonusCoins} هدية مجانية
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between mt-3">
                    <span className="text-lg font-black text-white font-mono">
                      {pkg.priceEgp} ج.م
                    </span>
                    <button
                      type="button"
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-amber-400 text-black'
                          : 'bg-white/10 text-gray-200 group-hover:bg-white/20'
                      }`}
                    >
                      {isSelected ? 'محددة ✓' : 'اختيار'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Form (Shown once a package is selected) */}
          {selectedPackage && (
            <div className="rounded-3xl bg-[#141522] border border-amber-500/30 p-6 space-y-5 animate-in fade-in duration-200 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                    إتمام الشحن: {selectedPackage.name}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    المبلغ المطلوب: <strong className="text-white font-mono">{selectedPackage.priceEgp} ج.م</strong> للحصول على <strong className="text-amber-400 font-mono">{selectedPackage.coins + selectedPackage.bonusCoins} عملة</strong>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  إلغاء ✕
                </button>
              </div>

              {/* Payment Methods Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-200 mb-2">
                  اختر وسيلة الدفع المصرية:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(PAYMENT_DETAILS) as PaymentMethod[]).map((m) => {
                    const info = PAYMENT_DETAILS[m];
                    const isM = paymentMethod === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2 ${
                          isM
                            ? 'bg-amber-500/15 border-amber-400 text-white font-bold'
                            : 'bg-[#1D1F30] border-white/5 text-gray-300 hover:border-white/20'
                        }`}
                      >
                        <span className="text-xl">{info.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs truncate">{info.name.split('(')[0]}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Instructions Box */}
              <div className="rounded-2xl bg-[#0D0E15] border border-white/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">
                    رقم أو حساب التحويل المعتمد:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyAccount(PAYMENT_DETAILS[paymentMethod].account)}
                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white px-2 py-0.5 rounded bg-white/10"
                  >
                    <Copy className="w-3 h-3" /> نسخ
                  </button>
                </div>
                <p className="text-lg font-black font-mono text-white tracking-wider">
                  {PAYMENT_DETAILS[paymentMethod].account}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {PAYMENT_DETAILS[paymentMethod].instructions}
                </p>
              </div>

              {/* Submission Form */}
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      رقم الهاتف / الحساب الذي قمت بالتحويل منه: *
                    </label>
                    <input
                      type="text"
                      required
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      placeholder="مثال: 01012345678"
                      className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      كود العملية أو الرقم المرجعي (اختياري):
                    </label>
                    <input
                      type="text"
                      value={referenceCode}
                      onChange={(e) => setReferenceCode(e.target.value)}
                      placeholder="رقم مرجع الرسالة أو المعاملة"
                      className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    ملاحظات إضافية أو تأكيد:
                  </label>
                  <textarea
                    rows={2}
                    value={receiptNote}
                    onChange={(e) => setReceiptNote(e.target.value)}
                    placeholder="أي ملاحظات حول التحويل أو وقت الإرسال..."
                    className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    يتم مراجعة التحويل واعتماد الرصيد فوراً من قبل فريق الدعم والإدارة.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {isSubmitting ? 'جاري إرسال الطلب...' : `تأكيد التحويل وإرسال الطلب (${selectedPackage.priceEgp} ج.م)`}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Transactions & Payments History */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* User Pending / Processed Payment Requests */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3">طلبات الشحن الأخيرة:</h3>
            {userPayments.length === 0 ? (
              <p className="text-xs text-gray-500 py-3">لا توجد طلبات شحن سابقة</p>
            ) : (
              <div className="space-y-2">
                {userPayments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141522] border border-white/5"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">
                        {p.packageName} ({p.priceEgp} ج.م)
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {p.method} • المحول منه: {p.senderNumber}
                      </p>
                      {p.adminNote && (
                        <p className="text-[10px] text-amber-300/80 mt-1">
                          ملاحظة الإدارة: {p.adminNote}
                        </p>
                      )}
                    </div>
                    <div className="text-left">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          p.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : p.status === 'rejected'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {p.status === 'approved'
                          ? 'تم الاعتماد ✓'
                          : p.status === 'rejected'
                          ? 'مرفوض ✕'
                          : 'قيد المراجعة ⏳'}
                      </span>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {new Date(p.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ledger Transactions */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3">حركة العملات في المحفظة:</h3>
            {transactions.length === 0 ? (
              <p className="text-xs text-gray-500 py-3">لا توجد حركات مالية مسجلة بعد</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#141522] border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isPositive
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-200">
                            {tx.description}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {new Date(tx.createdAt).toLocaleString('ar-EG')}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-black font-mono ${
                          isPositive ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isPositive ? `+${tx.amount}` : tx.amount} عملة
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
