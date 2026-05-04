import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-scan" />

      <div className="auth-brand">
        <div className="auth-logo">
          <svg width="26" height="26" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="4"  width="11" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="1" y="8"  width="7"  height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="1" y="12" width="9"  height="1.5" rx="0.75" fill="currentColor"/>
            <circle cx="14" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="14" cy="12" r="0.8" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <div className="auth-brand-name">TaskFlow</div>
          <div className="auth-brand-sub">Neo Task Management System</div>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-card-header">
          <h2>// Access Terminal</h2>
          <p>Enter credentials to authenticate</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          {error && <div className="error-msg">{error}</div>}

          <div className="field">
            <label>User Email</label>
            <input
              type="email" name="email" value={form.email} onChange={handle}
              placeholder="operator@domain.io" required autoFocus
            />
          </div>

          <div className="field">
            <label>Auth Key</label>
            <input
              type="password" name="password" value={form.password} onChange={handle}
              placeholder="••••••••••••" required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : '→ Authenticate'}
          </button>
        </form>

        <p className="auth-switch">
          No account? <Link to="/signup">Initialize new user →</Link>
        </p>
      </div>

      <p className="auth-footer">TaskFlow NEO // Secure Collaboration Platform</p>
    </div>
  );
}
