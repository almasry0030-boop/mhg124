import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { LibraryPage } from './pages/LibraryPage';
import { WalletPage } from './pages/WalletPage';
import { RewardsPage } from './pages/RewardsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { VerticalPlayer } from './components/VerticalPlayer';
import { SeriesDetailsPage } from './pages/SeriesDetailsPage';
import { AuthModal } from './components/AuthModal';
import { NotificationsModal } from './components/NotificationsModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, toastMessage } = useApp();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-[#F3F4F6] flex flex-col font-sans selection:bg-[#FF2A55] selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-4 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top duration-300">
          <div className="max-w-md w-full bg-[#181928]/95 backdrop-blur-md border border-[#FF2A55]/40 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-right">
            <CheckCircle2 className="w-5 h-5 text-[#FF2A55] shrink-0" />
            <p className="text-xs font-bold leading-relaxed">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        onOpenSearch={() => setActiveTab('explore')}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 pb-20">
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'explore' && <ExplorePage />}
        {activeTab === 'library' && <LibraryPage />}
        {activeTab === 'wallet' && <WalletPage />}
        {activeTab === 'rewards' && <RewardsPage />}
        {activeTab === 'profile' && <ProfilePage />}
        {activeTab === 'admin' && <AdminPage />}
      </main>

      {/* Vertical 9:16 Full-Screen Video Player */}
      <VerticalPlayer />

      {/* Series Details Page Modal */}
      <SeriesDetailsPage />

      {/* Auth Modal */}
      <AuthModal />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      {/* In-App PWA Install Banner */}
      <PWAInstallPrompt />

      {/* Fixed Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
