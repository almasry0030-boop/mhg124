import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Mail, User as UserIcon, Phone, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, login, register, showToast } = useApp();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      if (tab === 'login') {
        const ok = await login(email, password);
        if (ok) {
          setAuthModalOpen(false);
          setEmail('');
          setPassword('');
        }
      } else {
        if (!name.trim() || !email.trim() || !password.trim()) {
          showToast('يرجى ملء الاسم والبريد الإلكتروني وكلمة المرور');
          setLoading(false);
          return;
        }
        await register(name, email, phone, password);
        setAuthModalOpen(false);
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (fillEmail: string) => {
    setEmail(fillEmail);
    setPassword(fillEmail.includes('admin') || fillEmail.includes('almasry') ? 'Admin@123456' : 'User@123456');
    setTab('login');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 text-right animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-[#141522] border border-white/15 p-6 shadow-2xl relative">
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 left-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF2A55] to-[#FF6B4A] flex items-center justify-center mx-auto mb-2 shadow-lg shadow-[#FF2A55]/30">
            <span className="text-white font-black text-2xl italic tracking-tighter">SD</span>
          </div>
          <h3 className="text-lg font-black text-white">ShortDrama</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {tab === 'login' ? 'مرحباً بك مجدداً!' : 'أنشئ حسابك واحصل على 50 عملة هدية 🎁'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#0D0E15] border border-white/5 mb-5">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'login' ? 'bg-[#FF2A55] text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'register' ? 'bg-[#FF2A55] text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            إنشاء حساب جديد
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-bold text-gray-300 mb-1">
                الاسم الكامل:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="محمد أحمد"
                  className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-9 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF2A55]"
                />
                <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-300 mb-1">
              البريد الإلكتروني:
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-9 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF2A55]"
              />
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-300 mb-1">
              كلمة المرور:
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-9 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF2A55]"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-bold text-gray-300 mb-1">
                رقم الهاتف (اختياري لكاش):
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full rounded-xl bg-[#1D1F30] border border-white/10 px-9 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF2A55]"
                />
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-[#FF2A55] text-white font-bold text-xs hover:bg-[#e02449] transition-all cursor-pointer shadow-lg shadow-[#FF2A55]/30 active:scale-95"
          >
            {tab === 'login' ? 'دخول' : 'تأكيد إنشاء الحساب (+50 عملة)'}
          </button>
        </form>

        {/* Fill credentials helper for testing authenticated server login */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-gray-400 mb-2">تعبئة بيانات الحسابات المعتمدة للتجربة:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('ali@example.com')}
              className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              مستخدم عادي
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('almasry0030@gmail.com')}
              className="py-2 px-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 text-[11px] font-bold border border-purple-500/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              حساب المالك (Admin)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
