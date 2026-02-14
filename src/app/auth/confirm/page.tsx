'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function ConfirmEmailPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'recovery'>('verifying');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Detect recovery mode from URL hash or search
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlParams = new URLSearchParams(window.location.search);

        const type = hashParams.get('type') || urlParams.get('type');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const code = urlParams.get('code');

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }

        if (type === 'recovery' || hashParams.get('type') === 'recovery') {
          setStatus('recovery');
          return;
        }

        setStatus('success');
      } catch (err) {
        console.error('Confirmation error:', err);
        setStatus('error');
      }
    };

    handleEmailConfirmation();
  }, []);

  // Countdown and redirect after success (only for regular email verification)
  useEffect(() => {
    if (status !== 'success') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          supabase.auth.signOut().then(() => {
            window.location.href = '/';
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  return (
    <div className="confirm-container">
      <div className={status === 'recovery' ? 'recovery-mode' : 'confirm-card'}>
        {status === 'verifying' && (
          <>
            <div className="icon-wrap">⏳</div>
            <h1>Verifying...</h1>
            <p>Please wait while we confirm your request.</p>
          </>
        )}

        {status === 'recovery' && (
          <ResetPasswordForm />
        )}

        {status === 'success' && (
          <>
            <div className="icon-wrap success">✅</div>
            <h1>Email Verified!</h1>
            <p>Your account has been confirmed successfully.</p>
            <p className="redirect-text">
              Redirecting to login in <strong>{countdown}</strong>s...
            </p>
            <button onClick={() => { supabase.auth.signOut(); window.location.href = '/'; }} className="action-btn">
              Go to Login Now
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="icon-wrap error">❌</div>
            <h1>Verification Failed</h1>
            <p>The link may have expired or is invalid. Please try again.</p>
            <button onClick={() => window.location.href = '/'} className="action-btn">
              Back to Home
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        .confirm-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #0f172a;
          color: white;
          padding: 1rem;
        }
        .confirm-card {
          background: #1e293b;
          padding: 3rem;
          border-radius: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          width: 100%;
          max-width: 440px;
          text-align: center;
          border: 1px solid #334155;
        }
        .recovery-mode {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .icon-wrap {
          font-size: 3.5rem;
          margin-bottom: 1.5rem;
          animation: pulse 1.5s ease-in-out infinite;
        }
        .icon-wrap.success, .icon-wrap.error { animation: none; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          background: linear-gradient(to right, #38bdf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        p { color: #94a3b8; font-size: 0.95rem; margin-bottom: 0.5rem; }
        .redirect-text { margin-top: 1.5rem; color: #64748b; font-size: 0.875rem; }
        .redirect-text strong { color: #38bdf8; font-size: 1.1rem; }
        .action-btn {
          margin-top: 1.5rem;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
