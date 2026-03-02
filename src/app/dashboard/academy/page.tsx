"use client";

import React, { useState } from 'react';
import {
    Play,
    Search,
    Filter,
    BookOpen,
    Zap,
    Wrench,
    ShieldCheck,
    Users,
    ArrowRight,
    Clock,
    Star
} from 'lucide-react';
import Modal from '@/components/Modal/Modal';

interface AcademyVideo {
    id: string;
    title: string;
    description: string;
    duration: string;
    thumbnail: string;
    videoUrl: string;
    category: 'Getting Started' | 'InfraSupply' | 'Maintain' | 'Admin';
    level: 'Beginner' | 'Intermediate' | 'Advanced';
}

const ACADEMY_VIDEOS: AcademyVideo[] = [
    {
        id: '1',
        title: 'NexHaul Onboarding: Your First 60 Seconds',
        description: 'Complete walkthrough of the registration process and module selection.',
        duration: '0:50',
        thumbnail: '/screenshots/Superadmin.png',
        videoUrl: 'https://www.youtube.com/embed/i8WqIqTD9rQ',
        category: 'Getting Started',
        level: 'Beginner'
    },
    {
        id: '2',
        title: 'Operational Foundations',
        description: 'Complete guide on how to create clusters, clients, and sites to build your operational hierarchy.',
        duration: '2:18',
        thumbnail: '/screenshots/Trips&logistics.png',
        videoUrl: 'https://www.youtube.com/embed/isIm84oVpUo',
        category: 'InfraSupply',
        level: 'Beginner'
    },
    {
        id: '3',
        title: 'Depot Inventory Tracking',
        description: 'Guided walkthrough on how to manage fuel stock levels and track inflows from source clients.',
        duration: '1:14',
        thumbnail: 'https://img.youtube.com/vi/K-_XuP5IUzE/maxresdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/K-_XuP5IUzE',
        category: 'InfraSupply',
        level: 'Intermediate'
    },
    {
        id: '4',
        title: 'Digital Audit & Document Centre',
        description: 'Learn how to manage digital waybills, engineer sign-offs, and tamper-proof signatures for your operations.',
        duration: '0:38',
        thumbnail: 'https://img.youtube.com/vi/kRFhFrszAJk/maxresdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/kRFhFrszAJk',
        category: 'Admin',
        level: 'Beginner'
    },
    {
        id: '5',
        title: 'Trips & Logistics (Admin Setup)',
        description: 'Step-by-step guide for administrators on how to dispatch trips, build itineraries, and manage fuel allocation.',
        duration: '1:10',
        thumbnail: 'https://img.youtube.com/vi/DeSNbHRcDU8/maxresdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/DeSNbHRcDU8',
        category: 'InfraSupply',
        level: 'Beginner'
    },
    {
        id: '6',
        title: 'Managing Dispense Activities',
        description: 'How to record field fuel deliveries, capture waybill photos, and collect digital signatures from site engineers.',
        duration: '1:28',
        thumbnail: 'https://img.youtube.com/vi/NLPkrHw_VIc/maxresdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/NLPkrHw_VIc',
        category: 'InfraSupply',
        level: 'Intermediate'
    },
    {
        id: '7',
        title: 'Live Tracking & Fleet Monitoring',
        description: 'Learn how to use real-time GPS tracking to monitor fleet movement and verify site arrival.',
        duration: '1:20',
        thumbnail: 'https://img.youtube.com/vi/H2ZZ4FQxQO0/maxresdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/H2ZZ4FQxQO0',
        category: 'InfraSupply',
        level: 'Beginner'
    },
    {
        id: '8',
        title: 'Team Management & Role-Based Access',
        description: 'How to onboard staff, assign operational clusters, and manage digital verification privileges.',
        duration: '1:26',
        thumbnail: 'https://img.youtube.com/vi/OrKOik2H5Kg/maxresdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/OrKOik2H5Kg',
        category: 'Admin',
        level: 'Beginner'
    },
    {
        id: '9',
        title: 'How to Record Stock inflow',
        description: 'Learn how to manage inbound deliveries, register batch references, and maintain central warehouse stock levels.',
        duration: '1:24',
        thumbnail: 'https://img.youtube.com/vi/gpuPn5dJrEs/maxresdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/gpuPn5dJrEs',
        category: 'InfraSupply',
        level: 'Beginner'
    },
    {
        id: '10',
        title: 'Issue Stock to Clusters',
        description: 'Learn how to distribute central inventory to specific operational clusters and site engineers.',
        duration: '1:05',
        thumbnail: 'https://img.youtube.com/vi/j4BbWT_guGc/maxresdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/j4BbWT_guGc',
        category: 'Admin',
        level: 'Beginner'
    }
];

export default function AcademyPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'All' | AcademyVideo['category']>('All');
    const [selectedVideo, setSelectedVideo] = useState<AcademyVideo | null>(null);

    const filteredVideos = ACADEMY_VIDEOS.filter(video => {
        const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'All' || video.category === activeTab;
        return matchesSearch && matchesTab;
    });

    const categories: ('All' | AcademyVideo['category'])[] = ['All', 'Getting Started', 'InfraSupply', 'Maintain', 'Admin'];

    return (
        <div className="academy-container">
            <header className="academy-header">
                <div className="header-info">
                    <h1>NexHaul Academy</h1>
                    <p>Become a power user with our expert-led video walkthroughs and tutorials.</p>
                </div>
                <div className="header-stats">
                    <div className="stat-card">
                        <BookOpen size={20} className="text-blue-400" />
                        <div>
                            <span className="stat-value">{ACADEMY_VIDEOS.length}</span>
                            <span className="stat-label">Tutorials</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <Clock size={20} className="text-purple-400" />
                        <div>
                            <span className="stat-value">14m</span>
                            <span className="stat-label">Total Content</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="academy-controls">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search for a feature or workflow..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="category-tabs">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`category-tab ${activeTab === cat ? 'active' : ''}`}
                            onClick={() => setActiveTab(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="academy-grid">
                {filteredVideos.map((video) => (
                    <div key={video.id} className="academy-card" onClick={() => setSelectedVideo(video)}>
                        <div className="academy-thumbnail">
                            <img src={video.thumbnail} alt={video.title} />
                            <div className="play-overlay">
                                <div className="play-btn">
                                    <Play size={24} fill="currentColor" />
                                </div>
                            </div>
                            <div className="duration-tag">{video.duration}</div>
                            <div className={`level-tag ${video.level.toLowerCase()}`}>
                                <Star size={10} fill="currentColor" />
                                {video.level}
                            </div>
                        </div>
                        <div className="academy-content">
                            <div className="category-label">{video.category}</div>
                            <h3>{video.title}</h3>
                            <p>{video.description}</p>
                            <div className="card-footer">
                                <div className="instructor">
                                    <div className="avatar">N</div>
                                    <span>NexHaul Team</span>
                                </div>
                                <ArrowRight size={16} className="arrow" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredVideos.length === 0 && (
                <div className="empty-state">
                    <Search size={48} />
                    <h3>No tutorials found</h3>
                    <p>Try adjusting your search or filters to find what you're looking for.</p>
                </div>
            )}

            <style jsx>{`
                .academy-container {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                .academy-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 3rem;
                    background: linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.4) 100%);
                    padding: 2.5rem;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .header-info h1 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(to right, #fff, #94a3b8);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .header-info p {
                    color: #94a3b8;
                    font-size: 1.1rem;
                }
                .header-stats {
                    display: flex;
                    gap: 1.5rem;
                }
                .stat-card {
                    background: rgba(15, 23, 42, 0.6);
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .stat-value {
                    display: block;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: white;
                }
                .stat-label {
                    display: block;
                    font-size: 0.75rem;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .academy-controls {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    margin-bottom: 3rem;
                }
                .search-bar {
                    position: relative;
                    max-width: 600px;
                }
                .search-icon {
                    position: absolute;
                    left: 1.25rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #64748b;
                }
                .search-bar input {
                    width: 100%;
                    padding: 1rem 1rem 1rem 3.5rem;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: white;
                    font-size: 1rem;
                    outline: none;
                    transition: all 0.2s;
                }
                .search-bar input:focus {
                    border-color: #3b82f6;
                    background: rgba(30, 41, 59, 0.8);
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                }
                .category-tabs {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }
                .category-tab {
                    padding: 0.6rem 1.25rem;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 100px;
                    color: #94a3b8;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .category-tab:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                }
                .category-tab.active {
                    background: #3b82f6;
                    color: white;
                    border-color: #3b82f6;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                .academy-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 2rem;
                }
                .academy-card {
                    background: rgba(30, 41, 59, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                }
                .academy-card:hover {
                    transform: translateY(-8px);
                    background: rgba(30, 41, 59, 0.5);
                    border-color: rgba(59, 130, 246, 0.3);
                    box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.5);
                }
                .academy-thumbnail {
                    position: relative;
                    aspect-ratio: 16/9;
                    background: #000;
                }
                .academy-thumbnail img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    opacity: 0.6;
                    transition: opacity 0.3s;
                }
                .academy-card:hover .academy-thumbnail img {
                    opacity: 0.8;
                }
                .play-overlay {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .academy-card:hover .play-overlay {
                    opacity: 1;
                }
                .play-btn {
                    width: 50px;
                    height: 50px;
                    background: #3b82f6;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    transform: scale(0.9);
                    transition: transform 0.3s;
                }
                .academy-card:hover .play-btn {
                    transform: scale(1);
                }
                .duration-tag {
                    position: absolute;
                    bottom: 0.75rem;
                    right: 0.75rem;
                    background: rgba(0, 0, 0, 0.75);
                    color: white;
                    padding: 0.2rem 0.6rem;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    z-index: 2;
                }
                .level-tag {
                    position: absolute;
                    top: 0.75rem;
                    right: 0.75rem;
                    padding: 0.25rem 0.6rem;
                    border-radius: 4px;
                    font-size: 0.65rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                    z-index: 2;
                }
                .level-tag.beginner { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
                .level-tag.intermediate { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
                .level-tag.advanced { background: rgba(239, 68, 68, 0.2); color: #f87171; }

                .academy-content {
                    padding: 1.5rem;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .category-label {
                    color: #3b82f6;
                    font-size: 0.75rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.5rem;
                }
                .academy-content h3 {
                    font-size: 1.1rem;
                    color: white;
                    margin-bottom: 0.75rem;
                    font-weight: 700;
                }
                .academy-content p {
                    color: #94a3b8;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    margin-bottom: 1.5rem;
                    flex: 1;
                }
                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 1.25rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }
                .instructor {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .avatar {
                    width: 24px;
                    height: 24px;
                    background: #3b82f6;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: white;
                }
                .instructor span {
                    font-size: 0.8rem;
                    color: #64748b;
                    font-weight: 600;
                }
                .arrow {
                    color: #3b82f6;
                    opacity: 0.5;
                    transform: translateX(0);
                    transition: all 0.2s;
                }
                .academy-card:hover .arrow {
                    opacity: 1;
                    transform: translateX(4px);
                }
                .empty-state {
                    text-align: center;
                    padding: 5rem 0;
                    color: #475569;
                }
                .empty-state h3 {
                    color: white;
                    margin: 1.5rem 0 0.5rem;
                    font-size: 1.5rem;
                }
                @media (max-width: 768px) {
                    .academy-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1.5rem;
                        padding: 1.5rem;
                    }
                    .header-info h1 {
                        font-size: 2rem;
                    }
                }
            `}</style>

            {selectedVideo && (
                <Modal
                    isOpen={!!selectedVideo}
                    onClose={() => setSelectedVideo(null)}
                    title={selectedVideo.title}
                    maxWidth="1000px"
                >
                    <div style={{ width: '100%', background: '#000', borderRadius: '12px', overflow: 'hidden', lineHeight: 0 }}>
                        <iframe
                            width="100%"
                            height="100%"
                            src={`${selectedVideo.videoUrl}?autoplay=1`}
                            title={selectedVideo.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ aspectRatio: '16/9', borderRadius: '12px' }}
                        ></iframe>
                    </div>
                </Modal>
            )}
        </div>
    );
}
