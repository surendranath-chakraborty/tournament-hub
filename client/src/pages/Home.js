import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TournamentCard from '../components/Shared/TournamentCard';

const FEATURES = [
  { icon: '🏆', title: 'Host Tournaments',  desc: 'Create and manage events with full control over slots, rules, and deadlines.' },
  { icon: '🎮', title: 'Join & Compete',    desc: 'Find tournaments near you and register solo or as a team in seconds.' },
  { icon: '🤖', title: 'AI-Powered Tools',  desc: 'Auto-generate fixtures and discover nearby grounds using Groq AI for free.' },
  { icon: '💳', title: 'Secure Payments',   desc: 'Collect entry fees via Razorpay. Automatic refunds on eligible withdrawals.' },
  { icon: '📋', title: 'Smart Waitlist',    desc: 'Auto-promote waitlisted players when a confirmed slot opens up.' },
  { icon: '📄', title: 'Export Data',       desc: 'Download player lists and fixture brackets as PDF or Excel files.' },
];

const SPORTS = [
  ['🏏','Cricket'],['⚽','Football'],['🏀','Basketball'],['🏐','Volleyball'],
  ['🏸','Badminton'],['🎾','Tennis'],['🤼','Kabaddi'],['♟️','Chess'],
  ['🏓','Table Tennis'],['🏊','Swimming'],['🏃','Athletics'],['🥊','Boxing'],
];

export default function Home() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    axios.get('/tournaments?limit=3&status=upcoming')
      .then((r) => setFeatured(r.data.tournaments || []))
      .catch(() => {});
  }, []);

  return (
    <div style={{ paddingTop: 64 }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '4rem 1.5rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid bg */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(245,184,0,0.04) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(245,184,0,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        {/* Glow */}
        <div style={{
          position: 'absolute', width: 700, height: 700,
          background: 'radial-gradient(circle, rgba(245,184,0,0.07) 0%, transparent 70%)',
          borderRadius: '50%', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: 820 }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: '0.72rem',
            color: '#F5B800', letterSpacing: '4px', textTransform: 'uppercase',
            marginBottom: '1.5rem',
          }}>
            India's #1 Tournament Platform
          </div>

          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(4rem, 14vw, 9.5rem)',
            lineHeight: 0.88, letterSpacing: '3px',
            color: '#F0EEE8', marginBottom: '0.25rem',
          }}>TOURNAMENT</h1>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(4rem, 14vw, 9.5rem)',
            lineHeight: 0.88, letterSpacing: '3px',
            color: '#F5B800', marginBottom: '1.75rem',
          }}>HUB</h1>

          <p style={{
            fontSize: '1.1rem', color: '#8A8A9A',
            maxWidth: 500, margin: '0 auto 2.5rem', lineHeight: 1.75,
          }}>
            Organize, compete, and win. The all-in-one platform for hosting and
            joining sports tournaments across India.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {user ? (
              <>
                <button className="btn btn-gold btn-lg" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard →
                </button>
                <button className="btn btn-outline btn-lg" onClick={() => navigate('/tournaments')}>
                  Browse Tournaments
                </button>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-gold btn-lg">Get Started Free →</Link>
                <Link to="/tournaments" className="btn btn-outline btn-lg">Browse Tournaments</Link>
              </>
            )}
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: '3rem', justifyContent: 'center',
            marginTop: '3.5rem', flexWrap: 'wrap',
          }}>
            {[
              { val: '100%', lbl: 'Free to Join' },
              { val: 'AI',   lbl: 'Fixture Generator' },
              { val: '₹0',   lbl: 'Platform Fee' },
            ].map((s) => (
              <div key={s.lbl} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: '2rem', color: '#F5B800', letterSpacing: 2,
                }}>{s.val}</div>
                <div style={{ fontSize: '0.75rem', color: '#8A8A9A', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {s.lbl}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sports ticker ─────────────────────────────────────── */}
      <section style={{
        padding: '2rem 0', overflow: 'hidden',
        borderTop: '1px solid rgba(245,184,0,0.1)',
        borderBottom: '1px solid rgba(245,184,0,0.1)',
      }}>
        <div style={{
          display: 'flex', gap: '1.5rem',
          animation: 'marquee 22s linear infinite',
          width: 'max-content',
        }}>
          {[...SPORTS, ...SPORTS].map(([e, n], i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.55rem 1.1rem',
              background: 'var(--dark-3)', borderRadius: 50,
              border: '1px solid var(--border)',
              fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap',
            }}>
              <span style={{ fontSize: '1.1rem' }}>{e}</span> {n}
            </div>
          ))}
        </div>
        <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: 2,
            }}>Everything You Need</h2>
            <p style={{ color: '#8A8A9A', maxWidth: 460, margin: '0.5rem auto 0' }}>
              Powerful tools for hosts and players. Zero complexity.
            </p>
          </div>
          <div className="grid-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                <h3 style={{ fontWeight: 600, marginBottom: '0.4rem', fontSize: '1rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.87rem', color: '#8A8A9A', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured tournaments ───────────────────────────────── */}
      {featured.length > 0 && (
        <section style={{ padding: '3rem 1.5rem 5rem', borderTop: '1px solid var(--border)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '2rem', letterSpacing: 2 }}>
                Upcoming Tournaments
              </h2>
              <Link to="/tournaments" className="btn btn-outline btn-sm">View All →</Link>
            </div>
            <div className="grid-3">
              {featured.map((item) => <TournamentCard key={item._id} t={item} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────────── */}
      {!user && (
        <section style={{
          padding: '5rem 1.5rem', textAlign: 'center',
          background: 'var(--dark-2)', borderTop: '1px solid var(--border)',
        }}>
          <div className="container">
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: 2, marginBottom: '1rem' }}>
              Ready to Compete?
            </h2>
            <p style={{ color: '#8A8A9A', marginBottom: '2rem', fontSize: '1.05rem', maxWidth: 400, margin: '0 auto 2rem' }}>
              Join as a Player to enter tournaments, or as a Host to run your own events.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-gold btn-lg">Create Free Account →</Link>
              <Link to="/login"    className="btn btn-outline btn-lg">Sign In</Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)', padding: '2rem 1.5rem',
        textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem',
      }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.2rem', color: 'var(--gold)', letterSpacing: 2, marginBottom: '0.4rem' }}>
          TOURNAMENT HUB
        </div>
        © {new Date().getFullYear()} Tournament Hub · Built with MERN + Groq AI + Razorpay
      </footer>
    </div>
  );
}
