"use client";

import React, { useState } from 'react';
import { Play, Zap, Wrench, ShieldCheck, ArrowRight } from 'lucide-react';
import Modal from '@/components/Modal/Modal';

interface VideoFeature {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    videoUrl: string;
    category: 'Logistics' | 'Maintenance' | 'Operations';
    icon: React.ReactNode;
}

const FEATURE_VIDEOS: VideoFeature[] = [
    {
        id: 'onboarding',
        title: 'Mastering the Account Setup',
        description: 'Learn how to register your company, pick your modules, and launch your command center in 60 seconds.',
        thumbnail: '/screenshots/Superadmin.png',
        videoUrl: 'https://www.youtube.com/embed/i8WqIqTD9rQ',
        category: 'Operations',
        icon: <ShieldCheck size={20} />
    },
    {
        id: 'dispatch',
        title: 'Operational Foundations',
        description: 'Guided walkthrough on how to create clusters, clients, and sites to build your operational map.',
        thumbnail: '/screenshots/Trips&logistics.png',
        videoUrl: 'https://www.youtube.com/embed/isIm84oVpUo',
        category: 'Logistics',
        icon: <Zap size={20} />
    },
    {
        id: 'maintenance',
        title: 'Automating Site Maintenance',
        description: 'How to register assets, track hour meters, and schedule preventive maintenance alerts.',
        thumbnail: '/screenshots/AssetRegistry.png',
        videoUrl: 'https://www.youtube.com/embed/i8WqIqTD9rQ', // Placeholder
        category: 'Maintenance',
        icon: <Wrench size={20} />
    },
    {
        id: 'inventory-tracking',
        title: 'Depot Inventory Tracking',
        description: 'Master fuel accountability by tracking every liter from the moment it enters your depot.',
        thumbnail: 'https://img.youtube.com/vi/K-_XuP5IUzE/maxresdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/K-_XuP5IUzE',
        category: 'Logistics',
        icon: <Zap size={20} />
    }
];

export default function FeatureVideoSection() {
    const [selectedVideo, setSelectedVideo] = useState<VideoFeature | null>(null);

    return (
        <section className="feature-video-section" id="academy-preview">
            <div className="section-header">
                <div className="category-badge">NexHaul Masterclass</div>
                <h2>See NexHaul in Action</h2>
                <p>Explore our video walkthroughs to see how we simplify complex field operations.</p>
            </div>

            <div className="video-grid">
                {FEATURE_VIDEOS.map((video) => (
                    <div key={video.id} className="video-card" onClick={() => setSelectedVideo(video)}>
                        <div className="video-thumbnail-wrapper">
                            <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
                            <div className="video-overlay">
                                <div className="play-button-outer">
                                    <Play size={24} fill="currentColor" />
                                </div>
                            </div>
                            <div className="video-category-label">
                                {video.icon}
                                <span>{video.category}</span>
                            </div>
                        </div>
                        <div className="video-info">
                            <h3>{video.title}</h3>
                            <p>{video.description}</p>
                            <span className="watch-link">
                                Watch Tutorial <ArrowRight size={16} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .feature-video-section {
                    padding: 8rem 5%;
                    background: #020617;
                    position: relative;
                }
                .video-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .video-card {
                    background: rgba(30, 41, 59, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 1.5rem;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                }
                .video-card:hover {
                    transform: translateY(-8px);
                    background: rgba(30, 41, 59, 0.6);
                    border-color: rgba(59, 130, 246, 0.3);
                }
                .video-thumbnail-wrapper {
                    position: relative;
                    aspect-ratio: 16/9;
                    overflow: hidden;
                    width: 100%;
                }
                .video-thumbnail {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s ease;
                    opacity: 0.7;
                    display: block;
                }
                .video-card:hover .video-thumbnail {
                    transform: scale(1.05);
                    opacity: 0.9;
                }
                .video-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(2, 6, 23, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    z-index: 5;
                }
                .video-card:hover .video-overlay {
                    opacity: 1;
                }
                .play-button-outer {
                    width: 64px;
                    height: 64px;
                    background: #3b82f6;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 0 30px rgba(59, 130, 246, 0.4);
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                }
                .video-card:hover .play-button-outer {
                    transform: scale(1);
                }
                .video-category-label {
                    position: absolute;
                    top: 1rem;
                    left: 1rem;
                    padding: 0.5rem 1rem;
                    background: rgba(15, 23, 42, 0.8);
                    backdrop-filter: blur(8px);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #60a5fa;
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    z-index: 10;
                }
                .video-info {
                    padding: 1.5rem;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .video-info h3 {
                    font-size: 1.25rem;
                    color: white;
                    margin-bottom: 0.75rem;
                    font-weight: 700;
                }
                .video-info p {
                    color: #94a3b8;
                    font-size: 0.9rem;
                    line-height: 1.6;
                    margin-bottom: 1.25rem;
                    flex: 1;
                }
                .watch-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #3b82f6;
                    font-size: 0.85rem;
                    font-weight: 700;
                    margin-top: auto;
                }
                @media (max-width: 768px) {
                    .feature-video-section {
                        padding: 4rem 5%;
                    }
                    .video-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            {selectedVideo && (
                <Modal
                    isOpen={!!selectedVideo}
                    onClose={() => setSelectedVideo(null)}
                    title={selectedVideo.title}
                    maxWidth="900px"
                >
                    <div className="video-container" style={{ width: '100%', background: '#000', borderRadius: '12px', overflow: 'hidden', lineHeight: 0 }}>
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
        </section>
    );
}
