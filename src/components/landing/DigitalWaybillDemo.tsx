"use client";

import React, { useState, useEffect } from 'react';
import {
    QrCode,
    MapPin,
    CheckCircle2,
    PenTool,
    ShieldCheck,
    ArrowRight,
    Truck,
    User,
    Camera,
    Check
} from 'lucide-react';

export default function DigitalWaybillDemo() {
    const [step, setStep] = useState(1);
    const [isSigned, setIsSigned] = useState(false);
    const [isUploaded, setIsUploaded] = useState(false);
    const [isEngineerConfirmed, setIsEngineerConfirmed] = useState(false);

    const nextStep = () => {
        if (step < 5) setStep(step + 1);
    };

    const resetDemo = () => {
        setStep(1);
        setIsSigned(false);
        setIsUploaded(false);
        setIsEngineerConfirmed(false);
    };

    useEffect(() => {
        if (step === 4) {
            const timer = setTimeout(() => {
                setIsEngineerConfirmed(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    return (
        <section className="waybill-demo-section" id="interactive-demo">
            <div className="section-header">
                <div className="category-badge">Live Experience</div>
                <h2>Try the NexHaul Workflow</h2>
                <p>Experience the seamless collaboration between drivers and site engineers.</p>
            </div>

            <div className="demo-container">
                {/* Left Side: Device UI */}
                <div className="demo-device-wrapper">
                    <div className="phone-bezel">
                        <div className="phone-screen">
                            <div className="app-header">
                                <span className="app-user-type">
                                    {step < 4 ? 'Driver App' : 'Engineer Dashboard'}
                                </span>
                                <div className="status-dot"></div>
                            </div>

                            <div className="app-content">
                                {step === 1 && (
                                    <div className="step-content fade-in">
                                        <div className="live-tracking-box">
                                            <div className="tracking-header">
                                                <Truck size={20} />
                                                <span>Live Trip: NH-7702</span>
                                            </div>
                                            <div className="map-sim">
                                                <div className="truck-marker anim-drive">
                                                    <Truck size={24} />
                                                </div>
                                                <div className="route-path"></div>
                                                <MapPin size={20} className="site-marker" />
                                            </div>
                                            <p>Truck is en route to <strong>Ikeja Data Center</strong></p>
                                        </div>
                                        <button className="btn-demo" onClick={nextStep}>
                                            <MapPin size={18} /> Arrived at Site
                                        </button>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="step-content fade-in">
                                        <div className="verification-ui">
                                            <div className="info-row">
                                                <span>Fuel Type:</span>
                                                <strong>Diesel (AGO)</strong>
                                            </div>
                                            <div className="info-row">
                                                <span>Quantity:</span>
                                                <strong>33,000 L</strong>
                                            </div>

                                            <div className="signature-pad" onClick={() => setIsSigned(true)}>
                                                {isSigned ? (
                                                    <div className="sig-draw">
                                                        <svg viewBox="0 0 200 60" width="100%">
                                                            <path d="M20,40 C50,30 80,50 110,35 S150,20 180,45" fill="none" stroke="#3b82f6" strokeWidth="3" />
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    <div className="sig-hint">
                                                        <PenTool size={20} />
                                                        <p>Engineer signs on Driver's device</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button className={`btn-demo ${!isSigned ? 'disabled' : ''}`} disabled={!isSigned} onClick={nextStep}>
                                            Capture E-Signature
                                        </button>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="step-content fade-in">
                                        <div className="upload-section">
                                            <div className="camera-preview" onClick={() => setIsUploaded(true)}>
                                                {isUploaded ? (
                                                    <div className="doc-preview">
                                                        <div className="doc-icon"><ShieldCheck size={40} /></div>
                                                        <p>Physical Waybill Scanned</p>
                                                    </div>
                                                ) : (
                                                    <div className="camera-hint">
                                                        <Camera size={40} />
                                                        <p>Upload Physical Waybill Image</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button className={`btn-demo ${!isUploaded ? 'disabled' : ''}`} disabled={!isUploaded} onClick={nextStep}>
                                            Sync to Cloud
                                        </button>
                                    </div>
                                )}

                                {step === 4 && (
                                    <div className="step-content fade-in">
                                        <div className="engineer-dashboard">
                                            <div className="dashboard-header">
                                                <User size={24} />
                                                <span>Site Engineer</span>
                                            </div>
                                            <div className="reconcile-card">
                                                <p>Incoming Supply: <strong>33,000 L</strong></p>
                                                <div className={`status-pill ${isEngineerConfirmed ? 'matched' : 'pending'}`}>
                                                    {isEngineerConfirmed ? 'Quantity Reconciled' : 'Verifying Qty...'}
                                                </div>
                                            </div>
                                            {isEngineerConfirmed && (
                                                <button className="btn-demo success" onClick={nextStep}>
                                                    Finalize Authentication
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {step === 5 && (
                                    <div className="step-content fade-in success-state">
                                        <div className="success-icon-ring">
                                            <Check size={40} />
                                        </div>
                                        <h3>Fully Reconciled</h3>
                                        <p>Supply data verified by both parties and documents synced.</p>
                                        <div className="verified-list">
                                            <div className="v-item"><Check size={14} /> Location Verified</div>
                                            <div className="v-item"><Check size={14} /> E-Signature Captured</div>
                                            <div className="v-item"><Check size={14} /> Waybill in Cloud</div>
                                        </div>
                                        <button className="btn-reset" onClick={resetDemo}>
                                            Restart Demo
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Text info */}
                <div className="demo-info-steps">
                    <div className={`info-step ${step === 1 ? 'active' : ''}`}>
                        <div className="i-num">01</div>
                        <div className="i-text">
                            <h4>Real-Time Tracking</h4>
                            <p>Drivers are tracked via GPS during the entire supply trip for transparency.</p>
                        </div>
                    </div>
                    <div className={`info-step ${step === 2 ? 'active' : ''}`}>
                        <div className="i-num">02</div>
                        <div className="i-text">
                            <h4>Site Verification</h4>
                            <p>Site Engineer verifies the quantity delivered and signs digitally on the driver's device.</p>
                        </div>
                    </div>
                    <div className={`info-step ${step === 3 ? 'active' : ''}`}>
                        <div className="i-num">03</div>
                        <div className="i-text">
                            <h4>Waybill Cloud Sync</h4>
                            <p>Driver uploads the physical waybill for immediate, permanent cloud storage and audit.</p>
                        </div>
                    </div>
                    <div className={`info-step ${step >= 4 ? 'active' : ''}`}>
                        <div className="i-num">04</div>
                        <div className="i-text">
                            <h4>Engineer Authentication</h4>
                            <p>Site engineer identifies the quantity in their own dashboard to reconcile the transaction.</p>
                        </div>
                    </div>

                    <div className="demo-summary-box">
                        <p>Total transparency from dispatch to reconciliation. No more "lost" diesel.</p>
                        <button className="btn-primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            Start Using NexHaul <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .waybill-demo-section {
                    padding: 3.5rem 5%;
                    background: #020617;
                }

                .demo-container {
                    max-width: 1100px;
                    margin: 4rem auto 0;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6rem;
                    align-items: center;
                }

                /* Device Styles */
                .phone-bezel {
                    width: 300px;
                    height: 580px;
                    background: #1e293b;
                    border: 8px solid #334155;
                    border-radius: 40px;
                    padding: 10px;
                    box-shadow: 0 40px 80px -20px rgba(0,0,0,0.6);
                    margin: 0 auto;
                }

                .phone-screen {
                    width: 100%;
                    height: 100%;
                    background: #020617;
                    border-radius: 30px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .app-header {
                    padding: 1.25rem 1rem;
                    background: #0f172a;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }

                .app-user-type {
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #3b82f6;
                    letter-spacing: 0.05em;
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    background: #22c55e;
                    border-radius: 50%;
                }

                .app-content {
                    flex-grow: 1;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                }

                .step-content {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    animation: fadeIn 0.4s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Step 1 Styles */
                .map-sim {
                    height: 120px;
                    background: rgba(255,255,255,0.02);
                    border-radius: 12px;
                    margin: 1.5rem 0;
                    position: relative;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .route-path {
                    position: absolute;
                    top: 50%;
                    left: 20px;
                    right: 20px;
                    height: 2px;
                    background: repeating-linear-gradient(90deg, #3b82f6 0, #3b82f6 10px, transparent 10px, transparent 20px);
                }

                .truck-marker {
                    position: absolute;
                    top: 35%;
                    left: 0;
                    color: #3b82f6;
                }

                .anim-drive {
                    animation: drive 3s linear infinite;
                }

                @keyframes drive {
                    from { left: -10%; }
                    to { left: 80%; }
                }

                .site-marker {
                    position: absolute;
                    right: 20px;
                    top: 35%;
                    color: #ef4444;
                }

                /* UI Components */
                .btn-demo {
                    width: 100%;
                    padding: 0.85rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 700;
                    font-size: 0.9rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                }

                .btn-demo:hover {
                    background: #2563eb;
                }

                .btn-demo.disabled {
                    background: #334155;
                    color: #64748b;
                    cursor: not-allowed;
                }

                .btn-demo.success {
                    background: #22c55e;
                }

                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.75rem;
                    font-size: 0.85rem;
                }

                .signature-pad {
                    height: 120px;
                    background: #020617;
                    border: 1px dashed #334155;
                    border-radius: 12px;
                    margin: 1.5rem 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .sig-hint {
                    text-align: center;
                    color: #475569;
                }

                .sig-hint p { font-size: 0.7rem; margin-top: 0.5rem; }

                .camera-preview {
                    height: 180px;
                    background: #1e293b;
                    border-radius: 16px;
                    margin-bottom: 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    overflow: hidden;
                    border: 2px solid rgba(59, 130, 246, 0.1);
                }

                .reconcile-card {
                    background: rgba(59, 130, 246, 0.05);
                    padding: 1.5rem;
                    border-radius: 16px;
                    margin-bottom: 2rem;
                    text-align: center;
                }

                .status-pill {
                    display: inline-block;
                    margin-top: 1rem;
                    padding: 0.4rem 1rem;
                    border-radius: 99px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }

                .status-pill.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .status-pill.matched { background: rgba(34, 197, 94, 0.1); color: #22c55e; }

                /* Right Side Info */
                .info-step {
                    display: flex;
                    gap: 1.5rem;
                    padding: 1.5rem;
                    border-radius: 1rem;
                    margin-bottom: 1rem;
                    border: 1px solid transparent;
                    transition: all 0.3s;
                }

                .info-step.active {
                    background: rgba(59, 130, 246, 0.05);
                    border-color: rgba(59, 130, 246, 0.2);
                }

                .i-num {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #1e293b;
                }

                .active .i-num { color: #3b82f6; }

                .i-text h4 { color: #fff; margin-bottom: 0.4rem; }
                .i-text p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }

                .demo-summary-box {
                    margin-top: 3rem;
                    padding: 2rem;
                    background: rgba(255,255,255,0.02);
                    border-radius: 1.5rem;
                    text-align: center;
                }

                .success-state { text-align: center; }
                .success-icon-ring {
                    width: 70px;
                    height: 70px;
                    background: rgba(34, 197, 94, 0.1);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #22c55e;
                    margin: 0 auto 1.5rem;
                }

                .btn-reset {
                    background: transparent;
                    border: 1px solid #334155;
                    color: #94a3b8;
                    padding: 0.6rem 1.25rem;
                    border-radius: 8px;
                    margin-top: 2rem;
                    cursor: pointer;
                }

                @media (max-width: 968px) {
                    .demo-container { grid-template-columns: 1fr; gap: 4rem; }
                }
            `}</style>
        </section>
    );
}
