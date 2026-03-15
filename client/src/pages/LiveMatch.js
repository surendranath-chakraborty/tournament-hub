var React = require('react');
var useState = React.useState;
var useEffect = React.useEffect;
var useParams = require('react-router-dom').useParams;
var useNavigate = require('react-router-dom').useNavigate;
var axios = require('axios').default;
var toast = require('react-toastify').toast;
var useAuth = require('../context/AuthContext').useAuth;

function extractYouTubeId(url) {
    var patterns = [
        /youtu\.be\/([^?&]+)/,
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtube\.com\/embed\/([^?&]+)/,
        /youtube\.com\/live\/([^?&]+)/,
    ];
    for (var i = 0; i < patterns.length; i++) {
        var match = url.match(patterns[i]);
        if (match) return match[1];
    }
    return null;
}

function buildEmbed(url, type) {
    if (type === 'youtube' || url.includes('youtube') || url.includes('youtu.be')) {
        var id = extractYouTubeId(url);
        if (id) return 'https://www.youtube.com/embed/' + id + '?rel=0&modestbranding=1';
    }
    if (url.includes('twitch.tv')) {
        var ch = url.match(/twitch\.tv\/([^/?\s]+)/);
        if (ch) return 'https://player.twitch.tv/?channel=' + ch[1] + '&parent=' + window.location.hostname;
    }
    return url;
}

function fmtTime(d) {
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

var CARD = {
    background: 'var(--dark-2)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '1.25rem',
};

module.exports = function LiveMatch() {
    var params = useParams();
    var tournamentId = params.id;
    var navigate = useNavigate();
    var auth = useAuth();
    var user = auth.user;

    var _streams = useState([]); var streams = _streams[0]; var setStreams = _streams[1];
    var _active = useState(null); var active = _active[0]; var setActive = _active[1];
    var _loading = useState(true); var loading = _loading[0]; var setLoading = _loading[1];
    var _comment = useState(''); var comment = _comment[0]; var setComment = _comment[1];
    var _sending = useState(false); var sending = _sending[0]; var setSending = _sending[1];
    var _showForm = useState(false); var showForm = _showForm[0]; var setShowForm = _showForm[1];
    var _saving = useState(false); var saving = _saving[0]; var setSaving = _saving[1];
    var _editMode = useState(false); var editMode = _editMode[0]; var setEditMode = _editMode[1];
    var _tournament = useState(null); var tournament = _tournament[0]; var setTournament = _tournament[1];

    var BLANK_FORM = { title: '', description: '', streamUrl: '', matchTitle: '', matchRound: '', team1: '', team2: '', score1: '', score2: '', isLive: true };
    var _form = useState(BLANK_FORM); var form = _form[0]; var setForm = _form[1];

    var isHost = user && user.role === 'host';

    useEffect(function () {
        axios.get('/tournaments/' + tournamentId).then(function (r) { setTournament(r.data); }).catch(function () { });
        axios.get('/live/tournament/' + tournamentId).then(function (r) {
            setStreams(r.data);
            if (r.data.length > 0) setActive(r.data[0]);
        }).catch(function () { }).finally(function () { setLoading(false); });
    }, [tournamentId]);

    // Poll for comment updates every 10s when a stream is active
    useEffect(function () {
        if (!active) return;
        var interval = setInterval(function () {
            axios.get('/live/' + active._id).then(function (r) {
                setActive(r.data);
                setStreams(function (prev) { return prev.map(function (s) { return s._id === r.data._id ? r.data : s; }); });
            }).catch(function () { });
        }, 10000);
        return function () { clearInterval(interval); };
    }, [active]);

    function handleSaveStream() {
        if (!form.title || !form.streamUrl) { toast.error('Title and stream URL are required'); return; }
        setSaving(true);
        var payload = Object.assign({}, form, { tournamentId: tournamentId });
        var req = editMode && active
            ? axios.put('/live/' + active._id, payload)
            : axios.post('/live', payload);

        req.then(function (r) {
            toast.success(editMode ? 'Stream updated!' : 'Stream added!');
            setShowForm(false);
            setEditMode(false);
            setForm(BLANK_FORM);
            if (editMode) {
                setStreams(function (prev) { return prev.map(function (s) { return s._id === r.data._id ? r.data : s; }); });
                setActive(r.data);
            } else {
                setStreams(function (prev) { return [r.data].concat(prev); });
                setActive(r.data);
            }
        }).catch(function (err) {
            toast.error(err.response && err.response.data && err.response.data.message ? err.response.data.message : 'Failed');
        }).finally(function () { setSaving(false); });
    }

    function handleDeleteStream(streamId) {
        if (!window.confirm('Delete this stream?')) return;
        axios.delete('/live/' + streamId).then(function () {
            toast.success('Stream deleted');
            var remaining = streams.filter(function (s) { return s._id !== streamId; });
            setStreams(remaining);
            setActive(remaining.length > 0 ? remaining[0] : null);
        }).catch(function () { toast.error('Delete failed'); });
    }

    function handleToggleLive(stream) {
        axios.put('/live/' + stream._id, { isLive: !stream.isLive }).then(function (r) {
            toast.success(r.data.isLive ? 'Stream marked LIVE!' : 'Stream marked offline');
            setStreams(function (prev) { return prev.map(function (s) { return s._id === r.data._id ? r.data : s; }); });
            if (active && active._id === r.data._id) setActive(r.data);
        }).catch(function () { toast.error('Update failed'); });
    }

    function handleUpdateScore() {
        if (!active) return;
        axios.put('/live/' + active._id, { score1: active.score1, score2: active.score2 }).then(function (r) {
            toast.success('Score updated!');
            setActive(r.data);
            setStreams(function (prev) { return prev.map(function (s) { return s._id === r.data._id ? r.data : s; }); });
        }).catch(function () { toast.error('Update failed'); });
    }

    function handleComment(e) {
        e.preventDefault();
        if (!comment.trim()) return;
        if (!user) { toast.error('Login to comment'); return; }
        setSending(true);
        axios.post('/live/' + active._id + '/comment', { text: comment.trim() }).then(function (r) {
            setComment('');
            setActive(function (prev) {
                return Object.assign({}, prev, { comments: prev.comments.concat([r.data]) });
            });
        }).catch(function (err) {
            toast.error(err.response && err.response.data && err.response.data.message ? err.response.data.message : 'Failed');
        }).finally(function () { setSending(false); });
    }

    function handleDeleteComment(commentId) {
        axios.delete('/live/' + active._id + '/comment/' + commentId).then(function () {
            setActive(function (prev) {
                return Object.assign({}, prev, { comments: prev.comments.filter(function (c) { return c._id !== commentId; }) });
            });
        }).catch(function () { toast.error('Delete failed'); });
    }

    function openEditForm(stream) {
        setForm({
            title: stream.title, description: stream.description, streamUrl: stream.streamUrl,
            matchTitle: stream.matchTitle, matchRound: stream.matchRound,
            team1: stream.team1, team2: stream.team2,
            score1: stream.score1, score2: stream.score2, isLive: stream.isLive,
        });
        setEditMode(true);
        setShowForm(true);
    }

    var embedUrl = active ? buildEmbed(active.streamUrl, active.streamType) : '';

    // ── RENDER ──────────────────────────────────────────────────
    return React.createElement('div', { style: { paddingTop: 64, minHeight: '100vh', background: 'var(--dark)' } },

        // Header
        React.createElement('div', { style: { background: 'var(--dark-2)', borderBottom: '1px solid var(--border)', padding: '1.5rem' } },
            React.createElement('div', { className: 'container' },
                React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' } },
                    React.createElement('div', null,
                        React.createElement('button', { className: 'btn btn-ghost btn-sm', onClick: function () { navigate('/tournaments/' + tournamentId); }, style: { marginBottom: 8 } }, '← Back'),
                        React.createElement('h1', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '2.2rem', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 12 } },
                            React.createElement('span', { style: { color: '#E84B4B', fontSize: '1rem', animation: 'pulse 1.5s infinite' } }, '●'),
                            ' LIVE MATCH CENTER'
                        ),
                        tournament && React.createElement('p', { style: { color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 2 } }, tournament.title)
                    ),
                    isHost && React.createElement('button', {
                        className: 'btn btn-gold',
                        onClick: function () { setForm(BLANK_FORM); setEditMode(false); setShowForm(true); },
                    }, '+ Add Stream')
                )
            )
        ),

        // Pulse animation style
        React.createElement('style', null, '@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} } @keyframes liveblink { 0%,100%{opacity:1} 50%{opacity:0.5} }'),

        loading
            ? React.createElement('div', { className: 'loading-wrap' }, React.createElement('div', { className: 'spinner' }), React.createElement('p', null, 'Loading streams...'))
            : React.createElement('div', { className: 'container', style: { padding: '2rem 1.5rem' } },

                streams.length === 0
                    ? React.createElement('div', { className: 'empty-state' },
                        React.createElement('div', { className: 'icon' }, '📺'),
                        React.createElement('h3', null, 'No live streams yet'),
                        React.createElement('p', null, isHost ? 'Add a YouTube or stream link to broadcast your match live.' : 'The host has not added a live stream yet. Check back later.'),
                        isHost && React.createElement('button', { className: 'btn btn-gold', onClick: function () { setForm(BLANK_FORM); setEditMode(false); setShowForm(true); } }, '+ Add Stream')
                    )
                    : React.createElement('div', { style: { display: 'grid', gridTemplateColumns: streams.length > 1 ? '1fr 320px' : '1fr', gap: '1.5rem', alignItems: 'start' } },

                        // Left: Player + info
                        React.createElement('div', null,

                            // Active stream
                            active && React.createElement('div', null,

                                // Live badge + title
                                React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: 8 } },
                                    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
                                        active.isLive && React.createElement('span', { style: { background: '#E84B4B', color: '#fff', padding: '3px 10px', borderRadius: 50, fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1, animation: 'liveblink 1.5s infinite' } }, '● LIVE'),
                                        !active.isLive && React.createElement('span', { className: 'badge badge-closed' }, 'OFFLINE'),
                                        React.createElement('h2', { style: { fontWeight: 700, fontSize: '1.1rem' } }, active.title)
                                    ),
                                    React.createElement('div', { style: { display: 'flex', gap: 6 } },
                                        React.createElement('span', { style: { fontSize: '0.78rem', color: 'var(--text-muted)' } }, '👁 ' + active.viewCount + ' views'),
                                        isHost && React.createElement('button', { className: 'btn btn-outline btn-sm', onClick: function () { openEditForm(active); } }, '✏️ Edit'),
                                        isHost && React.createElement('button', {
                                            className: active.isLive ? 'btn btn-danger btn-sm' : 'btn btn-outline btn-sm',
                                            onClick: function () { handleToggleLive(active); },
                                            style: { color: active.isLive ? undefined : 'var(--green)', borderColor: active.isLive ? undefined : 'var(--green)' },
                                        }, active.isLive ? '⏹ End Live' : '▶ Go Live'),
                                        isHost && React.createElement('button', { className: 'btn btn-danger btn-sm', onClick: function () { handleDeleteStream(active._id); } }, '🗑')
                                    )
                                ),

                                // Match title bar
                                (active.matchTitle || active.matchRound) && React.createElement('div', { style: { background: 'var(--dark-3)', borderRadius: 10, padding: '0.6rem 1rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 } },
                                    React.createElement('span', { style: { fontSize: '0.82rem', color: 'var(--gold)', fontWeight: 600 } }, active.matchRound),
                                    React.createElement('span', { style: { fontSize: '0.9rem', fontWeight: 600 } }, active.matchTitle)
                                ),

                                // Score board
                                (active.team1 || active.team2) && React.createElement('div', { style: { background: 'linear-gradient(135deg, var(--dark-3), var(--dark-4))', borderRadius: 14, padding: '1rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', border: '1px solid var(--border-2)', flexWrap: 'wrap' } },
                                    React.createElement('div', { style: { textAlign: 'center', flex: 1 } },
                                        React.createElement('div', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.3rem', letterSpacing: 1, color: 'var(--text)' } }, active.team1 || 'Team 1'),
                                        active.score1 !== '' && React.createElement('div', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '3rem', color: 'var(--gold)', lineHeight: 1 } }, active.score1)
                                    ),
                                    React.createElement('div', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.5rem', color: 'var(--text-muted)', letterSpacing: 2 } }, 'VS'),
                                    React.createElement('div', { style: { textAlign: 'center', flex: 1 } },
                                        React.createElement('div', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.3rem', letterSpacing: 1, color: 'var(--text)' } }, active.team2 || 'Team 2'),
                                        active.score2 !== '' && React.createElement('div', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '3rem', color: 'var(--gold)', lineHeight: 1 } }, active.score2)
                                    ),

                                    // Live score update for host
                                    isHost && React.createElement('div', { style: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' } },
                                        React.createElement('input', { type: 'text', placeholder: 'Score 1', value: active.score1 || '', onChange: function (e) { setActive(function (p) { return Object.assign({}, p, { score1: e.target.value }); }); }, style: { width: 60, padding: '4px 8px', background: 'var(--dark-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '0.85rem', textAlign: 'center' } }),
                                        React.createElement('span', { style: { color: 'var(--text-muted)' } }, ':'),
                                        React.createElement('input', { type: 'text', placeholder: 'Score 2', value: active.score2 || '', onChange: function (e) { setActive(function (p) { return Object.assign({}, p, { score2: e.target.value }); }); }, style: { width: 60, padding: '4px 8px', background: 'var(--dark-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '0.85rem', textAlign: 'center' } }),
                                        React.createElement('button', { className: 'btn btn-gold btn-sm', onClick: handleUpdateScore }, 'Update')
                                    )
                                ),

                                // Video embed
                                React.createElement('div', { style: { position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 14, overflow: 'hidden', background: '#000', marginBottom: '1rem', border: '2px solid ' + (active.isLive ? '#E84B4B' : 'var(--border)'), boxShadow: active.isLive ? '0 0 20px rgba(232,75,75,0.2)' : 'none' } },
                                    React.createElement('iframe', {
                                        src: embedUrl,
                                        style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' },
                                        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                                        allowFullScreen: true,
                                        title: active.title,
                                    })
                                ),

                                // Description
                                active.description && React.createElement('div', { style: Object.assign({}, CARD, { marginBottom: '1rem' }) },
                                    React.createElement('h3', { style: { fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' } }, '📝 About this stream'),
                                    React.createElement('p', { style: { color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7 } }, active.description)
                                ),

                                // Comment section
                                React.createElement('div', { style: CARD },
                                    React.createElement('h3', { style: { fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 } },
                                        '💬 Live Comments',
                                        React.createElement('span', { style: { fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 } }, '(' + (active.comments ? active.comments.length : 0) + ')')
                                    ),

                                    // Comment input
                                    user
                                        ? React.createElement('form', { onSubmit: handleComment, style: { display: 'flex', gap: 8, marginBottom: '1rem' } },
                                            React.createElement('input', {
                                                placeholder: 'Write a comment...',
                                                value: comment,
                                                onChange: function (e) { setComment(e.target.value); },
                                                maxLength: 300,
                                                style: { flex: 1, padding: '0.55rem 0.9rem', background: 'var(--dark-3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '0.88rem', outline: 'none' },
                                            }),
                                            React.createElement('button', { type: 'submit', className: 'btn btn-gold btn-sm', disabled: sending }, sending ? '...' : 'Send')
                                        )
                                        : React.createElement('div', { className: 'alert alert-info', style: { marginBottom: '1rem', fontSize: '0.82rem' } }, '🔒 Login to join the conversation'),

                                    // Comments list
                                    React.createElement('div', { style: { maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 } },
                                        active.comments && active.comments.length > 0
                                            ? active.comments.slice().reverse().map(function (c) {
                                                return React.createElement('div', { key: c._id, style: { display: 'flex', gap: 10, alignItems: 'flex-start' } },
                                                    React.createElement('div', { style: { width: 30, height: 30, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--dark)', flexShrink: 0 } },
                                                        c.name ? c.name.charAt(0).toUpperCase() : '?'
                                                    ),
                                                    React.createElement('div', { style: { flex: 1 } },
                                                        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 } },
                                                            React.createElement('span', { style: { fontWeight: 600, fontSize: '0.82rem' } }, c.name),
                                                            React.createElement('span', { style: { fontSize: '0.72rem', color: 'var(--text-dim)' } }, fmtTime(c.createdAt))
                                                        ),
                                                        React.createElement('p', { style: { fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 } }, c.text)
                                                    ),
                                                    (user && (user._id === (c.user && c.user._id ? c.user._id : c.user) || (isHost && active.host && active.host._id === user._id))) &&
                                                    React.createElement('button', { onClick: function () { handleDeleteComment(c._id); }, style: { background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 4px' } }, '✕')
                                                );
                                            })
                                            : React.createElement('div', { style: { textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' } }, 'No comments yet. Be the first!')
                                    )
                                )
                            )
                        ),

                        // Right: Stream list (only if multiple)
                        streams.length > 1 && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' } },
                            React.createElement('h3', { style: { fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 } }, 'All Streams'),
                            streams.map(function (s) {
                                var isActive = active && active._id === s._id;
                                return React.createElement('div', {
                                    key: s._id,
                                    onClick: function () {
                                        axios.get('/live/' + s._id).then(function (r) { setActive(r.data); }).catch(function () { setActive(s); });
                                    },
                                    style: {
                                        background: isActive ? 'var(--dark-3)' : 'var(--dark-2)',
                                        border: '1px solid ' + (isActive ? 'var(--gold)' : 'var(--border)'),
                                        borderRadius: 12, padding: '0.85rem',
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    },
                                },
                                    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 } },
                                        s.isLive && React.createElement('span', { style: { background: '#E84B4B', color: '#fff', padding: '2px 7px', borderRadius: 50, fontSize: '0.65rem', fontWeight: 700 } }, '● LIVE'),
                                        !s.isLive && React.createElement('span', { className: 'badge badge-closed', style: { fontSize: '0.65rem' } }, 'OFFLINE'),
                                        React.createElement('span', { style: { fontSize: '0.72rem', color: 'var(--text-muted)' } }, fmtDate(s.createdAt))
                                    ),
                                    React.createElement('div', { style: { fontWeight: 600, fontSize: '0.88rem', marginBottom: 2 } }, s.title),
                                    s.matchTitle && React.createElement('div', { style: { fontSize: '0.78rem', color: 'var(--text-muted)' } }, s.matchTitle),
                                    (s.team1 && s.team2) && React.createElement('div', { style: { fontSize: '0.8rem', color: 'var(--gold)', marginTop: 4, fontWeight: 600 } },
                                        s.team1 + (s.score1 ? ' ' + s.score1 : '') + ' vs ' + s.team2 + (s.score2 ? ' ' + s.score2 : '')
                                    )
                                );
                            })
                        )
                    )
            ),

        // ── Add/Edit Stream Modal ──────────────────────────────────
        showForm && React.createElement('div', { className: 'modal-overlay', onClick: function () { setShowForm(false); } },
            React.createElement('div', { className: 'modal', style: { maxWidth: 560 }, onClick: function (e) { e.stopPropagation(); } },
                React.createElement('div', { className: 'modal-header' },
                    React.createElement('h2', null, editMode ? '✏️ Edit Stream' : '📺 Add Live Stream'),
                    React.createElement('button', { className: 'modal-close', onClick: function () { setShowForm(false); } }, '✕')
                ),

                React.createElement('div', { className: 'form-group' },
                    React.createElement('label', null, 'Stream Title *'),
                    React.createElement('input', { placeholder: 'e.g. Semi Final Live Stream', value: form.title, onChange: function (e) { setForm(function (p) { return Object.assign({}, p, { title: e.target.value }); }); } })
                ),

                React.createElement('div', { className: 'form-group' },
                    React.createElement('label', null, 'YouTube / Stream URL *'),
                    React.createElement('input', { placeholder: 'https://youtube.com/watch?v=... or https://youtu.be/...', value: form.streamUrl, onChange: function (e) { setForm(function (p) { return Object.assign({}, p, { streamUrl: e.target.value }); }); } }),
                    React.createElement('div', { style: { fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 } }, 'Supports: YouTube, Twitch, Facebook Live, or any iframe-embeddable URL')
                ),

                React.createElement('div', { className: 'form-row' },
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', null, 'Match / Round'),
                        React.createElement('input', { placeholder: 'e.g. Quarter Final', value: form.matchRound, onChange: function (e) { setForm(function (p) { return Object.assign({}, p, { matchRound: e.target.value }); }); } })
                    ),
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', null, 'Match Title'),
                        React.createElement('input', { placeholder: 'e.g. Team A vs Team B', value: form.matchTitle, onChange: function (e) { setForm(function (p) { return Object.assign({}, p, { matchTitle: e.target.value }); }); } })
                    )
                ),

                React.createElement('div', { className: 'form-row' },
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', null, 'Team 1 Name'),
                        React.createElement('input', { placeholder: 'Team A', value: form.team1, onChange: function (e) { setForm(function (p) { return Object.assign({}, p, { team1: e.target.value }); }); } })
                    ),
                    React.createElement('div', { className: 'form-group' },
                        React.createElement('label', null, 'Team 2 Name'),
                        React.createElement('input', { placeholder: 'Team B', value: form.team2, onChange: function (e) { setForm(function (p) { return Object.assign({}, p, { team2: e.target.value }); }); } })
                    )
                ),

                React.createElement('div', { className: 'form-group' },
                    React.createElement('label', null, 'Description'),
                    React.createElement('textarea', { placeholder: 'Describe the match, commentators, context...', value: form.description, onChange: function (e) { setForm(function (p) { return Object.assign({}, p, { description: e.target.value }); }) }, rows: 3 })
                ),

                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' } },
                    React.createElement('input', { type: 'checkbox', id: 'isLive', checked: form.isLive, onChange: function (e) { setForm(function (p) { return Object.assign({}, p, { isLive: e.target.checked }); }); }, style: { width: 16, height: 16, accentColor: 'var(--gold)' } }),
                    React.createElement('label', { htmlFor: 'isLive', style: { color: 'var(--text)', fontSize: '0.9rem', cursor: 'pointer' } }, 'Mark as LIVE right now')
                ),

                React.createElement('div', { style: { display: 'flex', gap: '0.75rem' } },
                    React.createElement('button', { className: 'btn btn-outline btn-full', onClick: function () { setShowForm(false); } }, 'Cancel'),
                    React.createElement('button', { className: 'btn btn-gold btn-full', onClick: handleSaveStream, disabled: saving }, saving ? 'Saving...' : editMode ? 'Save Changes' : 'Add Stream')
                )
            )
        )
    );
};