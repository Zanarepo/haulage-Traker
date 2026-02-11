'use client';

import { useLogin } from '@/hooks/useLogin';

interface LoginFormProps {
  onShowRegister: () => void;
}

export default function LoginForm({ onShowRegister }: LoginFormProps) {
  const {
    identifier,
    setIdentifier,
    password,
    setPassword,
    loading,
    error,
    handleLogin
  } = useLogin();

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h1>Haulage Tracker</h1>
        <p>Sign in to manage your diesel logistics</p>

        {error && <div className="error-message">{error}</div>}

        <div className="input-group">
          <label>Email or Phone</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="example@co.com or +234..."
            required
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>

        <div className="footer-links">
          <span>New to the system?</span>
          <button type="button" onClick={onShowRegister} className="link-btn">
            Register your company
          </button>
        </div>
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
        h1 {
          margin-bottom: 0.5rem;
          font-size: 1.875rem;
          font-weight: 700;
          text-align: center;
          background: linear-gradient(to right, #38bdf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
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
          font-size: 16px; /* Prevent iOS zoom */
        }
        input:focus {
          border-color: #38bdf8;
        }
        button[type="submit"] {
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
        button[type="submit"]:hover {
          background: #2563eb;
        }
        button[type="submit"]:disabled {
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
