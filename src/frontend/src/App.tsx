import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import ProfileSetupModal from './components/ProfileSetupModal';
import LoginPrompt from './components/LoginPrompt';

export default function App() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;
  const showLoginPrompt = !isAuthenticated;
  const showApp = isAuthenticated && !showProfileSetup;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {showLoginPrompt && <LoginPrompt />}
        {showApp && <Dashboard />}
      </main>
      <Footer />
      {showProfileSetup && <ProfileSetupModal />}
      <Toaster />
    </div>
  );
}
