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
    Menu,
    Wrench,
    CalendarClock, // Added for MaintainShowcase
    Cpu, // Added for MaintainShowcase
    PackageCheck // Added for MaintainShowcase
} from 'lucide-react';
import NexHaulLogo from '@/components/NexHaulLogo';
import ProductShowcase from './ProductShowcase';
import MaintainShowcase from './MaintainShowcase';
import { useAuth } from '@/hooks/useAuth';
import './landing.css';
import { useRouter } from 'next/navigation';

interface LandingPageProps {
    onLogin: () => void;
    onRegister: () => void;
}

export default function LandingPage({ onLogin, onRegister }: LandingPageProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, profile, availableProfiles, loading } = useAuth();
    const router = useRouter();

    const handleDashboardRedirect = () => {
        if (availableProfiles?.length > 1) {
            onLogin(); // Parent handles view switching
            return;
        }

        if (profile) {
            const isPlatform = profile.type === 'platform';
            router.push(isPlatform ? '/nexhaul' : '/dashboard');
        } else {
            router.push('/dashboard');
        }
    };

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
                    <a href="#problem" onClick={() => setMobileMenuOpen(false)}>Solution</a>
                    <a href="#ecosystem" onClick={() => setMobileMenuOpen(false)}>Ecosystem</a>
                    <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>

                    {!loading && user ? (
                        <button className="btn-nav-create" onClick={handleDashboardRedirect}>Dashboard</button>
                    ) : (
                        <>
                            <button className="btn-nav-login" onClick={() => handleNavAction(onLogin)}>Login</button>
                            <button className="btn-nav-create" onClick={() => handleNavAction(onRegister)}>Create Account</button>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-glow"></div>
                <div className="hero-content">
                    <div className="badge">NexHaul Ecosystem</div>
                    <h1>Smart Logistics & Asset Maintenance for Critical Industries</h1>
                    <p>
                        The all-in-one mission control for internal teams and service providers
                        managing fuel, asset health, and maintenance for Telecom towers,
                        Data Centers, and high-stakes infrastructure.
                    </p>
                    <div className="hero-actions">
                        {!loading && user ? (
                            <button className="btn-primary" onClick={handleDashboardRedirect}>
                                Back to Dashboard <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                            </button>
                        ) : (
                            <>
                                <button className="btn-primary" onClick={onRegister}>
                                    Start Free Trial <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                                </button>
                                <button className="btn-secondary" onClick={onLogin}>
                                    Live Demo
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* PROBLEM / SOLUTION 1: INFRA-SUPPLY */}
            <section id="problem" className="comparison-section">
                <div className="section-header">
                    <div className="category-badge">Logistics & Supply</div>
                    <h2>The InfraSupply Solution</h2>
                    <p>Stop the bleeding in your fuel and supply chain management.</p>
                </div>

                <div className="comparison-grid">
                    <div className="comparison-card problem">
                        <div className="card-title red">
                            <X size={24} style={{ flexShrink: 0 }} /> Reactive Supply Chain
                        </div>
                        <ul className="comparison-list">
                            <li><Shield size={20} /> Untracked fuel leakage & unverified drops</li>
                            <li><Clock size={20} /> Weeks-long delay in manual reconciliation</li>
                            <li><FileText size={20} /> Lost waybills and unsearchable paper trails</li>
                            <li><Lock size={20} /> Zero real-time visibility on driver movement</li>
                        </ul>
                    </div>

                    <div className="comparison-card solution" id="features">
                        <div className="card-title green">
                            <Zap size={24} style={{ flexShrink: 0 }} /> The NexHaul Fix
                        </div>
                        <ul className="comparison-list">
                            <li><Shield size={20} /> Digital Proof of Delivery with secure verification</li>
                            <li><Clock size={20} /> Instant, period-based automated reconciliation</li>
                            <li><FileText size={20} /> Centralized cloud storage for every dispatch</li>
                            <li><Users size={20} /> Live tracking & role-based data isolation</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Product Showcase: InfraSupply */}
            <ProductShowcase />

            {/* PROBLEM / SOLUTION 2: MAINTENANCE */}
            <section className="comparison-section alt-bg">
                <div className="section-header">
                    <div className="category-badge maintain">Operations & Maintenance</div>
                    <h2>The NexHaul Maintain Solution</h2>
                    <p>Break the cycle of reactive maintenance and equipment failure.</p>
                </div>

                <div className="comparison-grid">
                    <div className="comparison-card problem">
                        <div className="card-title red">
                            <Clock size={24} style={{ flexShrink: 0 }} /> Fragmented Operations
                        </div>
                        <ul className="comparison-list">
                            <li><CalendarClock size={20} /> Reactive maintenance (fixing only on failure)</li>
                            <li><Users size={20} /> Unmonitored field activities & unverified reports</li>
                            <li><Cpu size={20} /> Fragmented asset history buried in Excel files</li>
                            <li><PackageCheck size={20} /> Unverified usage of expensive spare parts</li>
                        </ul>
                    </div>

                    <div className="comparison-card solution">
                        <div className="card-title purple">
                            <Wrench size={24} style={{ flexShrink: 0 }} /> Predictive Operations
                        </div>
                        <ul className="comparison-list">
                            <li><CalendarClock size={20} /> Proactive PM Scheduling with health alerts</li>
                            <li><Users size={20} /> Digital Work Orders with verified task reporting</li>
                            <li><Cpu size={20} /> Automated Central Asset Health Registry</li>
                            <li><PackageCheck size={20} /> Granular tracking of maintenance materials</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Product Showcase: Maintain */}
            <MaintainShowcase />

            {/* Ecosystem Section */}
            <section className="ecosystem-section" id="ecosystem">
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

                    <div className="ecosystem-card active maintain">
                        <div className="status-badge active">Active</div>
                        <Wrench size={32} />
                        <h3>NexHaul Maintain</h3>
                        <p>Streamlined PM scheduling and work order automation for remote assets across IT, Telecoms, and Data Centers.</p>
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

            {/* Pricing Section */}
            <section id="pricing" className="pricing-section">
                <div className="section-header">
                    <h2>Simple, Transparent Pricing</h2>
                    <p>Choose the plan that fits your logistics operation.</p>
                </div>

                <div className="pricing-grid">
                    <div className="pricing-card">
                        <div className="trial-badge">21 Days Free</div>
                        <div className="plan-name">Small Business</div>
                        <div className="plan-price">
                            <span className="currency">₦</span>25,000<span className="period">/mo</span>
                        </div>
                        <p className="plan-desc">For growing operations managing multiple teams and sites.</p>
                        <button className="btn-pricing outline" onClick={onRegister}>Get Started</button>
                        <ul className="features-list">
                            <li><Check size={18} /> Up to 7 Teams & Clusters</li>
                            <li><Check size={18} /> Up to 7 Clients & Sites</li>
                            <li><Check size={18} /> Live Tracking Included</li>
                            <li><Check size={18} /> Basic Document Access</li>
                            <li><Check size={18} /> Standard Support</li>
                        </ul>
                    </div>

                    <div className="pricing-card featured">
                        <div className="trial-badge">Most Popular</div>
                        <div className="plan-name">Enterprise / Teams</div>
                        <div className="plan-price">
                            <span className="currency">₦</span>40,000<span className="period">/mo</span>
                        </div>
                        <p className="plan-desc">Unlimited scale for large logistics companies and critical infra.</p>
                        <button className="btn-pricing solid" onClick={onRegister}>Start Free Trial</button>
                        <ul className="features-list">
                            <li><Check size={18} /> <strong>Unlimited</strong> Teams & Clusters</li>
                            <li><Check size={18} /> <strong>Unlimited</strong> Clients & Sites</li>
                            <li><Check size={18} /> Advanced Period Reconciliation</li>
                            <li><Check size={18} /> Full Document Audit Centre</li>
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
