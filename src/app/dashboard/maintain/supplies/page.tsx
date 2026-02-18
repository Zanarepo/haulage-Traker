"use client";

import './supplies.css';
import '../maintain.css';
import '../../dashboard.css';
import {
    History,
    ArrowRightLeft,
    Trash2,
    Search
} from 'lucide-react';
import MyStock from './components/MyStock';
import IssueStockModal from './components/IssueStockModal';
import ReceiveStockModal from './components/ReceiveStockModal';
import CentralInventory from './components/CentralInventory';
import DataTable from '@/components/DataTable/DataTable';
import BatchDetailsModal from './components/BatchDetailsModal';
import ProductDetailsModal from './components/ProductDetailsModal';
import SuppliesHeader from './components/SuppliesHeader';
import SuppliesStats from './components/SuppliesStats';
import SuppliesFilters from './components/SuppliesFilters';
import StockRequests from './components/StockRequests';
import RequestStockModal from './components/RequestStockModal';
import ClusterReports from './components/ClusterReports';
import { useSupplies } from './hooks/useSupplies';
import { DataTableColumn } from '@/components/DataTable/DataTable';

export default function SupplyTrackingPage() {
    const {
        profile,
        allocations,
        restockHistory,
        receivingHistory,
        loading,
        activeTab,
        setActiveTab,
        isIssueModalOpen,
        setIsIssueModalOpen,
        isReceiveModalOpen,
        setIsReceiveModalOpen,
        restockProduct,
        setRestockProduct,
        refreshKey,
        setRefreshKey,
        selectedEngineerId,
        setSelectedEngineerId,
        allEngineers,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        selectedBatch,
        setSelectedBatch,
        isProductModalOpen,
        setIsProductModalOpen,
        selectedProduct,
        setSelectedProduct,
        isEngineer,
        isAdmin,
        canManageReceive,
        handleDeleteBatch,
        stockRequests,
        pendingRequestsCount,
        fulfillmentData,
        setFulfillmentData,
        isRequestModalOpen,
        setIsRequestModalOpen,
        stats
    } = useSupplies();

    const historyColumns: DataTableColumn<any>[] = [
        {
            key: 'batch_name',
            label: 'Batch / Reference',
            fullWidth: true,
            render: (batch) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span className="item-pill" style={{ cursor: 'pointer' }}>
                        {batch.batch_name || 'Individual Restock'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(batch.created_at).toLocaleDateString()}
                    </span>
                </div>
            )
        },
        {
            key: 'engineer',
            label: 'Assigned To',
            render: (batch) => batch.engineer?.full_name || '—'
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (batch) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className="btn-icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBatch({ id: batch.batch_id || batch.id, name: batch.batch_name || 'Individual Restock', type: 'issuance' });
                        }}
                        title="View Batch Details"
                    >
                        <ArrowRightLeft size={14} />
                    </button>
                    {isAdmin && (
                        <button
                            className="btn-icon-danger"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBatch(batch);
                            }}
                            title="Delete Entire Batch"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    const receivingHistoryColumns: DataTableColumn<any>[] = [
        {
            key: 'reference_no',
            label: 'Batch ID / Supplier',
            fullWidth: true,
            render: (batch) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span className="item-pill" style={{ cursor: 'pointer' }}>
                        {batch.reference_no || `REC-${batch.id.slice(0, 8)}`}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>
                        {batch.product_names || 'No items listed'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {batch.supplier_name || 'Generic Supplier'} · {new Date(batch.created_at).toLocaleDateString()}
                    </span>
                </div>
            )
        },
        {
            key: 'total_items',
            label: 'Qty',
            render: (batch) => <div className="qty-tag"><strong>{batch.total_items}</strong> pcs</div>
        },
        {
            key: 'total_value',
            label: 'Value',
            render: (batch) => <strong>{new Intl.NumberFormat('en-NG').format(batch.total_value)}</strong>
        },
        {
            key: 'receiver',
            label: 'Received By',
            render: (batch) => batch.receiver?.full_name || '—'
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (batch) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className="btn-icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBatch({ id: batch.id, name: batch.reference_no || `REC-${batch.id.slice(0, 8)}`, type: 'inflow' });
                        }}
                        title="View Inflow Details"
                    >
                        <ArrowRightLeft size={14} />
                    </button>
                </div>
            )
        }
    ];

    const historyPage = 1; // Simplified for now
    const paginatedHistory = restockHistory.slice(0, 8);

    return (
        <div className="supplies-page">
            <SuppliesHeader
                isEngineer={isEngineer}
                isAdmin={isAdmin}
                canManageReceive={canManageReceive}
                onAddInflow={() => setIsReceiveModalOpen(true)}
                onIssueToEngineer={() => setIsIssueModalOpen(true)}
                onRequestStock={() => setIsRequestModalOpen(true)}
            />

            <SuppliesStats
                inflowCount={stats.inflowCount}
                unitsReceived={stats.unitsReceived}
                unitsOutbound={stats.unitsOutbound}
                currentBalance={stats.currentBalance}
                isEngineer={isEngineer}
            />

            <SuppliesFilters
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isAdmin={isAdmin}
                isEngineer={isEngineer}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                pendingRequestsCount={pendingRequestsCount}
            />

            <div className="tab-content">
                {activeTab === 'inventory' && isAdmin && (
                    <CentralInventory
                        companyId={profile?.company_id || ''}
                        refreshKey={refreshKey}
                        canManage={canManageReceive}
                        onRestock={(product) => {
                            setRestockProduct(product);
                            setIsReceiveModalOpen(true);
                        }}
                        onViewDetails={(product) => {
                            setSelectedProduct(product);
                            setIsProductModalOpen(true);
                        }}
                    />
                )}

                {activeTab === 'stock' && (
                    <div className="stock-view-wrapper">
                        {!isEngineer && (
                            <div className="engineer-picker-bar" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                                <Search size={16} />
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>FILTER WALLET BY CLUSTER:</span>
                                <select
                                    className="engineer-select"
                                    value={selectedEngineerId || ''}
                                    onChange={(e) => setSelectedEngineerId(e.target.value)}
                                    style={{ padding: '0.5rem', borderRadius: '0.4rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', minWidth: '200px' }}
                                >
                                    <option value="">Select Cluster (Engineer)...</option>
                                    {allEngineers.map(eng => (
                                        <option key={eng.id} value={eng.id}>{eng.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <MyStock
                            key={`${refreshKey}-${selectedEngineerId || profile?.id}`}
                            engineerId={isEngineer ? (profile?.id || '') : (selectedEngineerId || '')}
                            companyId={profile?.company_id || ''}
                            adminView={!isEngineer}
                            onRowClick={(batch) => setSelectedBatch({
                                id: batch.batch_id || batch.id,
                                name: batch.batch_name || 'Individual Restock',
                                type: 'issuance'
                            })}
                            onSuccess={() => setRefreshKey(prev => prev + 1)}
                        />
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="history-view">
                        <DataTable
                            columns={historyColumns}
                            data={paginatedHistory}
                            keyExtractor={(item) => item.batch_id || item.id}
                            loading={loading}
                            onRowClick={(batch) => setSelectedBatch({ id: batch.batch_id || batch.id, name: batch.batch_name || 'Individual Restock', type: 'issuance' })}
                            emptyMessage="No restock logs found."
                            emptyIcon={<History size={48} />}
                        />
                    </div>
                )}

                {activeTab === 'receiving_history' && isAdmin && (
                    <div className="history-view">
                        <DataTable
                            columns={receivingHistoryColumns}
                            data={receivingHistory}
                            keyExtractor={(item) => item.id}
                            loading={loading}
                            onRowClick={(batch) => setSelectedBatch({ id: batch.id, name: batch.reference_no || `REC-${batch.id.slice(0, 8)}`, type: 'inflow' })}
                            emptyMessage="No stock inflow history found."
                            emptyIcon={<ArrowRightLeft size={48} />}
                        />
                    </div>
                )}

                {activeTab === 'requests' && (
                    <StockRequests
                        requests={stockRequests}
                        loading={loading}
                        isAdmin={isAdmin}
                        userId={profile?.id || ''}
                        onFulfill={(req) => {
                            setFulfillmentData(req);
                            setIsIssueModalOpen(true);
                        }}
                        onRefresh={() => setRefreshKey(prev => prev + 1)}
                    />
                )}

                {activeTab === 'reports' && (
                    <div className="history-view">
                        <ClusterReports
                            companyId={profile?.company_id || ''}
                            allEngineers={allEngineers}
                        />
                    </div>
                )}
            </div>

            <IssueStockModal
                isOpen={isIssueModalOpen}
                onClose={() => {
                    setIsIssueModalOpen(false);
                    setFulfillmentData(null);
                }}
                companyId={profile?.company_id || ''}
                fulfillmentData={fulfillmentData}
                onSuccess={() => setRefreshKey(prev => prev + 1)}
            />

            <ReceiveStockModal
                isOpen={isReceiveModalOpen}
                onClose={() => {
                    setIsReceiveModalOpen(false);
                    setRestockProduct(null);
                }}
                companyId={profile?.company_id || ''}
                userId={profile?.id || ''}
                prefillProduct={restockProduct}
                onSuccess={() => setRefreshKey(prev => prev + 1)}
            />

            <BatchDetailsModal
                isOpen={!!selectedBatch}
                onClose={() => setSelectedBatch(null)}
                batchId={selectedBatch?.id || null}
                batchName={selectedBatch?.name || ''}
                batchType={selectedBatch?.type}
                mode="batch"
                onSuccess={() => setRefreshKey(prev => prev + 1)}
            />

            <ProductDetailsModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                product={selectedProduct}
            />

            <RequestStockModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                companyId={profile?.company_id || ''}
                engineerId={profile?.id || ''}
                onSuccess={() => setRefreshKey(prev => prev + 1)}
            />
        </div>
    );
}
