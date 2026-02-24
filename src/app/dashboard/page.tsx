"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanyModules } from '@/hooks/useCompanyModules';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardRedirectPage() {
    const { profile } = useAuth();
    const router = useRouter();
    const { activeProduct, loading } = useCompanyModules(profile?.company_id || null);

    useEffect(() => {
        if (!loading && activeProduct) {
            router.replace(activeProduct === 'maintain' ? '/dashboard/maintain' : '/dashboard/supply');
        }
    }, [activeProduct, loading, router]);

    return (
        <div style={{
            display: 'flex',
            height: '60vh',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '1rem',
            color: 'var(--text-muted)'
        }}>
            <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p>Directing to your dashboard...</p>
            <style jsx>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
