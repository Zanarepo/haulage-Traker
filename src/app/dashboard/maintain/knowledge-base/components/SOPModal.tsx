"use client";

import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    Trash2,
    FileText,
    Layers,
    Plus,
    GripVertical,
    CheckCircle2,
    Info,
    Lock,
    Clock,
    ClipboardCheck,
    Link as LinkIcon,
    Square,
    CheckSquare
} from 'lucide-react';
import { SOP } from '../hooks/useKnowledgeBase';
import '../knowledge-base.css';

interface SOPSection {
    id: string;
    title: string;
    steps: {
        id: string;
        text: string;
        completed?: boolean;
        completedBy?: string;
        completedAt?: string;
    }[];
}

interface SOPModalProps {
    isOpen: boolean;
    onClose: () => void;
    sop?: SOP | null;
    onSave: (sop: Partial<SOP>) => Promise<any>;
    onDelete?: (id: string) => Promise<void>;
    categories: { id: string; label: string; icon: string; color: string }[];
    userRole?: string; // 'admin', 'manager', 'engineer'
    workOrderId?: string;
}

const SECTION_EXAMPLES: Record<string, string> = {
    'Pre-Checks': 'Example: Check oil levels, Inspect battery terminals',
    'Safety': 'Example: Wear PPE, Isolate electrical power',
    'Mechanical': 'Example: Change air filter, Torque head bolts',
    'Testing': 'Example: Load test at 50%, Check output voltage'
};

export default function SOPModal({
    isOpen,
    onClose,
    sop,
    onSave,
    onDelete,
    categories,
    userRole = 'admin',
    workOrderId
}: SOPModalProps) {
    const isManager = userRole?.startsWith('nex') ||
        userRole === 'admin' ||
        userRole === 'manager' ||
        userRole === 'superadmin' ||
        userRole === 'md' ||
        userRole === 'warehouse_manager' ||
        userRole === 'store_manager' ||
        userRole === 'storekeeper';
    const isEngineer = !isManager; // If not a manager/admin, they are an execution engineer
    const isExecutionMode = !!workOrderId; // Viewing/Executing a specific WO checklist

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<string>('generator');
    const [assetType, setAssetType] = useState('');
    const [sections, setSections] = useState<SOPSection[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [existingLog, setExistingLog] = useState<any>(null);
    const [isLoadingLog, setIsLoadingLog] = useState(false);

    // Custom Category State
    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const [customCategory, setCustomCategory] = useState('');

    const isLocked = existingLog?.locked_at && new Date() > new Date(existingLog.locked_at) && isEngineer;

    useEffect(() => {
        if (isOpen) {
            setTitle(sop?.title || '');
            setCategory(sop?.category || 'generator');
            setAssetType(sop?.asset_type || '');
            setIsAddingCustom(false);
            setCustomCategory('');

            const populateFromSOP = () => {
                if (sop?.steps_json && Array.isArray(sop.steps_json)) {
                    const normalizedSections = sop.steps_json.map((s: any) => ({
                        ...s,
                        steps: s.steps.map((step: any) =>
                            typeof step === 'string' ? { id: Math.random().toString(36).substr(2, 9), text: step } : step
                        )
                    }));
                    setSections(normalizedSections);
                } else if (typeof sop?.steps_json === 'string' && sop.steps_json.trim()) {
                    setSections([{ id: Date.now().toString(), title: 'General Steps', steps: [{ id: '1', text: sop.steps_json }] }]);
                } else {
                    setSections([{ id: Date.now().toString(), title: 'Pre-Checks', steps: [{ id: '1', text: '' }] }]);
                }
            };

            if (!workOrderId) {
                populateFromSOP();
            } else {
                // If workOrderId is provided, always try to load existing log regardless of role
                // This allows Admins/Managers to view the submitted results
                const loadExistingLog = async () => {
                    if (isOpen && workOrderId && sop?.id) {
                        try {
                            setIsLoadingLog(true);
                            const { supabase } = await import('@/lib/supabase');
                            const { data, error } = await supabase
                                .from('maintain_sop_execution_logs')
                                .select('*')
                                .eq('work_order_id', workOrderId)
                                .eq('sop_id', sop.id)
                                .order('submitted_at', { ascending: false })
                                .limit(1)
                                .maybeSingle();

                            if (error) {
                                console.error('Supabase Error loading SOP log:', error);
                                populateFromSOP();
                                return;
                            }

                            if (data) {
                                setExistingLog(data);
                                if (data.execution_data && Array.isArray(data.execution_data)) {
                                    setSections(data.execution_data);
                                }
                            } else {
                                setExistingLog(null);
                                // If no log exists and user is a manager, they are likely editing the template
                                // If user is engineer and no log, show template for new execution
                                populateFromSOP();
                            }
                        } catch (err: any) {
                            console.error('Runtime Error loading SOP log:', err?.message || err);
                            populateFromSOP();
                        } finally {
                            setIsLoadingLog(false);
                        }
                    }
                };
                loadExistingLog();
            }
        } else {
            // Clean up when closed
            setExistingLog(null);
            setSections([]);
        }
    }, [sop, isOpen, workOrderId, isEngineer]);

    if (!isOpen) return null;

    const addSection = () => {
        if (isLocked) return;
        setSections([...sections, { id: Date.now().toString(), title: '', steps: [{ id: Date.now().toString(), text: '' }] }]);
    };

    const removeSection = (sectionId: string) => {
        if (isLocked) return;
        setSections(sections.filter(s => s.id !== sectionId));
    };

    const updateSectionTitle = (sectionId: string, value: string) => {
        if (isLocked) return;
        setSections(sections.map(s => s.id === sectionId ? { ...s, title: value } : s));
    };

    const addStep = (sectionId: string) => {
        if (isLocked) return;
        setSections(sections.map(s => s.id === sectionId ? { ...s, steps: [...s.steps, { id: Date.now().toString(), text: '' }] } : s));
    };

    const removeStep = (sectionId: string, stepId: string) => {
        if (isLocked) return;
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                return { ...s, steps: s.steps.filter(st => st.id !== stepId) };
            }
            return s;
        }));
    };

    const updateStepText = (sectionId: string, stepId: string, value: string) => {
        if (isLocked) return;
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                return { ...s, steps: s.steps.map(st => st.id === stepId ? { ...st, text: value } : st) };
            }
            return s;
        }));
    };

    const toggleStepCompletion = (sectionId: string, stepId: string) => {
        if (!isEngineer || isLocked) return;
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    steps: s.steps.map(st => st.id === stepId ? {
                        ...st,
                        completed: !st.completed,
                        completedAt: !st.completed ? new Date().toISOString() : undefined
                    } : st)
                };
            }
            return s;
        }));
    };

    const totalSteps = sections.reduce((acc, s) => acc + s.steps.length, 0);
    const completedSteps = sections.reduce((acc, s) => acc + s.steps.reduce((sc, step) => sc + (step.completed ? 1 : 0), 0), 0);
    const allCompleted = totalSteps > 0 && completedSteps === totalSteps;

    const handleSubmit = async (e: React.FormEvent) => {
        if (isEngineer && !allCompleted) return;
        e.preventDefault();
        try {
            setSubmitting(true);

            const finalCategory = isAddingCustom ? customCategory.toLowerCase().replace(/\s+/g, '_') : category;

            const cleanedSections = sections
                .filter(s => s.title.trim() || s.steps.some(step => step.text.trim()))
                .map(s => ({
                    ...s,
                    steps: s.steps.filter(step => step.text.trim())
                }));

            await onSave({
                title,
                category: finalCategory as any,
                asset_type: assetType,
                steps_json: cleanedSections
            });
            onClose();
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const isChecklistMode = isExecutionMode || !!existingLog;

    return (
        <div className="maintain-modal-overlay">
            <div className={`maintain-modal-content wide structured-sop-modal ${isChecklistMode ? 'checklist-mode' : ''}`}>
                <div className="modal-header">
                    <div className="header-left">
                        <div className="icon-wrap" style={{
                            background: isExecutionMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            color: isExecutionMode ? '#10b981' : '#3b82f6'
                        }}>
                            {isExecutionMode ? <ClipboardCheck size={20} /> : <FileText size={20} />}
                        </div>
                        <div>
                            <h2>{isExecutionMode ? 'Execute SOP Checklist' : (sop ? 'Edit SOP Guide' : 'Build New SOP')}</h2>
                            <p>{isExecutionMode ? 'Complete steps for verification' : 'Standardize your maintenance procedures'}</p>
                        </div>
                    </div>
                    {isLocked && (
                        <div className="locked-badge" style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            <Lock size={12} />
                            COMPLETED & LOCKED
                        </div>
                    )}
                    {!isLocked && existingLog && isEngineer && (
                        <div className="locked-badge" style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                        }}>
                            <Clock size={12} />
                            OPEN FOR UPDATES (2H WINDOW)
                        </div>
                    )}
                    {workOrderId && (
                        <div className="linking-badge">
                            <LinkIcon size={12} />
                            <span>Linked to WO #{workOrderId.slice(0, 5)}</span>
                        </div>
                    )}
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form-content">
                    <div className="modal-body">
                        {/* Definition Area (Top Info) */}
                        <div className="sop-header-fields">
                            <div className="field-group">
                                <label>SOP Title</label>
                                {isExecutionMode ? (
                                    <div className="read-only-val" style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)', padding: '4px 0' }}>{title}</div>
                                ) : (
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. 500-Hour Generator Major Service"
                                        required
                                    />
                                )}
                            </div>
                            <div className="field-row">
                                <div className="field-group">
                                    <label>Category</label>
                                    {isAddingCustom ? (
                                        <div className="custom-input-wrap">
                                            <input
                                                type="text"
                                                value={customCategory}
                                                onChange={(e) => setCustomCategory(e.target.value)}
                                                placeholder="Enter new category..."
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                className="btn-cancel-custom"
                                                onClick={() => setIsAddingCustom(false)}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="custom-select">
                                            {!isExecutionMode && <Layers size={14} className="icon" />}
                                            {isExecutionMode ? (
                                                <div className="read-only-val" style={{ padding: '8px 0', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '1.2rem' }}>{categories.find(c => c.id === category)?.icon}</span>
                                                    <span>{categories.find(c => c.id === category)?.label}</span>
                                                </div>
                                            ) : (
                                                <select
                                                    value={category}
                                                    onChange={(e) => {
                                                        if (e.target.value === 'add_new') {
                                                            setIsAddingCustom(true);
                                                        } else {
                                                            setCategory(e.target.value);
                                                        }
                                                    }}
                                                >
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                                                    ))}
                                                    <option value="add_new">+ Add New Category...</option>
                                                </select>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="field-group">
                                    <label>Target Equipment Type</label>
                                    {isExecutionMode ? (
                                        <div className="read-only-val" style={{ padding: '8px 0', fontWeight: 500 }}>{assetType || 'General Equipment'}</div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={assetType}
                                            onChange={(e) => setAssetType(e.target.value)}
                                            placeholder="e.g. Perkin Elmer 200kVA"
                                            required
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Procedure Builder / Checklist */}
                        <div className="sop-builder-container">
                            <div className="builder-header">
                                <h3>{isExecutionMode ? 'Task Checklist' : 'Procedure Workflow'}</h3>
                                {!isExecutionMode && (
                                    <button type="button" className="btn-add-section" onClick={addSection}>
                                        <Plus size={14} /> Add Segment
                                    </button>
                                )}
                            </div>

                            <div className="sections-list">
                                {isLoadingLog ? (
                                    <div className="maintain-empty" style={{ padding: '4rem 0' }}>
                                        <Clock className="animate-spin" size={32} />
                                        <p>Fetching checklist state...</p>
                                    </div>
                                ) : isChecklistMode ? (
                                    <div className="sop-execution-table-wrap unified-table">
                                        <table className="sop-execution-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '50px' }}>STATUS</th>
                                                    <th>TASK DESCRIPTION</th>
                                                    <th style={{ width: '150px' }}>COMPLETED AT</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sections.map((section, sIndex) => (
                                                    <React.Fragment key={section.id}>
                                                        {/* Section Header Row */}
                                                        <tr className="sop-section-header-row">
                                                            <td colSpan={3}>
                                                                <div className="section-title-label">
                                                                    {section.title}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {section.steps.map((step) => (
                                                            <tr
                                                                key={step.id}
                                                                className={step.completed ? 'completed' : ''}
                                                                onClick={() => toggleStepCompletion(section.id, step.id)}
                                                            >
                                                                <td className="center">
                                                                    <div className="checklist-box">
                                                                        {step.completed ?
                                                                            <CheckSquare size={18} color="#10b981" /> :
                                                                            <Square size={18} color="var(--text-muted)" />
                                                                        }
                                                                    </div>
                                                                </td>
                                                                <td className="task-text">
                                                                    <div
                                                                        style={{
                                                                            textDecoration: step.completed ? 'line-through' : 'none',
                                                                            opacity: step.completed ? 0.6 : 1
                                                                        }}
                                                                    >
                                                                        {step.text}
                                                                    </div>
                                                                </td>
                                                                <td className="time-col">
                                                                    {step.completedAt ? new Date(step.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    sections.map((section, sIndex) => (
                                        <div key={section.id} className="sop-builder-section">
                                            <div className="section-head">
                                                <GripVertical size={16} className="drag-handle" />
                                                <input
                                                    type="text"
                                                    className="section-title-input"
                                                    value={section.title}
                                                    onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                                    placeholder="Section Title (e.g. Mechanical)"
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-remove-section"
                                                    onClick={() => removeSection(section.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>

                                            <div className="steps-list">
                                                {section.steps.map((step, stIndex) => (
                                                    <div key={step.id} className="step-row">
                                                        <span className="step-num">{stIndex + 1}</span>
                                                        <input
                                                            type="text"
                                                            className="step-input"
                                                            value={step.text}
                                                            onChange={(e) => updateStepText(section.id, step.id, e.target.value)}
                                                            placeholder="Describe task..."
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn-item-action"
                                                            onClick={() => removeStep(section.id, step.id)}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    className="btn-add-step"
                                                    onClick={() => addStep(section.id)}
                                                >
                                                    <Plus size={12} /> Add step
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                    <div className="modal-footer">
                        {isManager && sop && onDelete && !isExecutionMode && (
                            <button
                                type="button"
                                className="btn-maintain-action delete"
                                onClick={() => {
                                    if (confirm('Permanently delete this SOP?')) onDelete(sop.id).then(onClose);
                                }}
                            >
                                <Trash2 size={18} />
                                Delete
                            </button>
                        )}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
                            <button type="button" className="btn-maintain-action secondary" onClick={onClose}>
                                {isExecutionMode ? 'Close' : 'Cancel'}
                            </button>
                            {isManager && !isExecutionMode && (
                                <button type="submit" className="btn-maintain-action" disabled={submitting}>
                                    <Save size={18} />
                                    {submitting ? 'Saving...' : 'Save SOP'}
                                </button>
                            )}
                            {isEngineer && !isLocked && (
                                <button
                                    type="button"
                                    className={`btn-maintain-action ${!allCompleted ? 'disabled' : ''}`}
                                    onClick={handleSubmit}
                                    style={{
                                        background: allCompleted ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--bg-hover)',
                                        color: allCompleted ? 'white' : 'var(--text-muted)',
                                        cursor: allCompleted ? 'pointer' : 'not-allowed',
                                        opacity: allCompleted ? 1 : 0.6,
                                        gap: '8px'
                                    }}
                                    disabled={!allCompleted || submitting}
                                >
                                    <CheckCircle2 size={18} />
                                    {submitting ? 'Submitting...' : (allCompleted ? (existingLog ? 'Update Execution' : 'Submit Execution') : `Finish Checklist (${completedSteps}/${totalSteps})`)}
                                </button>
                            )}
                            {isLocked && (
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontStyle: 'italic',
                                    borderLeft: '2px solid var(--border-color)',
                                    paddingLeft: '1rem'
                                }}>
                                    <Info size={14} />
                                    This checklist was submitted on {new Date(existingLog.submitted_at).toLocaleDateString()} at {new Date(existingLog.submitted_at).toLocaleTimeString()} and is now read-only.
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </div >
        </div >
    );
}
