'use client';

import { useRegister } from '@/hooks/useRegister';
import NexHaulLogo from '@/components/NexHaulLogo';

interface RegisterFormProps {
  onBackToLogin: () => void;
}

export default function RegisterForm({ onBackToLogin }: RegisterFormProps) {
  const {
    formData,
    loading,
    error,
    success,
    handleChange,
    handleRegister
  } = useRegister();

  if (success) {
    return (
      <div className="auth-form-wrapper">
        <div className="login-form success-message">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
          <h2>Account Created Successfully!</h2>
          <p>Your company has been registered and you are the <strong style={{ color: '#38bdf8' }}>Superadmin</strong>.</p>
          <div className="verify-box">
            <p>Please check your email inbox at:</p>
            <p className="email-highlight">{formData.email}</p>
            <p>Click the verification link to activate your account.</p>
          </div>
          <button type="button" onClick={onBackToLogin} className="back-btn">
            Back to Login
          </button>
        </div>
        <style jsx>{`
          .auth-form-wrapper {
            display: flex;
            justify-content: center;
            padding: 2rem 1rem;
          }
          .login-form {
            background: #1e293b;
            padding: 2.5rem;
            border-radius: 1rem;
            text-align: center;
            max-width: 440px;
            width: 100%;
            border: 1px solid #334155;
          }
          h2 { color: #38bdf8; font-size: 1.5rem; margin-bottom: 0.5rem; }
          p { color: #94a3b8; font-size: 0.9rem; margin-bottom: 0.25rem; }
          .verify-box {
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 0.75rem;
            padding: 1.25rem;
            margin: 1.5rem 0;
          }
          .email-highlight {
            color: #38bdf8;
            font-weight: 600;
            font-size: 1rem;
            margin: 0.5rem 0;
          }
          .back-btn {
            background: transparent;
            color: #94a3b8;
            border: 1px solid #334155;
            padding: 0.6rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
            width: 100%;
          }
          .back-btn:hover { color: #38bdf8; border-color: #38bdf8; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="auth-form-wrapper">
      <form onSubmit={handleRegister} className="login-form">
        <h2>Create Account</h2>
        <p>Register Your Company & Become Superadmin</p>

        {error && <div className="error-message">{error}</div>}

        <div className="input-group">
          <label>Full Name</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="input-group">
          <label>Company Name</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="A1 Logistics Ltd"
            required
          />
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@company.com"
              required
            />
          </div>
          <div className="input-group">
            <label>Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+234..."
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label>Create Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Register Company'}
        </button>

        <div className="footer-links">
          <span>Already have an account?</span>
          <button type="button" onClick={onBackToLogin} className="link-btn">
            Login here
          </button>
        </div>
      </form>

      <style jsx>{`
        .auth-form-wrapper {
          display: flex;
          justify-content: center;
          padding: 2rem 1rem;
        }
        .login-form {
          background: #1e293b;
          padding: 2.5rem;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          width: 100%;
          max-width: 500px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        h2 {
          text-align: center;
          color: #38bdf8;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          font-weight: 700;
        }
        p {
          color: #94a3b8;
          text-align: center;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
        }
        .input-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .input-group {
          margin-bottom: 1.25rem;
        }
        label {
          display: block;
          margin-bottom: 0.4rem;
          font-size: 0.85rem;
          color: #cbd5e1;
        }
        input {
          width: 100%;
          padding: 0.65rem 0.9rem;
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
          margin-top: 0.5rem;
          transition: background 0.2s;
        }
        button[type="submit"]:hover {
          background: #2563eb;
        }
        button:disabled {
          opacity: 0.5;
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
        .error-message {
          background: #450a0a;
          color: #fca5a5;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1.25rem;
          font-size: 0.85rem;
          border: 1px solid #7f1d1d;
        }

        @media (max-width: 600px) {
          .login-form { padding: 1.5rem; }
          .input-row { grid-template-columns: 1fr; gap: 0; }
          h1 { font-size: 1.6rem; }
        }
      `}</style>
    </div>
  );
}
