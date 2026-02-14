"use client";

import React, { useState } from 'react';
import {
    Truck,
    Shield,
    Zap,
    Check,
    X,
    ArrowRight,
    FileText,
    Users,
    Lock,
    Clock,
    Menu
} from 'lucide-react';
import NexHaulLogo from '@/components/NexHaulLogo';
import ProductShowcase from './ProductShowcase';
import './landing.css';

interface LandingPageProps {
    onLogin: () => void;
    onRegister: () => void;
}

export default function LandingPage({ onLogin, onRegister }: LandingPageProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);

    const handleNavAction = (action: () => void) => {
        setMobileMenuOpen(false);
        action();
    };

    return (
        <div className="landing-container">
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="nav-logo">
                    <NexHaulLogo size={32} />
                </div>

                <button className="mobile-menu-toggle" onClick={toggleMenu} aria-label="Toggle Menu">
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                    <a href="#problem" onClick={() => setMobileMenuOpen(false)}>The Problem</a>
                    <a href="#features" onClick={() => setMobileMenuOpen(false)}>Solution</a>
                    <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                    <button className="btn-nav-login" onClick={() => handleNavAction(onLogin)}>Login</button>
                    <button className="btn-nav-create" onClick={() => handleNavAction(onRegister)}>Create Account</button>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-glow"></div>
                <div className="hero-content">
                    <div className="badge">NexHaul InfraSupply</div>
                    <h1>Smart Fuel & Asset Tracking for Critical Sites</h1>
                    <p>
                        The ultimate solution for internal teams and service providers
                        managing fuel, diesel, and maintenance logistics for Telecom towers,
                        IT hubs, and critical infrastructure.
                    </p>
                    <div className="hero-actions">
                        <button className="btn-primary" onClick={onRegister}>
                            Start Free Trial <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                        </button>
                        <button className="btn-secondary" onClick={onLogin}>
                            Live Demo
                        </button>
                    </div>
                </div>
            </header>

            {/* Problem vs Solution Section */}
            <section id="problem" className="comparison-section">
                <div className="section-header">
                    <h2>Why NexHaul InfraSupply?</h2>
                    <p>Whether you are an internal department or a service provider, managing remote assets is complex. We made it effortless.</p>
                </div>
                {/* ... (comparison-grid content stays the same) ... */}
                <div className="comparison-grid">
                    <div className="comparison-card problem">
                        <div className="card-title red">
                            <X size={24} /> The Problem
                        </div>
                        <ul className="comparison-list">
                            <li><Shield size={20} /> Untracked fuel leakage and shortages</li>
                            <li><Clock size={20} /> Manual reconciliation delays (days/weeks)</li>
                            <li><FileText size={20} /> Lost waybills and paper trail issues</li>
                            <li><Lock size={20} /> Zero transparency on driver activities</li>
                        </ul>
                    </div>

                    <div className="comparison-card solution" id="features">
                        <div className="card-title green">
                            <Zap size={24} /> The NexHaul Fix
                        </div>
                        <ul className="comparison-list">
                            <li><Shield size={20} /> Real-time dispensing and asset tracking</li>
                            <li><Clock size={20} /> Automated period-based reconciliation</li>
                            <li><FileText size={20} /> Digital waybills and secure signatures</li>
                            <li><Users size={20} /> Full audit trails and role-based privacy</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Ecosystem Section */}
            <section className="ecosystem-section" id="use-cases">
                <div className="section-header">
                    <h2>The NexHaul Ecosystem</h2>
                    <p>Specialized tracking solutions for every industry that moves high-value product.</p>
                </div>

                <div className="ecosystem-grid">
                    <div className="ecosystem-card active">
                        <div className="status-badge active">Active</div>
                        <Zap size={32} />
                        <h3>InfraSupply</h3>
                        <p>For internal logistics teams or providers servicing Telecom, IT, and Data Centers.</p>
                    </div>

                    <div className="ecosystem-card coming-soon">
                        <div className="status-badge">Coming Soon</div>
                        <Truck size={32} />
                        <h3>Oil & Gas Downstream</h3>
                        <p>Bulk distribution to filling stations and industrial fuel dumps.</p>
                    </div>

                    <div className="ecosystem-card coming-soon">
                        <div className="status-badge">Coming Soon</div>
                        <Check size={32} />
                        <h3>Construction & Infra</h3>
                        <p>Track fuel for excavators and machinery at massive remote projects.</p>
                    </div>

                    <div className="ecosystem-card coming-soon">
                        <div className="status-badge">Coming Soon</div>
                        <Zap size={32} />
                        <h3>Mining & Quarrying</h3>
                        <p>Manage explosives and fuel distribution in high-stakes environments.</p>
                    </div>

                    <div className="ecosystem-card coming-soon">
                        <div className="status-badge">Coming Soon</div>
                        <Users size={32} />
                        <h3>3PL Fleet Managers</h3>
                        <p>Proof-of-delivery tools for small fleets sub-contracting for major firms.</p>
                    </div>
                </div>
            </section>

            {/* Product Showcase */}
            <ProductShowcase />

            {/* Pricing Section */}
            <section id="pricing" className="pricing-section">
                <div className="section-header">
                    <h2>Simple, Transparent Pricing</h2>
                    <p>Choose the plan that fits your logistics operation.</p>
                </div>

                <div className="pricing-grid">
                    <div className="pricing-card">
                        <div className="trial-badge">1 Month Free</div>
                        <div className="plan-name">Small Business</div>
                        <div className="plan-price">
                            <span className="currency">₦</span>25,000<span className="period">/mo</span>
                        </div>
                        <p className="plan-desc">For individual operators managing small fleets.</p>
                        <button className="btn-pricing outline" onClick={onRegister}>Get Started</button>
                        <ul className="features-list">
                            <li><Check size={18} /> Manage up to 5 Teams</li>
                            <li><Check size={18} /> Basic Reconciliation</li>
                            <li><Check size={18} /> Digital Logbook</li>
                            <li><Check size={18} /> Standard Support</li>
                        </ul>
                    </div>

                    <div className="pricing-card featured">
                        <div className="trial-badge">1 Month Free</div>
                        <div className="plan-name">Enterprise / Teams</div>
                        <div className="plan-price">
                            <span className="currency">₦</span>40,000<span className="period">/mo</span>
                        </div>
                        <p className="plan-desc">For large logistics companies with multiple clusters.</p>
                        <button className="btn-pricing solid" onClick={onRegister}>Start Free Trial</button>
                        <ul className="features-list">
                            <li><Check size={18} /> Manage up to 20 Teams</li>
                            <li><Check size={18} /> Advanced Period Reconciliation</li>
                            <li><Check size={18} /> Full Document Centre Audit</li>
                            <li><Check size={18} /> Priority 24/7 Support</li>
                            <li><Check size={18} /> Multi-Cluster Analytics</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '4rem 5%', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <div className="footer-logo">
                    <NexHaulLogo size={32} />
                </div>
                <div style={{ marginBottom: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    NexHaul InfraSupply • <span style={{ opacity: 0.6 }}>NexHaul for Oil & Gas • NexHaul for Construction • NexHaul for Mining (Coming Soon)</span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    &copy; {new Date().getFullYear()} Sellytics. All rights reserved. Built for modern haulage.
                </p>
            </footer>
        </div>
    );
}
