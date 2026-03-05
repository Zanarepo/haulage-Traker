"use client";

import React, { useState, useMemo } from 'react';
import '../maintain.css';
import '../../dashboard.css';
import './knowledge-base.css';
import {
    BookOpen,
    Plus,
    Calendar,
    Edit2,
    Trash2,
    RefreshCcw,
    Book,
    ClipboardCheck
} from 'lucide-react';
import { useKnowledgeBase, SOP } from './hooks/useKnowledgeBase';
import { useAuth } from '@/hooks/useAuth';
import SOPModal from './components/SOPModal';
import DataTable, { DataTableColumn, DataTableFilter } from '@/components/DataTable/DataTable';
import RowActions, { RowActionItem } from '@/components/RowActions/RowActions';
import { format } from 'date-fns';

export default function KnowledgeBasePage() {
    const { profile, isPlatformAdmin } = useAuth();
    const {
        sops,
        loading,
        categories,
        createSOP,
        updateSOP,
        deleteSOP,
        submitExecution,
        refresh
    } = useKnowledgeBase();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const isManager = isPlatformAdmin ||
        profile?.role === 'admin' ||
        profile?.role === 'manager' ||
        profile?.role === 'superadmin' ||
        profile?.role === 'md' ||
        profile?.role === 'warehouse_manager' ||
        profile?.role === 'store_manager' ||
        profile?.role === 'storekeeper';

    const filteredSOPs = useMemo(() => {
        return sops.filter(sop => {
            const matchesSearch = !searchQuery ||
                sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (sop.asset_type || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || sop.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [sops, searchQuery, selectedCategory]);

    const handleEdit = (sop: SOP) => {
        setSelectedSOP(sop);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedSOP(null);
        setIsModalOpen(true);
    };

    const columns: DataTableColumn<SOP>[] = [
        {
            key: 'title',
            label: 'SOP Document',
            mobileLabel: 'Procedure',
            fullWidth: true,
            render: (sop) => (
                <div className="sop-info">
                    <div className="sop-icon">
                        {categories.find(c => c.id === sop.category)?.icon || '📄'}
                    </div>
                    <div>
                        <div className="sop-title">{sop.title}</div>
                        <div className="sop-subtitle">
                            Target: {sop.asset_type || 'General Equipment'}
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'category',
            label: 'Category',
            mobileLabel: 'Type',
            render: (sop) => (
                <span className="category-pill">
                    {sop.category.replace('_', ' ')}
                </span>
            )
        },
        {
            key: 'meta',
            label: 'Last Updated',
            mobileLabel: 'Modified',
            render: (sop) => (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={12} />
                    <span>{format(new Date(sop.updated_at || sop.created_at), 'MMM dd, yyyy')}</span>
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            mobileLabel: 'Actions',
            align: 'right',
            render: (sop) => {
                const actions: RowActionItem[] = [
                    {
                        label: isManager ? 'Edit' : 'View',
                        icon: isManager ? <Edit2 size={13} /> : <ClipboardCheck size={13} />,
                        onClick: () => handleEdit(sop),
                        tooltip: isManager ? 'Edit SOP' : 'View Checklist'
                    }
                ];

                if (isManager) {
                    actions.push({
                        label: 'Delete',
                        icon: <Trash2 size={13} />,
                        onClick: () => {
                            if (confirm('Are you sure you want to delete this SOP?')) {
                                deleteSOP(sop.id);
                            }
                        },
                        variant: 'danger',
                        tooltip: 'Delete SOP'
                    });
                }
                return <RowActions actions={actions} />;
            }
        }
    ];

    const filters: DataTableFilter[] = [
        {
            label: 'Category',
            value: selectedCategory,
            onChange: setSelectedCategory,
            options: [
                { value: 'all', label: 'All Categories' },
                ...categories.map(cat => ({ value: cat.id, label: cat.label }))
            ]
        }
    ];

    return (
        <div className="knowledge-base-page">
            <header className="page-header">
                <div>
                    <h1>Knowledge Base</h1>
                    <p>Standard Operating Procedures and maintenance guides</p>
                </div>
            </header>

            <div className="user-stats">
                <div
                    className={`stat-chip clickable ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                >
                    <BookOpen size={16} style={{ color: '#3b82f6' }} />
                    <span className="stat-value">{sops.length}</span>
                    <span className="stat-label">Total SOPs</span>
                </div>
                {categories.map((cat: any) => (
                    <div
                        key={cat.id}
                        className={`stat-chip clickable ${selectedCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
                    >
                        <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                        <span className="stat-value">{sops.filter(s => s.category === cat.id).length}</span>
                        <span className="stat-label">{cat.label}</span>
                    </div>
                ))}
            </div>

            <DataTable
                columns={columns}
                data={filteredSOPs}
                keyExtractor={(item) => item.id}
                loading={loading}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by title or asset..."
                filters={filters}
                onRowClick={handleEdit}
                emptyMessage="No SOPs found. Create your first guide to get started!"
                emptyIcon={<Book size={40} style={{ opacity: 0.2 }} />}
                actions={
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className="btn-refresh-pill"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                            onClick={() => refresh && refresh()}
                            title="Refresh List"
                        >
                            <RefreshCcw size={18} />
                        </button>
                        {isManager && (
                            <button className="btn-new-sop" onClick={handleCreate}>
                                <Plus size={15} />
                                New SOP
                            </button>
                        )}
                    </div>
                }
            />

            <SOPModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                sop={selectedSOP}
                onSave={async (data) => {
                    try {
                        if (isManager) {
                            if (selectedSOP) {
                                await updateSOP(selectedSOP.id, data);
                            } else {
                                await createSOP(data);
                            }
                        } else {
                            // Engineer execution submission
                            if (selectedSOP) {
                                await submitExecution(selectedSOP.id, data.steps_json);
                                alert('Compliance report submitted successfully!');
                            }
                        }
                        setIsModalOpen(false);
                    } catch (err) {
                        alert('Operation failed. Please try again.');
                    }
                }}
                onDelete={deleteSOP}
                categories={categories}
                userRole={profile?.role}
            />
        </div>
    );
}
