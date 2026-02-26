"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanyModules } from '@/hooks/useCompanyModules';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/common/LoadingScreen';

export default function DashboardRedirectPage() {
    const { profile } = useAuth();
    const router = useRouter();
    const { activeProduct, loading } = useCompanyModules(profile?.company_id || null);

    useEffect(() => {
        if (!loading && activeProduct) {
            router.replace(activeProduct === 'maintain' ? '/dashboard/maintain' : '/dashboard/supply');
        }
    }, [activeProduct, loading, router]);

    return <LoadingScreen message="Directing to your dashboard..." />;
}
