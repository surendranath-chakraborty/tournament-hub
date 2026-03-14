import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function HostRegistrations() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [regs,       setRegs]       = useState([]);
  const [filter,     setFilter]     = useState('all');
  const [loading,    setLoading]    = useState(true);
  const [removing,   setRemoving]   = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get(`/tournaments/${id}`),
      axios.get(`/tournaments/${id}/registrations`),
    ])
      .then(([t, r]) => { setTournament(t.data); setRegs(r.data); })
      .catch(() => { toast.error('Access denied or tournament not found'); navigate('/dashboard'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleRemove = async (regId) => {
    const note = window.prompt('Reason for removal (optional):');
    if (note === null) return; // user cancelled
    setRemoving(regId);
    try {
      await axios.delete(`/tournaments/${id}/registrations/${regId}`, { data: { note } });
      toast.success('Registration removed');
      setRegs((prev) =>
        prev.map((r) => r._id === regId ? { ...r, status: 'removed', removedByHost: true } : r)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    } finally {
      setRemoving(null);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(tournament.title, 14, 18);
    doc.setFontSize(10);
    doc.text(`Sport: ${tournament.sport}  |  Type: ${tournament.type}  |  City: ${tournament.location?.city}`, 14, 28);
    doc.text(`Date: ${new Date(tournament.startDate).toLocaleDateString('en-IN')}  |  Total: ${filtered.length}`, 14, 35);

    autoTable(doc, {
      startY: 42,
      head: [['#', 'Name', 'Team', 'Players', 'Status', 'Payment', 'Date']],
      body: filtered.map((r, i) => [
        i + 1,
        r.user?.name || '—',
        r.teamName   || '—',
        r.players?.length || 1,
        r.status,
        r.paymentStatus,
        new Date(r.createdAt).toLocaleDateString('en-IN'),
      ]),
      styles:     { fontSize: 9 },
      headStyles: { fillColor: [245, 184, 0], textColor: [0, 0, 0] },
    });

    doc.save(`${tournament.title.replace(/\s+/g, '_')}_registrations.pdf`);
    toast.success('PDF downloaded!');
  };

  const exportExcel = () => {
    const rows = filtered.map((r, i) => ({
      '#': i + 1,
      'Registrant':  r.user?.name  || '—',
      'Email':       r.user?.email || '—',
      'Phone':       r.user?.phone || '—',
      'Team Name':   r.teamName    || '—',
      'No. Players': r.players?.length || 1,
      'Status':      r.status,
      'Payment':     r.paymentStatus,
      'Amount Paid': r.amountPaid,
      'Registered':  new Date(r.createdAt).toLocaleDateString('en-IN'),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registrations');
    XLSX.writeFile(wb, `${tournament.title.replace(/\s+/g, '_')}_registrations.xlsx`);
    toast.success('Excel downloaded!');
  };

  const filtered = regs.filter((r) => filter === 'all' || r.status === filter);

  const countOf = (status) => regs.filter((r) => r.status === status).length;

  if (loading) {
    return (
      <div style={{ paddingTop: 64 }}>
        <div className="loading-wrap"><div className="spinner" /><p>Loading registrations…</p></div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 64 }}>
      <div className="container" style={{ padding: '2.5rem 1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/tournaments/${id}`)} style={{ marginBottom: '0.5rem' }}>
              ← Back to Tournament
            </button>
            <h1 className="page-h1">Registrations</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{tournament?.title}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={exportExcel}>📊 Excel</button>
            <button className="btn btn-outline btn-sm" onClick={exportPDF}>📄 PDF</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          {[
            { lbl: 'Total',       val: regs.length },
            { lbl: 'Confirmed',   val: countOf('confirmed'),  color: 'var(--green)' },
            { lbl: 'Waitlisted',  val: countOf('waitlisted'), color: 'var(--orange)' },
            {
              lbl: 'Revenue',
              val: `₹${regs.filter((r) => r.paymentStatus === 'paid').reduce((s, r) => s + r.amountPaid, 0).toLocaleString()}`,
              color: 'var(--gold)',
            },
          ].map((s) => (
            <div key={s.lbl} className="stat-card">
              <div className="stat-label">{s.lbl}</div>
              <div className="stat-value" style={{ color: s.color || 'var(--text)' }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="tabs">
          {['all', 'confirmed', 'waitlisted', 'withdrawn', 'removed'].map((f) => (
            <button
              key={f}
              className={`tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}{' '}
              ({f === 'all' ? regs.length : countOf(f)})
            </button>
          ))}
        </div>

        {/* Table */}
        {filtered.length > 0 ? (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Registrant</th>
                    <th>Team / Players</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r._id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{r.user?.name || '—'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.user?.email}</div>
                        {r.user?.phone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.user.phone}</div>
                        )}
                      </td>
                      <td>
                        {r.teamName && <div style={{ fontWeight: 500, marginBottom: 3 }}>{r.teamName}</div>}
                        {r.players?.map((p, pi) => (
                          <div key={pi} style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>
                            {p.name}{p.phone ? ` · ${p.phone}` : ''}
                          </div>
                        ))}
                      </td>
                      <td>
                        <span className={`badge ${
                          r.status === 'confirmed'  ? 'badge-green'  :
                          r.status === 'waitlisted' ? 'badge-full'   :
                          r.status === 'withdrawn'  ? 'badge-closed' : 'badge-red'
                        }`}>{r.status}</span>
                        {r.waitlistPosition && (
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 3 }}>
                            #{r.waitlistPosition}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${r.paymentStatus === 'paid' ? 'badge-green' : 'badge-full'}`}>
                          {r.paymentStatus}
                        </span>
                        {r.amountPaid > 0 && (
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 3 }}>
                            ₹{r.amountPaid}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        {!['withdrawn', 'removed'].includes(r.status) && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemove(r._id)}
                            disabled={removing === r._id}
                          >
                            {removing === r._id ? '…' : 'Remove'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon">📋</div>
            <h3>No registrations found</h3>
            <p>{filter !== 'all' ? `No ${filter} registrations.` : 'No one has registered yet.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
