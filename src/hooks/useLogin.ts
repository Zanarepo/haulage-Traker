'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useLogin() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let loginData;

            if (identifier.includes('@')) {
                loginData = await supabase.auth.signInWithPassword({
                    email: identifier,
                    password,
                });
            } else {
                loginData = await supabase.auth.signInWithPassword({
                    phone: identifier,
                    password,
                });
            }

            if (loginData.error) throw loginData.error;
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return {
        identifier,
        setIdentifier,
        password,
        setPassword,
        loading,
        error,
        handleLogin
    };
}
