'use client';

import { useState, useCallback } from 'react';
import { registrationService } from '@/services/registrationService';

export function useRegister() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        companyName: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await registrationService.registerCompany(formData);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to register company');
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        loading,
        error,
        success,
        handleChange,
        handleRegister
    };
}
