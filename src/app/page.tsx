'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import LandingPage from "@/components/landing/LandingPage";
import AuthNavbar from "@/components/auth/AuthNavbar";

export default function Home() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'forgot-password'>('landing');
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

    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || (user && view === 'landing')) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>{user ? 'Redirecting to Dashboard...' : 'Loading NexHaul...'}</p>
        <style jsx>{`
          .loading-screen {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #020617;
            color: white;
            gap: 1.5rem;
          }
          .loader {
            width: 40px;
            height: 40px;
            border: 3px solid #1e293b;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          p {
            color: #94a3b8;
            font-size: 0.9rem;
            letter-spacing: 0.05em;
          }
        `}</style>
      </div>
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
