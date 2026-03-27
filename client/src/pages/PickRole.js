import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

var ce = React.createElement;

export default function PickRole() {
    var { googleAuthWithRole } = useAuth();
    var navigate = useNavigate();
    var [loading, setLoading] = useState(false);

    async function pick(role) {
        setLoading(true);
        try {
            var result = await googleAuthWithRole(role);
            toast.success('Welcome, ' + result.name + '! 🏆');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Failed. Please try signing in again.');
            navigate('/login');
        } finally {
            setLoading(false);
        }
    }

    return ce('div', {
        style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }
    },
        ce('div', { style: { width: '100%', maxWidth: 420, textAlign: 'center' } },

            ce('div', { style: { fontSize: '3rem', marginBottom: '1rem' } }, '👋'),
            ce('h1', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '2rem', color: '#F5B800', marginBottom: '0.5rem', letterSpacing: 2 } }, 'ONE QUICK STEP'),
            ce('p', { style: { color: 'var(--text-muted)', marginBottom: '2rem' } }, 'How will you use Tournament Hub?'),

            ce('div', { style: { display: 'flex', gap: '1rem' } },
                ce('button', {
                    onClick: function () { pick('player'); },
                    disabled: loading,
                    style: { flex: 1, padding: '1.5rem 1rem', background: 'rgba(75,158,232,0.1)', border: '2px solid #4B9EE8', borderRadius: 16, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }
                },
                    ce('div', { style: { fontSize: '2.5rem', marginBottom: 8 } }, '🎮'),
                    ce('div', { style: { fontWeight: 700, color: '#4B9EE8', fontSize: '1.1rem', marginBottom: 4 } }, 'Player'),
                    ce('div', { style: { fontSize: '0.8rem', color: 'var(--text-muted)' } }, 'Join & compete in tournaments')
                ),
                ce('button', {
                    onClick: function () { pick('host'); },
                    disabled: loading,
                    style: { flex: 1, padding: '1.5rem 1rem', background: 'rgba(245,184,0,0.1)', border: '2px solid #F5B800', borderRadius: 16, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }
                },
                    ce('div', { style: { fontSize: '2.5rem', marginBottom: 8 } }, '🏆'),
                    ce('div', { style: { fontWeight: 700, color: '#F5B800', fontSize: '1.1rem', marginBottom: 4 } }, 'Host'),
                    ce('div', { style: { fontSize: '0.8rem', color: 'var(--text-muted)' } }, 'Create & manage tournaments')
                )
            ),

            loading && ce('p', { style: { marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' } }, 'Setting up your account...')
        )
    );
}