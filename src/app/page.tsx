'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import LandingPage from "@/components/landing/LandingPage";
import AuthNavbar from "@/components/auth/AuthNavbar";
import RoleSelector from "@/components/auth/RoleSelector";
import LoadingScreen from "@/components/common/LoadingScreen";

export default function Home() {
  const { user, profile, availableProfiles, loading } = useAuth();
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'forgot-password' | 'role-selection'>('landing');
  const router = useRouter();

  useEffect(() => {
    // Check if we are in a password recovery flow
    const isRecovery = typeof window !== 'undefined' && (
      window.location.hash.includes('type=recovery') ||
      window.location.search.includes('type=recovery')
    );

    if (isRecovery) {
      setView('forgot-password');
      return;
    }

    // ONLY redirect if we are on login/register/role-selection views
    if (!loading && user) {
      const isEntryView = view === 'login' || view === 'register' || view === 'landing';

      if (isEntryView) {
        if (availableProfiles.length > 1 && !profile) {
          setView('role-selection');
        } else if (availableProfiles.length > 1 && view === 'landing') {
          // If they came back to landing but have multiple options, show selector
          setView('role-selection');
        } else if (profile) {
          const isPlatform = profile.type === 'platform';
          router.push(isPlatform ? '/nexhaul' : '/dashboard');
        }
      }
    }
  }, [user, loading, router, view, profile, availableProfiles]);

  if (loading) {
    return (
      <LoadingScreen message={user ? 'Redirecting to Dashboard...' : 'Loading NexHaul...'} />
    );
  }

  const renderAuthView = () => {
    switch (view) {
      case 'login':
        return (
          <LoginForm
            onShowRegister={() => setView('register')}
            onShowForgotPassword={() => setView('forgot-password')}
          />
        );
      case 'register':
        return <RegisterForm onBackToLogin={() => setView('login')} />;
      case 'forgot-password':
        return <ForgotPasswordForm onBackToLogin={() => setView('login')} />;
      case 'role-selection':
        return <RoleSelector />;
      default:
        return null;
    }
  };

  if (view === 'landing') {
    return (
      <LandingPage
        onLogin={() => setView('login')}
        onRegister={() => setView('register')}
      />
    );
  }

  return (
    <div className="auth-layout">
      <AuthNavbar onBackToHome={() => setView('landing')} />
      <div className="auth-content">
        {renderAuthView()}
      </div>
      <style jsx>{`
        .auth-layout {
          min-height: 100vh;
          background: #0f172a;
        }
        .auth-content {
          padding-top: 64px;
        }
      `}</style>
    </div>
  );
}
