'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, ArrowRight, Settings, Plus } from 'lucide-react';
import { useCompanyModules } from '@/hooks/useCompanyModules';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { PRODUCTS, ProductId } from '@/config/productConfig';
import { useRouter } from 'next/navigation';

export default function AppLauncher({ companyId }: { companyId: string | null }) {
    const [isOpen, setIsOpen] = useState(false);
    const { profile } = useAuth();
    const { effectivePlanId } = useSubscription(companyId);
    const { activeModules, activeProduct, setActiveProduct } = useCompanyModules(companyId);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSwitch = (modId: ProductId, path: string) => {
        setActiveProduct(modId);
        router.push(path);
        setIsOpen(false);
    };

    return (
        <div className="app-launcher-wrapper" ref={dropdownRef}>
            <button
                className={`launcher-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="NexHaul Apps"
            >
                <LayoutGrid size={20} />
            </button>

            {isOpen && (
                <div className="launcher-dropdown">
                    <div className="launcher-header">
                        <h3>NexHaul Applications</h3>
                        <p>Available modules for your company</p>
                    </div>

                    <div className="launcher-grid">
                        {activeModules.map((modId) => {
                            const product = PRODUCTS[modId];
                            const isActive = activeProduct === modId;

                            return (
                                <button
                                    key={modId}
                                    className={`launcher-item ${isActive ? 'current' : ''}`}
                                    onClick={() => handleSwitch(modId, product.dashboardPath)}
                                >
                                    <div className="mod-icon-wrapper" style={{ '--mod-color': product.color } as any}>
                                        <span className="mod-emoji">{product.icon}</span>
                                    </div>
                                    <div className="mod-name">{product.shortName}</div>
                                    {isActive && <div className="active-dot"></div>}
                                </button>
                            );
                        })}

                        <button
                            className="launcher-item add-more"
                            onClick={() => {
                                router.push('/dashboard/app-center');
                                setIsOpen(false);
                            }}
                        >
                            <div className="mod-icon-wrapper add">
                                <Plus size={20} />
                            </div>
                            <div className="mod-name">Add More</div>
                        </button>
                    </div>

                    <div className="launcher-footer">
                        {profile && (
                            <div className="compact-profile">
                                <div className="p-avatar">{profile.full_name?.[0].toUpperCase()}</div>
                                <div className="p-details">
                                    <div className="p-name">{profile.full_name}</div>
                                    <div className="p-plan">
                                        <span className={`plan-dot ${effectivePlanId}`}></span>
                                        {effectivePlanId} Plan
                                    </div>
                                </div>
                            </div>
                        )}
                        <button
                            className="manage-btn"
                            onClick={() => {
                                router.push('/dashboard/app-center');
                                setIsOpen(false);
                            }}
                        >
                            Open App Center
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .app-launcher-wrapper {
                    position: relative;
                }
                .launcher-trigger {
                    background: transparent;
                    border: 1px solid transparent;
                    color: #94a3b8;
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .launcher-trigger:hover, .launcher-trigger.active {
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                    border-color: rgba(255, 255, 255, 0.1);
                }
                .launcher-dropdown {
                    position: absolute;
                    top: calc(100% + 12px);
                    right: 0;
                    width: 320px;
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 1.25rem;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    z-index: 1000;
                    overflow: hidden;
                    animation: slideDown 0.2s ease-out;
                }

                @media (max-width: 640px) {
                    .launcher-dropdown {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        right: auto;
                        transform: translate(-50%, -50%);
                        width: calc(100% - 40px);
                        max-width: 340px;
                        box-shadow: 0 0 0 100vw rgba(0, 0, 0, 0.5), 0 25px 50px -12px rgba(0, 0, 0, 0.8);
                        animation: mobileFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes mobileFadeIn {
                    from { opacity: 0; transform: translate(-50%, -45%) scale(0.95); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                .launcher-header {
                    padding: 1.25rem;
                    border-bottom: 1px solid #334155;
                }
                .launcher-header h3 {
                    color: white;
                    font-size: 0.95rem;
                    font-weight: 700;
                    margin: 0;
                }
                .launcher-header p {
                    color: #64748b;
                    font-size: 0.75rem;
                    margin: 0.25rem 0 0 0;
                }
                .launcher-grid {
                    padding: 1rem;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.5rem;
                }
                .launcher-item {
                    background: transparent;
                    border: none;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem;
                    border-radius: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }
                .launcher-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                .launcher-item.current {
                    background: rgba(59, 130, 246, 0.05);
                }
                .mod-icon-wrapper {
                    width: 48px;
                    height: 48px;
                    background: #0f172a;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.2s;
                    position: relative;
                }
                .mod-icon-wrapper::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 12px;
                    border: 2px solid var(--mod-color);
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .launcher-item.current .mod-icon-wrapper::after {
                    opacity: 0.2;
                }
                .mod-icon-wrapper.add {
                    color: #64748b;
                    border: 1px dashed #334155;
                }
                .launcher-item:hover .mod-icon-wrapper.add {
                    color: #3b82f6;
                    border-color: #3b82f6;
                    background: rgba(59, 130, 246, 0.05);
                }
                .mod-name {
                    color: #94a3b8;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-align: center;
                }
                .launcher-item:hover .mod-name {
                    color: white;
                }
                .active-dot {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    width: 6px;
                    height: 6px;
                    background: #3b82f6;
                    border-radius: 50%;
                    box-shadow: 0 0 8px #3b82f6;
                }
                .launcher-footer {
                    padding: 1rem;
                    background: #0f172a;
                    border-top: 1px solid #334155;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .compact-profile {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding-bottom: 0.5rem;
                }
                .p-avatar {
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #a855f7, #3b82f6);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 0.8rem;
                    font-weight: 800;
                }
                .p-details {
                    display: flex;
                    flex-direction: column;
                }
                .p-name {
                    color: white;
                    font-size: 0.85rem;
                    font-weight: 700;
                }
                .p-plan {
                    color: #94a3b8;
                    font-size: 0.7rem;
                    text-transform: capitalize;
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                }
                .plan-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #64748b;
                }
                .plan-dot.trial { background: #f59e0b; }
                .plan-dot.enterprise { background: #a855f7; box-shadow: 0 0 6px #a855f7; }
                .plan-dot.pro { background: #3b82f6; }
                
                .manage-btn {
                    width: 100%;
                    background: transparent;
                    border: 1px solid #334155;
                    color: #94a3b8;
                    padding: 0.5rem;
                    border-radius: 0.5rem;
                    font-size: 0.8rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .manage-btn:hover {
                    background: #1e293b;
                    color: white;
                    border-color: #475569;
                }
            `}</style>
        </div>
    );
}
