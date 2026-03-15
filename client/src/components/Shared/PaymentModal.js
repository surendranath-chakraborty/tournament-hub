import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

var ce = React.createElement;

// Card number formatter
function formatCard(val) {
    var clean = val.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim();
}

// Expiry formatter
function formatExpiry(val) {
    var clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) return clean.slice(0, 2) + '/' + clean.slice(2);
    return clean;
}

// Detect card type from first digit
function cardType(num) {
    var n = num.replace(/\s/g, '');
    if (n.startsWith('4')) return { name: 'VISA', color: '#1A1F71' };
    if (n.startsWith('5')) return { name: 'MASTERCARD', color: '#EB001B' };
    if (n.startsWith('6')) return { name: 'RUPAY', color: '#F26522' };
    if (n.startsWith('37')) return { name: 'AMEX', color: '#007BC1' };
    return { name: 'CARD', color: '#555' };
}

// Validate basic card fields
function validate(form) {
    if (form.tab === 'card') {
        var num = form.cardNumber.replace(/\s/g, '');
        if (num.length < 16) return 'Enter a valid 16-digit card number';
        if (form.expiry.length < 5) return 'Enter valid expiry (MM/YY)';
        if (form.cvv.length < 3) return 'Enter 3-digit CVV';
        if (!form.cardName.trim()) return 'Enter name on card';
        var parts = form.expiry.split('/');
        var month = parseInt(parts[0]);
        if (month < 1 || month > 12) return 'Invalid month in expiry';
        return null;
    }
    if (form.tab === 'upi') {
        if (!form.upiId.includes('@')) return 'Enter valid UPI ID (e.g. name@upi)';
        return null;
    }
    if (form.tab === 'netbanking') {
        if (!form.bank) return 'Please select a bank';
        return null;
    }
    return null;
}

var BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Union Bank', 'Yes Bank'];

var INP = {
    width: '100%', padding: '0.7rem 1rem',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10, color: '#F0EEE8',
    fontSize: '0.95rem', outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
    transition: 'border-color 0.2s',
};

var LABEL = {
    fontSize: '0.75rem', color: '#8A8A9A',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    fontWeight: 600, marginBottom: 5, display: 'block',
};

export default function PaymentModal({ tournament, registrationId, orderId, onSuccess, onClose }) {
    var [tab, setTab] = useState('card');
    var [cardNum, setCardNum] = useState('');
    var [expiry, setExpiry] = useState('');
    var [cvv, setCvv] = useState('');
    var [cardName, setCardName] = useState('');
    var [upiId, setUpiId] = useState('');
    var [bank, setBank] = useState('');
    var [step, setStep] = useState('form'); // form | processing | success | failed
    var [errMsg, setErrMsg] = useState('');
    var [payId, setPayId] = useState('');

    var ct = cardType(cardNum);
    var amount = tournament.entryFee;

    async function handlePay() {
        var form = { tab, cardNumber: cardNum, expiry, cvv, cardName, upiId, bank };
        var err = validate(form);
        if (err) { setErrMsg(err); return; }
        setErrMsg('');
        setStep('processing');

        // Simulate network delay for realistic feel
        await new Promise(function (r) { setTimeout(r, 2200); });

        try {
            var last4 = cardNum.replace(/\s/g, '').slice(-4);
            var res = await axios.post('/payments/verify', {
                registrationId,
                orderId,
                cardLast4: last4,
                paymentMethod: tab,
            });
            setPayId(res.data.paymentId);
            setStep('success');
        } catch (e) {
            setStep('failed');
        }
    }

    function handleDone() {
        onSuccess();
    }

    var tabStyle = function (name) {
        return {
            flex: 1, padding: '0.6rem 0.5rem',
            borderRadius: 8, border: 'none',
            background: tab === name ? '#F5B800' : 'rgba(255,255,255,0.05)',
            color: tab === name ? '#0A0A0F' : '#8A8A9A',
            fontWeight: tab === name ? 700 : 500,
            cursor: 'pointer', fontSize: '0.82rem',
            fontFamily: 'DM Sans, sans-serif',
            transition: 'all 0.15s',
        };
    };

    // ── Processing screen ──
    if (step === 'processing') {
        return ce('div', { className: 'modal-overlay' },
            ce('div', { className: 'modal', style: { maxWidth: 400, textAlign: 'center', padding: '3rem 2rem' } },
                ce('style', null, '@keyframes spin360{to{transform:rotate(360deg)}} @keyframes checkDraw{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}'),
                ce('div', { style: { width: 72, height: 72, border: '4px solid rgba(245,184,0,0.2)', borderTopColor: '#F5B800', borderRadius: '50%', animation: 'spin360 0.9s linear infinite', margin: '0 auto 1.5rem' } }),
                ce('h3', { style: { fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' } }, 'Processing Payment...'),
                ce('p', { style: { color: 'var(--text-muted)', fontSize: '0.9rem' } }, 'Please wait. Do not close this window.'),
                ce('div', { style: { marginTop: '1.5rem', padding: '0.75rem 1rem', background: 'var(--dark-3)', borderRadius: 10, fontSize: '0.85rem', color: 'var(--text-muted)' } },
                    ce('div', null, 'Amount: '),
                    ce('strong', { style: { color: '#F5B800', fontSize: '1.1rem' } }, 'Rs.' + amount)
                )
            )
        );
    }

    // ── Success screen ──
    if (step === 'success') {
        return ce('div', { className: 'modal-overlay' },
            ce('div', { className: 'modal', style: { maxWidth: 420, textAlign: 'center', padding: '2.5rem 2rem' } },
                ce('style', null, '@keyframes popIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}'),
                ce('div', { style: { width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,201,125,0.15)', border: '3px solid #22C97D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' } },
                    ce('span', { style: { fontSize: '2.5rem' } }, '✅')
                ),
                ce('h2', { style: { fontWeight: 700, color: '#22C97D', marginBottom: '0.5rem' } }, 'Payment Successful!'),
                ce('p', { style: { color: 'var(--text-muted)', marginBottom: '1.5rem' } }, 'Your registration is confirmed. Welcome to the tournament!'),

                // Receipt card
                ce('div', { style: { background: 'var(--dark-3)', borderRadius: 14, padding: '1.25rem', textAlign: 'left', marginBottom: '1.5rem', border: '1px solid rgba(34,201,125,0.2)' } },
                    ce('div', { style: { fontSize: '0.75rem', color: '#22C97D', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.75rem', fontWeight: 600 } }, 'Payment Receipt'),
                    [
                        ['Tournament', tournament.title],
                        ['Amount Paid', 'Rs.' + amount],
                        ['Payment ID', payId],
                        ['Status', 'CONFIRMED'],
                    ].map(function (row) {
                        return ce('div', { key: row[0], style: { display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' } },
                            ce('span', { style: { color: 'var(--text-muted)' } }, row[0]),
                            ce('span', { style: { fontWeight: 600, color: row[0] === 'Status' ? '#22C97D' : row[0] === 'Amount Paid' ? '#F5B800' : 'var(--text)' } }, row[1])
                        );
                    })
                ),

                ce('button', { className: 'btn btn-gold btn-full', onClick: handleDone }, 'Continue →')
            )
        );
    }

    // ── Failed screen ──
    if (step === 'failed') {
        return ce('div', { className: 'modal-overlay' },
            ce('div', { className: 'modal', style: { maxWidth: 400, textAlign: 'center', padding: '2.5rem 2rem' } },
                ce('div', { style: { fontSize: '4rem', marginBottom: '1rem' } }, '❌'),
                ce('h2', { style: { fontWeight: 700, color: 'var(--red)', marginBottom: '0.5rem' } }, 'Payment Failed'),
                ce('p', { style: { color: 'var(--text-muted)', marginBottom: '1.5rem' } }, 'Something went wrong. Please try again.'),
                ce('div', { style: { display: 'flex', gap: '0.75rem' } },
                    ce('button', { className: 'btn btn-outline btn-full', onClick: onClose }, 'Cancel'),
                    ce('button', { className: 'btn btn-gold btn-full', onClick: function () { setStep('form'); } }, 'Try Again')
                )
            )
        );
    }

    // ── Payment Form ──
    return ce('div', { className: 'modal-overlay', onClick: onClose },
        ce('div', {
            className: 'modal',
            style: { maxWidth: 480 },
            onClick: function (e) { e.stopPropagation(); }
        },

            ce('style', null, '.pay-inp:focus{border-color:rgba(245,184,0,0.6)!important;} .pay-tab:hover{opacity:0.85}'),

            // Header
            ce('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' } },
                ce('div', null,
                    ce('h2', { style: { fontWeight: 700, fontSize: '1.2rem', marginBottom: 2 } }, 'Complete Payment'),
                    ce('div', { style: { fontSize: '0.82rem', color: 'var(--text-muted)' } }, tournament.title)
                ),
                ce('div', { style: { textAlign: 'right' } },
                    ce('div', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.8rem', color: '#F5B800', lineHeight: 1 } }, 'Rs.' + amount),
                    ce('div', { style: { fontSize: '0.72rem', color: 'var(--text-muted)' } }, 'Entry Fee')
                )
            ),

            // Amount bar
            ce('div', { style: { background: 'rgba(245,184,0,0.08)', border: '1px solid rgba(245,184,0,0.2)', borderRadius: 10, padding: '0.7rem 1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                ce('span', { style: { fontSize: '0.85rem', color: 'var(--text-muted)' } }, '🔒 Secure Payment Gateway'),
                ce('span', { style: { fontWeight: 700, color: '#F5B800' } }, 'Rs.' + amount)
            ),

            // Payment method tabs
            ce('div', { style: { display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', padding: 5, borderRadius: 10, marginBottom: '1.25rem' } },
                ce('button', { className: 'pay-tab', style: tabStyle('card'), onClick: function () { setTab('card'); setErrMsg(''); } }, '💳 Card'),
                ce('button', { className: 'pay-tab', style: tabStyle('upi'), onClick: function () { setTab('upi'); setErrMsg(''); } }, '📱 UPI'),
                ce('button', { className: 'pay-tab', style: tabStyle('netbanking'), onClick: function () { setTab('netbanking'); setErrMsg(''); } }, '🏦 Net Banking')
            ),

            // ── CARD TAB ──
            tab === 'card' && ce('div', null,

                // Card preview
                ce('div', { style: { background: 'linear-gradient(135deg, #1A1A36, #2A2A4A)', borderRadius: 14, padding: '1.25rem 1.4rem', marginBottom: '1.1rem', position: 'relative', minHeight: 120, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' } },
                    // Card shine
                    ce('div', { style: { position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' } }),
                    ce('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' } },
                        ce('div', { style: { width: 40, height: 28, borderRadius: 4, background: 'linear-gradient(135deg, #FFD700, #FFA500)', opacity: 0.9 } }),
                        ct.name !== 'CARD' && ce('div', { style: { fontWeight: 800, fontSize: '0.9rem', color: '#fff', letterSpacing: 1 } }, ct.name)
                    ),
                    ce('div', { style: { fontFamily: "'Space Mono',monospace", fontSize: '1.05rem', letterSpacing: '3px', color: '#fff', marginBottom: '0.75rem' } },
                        cardNum || '•••• •••• •••• ••••'
                    ),
                    ce('div', { style: { display: 'flex', justifyContent: 'space-between' } },
                        ce('div', null,
                            ce('div', { style: { fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 2 } }, 'Card Holder'),
                            ce('div', { style: { fontSize: '0.85rem', color: '#fff', fontWeight: 600, textTransform: 'uppercase' } }, cardName || 'YOUR NAME')
                        ),
                        ce('div', { style: { textAlign: 'right' } },
                            ce('div', { style: { fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 2 } }, 'Expires'),
                            ce('div', { style: { fontSize: '0.85rem', color: '#fff', fontWeight: 600 } }, expiry || 'MM/YY')
                        )
                    )
                ),

                // Card fields
                ce('div', { style: { marginBottom: '0.9rem' } },
                    ce('label', { style: LABEL }, 'Card Number'),
                    ce('input', {
                        className: 'pay-inp', placeholder: '1234 5678 9012 3456',
                        value: cardNum, maxLength: 19,
                        onChange: function (e) { setCardNum(formatCard(e.target.value)); },
                        style: Object.assign({}, INP, { fontFamily: "'Space Mono',monospace", letterSpacing: '1px' }),
                    })
                ),
                ce('div', { style: { marginBottom: '0.9rem' } },
                    ce('label', { style: LABEL }, 'Name on Card'),
                    ce('input', {
                        className: 'pay-inp', placeholder: 'As printed on card',
                        value: cardName,
                        onChange: function (e) { setCardName(e.target.value.toUpperCase()); },
                        style: INP,
                    })
                ),
                ce('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' } },
                    ce('div', null,
                        ce('label', { style: LABEL }, 'Expiry Date'),
                        ce('input', {
                            className: 'pay-inp', placeholder: 'MM/YY',
                            value: expiry, maxLength: 5,
                            onChange: function (e) { setExpiry(formatExpiry(e.target.value)); },
                            style: INP,
                        })
                    ),
                    ce('div', null,
                        ce('label', { style: LABEL }, 'CVV'),
                        ce('input', {
                            className: 'pay-inp', placeholder: '•••',
                            value: cvv, maxLength: 4, type: 'password',
                            onChange: function (e) { setCvv(e.target.value.replace(/\D/g, '').slice(0, 4)); },
                            style: INP,
                        })
                    )
                )
            ),

            // ── UPI TAB ──
            tab === 'upi' && ce('div', null,
                ce('div', { style: { textAlign: 'center', padding: '1rem 0 0.75rem' } },
                    ce('div', { style: { fontSize: '3rem', marginBottom: '0.5rem' } }, '📱'),
                    ce('p', { style: { color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' } }, 'Pay instantly using any UPI app')
                ),
                ce('div', { style: { marginBottom: '0.9rem' } },
                    ce('label', { style: LABEL }, 'UPI ID'),
                    ce('input', {
                        className: 'pay-inp', placeholder: 'yourname@upi  or  9876543210@paytm',
                        value: upiId,
                        onChange: function (e) { setUpiId(e.target.value); },
                        style: INP,
                    })
                ),
                ce('div', { style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' } },
                    ['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(function (app) {
                        return ce('div', { key: app, style: { padding: '0.35rem 0.85rem', background: 'var(--dark-3)', borderRadius: 20, fontSize: '0.78rem', color: 'var(--text-muted)', border: '1px solid var(--border)' } }, app);
                    })
                )
            ),

            // ── NETBANKING TAB ──
            tab === 'netbanking' && ce('div', null,
                ce('div', { style: { textAlign: 'center', padding: '1rem 0 0.75rem' } },
                    ce('div', { style: { fontSize: '3rem', marginBottom: '0.5rem' } }, '🏦'),
                    ce('p', { style: { color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' } }, 'Pay securely through your bank')
                ),
                ce('div', { style: { marginBottom: '0.9rem' } },
                    ce('label', { style: LABEL }, 'Select Bank'),
                    ce('select', {
                        value: bank,
                        onChange: function (e) { setBank(e.target.value); },
                        style: Object.assign({}, INP, { cursor: 'pointer' }),
                    },
                        ce('option', { value: '' }, '-- Select your bank --'),
                        BANKS.map(function (b) { return ce('option', { key: b, value: b }, b); })
                    )
                )
            ),

            // Error message
            errMsg && ce('div', { style: { background: 'rgba(232,75,75,0.1)', border: '1px solid rgba(232,75,75,0.3)', borderRadius: 8, padding: '0.6rem 0.9rem', color: 'var(--red)', fontSize: '0.85rem', marginBottom: '0.75rem' } },
                '⚠️ ' + errMsg
            ),

            // Security badges
            ce('div', { style: { display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem', flexWrap: 'wrap' } },
                ['🔒 SSL Secured', '🛡️ 256-bit Encrypted', '✅ PCI DSS Compliant'].map(function (badge) {
                    return ce('span', { key: badge, style: { fontSize: '0.72rem', color: 'var(--text-dim)', padding: '3px 8px', background: 'var(--dark-3)', borderRadius: 20, border: '1px solid var(--border)' } }, badge);
                })
            ),

            // Action buttons
            ce('div', { style: { display: 'flex', gap: '0.75rem' } },
                ce('button', { className: 'btn btn-outline', style: { flex: 1 }, onClick: onClose }, 'Cancel'),
                ce('button', {
                    className: 'btn btn-gold',
                    style: { flex: 2, fontSize: '1rem', padding: '0.8rem' },
                    onClick: handlePay,
                }, 'Pay Rs.' + amount + ' →')
            )
        )
    );
}