import { Toaster } from "@/components/ui/sonner";
import Footer from "./components/Footer";
import Header from "./components/Header";
import LoginPrompt from "./components/LoginPrompt";
import ProfileSetupModal from "./components/ProfileSetupModal";
import RejectedScreen from "./components/RejectedScreen";
import WaitingForApprovalScreen from "./components/WaitingForApprovalScreen";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useBootstrapAuthRegistration,
  useGetCallerUserProfile,
  useIsCallerAdmin,
  useIsCallerApproved,
} from "./hooks/useQueries";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const { identity } = useInternetIdentity();
  const { isBootstrapping, bootstrapComplete } = useBootstrapAuthRegistration();

  // Only fetch profile after bootstrap completes
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile(!!identity && bootstrapComplete);

  // Check if caller is an auto-registered admin
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();

  // Check approval status only after bootstrap and profile are loaded
  const approvalEnabled =
    !!identity && bootstrapComplete && profileFetched && userProfile !== null;
  const {
    data: isApproved,
    isLoading: approvalLoading,
    isFetched: approvalFetched,
  } = useIsCallerApproved(approvalEnabled);

  const isAuthenticated = !!identity;

  // Show profile setup if authenticated, bootstrap done, profile loaded, and no profile exists
  const showProfileSetup =
    isAuthenticated &&
    bootstrapComplete &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  // Show login prompt if not authenticated
  const showLoginPrompt = !isAuthenticated;

  // Loading state: authenticated but still initializing
  const isInitializing =
    isAuthenticated &&
    (isBootstrapping || (bootstrapComplete && profileLoading));

  // After profile exists, determine approval state
  const hasProfile =
    isAuthenticated &&
    bootstrapComplete &&
    profileFetched &&
    userProfile !== null;
  const approvalCheckDone =
    hasProfile && (approvalFetched || adminLoading === false);

  // Admins bypass approval check
  const isAdminUser = isAdmin === true;

  // Show waiting screen: has profile, approval check done, not approved, not admin
  const showWaiting =
    hasProfile &&
    approvalCheckDone &&
    !approvalLoading &&
    isApproved === false &&
    !isAdminUser;

  // Show dashboard: has profile, approved (or admin)
  const showApp =
    hasProfile && !approvalLoading && (isApproved === true || isAdminUser);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {showLoginPrompt && <LoginPrompt />}
        {isAuthenticated && isInitializing && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Initializing...</p>
            </div>
          </div>
        )}
        {showWaiting && <WaitingForApprovalScreen />}
        {showApp && <Dashboard />}
      </main>
      <Footer />
      {showProfileSetup && <ProfileSetupModal />}
      <Toaster />
    </div>
  );
}
