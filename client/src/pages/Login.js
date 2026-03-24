import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

var ce = React.createElement;

var INP = {
  width: '100%', padding: '0.75rem 1rem',
  background: 'var(--dark-3)',
  border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text)',
  fontSize: '0.95rem', outline: 'none',
  fontFamily: 'DM Sans, sans-serif',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
};

var LABEL = {
  fontSize: '0.8rem', fontWeight: 600,
  color: 'var(--text-muted)', marginBottom: 6,
  display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px',
};

// SVG Google icon
function GoogleIcon() {
  return ce('svg', { width: 20, height: 20, viewBox: '0 0 24 24', style: { flexShrink: 0 } },
    ce('path', { fill: '#4285F4', d: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' }),
    ce('path', { fill: '#34A853', d: 'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' }),
    ce('path', { fill: '#FBBC05', d: 'M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z' }),
    ce('path', { fill: '#EA4335', d: 'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' })
  );
}

export default function Login() {
  var { login, googleAuth, googleAuthWithRole } = useAuth();
  var navigate = useNavigate();

  var [form, setForm] = useState({ email: '', password: '' });
  var [loading, setLoading] = useState(false);
  var [gLoading, setGLoading] = useState(false);
  var [showPwd, setShowPwd] = useState(false);
  var [showRoleModal, setShowRoleModal] = useState(false);
  var [pendingCred, setPendingCred] = useState(null);

  function onChange(e) {
    setForm(function (p) { return Object.assign({}, p, { [e.target.name]: e.target.value }); });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      var u = await login(form.email, form.password);
      toast.success('Welcome back, ' + u.name + '! 🏆');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGLoading(true);
    try {
      var result = await googleAuth(null); // null = detect existing user
      if (result === 'ROLE_REQUIRED') {
        // New user — need to pick role
        setShowRoleModal(true);
        return;
      }
      toast.success('Welcome, ' + result.name + '! 🏆');
      navigate('/dashboard');
    } catch (err) {
      var msg = err.response?.data?.message || err.message || 'Google sign-in failed';
      if (msg !== 'ROLE_REQUIRED') toast.error(msg);
      if (msg === 'ROLE_REQUIRED') setShowRoleModal(true);
    } finally {
      setGLoading(false);
    }
  }

  async function handleRolePick(role) {
    setShowRoleModal(false);
    setGLoading(true);
    try {
      var result = await googleAuthWithRole(role);
      toast.success('Welcome, ' + result.name + '! 🏆');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setGLoading(false);
    }
  }

  return ce('div', { style: { paddingTop: 64, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' } },

    ce('style', null, '.auth-inp:focus{border-color:rgba(245,184,0,0.5)!important;} .google-btn:hover{background:rgba(255,255,255,0.1)!important;border-color:rgba(255,255,255,0.3)!important;}'),

    // Role pick modal for new Google users
    showRoleModal && ce('div', { className: 'modal-overlay', onClick: function () { setShowRoleModal(false); } },
      ce('div', { className: 'modal', style: { maxWidth: 400, textAlign: 'center' }, onClick: function (e) { e.stopPropagation(); } },
        ce('div', { style: { fontSize: '3rem', marginBottom: '1rem' } }, '👋'),
        ce('h2', { style: { fontWeight: 700, marginBottom: '0.5rem' } }, 'Welcome! One quick step'),
        ce('p', { style: { color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' } },
          'How will you use Tournament Hub?'
        ),
        ce('div', { style: { display: 'flex', gap: '1rem' } },
          ce('button', {
            onClick: function () { handleRolePick('player'); },
            style: { flex: 1, padding: '1.2rem', background: 'rgba(75,158,232,0.1)', border: '2px solid #4B9EE8', borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s' }
          },
            ce('div', { style: { fontSize: '2rem', marginBottom: 6 } }, '🎮'),
            ce('div', { style: { fontWeight: 700, color: '#4B9EE8', fontSize: '1rem' } }, 'Player'),
            ce('div', { style: { fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 } }, 'Join & compete in tournaments')
          ),
          ce('button', {
            onClick: function () { handleRolePick('host'); },
            style: { flex: 1, padding: '1.2rem', background: 'rgba(245,184,0,0.1)', border: '2px solid #F5B800', borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s' }
          },
            ce('div', { style: { fontSize: '2rem', marginBottom: 6 } }, '🏆'),
            ce('div', { style: { fontWeight: 700, color: '#F5B800', fontSize: '1rem' } }, 'Host'),
            ce('div', { style: { fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 } }, 'Create & manage tournaments')
          )
        )
      )
    ),

    ce('div', { style: { width: '100%', maxWidth: 440 } },

      // Logo + title
      ce('div', { style: { textAlign: 'center', marginBottom: '2rem' } },
        ce('div', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '2.2rem', color: '#F5B800', letterSpacing: 3, marginBottom: 4 } }, '🏆 TOURNAMENT HUB'),
        ce('h1', { style: { fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 } }, 'Welcome back'),
        ce('p', { style: { color: 'var(--text-muted)', fontSize: '0.9rem' } }, "Don't have an account? ",
          ce(Link, { to: '/register', style: { color: '#F5B800', fontWeight: 600 } }, 'Sign up free')
        )
      ),

      // Card
      ce('div', { className: 'card', style: { padding: '2rem' } },

        // Google button
        ce('button', {
          className: 'google-btn',
          onClick: handleGoogle,
          disabled: gLoading,
          style: {
            width: '100%', padding: '0.75rem 1rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10, cursor: gLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)',
            fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
            marginBottom: '1.25rem',
            opacity: gLoading ? 0.7 : 1,
          }
        },
          gLoading
            ? ce('div', { style: { width: 20, height: 20, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' } })
            : ce(GoogleIcon),
          gLoading ? 'Signing in...' : 'Continue with Google'
        ),

        // Divider
        ce('div', { style: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' } },
          ce('div', { style: { flex: 1, height: 1, background: 'var(--border)' } }),
          ce('span', { style: { fontSize: '0.78rem', color: 'var(--text-muted)' } }, 'or sign in with email'),
          ce('div', { style: { flex: 1, height: 1, background: 'var(--border)' } })
        ),

        // Email
        ce('div', { style: { marginBottom: '1rem' } },
          ce('label', { style: LABEL }, 'Email Address'),
          ce('input', {
            className: 'auth-inp', name: 'email', type: 'email',
            placeholder: 'you@example.com',
            value: form.email, onChange: onChange,
            style: INP, autoComplete: 'email',
          })
        ),

        // Password
        ce('div', { style: { marginBottom: '1.5rem' } },
          ce('label', { style: LABEL }, 'Password'),
          ce('div', { style: { position: 'relative' } },
            ce('input', {
              className: 'auth-inp', name: 'password',
              type: showPwd ? 'text' : 'password',
              placeholder: 'Your password',
              value: form.password, onChange: onChange,
              style: Object.assign({}, INP, { paddingRight: '2.8rem' }),
              autoComplete: 'current-password',
            }),
            ce('button', {
              type: 'button',
              onClick: function () { setShowPwd(function (p) { return !p; }); },
              style: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }
            }, showPwd ? '🙈' : '👁️')
          )
        ),

        // Submit
        ce('button', {
          onClick: onSubmit,
          disabled: loading,
          className: 'btn btn-gold btn-full',
          style: { fontSize: '1rem', padding: '0.85rem', opacity: loading ? 0.7 : 1 }
        }, loading ? 'Signing in...' : 'Sign In →')
      ),

      ce('style', null, '@keyframes spin{to{transform:rotate(360deg)}}')
    )
  );
}