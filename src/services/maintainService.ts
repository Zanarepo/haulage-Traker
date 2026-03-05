import { workOrderService } from './maintain/workOrderService';
import { assetService } from './maintain/assetService';
import { dieselService } from './maintain/dieselService';
import { inventoryService } from './maintain/inventoryService';
import { visitService } from './maintain/visitService';
import { siteService } from './siteService';

/**
 * Maintain Module — Service Layer (Unified Wrapper)
 * 
 * This file serves as the main entry point for maintenance-related services.
 * It re-exports methods from specialized domain services to maintain 
 * backward compatibility while providing a cleaner, modular architecture.
 */

export const maintainService = {
    // ── Work Order Operations ──
    ...workOrderService,

    // ── Asset Management ──
    ...assetService,

    // ── Diesel Tracking ──
    ...dieselService,

    // ── Inventory & Stocks ──
    ...inventoryService,

    // ── Site Visits ──
    ...visitService,

    // ── Sites & Locations ──
    ...siteService,
};

// Re-export types for convenience
export type { StockItem, LedgerEntry } from './maintain/inventoryService';
