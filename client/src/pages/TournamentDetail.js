import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import ShareButton from '../components/Shared/ShareButton';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

const BLANK_PLAYER = { name: '', email: '', phone: '', age: '' };

export default function TournamentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [myReg, setMyReg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [regForm, setRegForm] = useState({ teamName: '', players: [{ ...BLANK_PLAYER }] });
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: t } = await axios.get(`/tournaments/${id}`);
        setTournament(t);
        if (user?.role === 'player') {
          const { data: regs } = await axios.get('/registrations/my');
          const found = regs.find(
            (r) => r.tournament?._id === id || r.tournament === id
          );
          setMyReg(found || null);
        }
      } catch {
        toast.error('Tournament not found');
        navigate('/tournaments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user, navigate]);

  const addPlayer = () => setRegForm((p) => ({ ...p, players: [...p.players, { ...BLANK_PLAYER }] }));
  const removePlayer = (i) => setRegForm((p) => ({ ...p, players: p.players.filter((_, idx) => idx !== i) }));
  const updatePlayer = (i, field, val) =>
    setRegForm((p) => {
      const pl = [...p.players];
      pl[i] = { ...pl[i], [field]: val };
      return { ...p, players: pl };
    });

  const handleRegister = async () => {
    if (!regForm.players[0].name || !regForm.players[0].email) {
      toast.error('Please fill in at least the first player name and email');
      return;
    }
    if (tournament.type === 'team' && !regForm.teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }
    setSubmitting(true);
    try {
      const { data: reg } = await axios.post('/registrations', {
        tournamentId: id,
        registrationType: tournament.type,
        teamName: regForm.teamName,
        players: regForm.players,
      });

      if (tournament.entryFee > 0) {
        const { data: order } = await axios.post('/payments/create-order', {
          registrationId: reg._id,
        });
        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'Tournament Hub',
          description: tournament.title,
          order_id: order.orderId,
          handler: async (response) => {
            try {
              await axios.post('/payments/verify', {
                ...response,
                registrationId: reg._id,
              });
              toast.success('Payment successful! Registration confirmed 🎉');
              setShowModal(false);
              window.location.reload();
            } catch {
              toast.error('Payment verification failed – contact host');
            }
          },
          prefill: { name: user.name, email: user.email, contact: user.phone || '' },
          theme: { color: '#F5B800' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.success(
          reg.status === 'waitlisted'
            ? 'Added to waitlist! You will be notified if a slot opens.'
            : 'Registration confirmed! 🎉'
        );
        setShowModal(false);
        window.location.reload();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Are you sure you want to withdraw? This cannot be undone.')) return;
    setWithdrawing(true);
    try {
      const { data } = await axios.delete(`/registrations/${myReg._id}`);
      toast.success(data.message);
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ paddingTop: 64 }}>
        <div className="loading-wrap"><div className="spinner" /><p>Loading…</p></div>
      </div>
    );
  }
  if (!tournament) return null;

  const fillPct = Math.min(100, Math.round((tournament.registeredCount / tournament.maxSlots) * 100));
  const isFull = tournament.registeredCount >= tournament.maxSlots;
  const pastReg = new Date() > new Date(tournament.registrationDeadline);
  const pastWithdraw = new Date() > new Date(tournament.withdrawalDeadline);
  const isMyTournament = user?.role === 'host' && tournament.host?._id === user?._id;
  const canRegister = user?.role === 'player' && !myReg && !pastReg && !['closed', 'cancelled'].includes(tournament.status);

  const STATUS_BADGE = {
    upcoming: 'badge-upcoming', ongoing: 'badge-ongoing',
    full: 'badge-full', closed: 'badge-closed', cancelled: 'badge-cancelled',
  };

  return (
    <div style={{ paddingTop: 64 }}>

      <div style={{
        background: 'linear-gradient(135deg, var(--dark-2), var(--dark-3))',
        borderBottom: '1px solid var(--border)', padding: '3rem 1.5rem',
      }}>
        <div className="container" style={{ maxWidth: 960 }}>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start' }}>

            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <span className={`badge ${STATUS_BADGE[tournament.status] || 'badge-upcoming'}`}>{tournament.status}</span>
                <span className="badge badge-gold">{tournament.type === 'team' ? '👥 Team' : '👤 Solo'}</span>
                <span className="badge badge-blue">{tournament.indoorOutdoor}</span>
              </div>
              <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(2rem,5vw,3.5rem)', letterSpacing: 2, lineHeight: 1, marginBottom: '0.5rem' }}>
                {tournament.title}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                🏅 {tournament.sport} &nbsp;·&nbsp; 📍 {tournament.location?.venue}, {tournament.location?.city}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                Organized by <strong style={{ color: 'var(--text)' }}>{tournament.host?.name}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 190, alignItems: 'flex-end' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '2.8rem', color: 'var(--gold)', lineHeight: 1 }}>
                {tournament.entryFee > 0 ? `₹${tournament.entryFee}` : 'FREE'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                entry fee per {tournament.type}
              </div>

              {/* Host controls + Share */}
              {isMyTournament && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate(`/tournaments/${id}/edit`)}>✏️ Edit</button>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate(`/tournaments/${id}/registrations`)}>📋 Entries</button>
                  <ShareButton tournament={tournament} />
                </div>
              )}

              {/* Share button for non-hosts too */}
              {!isMyTournament && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <ShareButton tournament={tournament} />
                </div>
              )}

              {/* Player: already registered */}
              {user?.role === 'player' && myReg && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span className={`badge ${myReg.status === 'confirmed' ? 'badge-green' :
                        myReg.status === 'waitlisted' ? 'badge-full' : 'badge-closed'
                      }`}>
                      {myReg.status === 'confirmed' && '✅ Confirmed'}
                      {myReg.status === 'waitlisted' && `⏳ Waitlisted #${myReg.waitlistPosition}`}
                      {!['confirmed', 'waitlisted'].includes(myReg.status) && myReg.status}
                    </span>
                  </div>
                  {!['withdrawn', 'removed'].includes(myReg.status) && (
                    <>
                      <button className="btn btn-danger btn-sm" onClick={handleWithdraw} disabled={withdrawing}>
                        {withdrawing ? 'Withdrawing…' : 'Withdraw'}
                      </button>
                      {pastWithdraw && (
                        <div style={{ fontSize: '0.73rem', color: 'var(--red)', marginTop: 4 }}>⚠️ No refund after deadline</div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Player: can register */}
              {canRegister && (
                <button className="btn btn-gold" onClick={() => setShowModal(true)}>
                  {isFull ? '📋 Join Waitlist' : '🎮 Register Now'}
                </button>
              )}

              {!canRegister && !myReg && !isMyTournament && user?.role === 'player' && (
                <span className="badge badge-closed" style={{ fontSize: '0.8rem' }}>Registration Closed</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 960, padding: '2.5rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

          <div>
            {tournament.description && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>About</h2>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '0.95rem' }}>
                  {tournament.description}
                </p>
              </div>
            )}

            {tournament.rules && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>📜 Rules</h2>
                <pre style={{
                  color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '0.9rem',
                  fontFamily: "'DM Sans',sans-serif", whiteSpace: 'pre-wrap',
                }}>
                  {tournament.rules}
                </pre>
              </div>
            )}

            {(tournament.prizePool || tournament.firstPrize) && (
              <div className="card card-gold">
                <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>🏅 Prizes</h2>
                {tournament.prizePool && <p style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem' }}>{tournament.prizePool}</p>}
                {tournament.firstPrize && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>🥇 1st: {tournament.firstPrize}</p>}
                {tournament.secondPrize && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>🥈 2nd: {tournament.secondPrize}</p>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Slots</h3>
              <div className="slot-bar-track">
                <div
                  className={`slot-bar-fill ${fillPct >= 90 ? 'danger' : fillPct >= 70 ? 'warn' : ''}`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6 }}>
                <span>{tournament.registeredCount} registered</span>
                <span>{tournament.maxSlots} max</span>
              </div>
              {tournament.waitlistCount > 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--orange)', marginTop: 4 }}>
                  ⏳ {tournament.waitlistCount} on waitlist
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>📅 Key Dates</h3>
              {[
                { lbl: 'Tournament Start', val: fmtDate(tournament.startDate) },
                { lbl: 'Tournament End', val: fmtDate(tournament.endDate) },
                { lbl: 'Register By', val: fmtDate(tournament.registrationDeadline), warn: pastReg },
                { lbl: 'Withdraw By', val: fmtDate(tournament.withdrawalDeadline), warn: pastWithdraw },
              ].map((d) => (
                <div key={d.lbl} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '0.45rem 0', borderBottom: '1px solid var(--border)',
                  fontSize: '0.85rem',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{d.lbl}</span>
                  <span style={{ fontWeight: 500, color: d.warn ? 'var(--red)' : 'var(--text)' }}>{d.val}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>🧑 Organizer</h3>
              <div style={{ fontWeight: 600 }}>{tournament.host?.name}</div>
              {tournament.host?.city && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>📍 {tournament.host.city}</div>}
              {tournament.host?.email && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>✉️ {tournament.host.email}</div>}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isFull ? '📋 Join Waitlist' : '🎮 Register'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {isFull && (
              <div className="alert alert-warning">
                Tournament is full. You'll be placed on the waitlist and auto-confirmed if a slot opens.
              </div>
            )}

            {tournament.type === 'team' && (
              <div className="form-group">
                <label>Team Name *</label>
                <input
                  placeholder="Your team name"
                  value={regForm.teamName}
                  onChange={(e) => setRegForm((p) => ({ ...p, teamName: e.target.value }))}
                />
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>
                  {tournament.type === 'team' ? 'Players' : 'Your Details'}
                </label>
                {tournament.type === 'team' && (
                  <button className="btn btn-ghost btn-sm" onClick={addPlayer}>+ Add Player</button>
                )}
              </div>

              {regForm.players.map((pl, i) => (
                <div key={i} style={{ background: 'var(--dark-3)', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                      {tournament.type === 'team' ? `Player ${i + 1}` : 'Your Info'}
                    </span>
                    {tournament.type === 'team' && i > 0 && (
                      <button className="btn btn-ghost btn-sm" onClick={() => removePlayer(i)} style={{ color: 'var(--red)' }}>✕</button>
                    )}
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Name *</label>
                      <input placeholder="Full name" value={pl.name} onChange={(e) => updatePlayer(i, 'name', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Email *</label>
                      <input type="email" placeholder="Email" value={pl.email} onChange={(e) => updatePlayer(i, 'email', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row" style={{ marginTop: '0.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Phone</label>
                      <input placeholder="Phone" value={pl.phone} onChange={(e) => updatePlayer(i, 'phone', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Age</label>
                      <input type="number" placeholder="Age" value={pl.age} onChange={(e) => updatePlayer(i, 'age', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {tournament.entryFee > 0 && (
              <div className="alert alert-info">
                💳 Entry fee: <strong>₹{tournament.entryFee}</strong> — you will be redirected to Razorpay.
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline btn-full" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-gold btn-full" onClick={handleRegister} disabled={submitting}>
                {submitting ? 'Processing…' : tournament.entryFee > 0 ? `Pay ₹${tournament.entryFee} & Register` : 'Confirm Registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}