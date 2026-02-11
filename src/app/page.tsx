'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

export default function Home() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'login' | 'register'>('login');
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
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

  return view === 'login'
    ? <LoginForm onShowRegister={() => setView('register')} />
    : <RegisterForm onBackToLogin={() => setView('login')} />;
}
