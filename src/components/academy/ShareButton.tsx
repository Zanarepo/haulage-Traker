"use client";

import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareButton() {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: document.title,
                    url: url
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.log('Error copying:', err);
            }
        }
    };

    return (
        <button
            className={`share-btn ${copied ? 'copied' : ''}`}
            onClick={handleShare}
            title="Share article"
        >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
            {copied && <span className="share-tooltip">Link Copied!</span>}
        </button>
    );
}
