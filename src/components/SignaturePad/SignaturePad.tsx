"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, Undo2 } from 'lucide-react';
import './signature-pad.css';

interface SignaturePadProps {
    onSave: (dataUrl: string) => void;
    onClear?: () => void;
    placeholder?: string;
}

export default function SignaturePad({ onSave, onClear, placeholder = "Sign here..." }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set high quality
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        ctx.strokeStyle = '#f8fafc'; // Slignly off-white for dark mode
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        setIsEmpty(false);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
        if (onClear) onClear();
    };

    const save = () => {
        if (isEmpty) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        onSave(canvas.toDataURL('image/png'));
    };

    return (
        <div className="signature-pad-container">
            <div className="pad-header">
                <span className="placeholder-text">{isEmpty ? placeholder : 'Digital Signature Captured'}</span>
                <div className="pad-actions">
                    <button type="button" onClick={clear} title="Clear">
                        <Eraser size={14} />
                    </button>
                </div>
            </div>

            <div className="canvas-wrapper">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>

            <div className="pad-footer">
                <button
                    type="button"
                    className={`btn-save-sig ${isEmpty ? 'disabled' : ''}`}
                    onClick={save}
                    disabled={isEmpty}
                >
                    <Check size={14} /> Confirm Signature
                </button>
            </div>
        </div>
    );
}
