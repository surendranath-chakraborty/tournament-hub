import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const SPORTS = ['Cricket', 'Football', 'Basketball', 'Volleyball', 'Badminton', 'Tennis', 'Kabaddi', 'Chess', 'Table Tennis', 'Swimming', 'Athletics', 'Boxing', 'Other'];
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Bardhaman', 'Patna', 'Lucknow', 'Bhopal', 'Nagpur', 'Indore'];

const today = () => new Date().toISOString().split('T')[0];
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };

const INIT = {
  title: '', sport: '', description: '', rules: '',
  type: 'team', indoorOutdoor: 'outdoor',
  location: { city: '', venue: '', address: '' },
  startDate: addDays(7),
  endDate: addDays(8),
  registrationDeadline: addDays(5),
  withdrawalDeadline: addDays(6),
  editDeadline: addDays(5),
  maxSlots: 8, entryFee: 0,
  prizePool: '', firstPrize: '', secondPrize: '',
};

const STEPS = ['Basic Info', 'Location & Dates', 'Slots & Fees', 'Rules & Prizes'];

export default function CreateTournament() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INIT);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setLoc = (k, v) => setForm((p) => ({ ...p, location: { ...p.location, [k]: v } }));

  const validate = () => {
    if (step === 1) {
      if (!form.title.trim()) { toast.error('Tournament title is required'); return false; }
      if (!form.sport) { toast.error('Please select a sport'); return false; }
    }
    if (step === 2) {
      if (!form.location.city) { toast.error('Please select a city'); return false; }
      if (!form.location.venue.trim()) { toast.error('Venue name is required'); return false; }
    }
    return true;
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const { data } = await axios.post('/tournaments', form);
      toast.success('Tournament created! 🎉');
      navigate(`/tournaments/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create tournament');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: 720, padding: '2.5rem 1.5rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 className="page-h1">Create Tournament</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Fill in the details to set up your tournament.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: 4, borderRadius: 4, marginBottom: 6,
                background: i + 1 <= step ? '#F5B800' : 'var(--dark-4)',
                opacity: i + 1 < step ? 0.6 : i + 1 === step ? 1 : 0.3,
              }} />
              <div style={{ fontSize: '0.68rem', color: i + 1 === step ? '#F5B800' : 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                {s}
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>

          {/* ── Step 1: Basic ──────────────────────────────────── */}
          {step === 1 && (
            <>
              <h2 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Basic Information</h2>
              <div className="form-group">
                <label>Tournament Title *</label>
                <input placeholder="e.g. City Cricket League 2025" value={form.title} onChange={(e) => set('title', e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Sport *</label>
                  <select value={form.sport} onChange={(e) => set('sport', e.target.value)}>
                    <option value="">Select sport</option>
                    {SPORTS.map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tournament Type *</label>
                  <select value={form.type} onChange={(e) => set('type', e.target.value)}>
                    <option value="team">Team (groups of players)</option>
                    <option value="solo">Solo (individual players)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Indoor / Outdoor</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {['indoor', 'outdoor'].map((v) => (
                    <button
                      key={v} type="button"
                      onClick={() => set('indoorOutdoor', v)}
                      style={{
                        flex: 1, padding: '0.75rem', borderRadius: 10, cursor: 'pointer',
                        border: `2px solid ${form.indoorOutdoor === v ? '#F5B800' : 'var(--border)'}`,
                        background: form.indoorOutdoor === v ? 'rgba(245,184,0,0.08)' : 'var(--dark-3)',
                        color: 'var(--text)', fontWeight: 500, fontSize: '0.9rem',
                      }}
                    >
                      {v === 'indoor' ? '🏠 Indoor' : '🌿 Outdoor'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Describe the tournament, who can participate, format, etc."
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>
            </>
          )}

          {/* ── Step 2: Location & Dates ───────────────────────── */}
          {step === 2 && (
            <>
              <h2 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Location & Dates</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <select value={form.location.city} onChange={(e) => setLoc('city', e.target.value)}>
                    <option value="">Select city</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Venue Name *</label>
                  <input placeholder="e.g. Eden Gardens" value={form.location.venue} onChange={(e) => setLoc('venue', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Full Address</label>
                <input placeholder="Street, area, city" value={form.location.address} onChange={(e) => setLoc('address', e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input type="date" min={today()} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input type="date" min={form.startDate} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label>Registration Deadline *</label>
                  <input type="date" min={today()} value={form.registrationDeadline} onChange={(e) => set('registrationDeadline', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Withdrawal Deadline *</label>
                  <input type="date" min={today()} value={form.withdrawalDeadline} onChange={(e) => set('withdrawalDeadline', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Edit Deadline</label>
                  <input type="date" min={today()} value={form.editDeadline} onChange={(e) => set('editDeadline', e.target.value)} />
                </div>
              </div>
              <div className="alert alert-warning">
                ⚠️ Players withdrawing <strong>after the Withdrawal Deadline</strong> will not receive a refund.
              </div>
            </>
          )}

          {/* ── Step 3: Slots & Fees ───────────────────────────── */}
          {step === 3 && (
            <>
              <h2 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Slots & Entry Fee</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Max {form.type === 'team' ? 'Teams' : 'Players'} *</label>
                  <input
                    type="number" min={2} max={256}
                    placeholder="e.g. 16"
                    value={form.maxSlots}
                    onChange={(e) => set('maxSlots', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label>Entry Fee (₹) — 0 for free</label>
                  <input
                    type="number" min={0}
                    placeholder="0"
                    value={form.entryFee}
                    onChange={(e) => set('entryFee', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              {form.entryFee > 0 ? (
                <div className="alert alert-info">
                  💳 Payments collected securely via our payment gateway. Estimated revenue:&nbsp;
                  <strong>₹{(form.entryFee * form.maxSlots).toLocaleString()}</strong>.

                </div>
              ) : (
                <div className="alert alert-success">
                  ✅ Free tournament — players can register without any payment.
                </div>
              )}
            </>
          )}

          {/* ── Step 4: Rules & Prizes ─────────────────────────── */}
          {step === 4 && (
            <>
              <h2 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Rules & Prizes</h2>
              <div className="form-group">
                <label>Tournament Rules</label>
                <textarea
                  rows={6}
                  placeholder="List rules, format (knockout / round-robin), eligibility criteria…"
                  value={form.rules}
                  onChange={(e) => set('rules', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Prize Pool (optional)</label>
                <input placeholder="e.g. ₹50,000 total" value={form.prizePool} onChange={(e) => set('prizePool', e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>1st Prize</label>
                  <input placeholder="e.g. ₹30,000 + Trophy" value={form.firstPrize} onChange={(e) => set('firstPrize', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>2nd Prize</label>
                  <input placeholder="e.g. ₹15,000" value={form.secondPrize} onChange={(e) => set('secondPrize', e.target.value)} />
                </div>
              </div>

              {/* Summary */}
              <div style={{ background: 'var(--dark-3)', borderRadius: 12, padding: '1.25rem', marginTop: '1.5rem' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '0.75rem' }}>
                  Summary
                </p>
                {[
                  ['Title', form.title || '—'],
                  ['Sport', form.sport || '—'],
                  ['Type', `${form.type} / ${form.indoorOutdoor}`],
                  ['Location', `${form.location.venue || '—'}, ${form.location.city || '—'}`],
                  ['Dates', `${form.startDate} → ${form.endDate}`],
                  ['Slots', `${form.maxSlots} ${form.type === 'team' ? 'teams' : 'players'}`],
                  ['Fee', form.entryFee > 0 ? `₹${form.entryFee}` : 'FREE'],
                ].map(([k, v]) => (
                  <div key={k} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '0.4rem 0', borderBottom: '1px solid var(--border)',
                    fontSize: '0.87rem',
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
          <button
            className="btn btn-outline"
            style={{ minWidth: 120 }}
            onClick={() => step > 1 ? setStep((s) => s - 1) : navigate('/dashboard')}
          >
            ← {step > 1 ? 'Back' : 'Cancel'}
          </button>

          {step < 4 ? (
            <button
              className="btn btn-gold"
              style={{ minWidth: 140 }}
              onClick={() => { if (validate()) setStep((s) => s + 1); }}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn btn-gold"
              style={{ minWidth: 160 }}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Creating…' : '🚀 Create Tournament'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}