import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  const active = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    padding: '0.5rem 1rem',
    borderRadius: 10,
    color:      active(path) ? '#F5B800' : '#8A8A9A',
    background: active(path) ? 'rgba(245,184,0,0.08)' : 'transparent',
    fontSize: '0.88rem',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  });

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
    setOpen(false);
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(245,184,0,0.15)',
      height: 64, display: 'flex', alignItems: 'center',
      padding: '0 1.5rem', justifyContent: 'space-between', gap: '1rem',
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          width: 34, height: 34, background: '#F5B800', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem',
        }}>🏆</div>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1.5rem', letterSpacing: '2px', color: '#F5B800',
        }}>Tournament Hub</span>
      </Link>

      {/* Centre nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'nowrap', overflow: 'hidden' }}>
        <Link to="/tournaments" style={linkStyle('/tournaments')}>Browse</Link>
        {user && (
          <>
            <Link to="/dashboard"  style={linkStyle('/dashboard')}>Dashboard</Link>
            {user.role === 'host' && (
              <Link to="/create-tournament" style={linkStyle('/create-tournament')}>+ Create</Link>
            )}
            {user.role === 'player' && (
              <Link to="/my-registrations" style={linkStyle('/my-registrations')}>My Entries</Link>
            )}
            <Link to="/ai-tools" style={linkStyle('/ai-tools')}>AI Tools</Link>
          </>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        {user ? (
          <div style={{ position: 'relative' }}>
            {/* User chip */}
            <button
              onClick={() => setOpen(!open)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--dark-3)', border: '1px solid var(--border)',
                borderRadius: 50, padding: '5px 14px 5px 6px',
                cursor: 'pointer', color: 'var(--text)',
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%', background: '#F5B800',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700, color: '#0A0A0F',
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                {user.name.split(' ')[0]}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#F5B800' }}>
                {user.role === 'host' ? '⚡' : '🎮'}
              </span>
            </button>

            {/* Dropdown */}
            {open && (
              <>
                {/* Click-away overlay */}
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                  onClick={() => setOpen(false)}
                />
                <div style={{
                  position: 'absolute', top: '110%', right: 0, zIndex: 200,
                  background: '#12121A', border: '1px solid rgba(245,184,0,0.2)',
                  borderRadius: 14, padding: '0.5rem', minWidth: 190,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                }}>
                  {/* User info */}
                  <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.25rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Signed in as</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#F5B800', textTransform: 'capitalize' }}>{user.role}</div>
                  </div>

                  {[
                    { label: '👤  Profile',      to: '/profile' },
                    { label: '📊  Dashboard',    to: '/dashboard' },
                    { label: '🤖  AI Tools',     to: '/ai-tools' },
                    ...(user.role === 'player'
                      ? [{ label: '📋  My Entries', to: '/my-registrations' }]
                      : [{ label: '🏆  + Create',  to: '/create-tournament' }]
                    ),
                  ].map((item) => (
                    <Link
                      key={item.to + item.label}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      style={{
                        display: 'block', padding: '0.5rem 0.75rem',
                        borderRadius: 8, fontSize: '0.85rem', color: 'var(--text)',
                        textDecoration: 'none', transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dark-3)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {item.label}
                    </Link>
                  ))}

                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '0.5rem 0.75rem', borderRadius: 8, fontSize: '0.85rem',
                        color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer',
                      }}
                    >
                      🚪  Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <Link to="/login"    className="btn btn-ghost btn-sm">Login</Link>
            <Link to="/register" className="btn btn-gold  btn-sm">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
