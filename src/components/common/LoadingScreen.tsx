"use client";

import React from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
    message?: string;
}

export default function LoadingScreen({ message = 'Loading NexHaul...' }: LoadingScreenProps) {
    return (
        <div className="loading-screen-container">
            <div className="loading-content">
                <div className="loader-wrapper">
                    <div className="loader-ring"></div>
                    <div className="loader-core"></div>
                </div>
                <p className="loading-text">{message}</p>
            </div>
            <div className="loading-glow"></div>
        </div>
    );
}
