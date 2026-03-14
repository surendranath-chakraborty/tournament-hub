import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function MyRegistrations() {
  const navigate = useNavigate();
  const [regs,       setRegs]       = useState([]);
  const [filter,     setFilter]     = useState('all');
  const [loading,    setLoading]    = useState(true);
  const [withdrawing,setWithdrawing]= useState(null);

  useEffect(() => {
    axios.get('/registrations/my')
      .then((r) => setRegs(r.data))
      .catch(() => toast.error('Failed to load registrations'))
      .finally(() => setLoading(false));
  }, []);

  const handleWithdraw = async (reg) => {
    if (!window.confirm('Withdraw from this tournament?')) return;
    setWithdrawing(reg._id);
    try {
      const { data } = await axios.delete(`/registrations/${reg._id}`);
      toast.success(data.message);
      setRegs((prev) =>
        prev.map((r) => r._id === reg._id ? { ...r, status: 'withdrawn' } : r)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(null);
    }
  };

  const filtered   = regs.filter((r) => filter === 'all' || r.status === filter);
  const countOf    = (s) => regs.filter((r) => r.status === s).length;
  const totalPaid  = regs.filter((r) => r.paymentStatus === 'paid').reduce((s, r) => s + r.amountPaid, 0);

  if (loading) {
    return (
      <div style={{ paddingTop: 64 }}>
        <div className="loading-wrap"><div className="spinner" /><p>Loading your registrations…</p></div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 64 }}>
      <div className="container" style={{ padding: '2.5rem 1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-h1">My Registrations</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>All your tournament entries</p>
          </div>
          <button className="btn btn-gold" onClick={() => navigate('/tournaments')}>Browse More →</button>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          {[
            { lbl: 'Total Entries',  val: regs.length },
            { lbl: 'Confirmed',      val: countOf('confirmed'),  color: 'var(--green)' },
            { lbl: 'Waitlisted',     val: countOf('waitlisted'), color: 'var(--orange)' },
            { lbl: 'Amount Paid',    val: `₹${totalPaid.toLocaleString()}`, color: 'var(--gold)' },
          ].map((s) => (
            <div key={s.lbl} className="stat-card">
              <div className="stat-label">{s.lbl}</div>
              <div className="stat-value" style={{ color: s.color || 'var(--text)' }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="tabs">
          {['all', 'confirmed', 'waitlisted', 'withdrawn'].map((f) => (
            <button
              key={f}
              className={`tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Registration cards */}
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map((r) => {
              const t            = r.tournament;
              const pastDeadline = t?.withdrawalDeadline && new Date() > new Date(t.withdrawalDeadline);
              const canWithdraw  = !['withdrawn', 'removed'].includes(r.status);

              return (
                <div key={r._id} className="card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                  {/* Left info */}
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${
                        r.status === 'confirmed'  ? 'badge-green' :
                        r.status === 'waitlisted' ? 'badge-full'  :
                        r.status === 'withdrawn'  ? 'badge-closed' : 'badge-red'
                      }`}>
                        {r.status === 'waitlisted' ? `Waitlisted #${r.waitlistPosition}` : r.status}
                      </span>
                      <span className={`badge ${r.paymentStatus === 'paid' ? 'badge-green' : 'badge-full'}`}>
                        {r.paymentStatus}
                      </span>
                    </div>

                    <h3
                      style={{ fontWeight: 600, cursor: 'pointer', marginBottom: '0.2rem' }}
                      onClick={() => navigate(`/tournaments/${t?._id}`)}
                    >
                      {t?.title || 'Tournament'}
                    </h3>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      🏅 {t?.sport || '—'}
                      {t?.location?.city && ` · 📍 ${t.location.city}`}
                      {t?.startDate && ` · 📅 ${fmtDate(t.startDate)}`}
                    </div>

                    {r.teamName && (
                      <div style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
                        👥 Team: <strong>{r.teamName}</strong>
                      </div>
                    )}

                    {r.amountPaid > 0 && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        💳 Paid: ₹{r.amountPaid}
                      </div>
                    )}

                    {r.refundStatus && r.refundStatus !== 'none' && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--green)', marginTop: '0.2rem' }}>
                        💰 Refund: {r.refundStatus}
                      </div>
                    )}
                  </div>

                  {/* Right actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', flexShrink: 0 }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/tournaments/${t?._id}`)}
                    >
                      View →
                    </button>

                    {canWithdraw && (
                      <>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleWithdraw(r)}
                          disabled={withdrawing === r._id}
                        >
                          {withdrawing === r._id ? '…' : 'Withdraw'}
                        </button>
                        {pastDeadline && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--red)', textAlign: 'right' }}>
                            ⚠️ No refund
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon">🎮</div>
            <h3>No registrations found</h3>
            <p>
              {filter !== 'all'
                ? `No ${filter} entries.`
                : 'You have not registered for any tournaments yet.'}
            </p>
            <button className="btn btn-gold" onClick={() => navigate('/tournaments')}>
              Browse Tournaments
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
