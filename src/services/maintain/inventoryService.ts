import { supabase } from '@/lib/supabase';

export interface StockItem {
    id: string;
    engineer_id: string;
    item_name: string;
    item_category?: string;
    balance: number;
    unit: string;
    updated_at: string;
}

export interface LedgerEntry {
    engineer_id: string;
    company_id: string;
    work_order_id?: string;
    batch_id?: string;
    batch_name?: string;
    item_name: string;
    item_category?: string;
    quantity: number;
    unit?: string;
    transaction_type: 'restock' | 'usage' | 'return' | 'adjustment';
    master_id?: string;
    notes?: string;
    recorded_by: string;
}

export const inventoryService = {
    async saveInventoryLog(companyId: string, workOrderId: string, userId: string, items: Array<{ item_name: string; quantity: number; notes?: string }>) {
        const logs = items.map(item => ({
            work_order_id: workOrderId,
            company_id: companyId,
            recorded_by: userId,
            ...item
        }));

        await supabase.from('maintain_inventory_logs').insert(logs);

        const ledgerEntries: LedgerEntry[] = items.map(item => ({
            engineer_id: userId,
            company_id: companyId,
            work_order_id: workOrderId,
            item_name: item.item_name,
            quantity: -item.quantity,
            transaction_type: 'usage',
            notes: item.notes,
            recorded_by: userId
        }));

        const { data, error } = await supabase
            .from('maintain_inventory_ledger')
            .insert(ledgerEntries)
            .select();

        if (error) throw error;
        return data;
    },

    async getInventoryLogs(workOrderId: string) {
        const { data, error } = await supabase
            .from('maintain_inventory_logs')
            .select('*')
            .eq('work_order_id', workOrderId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },

    async deleteInventoryLog(logId: string) {
        const { data: log } = await supabase
            .from('maintain_inventory_logs')
            .select('*')
            .eq('id', logId)
            .single();

        if (log) {
            await supabase
                .from('maintain_inventory_ledger')
                .delete()
                .eq('work_order_id', log.work_order_id)
                .eq('item_name', log.item_name)
                .eq('transaction_type', 'usage');
        }

        const { error } = await supabase
            .from('maintain_inventory_logs')
            .delete()
            .eq('id', logId);

        if (error) throw error;
        return true;
    },

    async getSupplyAllocations(companyId: string, filters?: { engineerId?: string; startDate?: string; endDate?: string }) {
        let woQuery = supabase
            .from('maintain_work_orders')
            .select('id')
            .eq('company_id', companyId);

        if (filters?.engineerId) {
            woQuery = woQuery.eq('engineer_id', filters.engineerId);
        }
        if (filters?.startDate) {
            woQuery = woQuery.gte('created_at', filters.startDate);
        }
        if (filters?.endDate) {
            woQuery = woQuery.lte('created_at', filters.endDate);
        }

        const { data: woIds } = await woQuery;

        if (!woIds || woIds.length === 0) return [];

        const { data, error } = await supabase
            .from('maintain_supply_allocations')
            .select('*')
            .in('work_order_id', woIds.map(w => w.id))
            .order('created_at', { ascending: false });
        if (error) throw error;

        const enriched = await Promise.all((data || []).map(async (alloc) => {
            const woRes = await supabase
                .from('maintain_work_orders')
                .select('title, type')
                .eq('id', alloc.work_order_id)
                .single();
            return { ...alloc, work_order: woRes.data };
        }));

        return enriched;
    },

    async getEngineerStock(engineerId: string): Promise<StockItem[]> {
        const { data, error } = await supabase
            .from('maintain_engineer_stock')
            .select('*')
            .eq('engineer_id', engineerId)
            .order('item_name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async recordStockTransaction(entry: LedgerEntry) {
        const { data, error } = await supabase
            .from('maintain_inventory_ledger')
            .insert(entry)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getInventoryLedger(engineerId: string, limit = 20) {
        const { data, error } = await supabase
            .from('maintain_inventory_ledger')
            .select('*')
            .eq('engineer_id', engineerId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    async getConsumptionReport(companyId: string, startDate?: string, endDate?: string) {
        let query = supabase
            .from('maintain_inventory_ledger')
            .select(`
                *,
                engineer:users!engineer_id (full_name),
                work_order:maintain_work_orders (title, site_id)
            `)
            .eq('company_id', companyId)
            .eq('transaction_type', 'usage');

        if (startDate) query = query.gte('created_at', startDate);
        if (endDate) query = query.lte('created_at', endDate);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        return data || [];
    },

    async getInventoryItems(companyId: string) {
        const { data, error } = await supabase
            .from('maintain_inventory_items')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getRestockHistory(companyId: string, filters?: { engineerId?: string; startDate?: string; endDate?: string }) {
        let query = supabase
            .from('maintain_inventory_ledger')
            .select(`
                id,
                batch_id,
                batch_name,
                created_at,
                engineer_id,
                engineer:users!engineer_id (full_name),
                transaction_type,
                item_name,
                item_category,
                quantity,
                unit
            `)
            .eq('company_id', companyId)
            .eq('transaction_type', 'restock');

        if (filters?.engineerId) query = query.eq('engineer_id', filters.engineerId);
        if (filters?.startDate) query = query.gte('created_at', filters.startDate);
        if (filters?.endDate) query = query.lte('created_at', filters.endDate);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        const batchesMap = new Map<string, any>();
        const singleEntries: any[] = [];

        (data || []).forEach(entry => {
            if (entry.batch_id) {
                if (!batchesMap.has(entry.batch_id)) {
                    batchesMap.set(entry.batch_id, {
                        ...entry,
                        items: []
                    });
                }
                batchesMap.get(entry.batch_id).items.push({
                    name: entry.item_name,
                    quantity: entry.quantity,
                    unit: entry.unit
                });
            } else {
                singleEntries.push({
                    ...entry,
                    items: [{
                        name: entry.item_name,
                        quantity: entry.quantity,
                        unit: entry.unit
                    }]
                });
            }
        });

        return [...Array.from(batchesMap.values()), ...singleEntries].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    },

    async getEngineerBatchWallet(companyId: string, engineerId: string) {
        return this.getRestockHistory(companyId, { engineerId });
    },

    async getBatchDetails(batchId: string) {
        const { data, error } = await supabase
            .from('maintain_inventory_ledger')
            .select('*')
            .eq('batch_id', batchId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async updateLedgerEntry(id: string, updates: { quantity?: number; notes?: string }) {
        const { data, error } = await supabase
            .from('maintain_inventory_ledger')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteLedgerEntry(id: string) {
        const { error } = await supabase
            .from('maintain_inventory_ledger')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async deleteBatch(batchId: string) {
        const { error } = await supabase
            .from('maintain_inventory_ledger')
            .delete()
            .eq('batch_id', batchId);

        if (error) throw error;
        return true;
    },

    async getItemHistory(engineerId: string, itemName: string) {
        const { data, error } = await supabase
            .from('maintain_inventory_ledger')
            .select('*')
            .eq('engineer_id', engineerId)
            .eq('item_name', itemName)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async addInventoryItem(item: { company_id: string; name: string; category: string; unit: string; description?: string }) {
        const { data, error } = await supabase
            .from('maintain_inventory_items')
            .insert(item)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getCentralInventory(companyId: string) {
        const { data: masters, error } = await supabase
            .from('maintain_inventory_master')
            .select('*')
            .eq('company_id', companyId)
            .order('product_name', { ascending: true });

        if (error) throw error;
        if (!masters) return [];

        const { data: units, error: unitsErr } = await supabase
            .from('maintain_inventory_units')
            .select('master_id')
            .eq('company_id', companyId);

        if (unitsErr) console.warn('[getCentralInventory] Failed to fetch units:', unitsErr);
        const uniqueMasterIds = new Set((units || []).map(u => u.master_id));

        return masters.map(m => ({
            ...m,
            is_unique: uniqueMasterIds.has(m.id)
        }));
    },

    async getMasterProduct(companyId: string, name: string, partNo?: string | null) {
        const normalizedPartNo = partNo?.trim() || null;

        let query = supabase
            .from('maintain_inventory_master')
            .select('*')
            .eq('company_id', companyId)
            .ilike('product_name', name);

        if (normalizedPartNo) {
            query = query.eq('part_no', normalizedPartNo);
        } else {
            query = query.or(`part_no.is.null,part_no.eq.""`);
        }

        const { data } = await query.maybeSingle();
        return data;
    },

    async checkBarcodeExists(barcode: string) {
        const { data, error } = await supabase
            .from('maintain_inventory_units')
            .select('barcode, master:master_id(product_name)')
            .eq('barcode', barcode)
            .maybeSingle();

        if (error) {
            console.error('[checkBarcodeExists]', error);
            return null;
        }
        return data;
    },

    async checkIsProductSerialized(companyId: string, productName: string, partNo?: string) {
        const master = await this.getMasterProduct(companyId, productName, partNo);
        if (!master) return false;

        const { count, error } = await supabase
            .from('maintain_inventory_units')
            .select('*', { count: 'exact', head: true })
            .eq('master_id', master.id);

        if (error) {
            console.error('[checkIsProductSerialized]', error);
            return false;
        }
        return (count || 0) > 0;
    },

    async receiveStock(companyId: string, userId: string, batchData: {
        supplierName?: string;
        referenceNo?: string;
        items: Array<{
            productName: string;
            partNo?: string;
            category: string;
            unit: string;
            price: number;
            manufacturer?: string;
            barcodes?: string[];
            unitObjects?: Array<{ barcode: string; sku?: string }>;
            quantity: number;
            sku?: string;
        }>
    }) {
        const totalItems = batchData.items.reduce((acc, item) => {
            const uniqueCount = item.unitObjects ? item.unitObjects.length : (item.barcodes?.length || 0);
            return acc + (uniqueCount > 0 ? uniqueCount : item.quantity);
        }, 0);

        const totalValue = batchData.items.reduce((acc, item) => {
            const uniqueCount = item.unitObjects ? item.unitObjects.length : (item.barcodes?.length || 0);
            const qty = uniqueCount > 0 ? uniqueCount : item.quantity;
            return acc + (item.price * qty);
        }, 0);

        const { data: batch, error: batchErr } = await supabase
            .from('maintain_receiving_batches')
            .insert({
                company_id: companyId,
                supplier_name: batchData.supplierName,
                reference_no: batchData.referenceNo,
                received_by: userId,
                total_items: totalItems,
                total_value: totalValue
            })
            .select()
            .single();

        if (batchErr) {
            console.error('[ReceiveStock] Batch insert error:', batchErr);
            throw batchErr;
        }

        for (const item of batchData.items) {
            try {
                const normalizedPartNo = item.partNo?.trim() || null;
                let master = await this.getMasterProduct(companyId, item.productName, normalizedPartNo);

                if (!master) {
                    const { data: newMaster, error: masterErr } = await supabase
                        .from('maintain_inventory_master')
                        .insert({
                            company_id: companyId,
                            product_name: item.productName,
                            part_no: normalizedPartNo,
                            item_category: item.category,
                            unit: item.unit,
                            last_purchase_price: item.price,
                            manufacturer: item.manufacturer,
                            total_in_stock: 0
                        })
                        .select()
                        .single();
                    if (masterErr) {
                        console.error('[ReceiveStock] Master insert error:', masterErr);
                        throw masterErr;
                    }
                    master = newMaster;
                } else {
                    const { error: masterUpdateErr } = await supabase
                        .from('maintain_inventory_master')
                        .update({
                            last_purchase_price: item.price,
                            manufacturer: item.manufacturer || master.manufacturer
                        })
                        .eq('id', master.id);
                    if (masterUpdateErr) console.warn('[ReceiveStock] Master update error:', masterUpdateErr);
                }

                const uniqueCount = item.unitObjects ? item.unitObjects.length : (item.barcodes?.length || 0);

                const { error: batchItemErr } = await supabase
                    .from('maintain_receiving_batch_items')
                    .insert({
                        batch_id: batch.id,
                        master_id: master.id,
                        quantity: uniqueCount > 0 ? uniqueCount : item.quantity,
                        purchase_price: item.price,
                        sku: item.sku
                    });
                if (batchItemErr) {
                    console.error('[ReceiveStock] Batch item insert error:', batchItemErr);
                    throw batchItemErr;
                }

                if (uniqueCount > 0) {
                    const unitsToInsert = item.unitObjects
                        ? item.unitObjects.map(uo => ({
                            master_id: master!.id,
                            company_id: companyId,
                            barcode: uo.barcode,
                            sku: uo.sku,
                            status: 'in_stock'
                        }))
                        : (item.barcodes || []).map(code => ({
                            master_id: master!.id,
                            company_id: companyId,
                            barcode: code,
                            status: 'in_stock'
                        }));

                    const { error: unitsErr } = await supabase
                        .from('maintain_inventory_units')
                        .insert(unitsToInsert);
                    if (unitsErr) {
                        console.error('[ReceiveStock] Units insert error:', unitsErr);
                        throw unitsErr;
                    }

                    const { error: stockUpdateErr } = await supabase
                        .from('maintain_inventory_master')
                        .update({ total_in_stock: (master.total_in_stock || 0) + uniqueCount })
                        .eq('id', master.id);
                    if (stockUpdateErr) console.warn('[ReceiveStock] Stock update error:', stockUpdateErr);

                } else {
                    const { error: bulkStockUpdateErr } = await supabase
                        .from('maintain_inventory_master')
                        .update({ total_in_stock: (master.total_in_stock || 0) + item.quantity })
                        .eq('id', master.id);
                    if (bulkStockUpdateErr) {
                        console.error('[ReceiveStock] Bulk stock update error:', bulkStockUpdateErr);
                        throw bulkStockUpdateErr;
                    }
                }

                await this.recordStockTransaction({
                    engineer_id: userId,
                    company_id: companyId,
                    batch_id: batch.id,
                    batch_name: batchData.referenceNo || `INBOUND-${batch.id.slice(0, 8)}`,
                    item_name: item.productName,
                    item_category: item.category,
                    quantity: uniqueCount > 0 ? uniqueCount : item.quantity,
                    unit: item.unit,
                    transaction_type: 'restock',
                    master_id: master.id,
                    notes: `Inbound from ${batchData.supplierName || 'Supplier'}`,
                    recorded_by: userId
                }).catch(e => console.warn('[ReceiveStock] Ledger entry failed (non-critical):', e));

            } catch (itemErr) {
                console.error(`[ReceiveStock] Error processing item ${item.productName}:`, itemErr);
                throw itemErr;
            }
        }

        return batch;
    },

    async getReceivingHistory(companyId: string, filters?: { startDate?: string; endDate?: string }) {
        let query = supabase
            .from('maintain_receiving_batches')
            .select(`
                *,
                receiver:received_by(full_name),
                maintain_receiving_batch_items(
                    master:master_id(product_name)
                )
            `)
            .eq('company_id', companyId);

        if (filters?.startDate) query = query.gte('created_at', filters.startDate);
        if (filters?.endDate) query = query.lte('created_at', filters.endDate);

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(batch => {
            const items = batch.maintain_receiving_batch_items || [];
            const names = items.map((i: any) => i.master?.product_name).filter(Boolean);
            const uniqueNames = Array.from(new Set(names));
            return {
                ...batch,
                product_names: uniqueNames.length > 0 ? uniqueNames.join(', ') : null
            };
        });
    },

    async getUnifiedSuppliesStats(companyId: string, filters?: { engineerId?: string; startDate?: string; endDate?: string }) {
        const isPersonal = !!filters?.engineerId;

        // 1. Inflow / Restock Stats
        let inflowQuery = supabase
            .from(isPersonal ? 'maintain_inventory_ledger' : 'maintain_receiving_batches')
            .select(isPersonal ? 'quantity' : 'total_items')
            .eq('company_id', companyId);

        if (isPersonal) {
            inflowQuery = inflowQuery.eq('engineer_id', filters.engineerId).eq('transaction_type', 'restock');
        }

        if (filters?.startDate) inflowQuery = inflowQuery.gte('created_at', filters.startDate);
        if (filters?.endDate) inflowQuery = inflowQuery.lte('created_at', filters.endDate);

        const { data: inflowData } = await inflowQuery as { data: any[] | null };

        const unitsReceived = isPersonal
            ? (inflowData || []).reduce((acc: number, i: any) => acc + (i.quantity || 0), 0)
            : (inflowData || []).reduce((acc: number, b: any) => acc + (b.total_items || 0), 0);

        // 2. Outflow / Usage Stats
        let outflowQuery = supabase
            .from('maintain_inventory_ledger')
            .select('quantity')
            .eq('company_id', companyId);

        if (isPersonal) {
            // Engineer's personal usage on work orders
            outflowQuery = outflowQuery.eq('engineer_id', filters.engineerId).eq('transaction_type', 'usage');
        } else {
            // Admin sees total issuance (restock transactions recorded in ledger)
            outflowQuery = outflowQuery.eq('transaction_type', 'restock');
        }

        if (filters?.startDate) outflowQuery = outflowQuery.gte('created_at', filters.startDate);
        if (filters?.endDate) outflowQuery = outflowQuery.lte('created_at', filters.endDate);

        const { data: outflowData } = await outflowQuery;
        const netOutflow = outflowData?.reduce((acc, i) => acc + Math.abs(i.quantity), 0) || 0;

        // 3. Stock Balance (Warehouse Total vs Engineer Wallet)
        let balance = 0;
        if (isPersonal) {
            const { data: walletData } = await supabase
                .from('maintain_engineer_stock')
                .select('balance')
                .eq('engineer_id', filters.engineerId);
            balance = walletData?.reduce((acc, i) => acc + (Number(i.balance) || 0), 0) || 0;
        } else {
            const { data: stockData } = await supabase
                .from('maintain_inventory_master')
                .select('total_in_stock')
                .eq('company_id', companyId);
            balance = stockData?.reduce((acc, i) => acc + (i.total_in_stock || 0), 0) || 0;
        }

        return {
            inflowCount: isPersonal ? inflowData?.length || 0 : inflowData?.length || 0,
            unitsReceived,
            unitsOutbound: netOutflow, // usage for eng, allocations for admin
            currentBalance: balance
        };
    },

    async getReceivingBatchDetails(batchId: string) {
        const { data, error } = await supabase
            .from('maintain_receiving_batch_items')
            .select(`
                *,
                master:master_id(product_name, unit, item_category)
            `)
            .eq('batch_id', batchId);

        if (error) throw error;

        return (data || []).map(item => ({
            id: item.id,
            master_id: item.master_id,
            item_name: item.master?.product_name,
            quantity: item.quantity,
            unit: item.master?.unit,
            item_category: item.master?.item_category,
            purchase_price: item.purchase_price,
            created_at: item.created_at,
            transaction_type: 'restock'
        }));
    },

    async getReceivingBatchItems(batchId: string) {
        const { data, error } = await supabase
            .from('maintain_receiving_batch_items')
            .select(`
                *,
                master:master_id(*)
            `)
            .eq('batch_id', batchId);

        if (error) throw error;
        return data || [];
    },

    async getMasterInventoryUnits(masterId: string) {
        const { data, error } = await supabase
            .from('maintain_inventory_units')
            .select('*')
            .eq('master_id', masterId)
            .order('received_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async issueStock(companyId: string, userId: string, issuanceData: {
        engineerId: string;
        batchName: string;
        items: Array<{
            masterId: string;
            quantity: number;
            barcodes?: string[];
            itemName: string;
            category: string;
            unit: string;
            notes?: string;
        }>
    }) {
        const batchId = crypto.randomUUID();

        for (const item of issuanceData.items) {
            const hasBarcodes = item.barcodes && item.barcodes.length > 0;

            // 1. Handle Serialized Units if provided
            if (hasBarcodes) {
                const { error: unitErr } = await supabase
                    .from('maintain_inventory_units')
                    .update({
                        status: 'fulfilled', // Flag specific IDs as fulfilled
                        current_holder_id: issuanceData.engineerId,
                        issued_at: new Date().toISOString()
                    })
                    .in('barcode', item.barcodes || [])
                    .eq('master_id', item.masterId);

                if (unitErr) throw unitErr;
                // Note: Trigger trg_units_stats_update handles total_in_stock decrement
            }

            // 2. Decrement the Master stock ONLY for non-serialized items
            // (Database trigger handles serialized ones automatically on status change)
            if (!hasBarcodes) {
                const { data: master } = await supabase
                    .from('maintain_inventory_master')
                    .select('total_in_stock')
                    .eq('id', item.masterId)
                    .single();

                if (master) {
                    await supabase
                        .from('maintain_inventory_master')
                        .update({ total_in_stock: Math.max(0, (master.total_in_stock || 0) - item.quantity) })
                        .eq('id', item.masterId);
                }
            }

            // 3. Record in Ledger

            await this.recordStockTransaction({
                engineer_id: issuanceData.engineerId,
                company_id: companyId,
                batch_id: batchId,
                batch_name: issuanceData.batchName,
                item_name: item.itemName,
                item_category: item.category,
                quantity: item.quantity,
                unit: item.unit,
                transaction_type: 'restock',
                master_id: item.masterId,
                notes: item.notes,
                recorded_by: userId
            });
        }

        return batchId;
    },

    async createStockRequest(companyId: string, engineerId: string, items: any[], notes?: string) {
        const { data, error } = await supabase
            .from('maintain_stock_requests')
            .insert({
                company_id: companyId,
                engineer_id: engineerId,
                items,
                status: 'pending',
                notes
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getStockRequests(companyId: string, filters?: { engineerId?: string; status?: string }) {
        let query = supabase
            .from('maintain_stock_requests')
            .select(`
                *,
                engineer:engineer_id(full_name)
            `)
            .eq('company_id', companyId);

        if (filters?.engineerId) query = query.eq('engineer_id', filters.engineerId);
        if (filters?.status) query = query.eq('status', filters.status);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async updateStockRequest(requestId: string, updates: { items?: any[]; notes?: string }) {
        const { data, error } = await supabase
            .from('maintain_stock_requests')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', requestId)
            .eq('status', 'pending') // Only allow editing pending requests
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async processStockRequest(requestId: string, adminId: string, status: 'approved' | 'rejected' | 'fulfilled', adminNotes?: string) {
        const { data, error } = await supabase
            .from('maintain_stock_requests')
            .update({
                status,
                approved_by: adminId,
                admin_notes: adminNotes,
                updated_at: new Date().toISOString()
            })
            .eq('id', requestId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getMonthlyClusterInventory(companyId: string, clusterId: string, month: string) {
        // month format: YYYY-MM
        const startDate = `${month}-01T00:00:00.000Z`;
        const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString();

        const { data: ledger, error } = await supabase
            .from('maintain_inventory_ledger')
            .select('*')
            .eq('company_id', companyId)
            .eq('engineer_id', clusterId)
            .gte('created_at', startDate)
            .lt('created_at', endDate);

        if (error) throw error;

        // Calculate opening balance (all transactions before startDate)
        const { data: before, error: beforeErr } = await supabase
            .from('maintain_inventory_ledger')
            .select('quantity')
            .eq('company_id', companyId)
            .eq('engineer_id', clusterId)
            .lt('created_at', startDate);

        if (beforeErr) throw beforeErr;

        const opening = (before || []).reduce((acc, curr) => acc + curr.quantity, 0);
        const received = (ledger || []).filter(l => l.transaction_type === 'restock').reduce((acc, curr) => acc + curr.quantity, 0);
        const used = Math.abs((ledger || []).filter(l => l.transaction_type === 'usage').reduce((acc, curr) => acc + curr.quantity, 0));
        const closing = opening + received - used;

        return {
            month,
            opening,
            received,
            used,
            closing
        };
    }
};
