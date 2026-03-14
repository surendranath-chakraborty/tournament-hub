import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const CITIES = [
  'Mumbai','Delhi','Bangalore','Chennai','Kolkata','Hyderabad','Pune',
  'Ahmedabad','Jaipur','Surat','Bardhaman','Patna','Lucknow','Bhopal',
  'Nagpur','Indore','Visakhapatnam','Bhubaneswar','Kochi','Coimbatore',
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name:            user.name    || '',
    phone:           user.phone   || '',
    city:            user.city    || '',
    password:        '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name, phone: form.phone, city: form.city };
      if (form.password) payload.password = form.password;
      const { data } = await axios.put('/auth/profile', payload);
      updateUser(data);
      toast.success('Profile updated!');
      setForm((p) => ({ ...p, password: '', confirmPassword: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  /* Build stats array for both roles — always an array so .map() works */
  const statsArr = user.role === 'player'
    ? [
        { lbl: 'Tournaments Played', val: user.tournamentsPlayed ?? 0 },
        { lbl: 'Tournaments Won',    val: user.tournamentsWon    ?? 0, color: 'var(--gold)' },
      ]
    : [
        { lbl: 'Tournaments Hosted', val: user.tournamentsHosted ?? 0 },
        { lbl: 'Total Revenue',      val: `₹${(user.totalRevenue ?? 0).toLocaleString()}`, color: 'var(--gold)' },
      ];

  return (
    <div style={{ paddingTop: 64 }}>
      <div className="container" style={{ maxWidth: 600, padding: '2.5rem 1.5rem' }}>

        <h1 className="page-h1" style={{ marginBottom: '0.3rem' }}>My Profile</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Manage your account details.</p>

        {/* Avatar card */}
        <div className="card card-gold" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%', background: '#F5B800', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 700, color: '#0A0A0F',
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.5rem', letterSpacing: 1 }}>
              {user.name}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{user.email}</div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              <span className="badge badge-gold">
                {user.role === 'host' ? '⚡ Host' : '🎮 Player'}
              </span>
              {user.city && (
                <span className="badge badge-upcoming">📍 {user.city}</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          {statsArr.map((s) => (
            <div key={s.lbl} className="stat-card">
              <div className="stat-label">{s.lbl}</div>
              <div className="stat-value" style={{ color: s.color || 'var(--text)' }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Edit form */}
        <div className="card">
          <h2 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Edit Details</h2>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" value={form.name} onChange={onChange} required />
            </div>
            <div className="form-group">
              <label>Email (cannot be changed)</label>
              <input value={user.email} disabled style={{ opacity: 0.55, cursor: 'not-allowed' }} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input name="phone" placeholder="9876543210" value={form.phone} onChange={onChange} />
              </div>
              <div className="form-group">
                <label>City</label>
                <select name="city" value={form.city} onChange={onChange}>
                  <option value="">Select city</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="divider" />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Leave password fields blank to keep your current password.
            </p>
            <div className="form-row">
              <div className="form-group">
                <label>New Password</label>
                <input
                  name="password" type="password"
                  placeholder="Min 6 characters"
                  value={form.password} onChange={onChange}
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  name="confirmPassword" type="password"
                  placeholder="Repeat password"
                  value={form.confirmPassword} onChange={onChange}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-gold" disabled={saving}>
              {saving ? 'Saving…' : '💾 Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
