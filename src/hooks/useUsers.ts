"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { userService, CreateUserInput, UpdateUserInput } from '@/services/userService';
import { UserProfile, UserRole, DriverType } from '@/types/database';

interface UseUsersReturn {
    users: UserProfile[];
    filteredUsers: UserProfile[];
    loading: boolean;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    roleFilter: string;
    setRoleFilter: (v: string) => void;
    statusFilter: string;
    setStatusFilter: (v: string) => void;
    // Modal
    isModalOpen: boolean;
    editingUser: UserProfile | null;
    openAddModal: () => void;
    openEditModal: (user: UserProfile) => void;
    closeModal: () => void;
    // Actions
    handleCreateUser: (input: {
        fullName: string;
        email?: string;
        phone?: string;
        role: UserRole;
        driverType?: DriverType;
        tempPassword: string;
        clusterIds?: string[];
    }) => Promise<void>;
    handleUpdateUser: (userId: string, fields: UpdateUserInput) => Promise<void>;
    handleToggleActive: (userId: string, currentlyActive: boolean) => Promise<void>;
    handleDeleteUser: (userId: string) => Promise<void>;
    submitting: boolean;
}

export function useUsers(): UseUsersReturn {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

    // Fetch users on mount
    useEffect(() => {
        if (profile?.company_id) {
            loadUsers();
        }
    }, [profile?.company_id]);

    const loadUsers = useCallback(async () => {
        if (!profile?.company_id) return;
        try {
            setLoading(true);
            const data = await userService.fetchUsers(profile.company_id);
            setUsers(data || []);
        } catch (err: any) {
            showToast(`Failed to load users: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [profile?.company_id, showToast]);

    // Filtered users based on search + role + status
    const filteredUsers = users.filter((u) => {
        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                u.full_name.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.phone_number?.includes(q) ||
                u.role.toLowerCase().includes(q);
            if (!matchesSearch) return false;
        }
        // Role filter
        if (roleFilter && u.role !== roleFilter) return false;
        // Status filter
        if (statusFilter === 'active' && !u.is_active) return false;
        if (statusFilter === 'inactive' && u.is_active) return false;
        return true;
    });

    // Modal controls
    const openAddModal = () => { setEditingUser(null); setIsModalOpen(true); };
    const openEditModal = (user: UserProfile) => { setEditingUser(user); setIsModalOpen(true); };
    const closeModal = () => { setEditingUser(null); setIsModalOpen(false); };

    // Create user
    const handleCreateUser = async (input: {
        fullName: string;
        email?: string;
        phone?: string;
        role: UserRole;
        driverType?: DriverType;
        tempPassword: string;
        clusterIds?: string[];
    }) => {
        if (!profile?.company_id) return;
        setSubmitting(true);
        try {
            await userService.createUser({
                ...input,
                companyId: profile.company_id,
            });
            showToast(`${input.fullName} added as ${input.role} successfully`, 'success');
            closeModal();
            await loadUsers();
        } catch (err: any) {
            showToast(`Failed to create user: ${err.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Update user
    const handleUpdateUser = async (userId: string, fields: UpdateUserInput) => {
        setSubmitting(true);
        try {
            await userService.updateUser(userId, fields);
            showToast('User updated successfully', 'success');
            closeModal();
            await loadUsers();
        } catch (err: any) {
            showToast(`Failed to update user: ${err.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle active
    const handleToggleActive = async (userId: string, currentlyActive: boolean) => {
        try {
            await userService.toggleUserActive(userId, !currentlyActive);
            showToast(
                currentlyActive ? 'User deactivated' : 'User reactivated',
                currentlyActive ? 'info' : 'success'
            );
            await loadUsers();
        } catch (err: any) {
            showToast(`Failed to toggle user status: ${err.message}`, 'error');
        }
    };

    // Delete user
    const handleDeleteUser = async (userId: string) => {
        setSubmitting(true);
        try {
            await userService.deleteUser(userId);
            showToast('User deleted successfully', 'success');
            await loadUsers();
        } catch (err: any) {
            showToast(`Failed to delete user: ${err.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return {
        users,
        filteredUsers,
        loading,
        searchQuery,
        setSearchQuery,
        roleFilter,
        setRoleFilter,
        statusFilter,
        setStatusFilter,
        isModalOpen,
        editingUser,
        openAddModal,
        openEditModal,
        closeModal,
        handleCreateUser,
        handleUpdateUser,
        handleToggleActive,
        handleDeleteUser,
        submitting,
    };
}
