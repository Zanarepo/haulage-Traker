"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, FileText, ArrowLeft, ArrowRight, Zap, Wrench, ShieldCheck, Clock, User, Calendar } from 'lucide-react';
import NexHaulLogo from '@/components/NexHaulLogo';
import Modal from '@/components/Modal/Modal';
import { ACADEMY_VIDEOS, ACADEMY_BLOGS, VideoContent, BlogContent } from '@/lib/academy-data';

import './academy.css';

export default function AcademyHub() {
    const [activeTab, setActiveTab] = useState<'video' | 'blog'>('video');
    const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);

    return (
        <div className="academy-hub">
            {/* Minimal Header */}
            <nav className="academy-nav">
                <div className="nav-logo">
                    <NexHaulLogo size={28} />
                </div>
                <div className="nav-spacer"></div>
                <Link href="/" className="back-link">
                    <span>Back to Home</span>
                    <ArrowLeft size={20} />
                </Link>
            </nav>

            <header className="academy-header">
                <div className="header-content">
                    <div className="badge">NexHaul Academy</div>
                    <h1>Master the Art of Logistics & Maintenance</h1>
                    <p>
                        Free expert resources, video walkthroughs, and industry insights
                        to help you scale your field operations with precision.
                    </p>
                </div>
            </header>

            <main className="academy-main">
                {/* Tabs */}
                <div className="tabs-container">
                    <button
                        className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
                        onClick={() => setActiveTab('video')}
                    >
                        <Play size={20} />
                        <span>Video Masterclass</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'blog' ? 'active' : ''}`}
                        onClick={() => setActiveTab('blog')}
                    >
                        <FileText size={20} />
                        <span>Industry Insights</span>
                    </button>
                </div>

                {/* Content Grid */}
                <div className="content-grid">
                    {activeTab === 'video' ? (
                        ACADEMY_VIDEOS.map((video) => (
                            <div key={video.id} className="academy-card video" onClick={() => setSelectedVideo(video)}>
                                <div className="card-thumb">
                                    <img src={video.thumbnail} alt={video.title} />
                                    <div className="play-overlay">
                                        <div className="play-icon"><Play size={24} fill="currentColor" /></div>
                                    </div>
                                    <div className="duration-tag">{video.duration}</div>
                                </div>
                                <div className="card-info">
                                    <div className="card-category">{video.category}</div>
                                    <h3>{video.title}</h3>
                                    <p>{video.description}</p>
                                    <div className="card-footer">
                                        <span>Watch Tutorial</span>
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        ACADEMY_BLOGS.map((blog) => (
                            <Link href={`/academy/${blog.slug}`} key={blog.id} className="academy-card blog">
                                <div className="card-thumb">
                                    <img src={blog.thumbnail} alt={blog.title} />
                                    <div className="read-overlay">
                                        <div className="read-icon"><FileText size={24} /></div>
                                    </div>
                                    <div className="time-tag">{blog.readTime}</div>
                                </div>
                                <div className="card-info">
                                    <div className="card-category">{blog.category}</div>
                                    <h3>{blog.title}</h3>
                                    <p>{blog.excerpt}</p>
                                    <div className="card-meta">
                                        <span className="meta-item"><User size={14} /> {blog.author}</span>
                                        <span className="meta-item"><Calendar size={14} /> {blog.date}</span>
                                    </div>
                                    <div className="card-footer">
                                        <span>Read Full Article</span>
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </main>

            {/* Video Modal */}
            {selectedVideo && (
                <Modal
                    isOpen={!!selectedVideo}
                    onClose={() => setSelectedVideo(null)}
                    title={selectedVideo.title}
                    maxWidth="900px"
                >
                    <div className="video-player-container">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`${selectedVideo.videoUrl}?autoplay=1`}
                            title={selectedVideo.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </Modal>
            )}
        </div>
    );
}
