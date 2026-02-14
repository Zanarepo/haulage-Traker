'use client';

import { useForgotPassword } from '@/hooks/useForgotPassword';
import NexHaulLogo from '@/components/NexHaulLogo';

interface ForgotPasswordFormProps {
    onBackToLogin: () => void;
}

export default function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
    const {
        email,
        setEmail,
        loading,
        error,
        success,
        handleResetRequest
    } = useForgotPassword();

    return (
        <div className="login-container">
            <form onSubmit={handleResetRequest} className="login-form">
                <NexHaulLogo className="auth-logo-wrap" size={60} />
                <p>Enter your email to receive a recovery link</p>

                {error && <div className="error-message">{error}</div>}
                {success && (
                    <div className="success-message">
                        Recovery link sent! Please check your email inbox.
                    </div>
                )}

                {!success ? (
                    <>
                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@co.com"
                                required
                            />
                        </div>

                        <button type="submit" disabled={loading}>
                            {loading ? 'Sending link...' : 'Send Recovery Link'}
                        </button>
                    </>
                ) : (
                    <button type="button" onClick={onBackToLogin}>
                        Back to Login
                    </button>
                )}

                {!success && (
                    <div className="footer-links">
                        <button type="button" onClick={onBackToLogin} className="link-btn">
                            Back to Login
                        </button>
                    </div>
                )}
            </form>

            <style jsx>{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #0f172a;
          color: white;
          font-family: inherit;
          padding: 1rem;
        }
        .login-form {
          background: #1e293b;
          padding: 2.5rem;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          width: 100%;
          max-width: 400px;
        }
        .auth-logo-wrap {
          justify-content: center;
          margin-bottom: 2rem;
        }
        p {
          color: #94a3b8;
          text-align: center;
          margin-bottom: 2rem;
          font-size: 0.9rem;
        }
        .input-group {
          margin-bottom: 1.5rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: #cbd5e1;
        }
        input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #334155;
          border: 1px solid #475569;
          border-radius: 0.5rem;
          color: white;
          outline: none;
          font-size: 16px;
        }
        input:focus {
          border-color: #38bdf8;
        }
        button {
          width: 100%;
          padding: 0.75rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        button:hover {
          background: #2563eb;
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .error-message {
          background: #450a0a;
          color: #fca5a5;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          border: 1px solid #7f1d1d;
        }
        .success-message {
          background: #064e3b;
          color: #6ee7b7;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          border: 1px solid #065f46;
          text-align: center;
        }
        .footer-links {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.875rem;
          color: #94a3b8;
        }
        .link-btn {
          background: none;
          border: none;
          color: #38bdf8;
          font-weight: 600;
          cursor: pointer;
          margin-left: 0.5rem;
          padding: 0;
          width: auto;
        }

        @media (max-width: 480px) {
          .login-form { padding: 1.5rem; }
          h1 { font-size: 1.5rem; }
          p { margin-bottom: 1.5rem; }
        }
      `}</style>
        </div>
    );
}
