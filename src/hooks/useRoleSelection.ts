'use client';

import { useAuth } from './useAuth';
import { useRouter } from 'next/navigation';

export function useRoleSelection() {
    const { availableProfiles, switchProfile, profile } = useAuth();
    const router = useRouter();

    /**
     * Handle the transition to a specific workspace
     */
    const selectWorkspace = (profileId: string, profileType: 'platform' | 'tenant') => {
        const selected = availableProfiles?.find(p => p.id === profileId && p.type === profileType);
        if (!selected) return;

        // 1. Update the active profile in context
        switchProfile(profileId, profileType);

        // 2. Redirect based on the workspace type
        if (selected.type === 'platform') {
            router.push('/nexhaul');
        } else {
            router.push('/dashboard');
        }
    };

    return {
        availableProfiles,
        selectWorkspace,
        currentProfileId: profile?.id
    };
}
