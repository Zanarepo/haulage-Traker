'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import NexHaulLogo from '@/components/NexHaulLogo';

interface AuthNavbarProps {
    onBackToHome: () => void;
}

export default function AuthNavbar({ onBackToHome }: AuthNavbarProps) {
    return (
        <nav className="auth-nav">
            <div className="nav-content">
                <div className="nav-left" onClick={onBackToHome} style={{ cursor: 'pointer' }}>
                    <NexHaulLogo size={32} showText={false} />
                    <span className="brand-name">Nex<span className="accent">Haul</span></span>
                </div>
                <button className="back-home-btn" onClick={onBackToHome}>
                    <ArrowLeft size={18} />
                    <span>Back to Home</span>
                </button>
            </div>

            <style jsx>{`
                .auth-nav {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: rgba(15, 23, 42, 0.8);
                    backdrop-filter: blur(8px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 0.75rem 5%;
                    z-index: 1000;
                }
                .nav-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .nav-left {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .brand-name {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: white;
                }
                .accent {
                    color: #f49454;
                }
                .back-home-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #94a3b8;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .back-home-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                    border-color: rgba(255, 255, 255, 0.2);
                }
                @media (max-width: 480px) {
                    .back-home-btn span {
                        display: none;
                    }
                    .back-home-btn {
                        padding: 0.5rem;
                    }
                }
            `}</style>
        </nav>
    );
}
