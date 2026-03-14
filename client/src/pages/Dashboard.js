import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TournamentCard from '../components/Shared/TournamentCard';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Dashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/users/stats')
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ paddingTop: 64 }}>
        <div className="loading-wrap"><div className="spinner" /><p>Loading dashboard…</p></div>
      </div>
    );
  }

  /* ── HOST DASHBOARD ──────────────────────────────────────── */
  if (user.role === 'host') {
    return (
      <div style={{ paddingTop: 64 }}>
        <div className="container" style={{ padding: '2.5rem 1.5rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="page-h1">Welcome back, {user.name.split(' ')[0]} ⚡</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Manage your tournaments and track performance
              </p>
            </div>
            <Link to="/create-tournament" className="btn btn-gold">+ Create Tournament</Link>
          </div>

          {/* Stats */}
          <div className="grid-4" style={{ marginBottom: '2rem' }}>
            {[
              { lbl: 'Tournaments Hosted',   val: stats?.tournamentsHosted  ?? 0 },
              { lbl: 'Total Registrations',  val: stats?.totalRegistrations ?? 0 },
              { lbl: 'Total Revenue',        val: `₹${(stats?.totalRevenue ?? 0).toLocaleString()}`, color: 'var(--gold)' },
              { lbl: 'Upcoming',             val: stats?.upcomingTournaments ?? 0, color: 'var(--green)' },
            ].map((s) => (
              <div key={s.lbl} className="stat-card">
                <div className="stat-label">{s.lbl}</div>
                <div className="stat-value" style={{ color: s.color || 'var(--text)' }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Tournaments */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontWeight: 600, fontSize: '1.15rem' }}>My Tournaments</h2>
          </div>

          {stats?.tournaments?.length > 0 ? (
            <div className="grid-3">
              {stats.tournaments.map((item) => (
                <div key={item._id}>
                  <TournamentCard t={{ ...item, host: user }} />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => navigate(`/tournaments/${item._id}/registrations`)}
                    >
                      📋 Entries
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/tournaments/${item._id}/edit`)}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="icon">🏟️</div>
              <h3>No tournaments yet</h3>
              <p>Create your first tournament and start accepting registrations.</p>
              <Link to="/create-tournament" className="btn btn-gold">+ Create Tournament</Link>
            </div>
          )}

          {/* Quick links */}
          <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'var(--dark-2)', borderRadius: 16, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem', fontWeight: 600 }}>Quick Actions</p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/tournaments"         className="btn btn-outline btn-sm">🔍 Browse</Link>
              <Link to="/create-tournament"   className="btn btn-outline btn-sm">+ New Tournament</Link>
              <Link to="/ai-tools"            className="btn btn-outline btn-sm">🤖 AI Tools</Link>
              <Link to="/profile"             className="btn btn-outline btn-sm">👤 Profile</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── PLAYER DASHBOARD ────────────────────────────────────── */
  return (
    <div style={{ paddingTop: 64 }}>
      <div className="container" style={{ padding: '2.5rem 1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-h1">Welcome back, {user.name.split(' ')[0]} 🎮</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>Track your registrations and upcoming matches</p>
          </div>
          <Link to="/tournaments" className="btn btn-gold">Browse Tournaments →</Link>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          {[
            { lbl: 'Total Entries',  val: stats?.totalRegistrations ?? 0 },
            { lbl: 'Confirmed',      val: stats?.confirmed  ?? 0, color: 'var(--green)' },
            { lbl: 'Waitlisted',     val: stats?.waitlisted ?? 0, color: 'var(--orange)' },
            { lbl: 'Tournaments Won',val: user.tournamentsWon ?? 0, color: 'var(--gold)' },
          ].map((s) => (
            <div key={s.lbl} className="stat-card">
              <div className="stat-label">{s.lbl}</div>
              <div className="stat-value" style={{ color: s.color || 'var(--text)' }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Recent entries table */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontWeight: 600, fontSize: '1.15rem' }}>Recent Entries</h2>
          <Link to="/my-registrations" className="btn btn-ghost btn-sm">View All →</Link>
        </div>

        {stats?.registrations?.length > 0 ? (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tournament</th>
                    <th>Sport</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.registrations.slice(0, 8).map((r) => (
                    <tr
                      key={r._id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/tournaments/${r.tournament?._id}`)}
                    >
                      <td style={{ fontWeight: 500 }}>{r.tournament?.title || '—'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.tournament?.sport || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {r.tournament?.startDate ? fmtDate(r.tournament.startDate) : '—'}
                      </td>
                      <td>
                        <span className={`badge ${
                          r.status === 'confirmed'  ? 'badge-green'    :
                          r.status === 'waitlisted' ? 'badge-full'     :
                          r.status === 'withdrawn'  ? 'badge-closed'   : 'badge-upcoming'
                        }`}>{r.status}</span>
                      </td>
                      <td>
                        <span className={`badge ${r.paymentStatus === 'paid' ? 'badge-green' : 'badge-full'}`}>
                          {r.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon">🎮</div>
            <h3>No entries yet</h3>
            <p>Find a tournament and register to compete!</p>
            <Link to="/tournaments" className="btn btn-gold">Browse Tournaments</Link>
          </div>
        )}

        {/* Quick links */}
        <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'var(--dark-2)', borderRadius: 16, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem', fontWeight: 600 }}>Quick Actions</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/tournaments"       className="btn btn-outline btn-sm">🔍 Browse</Link>
            <Link to="/my-registrations"  className="btn btn-outline btn-sm">📋 My Registrations</Link>
            <Link to="/ai-tools"          className="btn btn-outline btn-sm">🤖 AI Tools</Link>
            <Link to="/profile"           className="btn btn-outline btn-sm">👤 Profile</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
