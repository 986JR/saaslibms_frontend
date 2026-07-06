import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen, Users, CheckSquare, Calendar, BarChart2, Lock,
  Zap, Shield, Globe, Monitor, ArrowDown, Play, Menu, X, Twitter, Linkedin,
  Mail, Eye, EyeOff, Loader2, AlertCircle
} from 'lucide-react'
import { authApi } from '../../api'
import { useAuthStore } from '../../store/authStore'

/* ─── Inline styles (mirrors the original CSS) ─────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');

  :root {
    --green-900: #14532D;
    --green-700: #15803d;
    --green-600: #16A34A;
    --green-100: #dcfce7;
    --green-50:  #f0fdf4;
    --bg:        #F6F7F5;
    --white:     #FFFFFF;
    --text-1:    #111827;
    --text-2:    #6B7280;
    --text-3:    #9CA3AF;
    --border:    #E5E7EB;
    --border-2:  #D1D5DB;
    --danger:    #DC2626;
    --shadow-sm: 0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.04);
    --shadow-md: 0 4px 16px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.04);
    --shadow-lg: 0 12px 40px rgba(0,0,0,.10), 0 4px 8px rgba(0,0,0,.04);
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
  }

  html { scroll-behavior: smooth; }

  .lp-root {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 16px;
    line-height: 1.65;
    color: var(--text-1);
    background: var(--bg);
    -webkit-font-smoothing: antialiased;
  }

  .lp-root ::-webkit-scrollbar { width: 5px; }
  .lp-root ::-webkit-scrollbar-track { background: transparent; }
  .lp-root ::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 99px; }

  .lp-serif { font-family: 'DM Serif Display', Georgia, serif; }

  /* ── Navbar ── */
  .lp-navbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: rgba(246,247,245,.85);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid transparent;
    transition: border-color .25s, box-shadow .25s;
  }
  .lp-navbar.scrolled {
    border-color: var(--border);
    box-shadow: var(--shadow-sm);
  }
  .lp-nav-inner {
    display: flex; align-items: center; justify-content: space-between;
    height: 64px; max-width: 1200px; margin: 0 auto; padding: 0 24px;
  }
  .lp-brand {
    display: flex; align-items: center; gap: 10px; text-decoration: none;
  }
  .lp-brand-icon {
    width: 34px; height: 34px; background: var(--green-900);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
  }
  .lp-brand-name {
    font-family: 'DM Serif Display', serif; font-size: 1.2rem; color: var(--text-1);
  }
  .lp-nav-links {
    display: flex; align-items: center; gap: 32px; list-style: none;
    margin: 0; padding: 0;
  }
  .lp-nav-links a {
    text-decoration: none; font-size: 14px; font-weight: 500;
    color: var(--text-2); transition: color .15s;
  }
  .lp-nav-links a:hover { color: var(--text-1); }
  .lp-nav-actions { display: flex; align-items: center; gap: 12px; }

  /* ── Buttons ── */
  .lp-btn {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 14px; font-weight: 500; padding: 0 18px; height: 38px;
    border-radius: var(--radius-md); cursor: pointer; border: none;
    text-decoration: none; transition: all .15s; white-space: nowrap;
  }
  .lp-btn-ghost {
    background: transparent; color: var(--text-2); border: 1px solid var(--border);
  }
  .lp-btn-ghost:hover { background: var(--white); color: var(--text-1); }
  .lp-btn-primary {
    background: var(--green-900); color: #fff;
    box-shadow: 0 1px 3px rgba(20,83,45,.3);
  }
  .lp-btn-primary:hover {
    background: #0f3d1e; transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20,83,45,.3);
  }
  .lp-btn-primary:active { transform: translateY(0); }
  .lp-btn-lg { height: 48px; padding: 0 28px; font-size: 15px; }
  .lp-btn-outline {
    background: var(--white); color: var(--text-1);
    border: 1px solid var(--border-2); box-shadow: var(--shadow-sm);
  }
  .lp-btn-outline:hover {
    border-color: var(--green-600); color: var(--green-900); transform: translateY(-1px);
  }

  /* ── Hamburger / Mobile menu ── */
  .lp-hamburger {
    display: none; background: none; border: none; cursor: pointer; padding: 8px;
  }
  .lp-mobile-menu {
    display: none; position: fixed; top: 64px; left: 0; right: 0;
    background: var(--white); border-bottom: 1px solid var(--border);
    padding: 16px 24px 24px; z-index: 99; box-shadow: var(--shadow-md);
  }
  .lp-mobile-menu.open { display: block; }
  .lp-mobile-menu a {
    display: block; padding: 12px 0; font-size: 15px; font-weight: 500;
    color: var(--text-2); text-decoration: none; border-bottom: 1px solid var(--border);
  }
  .lp-mobile-menu a:last-of-type { border-bottom: none; }
  .lp-mobile-cta { margin-top: 16px; width: 100%; justify-content: center; height: 46px; }

  /* ── Container ── */
  .lp-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

  /* ── Hero ── */
  .lp-hero { padding: 140px 0 80px; overflow: hidden; }
  .lp-hero-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;
  }
  .lp-hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
    color: var(--green-700); background: var(--green-50);
    border: 1px solid var(--green-100); padding: 6px 14px; border-radius: 99px;
    margin-bottom: 24px;
  }
  .lp-hero-badge::before {
    content: ''; width: 6px; height: 6px; background: var(--green-600);
    border-radius: 50%; animation: lp-pulse 2.5s infinite;
  }
  @keyframes lp-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,.3); }
    50%       { box-shadow: 0 0 0 6px rgba(22,163,74,0); }
  }
  .lp-hero-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(2rem, 4.5vw, 3.5rem); font-weight: 400; line-height: 1.1;
    margin-bottom: 20px; color: var(--text-1);
  }
  .lp-hero-title em { font-style: italic; color: var(--green-900); }
  .lp-hero-sub {
    font-size: 17px; line-height: 1.7; color: var(--text-2);
    margin-bottom: 36px; max-width: 480px;
  }
  .lp-hero-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .lp-hero-trust {
    margin-top: 48px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  }
  .lp-hero-trust-text { font-size: 13px; color: var(--text-3); font-weight: 500; }
  .lp-hero-avatars { display: flex; align-items: center; }
  .lp-hero-avatar {
    width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--white);
    background: var(--green-900); color: #fff; font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; margin-left: -8px;
  }
  .lp-hero-avatar:first-child { margin-left: 0; }
  .lp-hero-avatar:nth-child(2) { background: #1e40af; }
  .lp-hero-avatar:nth-child(3) { background: #7c3aed; }
  .lp-hero-avatar:nth-child(4) { background: #b45309; }

  /* ── Dashboard Preview ── */
  .lp-preview-frame {
    background: var(--white); border-radius: var(--radius-xl);
    border: 1px solid var(--border); box-shadow: var(--shadow-lg); overflow: hidden;
    transform: perspective(1200px) rotateY(-3deg) rotateX(1deg);
    transition: transform .4s ease;
  }
  .lp-preview-frame:hover { transform: perspective(1200px) rotateY(-1deg) rotateX(.5deg); }
  .lp-preview-topbar {
    height: 40px; background: var(--bg); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; padding: 0 14px; gap: 6px;
  }
  .lp-preview-dot { width: 10px; height: 10px; border-radius: 50%; }
  .lp-preview-content { padding: 16px; display: grid; gap: 12px; }
  .lp-mini-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
  .lp-mini-stat {
    background: var(--bg); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 10px 12px;
  }
  .lp-mini-stat-label {
    font-size: 10px; color: var(--text-3); font-weight: 600;
    text-transform: uppercase; letter-spacing: .04em; margin-bottom: 4px;
  }
  .lp-mini-stat-value { font-size: 20px; font-weight: 700; color: var(--text-1); font-family: 'DM Serif Display', serif; }
  .lp-mini-stat-sub { font-size: 10px; color: var(--text-3); margin-top: 2px; }
  .lp-mini-table-wrap {
    background: var(--white); border: 1px solid var(--border);
    border-radius: var(--radius-sm); overflow: hidden;
  }
  .lp-mini-table-header {
    background: var(--bg); padding: 8px 12px; font-size: 11px;
    font-weight: 600; color: var(--text-2); text-transform: uppercase;
    letter-spacing: .05em; display: flex; justify-content: space-between;
  }
  .lp-mini-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px; border-bottom: 1px solid var(--border); font-size: 12px;
  }
  .lp-mini-row:last-child { border-bottom: none; }
  .lp-mini-row-title { font-weight: 500; color: var(--text-1); }
  .lp-mini-row-sub { color: var(--text-3); font-size: 10px; }
  .lp-badge {
    font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 99px;
  }
  .lp-badge-green { background: var(--green-50); color: var(--green-700); }
  .lp-badge-yellow { background: #fffbeb; color: #92400e; }
  .lp-badge-red { background: #fef2f2; color: #991b1b; }

  /* ── Trusted By ── */
  .lp-trusted { padding: 40px 0 72px; border-top: 1px solid var(--border); }
  .lp-trusted-label {
    text-align: center; font-size: 12px; font-weight: 600;
    letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); margin-bottom: 32px;
  }
  .lp-trusted-logos {
    display: flex; align-items: center; justify-content: center;
    gap: 48px; flex-wrap: wrap;
  }
  .lp-trusted-logo {
    font-family: 'DM Serif Display', serif; font-size: 15px; color: var(--text-3);
    letter-spacing: -.02em; opacity: .5; transition: opacity .2s; user-select: none;
  }
  .lp-trusted-logo:hover { opacity: .75; }

  /* ── Sections ── */
  .lp-section { padding: 96px 0; }
  .lp-section-tag {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase;
    color: var(--green-700); margin-bottom: 16px;
  }
  .lp-section-tag::before {
    content: ''; display: inline-block; width: 16px; height: 2px;
    background: var(--green-600); border-radius: 2px;
  }
  .lp-section-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(1.6rem, 3vw, 2.4rem); font-weight: 400; line-height: 1.15;
    color: var(--text-1); margin-bottom: 16px;
  }
  .lp-section-sub { font-size: 17px; color: var(--text-2); max-width: 560px; line-height: 1.7; margin-bottom: 56px; }

  /* ── Features ── */
  .lp-features { background: var(--white); }
  .lp-features-header { text-align: center; }
  .lp-features-header .lp-section-sub { margin-left: auto; margin-right: auto; }
  .lp-feature-grid {
    display: grid; grid-template-columns: repeat(3,1fr);
    gap: 1px; background: var(--border);
    border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden;
  }
  .lp-feature-card {
    background: var(--white); padding: 32px 28px;
    transition: background .2s; opacity: 0; transform: translateY(20px);
    transition: opacity .5s ease, transform .5s ease, background .2s;
  }
  .lp-feature-card.visible { opacity: 1; transform: translateY(0); }
  .lp-feature-card:hover { background: var(--bg); }
  .lp-feature-icon {
    width: 44px; height: 44px; border-radius: var(--radius-md);
    background: var(--green-50); border: 1px solid var(--green-100);
    display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
  }
  .lp-feature-title { font-size: 15px; font-weight: 600; color: var(--text-1); margin-bottom: 10px; }
  .lp-feature-desc { font-size: 14px; line-height: 1.65; color: var(--text-2); }

  /* ── Showcase ── */
  .lp-showcase { background: var(--bg); overflow: hidden; }
  .lp-showcase-inner {
    display: grid; grid-template-columns: 1fr 1.6fr; gap: 80px; align-items: center;
  }
  .lp-showcase-frame {
    background: var(--white); border: 1px solid var(--border);
    border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); overflow: hidden;
  }
  .lp-showcase-frame-inner { display: flex; min-height: 340px; }
  .lp-showcase-sidebar {
    width: 200px; background: var(--white);
    border-right: 1px solid var(--border); padding: 16px 12px; min-height: 340px;
  }
  .lp-showcase-main { padding: 20px; flex: 1; overflow: hidden; }
  .lp-sidebar-brand {
    display: flex; align-items: center; gap: 8px; padding: 6px 8px; margin-bottom: 20px;
  }
  .lp-sidebar-brand-icon {
    width: 26px; height: 26px; background: var(--green-900);
    border-radius: 6px; display: flex; align-items: center; justify-content: center;
  }
  .lp-sidebar-brand-name { font-family: 'DM Serif Display', serif; font-size: 12px; color: var(--text-1); }
  .lp-sidebar-nav-item {
    display: flex; align-items: center; gap: 8px; padding: 8px 10px;
    border-radius: var(--radius-sm); font-size: 12px; font-weight: 500;
    margin-bottom: 2px; color: var(--text-2);
  }
  .lp-sidebar-nav-item.active { background: var(--green-900); color: #fff; }
  .lp-showcase-stat-row {
    display: grid; grid-template-columns: repeat(2,1fr); gap: 8px; margin-bottom: 12px;
  }
  .lp-showcase-stat {
    background: var(--bg); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 10px 12px;
  }
  .lp-showcase-stat-lbl {
    font-size: 9px; text-transform: uppercase; letter-spacing: .06em;
    color: var(--text-3); font-weight: 700; margin-bottom: 3px;
  }
  .lp-showcase-stat-val {
    font-size: 18px; font-weight: 700; color: var(--text-1); font-family: 'DM Serif Display', serif;
  }
  .lp-showcase-table { width: 100%; }
  .lp-showcase-table-head {
    display: flex; padding: 6px 10px; background: var(--bg);
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    font-size: 9px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .06em; color: var(--text-3); gap: 12px;
    border: 1px solid var(--border); border-bottom: none;
  }
  .lp-showcase-row {
    display: flex; align-items: center; padding: 8px 10px;
    border: 1px solid var(--border); border-top: none; gap: 12px; background: var(--white);
  }
  .lp-showcase-row:last-child { border-radius: 0 0 var(--radius-sm) var(--radius-sm); }
  .lp-showcase-row:hover { background: var(--bg); }
  .lp-col-title { flex: 1; font-size: 11px; font-weight: 500; color: var(--text-1); }
  .lp-col-sub { font-size: 10px; color: var(--text-3); }

  /* Showcase checklist */
  .lp-check-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
  .lp-check-item { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--text-2); }
  .lp-check-bullet {
    width: 20px; height: 20px; border-radius: 50%;
    background: var(--green-50); border: 1px solid var(--green-100);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  /* ── Benefits ── */
  .lp-benefits { background: var(--white); }
  .lp-benefits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
  .lp-benefit-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 24px; }
  .lp-benefit-item {
    display: flex; gap: 16px; opacity: 0; transform: translateY(20px);
    transition: opacity .5s ease, transform .5s ease;
  }
  .lp-benefit-item.visible { opacity: 1; transform: translateY(0); }
  .lp-benefit-bullet {
    width: 36px; height: 36px; border-radius: 10px;
    background: var(--green-50); border: 1px solid var(--green-100);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;
  }
  .lp-benefit-title { font-size: 15px; font-weight: 600; color: var(--text-1); margin-bottom: 4px; }
  .lp-benefit-desc { font-size: 14px; color: var(--text-2); line-height: 1.6; }
  .lp-benefit-visual {
    background: var(--bg); border: 1px solid var(--border);
    border-radius: var(--radius-xl); padding: 28px; display: flex; flex-direction: column; gap: 12px;
  }
  .lp-stat-card-lg {
    background: var(--white); border: 1px solid var(--border);
    border-radius: var(--radius-md); padding: 20px 24px;
    display: flex; align-items: center; gap: 16px;
    transition: box-shadow .2s, transform .2s;
    opacity: 0; transform: translateY(20px);
  }
  .lp-stat-card-lg.visible { opacity: 1; transform: translateY(0); }
  .lp-stat-card-lg:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .lp-stat-icon-circle {
    width: 44px; height: 44px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .lp-stat-card-label { font-size: 12px; color: var(--text-2); font-weight: 500; }
  .lp-stat-card-value { font-size: 26px; font-weight: 700; color: var(--text-1); font-family: 'DM Serif Display', serif; line-height: 1; }
  .lp-stat-trend { font-size: 11px; color: var(--green-600); font-weight: 600; margin-top: 2px; }

  /* ── Testimonials ── */
  .lp-testimonials { background: var(--bg); }
  .lp-testimonials-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
  .lp-testimonial-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 28px;
    transition: box-shadow .2s, transform .2s;
    opacity: 0; transform: translateY(20px);
  }
  .lp-testimonial-card.visible { opacity: 1; transform: translateY(0); }
  .lp-testimonial-card:hover { box-shadow: var(--shadow-md); transform: translateY(-3px); }
  .lp-testimonial-quote { font-size: 13px; line-height: 1.7; color: var(--text-2); margin-bottom: 20px; }
  .lp-testimonial-author { display: flex; align-items: center; gap: 12px; }
  .lp-testimonial-avatar {
    width: 38px; height: 38px; border-radius: 50%; background: var(--green-900);
    color: #fff; font-size: 13px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .lp-testimonial-name { font-size: 13px; font-weight: 600; color: var(--text-1); }
  .lp-testimonial-role { font-size: 12px; color: var(--text-3); }
  .lp-testimonial-stars { color: #F59E0B; font-size: 14px; margin-bottom: 16px; letter-spacing: 2px; }

  /* ── CTA ── */
  .lp-cta {
    background: var(--green-900); padding: 96px 0;
    position: relative; overflow: hidden;
  }
  .lp-cta::before {
    content: ''; position: absolute; top: -120px; right: -120px;
    width: 400px; height: 400px; border-radius: 50%;
    background: rgba(255,255,255,.03); pointer-events: none;
  }
  .lp-cta::after {
    content: ''; position: absolute; bottom: -80px; left: -60px;
    width: 280px; height: 280px; border-radius: 50%;
    background: rgba(255,255,255,.04); pointer-events: none;
  }
  .lp-cta-inner { text-align: center; position: relative; z-index: 1; }
  .lp-cta-tag {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
    color: rgba(255,255,255,.6); margin-bottom: 20px;
  }
  .lp-cta-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(2rem, 4vw, 3rem); font-weight: 400; color: #fff;
    line-height: 1.15; margin-bottom: 16px;
  }
  .lp-cta-sub { font-size: 17px; color: rgba(255,255,255,.65); max-width: 480px; margin: 0 auto 40px; line-height: 1.7; }
  .lp-cta-actions { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; }
  .lp-btn-white { background: var(--white); color: var(--green-900); font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,.15); }
  .lp-btn-white:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.2); }
  .lp-btn-ghost-white { background: transparent; color: rgba(255,255,255,.85); border: 1px solid rgba(255,255,255,.2); }
  .lp-btn-ghost-white:hover { background: rgba(255,255,255,.08); color: #fff; }
  .lp-cta-note { margin-top: 24px; font-size: 13px; color: rgba(255,255,255,.4); }

  /* ── Footer ── */
  .lp-footer { background: var(--white); border-top: 1px solid var(--border); padding: 56px 0 40px; }
  .lp-footer-grid {
    display: grid; grid-template-columns: 1.8fr 1fr 1fr 1fr;
    gap: 48px; margin-bottom: 48px;
  }
  .lp-footer-brand-name { font-family: 'DM Serif Display', serif; font-size: 1.1rem; color: var(--text-1); margin-bottom: 10px; }
  .lp-footer-brand-desc { font-size: 14px; color: var(--text-2); line-height: 1.65; max-width: 260px; margin-bottom: 20px; }
  .lp-footer-col-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--text-1); margin-bottom: 16px; }
  .lp-footer-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
  .lp-footer-links a { font-size: 14px; color: var(--text-2); text-decoration: none; transition: color .15s; }
  .lp-footer-links a:hover { color: var(--text-1); }
  .lp-footer-bottom {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 24px; border-top: 1px solid var(--border); flex-wrap: wrap; gap: 12px;
  }
  .lp-footer-copy { font-size: 13px; color: var(--text-3); }
  .lp-footer-legal { display: flex; gap: 20px; }
  .lp-footer-legal a { font-size: 13px; color: var(--text-3); text-decoration: none; transition: color .15s; }
  .lp-footer-legal a:hover { color: var(--text-2); }

  /* ── Hero entrance animations ── */
  @keyframes lp-fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lp-fade-up { animation: lp-fadeUp .6s ease-out both; }
  .lp-delay-1 { animation-delay: .1s; }
  .lp-delay-2 { animation-delay: .2s; }
  .lp-delay-3 { animation-delay: .3s; }
  .lp-delay-4 { animation-delay: .4s; }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .lp-hero-grid { grid-template-columns: 1fr; gap: 48px; }
    .lp-preview-frame { transform: none; max-width: 560px; }
    .lp-feature-grid { grid-template-columns: repeat(2,1fr); }
    .lp-showcase-inner { grid-template-columns: 1fr; gap: 48px; }
    .lp-benefits-grid { grid-template-columns: 1fr; gap: 48px; }
    .lp-testimonials-grid { grid-template-columns: 1fr 1fr; }
    .lp-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
  }
  @media (max-width: 768px) {
    .lp-nav-links { display: none; }
    .lp-btn-ghost.lp-nav-hide { display: none; }
    .lp-hamburger { display: block; }
    .lp-hero { padding: 100px 0 64px; }
    .lp-mini-stats { grid-template-columns: repeat(2,1fr); }
    .lp-feature-grid { grid-template-columns: 1fr; border-radius: var(--radius-lg); }
    .lp-testimonials-grid { grid-template-columns: 1fr; }
    .lp-footer-grid { grid-template-columns: 1fr; }
    .lp-section { padding: 64px 0; }
  }
  @media (max-width: 480px) {
    .lp-hero-actions { flex-direction: column; align-items: stretch; }
    .lp-hero-actions .lp-btn { justify-content: center; }
    .lp-cta-actions { flex-direction: column; align-items: stretch; }
    .lp-cta-actions .lp-btn { justify-content: center; }
  }

  /* ── Login Modal ── */
  .lp-modal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,.45);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
    animation: lp-overlayIn .2s ease-out;
  }
  @keyframes lp-overlayIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .lp-modal {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: 0 24px 80px rgba(0,0,0,.18), 0 8px 24px rgba(0,0,0,.08);
    width: 100%; max-width: 420px;
    overflow: hidden;
    animation: lp-modalIn .3s ease-out;
  }
  @keyframes lp-modalIn {
    from { opacity: 0; transform: translateY(16px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .lp-modal-header {
    padding: 28px 28px 0;
    display: flex; align-items: center; justify-content: space-between;
  }
  .lp-modal-title {
    font-family: 'DM Serif Display', serif;
    font-size: 1.5rem; color: var(--text-1); font-weight: 400;
  }
  .lp-modal-close {
    width: 32px; height: 32px; border-radius: 8px;
    border: 1px solid var(--border); background: var(--bg);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text-2); transition: all .15s;
  }
  .lp-modal-close:hover { background: var(--white); color: var(--text-1); border-color: var(--border-2); }
  .lp-modal-body { padding: 24px 28px 28px; }
  .lp-modal-sub {
    font-size: 14px; color: var(--text-2); margin-bottom: 24px; line-height: 1.5;
  }
  .lp-field { margin-bottom: 16px; }
  .lp-label {
    display: block; font-size: 13px; font-weight: 600;
    color: var(--text-1); margin-bottom: 6px;
  }
  .lp-input-wrap {
    position: relative; display: flex; align-items: center;
  }
  .lp-input-icon {
    position: absolute; left: 12px; color: var(--text-3);
    display: flex; align-items: center; pointer-events: none;
  }
  .lp-input {
    width: 100%; height: 44px; padding: 0 14px 0 40px;
    border: 1px solid var(--border); border-radius: var(--radius-md);
    font-size: 14px; font-family: 'Inter', sans-serif;
    color: var(--text-1); background: var(--bg);
    outline: none; transition: border-color .15s, box-shadow .15s;
  }
  .lp-input::placeholder { color: var(--text-3); }
  .lp-input:focus {
    border-color: var(--green-600);
    box-shadow: 0 0 0 3px rgba(22,163,74,.1);
    background: var(--white);
  }
  .lp-input.has-error {
    border-color: var(--danger);
    box-shadow: 0 0 0 3px rgba(220,38,38,.08);
  }
  .lp-pw-toggle {
    position: absolute; right: 10px; background: none; border: none;
    cursor: pointer; color: var(--text-3); padding: 4px;
    display: flex; align-items: center; transition: color .15s;
  }
  .lp-pw-toggle:hover { color: var(--text-1); }
  .lp-error-box {
    display: flex; align-items: flex-start; gap: 8px;
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: var(--radius-sm); padding: 10px 14px;
    margin-bottom: 16px; font-size: 13px; color: #991b1b; line-height: 1.5;
  }
  .lp-error-box svg { flex-shrink: 0; margin-top: 1px; }
  .lp-submit-btn {
    width: 100%; height: 46px; border: none; border-radius: var(--radius-md);
    background: var(--green-900); color: #fff;
    font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 1px 3px rgba(20,83,45,.3);
    transition: all .15s;
  }
  .lp-submit-btn:hover:not(:disabled) {
    background: #0f3d1e; transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20,83,45,.3);
  }
  .lp-submit-btn:active:not(:disabled) { transform: translateY(0); }
  .lp-submit-btn:disabled { opacity: .6; cursor: not-allowed; }
  .lp-modal-footer {
    text-align: center; font-size: 13px; color: var(--text-2); margin-top: 20px;
  }
  .lp-modal-footer a {
    color: var(--green-700); font-weight: 600; text-decoration: none;
    transition: color .15s;
  }
  .lp-modal-footer a:hover { color: var(--green-900); }
  .lp-spinner { animation: lp-spin .6s linear infinite; }
  @keyframes lp-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  } 

  /* ── Forgot password link ── */
  .lp-forgot-row {
    display: flex;
    justify-content: flex-end;
    margin-top: -6px;
    margin-bottom: 16px;
  }
  .lp-forgot-link {
    font-size: 13px;
    color: var(--green-700);
    font-weight: 600;
    text-decoration: none;
    transition: color .15s;
  }
  .lp-forgot-link:hover { color: var(--green-900); }
`

/* ─── useIntersectionObserver hook ─────────────────────────────────── */
function useReveal(selector) {
  useEffect(() => {
    const elements = document.querySelectorAll(selector)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const el = entry.target
            const delay = el.dataset.delay || 0
            setTimeout(() => el.classList.add('visible'), Number(delay))
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.12 }
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [selector])
}

/* ─── Sub-components ────────────────────────────────────────────────── */

function BookIcon({ size = 13, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function CheckIcon({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="var(--green-700)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

const FEATURES = [
  {
    icon: <BookOpen size={20} stroke="var(--green-700)" fill="none" strokeWidth={1.75} />,
    title: 'Smart Cataloguing',
    desc: 'Manage your entire book inventory — ISBNs, authors, categories, and copy availability — with precision and speed.',
  },
  {
    icon: <Users size={20} stroke="var(--green-700)" fill="none" strokeWidth={1.75} />,
    title: 'Member Management',
    desc: 'Register patrons, manage their status, track borrowing history, and enforce institution-specific borrowing limits.',
  },
  {
    icon: <CheckSquare size={20} stroke="var(--green-700)" fill="none" strokeWidth={1.75} />,
    title: 'Loan Lifecycle',
    desc: 'Issue loans, track due dates, process returns, and automatically flag overdue items — with a full audit trail.',
  },
  {
    icon: <Calendar size={20} stroke="var(--green-700)" fill="none" strokeWidth={1.75} />,
    title: 'Reservation Queue',
    desc: 'Intelligent queue management automatically fulfils reservations when books become available — no manual intervention needed.',
  },
  {
    icon: <BarChart2 size={20} stroke="var(--green-700)" fill="none" strokeWidth={1.75} />,
    title: 'Analytics & Reporting',
    desc: 'Understand borrowing trends, popular titles, overdue patterns, and member activity with clean, actionable dashboards.',
  },
  {
    icon: <Lock size={20} stroke="var(--green-700)" fill="none" strokeWidth={1.75} />,
    title: 'Role-Based Access',
    desc: 'Distinct ADMIN and LIBRARIAN roles with fine-grained permission control. Every institution is fully isolated in the multi-tenant architecture.',
  },
]

const BENEFITS = [
  {
    icon: <Zap size={17} stroke="var(--green-700)" fill="none" strokeWidth={2} />,
    title: 'Automatic loan intelligence',
    desc: 'The system detects overdue loans, fulfils reservations when books return, and sends notifications — all without manual intervention.',
  },
  {
    icon: <Shield size={17} stroke="var(--green-700)" fill="none" strokeWidth={2} />,
    title: 'Institution-level security',
    desc: `Multi-tenant architecture ensures each institution's data is fully isolated. JWT auth with HttpOnly cookies and role-based access control.`,
  },
  {
    icon: <Globe size={17} stroke="var(--green-700)" fill="none" strokeWidth={2} />,
    title: 'Fast onboarding',
    desc: 'Three-step institution registration, email verification, and admin setup. Your library is operational in under 10 minutes.',
  },
  {
    icon: <Monitor size={17} stroke="var(--green-700)" fill="none" strokeWidth={2} />,
    title: 'Works on every device',
    desc: 'Fully responsive from mobile to desktop. Drawer navigation on small screens, permanent sidebar on large — always productive.',
  },
]

const STAT_CARDS = [
  {
    bg: 'var(--green-50)', iconStroke: 'var(--green-700)',
    icon: <Zap size={20} />,
    label: 'Reservations fulfilled', value: '97', unit: '%',
    trend: '↑ Automated daily', trendColor: 'var(--green-600)',
  },
  {
    bg: '#eff6ff', iconStroke: '#1e40af',
    icon: <Shield size={20} />,
    label: 'Institutions secured', value: '240', unit: '+',
    trend: 'Full isolation guaranteed', trendColor: '#1e40af',
  },
  {
    bg: '#fefce8', iconStroke: '#92400e',
    icon: <Users size={20} />,
    label: 'Active members managed', value: '52k', unit: '+',
    trend: 'Across all institutions', trendColor: '#92400e',
  },
  {
    bg: '#fdf4ff', iconStroke: '#7c3aed',
    icon: <Monitor size={20} />,
    label: 'Avg. onboarding time', value: '<10', unit: 'min',
    trend: 'From signup to operational', trendColor: '#7c3aed',
  },
]

const TESTIMONIALS = [
  {
    stars: '★★★★★',
    quote: '"BookSphere replaced a chaotic spreadsheet system we had used for years. The reservation queue alone saved us hours of manual work every week. The interface is genuinely calm — staff adapted in two days."',
    initials: 'FM', avatarBg: 'var(--green-900)',
    name: 'Fatuma Mwalimu', role: 'Head Librarian, University of Dar es Salaam',
  },
  {
    stars: '★★★★★',
    quote: '"The multi-tenant architecture gave our IT department complete confidence. Each faculty library operates independently, but we manage everything from a single admin view. Exactly what we needed."',
    initials: 'BK', avatarBg: '#1e40af',
    name: 'Benjamin Kimani', role: 'IT Director, Ardhi University',
  },
  {
    stars: '★★★★★',
    quote: '"Registration took nine minutes. By the end of the day we had all our books catalogued and the first loans issued. The automatic overdue detection removed a task we genuinely dreaded every Monday."',
    initials: 'CN', avatarBg: '#7c3aed',
    name: 'Celestine Nkemdirim', role: 'Senior Librarian, COSTECH',
  },
]

/* ─── Main Component ────────────────────────────────────────────────── */
export function LoginPage() {
  const navigate = useNavigate()
  const authLogin = useAuthStore((s) => s.login)

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  /* ── Login Modal state ── */
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const emailRef = useRef(null)

  /* Focus email input when modal opens */
  useEffect(() => {
    if (showLogin && emailRef.current) {
      setTimeout(() => emailRef.current.focus(), 80)
    }
  }, [showLogin])

  /* Close modal on Escape key */
  useEffect(() => {
    if (!showLogin) return
    const handler = (e) => { if (e.key === 'Escape') setShowLogin(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showLogin])

  /* Lock body scroll when modal is open */
  useEffect(() => {
    document.body.style.overflow = showLogin ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showLogin])

  const openLogin = () => {
    setLoginError('')
    setEmail('')
    setPassword('')
    setShowPw(false)
    setShowLogin(true)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const res = await authApi.login({ email, password })
      const { accessToken, user: rawUser } = res.data.data
      const user = {
        ...rawUser,
        username: rawUser?.username || rawUser?.Username || rawUser?.name || 'User',
      }
      authLogin(accessToken, user)
      setShowLogin(false)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Invalid email or password. Please try again.'
      setLoginError(msg)
    } finally {
      setLoginLoading(false)
    }
  }

  /* Navbar scroll */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  /* Close mobile menu on outside click */
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      const menu = document.getElementById('lp-mobile-menu')
      const hamburger = document.getElementById('lp-hamburger')
      if (menu && hamburger && !menu.contains(e.target) && !hamburger.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menuOpen])

  /* Scroll-triggered reveals */
  useReveal('.lp-feature-card')
  useReveal('.lp-benefit-item')
  useReveal('.lp-stat-card-lg')
  useReveal('.lp-testimonial-card')

  return (
    <div className="lp-root">
      <style>{css}</style>

      {/* ── Navbar ── */}
      <nav className={`lp-navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <Link to="/" className="lp-brand">
            <div className="lp-brand-icon"><BookIcon size={18} /></div>
            <span className="lp-brand-name lp-serif">BookSphere</span>
          </Link>

          <ul className="lp-nav-links">
            {['features', 'showcase', 'benefits', 'testimonials'].map((id) => (
              <li key={id}>
                <a href={`#${id}`}>{id.charAt(0).toUpperCase() + id.slice(1)}</a>
              </li>
            ))}
          </ul>

          <div className="lp-nav-actions">
            <button onClick={openLogin} className="lp-btn lp-btn-ghost lp-nav-hide">Sign in</button>
            <Link to="/register" className="lp-btn lp-btn-primary">Get started</Link>
            <button
              id="lp-hamburger"
              className="lp-hamburger"
              aria-label="Open menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      <div id="lp-mobile-menu" className={`lp-mobile-menu${menuOpen ? ' open' : ''}`}>
        {['features', 'showcase', 'benefits', 'testimonials'].map((id) => (
          <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </a>
        ))}
        <a href="#" onClick={(e) => { e.preventDefault(); setMenuOpen(false); openLogin() }} style={{ color: 'var(--text-1)' }}>Sign in</a>
        <Link to="/register" className="lp-btn lp-btn-primary lp-mobile-cta" onClick={() => setMenuOpen(false)}>
          Get started →
        </Link>
      </div>

      {/* ── Hero ── */}
      <section id="hero" className="lp-hero">
        <div className="lp-container">
          <div className="lp-hero-grid">
            {/* Left copy */}
            <div>
              <div className="lp-hero-badge lp-fade-up">Library Intelligence Platform</div>
              <h1 className="lp-hero-title lp-fade-up lp-delay-1">
                The <em>modern</em> library<br />your institution deserves
              </h1>
              <p className="lp-hero-sub lp-fade-up lp-delay-2">
                BookSphere brings calm, precision, and intelligence to institutional library operations.
                Manage catalogues, members, loans, and reservations — all in one elegant system.
              </p>
              <div className="lp-hero-actions lp-fade-up lp-delay-3">
                <Link to="/register" className="lp-btn lp-btn-primary lp-btn-lg">
                  <ArrowDown size={16} /> Start free trial
                </Link>
                <a href="#showcase" className="lp-btn lp-btn-outline lp-btn-lg">
                  <Play size={16} /> View demo
                </a>
              </div>
              <div className="lp-hero-trust lp-fade-up lp-delay-4">
                <div className="lp-hero-avatars">
                  {['AJ', 'BM', 'CK', 'DL'].map((i) => (
                    <div key={i} className="lp-hero-avatar">{i}</div>
                  ))}
                </div>
                <p className="lp-hero-trust-text">Trusted by 240+ libraries across East Africa</p>
              </div>
            </div>

            {/* Right: dashboard preview */}
            <div className="lp-fade-up lp-delay-2">
              <div className="lp-preview-frame">
                <div className="lp-preview-topbar">
                  <div className="lp-preview-dot" style={{ background: '#ff5f56' }} />
                  <div className="lp-preview-dot" style={{ background: '#febc2e' }} />
                  <div className="lp-preview-dot" style={{ background: '#27c840' }} />
                </div>
                <div className="lp-preview-content">
                  <div className="lp-mini-stats">
                    {[
                      { label: 'Books', value: '1,842', sub: '↑ 12 this week' },
                      { label: 'Members', value: '384', sub: '↑ 5 new today' },
                      { label: 'Active Loans', value: '127', sub: 'Across 94 members' },
                      { label: 'Overdue', value: '9', sub: 'Reminders sent', danger: true },
                    ].map((s) => (
                      <div key={s.label} className="lp-mini-stat">
                        <div className="lp-mini-stat-label">{s.label}</div>
                        <div className="lp-mini-stat-value" style={s.danger ? { color: 'var(--danger)' } : {}}>
                          {s.value}
                        </div>
                        <div className="lp-mini-stat-sub">{s.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div className="lp-mini-table-wrap">
                    <div className="lp-mini-table-header">
                      <span>Recent Loans</span>
                      <span style={{ color: 'var(--green-600)', fontWeight: 600, cursor: 'pointer' }}>View all</span>
                    </div>
                    {[
                      { title: 'Clean Code', sub: 'Amina Juma · Due Jun 3', badge: 'badge-green', label: 'Active' },
                      { title: 'The Pragmatic Programmer', sub: 'Baraka Ndege · Due May 28', badge: 'badge-yellow', label: 'Due soon' },
                      { title: 'Design Patterns', sub: 'Chidi Okafor · Overdue', badge: 'badge-red', label: 'Late' },
                      { title: 'Refactoring', sub: 'Dahlia Mwangi · Due Jun 10', badge: 'badge-green', label: 'Active' },
                    ].map((row) => (
                      <div key={row.title} className="lp-mini-row">
                        <div>
                          <div className="lp-mini-row-title">{row.title}</div>
                          <div className="lp-mini-row-sub">{row.sub}</div>
                        </div>
                        <span className={`lp-badge lp-${row.badge}`}>{row.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trusted By ── */}
      <section className="lp-trusted">
        <div className="lp-container">
          <p className="lp-trusted-label">Trusted by leading institutions</p>
          <div className="lp-trusted-logos">
            {['University of Dar es Salaam', 'Ardhi University', 'State House Library',
              'Open University', 'COSTECH', 'Sokoine University'].map((name) => (
              <span key={name} className="lp-trusted-logo lp-serif">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="lp-section lp-features">
        <div className="lp-container">
          <div className="lp-features-header">
            <div className="lp-section-tag">Platform capabilities</div>
            <h2 className="lp-section-title">Everything a modern library needs</h2>
            <p className="lp-section-sub">
              A complete management platform built specifically for institutions — not bolted together from general tools.
            </p>
          </div>
          <div className="lp-feature-grid">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="lp-feature-card"
                data-delay={i * 70}
              >
                <div className="lp-feature-icon">{f.icon}</div>
                <div className="lp-feature-title">{f.title}</div>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard Showcase ── */}
      <section id="showcase" className="lp-section lp-showcase">
        <div className="lp-container">
          <div className="lp-showcase-inner">
            <div>
              <div className="lp-section-tag">Management console</div>
              <h2 className="lp-section-title">A dashboard built for clarity</h2>
              <p className="lp-section-sub" style={{ marginBottom: 32 }}>
                Every screen is designed to help your librarians work efficiently — with the right information, at the right moment. No clutter. No confusion.
              </p>
              <ul className="lp-check-list">
                {[
                  'Permanent sidebar on desktop, drawer on mobile',
                  'Skeleton loading states for all heavy data screens',
                  'Inline search, filtering, and pagination across all tables',
                  'Silent JWT refresh — sessions stay alive without interruption',
                ].map((item) => (
                  <li key={item} className="lp-check-item">
                    <div className="lp-check-bullet"><CheckIcon /></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mini dashboard frame */}
            <div className="lp-showcase-frame">
              <div className="lp-preview-topbar">
                <div className="lp-preview-dot" style={{ background: '#ff5f56' }} />
                <div className="lp-preview-dot" style={{ background: '#febc2e' }} />
                <div className="lp-preview-dot" style={{ background: '#27c840' }} />
              </div>
              <div className="lp-showcase-frame-inner">
                {/* Sidebar */}
                <div className="lp-showcase-sidebar">
                  <div className="lp-sidebar-brand">
                    <div className="lp-sidebar-brand-icon"><BookIcon size={13} /></div>
                    <span className="lp-sidebar-brand-name lp-serif">BookSphere</span>
                  </div>
                  {[
                    { label: 'Dashboard', active: true },
                    { label: 'Books' },
                    { label: 'Members' },
                    { label: 'Loans' },
                    { label: 'Reservations' },
                  ].map((item) => (
                    <div key={item.label} className={`lp-sidebar-nav-item${item.active ? ' active' : ''}`}>
                      {item.label}
                    </div>
                  ))}
                </div>
                {/* Main */}
                <div className="lp-showcase-main">
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12 }}>Overview</div>
                  <div className="lp-showcase-stat-row">
                    <div className="lp-showcase-stat">
                      <div className="lp-showcase-stat-lbl">Total Books</div>
                      <div className="lp-showcase-stat-val">1,842</div>
                    </div>
                    <div className="lp-showcase-stat">
                      <div className="lp-showcase-stat-lbl">Members</div>
                      <div className="lp-showcase-stat-val">384</div>
                    </div>
                  </div>
                  <div className="lp-showcase-stat-row">
                    <div className="lp-showcase-stat">
                      <div className="lp-showcase-stat-lbl">Active Loans</div>
                      <div className="lp-showcase-stat-val">127</div>
                    </div>
                    <div className="lp-showcase-stat">
                      <div className="lp-showcase-stat-lbl">Overdue</div>
                      <div className="lp-showcase-stat-val" style={{ color: 'var(--danger)' }}>9</div>
                    </div>
                  </div>
                  <div className="lp-showcase-table">
                    <div className="lp-showcase-table-head">
                      <span style={{ flex: 1 }}>Book</span>
                      <span>Status</span>
                    </div>
                    {[
                      { title: 'Clean Code', sub: 'R. Martin', badge: 'badge-green', label: 'Active' },
                      { title: 'Pragmatic Programmer', sub: 'Hunt, Thomas', badge: 'badge-yellow', label: 'Due soon' },
                      { title: 'Design Patterns', sub: 'Gang of Four', badge: 'badge-red', label: 'Late' },
                    ].map((row) => (
                      <div key={row.title} className="lp-showcase-row">
                        <div className="lp-col-title">
                          {row.title}
                          <div className="lp-col-sub">{row.sub}</div>
                        </div>
                        <span className={`lp-badge lp-${row.badge}`} style={{ fontSize: 9 }}>{row.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section id="benefits" className="lp-section lp-benefits">
        <div className="lp-container">
          <div className="lp-benefits-grid">
            <div>
              <div className="lp-section-tag">Why BookSphere</div>
              <h2 className="lp-section-title">Designed for how libraries actually work</h2>
              <p className="lp-section-sub" style={{ marginBottom: 40 }}>
                Built by people who understand the rhythms of institutional library management. Not a generic tool adapted for libraries.
              </p>
              <ul className="lp-benefit-list">
                {BENEFITS.map((b, i) => (
                  <li key={b.title} className="lp-benefit-item" data-delay={i * 80}>
                    <div className="lp-benefit-bullet">{b.icon}</div>
                    <div>
                      <div className="lp-benefit-title">{b.title}</div>
                      <p className="lp-benefit-desc">{b.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lp-benefit-visual">
              {STAT_CARDS.map((s, i) => (
                <div key={s.label} className="lp-stat-card-lg" data-delay={i * 80}>
                  <div className="lp-stat-icon-circle" style={{ background: s.bg }}>
                    <span style={{ color: s.iconStroke, display: 'flex' }}>{s.icon}</span>
                  </div>
                  <div>
                    <div className="lp-stat-card-label">{s.label}</div>
                    <div className="lp-stat-card-value">
                      {s.value}
                      <span style={{ fontSize: 16, color: 'var(--text-2)' }}>{s.unit}</span>
                    </div>
                    <div className="lp-stat-trend" style={{ color: s.trendColor }}>{s.trend}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="lp-section lp-testimonials">
        <div className="lp-container">
          <div style={{ marginBottom: 56 }}>
            <div className="lp-section-tag">Customer voices</div>
            <h2 className="lp-section-title">What librarians say</h2>
          </div>
          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <article key={t.name} className="lp-testimonial-card" data-delay={i * 100}>
                <div className="lp-testimonial-stars">{t.stars}</div>
                <blockquote className="lp-testimonial-quote">{t.quote}</blockquote>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar" style={{ background: t.avatarBg }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="lp-testimonial-name">{t.name}</div>
                    <div className="lp-testimonial-role">{t.role}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <div className="lp-cta-inner lp-container">
          <p className="lp-cta-tag">Get started today</p>
          <h2 className="lp-cta-title">Ready to modernise your library?</h2>
          <p className="lp-cta-sub">
            Join hundreds of institutions already running on BookSphere. Register in minutes, no credit card required.
          </p>
          <div className="lp-cta-actions">
            <Link to="/register" className="lp-btn lp-btn-white lp-btn-lg">Start free trial →</Link>
            <button onClick={openLogin} className="lp-btn lp-btn-ghost-white lp-btn-lg">Sign into your account</button>
          </div>
          <p className="lp-cta-note">Free for institutions under 500 members · No setup fees · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div>
              <div className="lp-footer-brand-name lp-serif">BookSphere</div>
              <p className="lp-footer-brand-desc">
                Institutional library management built for the modern era. Elegant, reliable, and designed for Africa's leading universities and organisations.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <a href="#" className="lp-btn lp-btn-ghost" style={{ height: 36, padding: '0 14px', fontSize: 13 }}>
                  <Twitter size={14} /> Twitter
                </a>
                <a href="#" className="lp-btn lp-btn-ghost" style={{ height: 36, padding: '0 14px', fontSize: 13 }}>
                  <Linkedin size={14} /> LinkedIn
                </a>
              </div>
            </div>

            {[
              {
                title: 'Platform',
                links: [
                  { label: 'Features', href: '#features' },
                  { label: 'Dashboard', href: '#showcase' },
                  { label: 'Benefits', href: '#benefits' },
                  { label: 'Register institution', href: '/register', internal: true },
                ],
              },
              {
                title: 'Resources',
                links: [
                  { label: 'Documentation', href: '#' },
                  { label: 'API Reference', href: '#' },
                  { label: 'System status', href: '#' },
                  { label: 'Changelog', href: '#' },
                ],
              },
              {
                title: 'Company',
                links: [
                  { label: 'About us', href: '#' },
                  { label: 'Contact', href: '#' },
                  { label: 'Privacy policy', href: '#' },
                  { label: 'Terms of service', href: '#' },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <div className="lp-footer-col-title">{col.title}</div>
                <ul className="lp-footer-links">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.internal
                        ? <Link to={l.href}>{l.label}</Link>
                        : <a href={l.href}>{l.label}</a>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lp-footer-bottom">
            <p className="lp-footer-copy">© 2026 BookSphere. All rights reserved.</p>
            <div className="lp-footer-legal">
              {['Privacy', 'Terms', 'Accessibility', 'Compliance'].map((l) => (
                <a key={l} href="#">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
      {/* ── Login Modal ── */}
      {showLogin && (
        <div className="lp-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowLogin(false) }}>
          <div className="lp-modal">
            <div className="lp-modal-header">
              <h2 className="lp-modal-title">Welcome back</h2>
              <button className="lp-modal-close" onClick={() => setShowLogin(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="lp-modal-body">
              <p className="lp-modal-sub">Sign in to your BookSphere account to continue managing your library.</p>

              {loginError && (
                <div className="lp-error-box">
                  <AlertCircle size={16} />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="lp-field">
                  <label className="lp-label" htmlFor="login-email">Email address</label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon"><Mail size={16} /></span>
                    <input
                      ref={emailRef}
                      id="login-email"
                      type="email"
                      className={`lp-input${loginError ? ' has-error' : ''}`}
                      placeholder="you@institution.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    /> 

                  </div>
                </div>

                <div className="lp-field">
                  <label className="lp-label" htmlFor="login-password">Password</label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon"><Lock size={16} /></span>
                    <input
                      id="login-password"
                      type={showPw ? 'text' : 'password'}
                      className={`lp-input${loginError ? ' has-error' : ''}`}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      style={{ paddingRight: 42 }}
                    />
                    <button type="button" className="lp-pw-toggle" onClick={() => setShowPw((v) => !v)} tabIndex={-1} aria-label="Toggle password visibility">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

<div className="lp-forgot-row">
  <Link
    to="/forgot-password"
    className="lp-forgot-link"
    onClick={() => setShowLogin(false)}
  >
    Forgot password?
  </Link> 
  
</div>
                <button type="submit" className="lp-submit-btn" disabled={loginLoading}>
                  {loginLoading ? (
                    <><Loader2 size={18} className="lp-spinner" /> Signing in…</>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>

              <p className="lp-modal-footer">
                Don't have an account? <Link to="/register" onClick={() => setShowLogin(false)}>Register your institution</Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
//end of file