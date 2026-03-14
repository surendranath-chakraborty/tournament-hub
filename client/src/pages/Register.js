import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const CITIES = [
  'Mumbai','Delhi','Bangalore','Chennai','Kolkata','Hyderabad','Pune',
  'Ahmedabad','Jaipur','Surat','Bardhaman','Patna','Lucknow','Bhopal',
  'Nagpur','Indore','Visakhapatnam','Bhubaneswar','Kochi','Coimbatore',
];

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'player', phone: '', city: '' });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const u = await register(form);
      toast.success(`Account created! Welcome, ${u.name}! 🎉`);
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Registration failed';
      toast.error(msg);
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
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '2.2rem', letterSpacing: 2, color: '#F5B800' }}>
            Join Tournament Hub
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Create your free account</p>
        </div>

        <div className="card card-gold">
          {/* Role picker */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500, marginBottom: '0.75rem' }}>
              I want to…
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { val: 'player', icon: '🎮', title: 'Play',  desc: 'Join tournaments solo or as a team' },
                { val: 'host',   icon: '⚡', title: 'Host',  desc: 'Organize and manage tournaments' },
              ].map((r) => (
                <button
                  key={r.val}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, role: r.val }))}
                  style={{
                    padding: '1rem', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                    border: `2px solid ${form.role === r.val ? '#F5B800' : 'var(--border)'}`,
                    background: form.role === r.val ? 'rgba(245,184,0,0.08)' : 'var(--dark-3)',
                    color: 'var(--text)', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>{r.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{r.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input name="name" placeholder="Your full name" value={form.name} onChange={onChange} required />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input name="email" type="email" placeholder="you@email.com" value={form.email} onChange={onChange} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone (optional)</label>
                <input name="phone" placeholder="9876543210" value={form.phone} onChange={onChange} />
              </div>
              <div className="form-group">
                <label>City</label>
                <select name="city" value={form.city} onChange={onChange}>
                  <option value="">Select city</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input name="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={onChange} required minLength={6} />
            </div>

            <button
              type="submit"
              className="btn btn-gold btn-full"
              style={{ marginTop: '0.25rem' }}
              disabled={loading}
            >
              {loading ? 'Creating account...' : `Create ${form.role === 'host' ? 'Host' : 'Player'} Account →`}
            </button>
          </form>

          <div style={{
            textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem',
            borderTop: '1px solid var(--border)', fontSize: '0.88rem', color: 'var(--text-muted)',
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#F5B800', fontWeight: 600 }}>Sign In →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
