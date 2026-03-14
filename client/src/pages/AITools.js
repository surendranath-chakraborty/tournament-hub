import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function AITools() {
  const [tab, setTab] = useState('fixture');

  /* Fixture state */
  const [teamInput,      setTeamInput]      = useState('');
  const [format,         setFormat]         = useState('knockout');
  const [bracket,        setBracket]        = useState(null);
  const [fixtureLoading, setFixtureLoading] = useState(false);

  /* Ground state */
  const [city,          setCity]          = useState('');
  const [sport,         setSport]         = useState('');
  const [grounds,       setGrounds]       = useState([]);
  const [groundLoading, setGroundLoading] = useState(false);

  /* ── Fixture ── */
  const generateFixture = async () => {
    const teams = teamInput.split('\n').map((t) => t.trim()).filter(Boolean);
    if (teams.length < 2) { toast.error('Enter at least 2 team names'); return; }
    setFixtureLoading(true);
    setBracket(null);
    try {
      const { data } = await axios.post('/ai/fixture', { teams, format });
      setBracket(data);
      toast.success('Fixture generated! 🤖');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI generation failed. Check your GROQ_API_KEY in .env');
    } finally {
      setFixtureLoading(false);
    }
  };

  const exportFixturePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Tournament Fixture', 14, 18);
    doc.setFontSize(10);
    doc.text(`Format: ${bracket.format}  |  Teams: ${bracket.totalTeams}`, 14, 27);
    let y = 35;
    bracket.rounds.forEach((round) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text(`Round ${round.roundNumber}: ${round.roundName}`, 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Match', 'Team 1', 'vs', 'Team 2', 'Venue', 'Date']],
        body: round.matches.map((m) => [m.matchNumber, m.team1, 'VS', m.team2, m.venue, m.date]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [245, 184, 0], textColor: [0, 0, 0] },
      });
      y = doc.lastAutoTable.finalY + 10;
    });
    doc.save('fixture.pdf');
    toast.success('PDF downloaded!');
  };

  const exportFixtureExcel = () => {
    const wb = XLSX.utils.book_new();
    bracket.rounds.forEach((round) => {
      const rows = round.matches.map((m) => ({
        'Match #': m.matchNumber,
        'Team 1':  m.team1,
        'vs':      'VS',
        'Team 2':  m.team2,
        'Venue':   m.venue,
        'Date':    m.date,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, `Round ${round.roundNumber}`);
    });
    XLSX.writeFile(wb, 'fixture.xlsx');
    toast.success('Excel downloaded!');
  };

  /* ── Grounds ── */
  const suggestGrounds = async () => {
    if (!city.trim()) { toast.error('Enter a city name'); return; }
    setGroundLoading(true);
    setGrounds([]);
    try {
      const { data } = await axios.post('/ai/grounds', { city, sport });
      setGrounds(data);
      toast.success(`Found ${data.length} venues! 🏟️`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI suggestion failed. Check your GROQ_API_KEY in .env');
    } finally {
      setGroundLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: 64 }}>
      <div className="container" style={{ padding: '2.5rem 1.5rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 className="page-h1">🤖 AI Tools</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Powered by Groq AI (free tier) — fast and smart.
          </p>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === 'fixture' ? 'active' : ''}`} onClick={() => setTab('fixture')}>
            ⚡ Fixture Generator
          </button>
          <button className={`tab ${tab === 'grounds' ? 'active' : ''}`} onClick={() => setTab('grounds')}>
            🏟️ Ground Finder
          </button>
        </div>

        {/* ── Fixture tab ──────────────────────────────────────── */}
        {tab === 'fixture' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

            {/* Input panel */}
            <div>
              <div className="card">
                <h2 style={{ fontWeight: 600, marginBottom: '1.25rem' }}>Generate Bracket</h2>

                <div className="form-group">
                  <label>Tournament Format</label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {[
                      { val: 'knockout',    label: '🥊 Knockout' },
                      { val: 'round-robin', label: '🔄 Round-Robin' },
                    ].map((f) => (
                      <button
                        key={f.val} type="button"
                        onClick={() => setFormat(f.val)}
                        style={{
                          flex: 1, padding: '0.65rem', borderRadius: 10, cursor: 'pointer',
                          border: `2px solid ${format === f.val ? '#F5B800' : 'var(--border)'}`,
                          background: format === f.val ? 'rgba(245,184,0,0.08)' : 'var(--dark-3)',
                          color: 'var(--text)', fontWeight: 500, fontSize: '0.85rem',
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Team Names (one per line)</label>
                  <textarea
                    rows={10}
                    placeholder={'Team Alpha\nTeam Beta\nTeam Gamma\nTeam Delta\n…'}
                    value={teamInput}
                    onChange={(e) => setTeamInput(e.target.value)}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {teamInput.split('\n').filter((t) => t.trim()).length} teams entered
                  </div>
                </div>

                <button className="btn btn-gold btn-full" onClick={generateFixture} disabled={fixtureLoading}>
                  {fixtureLoading ? '🤖 Generating…' : '✨ Generate Fixture'}
                </button>
              </div>
            </div>

            {/* Output panel */}
            <div>
              {fixtureLoading && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" />
                  <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>AI is generating your bracket…</p>
                </div>
              )}

              {bracket && !fixtureLoading && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontWeight: 600 }}>
                      {bracket.format === 'knockout' ? '🥊' : '🔄'} {bracket.format} – {bracket.totalTeams} teams
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-outline btn-sm" onClick={exportFixtureExcel}>📊 Excel</button>
                      <button className="btn btn-outline btn-sm" onClick={exportFixturePDF}>📄 PDF</button>
                    </div>
                  </div>

                  {bracket.rounds?.map((round) => (
                    <div key={round.roundNumber} className="card" style={{ marginBottom: '1rem' }}>
                      <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--gold)' }}>
                        Round {round.roundNumber}: {round.roundName}
                      </h3>
                      {round.matches?.map((match) => (
                        <div key={match.matchNumber} style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.65rem 0.75rem', background: 'var(--dark-3)',
                          borderRadius: 10, marginBottom: '0.5rem', flexWrap: 'wrap',
                        }}>
                          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', minWidth: 30 }}>
                            M{match.matchNumber}
                          </span>
                          <span style={{ fontWeight: 600, flex: 1, textAlign: 'right' }}>{match.team1}</span>
                          <span style={{
                            background: 'var(--dark-5)', padding: '2px 8px',
                            borderRadius: 20, fontSize: '0.78rem', color: 'var(--gold)', fontWeight: 700,
                          }}>VS</span>
                          <span style={{ fontWeight: 600, flex: 1 }}>{match.team2}</span>
                          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {match.venue}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}

              {!bracket && !fixtureLoading && (
                <div className="empty-state">
                  <div className="icon">⚡</div>
                  <h3>Bracket will appear here</h3>
                  <p>Enter team names and click Generate Fixture.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Grounds tab ──────────────────────────────────────── */}
        {tab === 'grounds' && (
          <div>
            <div className="card" style={{ marginBottom: '2rem', maxWidth: 560 }}>
              <h2 style={{ fontWeight: 600, marginBottom: '1.25rem' }}>Find Nearby Grounds</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input placeholder="e.g. Kolkata" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Sport (optional)</label>
                  <input placeholder="e.g. Cricket" value={sport} onChange={(e) => setSport(e.target.value)} />
                </div>
              </div>
              <button className="btn btn-gold" onClick={suggestGrounds} disabled={groundLoading}>
                {groundLoading ? '🤖 Searching…' : '🔍 Find Venues'}
              </button>
            </div>

            {groundLoading && (
              <div className="loading-wrap">
                <div className="spinner" />
                <p>AI is finding venues in {city}…</p>
              </div>
            )}

            {grounds.length > 0 && (
              <>
                <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>
                  🏟️ {grounds.length} Venues in {city}
                </h2>
                <div className="grid-2">
                  {grounds.map((g, i) => (
                    <div key={i} className="card card-gold">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontWeight: 600, flex: 1, marginRight: '0.5rem' }}>{g.name}</h3>
                        <span className={`badge ${g.type?.toLowerCase() === 'indoor' ? 'badge-blue' : 'badge-green'}`}>
                          {g.type}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        📍 {g.address}
                      </p>

                      {g.sports?.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                          {g.sports.map((s) => (
                            <span key={s} className="badge badge-gold" style={{ fontSize: '0.68rem' }}>{s}</span>
                          ))}
                        </div>
                      )}

                      {g.amenities?.length > 0 && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          ✅ {g.amenities.join(' · ')}
                        </div>
                      )}

                      {g.estimatedCostPerHour && (
                        <div style={{ fontWeight: 600, color: 'var(--gold)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                          💰 {g.estimatedCostPerHour} / hr
                        </div>
                      )}

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(g.mapQuery || `${g.name} ${city}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                      >
                        🗺️ View on Maps
                      </a>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!groundLoading && grounds.length === 0 && (
              <div className="empty-state">
                <div className="icon">🏟️</div>
                <h3>No venues yet</h3>
                <p>Enter a city and click Find Venues to get AI-powered suggestions.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
