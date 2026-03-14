import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome back, ${u.name}! 🏆`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '5rem 1rem', paddingTop: '90px',
      background: 'radial-gradient(ellipse at center, rgba(245,184,0,0.05) 0%, transparent 70%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '2.2rem', letterSpacing: 2, color: '#F5B800' }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Sign in to your Tournament Hub account
          </p>
        </div>

        <div className="card card-gold">
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                name="email" type="email" placeholder="you@email.com"
                value={form.email} onChange={onChange} required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                name="password" type="password" placeholder="••••••••"
                value={form.password} onChange={onChange} required
              />
            </div>
            <button
              type="submit"
              className="btn btn-gold btn-full"
              style={{ marginTop: '0.25rem' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div style={{
            textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem',
            borderTop: '1px solid var(--border)', fontSize: '0.88rem', color: 'var(--text-muted)',
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#F5B800', fontWeight: 600 }}>Create one →</Link>
          </div>
        </div>

        <div className="alert alert-info" style={{ marginTop: '1rem', fontSize: '0.82rem' }}>
          💡 New here? Register as a <strong>Host</strong> to create tournaments or as a <strong>Player</strong> to join them.
        </div>
      </div>
    </div>
  );
}
