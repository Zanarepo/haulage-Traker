"use client";

import React, { useState } from 'react';
import {
    User,
    Shield,
    Save,
    AlertCircle,
    CheckCircle2,
    Lock,
    Mail,
    Phone,
    KeyRound
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/userService';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import './settings.css';

export default function SettingsPage() {
    const { profile, refreshProfile } = useAuth();
    const { showToast } = useToast();

    // Profile State
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [updatingProfile, setUpdatingProfile] = useState(false);

    // Sync profile data when it loads
    React.useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setPhoneNumber(profile.phone_number || '');
        }
    }, [profile]);

    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [updatingPassword, setUpdatingPassword] = useState(false);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        try {
            setUpdatingProfile(true);
            await userService.updateUser(profile.id, {
                full_name: fullName,
                phone_number: phoneNumber
            } as any);

            if (typeof refreshProfile === 'function') {
                await refreshProfile();
            }
            showToast('Profile updated successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to update profile', 'error');
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            setUpdatingPassword(true);
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            showToast('Password updated successfully', 'success');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            showToast(error.message || 'Failed to update password', 'error');
        } finally {
            setUpdatingPassword(false);
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h1>Account Settings</h1>
                <p>Manage your account preferences and security</p>
            </div>

            <div className="settings-grid">
                {/* Profile Management */}
                <div className="settings-card">
                    <div className="card-title">
                        <div className="icon-bg"><User size={20} /></div>
                        <h3>Profile Information</h3>
                    </div>

                    <form onSubmit={handleUpdateProfile}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Full Name</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Phone Number</label>
                                <div className="input-wrapper">
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="e.g. +234..."
                                    />
                                </div>
                            </div>

                            <div className="form-group full">
                                <label>Email Address</label>
                                <div className="input-wrapper">
                                    <input
                                        type="email"
                                        value={profile?.email || ''}
                                        disabled
                                    />
                                </div>
                                <span className="helper-text">Email cannot be changed manually. Contact admin if required.</span>
                            </div>
                        </div>

                        <div className="card-actions">
                            <button
                                type="submit"
                                className="btn-save"
                                disabled={updatingProfile}
                            >
                                {updatingProfile ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Security Section */}
                <div className="settings-card">
                    <div className="card-title">
                        <div className="icon-bg" style={{ color: '#ef4444' }}><Shield size={20} /></div>
                        <h3>Security & Password</h3>
                    </div>

                    <form onSubmit={handleChangePassword}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>New Password</label>
                                <div className="input-wrapper">
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <div className="input-wrapper">
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="password-requirements">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                                <AlertCircle size={14} /> Password Requirements:
                            </label>
                            <ul>
                                <li>Minimum 6 characters long</li>
                                <li>Should contain a mix of letters and numbers</li>
                            </ul>
                        </div>

                        <div className="card-actions">
                            <button
                                type="submit"
                                className="btn-save"
                                disabled={updatingPassword || !newPassword}
                                style={{ background: '#ef4444' }}
                            >
                                {updatingPassword ? 'Updating...' : <><KeyRound size={18} /> Update Password</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
