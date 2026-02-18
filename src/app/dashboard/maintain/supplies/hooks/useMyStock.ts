import { useState, useEffect } from 'react';
import { maintainService } from '@/services/maintainService';
import { useToast } from '@/hooks/useToast';

interface UseMyStockProps {
    engineerId: string;
    companyId: string;
    onSuccess?: () => void;
}

export function useMyStock({ engineerId, companyId, onSuccess }: UseMyStockProps) {
    const { showToast } = useToast();
    const [batches, setBatches] = useState<any[]>([]);
    const [ledger, setLedger] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [engineerId]);

    const loadData = async () => {
        if (!engineerId) {
            setLoading(false);
            setBatches([]);
            return;
        }

        try {
            setLoading(true);
            const [b, l] = await Promise.all([
                maintainService.getEngineerBatchWallet(companyId, engineerId),
                maintainService.getInventoryLedger(engineerId)
            ]);
            setBatches(b);
            setLedger(l);
        } catch (err) {
            console.error('[MyStock]', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBatch = async (batchId: string, batchName?: string) => {
        if (!confirm(`Are you sure you want to delete the entire batch "${batchName || 'Restock'}"? This will restore balances for all items in it.`)) return;

        try {
            setLoading(true);
            await maintainService.deleteBatch(batchId);
            showToast('Batch deleted successfully.', 'success');
            loadData();
            if (onSuccess) onSuccess();
        } catch (err) {
            showToast('Failed to delete batch.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return {
        batches,
        ledger,
        loading,
        handleDeleteBatch,
        loadData
    };
}
