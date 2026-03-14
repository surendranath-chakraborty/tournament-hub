import React, { useState } from 'react';
import { toast } from 'react-toastify';

export default function ShareButton({ tournament, variant }) {
    var isIcon = variant === 'icon';
    var showFull = variant !== 'icon';
    var defaultVariant = variant || 'full';

    var _state = useState(false);
    var showPanel = _state[0];
    var setShowPanel = _state[1];

    var link = window.location.origin + '/tournaments/' + tournament._id;

    function fmtDate(d) {
        return new Date(d).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }

    var entryText = tournament.entryFee > 0
        ? 'Rs.' + tournament.entryFee
        : 'FREE';

    var venue = tournament.location ? tournament.location.venue || '' : '';
    var city = tournament.location ? tournament.location.city || '' : '';

    var wpMessage = [
        'Tournament: ' + tournament.title,
        'Sport: ' + tournament.sport,
        'Venue: ' + venue + ', ' + city,
        'Date: ' + fmtDate(tournament.startDate),
        'Entry: ' + entryText,
        '',
        'Register here: ' + link,
    ].join('\n');

    var wpURL = 'https://wa.me/?text=' + encodeURIComponent(wpMessage);

    function copyLink() {
        navigator.clipboard.writeText(link).then(function () {
            toast.success('Link copied!');
        }).catch(function () {
            var el = document.createElement('textarea');
            el.value = link;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            toast.success('Link copied!');
        });
        setShowPanel(false);
    }

    function nativeShare() {
        if (navigator.share) {
            navigator.share({
                title: tournament.title,
                text: 'Join ' + tournament.title + ' on Tournament Hub!',
                url: link,
            }).catch(function () { });
        } else {
            copyLink();
        }
        setShowPanel(false);
    }

    var btnBase = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.6rem 0.85rem',
        borderRadius: 10,
        background: 'var(--dark-3)',
        border: '1px solid var(--border)',
        color: 'var(--text)',
        cursor: 'pointer',
        fontSize: '0.88rem',
        fontWeight: 500,
        textAlign: 'left',
        width: '100%',
    };

    if (isIcon) {
        return React.createElement(
            'button',
            {
                title: 'Share tournament',
                onClick: function (e) { e.stopPropagation(); nativeShare(); },
                style: {
                    background: 'var(--dark-4)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px 10px',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    lineHeight: 1,
                    transition: 'all 0.15s',
                },
                onMouseEnter: function (e) {
                    e.currentTarget.style.color = 'var(--gold)';
                    e.currentTarget.style.borderColor = 'var(--gold)';
                },
                onMouseLeave: function (e) {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                },
            },
            'Share'
        );
    }

    return React.createElement(
        'div',
        { style: { position: 'relative' } },

        React.createElement(
            'button',
            {
                className: 'btn btn-outline btn-sm',
                onClick: function () { setShowPanel(function (p) { return !p; }); },
            },
            'Share Tournament'
        ),

        showPanel && React.createElement(
            'div',
            null,

            React.createElement('div', {
                style: { position: 'fixed', inset: 0, zIndex: 299 },
                onClick: function () { setShowPanel(false); },
            }),

            React.createElement(
                'div',
                {
                    style: {
                        position: 'absolute',
                        top: '110%',
                        right: 0,
                        zIndex: 300,
                        background: 'var(--dark-2)',
                        border: '1px solid var(--border-2)',
                        borderRadius: 'var(--r-lg)',
                        padding: '1rem',
                        minWidth: 280,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    },
                },

                React.createElement(
                    'div',
                    { style: { fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text)' } },
                    'Share this tournament'
                ),

                React.createElement(
                    'div',
                    {
                        style: {
                            background: 'var(--dark-3)',
                            borderRadius: 8,
                            padding: '0.5rem 0.75rem',
                            marginBottom: '0.75rem',
                            fontSize: '0.73rem',
                            color: 'var(--text-muted)',
                            wordBreak: 'break-all',
                            border: '1px solid var(--border)',
                        },
                    },
                    link
                ),

                React.createElement(
                    'div',
                    { style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' } },

                    // Copy Link button
                    React.createElement(
                        'button',
                        {
                            onClick: copyLink,
                            style: btnBase,
                            onMouseEnter: function (e) { e.currentTarget.style.borderColor = 'var(--gold)'; },
                            onMouseLeave: function (e) { e.currentTarget.style.borderColor = 'var(--border)'; },
                        },
                        React.createElement('span', { style: { fontSize: '1.1rem' } }, '📋'),
                        React.createElement(
                            'div',
                            null,
                            React.createElement('div', { style: { fontWeight: 600 } }, 'Copy Link'),
                            React.createElement('div', { style: { fontSize: '0.75rem', color: 'var(--text-muted)' } }, 'Paste anywhere')
                        )
                    ),

                    // WhatsApp link
                    React.createElement(
                        'a',
                        {
                            href: wpURL,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            onClick: function () { setShowPanel(false); },
                            style: Object.assign({}, btnBase, { textDecoration: 'none' }),
                            onMouseEnter: function (e) { e.currentTarget.style.borderColor = '#25D366'; },
                            onMouseLeave: function (e) { e.currentTarget.style.borderColor = 'var(--border)'; },
                        },
                        React.createElement('span', { style: { fontSize: '1.2rem' } }, '💬'),
                        React.createElement(
                            'div',
                            null,
                            React.createElement('div', { style: { fontWeight: 600 } }, 'Share on WhatsApp'),
                            React.createElement('div', { style: { fontSize: '0.75rem', color: 'var(--text-muted)' } }, 'Send to groups or contacts')
                        )
                    ),

                    // Native share (mobile only)
                    typeof navigator.share === 'function' && React.createElement(
                        'button',
                        {
                            onClick: nativeShare,
                            style: btnBase,
                            onMouseEnter: function (e) { e.currentTarget.style.borderColor = 'var(--blue)'; },
                            onMouseLeave: function (e) { e.currentTarget.style.borderColor = 'var(--border)'; },
                        },
                        React.createElement('span', { style: { fontSize: '1.1rem' } }, '📤'),
                        React.createElement(
                            'div',
                            null,
                            React.createElement('div', { style: { fontWeight: 600 } }, 'More Options'),
                            React.createElement('div', { style: { fontSize: '0.75rem', color: 'var(--text-muted)' } }, 'Email, Messages, etc.')
                        )
                    )
                ),

                React.createElement(
                    'div',
                    {
                        style: {
                            marginTop: '0.75rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid var(--border)',
                            fontSize: '0.73rem',
                            color: 'var(--text-dim)',
                        },
                    },
                    'Anyone with this link can view and register.'
                )
            )
        )
    );
}