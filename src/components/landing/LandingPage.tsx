"use client";

import React, { useState } from 'react';
import Link from 'next/link';
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
    CalendarClock,
    Cpu,
    PackageCheck,
    Mail,
    MapPin,
    MessageSquare,
    Play,
    MessageCircle,
    History,
    HeartPulse,
    MousePointerClick,
    ChevronDown,
    ChevronUp,
    LineChart,
    HelpCircle
} from 'lucide-react';
import NexHaulLogo from '@/components/NexHaulLogo';
import ProductShowcase from './ProductShowcase';
import MaintainShowcase from './MaintainShowcase';
import FeatureVideoSection from './FeatureVideoSection';
import DigitalWaybillDemo from './DigitalWaybillDemo';
import Modal from '@/components/Modal/Modal';
import { useAuth } from '@/hooks/useAuth';
import './landing.css';
import { useRouter } from 'next/navigation';

interface LandingPageProps {
    onLogin: () => void;
    onRegister: () => void;
}

const FAQS = [
    {
        question: "How does NexHaul help eliminate fuel theft in Nigeria?",
        answer: "NexHaul provides tamper-proof digital verification for every fuel drop. By using geo-fenced proof of work and real-time reconciliation, we ensure that every liter dispatched is actually delivered to the site, eliminating the 'lost in transit' issue common in paper-based systems."
    },
    {
        question: "How do I set up my team and staff on NexHaul?",
        answer: "Inviting your team is simple. Use the Staff Management section to add employees and assign them specific roles like Admin, Cluster Manager, or Field Engineer. This ensures everyone sees only the data relevant to their specific tasks."
    },
    {
        question: "How do I create and manage site clusters?",
        answer: "Clusters allow you to group sites (like telecoms towers) by region or category. You can easily create a cluster, assign it to a manager, and manage dispatches and work orders for all sites within that specific group for better organization."
    },
    {
        question: "Can I track my cargo and fuel movements live?",
        answer: "Yes! The InfraSupply module features a live tracking dashboard. You can see your active trips on a map, monitor driver progress, and get instant updates as they move between your warehouse and the destination sites."
    },
    {
        question: "How does automated supply reconciliation work?",
        answer: "When supplies are delivered, the site team signs off via the app. NexHaul instantly compares the quantity sent from the hub with the quantity received at the site. If there is a mismatch, the system flags it immediately for your review."
    },
    {
        question: "What is the difference between NexHaul and Sellytics?",
        answer: "NexHaul is our platform for logistics visibility and field service (Maintain). Sellytics Retail Intelligence is our parent platform for multi-channel retail inventory. Together, they provide a full-spectrum supply chain solution."
    },
    {
        question: "How does the Automated Work Order system work?",
        answer: "Our 'NexHaul Maintain' module monitors asset health. It automatically predicts when an asset is due for service, triggers a work order, and alerts the cluster engineer responsible, ensuring your critical infrastructure stays online."
    }
];

export default function LandingPage({ onLogin, onRegister }: LandingPageProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
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

    const [scrolled, setScrolled] = useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);

    const handleNavAction = (action: () => void) => {
        setMobileMenuOpen(false);
        action();
    };

    return (
        <div className="landing-container">
            {/* Navbar */}
            <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-logo">
                    <NexHaulLogo size={32} />
                </div>

                <button className="mobile-menu-toggle" onClick={toggleMenu} aria-label="Toggle Menu">
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                    <a href="#problem" onClick={() => setMobileMenuOpen(false)}>Solution</a>
                    <Link href="/academy" onClick={() => setMobileMenuOpen(false)}>Academy</Link>
                    <a href="#ecosystem" onClick={() => setMobileMenuOpen(false)}>Ecosystem</a>
                    <a href="#faqs" onClick={() => setMobileMenuOpen(false)}>FAQs</a>
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
                    <div className="badge">Next-Gen Logistics Visibility</div>
                    <h1>Stop the Bleeding. Get 100% Field Service Management Visibility.</h1>
                    <p>
                        Eliminate fuel leakage, automate <strong>digital waybills</strong>, and verify maintenance tasks in real-time.
                        The all-in-one <strong>logistics tracking platform</strong> for Telecom, Data Centers, and Fleet operations in Nigeria.
                    </p>
                    <div className="hero-actions">
                        {!loading && user ? (
                            <button className="btn-primary" onClick={handleDashboardRedirect}>
                                Back to Dashboard <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                            </button>
                        ) : (
                            <div className="hero-actions">
                                <button className="btn-primary" onClick={onRegister}>
                                    Get Visibility Now <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                                </button>
                                <button className="btn-hero-video" onClick={() => setShowVideoModal(true)}>
                                    <Play size={18} fill="currentColor" style={{ marginRight: '8px' }} />
                                    Watch Demo
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="trust-bar">
                    <span>Powering Critical Infra:</span>
                    <div className="trust-items">
                        <div className="trust-item"><Zap size={16} /> <span>Telecom</span></div>
                        <div className="trust-item"><Shield size={16} /> <span>Data Centers</span></div>
                        <div className="trust-item"><FileText size={16} /> <span>IT Logistics</span></div>
                        <div className="trust-item"><Users size={16} /> <span>Field Ops</span></div>
                    </div>
                </div>
            </header>

            {/* PROBLEM / SOLUTION 1: INFRA-SUPPLY */}
            <section id="problem" className="comparison-section">
                <div className="section-header">
                    <div className="category-badge">Logistics Visibility</div>
                    <h2>The Digital Waybill System Your Supply Chain Needs</h2>
                    <p>Stop the bleeding in your fuel and supply chain management with iron-clad accountability and real-time tracking.</p>
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
                            <li><Shield size={20} /> <strong>Tamper-Proof Verification:</strong> See exactly where your fuel goes.</li>
                            <li><Clock size={20} /> <strong>Instant Financial Closure:</strong> Automated reconciliation in seconds.</li>
                            <li><FileText size={20} /> <strong>Centralized Audit Trail:</strong> Every dispatch stored in the cloud.</li>
                            <li><Users size={20} /> <strong>Role-Based Isolation:</strong> Secure data for every tier of the team.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Product Showcase: InfraSupply */}
            <ProductShowcase />

            {/* PROBLEM / SOLUTION 2: MAINTENANCE */}
            <section className="comparison-section alt-bg">
                <div className="section-header">
                    <div className="category-badge maintain">Field Service Management</div>
                    <h2>Automated Preventative Maintenance. Zero Surprises.</h2>
                    <p>The smartest <strong>telecom site maintenance software</strong>. Break the cycle of emergency repairs with real-time proof of work tracking.</p>
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
                            <li><CalendarClock size={20} /> <strong>Smart Health Alerts:</strong> Catch failures before they cause blackouts.</li>
                            <li><Users size={20} /> <strong>Digital Work Orders:</strong> Verified task reporting from the field.</li>
                            <li><Cpu size={20} /> <strong>Single Source of Truth:</strong> Central asset registry for every site.</li>
                            <li><PackageCheck size={20} /> <strong>Inventory Precision:</strong> Real-time tracking of maintenance materials.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Product Showcase: Maintain */}
            <MaintainShowcase />

            {/* NEW SECTION: PROOF OF WORK & INTELLIGENCE */}
            <section className="proof-work-section">
                <div className="section-header">
                    <div className="category-badge">Asset Intelligence</div>
                    <h2>Proof of Work: Beyond the WhatsApp Chat</h2>
                    <p>Stop chasing photos in group chats. NexHaul provides iron-clad, real-time verification and predictive maintenance that scales.</p>
                </div>

                <div className="proof-comparison-grid">
                    <div className="pow-card legacy">
                        <div className="pow-header">
                            <MessageCircle size={32} />
                            <h3>The WhatsApp Way</h3>
                        </div>
                        <ul className="pow-list">
                            <li><X size={18} /> Photos buried in unorganized group chats</li>
                            <li><X size={18} /> "He-said-she-said" manual verification</li>
                            <li><X size={18} /> Zero proof of actual GPS location</li>
                            <li><X size={18} /> Impossible to audit or search months later</li>
                        </ul>
                    </div>

                    <div className="pow-card next-gen">
                        <div className="pow-header">
                            <Zap size={32} />
                            <h3>The NexHaul Way</h3>
                        </div>
                        <ul className="pow-list">
                            <li><Check size={18} /> <strong>Real-Time PoW:</strong> Geo-fenced & time-stamped photos.</li>
                            <li><Check size={18} /> <strong>Digital Signatures:</strong> Instant sign-off from site teams.</li>
                            <li><Check size={18} /> <strong>Centralized Audit:</strong> Every site visit linked to an asset ID.</li>
                            <li><Check size={18} /> <strong>Instant Reporting:</strong> Live dashboard updates as work happens.</li>
                        </ul>
                    </div>
                </div>

                <div className="intelligence-features">
                    <div className="intel-card">
                        <div className="intel-icon"><MousePointerClick size={28} /></div>
                        <h4>Predictive Work Orders</h4>
                        <p>NexHaul predicts when assets are due for service, automatically triggering workflows and alerting the cluster engineer responsible, ensuring on-time servicing with verified inventory stocks.</p>
                    </div>
                    <div className="intel-card">
                        <div className="intel-icon"><LineChart size={28} /></div>
                        <h4>Predictive Failures</h4>
                        <p>NexHaul analyzes run-hours and historical patterns to predict when an asset might fail, triggering a PM before it stops.</p>
                    </div>
                    <div className="intel-card">
                        <div className="intel-icon"><HeartPulse size={28} /></div>
                        <h4>Asset Longevity</h4>
                        <p>Consistent, verified maintenance increases asset lifespan by 40%, reducing total cost of ownership for your fleet and sites.</p>
                    </div>
                </div>
            </section>

            <DigitalWaybillDemo />

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

            {/* Video Masterclass Section */}
            <FeatureVideoSection />

            {/* Pricing Section */}
            <section id="pricing" className="pricing-section">
                <div className="section-header">
                    <h2>Simple, Transparent Pricing</h2>
                    <p>Pay only for the modules you need. Upgrade anytime.</p>
                </div>

                <div className="pricing-grid three-col">
                    {/* Free Plan */}
                    <div className="pricing-card">
                        <div className="trial-badge">Always Free</div>
                        <div className="plan-name">Free</div>
                        <div className="plan-price">
                            <span className="currency">₦</span>0<span className="period">/mo</span>
                        </div>
                        <p className="plan-desc">Get started and explore with limited access to both modules.</p>
                        <button className="btn-pricing outline" onClick={onRegister}>Create Account</button>
                        <ul className="features-list">
                            <li><Check size={18} /> Up to 3 team members</li>
                            <li><Check size={18} /> 1 cluster & 3 clients</li>
                            <li><Check size={18} /> 10 trips / 5 work orders</li>
                            <li><Check size={18} /> 5 assets & 10 documents</li>
                            <li><Check size={18} /> Basic document viewing</li>
                        </ul>
                    </div>

                    {/* Small Business Plan */}
                    <div className="pricing-card">
                        <div className="trial-badge">21 Days Free Trial</div>
                        <div className="plan-name">Small Business</div>
                        <div className="plan-price">
                            <span className="currency">₦</span>18,000<span className="period">/mo</span>
                        </div>
                        <p className="plan-desc" style={{ marginBottom: '0.25rem' }}>Per module — pick InfraSupply, Maintain, or both.</p>
                        <p style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 600, margin: '0 0 1rem', textAlign: 'center' }}>
                            💡 Both modules: ₦25,000/mo — Save ₦11,000
                        </p>
                        <button className="btn-pricing outline" onClick={onRegister}>Get Started</button>
                        <ul className="features-list">
                            <li><Check size={18} /> Up to 7 teams & clusters</li>
                            <li><Check size={18} /> Up to 7 clients & sites</li>
                            <li><Check size={18} /> 50 work orders & 50 assets</li>
                            <li><Check size={18} /> Live GPS tracking</li>
                            <li><Check size={18} /> Multi-cluster dispatch</li>
                            <li><Check size={18} /> Preventive scheduling</li>
                            <li><Check size={18} /> Document downloads</li>
                        </ul>
                    </div>

                    {/* Enterprise Plan */}
                    <div className="pricing-card featured">
                        <div className="trial-badge">Best Value</div>
                        <div className="plan-name">Enterprise</div>
                        <div className="plan-price">
                            <span className="currency">₦</span>40,000<span className="period">/mo</span>
                        </div>
                        <p className="plan-desc">All modules, all features. Unlimited scale for critical infra.</p>
                        <button className="btn-pricing solid" onClick={onRegister}>Start Free Trial</button>
                        <ul className="features-list">
                            <li><Check size={18} /> <strong>Unlimited</strong> teams & clusters</li>
                            <li><Check size={18} /> <strong>Unlimited</strong> clients & sites</li>
                            <li><Check size={18} /> <strong>Unlimited</strong> work orders & assets</li>
                            <li><Check size={18} /> Full Document Audit Centre</li>
                            <li><Check size={18} /> Auto Reconciliation</li>
                            <li><Check size={18} /> Asset Health Projections</li>
                            <li><Check size={18} /> Knowledge Base</li>
                            <li><Check size={18} /> Cluster Reports & CSV Export</li>
                            <li><Check size={18} /> Priority 24/7 Support</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="faq-section" id="faqs">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "FAQPage",
                            "mainEntity": FAQS.map(faq => ({
                                "@type": "Question",
                                "name": faq.question,
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": faq.answer
                                }
                            }))
                        })
                    }}
                />
                <div className="section-header">
                    <div className="category-badge">Support</div>
                    <h2>Frequently Asked Questions</h2>
                    <p>Everything you need to know about NexHaul and our logistics ecosystem.</p>
                </div>

                <div className="faq-container">
                    {FAQS.map((faq, index) => (
                        <div
                            key={index}
                            className={`faq-item ${openFaq === index ? 'open' : ''}`}
                            onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        >
                            <div className="faq-question">
                                <h3>{faq.question}</h3>
                                {openFaq === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                            <div className="faq-answer">
                                <p>{faq.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="faq-cta">
                    <p>Still have questions?</p>
                    <a href="https://wa.me/2349167690043" target="_blank" rel="noopener noreferrer" className="btn-secondary">
                        <MessageCircle size={18} style={{ marginRight: '8px' }} /> Chat with Support
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '4rem 5%', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <div className="footer-logo">
                    <NexHaulLogo size={32} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                    <a href="mailto:hello@sellyticshq.com" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', textDecoration: 'none' }}>
                        <Mail size={18} /> hello@sellyticshq.com
                    </a>
                    <a href="https://wa.me/2349167690043" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', textDecoration: 'none' }}>
                        <MessageSquare size={18} /> 09167690043
                    </a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={18} /> Lagos, Nigeria
                    </div>
                </div>

                <div style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
                    NexHaul InfraSupply • NexHaul Maintain • <span style={{ opacity: 0.6 }}>NexHaul for Oil & Gas • NexHaul for Construction • NexHaul for Mining (Coming Soon)</span>
                </div>

                <div style={{ marginBottom: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                    Need multi-channel retail inventory management? Visit our parent platform: <a href="https://sellyticshq.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>Sellytics Retail Intelligence</a>
                </div>

                <p style={{ color: '#475569', fontSize: '0.85rem' }}>
                    &copy; {new Date().getFullYear()} Sellytics. All rights reserved. The leading <strong>haulage tracker</strong> and field service management app in <strong>Nigeria</strong>.
                </p>
            </footer>

            {/* Floating WhatsApp Button */}
            <a
                href="https://wa.me/2349167690043"
                target="_blank"
                rel="noopener noreferrer"
                className="floating-whatsapp"
                aria-label="Contact on WhatsApp"
            >
                <div className="whatsapp-tooltip">Chat with us</div>
                <MessageSquare size={24} />
            </a>

            {/* Video Modal */}
            <Modal
                isOpen={showVideoModal}
                onClose={() => setShowVideoModal(false)}
                title="NexHaul Product Walkthrough"
                maxWidth="900px"
            >
                <div className="video-container">
                    <iframe
                        width="100%"
                        height="100%"
                        src="https://www.youtube.com/embed/i8WqIqTD9rQ?autoplay=1"
                        title="NexHaul Onboarding Demo"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ aspectRatio: '16/9', borderRadius: '12px' }}
                    ></iframe>
                </div>
            </Modal>
        </div>
    );
}
