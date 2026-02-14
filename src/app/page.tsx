'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function Home() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'login' | 'register' | 'forgot-password'>('login');
  const router = useRouter();

  useEffect(() => {
    // Check if we are in a password recovery flow to prevent premature dashboard redirect
    const isRecovery = window.location.hash.includes('type=recovery') ||
      window.location.search.includes('type=recovery');

    if (!loading && user && !isRecovery) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>{user ? 'Redirecting to Dashboard...' : 'Loading Haulage Tracker...'}</p>
        <style jsx>{`
          .loading-screen {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #0f172a;
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

  if (view === 'login') {
    return (
      <LoginForm
        onShowRegister={() => setView('register')}
        onShowForgotPassword={() => setView('forgot-password')}
      />
    );
  }

  if (view === 'register') {
    return <RegisterForm onBackToLogin={() => setView('login')} />;
  }

  return <ForgotPasswordForm onBackToLogin={() => setView('login')} />;
}
