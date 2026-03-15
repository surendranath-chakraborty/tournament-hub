import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TournamentCard from '../components/Shared/TournamentCard';

// ── Data ──────────────────────────────────────────────────────
const FEATURES = [
  { icon: '🏆', title: 'Host Tournaments', desc: 'Create and manage events with full control over slots, rules, and deadlines.', color: '#F5B800' },
  { icon: '🎮', title: 'Join & Compete', desc: 'Find tournaments near you and register solo or as a team in seconds.', color: '#4B9EE8' },
  { icon: '🤖', title: 'AI-Powered Tools', desc: 'Auto-generate fixtures and discover nearby grounds using Groq AI for free.', color: '#22C97D' },
  { icon: '💳', title: 'Secure Payments', desc: 'Collect entry fees securely. Automatic refunds on eligible withdrawals.', color: '#F58B00' },
  { icon: '📋', title: 'Smart Waitlist', desc: 'Auto-promote waitlisted players when a confirmed slot opens up.', color: '#E84B4B' },
  { icon: '📺', title: 'Live Streaming', desc: 'Embed YouTube/Twitch streams with live scores and real-time comments.', color: '#9B59B6' },
];

const SPORTS = [
  ['🏏', 'Cricket'], ['⚽', 'Football'], ['🏀', 'Basketball'], ['🏐', 'Volleyball'],
  ['🏸', 'Badminton'], ['🎾', 'Tennis'], ['🤼', 'Kabaddi'], ['♟️', 'Chess'],
  ['🏓', 'Table Tennis'], ['🏊', 'Swimming'], ['🏃', 'Athletics'], ['🥊', 'Boxing'],
];

const STATS = [
  { val: 100, suffix: '%', label: 'Free to Join', color: '#F5B800' },
  { val: 0, prefix: '₹', label: 'Platform Fee', color: '#22C97D' },
  { val: 12, suffix: '+', label: 'Sports Supported', color: '#4B9EE8' },
  { val: 3, suffix: 'x', label: 'Faster than Manual', color: '#E84B4B' },
];

// ── Particle Canvas Background ────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particles = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    const count = Math.floor((canvas.width * canvas.height) / 18000);
    particles.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245,184,0,' + p.o + ')';
        ctx.fill();

        // Draw connecting lines to nearby particles
        for (let j = i + 1; j < particles.current.length; j++) {
          const q = particles.current[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(245,184,0,' + (0.06 * (1 - dist / 100)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return React.createElement('canvas', {
    ref: canvasRef,
    style: { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' },
  });
}

// ── Animated Counter ──────────────────────────────────────────
function Counter({ target, prefix, suffix, color, label, inView }) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(ease * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView, target]);

  return React.createElement('div', { style: { textAlign: 'center', padding: '1.5rem 2rem' } },
    React.createElement('div', {
      style: {
        fontFamily: "'Bebas Neue',sans-serif",
        fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
        color: color, lineHeight: 1,
        textShadow: '0 0 30px ' + color + '40',
        letterSpacing: 2,
      }
    },
      (prefix || '') + count + (suffix || '')
    ),
    React.createElement('div', { style: { fontSize: '0.75rem', color: '#8A8A9A', textTransform: 'uppercase', letterSpacing: 2, marginTop: '0.4rem' } }, label)
  );
}

// ── Scroll Reveal Hook ────────────────────────────────────────
function useScrollReveal(threshold) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVis(true); observer.disconnect(); } },
      { threshold: threshold || 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, vis];
}

// ── Glitch Text ───────────────────────────────────────────────
function GlitchText({ text, style }) {
  return React.createElement('span', { className: 'glitch-wrap', style: Object.assign({ position: 'relative', display: 'inline-block' }, style) },
    React.createElement('span', { className: 'glitch-main', style: { position: 'relative', zIndex: 1 } }, text),
    React.createElement('span', { 'aria-hidden': 'true', className: 'glitch-before', style: { position: 'absolute', top: 0, left: 0, color: '#4B9EE8', opacity: 0 } }, text),
    React.createElement('span', { 'aria-hidden': 'true', className: 'glitch-after', style: { position: 'absolute', top: 0, left: 0, color: '#E84B4B', opacity: 0 } }, text)
  );
}

// ── Main Component ────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [heroVisible, setHeroVis] = useState(false);
  const [statsRef, statsVis] = useScrollReveal(0.3);
  const [featRef, featVis] = useScrollReveal(0.1);
  const [ctaRef, ctaVis] = useScrollReveal(0.2);
  const heroRef = useRef(null);

  useEffect(() => {
    axios.get('/tournaments?limit=3&status=upcoming')
      .then(r => setFeatured(r.data.tournaments || []))
      .catch(() => { });
    // Stagger hero entry
    setTimeout(() => setHeroVis(true), 80);
  }, []);

  // Parallax on mouse move
  const handleMouseMove = useCallback((e) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--mx', x);
    el.style.setProperty('--my', y);
  }, []);

  const CSS = `
    /* ── Keyframes ── */
    @keyframes marquee       { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes marqueeRev    { from{transform:translateX(-50%)} to{transform:translateX(0)} }
    @keyframes floatUp       { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeInScale   { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
    @keyframes pulse         { 0%,100%{opacity:1} 50%{opacity:0.4} }
    @keyframes rotateSlow    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes shimmer       { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes borderGlow    { 0%,100%{box-shadow:0 0 0 0 rgba(245,184,0,0)} 50%{box-shadow:0 0 20px 4px rgba(245,184,0,0.2)} }
    @keyframes glitchA       { 0%,94%,100%{transform:none;opacity:0} 95%{transform:translate(-3px,1px);opacity:0.7} 97%{transform:translate(3px,-1px);opacity:0.7} }
    @keyframes glitchB       { 0%,94%,100%{transform:none;opacity:0} 96%{transform:translate(3px,-1px);opacity:0.6} 98%{transform:translate(-3px,1px);opacity:0.6} }
    @keyframes scanline      { 0%{top:-10%} 100%{top:110%} }
    @keyframes orbitA        { from{transform:rotate(0deg) translateX(180px) rotate(0deg)} to{transform:rotate(360deg) translateX(180px) rotate(-360deg)} }
    @keyframes orbitB        { from{transform:rotate(120deg) translateX(220px) rotate(-120deg)} to{transform:rotate(480deg) translateX(220px) rotate(-480deg)} }
    @keyframes orbitC        { from{transform:rotate(240deg) translateX(160px) rotate(-240deg)} to{transform:rotate(600deg) translateX(160px) rotate(-600deg)} }
    @keyframes slideInLeft   { from{opacity:0;transform:translateX(-50px)} to{opacity:1;transform:translateX(0)} }
    @keyframes slideInRight  { from{opacity:0;transform:translateX(50px)} to{opacity:1;transform:translateX(0)} }
    @keyframes heroTitle     { from{opacity:0;transform:translateY(60px) skewY(3deg)} to{opacity:1;transform:translateY(0) skewY(0)} }

    /* ── Glitch ── */
    .glitch-before { animation: glitchA 4s infinite; }
    .glitch-after  { animation: glitchB 4s infinite; }

    /* ── Buttons ── */
    .btn-hero-gold {
      position:relative; overflow:hidden;
      background:#F5B800; color:#0A0A0F; border:none;
      padding:0.9rem 2.2rem; border-radius:12px;
      font-size:1rem; font-weight:700; cursor:pointer;
      font-family:'DM Sans',sans-serif; transition:all 0.2s;
      display:inline-flex; align-items:center; gap:8px;
    }
    .btn-hero-gold::before {
      content:''; position:absolute; top:0; left:-100%;
      width:100%; height:100%;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent);
      transition:left 0.45s;
    }
    .btn-hero-gold:hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(245,184,0,0.4); }
    .btn-hero-gold:hover::before { left:100%; }

    .btn-hero-outline {
      background:transparent; color:#F0EEE8;
      border:1.5px solid rgba(245,184,0,0.35);
      padding:0.9rem 2.2rem; border-radius:12px;
      font-size:1rem; font-weight:600; cursor:pointer;
      font-family:'DM Sans',sans-serif; transition:all 0.2s;
      display:inline-flex; align-items:center; gap:8px;
      text-decoration:none;
    }
    .btn-hero-outline:hover { border-color:#F5B800; color:#F5B800; transform:translateY(-2px); box-shadow:0 8px 25px rgba(245,184,0,0.15); }

    /* ── Feature cards hover ── */
    .feat-card {
      background:var(--dark-2); border:1px solid var(--border);
      border-radius:18px; padding:2rem 1.5rem; text-align:center;
      transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);
      cursor:default; position:relative; overflow:hidden;
    }
    .feat-card::before {
      content:''; position:absolute; inset:0; opacity:0;
      background:radial-gradient(circle at 50% 0%, var(--feat-color, #F5B800)12, transparent 60%);
      transition:opacity 0.3s;
    }
    .feat-card:hover { transform:translateY(-8px) scale(1.02); border-color:var(--feat-color,#F5B800); box-shadow:0 20px 60px rgba(0,0,0,0.4); }
    .feat-card:hover::before { opacity:1; }
    .feat-icon { font-size:2.5rem; margin-bottom:1rem; display:block; transition:transform 0.3s; }
    .feat-card:hover .feat-icon { transform:scale(1.2) rotate(-5deg); }

    /* ── Stat cards ── */
    .stat-card-anim {
      background:var(--dark-2); border:1px solid var(--border);
      border-radius:16px; transition:all 0.3s;
      animation:borderGlow 3s ease infinite;
    }
    .stat-card-anim:hover { transform:scale(1.05); border-color:rgba(245,184,0,0.4); }

    /* ── Scroll reveal ── */
    .reveal { opacity:0; transform:translateY(30px); transition:all 0.7s cubic-bezier(0.16,1,0.3,1); }
    .reveal.visible { opacity:1; transform:translateY(0); }
    .reveal-left  { opacity:0; transform:translateX(-40px); transition:all 0.7s cubic-bezier(0.16,1,0.3,1); }
    .reveal-left.visible { opacity:1; transform:translateX(0); }
    .reveal-right { opacity:0; transform:translateX(40px);  transition:all 0.7s cubic-bezier(0.16,1,0.3,1); }
    .reveal-right.visible { opacity:1; transform:translateX(0); }

    /* ── Shimmer text ── */
    .shimmer-text {
      background: linear-gradient(90deg, #F5B800 0%, #fff 40%, #F5B800 60%, #C49200 100%);
      background-size:200% auto;
      -webkit-background-clip:text; background-clip:text;
      -webkit-text-fill-color:transparent;
      animation:shimmer 3s linear infinite;
    }


    /* ── Orbit decorations ── */
    .orbit-wrap { position:absolute; width:500px; height:500px; left:50%; top:50%; transform:translate(-50%,-50%); pointer-events:none; opacity:0.35; }
    .orbit-ring { position:absolute; inset:0; border:1px dashed rgba(245,184,0,0.15); border-radius:50%; }
    .orbit-dot  { position:absolute; width:8px; height:8px; border-radius:50%; top:50%; left:50%; margin:-4px; }
    .orbit-dot.a { background:#F5B800; animation:orbitA 12s linear infinite; }
    .orbit-dot.b { background:#4B9EE8; animation:orbitB 18s linear infinite; }
    .orbit-dot.c { background:#22C97D; animation:orbitC 9s  linear infinite; }

    /* ── Scanline effect ── */
    .scanline {
      position:absolute; left:0; width:100%; height:2px;
      background:linear-gradient(90deg,transparent,rgba(245,184,0,0.08),transparent);
      animation:scanline 6s linear infinite; pointer-events:none;
    }

    /* ── Grid bg animated ── */
    .grid-bg {
      position:absolute; inset:0; pointer-events:none;
      backgroundImage:'linear-gradient(rgba(245,184,0,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(245,184,0,0.035) 1px,transparent 1px)';
      background-size:60px 60px;
      animation:rotateSlow 120s linear infinite;
      transform-origin:center;
    }

    /* ── Ticker item hover ── */
    .ticker-item { transition:all 0.2s; cursor:default; }
    .ticker-item:hover { background:rgba(245,184,0,0.12) !important; border-color:rgba(245,184,0,0.4) !important; transform:scale(1.05); }
  `;

  return React.createElement('div', { style: { paddingTop: 64, overflowX: 'hidden' } },

    React.createElement('style', null, CSS),

    // ── HERO ──────────────────────────────────────────────────
    React.createElement('section', {
      ref: heroRef,
      onMouseMove: handleMouseMove,
      style: {
        minHeight: 'calc(100vh - 64px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '4rem 1.5rem',
        position: 'relative', overflow: 'hidden',
      },
    },

      // Particle canvas
      React.createElement(ParticleCanvas),

      // Animated grid background
      React.createElement('div', {
        style: {
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(245,184,0,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(245,184,0,0.035) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }
      }),

      // Scanline sweep
      React.createElement('div', { className: 'scanline' }),

      // Orbital decorations
      React.createElement('div', { className: 'orbit-wrap' },
        React.createElement('div', { className: 'orbit-ring', style: { inset: 40 } }),
        React.createElement('div', { className: 'orbit-ring', style: { inset: 80 } }),
        React.createElement('div', { className: 'orbit-ring', style: { inset: 120 } }),
        React.createElement('div', { className: 'orbit-dot a' }),
        React.createElement('div', { className: 'orbit-dot b' }),
        React.createElement('div', { className: 'orbit-dot c' }),
      ),

      // Big radial glow
      React.createElement('div', {
        style: {
          position: 'absolute', width: 800, height: 800, pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(245,184,0,0.06) 0%, transparent 65%)',
          borderRadius: '50%', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
        }
      }),

      // Secondary glow top-right
      React.createElement('div', {
        style: {
          position: 'absolute', width: 400, height: 400, pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(75,158,232,0.05) 0%, transparent 70%)',
          borderRadius: '50%', top: '-100px', right: '-100px',
        }
      }),

      // Content
      React.createElement('div', { style: { position: 'relative', maxWidth: 860, zIndex: 1 } },

        // Eyebrow badge
        React.createElement('div', {
          style: {
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(245,184,0,0.08)', border: '1px solid rgba(245,184,0,0.25)',
            borderRadius: 50, padding: '0.4rem 1rem',
            marginBottom: '2rem',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
          }
        },
          React.createElement('span', { style: { width: 6, height: 6, borderRadius: '50%', background: '#22C97D', display: 'inline-block', animation: 'pulse 1.5s infinite' } }),
          React.createElement('span', { style: { fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', color: '#F5B800', letterSpacing: '3px', textTransform: 'uppercase' } },
            "India's #1 Tournament Platform"
          )
        ),

        // Main title with glitch effect
        React.createElement('h1', {
          style: {
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 'clamp(4rem, 14vw, 9.5rem)',
            lineHeight: 0.88, letterSpacing: '3px',
            color: '#F0EEE8', marginBottom: '0.2rem',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0) skewY(0)' : 'translateY(60px) skewY(3deg)',
            transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s',
          }
        }, 'TOURNAMENT'),

        // GOLD title shimmer
        React.createElement('h1', {
          style: {
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 'clamp(4rem, 14vw, 9.5rem)',
            lineHeight: 0.88, letterSpacing: '3px',
            marginBottom: '1.75rem',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(60px)',
            transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s',
          }
        },
          React.createElement('span', { className: 'shimmer-text', style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: 'inherit', letterSpacing: '3px' } }, 'HUB'),
        ),

        // Subtitle with typing cursor
        React.createElement('p', {
          style: {
            fontSize: '1.1rem', color: '#8A8A9A',
            maxWidth: 500, margin: '0 auto 2.5rem', lineHeight: 1.75,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s',
          }
        },
          'Organize, compete, and win. The all-in-one platform for hosting and joining sports tournaments across India.',
        ),

        // CTA buttons
        React.createElement('div', {
          style: {
            display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.45s',
          }
        },
          user
            ? React.createElement(React.Fragment, null,
              React.createElement('button', { className: 'btn-hero-gold', onClick: () => navigate('/dashboard') }, 'Go to Dashboard →'),
              React.createElement('button', { className: 'btn-hero-outline', onClick: () => navigate('/tournaments') }, 'Browse Tournaments')
            )
            : React.createElement(React.Fragment, null,
              React.createElement(Link, { to: '/register', className: 'btn-hero-gold' }, 'Get Started Free →'),
              React.createElement(Link, { to: '/tournaments', className: 'btn-hero-outline' }, 'Browse Tournaments')
            )
        ),

        // Floating badges
        React.createElement('div', {
          style: {
            display: 'flex', gap: '0.75rem', justifyContent: 'center',
            marginTop: '2.5rem', flexWrap: 'wrap',
            opacity: heroVisible ? 1 : 0,
            transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.6s',
          }
        },
          [
            { icon: '🤖', text: 'Groq AI', color: '#22C97D' },
            { icon: '💳', text: 'Secure Pay', color: '#4B9EE8' },
            { icon: '📺', text: 'Live Streams', color: '#E84B4B' },
            { icon: '📄', text: 'PDF Export', color: '#F58B00' },
          ].map((b, i) =>
            React.createElement('div', {
              key: b.text,
              style: {
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 50, padding: '0.35rem 0.9rem',
                fontSize: '0.78rem', fontWeight: 500, color: '#8A8A9A',
                animation: 'floatUp 0.5s ease forwards',
                animationDelay: (0.7 + i * 0.08) + 's',
                opacity: 0,
                transition: 'all 0.2s',
              }
            },
              React.createElement('span', null, b.icon),
              b.text
            )
          )
        ),
      )
    ),

    // ── SPORTS TICKER (dual direction) ────────────────────────
    React.createElement('section', { style: { padding: '1.5rem 0', overflow: 'hidden', background: 'var(--dark-2)', borderTop: '1px solid rgba(245,184,0,0.1)', borderBottom: '1px solid rgba(245,184,0,0.1)' } },
      // Row 1 — left to right
      React.createElement('div', { style: { display: 'flex', gap: '1rem', animation: 'marquee 25s linear infinite', width: 'max-content', marginBottom: '0.75rem' } },
        [...SPORTS, ...SPORTS].map(([e, n], i) =>
          React.createElement('div', {
            key: i, className: 'ticker-item',
            style: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--dark-3)', borderRadius: 50, border: '1px solid var(--border)', fontSize: '0.82rem', fontWeight: 500, whiteSpace: 'nowrap' }
          },
            React.createElement('span', { style: { fontSize: '1rem' } }, e), n
          )
        )
      ),
      // Row 2 — right to left
      React.createElement('div', { style: { display: 'flex', gap: '1rem', animation: 'marqueeRev 30s linear infinite', width: 'max-content' } },
        [...SPORTS.slice().reverse(), ...SPORTS.slice().reverse()].map(([e, n], i) =>
          React.createElement('div', {
            key: i, className: 'ticker-item',
            style: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--dark-3)', borderRadius: 50, border: '1px solid var(--border)', fontSize: '0.82rem', fontWeight: 500, whiteSpace: 'nowrap', opacity: 0.7 }
          },
            React.createElement('span', { style: { fontSize: '1rem' } }, e), n
          )
        )
      )
    ),

    // ── ANIMATED STATS ────────────────────────────────────────
    React.createElement('section', { ref: statsRef, style: { padding: '4rem 1.5rem', borderBottom: '1px solid var(--border)' } },
      React.createElement('div', { className: 'container' },
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem' } },
          STATS.map((s, i) =>
            React.createElement('div', {
              key: s.label, className: 'stat-card-anim',
              style: {
                animationDelay: (i * 0.5) + 's',
                opacity: statsVis ? 1 : 0,
                transform: statsVis ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease ' + (i * 0.12) + 's, transform 0.6s ease ' + (i * 0.12) + 's',
              }
            },
              React.createElement(Counter, { target: s.val, prefix: s.prefix, suffix: s.suffix, color: s.color, label: s.label, inView: statsVis })
            )
          )
        )
      )
    ),

    // ── FEATURES ──────────────────────────────────────────────
    React.createElement('section', { ref: featRef, style: { padding: '5rem 1.5rem' } },
      React.createElement('div', { className: 'container' },
        React.createElement('div', {
          style: {
            textAlign: 'center', marginBottom: '3rem',
            opacity: featVis ? 1 : 0,
            transform: featVis ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s ease',
          }
        },
          React.createElement('h2', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(2rem,5vw,3rem)', letterSpacing: 2 } },
            'Everything You Need'
          ),
          React.createElement('p', { style: { color: '#8A8A9A', maxWidth: 460, margin: '0.5rem auto 0' } },
            'Powerful tools for hosts and players. Zero complexity.'
          )
        ),
        React.createElement('div', { className: 'grid-3' },
          FEATURES.map((f, i) =>
            React.createElement('div', {
              key: f.title,
              className: 'feat-card',
              style: {
                '--feat-color': f.color,
                opacity: featVis ? 1 : 0,
                transform: featVis ? 'translateY(0)' : 'translateY(40px)',
                transition: 'opacity 0.6s ease ' + (i * 0.1) + 's, transform 0.6s ease ' + (i * 0.1) + 's',
              }
            },
              React.createElement('span', { className: 'feat-icon' }, f.icon),
              React.createElement('h3', { style: { fontWeight: 600, marginBottom: '0.4rem', fontSize: '1rem', color: 'var(--text)' } }, f.title),
              React.createElement('p', { style: { fontSize: '0.87rem', color: '#8A8A9A', lineHeight: 1.65 } }, f.desc),
              // Bottom accent line
              React.createElement('div', { style: { height: 2, background: f.color, borderRadius: 2, marginTop: '1rem', opacity: 0.3, transition: 'opacity 0.3s' } })
            )
          )
        )
      )
    ),

    // ── FEATURED TOURNAMENTS ──────────────────────────────────
    featured.length > 0 && React.createElement('section', { style: { padding: '3rem 1.5rem 5rem', borderTop: '1px solid var(--border)' } },
      React.createElement('div', { className: 'container' },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' } },
          React.createElement('h2', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '2rem', letterSpacing: 2 } }, 'Upcoming Tournaments'),
          React.createElement(Link, { to: '/tournaments', className: 'btn btn-outline btn-sm' }, 'View All →')
        ),
        React.createElement('div', { className: 'grid-3' },
          featured.map(item => React.createElement(TournamentCard, { key: item._id, t: item }))
        )
      )
    ),

    // ── CTA SECTION ───────────────────────────────────────────
    !user && React.createElement('section', {
      ref: ctaRef,
      style: {
        padding: '5rem 1.5rem', textAlign: 'center',
        background: 'var(--dark-2)', borderTop: '1px solid var(--border)',
        position: 'relative', overflow: 'hidden',
      }
    },
      // Animated background orbs
      React.createElement('div', { style: { position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,184,0,0.06),transparent 70%)', top: '-100px', left: '10%', animation: 'rotateSlow 20s linear infinite', pointerEvents: 'none' } }),
      React.createElement('div', { style: { position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(75,158,232,0.06),transparent 70%)', bottom: '-60px', right: '15%', animation: 'rotateSlow 15s linear infinite reverse', pointerEvents: 'none' } }),

      React.createElement('div', { className: 'container', style: { position: 'relative' } },
        React.createElement('h2', {
          style: {
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 'clamp(2.5rem,6vw,4rem)', letterSpacing: 2, marginBottom: '1rem',
            opacity: ctaVis ? 1 : 0,
            transform: ctaVis ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s ease',
          }
        }, 'Ready to Compete?'),
        React.createElement('p', {
          style: {
            color: '#8A8A9A', marginBottom: '2.5rem', fontSize: '1.05rem',
            maxWidth: 400, margin: '0 auto 2.5rem',
            opacity: ctaVis ? 1 : 0,
            transition: 'all 0.7s ease 0.1s',
          }
        }, 'Join as a Player to enter tournaments, or as a Host to run your own events.'),
        React.createElement('div', {
          style: {
            display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
            opacity: ctaVis ? 1 : 0,
            transition: 'all 0.7s ease 0.2s',
          }
        },
          React.createElement(Link, { to: '/register', className: 'btn-hero-gold' }, 'Create Free Account →'),
          React.createElement(Link, { to: '/login', className: 'btn-hero-outline' }, 'Sign In')
        )
      )
    ),

    // ── FOOTER ────────────────────────────────────────────────
    React.createElement('footer', { style: { borderTop: '1px solid var(--border)', padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' } },
      React.createElement('div', { style: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.2rem', color: 'var(--gold)', letterSpacing: 2, marginBottom: '0.4rem' } }, 'TOURNAMENT HUB'),
      '© ' + new Date().getFullYear() + ' Tournament Hub · Built with MERN + Groq AI + Secure Payments'
    )
  );
}