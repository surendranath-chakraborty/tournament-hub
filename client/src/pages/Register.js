import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

var ce = React.createElement;

var CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune',
  'Ahmedabad', 'Jaipur', 'Surat', 'Bardhaman', 'Patna', 'Lucknow', 'Bhopal',
  'Nagpur', 'Indore', 'Visakhapatnam', 'Bhubaneswar', 'Kochi', 'Coimbatore',
];

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

// Google SVG icon
function GoogleIcon() {
  return ce('svg', { width: 20, height: 20, viewBox: '0 0 24 24', style: { flexShrink: 0 } },
    ce('path', { fill: '#4285F4', d: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' }),
    ce('path', { fill: '#34A853', d: 'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' }),
    ce('path', { fill: '#FBBC05', d: 'M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z' }),
    ce('path', { fill: '#EA4335', d: 'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' })
  );
}

// Password strength checker
function getStrength(pwd) {
  var score = 0;
  var checks = {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
    long: pwd.length >= 12,
  };
  Object.values(checks).forEach(function (v) { if (v) score++; });
  return { score, checks };
}

function StrengthBar({ password }) {
  if (!password) return null;
  var { score, checks } = getStrength(password);
  var levels = [
    { label: 'Very Weak', color: '#E84B4B' },
    { label: 'Weak', color: '#F58B00' },
    { label: 'Fair', color: '#F5B800' },
    { label: 'Good', color: '#4B9EE8' },
    { label: 'Strong', color: '#22C97D' },
  ];
  var level = levels[Math.min(score - 1, 4)] || levels[0];

  return ce('div', { style: { marginTop: 8 } },
    // Strength bar
    ce('div', { style: { display: 'flex', gap: 4, marginBottom: 6 } },
      [0, 1, 2, 3, 4].map(function (i) {
        return ce('div', {
          key: i, style: {
            flex: 1, height: 4, borderRadius: 4,
            background: i < score ? level.color : 'rgba(255,255,255,0.1)',
            transition: 'background 0.3s',
          }
        });
      })
    ),
    // Label
    ce('div', { style: { fontSize: '0.75rem', color: level.color, fontWeight: 600, marginBottom: 6 } },
      level.label
    ),
    // Requirement checklist
    ce('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '4px 12px' } },
      [
        { key: 'length', label: '8+ chars' },
        { key: 'uppercase', label: '1 uppercase' },
        { key: 'number', label: '1 number' },
        { key: 'special', label: '1 special char (!@#$)' },
      ].map(function (req) {
        return ce('div', { key: req.key, style: { fontSize: '0.72rem', color: checks[req.key] ? '#22C97D' : '#5A5A6A', display: 'flex', alignItems: 'center', gap: 4 } },
          ce('span', null, checks[req.key] ? '✓' : '○'),
          req.label
        );
      })
    )
  );
}

export default function Register() {
  var { register, googleAuth, googleAuthWithRole } = useAuth();
  var navigate = useNavigate();

  var [form, setForm] = useState({ name: '', email: '', password: '', role: 'player', phone: '', city: '' });
  var [loading, setLoading] = useState(false);
  var [gLoading, setGLoading] = useState(false);
  var [showPwd, setShowPwd] = useState(false);
  var [showRoleModal, setShowRoleModal] = useState(false);

  function onChange(e) {
    setForm(function (p) { return Object.assign({}, p, { [e.target.name]: e.target.value }); });
  }

  async function onSubmit(e) {
    e.preventDefault();
    // Frontend password strength check
    var { score } = getStrength(form.password);
    if (score < 3) {
      toast.error('Password is too weak. Use 8+ chars with uppercase, number and special character.');
      return;
    }
    if (!form.name.trim()) { toast.error('Name is required'); return; }

    setLoading(true);
    try {
      var u = await register(form);
      toast.success('Account created! Welcome, ' + u.name + '! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  // Google sign-up — need to pick role first for new users
  async function handleGoogle() {
    setGLoading(true);
    try {
      var result = await googleAuth(null);
      if (result === 'ROLE_REQUIRED') {
        setShowRoleModal(true);
        setGLoading(false);
        return;
      }
      toast.success('Welcome, ' + result.name + '! 🏆');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Google sign-in failed');
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

  return ce('div', {
    style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 1rem', paddingTop: 90 }
  },

    ce('style', null, '.auth-inp:focus{border-color:rgba(245,184,0,0.5)!important;} .google-btn:hover{background:rgba(255,255,255,0.1)!important;border-color:rgba(255,255,255,0.3)!important;} @keyframes spin{to{transform:rotate(360deg)}}'),

    // Role pick modal for Google new users
    showRoleModal && ce('div', { className: 'modal-overlay' },
      ce('div', { className: 'modal', style: { maxWidth: 400, textAlign: 'center' } },
        ce('div', { style: { fontSize: '3rem', marginBottom: '1rem' } }, '👋'),
        ce('h2', { style: { fontWeight: 700, marginBottom: '0.5rem' } }, 'One quick step!'),
        ce('p', { style: { color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' } }, 'How will you use Tournament Hub?'),
        ce('div', { style: { display: 'flex', gap: '1rem' } },
          ce('button', {
            onClick: function () { handleRolePick('player'); },
            style: { flex: 1, padding: '1.2rem', background: 'rgba(75,158,232,0.1)', border: '2px solid #4B9EE8', borderRadius: 14, cursor: 'pointer' }
          },
            ce('div', { style: { fontSize: '2rem', marginBottom: 6 } }, '🎮'),
            ce('div', { style: { fontWeight: 700, color: '#4B9EE8' } }, 'Player'),
            ce('div', { style: { fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 } }, 'Join & compete in tournaments')
          ),
          ce('button', {
            onClick: function () { handleRolePick('host'); },
            style: { flex: 1, padding: '1.2rem', background: 'rgba(245,184,0,0.1)', border: '2px solid #F5B800', borderRadius: 14, cursor: 'pointer' }
          },
            ce('div', { style: { fontSize: '2rem', marginBottom: 6 } }, '🏆'),
            ce('div', { style: { fontWeight: 700, color: '#F5B800' } }, 'Host'),
            ce('div', { style: { fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 } }, 'Create & manage tournaments')
          )
        )
      )
    ),

    ce('div', { style: { width: '100%', maxWidth: 500 } },

      // Header
      ce('div', { style: { textAlign: 'center', marginBottom: '2rem' } },
        ce('div', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '2.2rem', color: '#F5B800', letterSpacing: 3, marginBottom: 4 } }, '🏆 TOURNAMENT HUB'),
        ce('h1', { style: { fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 } }, 'Create your free account'),
        ce('p', { style: { color: 'var(--text-muted)', fontSize: '0.9rem' } }, 'Already have an account? ',
          ce(Link, { to: '/login', style: { color: '#F5B800', fontWeight: 600 } }, 'Sign in')
        )
      ),

      ce('div', { className: 'card', style: { padding: '2rem' } },

        // Google button
        ce('button', {
          className: 'google-btn',
          onClick: handleGoogle, disabled: gLoading,
          style: { width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, cursor: gLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s', marginBottom: '1.25rem', opacity: gLoading ? 0.7 : 1 }
        },
          gLoading
            ? ce('div', { style: { width: 20, height: 20, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' } })
            : ce(GoogleIcon),
          gLoading ? 'Connecting...' : 'Sign up with Google'
        ),

        // Divider
        ce('div', { style: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' } },
          ce('div', { style: { flex: 1, height: 1, background: 'var(--border)' } }),
          ce('span', { style: { fontSize: '0.78rem', color: 'var(--text-muted)' } }, 'or sign up with email'),
          ce('div', { style: { flex: 1, height: 1, background: 'var(--border)' } })
        ),

        // Role picker
        ce('div', { style: { marginBottom: '1.25rem' } },
          ce('label', { style: LABEL }, 'I want to...'),
          ce('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' } },
            [
              { val: 'player', icon: '🎮', title: 'Play', desc: 'Join & compete in tournaments' },
              { val: 'host', icon: '⚡', title: 'Host', desc: 'Create & manage tournaments' },
            ].map(function (r) {
              return ce('button', {
                key: r.val, type: 'button',
                onClick: function () { setForm(function (p) { return Object.assign({}, p, { role: r.val }); }); },
                style: { padding: '0.85rem', borderRadius: 12, cursor: 'pointer', textAlign: 'center', border: '2px solid ' + (form.role === r.val ? '#F5B800' : 'var(--border)'), background: form.role === r.val ? 'rgba(245,184,0,0.08)' : 'var(--dark-3)', color: 'var(--text)', transition: 'all 0.15s' }
              },
                ce('div', { style: { fontSize: '1.6rem', marginBottom: 3 } }, r.icon),
                ce('div', { style: { fontWeight: 700, fontSize: '0.9rem', color: form.role === r.val ? '#F5B800' : 'var(--text)' } }, r.title),
                ce('div', { style: { fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 } }, r.desc)
              );
            })
          )
        ),

        // Full name
        ce('div', { style: { marginBottom: '1rem' } },
          ce('label', { style: LABEL }, 'Full Name *'),
          ce('input', { className: 'auth-inp', name: 'name', placeholder: 'Your full name', value: form.name, onChange: onChange, style: INP })
        ),

        // Email
        ce('div', { style: { marginBottom: '1rem' } },
          ce('label', { style: LABEL }, 'Email Address *'),
          ce('input', { className: 'auth-inp', name: 'email', type: 'email', placeholder: 'you@gmail.com', value: form.email, onChange: onChange, style: INP, autoComplete: 'email' }),
          ce('div', { style: { fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 } }, '⚠️ Disposable/temporary emails are not allowed')
        ),

        // Phone + City
        ce('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' } },
          ce('div', null,
            ce('label', { style: LABEL }, 'Phone'),
            ce('input', { className: 'auth-inp', name: 'phone', placeholder: '9876543210', value: form.phone, onChange: onChange, style: INP })
          ),
          ce('div', null,
            ce('label', { style: LABEL }, 'City'),
            ce('select', { name: 'city', value: form.city, onChange: onChange, style: INP },
              ce('option', { value: '' }, 'Select city'),
              CITIES.map(function (c) { return ce('option', { key: c, value: c }, c); })
            )
          )
        ),

        // Password with strength meter
        ce('div', { style: { marginBottom: '1.5rem' } },
          ce('label', { style: LABEL }, 'Password *'),
          ce('div', { style: { position: 'relative' } },
            ce('input', {
              className: 'auth-inp', name: 'password',
              type: showPwd ? 'text' : 'password',
              placeholder: 'Min 8 chars, uppercase, number, special',
              value: form.password, onChange: onChange,
              style: Object.assign({}, INP, { paddingRight: '2.8rem' }),
              autoComplete: 'new-password',
            }),
            ce('button', {
              type: 'button',
              onClick: function () { setShowPwd(function (p) { return !p; }); },
              style: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }
            }, showPwd ? '🙈' : '👁️')
          ),
          // Live strength meter
          ce(StrengthBar, { password: form.password })
        ),

        // Submit
        ce('button', {
          onClick: onSubmit, disabled: loading,
          className: 'btn btn-gold btn-full',
          style: { fontSize: '1rem', padding: '0.85rem', opacity: loading ? 0.7 : 1 }
        }, loading ? 'Creating account...' : 'Create ' + (form.role === 'host' ? 'Host' : 'Player') + ' Account →'),

        // Security note
        ce('div', { style: { textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-dim)' } },
          '🔒 Your data is encrypted and secure'
        )
      )
    )
  );
}