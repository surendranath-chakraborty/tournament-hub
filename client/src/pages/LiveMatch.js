import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

var ce = React.createElement;

function extractYouTubeId(url) {
    var patterns = [
        /youtu\.be\/([^?&]+)/,
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtube\.com\/embed\/([^?&]+)/,
        /youtube\.com\/live\/([^?&]+)/,
    ];
    for (var i = 0; i < patterns.length; i++) {
        var m = url.match(patterns[i]);
        if (m) return m[1];
    }
    return null;
}

function buildEmbed(url) {
    if (!url) return '';
    if (url.includes('youtube') || url.includes('youtu.be')) {
        var id = extractYouTubeId(url);
        if (id) return 'https://www.youtube.com/embed/' + id + '?rel=0&modestbranding=1';
    }
    if (url.includes('twitch.tv')) {
        var ch = url.match(/twitch\.tv\/([^/?#\s]+)/);
        if (ch) return 'https://player.twitch.tv/?channel=' + ch[1] + '&parent=' + window.location.hostname;
    }
    return url;
}

function fmtTime(d) {
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

var BLANK = {
    title: '', description: '', streamUrl: '',
    matchTitle: '', matchRound: '', team1: '', team2: '',
    score1: '', score2: '', isLive: true,
};

var S = {
    card: { background: 'var(--dark-2)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.25rem' },
    inp: { width: '100%', padding: '0.65rem 1rem', background: 'var(--dark-3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '0.9rem', outline: 'none', fontFamily: 'DM Sans, sans-serif' },
};

export default function LiveMatch() {
    var params = useParams();
    var tid = params.id;
    var navigate = useNavigate();
    var user = useAuth().user;

    var [streams, setStreams] = useState([]);
    var [active, setActive] = useState(null);
    var [loading, setLoading] = useState(true);
    var [comment, setComment] = useState('');
    var [sending, setSending] = useState(false);
    var [showForm, setShowForm] = useState(false);
    var [saving, setSaving] = useState(false);
    var [editMode, setEditMode] = useState(false);
    var [form, setForm] = useState(BLANK);
    var [tournament, setTournament] = useState(null);
    var [score1, setScore1] = useState('');
    var [score2, setScore2] = useState('');

    var isHost = user && user.role === 'host';

    // Load tournament + streams
    useEffect(function () {
        axios.get('/tournaments/' + tid)
            .then(function (r) { setTournament(r.data); })
            .catch(function () { });

        axios.get('/live/tournament/' + tid)
            .then(function (r) {
                setStreams(r.data);
                if (r.data.length > 0) {
                    setActive(r.data[0]);
                    setScore1(r.data[0].score1 || '');
                    setScore2(r.data[0].score2 || '');
                }
            })
            .catch(function () { })
            .finally(function () { setLoading(false); });
    }, [tid]);

    // Poll comments every 10s
    useEffect(function () {
        if (!active) return;
        var iv = setInterval(function () {
            axios.get('/live/' + active._id)
                .then(function (r) {
                    setActive(r.data);
                    setStreams(function (prev) {
                        return prev.map(function (s) { return s._id === r.data._id ? r.data : s; });
                    });
                })
                .catch(function () { });
        }, 10000);
        return function () { clearInterval(iv); };
    }, [active && active._id]);

    function setF(key, val) {
        setForm(function (p) {
            var n = {};
            Object.keys(p).forEach(function (k) { n[k] = p[k]; });
            n[key] = val;
            return n;
        });
    }

    function saveStream() {
        if (!form.title || !form.streamUrl) { toast.error('Title and stream URL are required'); return; }
        setSaving(true);
        var payload = {};
        Object.keys(form).forEach(function (k) { payload[k] = form[k]; });
        payload.tournamentId = tid;

        var req = (editMode && active)
            ? axios.put('/live/' + active._id, payload)
            : axios.post('/live', payload);

        req.then(function (r) {
            toast.success(editMode ? 'Stream updated!' : 'Stream added!');
            setShowForm(false);
            setEditMode(false);
            setForm(BLANK);
            if (editMode) {
                setStreams(function (prev) { return prev.map(function (s) { return s._id === r.data._id ? r.data : s; }); });
                setActive(r.data);
            } else {
                setStreams(function (prev) { return [r.data].concat(prev); });
                setActive(r.data);
                setScore1(r.data.score1 || '');
                setScore2(r.data.score2 || '');
            }
        }).catch(function (err) {
            toast.error(err.response && err.response.data ? err.response.data.message : 'Failed');
        }).finally(function () { setSaving(false); });
    }

    function deleteStream(sid) {
        if (!window.confirm('Delete this stream?')) return;
        axios.delete('/live/' + sid).then(function () {
            toast.success('Deleted');
            var rem = streams.filter(function (s) { return s._id !== sid; });
            setStreams(rem);
            setActive(rem.length > 0 ? rem[0] : null);
        }).catch(function () { toast.error('Delete failed'); });
    }

    function toggleLive(stream) {
        axios.put('/live/' + stream._id, { isLive: !stream.isLive }).then(function (r) {
            toast.success(r.data.isLive ? 'Marked LIVE!' : 'Marked offline');
            setStreams(function (prev) { return prev.map(function (s) { return s._id === r.data._id ? r.data : s; }); });
            if (active && active._id === r.data._id) setActive(r.data);
        }).catch(function () { toast.error('Failed'); });
    }

    function updateScore() {
        if (!active) return;
        axios.put('/live/' + active._id, { score1: score1, score2: score2 }).then(function (r) {
            toast.success('Score updated!');
            setActive(r.data);
            setStreams(function (prev) { return prev.map(function (s) { return s._id === r.data._id ? r.data : s; }); });
        }).catch(function () { toast.error('Failed'); });
    }

    function sendComment(e) {
        e.preventDefault();
        if (!comment.trim()) return;
        if (!user) { toast.error('Login to comment'); return; }
        setSending(true);
        axios.post('/live/' + active._id + '/comment', { text: comment.trim() })
            .then(function (r) {
                setComment('');
                setActive(function (prev) {
                    var n = {};
                    Object.keys(prev).forEach(function (k) { n[k] = prev[k]; });
                    n.comments = (prev.comments || []).concat([r.data]);
                    return n;
                });
            })
            .catch(function (err) {
                toast.error(err.response && err.response.data ? err.response.data.message : 'Failed');
            })
            .finally(function () { setSending(false); });
    }

    function delComment(cid) {
        axios.delete('/live/' + active._id + '/comment/' + cid).then(function () {
            setActive(function (prev) {
                var n = {};
                Object.keys(prev).forEach(function (k) { n[k] = prev[k]; });
                n.comments = (prev.comments || []).filter(function (c) { return c._id !== cid; });
                return n;
            });
        }).catch(function () { toast.error('Failed'); });
    }

    function openEdit(stream) {
        setForm({
            title: stream.title || '', description: stream.description || '',
            streamUrl: stream.streamUrl || '', matchTitle: stream.matchTitle || '',
            matchRound: stream.matchRound || '', team1: stream.team1 || '',
            team2: stream.team2 || '', score1: stream.score1 || '',
            score2: stream.score2 || '', isLive: stream.isLive || false,
        });
        setEditMode(true);
        setShowForm(true);
    }

    function selectStream(s) {
        axios.get('/live/' + s._id)
            .then(function (r) {
                setActive(r.data);
                setScore1(r.data.score1 || '');
                setScore2(r.data.score2 || '');
            })
            .catch(function () { setActive(s); });
    }

    var embedUrl = active ? buildEmbed(active.streamUrl) : '';

    // ── RENDER ────────────────────────────────────────────────────
    return ce('div', { style: { paddingTop: 64, minHeight: '100vh' } },

        ce('style', null, '@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}} @keyframes liveblink{0%,100%{opacity:1}50%{opacity:0.4}}'),

        // Top header bar
        ce('div', { style: { background: 'var(--dark-2)', borderBottom: '1px solid var(--border)', padding: '1.5rem' } },
            ce('div', { className: 'container' },
                ce('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' } },
                    ce('div', null,
                        ce('button', { className: 'btn btn-ghost btn-sm', onClick: function () { navigate('/tournaments/' + tid); }, style: { marginBottom: 8 } }, '← Back'),
                        ce('h1', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '2.2rem', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 10 } },
                            ce('span', { style: { color: '#E84B4B', animation: 'pulse 1.5s infinite' } }, '●'),
                            ' LIVE MATCH CENTER'
                        ),
                        tournament && ce('p', { style: { color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 2 } }, tournament.title)
                    ),
                    isHost && ce('button', {
                        className: 'btn btn-gold',
                        onClick: function () { setForm(BLANK); setEditMode(false); setShowForm(true); },
                    }, '+ Add Stream')
                )
            )
        ),

        // Main content
        loading
            ? ce('div', { className: 'loading-wrap' }, ce('div', { className: 'spinner' }), ce('p', null, 'Loading streams...'))
            : ce('div', { className: 'container', style: { padding: '2rem 1.5rem' } },

                // Empty state
                streams.length === 0 && ce('div', { className: 'empty-state' },
                    ce('div', { className: 'icon' }, '📺'),
                    ce('h3', null, 'No live streams yet'),
                    ce('p', null, isHost
                        ? 'Click "Add Stream" to paste a YouTube link and go live.'
                        : 'The host has not started a live stream yet. Check back soon!'),
                    isHost && ce('button', {
                        className: 'btn btn-gold',
                        onClick: function () { setForm(BLANK); setEditMode(false); setShowForm(true); },
                    }, '+ Add Stream')
                ),

                // Content when streams exist
                streams.length > 0 && ce('div', { style: { display: 'grid', gridTemplateColumns: streams.length > 1 ? '1fr 300px' : '1fr', gap: '1.5rem', alignItems: 'start' } },

                    // ── LEFT: main player ──
                    active && ce('div', null,

                        // Stream title row
                        ce('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: 8 } },
                            ce('div', { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
                                active.isLive
                                    ? ce('span', { style: { background: '#E84B4B', color: '#fff', padding: '3px 10px', borderRadius: 50, fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1, animation: 'liveblink 1.5s infinite' } }, '● LIVE')
                                    : ce('span', { className: 'badge badge-closed' }, 'OFFLINE'),
                                ce('h2', { style: { fontWeight: 700, fontSize: '1.1rem' } }, active.title),
                                ce('span', { style: { fontSize: '0.78rem', color: 'var(--text-muted)' } }, '👁 ' + (active.viewCount || 0) + ' views')
                            ),
                            isHost && ce('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
                                ce('button', { className: 'btn btn-outline btn-sm', onClick: function () { openEdit(active); } }, '✏️ Edit'),
                                ce('button', {
                                    className: active.isLive ? 'btn btn-danger btn-sm' : 'btn btn-outline btn-sm',
                                    style: active.isLive ? {} : { color: 'var(--green)', borderColor: 'var(--green)' },
                                    onClick: function () { toggleLive(active); },
                                }, active.isLive ? '⏹ End Live' : '▶ Go Live'),
                                ce('button', { className: 'btn btn-danger btn-sm', onClick: function () { deleteStream(active._id); } }, '🗑 Delete')
                            )
                        ),

                        // Match round + title bar
                        (active.matchRound || active.matchTitle) && ce('div', {
                            style: { background: 'var(--dark-3)', borderRadius: 10, padding: '0.6rem 1rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
                        },
                            ce('span', { style: { color: 'var(--gold)', fontWeight: 600, fontSize: '0.82rem' } }, active.matchRound),
                            ce('span', { style: { fontWeight: 600, fontSize: '0.9rem' } }, active.matchTitle)
                        ),

                        // Score board
                        (active.team1 || active.team2) && ce('div', {
                            style: { background: 'linear-gradient(135deg,var(--dark-3),var(--dark-4))', border: '1px solid var(--border-2)', borderRadius: 14, padding: '1rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' },
                        },
                            ce('div', { style: { textAlign: 'center', minWidth: 100 } },
                                ce('div', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.2rem', letterSpacing: 1 } }, active.team1 || 'Team 1'),
                                ce('div', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '3.5rem', color: 'var(--gold)', lineHeight: 1 } }, active.score1 || '—')
                            ),
                            ce('div', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.5rem', color: 'var(--text-muted)', letterSpacing: 3 } }, 'VS'),
                            ce('div', { style: { textAlign: 'center', minWidth: 100 } },
                                ce('div', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.2rem', letterSpacing: 1 } }, active.team2 || 'Team 2'),
                                ce('div', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '3.5rem', color: 'var(--gold)', lineHeight: 1 } }, active.score2 || '—')
                            ),

                            // Score inputs for host
                            isHost && ce('div', { style: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' } },
                                ce('input', { type: 'text', placeholder: 'Score 1', value: score1, onChange: function (e) { setScore1(e.target.value); }, style: { width: 64, padding: '4px 8px', background: 'var(--dark-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '0.88rem', textAlign: 'center', outline: 'none' } }),
                                ce('span', { style: { color: 'var(--text-muted)' } }, ':'),
                                ce('input', { type: 'text', placeholder: 'Score 2', value: score2, onChange: function (e) { setScore2(e.target.value); }, style: { width: 64, padding: '4px 8px', background: 'var(--dark-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '0.88rem', textAlign: 'center', outline: 'none' } }),
                                ce('button', { className: 'btn btn-gold btn-sm', onClick: updateScore }, 'Update Score')
                            )
                        ),

                        // Video player
                        ce('div', {
                            style: { position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 14, background: '#000', marginBottom: '1rem', border: '2px solid ' + (active.isLive ? '#E84B4B' : 'var(--border)'), boxShadow: active.isLive ? '0 0 24px rgba(232,75,75,0.25)' : 'none' },
                        },
                            embedUrl
                                ? ce('iframe', {
                                    src: embedUrl,
                                    style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' },
                                    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                                    allowFullScreen: true,
                                    title: active.title,
                                })
                                : ce('div', { style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: 8 } },
                                    ce('div', { style: { fontSize: '3rem' } }, '📺'),
                                    ce('p', null, 'Stream URL not recognized')
                                )
                        ),

                        // Description
                        active.description && ce('div', { style: Object.assign({}, S.card, { marginBottom: '1rem' }) },
                            ce('h3', { style: { fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' } }, '📝 About this stream'),
                            ce('p', { style: { color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 } }, active.description)
                        ),

                        // Comments
                        ce('div', { style: S.card },
                            ce('h3', { style: { fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 } },
                                '💬 Live Comments',
                                ce('span', { style: { fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 } }, '(' + (active.comments ? active.comments.length : 0) + ')')
                            ),

                            // Comment input
                            user
                                ? ce('form', { onSubmit: sendComment, style: { display: 'flex', gap: 8, marginBottom: '1rem' } },
                                    ce('input', {
                                        placeholder: 'Write a comment...',
                                        value: comment,
                                        onChange: function (e) { setComment(e.target.value); },
                                        maxLength: 300,
                                        style: Object.assign({}, S.inp, { flex: 1 }),
                                    }),
                                    ce('button', { type: 'submit', className: 'btn btn-gold btn-sm', disabled: sending }, sending ? '...' : 'Send')
                                )
                                : ce('div', { className: 'alert alert-info', style: { marginBottom: '1rem', fontSize: '0.82rem' } }, '🔒 Login to join the conversation'),

                            // Comments list
                            ce('div', { style: { maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 } },
                                active.comments && active.comments.length > 0
                                    ? active.comments.slice().reverse().map(function (c) {
                                        var myComment = user && (
                                            c.user === user._id ||
                                            (c.user && c.user._id && c.user._id === user._id)
                                        );
                                        var canDelete = myComment || (isHost && active.host && (active.host._id === user._id || active.host === user._id));
                                        return ce('div', { key: c._id, style: { display: 'flex', gap: 10, alignItems: 'flex-start' } },
                                            ce('div', { style: { width: 32, height: 32, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--dark)', flexShrink: 0 } },
                                                c.name ? c.name.charAt(0).toUpperCase() : '?'
                                            ),
                                            ce('div', { style: { flex: 1 } },
                                                ce('div', { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 } },
                                                    ce('span', { style: { fontWeight: 600, fontSize: '0.82rem' } }, c.name || 'User'),
                                                    ce('span', { style: { fontSize: '0.72rem', color: 'var(--text-dim)' } }, fmtTime(c.createdAt))
                                                ),
                                                ce('p', { style: { fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 } }, c.text)
                                            ),
                                            canDelete && ce('button', {
                                                onClick: function () { delComment(c._id); },
                                                style: { background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 4px', flexShrink: 0 },
                                            }, '✕')
                                        );
                                    })
                                    : ce('div', { style: { textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' } }, 'No comments yet. Be the first!')
                            )
                        )
                    ),

                    // ── RIGHT: stream list (only if multiple) ──
                    streams.length > 1 && ce('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' } },
                        ce('p', { style: { fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 4 } }, 'All Streams'),
                        streams.map(function (s) {
                            var isSel = active && active._id === s._id;
                            return ce('div', {
                                key: s._id,
                                onClick: function () { selectStream(s); },
                                style: {
                                    background: isSel ? 'var(--dark-3)' : 'var(--dark-2)',
                                    border: '1px solid ' + (isSel ? 'var(--gold)' : 'var(--border)'),
                                    borderRadius: 12, padding: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
                                },
                            },
                                ce('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 } },
                                    s.isLive
                                        ? ce('span', { style: { background: '#E84B4B', color: '#fff', padding: '2px 7px', borderRadius: 50, fontSize: '0.65rem', fontWeight: 700 } }, '● LIVE')
                                        : ce('span', { className: 'badge badge-closed', style: { fontSize: '0.65rem' } }, 'OFFLINE')
                                ),
                                ce('div', { style: { fontWeight: 600, fontSize: '0.88rem', marginBottom: 2 } }, s.title),
                                s.matchTitle && ce('div', { style: { fontSize: '0.78rem', color: 'var(--text-muted)' } }, s.matchTitle),
                                (s.team1 && s.team2) && ce('div', { style: { fontSize: '0.8rem', color: 'var(--gold)', marginTop: 4, fontWeight: 600 } },
                                    s.team1 + (s.score1 ? ' ' + s.score1 : '') + ' vs ' + s.team2 + (s.score2 ? ' ' + s.score2 : '')
                                )
                            );
                        })
                    )
                )
            ),

        // ── Add / Edit Stream Modal ────────────────────────────────
        showForm && ce('div', { className: 'modal-overlay', onClick: function () { setShowForm(false); } },
            ce('div', { className: 'modal', style: { maxWidth: 560 }, onClick: function (e) { e.stopPropagation(); } },
                ce('div', { className: 'modal-header' },
                    ce('h2', null, editMode ? '✏️ Edit Stream' : '📺 Add Live Stream'),
                    ce('button', { className: 'modal-close', onClick: function () { setShowForm(false); } }, '✕')
                ),

                ce('div', { className: 'form-group' },
                    ce('label', null, 'Stream Title *'),
                    ce('input', { placeholder: 'e.g. Semi Final Live', value: form.title, onChange: function (e) { setF('title', e.target.value); }, style: S.inp })
                ),

                ce('div', { className: 'form-group' },
                    ce('label', null, 'YouTube / Twitch / Stream URL *'),
                    ce('input', { placeholder: 'https://youtube.com/watch?v=... or https://youtu.be/...', value: form.streamUrl, onChange: function (e) { setF('streamUrl', e.target.value); }, style: S.inp }),
                    ce('div', { style: { fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 } }, 'Supports YouTube, Twitch, Facebook Live, or any iframe embed URL')
                ),

                ce('div', { className: 'form-row' },
                    ce('div', { className: 'form-group' },
                        ce('label', null, 'Round'),
                        ce('input', { placeholder: 'e.g. Quarter Final', value: form.matchRound, onChange: function (e) { setF('matchRound', e.target.value); }, style: S.inp })
                    ),
                    ce('div', { className: 'form-group' },
                        ce('label', null, 'Match Title'),
                        ce('input', { placeholder: 'e.g. Team A vs Team B', value: form.matchTitle, onChange: function (e) { setF('matchTitle', e.target.value); }, style: S.inp })
                    )
                ),

                ce('div', { className: 'form-row' },
                    ce('div', { className: 'form-group' },
                        ce('label', null, 'Team 1'),
                        ce('input', { placeholder: 'Team A', value: form.team1, onChange: function (e) { setF('team1', e.target.value); }, style: S.inp })
                    ),
                    ce('div', { className: 'form-group' },
                        ce('label', null, 'Team 2'),
                        ce('input', { placeholder: 'Team B', value: form.team2, onChange: function (e) { setF('team2', e.target.value); }, style: S.inp })
                    )
                ),

                ce('div', { className: 'form-group' },
                    ce('label', null, 'Description'),
                    ce('textarea', { placeholder: 'Describe the match, commentators...', value: form.description, onChange: function (e) { setF('description', e.target.value); }, rows: 3, style: Object.assign({}, S.inp, { minHeight: 80, resize: 'vertical' }) })
                ),

                ce('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' } },
                    ce('input', { type: 'checkbox', id: 'chkLive', checked: form.isLive, onChange: function (e) { setF('isLive', e.target.checked); }, style: { width: 16, height: 16, accentColor: 'var(--gold)', cursor: 'pointer' } }),
                    ce('label', { htmlFor: 'chkLive', style: { cursor: 'pointer', fontSize: '0.9rem' } }, 'Mark as LIVE right now')
                ),

                ce('div', { style: { display: 'flex', gap: '0.75rem' } },
                    ce('button', { className: 'btn btn-outline btn-full', onClick: function () { setShowForm(false); } }, 'Cancel'),
                    ce('button', { className: 'btn btn-gold btn-full', onClick: saveStream, disabled: saving }, saving ? 'Saving...' : editMode ? 'Save Changes' : 'Add Stream')
                )
            )
        )
    );
}