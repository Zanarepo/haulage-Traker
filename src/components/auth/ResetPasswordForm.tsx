'use client';

import { useResetPassword } from '@/hooks/useResetPassword';
import NexHaulLogo from '@/components/NexHaulLogo';

export default function ResetPasswordForm() {
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    success,
    handleResetPassword
  } = useResetPassword();

  if (success) {
    return (
      <div className="login-form">
        <NexHaulLogo className="auth-logo-wrap" size={60} />
        <p>Your password has been reset successfully.</p>
        <button onClick={() => window.location.href = '/'} className="action-btn">
          Go to Login
        </button>
        <style jsx>{`
          .login-form {
            background: #1e293b;
            padding: 2.5rem;
            border-radius: 1rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            width: 100%;
            max-width: 400px;
            text-align: center;
          }
          .auth-logo-wrap {
            justify-content: center;
            margin-bottom: 2rem;
          }
          p { color: #94a3b8; font-size: 0.9rem; margin-bottom: 2rem; }
          .action-btn {
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
          .action-btn:hover { background: #2563eb; }
        `}</style>
      </div>
    );
  }

  return (
    <form onSubmit={handleResetPassword} className="login-form">
      <NexHaulLogo className="auth-logo-wrap" size={60} />
      <p>Set a strong password for your account</p>

      {error && <div className="error-message">{error}</div>}

      <div className="input-group">
        <label>New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 6 characters"
          required
        />
      </div>

      <div className="input-group">
        <label>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat password"
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Password'}
      </button>

      <style jsx>{`
        .login-form {
          background: #1e293b;
          padding: 2.5rem;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          width: 100%;
          max-width: 400px;
          text-align: left;
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
        .input-group { margin-bottom: 1.5rem; }
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
        input:focus { border-color: #38bdf8; }
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
        button:hover { background: #2563eb; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        .error-message {
          background: #450a0a;
          color: #fca5a5;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          border: 1px solid #7f1d1d;
        }
      `}</style>
    </form>
  );
}
