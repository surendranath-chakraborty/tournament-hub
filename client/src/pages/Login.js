import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

var ce = React.createElement;

function GoogleIcon() {
  return ce('svg', { width: 20, height: 20, viewBox: '0 0 24 24', style: { flexShrink: 0 } },
    ce('path', { fill: '#4285F4', d: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' }),
    ce('path', { fill: '#34A853', d: 'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' }),
    ce('path', { fill: '#FBBC05', d: 'M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z' }),
    ce('path', { fill: '#EA4335', d: 'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' })
  );
}

export default function Login() {
  var { login, googleAuth, googleAuthWithRole } = useAuth();
  var navigate = useNavigate();

  var [email, setEmail] = useState('');
  var [password, setPassword] = useState('');
  var [loading, setLoading] = useState(false);
  var [gLoading, setGLoading] = useState(false);
  var [showPwd, setShowPwd] = useState(false);

  // Role selection state for new Google users
  var [showRolePick, setShowRolePick] = useState(false);
  var [pendingToken, setPendingToken] = useState(null);
  var [roleLoading, setRoleLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) { toast.error('Enter email and password'); return; }
    setLoading(true);
    try {
      var u = await login(email, password);
      toast.success('Welcome back, ' + u.name + '! 👋');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check email and password.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGLoading(true);
    try {
      var result = await googleAuth(null);

      // New user — needs to pick role
      if (result && result.needsRole) {
        setPendingToken(result.idToken);
        setShowRolePick(true);
        return;
      }

      // Existing user — logged in
      toast.success('Welcome, ' + result.name + '! 🏆');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Google sign-in failed');
    } finally {
      setGLoading(false);
    }
  }

  async function handleRolePick(role) {
    setRoleLoading(true);
    try {
      var result = await googleAuthWithRole(pendingToken, role);
      toast.success('Welcome, ' + result.name + '! 🏆');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed. Please try again.');
      setShowRolePick(false);
    } finally {
      setRoleLoading(false);
    }
  }

  var INP = {
    width: '100%', padding: '0.75rem 1rem',
    background: 'var(--dark-3)', border: '1px solid var(--border)',
    borderRadius: 10, color: 'var(--text)', fontSize: '0.95rem',
    outline: 'none', fontFamily: 'DM Sans, sans-serif',
    boxSizing: 'border-box',
  };

  // ── Role pick modal ───────────────────────────────────────
  if (showRolePick) {
    return ce('div', { style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' } },
      ce('div', { style: { width: '100%', maxWidth: 420, textAlign: 'center' } },
        ce('div', { style: { fontSize: '3rem', marginBottom: '1rem' } }, '👋'),
        ce('h1', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '2rem', color: '#F5B800', marginBottom: '0.5rem', letterSpacing: 2 } }, 'ONE QUICK STEP'),
        ce('p', { style: { color: 'var(--text-muted)', marginBottom: '2rem' } }, 'How will you use Tournament Hub?'),
        ce('div', { style: { display: 'flex', gap: '1rem' } },
          ce('button', {
            onClick: function () { handleRolePick('player'); },
            disabled: roleLoading,
            style: { flex: 1, padding: '1.5rem 1rem', background: 'rgba(75,158,232,0.1)', border: '2px solid #4B9EE8', borderRadius: 16, cursor: roleLoading ? 'not-allowed' : 'pointer', opacity: roleLoading ? 0.7 : 1 }
          },
            ce('div', { style: { fontSize: '2.5rem', marginBottom: 8 } }, '🎮'),
            ce('div', { style: { fontWeight: 700, color: '#4B9EE8', fontSize: '1.1rem', marginBottom: 4 } }, 'Player'),
            ce('div', { style: { fontSize: '0.8rem', color: 'var(--text-muted)' } }, 'Join & compete in tournaments')
          ),
          ce('button', {
            onClick: function () { handleRolePick('host'); },
            disabled: roleLoading,
            style: { flex: 1, padding: '1.5rem 1rem', background: 'rgba(245,184,0,0.1)', border: '2px solid #F5B800', borderRadius: 16, cursor: roleLoading ? 'not-allowed' : 'pointer', opacity: roleLoading ? 0.7 : 1 }
          },
            ce('div', { style: { fontSize: '2.5rem', marginBottom: 8 } }, '🏆'),
            ce('div', { style: { fontWeight: 700, color: '#F5B800', fontSize: '1.1rem', marginBottom: 4 } }, 'Host'),
            ce('div', { style: { fontSize: '0.8rem', color: 'var(--text-muted)' } }, 'Create & manage tournaments')
          )
        ),
        roleLoading && ce('p', { style: { marginTop: '1.5rem', color: 'var(--text-muted)' } }, 'Setting up your account...')
      )
    );
  }

  // ── Main login form ───────────────────────────────────────
  return ce('div', { style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', paddingTop: 90 } },
    ce('style', null, '@keyframes spin{to{transform:rotate(360deg)}} .auth-inp:focus{border-color:rgba(245,184,0,0.5)!important;} .google-btn:hover{background:rgba(255,255,255,0.08)!important;}'),

    ce('div', { style: { width: '100%', maxWidth: 440 } },

      // Header
      ce('div', { style: { textAlign: 'center', marginBottom: '2rem' } },
        ce('div', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '2.2rem', color: '#F5B800', letterSpacing: 3, marginBottom: 4 } }, '🏆 TOURNAMENT HUB'),
        ce('h1', { style: { fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 } }, 'Welcome back!'),
        ce('p', { style: { color: 'var(--text-muted)', fontSize: '0.9rem' } },
          "Don't have an account? ",
          ce(Link, { to: '/register', style: { color: '#F5B800', fontWeight: 600 } }, 'Sign up free')
        )
      ),

      ce('div', { className: 'card', style: { padding: '2rem' } },

        // Google button
        ce('button', {
          className: 'google-btn',
          onClick: handleGoogle,
          disabled: gLoading,
          style: { width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, cursor: gLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s', marginBottom: '1.25rem', opacity: gLoading ? 0.7 : 1 }
        },
          gLoading
            ? ce('div', { style: { width: 20, height: 20, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' } })
            : ce(GoogleIcon),
          gLoading ? 'Connecting to Google...' : 'Continue with Google'
        ),

        // Divider
        ce('div', { style: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' } },
          ce('div', { style: { flex: 1, height: 1, background: 'var(--border)' } }),
          ce('span', { style: { fontSize: '0.78rem', color: 'var(--text-muted)' } }, 'or sign in with email'),
          ce('div', { style: { flex: 1, height: 1, background: 'var(--border)' } })
        ),

        // Email
        ce('div', { style: { marginBottom: '1rem' } },
          ce('label', { style: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' } }, 'Email Address'),
          ce('input', { className: 'auth-inp', type: 'email', placeholder: 'you@gmail.com', value: email, onChange: function (e) { setEmail(e.target.value); }, style: INP, onKeyDown: function (e) { if (e.key === 'Enter') handleLogin(e); } })
        ),

        // Password
        ce('div', { style: { marginBottom: '1.5rem' } },
          ce('label', { style: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' } }, 'Password'),
          ce('div', { style: { position: 'relative' } },
            ce('input', { className: 'auth-inp', type: showPwd ? 'text' : 'password', placeholder: 'Your password', value: password, onChange: function (e) { setPassword(e.target.value); }, style: Object.assign({}, INP, { paddingRight: '2.8rem' }), onKeyDown: function (e) { if (e.key === 'Enter') handleLogin(e); } }),
            ce('button', { type: 'button', onClick: function () { setShowPwd(function (p) { return !p; }); }, style: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' } }, showPwd ? '🙈' : '👁️')
          )
        ),

        // Submit
        ce('button', {
          onClick: handleLogin,
          disabled: loading,
          className: 'btn btn-gold btn-full',
          style: { fontSize: '1rem', padding: '0.85rem', opacity: loading ? 0.7 : 1 }
        }, loading ? 'Signing in...' : 'Sign In →'),

        ce('div', { style: { textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-dim)' } },
          '🔒 Secured with JWT & Firebase Authentication'
        )
      )
    )
  );
}