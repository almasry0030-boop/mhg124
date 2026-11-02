import { User, Series, Episode, SystemSettings, Coupon, Advertisement } from '../types';

export const ApiService = {
  // Auth
  async getMe(): Promise<User | null> {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch (e) {
      console.warn('API getMe failed:', e);
      return null;
    }
  },

  async login(email: string, password?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password: password || 'Admin@123456' }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'فشل تسجيل الدخول' };
      }
      return { success: true, user: data.user };
    } catch (e) {
      return { success: false, error: 'تعذر الاتصال بالخادم' };
    }
  },

  async register(name: string, email: string, phone?: string, password?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, phone, password: password || 'User@123456' }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'فشل إنشاء الحساب' };
      }
      return { success: true, user: data.user };
    } catch (e) {
      return { success: false, error: 'تعذر الاتصال بالخادم' };
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.warn('Logout error:', e);
    }
  },

  // Protected Admin APIs (Server-enforced role === 'admin' && isAdmin === true)
  async adminGetStats(): Promise<any> {
    const res = await fetch('/api/admin/stats', { credentials: 'include' });
    if (!res.ok) throw new Error((await res.json()).error || 'غير مصرح');
    return res.json();
  },

  async adminGetUsers(): Promise<User[]> {
    const res = await fetch('/api/admin/users', { credentials: 'include' });
    if (!res.ok) throw new Error((await res.json()).error || 'غير مصرح');
    const data = await res.json();
    return data.users;
  },

  async adminUpdateUser(id: string, updates: Partial<User>): Promise<User> {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'غير مصرح');
    const data = await res.json();
    return data.user;
  },

  async adminAddSeries(series: Partial<Series>): Promise<Series> {
    const res = await fetch('/api/admin/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(series),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'غير مصرح');
    const data = await res.json();
    return data.series;
  },

  async adminUpdateSeries(id: string, updates: Partial<Series>): Promise<Series> {
    const res = await fetch(`/api/admin/series/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'غير مصرح');
    const data = await res.json();
    return data.series;
  },

  async adminDeleteSeries(id: string): Promise<boolean> {
    const res = await fetch(`/api/admin/series/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error((await res.json()).error || 'غير مصرح');
    const data = await res.json();
    return data.success;
  },

  async adminAddEpisode(episode: Partial<Episode>): Promise<Episode> {
    const res = await fetch('/api/admin/episodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(episode),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'غير مصرح');
    const data = await res.json();
    return data.episode;
  },

  async adminUpdateEpisode(id: string, updates: Partial<Episode>): Promise<Episode> {
    const res = await fetch(`/api/admin/episodes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'غير مصرح');
    const data = await res.json();
    return data.episode;
  },

  async adminDeleteEpisode(id: string): Promise<boolean> {
    const res = await fetch(`/api/admin/episodes/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error((await res.json()).error || 'غير مصرح');
    const data = await res.json();
    return data.success;
  },

  async adminUpdateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'غير مصرح');
    const data = await res.json();
    return data.settings;
  },

  async adminAddCoupon(coupon: Partial<Coupon>): Promise<Coupon> {
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(coupon),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'غير مصرح');
    const data = await res.json();
    return data.coupon;
  },

  async adminDeleteCoupon(code: string): Promise<boolean> {
    const res = await fetch(`/api/admin/coupons/${code}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error((await res.json()).error || 'غير مصرح');
    const data = await res.json();
    return data.success;
  },

  async adminAddAd(ad: Partial<Advertisement>): Promise<Advertisement> {
    const res = await fetch('/api/admin/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(ad),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'غير مصرح');
    const data = await res.json();
    return data.ad;
  },

  async adminDeleteAd(id: string): Promise<boolean> {
    const res = await fetch(`/api/admin/ads/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error((await res.json()).error || 'غير مصرح');
    const data = await res.json();
    return data.success;
  },
};
