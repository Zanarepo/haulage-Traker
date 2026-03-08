"use client";

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import NexHaulLogo from './NexHaulLogo';

export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check for iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);

        // Listen for the beforeinstallprompt event for Android/Chrome
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Only show banner if the app isn't already installed
            if (!window.matchMedia('(display-mode: standalone)').matches) {
                setShowBanner(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // If it's iOS and not already in standalone mode, show instructions
        if (ios && !window.matchMedia('(display-mode: standalone)').matches) {
            // We can show it after a delay or on first scroll
            const timer = setTimeout(() => setShowBanner(true), 5000);
            return () => clearTimeout(timer);
        }

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt && !isIOS) return;

        if (isIOS) {
            // iOS doesn't have a programmable install prompt, so we just show instructions
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    };

    if (!showBanner) return null;

    return (
        <div className="pwa-install-banner">
            <div className="pwa-content">
                <div className="pwa-icon">
                    <NexHaulLogo size={24} showText={false} />
                </div>
                <div className="pwa-text">
                    <h4>Install NexHaul App</h4>
                    {isIOS ? (
                        <p>Tap <span className="share-icon"></span> then "Add to Home Screen"</p>
                    ) : (
                        <p>Get the full mobile experience for field ops.</p>
                    )}
                </div>
                <div className="pwa-actions">
                    {!isIOS && (
                        <button onClick={handleInstallClick} className="btn-install">
                            <Download size={16} /> Install
                        </button>
                    )}
                    <button onClick={() => setShowBanner(false)} className="btn-close">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <style jsx>{`
                .pwa-install-banner {
                    position: fixed;
                    bottom: 2rem;
                    left: 50%;
                    transform: translateX(-50%);
                    width: calc(100% - 2rem);
                    max-width: 450px;
                    background: rgba(15, 23, 42, 0.9);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 16px;
                    padding: 1rem;
                    z-index: 9999;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.1);
                    animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes slideUp {
                    from { transform: translate(-50%, 100px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }

                .pwa-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .pwa-icon {
                    width: 48px;
                    height: 48px;
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .icon-device {
                    color: #3b82f6;
                }

                .pwa-text {
                    flex-grow: 1;
                }

                .pwa-text h4 {
                    margin: 0;
                    font-size: 1rem;
                    color: #fff;
                    font-weight: 700;
                }

                .pwa-text p {
                    margin: 0.25rem 0 0;
                    font-size: 0.85rem;
                    color: #94a3b8;
                }

                .share-icon {
                    display: inline-block;
                    width: 18px;
                    height: 18px;
                    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>') no-repeat center;
                    vertical-align: middle;
                    margin: 0 0.2rem;
                }

                .pwa-actions {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }

                .btn-install {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .btn-install:hover {
                    background: #2563eb;
                    transform: translateY(-2px);
                }

                .btn-close {
                    background: rgba(255, 255, 255, 0.05);
                    color: #94a3b8;
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-close:hover {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }

                @media (max-width: 480px) {
                    .pwa-install-banner {
                        bottom: 1rem;
                        padding: 0.75rem;
                    }
                    .pwa-icon {
                        width: 40px;
                        height: 40px;
                    }
                    .btn-install {
                        padding: 0.4rem 0.75rem;
                    }
                }
            `}</style>
        </div>
    );
}
