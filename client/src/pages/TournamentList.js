import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import TournamentCard from '../components/Shared/TournamentCard';

const SPORTS = ['Cricket','Football','Basketball','Volleyball','Badminton','Tennis','Kabaddi','Chess','Table Tennis','Swimming','Athletics','Boxing'];
const CITIES = ['Mumbai','Delhi','Bangalore','Chennai','Kolkata','Hyderabad','Pune','Ahmedabad','Jaipur','Bardhaman','Patna','Lucknow','Bhopal','Nagpur','Indore'];

export default function TournamentList() {
  const [tournaments, setTournaments] = useState([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [filters,     setFilters]     = useState({ sport: '', city: '', status: '', type: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await axios.get('/tournaments', { params });
      setTournaments(data.tournaments);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch {
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onFilter = (e) => {
    setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const clearFilters = () => { setFilters({ sport: '', city: '', status: '', type: '' }); setPage(1); };
  const hasFilters   = Object.values(filters).some(Boolean);

  return (
    <div style={{ paddingTop: 64 }}>
      <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="page-h1">Browse Tournaments</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            {total} tournament{total !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Filter bar */}
        <div style={{
          display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
          background: 'var(--dark-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', padding: '1rem 1.25rem',
          marginBottom: '2rem', alignItems: 'flex-end',
        }}>
          {[
            { name: 'sport',  label: 'Sport',  opts: SPORTS.map((s) => [s.toLowerCase(), s]) },
            { name: 'city',   label: 'City',   opts: CITIES.map((c) => [c, c]) },
            {
              name: 'status', label: 'Status',
              opts: [['upcoming','Upcoming'],['ongoing','Ongoing'],['full','Full']],
            },
            {
              name: 'type',   label: 'Type',
              opts: [['team','Team'],['solo','Solo']],
            },
          ].map(({ name, label, opts }) => (
            <div key={name} className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 130 }}>
              <label>{label}</label>
              <select name={name} value={filters[name]} onChange={onFilter}>
                <option value="">All {label}s</option>
                {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
          {hasFilters && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={clearFilters}
              style={{ alignSelf: 'flex-end', marginBottom: '0.05rem' }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /><p>Loading tournaments…</p></div>
        ) : tournaments.length > 0 ? (
          <>
            <div className="grid-3">
              {tournaments.map((item) => <TournamentCard key={item._id} t={item} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`btn btn-sm ${page === p ? 'btn-gold' : 'btn-outline'}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button className="btn btn-outline btn-sm" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <h3>No tournaments found</h3>
            <p>{hasFilters ? 'Try adjusting your filters.' : 'No tournaments available yet.'}</p>
            {hasFilters && <button className="btn btn-outline" onClick={clearFilters}>Clear Filters</button>}
          </div>
        )}
      </div>
    </div>
  );
}
