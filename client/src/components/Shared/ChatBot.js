import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

var ce = React.createElement;

var QUICK = [
    { label: '🏆 How to create a tournament?', text: 'How do I create a tournament as a host?' },
    { label: '🎮 How to register?', text: 'How do I register for a tournament as a player?' },
    { label: '💳 How does payment work?', text: 'How does Razorpay payment work?' },
    { label: '⏳ What is the waitlist?', text: 'How does the waitlist system work?' },
    { label: '🤖 How to use AI tools?', text: 'How do I use the AI fixture generator?' },
    { label: '📺 How to go live?', text: 'How do I add a live stream to my tournament?' },
    { label: '🔗 How to share a tournament?', text: 'How does the share tournament feature work?' },
    { label: '↩️ Can I get a refund?', text: 'How do I withdraw and get a refund?' },
];

export default function ChatBot() {
    var [open, setOpen] = useState(false);
    var [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I\'m TourneyBot 🏆\n\nI can answer any question about Tournament Hub — features, how to register, payments, AI tools, live streaming and more.\n\nWhat would you like to know?' }
    ]);
    var [input, setInput] = useState('');
    var [loading, setLoading] = useState(false);
    var [unread, setUnread] = useState(0);
    var [showQuick, setShowQuick] = useState(true);
    var bottomRef = useRef(null);
    var inputRef = useRef(null);

    // Scroll to bottom on new message
    useEffect(function () {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Focus input when opened
    useEffect(function () {
        if (open && inputRef.current) {
            setTimeout(function () { inputRef.current && inputRef.current.focus(); }, 100);
            setUnread(0);
        }
    }, [open]);

    async function sendMessage(text) {
        var msg = (text || input).trim();
        if (!msg || loading) return;

        setInput('');
        setShowQuick(false);
        setLoading(true);

        var newMessages = messages.concat([{ role: 'user', content: msg }]);
        setMessages(newMessages);

        try {
            var res = await axios.post('/ai/chat', {
                message: msg,
                messages: messages.slice(-10),
            });
            var reply = res.data.reply;
            setMessages(function (prev) { return prev.concat([{ role: 'assistant', content: reply }]); });
            if (!open) setUnread(function (n) { return n + 1; });
        } catch (err) {
            var errMsg = 'Sorry, I ran into an issue. Please try again!';
            if (err.response && err.response.data && err.response.data.message) {
                errMsg = 'Error: ' + err.response.data.message;
            }
            setMessages(function (prev) { return prev.concat([{ role: 'assistant', content: errMsg }]); });
        } finally {
            setLoading(false);
        }
    }

    function handleKey(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    function clearChat() {
        setMessages([{ role: 'assistant', content: 'Chat cleared! Ask me anything about Tournament Hub 🏆' }]);
        setShowQuick(true);
    }

    // Format message text: handle newlines and bold (**text**)
    function formatText(text) {
        var parts = text.split('\n');
        return parts.map(function (line, li) {
            var segments = line.split(/(\*\*[^*]+\*\*)/g);
            var formatted = segments.map(function (seg, si) {
                if (seg.startsWith('**') && seg.endsWith('**')) {
                    return ce('strong', { key: si }, seg.slice(2, -2));
                }
                return ce('span', { key: si }, seg);
            });
            return ce('span', { key: li },
                formatted,
                li < parts.length - 1 ? ce('br', { key: 'br' + li }) : null
            );
        });
    }

    // ── RENDER ────────────────────────────────────────────────────
    return ce('div', { style: { position: 'fixed', bottom: 24, right: 24, zIndex: 9999 } },

        // ── Chat Window ──
        open && ce('div', {
            style: {
                position: 'absolute', bottom: 72, right: 0,
                width: 360, height: 520,
                background: '#12121A',
                border: '1px solid rgba(245,184,0,0.25)',
                borderRadius: 20,
                boxShadow: '0 12px 50px rgba(0,0,0,0.6)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                animation: 'chatIn 0.2s ease',
            }
        },

            ce('style', null, `
        @keyframes chatIn { from { opacity:0; transform:scale(0.92) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes botTyping { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        .chat-msg-user { background: rgba(245,184,0,0.12); border: 1px solid rgba(245,184,0,0.2); border-radius: 16px 16px 4px 16px; padding: 10px 14px; max-width: 85%; align-self: flex-end; }
        .chat-msg-bot  { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px 16px 16px 4px; padding: 10px 14px; max-width: 90%; align-self: flex-start; }
        .chat-scroll::-webkit-scrollbar { width: 3px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(245,184,0,0.3); border-radius: 3px; }
        .quick-btn:hover { background: rgba(245,184,0,0.15) !important; border-color: rgba(245,184,0,0.4) !important; }
        .chat-input:focus { border-color: rgba(245,184,0,0.5) !important; outline: none; }
        .send-btn:hover:not(:disabled) { background: #C49200 !important; }
      `),

            // Header
            ce('div', { style: { background: 'linear-gradient(135deg,#1A1A26,#242436)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(245,184,0,0.15)', flexShrink: 0 } },
                ce('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
                    ce('div', { style: { width: 36, height: 36, borderRadius: '50%', background: '#F5B800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 } }, '🏆'),
                    ce('div', null,
                        ce('div', { style: { fontWeight: 700, fontSize: '0.92rem', color: '#F0EEE8', fontFamily: 'DM Sans, sans-serif' } }, 'TourneyBot'),
                        ce('div', { style: { fontSize: '0.72rem', color: '#22C97D', display: 'flex', alignItems: 'center', gap: 4 } },
                            ce('span', { style: { width: 6, height: 6, borderRadius: '50%', background: '#22C97D', display: 'inline-block' } }),
                            'Online · Powered by Groq AI'
                        )
                    )
                ),
                ce('div', { style: { display: 'flex', gap: 6 } },
                    ce('button', {
                        onClick: clearChat,
                        title: 'Clear chat',
                        style: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8A8A9A', cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem' },
                    }, '🗑'),
                    ce('button', {
                        onClick: function () { setOpen(false); },
                        style: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8A8A9A', cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' },
                    }, '✕')
                )
            ),

            // Messages area
            ce('div', {
                className: 'chat-scroll',
                style: { flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }
            },
                messages.map(function (m, i) {
                    var isUser = m.role === 'user';
                    return ce('div', { key: i, style: { display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 } },
                        !isUser && ce('div', { style: { width: 26, height: 26, borderRadius: '50%', background: '#F5B800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0, marginBottom: 2 } }, '🏆'),
                        ce('div', {
                            className: isUser ? 'chat-msg-user' : 'chat-msg-bot',
                        },
                            ce('div', { style: { fontSize: '0.85rem', color: isUser ? '#F5B800' : '#F0EEE8', lineHeight: 1.55, fontFamily: 'DM Sans, sans-serif' } },
                                formatText(m.content)
                            )
                        )
                    );
                }),

                // Typing indicator
                loading && ce('div', { style: { display: 'flex', alignItems: 'flex-end', gap: 6 } },
                    ce('div', { style: { width: 26, height: 26, borderRadius: '50%', background: '#F5B800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0 } }, '🏆'),
                    ce('div', { className: 'chat-msg-bot', style: { display: 'flex', gap: 4, padding: '12px 16px', alignItems: 'center' } },
                        [0, 0.15, 0.3].map(function (delay, i) {
                            return ce('div', {
                                key: i,
                                style: { width: 7, height: 7, borderRadius: '50%', background: '#F5B800', animation: 'botTyping 1.2s ' + delay + 's infinite ease-in-out' }
                            });
                        })
                    )
                ),

                // Quick suggestions (shown at start)
                showQuick && !loading && messages.length <= 1 && ce('div', { style: { marginTop: 6 } },
                    ce('div', { style: { fontSize: '0.72rem', color: '#5A5A6A', marginBottom: 8, fontFamily: 'DM Sans, sans-serif' } }, 'QUICK QUESTIONS'),
                    ce('div', { style: { display: 'flex', flexDirection: 'column', gap: 5 } },
                        QUICK.map(function (q, i) {
                            return ce('button', {
                                key: i,
                                className: 'quick-btn',
                                onClick: function () { sendMessage(q.text); },
                                style: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '7px 12px', color: '#F0EEE8', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }
                            }, q.label);
                        })
                    )
                ),

                ce('div', { ref: bottomRef })
            ),

            // Input area
            ce('div', { style: { padding: '10px 12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 } },
                ce('div', { style: { display: 'flex', gap: 8, alignItems: 'flex-end' } },
                    ce('textarea', {
                        ref: inputRef,
                        className: 'chat-input',
                        placeholder: 'Ask anything about Tournament Hub...',
                        value: input,
                        onChange: function (e) { setInput(e.target.value); },
                        onKeyDown: handleKey,
                        rows: 1,
                        maxLength: 500,
                        style: {
                            flex: 1, background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                            color: '#F0EEE8', fontSize: '0.85rem', padding: '8px 12px',
                            fontFamily: 'DM Sans, sans-serif', resize: 'none',
                            lineHeight: 1.5, maxHeight: 100, overflowY: 'auto',
                        }
                    }),
                    ce('button', {
                        className: 'send-btn',
                        onClick: function () { sendMessage(); },
                        disabled: loading || !input.trim(),
                        style: {
                            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                            background: input.trim() && !loading ? '#F5B800' : 'rgba(245,184,0,0.2)',
                            border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem', transition: 'all 0.15s',
                        }
                    }, loading ? '⏳' : '➤')
                ),
                ce('div', { style: { fontSize: '0.65rem', color: '#3A3A4A', marginTop: 6, textAlign: 'center', fontFamily: 'DM Sans, sans-serif' } },
                    'Press Enter to send · Shift+Enter for new line'
                )
            )
        ),

        // ── Floating Button ──
        ce('button', {
            onClick: function () { setOpen(function (o) { return !o; }); },
            title: 'Chat with TourneyBot',
            style: {
                width: 56, height: 56, borderRadius: '50%',
                background: open ? '#C49200' : '#F5B800',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(245,184,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: open ? '1.3rem' : '1.6rem',
                transition: 'all 0.2s ease',
                transform: open ? 'rotate(0deg)' : 'rotate(0deg)',
                position: 'relative',
            }
        },
            open ? '✕' : '🏆',

            // Unread badge
            !open && unread > 0 && ce('div', { style: { position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#E84B4B', color: '#fff', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
                unread > 9 ? '9+' : String(unread)
            ),

            // Pulse ring (when closed)
            !open && ce('div', { style: { position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid rgba(245,184,0,0.35)', animation: 'chatPulse 2s ease infinite', pointerEvents: 'none' } }),

            ce('style', null, '@keyframes chatPulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.15);opacity:0} }')
        )
    );
}