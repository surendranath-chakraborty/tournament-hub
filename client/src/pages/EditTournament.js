import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const CITIES = ['Mumbai','Delhi','Bangalore','Chennai','Kolkata','Hyderabad','Pune','Ahmedabad','Jaipur','Surat','Bardhaman','Patna','Lucknow','Bhopal','Nagpur','Indore'];

export default function EditTournament() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [form,   setForm]   = useState(null);
  const [loading,setLoading]= useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`/tournaments/${id}`)
      .then(({ data: t }) => {
        setForm({
          title: t.title, sport: t.sport,
          description: t.description, rules: t.rules,
          type: t.type, indoorOutdoor: t.indoorOutdoor, status: t.status,
          location: { ...t.location },
          startDate:            t.startDate?.split('T')[0]            || '',
          endDate:              t.endDate?.split('T')[0]              || '',
          registrationDeadline: t.registrationDeadline?.split('T')[0] || '',
          withdrawalDeadline:   t.withdrawalDeadline?.split('T')[0]   || '',
          editDeadline:         t.editDeadline?.split('T')[0]         || '',
          maxSlots:    t.maxSlots,
          entryFee:    t.entryFee,
          prizePool:   t.prizePool   || '',
          firstPrize:  t.firstPrize  || '',
          secondPrize: t.secondPrize || '',
        });
      })
      .catch(() => { toast.error('Tournament not found'); navigate('/dashboard'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const set    = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setLoc = (k, v) => setForm((p) => ({ ...p, location: { ...p.location, [k]: v } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`/tournaments/${id}`, form);
      toast.success('Tournament updated!');
      navigate(`/tournaments/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ paddingTop: 64 }}>
        <div className="loading-wrap"><div className="spinner" /></div>
      </div>
    );
  }
  if (!form) return null;

  return (
    <div style={{ paddingTop: 64 }}>
      <div className="container" style={{ maxWidth: 720, padding: '2.5rem 1.5rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 className="page-h1">Edit Tournament</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>Update your tournament details.</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(`/tournaments/${id}`)}>← Back</button>
        </div>

        {/* Basic info */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1.25rem' }}>Basic Info</h2>
          <div className="form-group">
            <label>Title</label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                {['upcoming','ongoing','full','closed','cancelled'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Max Slots</label>
              <input type="number" value={form.maxSlots} onChange={(e) => set('maxSlots', parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Rules</label>
            <textarea rows={5} value={form.rules} onChange={(e) => set('rules', e.target.value)} />
          </div>
        </div>

        {/* Location */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1.25rem' }}>Location</h2>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <select value={form.location.city} onChange={(e) => setLoc('city', e.target.value)}>
                <option value="">Select city</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Venue</label>
              <input value={form.location.venue} onChange={(e) => setLoc('venue', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <input value={form.location.address} onChange={(e) => setLoc('address', e.target.value)} />
          </div>
        </div>

        {/* Dates */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1.25rem' }}>Dates & Deadlines</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
            </div>
          </div>
          <div className="form-row-3">
            <div className="form-group">
              <label>Registration Deadline</label>
              <input type="date" value={form.registrationDeadline} onChange={(e) => set('registrationDeadline', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Withdrawal Deadline</label>
              <input type="date" value={form.withdrawalDeadline} onChange={(e) => set('withdrawalDeadline', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Edit Deadline</label>
              <input type="date" value={form.editDeadline} onChange={(e) => set('editDeadline', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Prizes */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1.25rem' }}>Prizes</h2>
          <div className="form-group">
            <label>Prize Pool</label>
            <input value={form.prizePool} onChange={(e) => set('prizePool', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>1st Prize</label>
              <input value={form.firstPrize} onChange={(e) => set('firstPrize', e.target.value)} />
            </div>
            <div className="form-group">
              <label>2nd Prize</label>
              <input value={form.secondPrize} onChange={(e) => set('secondPrize', e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={() => navigate(`/tournaments/${id}`)}>Cancel</button>
          <button className="btn btn-gold"    onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
