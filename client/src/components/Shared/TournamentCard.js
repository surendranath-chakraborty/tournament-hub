import React from 'react';
import { useNavigate } from 'react-router-dom';
import ShareButton from './ShareButton';

const EMOJI = {
  cricket: '🏏', football: '⚽', basketball: '🏀', volleyball: '🏐',
  badminton: '🏸', tennis: '🎾', kabaddi: '🤼', chess: '♟️',
  'table tennis': '🏓', tabletennis: '🏓', swimming: '🏊',
  athletics: '🏃', boxing: '🥊', other: '🏅',
};

const STATUS_CLS = {
  upcoming: 'badge-upcoming', ongoing: 'badge-ongoing',
  full: 'badge-full', closed: 'badge-closed', cancelled: 'badge-cancelled',
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function TournamentCard({ t }) {
  const navigate = useNavigate();
  const emoji = EMOJI[t.sport?.toLowerCase()] || '🏆';
  const fill = Math.min(100, Math.round(((t.registeredCount || 0) / t.maxSlots) * 100));
  const fillCls = fill >= 90 ? 'danger' : fill >= 70 ? 'warn' : '';

  return (
    <div className="t-card" onClick={() => navigate(`/tournaments/${t._id}`)}>
      <div className="t-card-img">
        <span>{emoji}</span>
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <span className={`badge ${STATUS_CLS[t.status] || 'badge-upcoming'}`}>{t.status}</span>
        </div>
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span className="badge badge-gold">{t.type === 'team' ? '👥 Team' : '👤 Solo'}</span>
        </div>
      </div>

      <div className="t-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
          <h3 className="t-card-title" style={{ flex: 1 }}>{t.title}</h3>
          <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            {t.entryFee > 0 ? `₹${t.entryFee}` : 'FREE'}
          </span>
        </div>

        <div className="t-card-meta">
          <span>🏅 {t.sport}</span>
          <span>📍 {t.location?.city}</span>
          <span>{t.indoorOutdoor === 'indoor' ? '🏠 Indoor' : '🌿 Outdoor'}</span>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
          📅 {fmtDate(t.startDate)}
        </div>

        <div style={{ marginBottom: '0.6rem' }}>
          <div className="slot-bar-track">
            <div className={`slot-bar-fill ${fillCls}`} style={{ width: `${fill}%` }} />
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {t.registeredCount}/{t.maxSlots} slots
            {t.waitlistCount > 0 && ` · ${t.waitlistCount} waitlisted`}
          </div>
        </div>

        <div className="t-card-footer">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            by {t.host?.name || 'Host'}
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <ShareButton tournament={t} variant="icon" />
            <button
              className="btn btn-gold btn-sm"
              onClick={(e) => { e.stopPropagation(); navigate(`/tournaments/${t._id}`); }}
            >
              View →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}