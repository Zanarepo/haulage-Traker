"use client";

import React from 'react';
import './RowActions.css';

export interface RowActionItem {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger' | 'success' | 'warning' | 'info';
    tooltip?: string;
}

interface RowActionsProps {
    actions: RowActionItem[];
}

export default function RowActions({ actions }: RowActionsProps) {
    return (
        <div className="row-actions">
            {actions.map((action, index) => (
                <button
                    key={index}
                    className={`row-action-btn ${action.variant || 'default'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        action.onClick();
                    }}
                    title={action.tooltip || action.label}
                    aria-label={action.label}
                >
                    <span className="action-icon">{action.icon}</span>
                </button>
            ))}
        </div>
    );
}
