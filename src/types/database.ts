export type UserRole = 'superadmin' | 'md' | 'accountant' | 'auditor' | 'admin' | 'driver' | 'site_engineer' | 'nexsuper' | 'nexadmin' | 'nexsupport';
export type DriverType = 'internal' | 'external';
export type TripStatus = 'pending' | 'active' | 'dispensed' | 'reconciled' | 'completed';

export interface Company {
    id: string;
    name: string;
    created_at: string;
    metadata?: any;
    active_modules?: string[]; // ['infra_supply'] | ['maintain'] | ['infra_supply','maintain']
}

export interface Cluster {
    id: string;
    company_id: string;
    name: string;
    state?: string;
    created_at: string;
}

export interface UserProfile {
    id: string;
    company_id: string;
    full_name: string;
    phone_number?: string;
    email?: string;
    role: UserRole;
    driver_type?: DriverType;
    needs_password_reset: boolean;
    is_active: boolean;
    created_at: string;
    cluster_ids?: string[];
}

export interface Client {
    id: string;
    company_id: string;
    name: string;
    haulage_rate_per_liter: number;
    created_at: string;
}

export interface Site {
    id: string;
    cluster_id: string;
    client_id: string;
    name: string;
    site_id_code: string;
    latitude?: number;
    longitude?: number;
    tank_capacity?: number;
    host_community?: string;
    created_at: string;
}

export interface Trip {
    id: string;
    cluster_id: string;
    driver_id: string;
    client_id: string;
    truck_plate_number: string;
    loaded_quantity: number;
    status: TripStatus;
    safety_checklist_json?: any;
    start_time?: string;
    end_time?: string;
    created_at: string;
}

export interface DispensingLog {
    id: string;
    trip_id: string;
    site_id: string;
    quantity_dispensed: number;
    community_provision_qty: number;
    before_tank_level?: number;
    after_tank_level?: number;
    waybill_photo_url?: string;
    driver_signature_url?: string;
    engineer_signature_url?: string;
    engineer_name?: string;
    geo_lat?: number;
    geo_lng?: number;
    created_at: string;
}

export interface TripItinerary {
    id: string;
    trip_id: string;
    site_id: string;
    status: 'pending' | 'dispensed';
    created_at: string;
    // Joined data
    sites?: {
        name: string;
        site_id_code: string;
    };
}

// ============================================================
// NexHaul Maintain Types (maintain schema)
// ============================================================

export type AssetType = 'generator' | 'inverter' | 'ac_unit' | 'rectifier' | 'battery_bank' | 'ups' | 'solar_panel' | 'other';
export type AssetStatus = 'active' | 'inactive' | 'decommissioned';
export type WorkOrderType = 'preventive' | 'reactive' | 'inspection' | 'emergency';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'critical';
export type WorkOrderStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';

export interface Asset {
    id: string;
    site_id: string;
    company_id: string;
    type: AssetType;
    make_model?: string;
    serial_number?: string;
    qr_code?: string;
    hour_meter: number;
    service_interval_hrs: number;
    service_interval_days: number;
    last_service_date?: string;
    last_service_hour_meter: number;
    fuel_tank_capacity?: number;
    status: AssetStatus;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface WorkOrder {
    id: string;
    company_id: string;
    asset_id?: string;
    site_id: string;
    engineer_id?: string;
    created_by?: string;
    type: WorkOrderType;
    priority: WorkOrderPriority;
    title: string;
    description?: string;
    sla_target_hrs?: number;
    status: WorkOrderStatus;
    scheduled_date?: string;
    assigned_at?: string;
    started_at?: string;
    completed_at?: string;
    fault_code?: string;
    rca_category?: string;
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export interface VisitReport {
    id: string;
    work_order_id: string;
    engineer_id: string;
    before_photos?: string[];
    hour_meter_before?: number;
    diesel_level_before?: number;
    site_condition_notes?: string;
    after_photos?: string[];
    hour_meter_after?: number;
    diesel_level_after?: number;
    geo_lat?: number;
    geo_lng?: number;
    geofence_valid?: boolean;
    arrived_at?: string;
    departed_at?: string;
    offline_synced?: boolean;
    synced_at?: string;
    created_at: string;
}

export interface SafetyChecklist {
    id: string;
    visit_report_id: string;
    checklist_json: any;
    passed: boolean;
    notes?: string;
    signed_by?: string;
    created_at: string;
}

export interface SupplyAllocation {
    id: string;
    work_order_id: string;
    company_id: string;
    item_name: string;
    item_category?: string;
    qty_allocated: number;
    qty_used: number;
    qty_returned: number;
    unit: string;
    notes?: string;
    created_at: string;
}

export interface MaintenanceTask {
    id: string;
    visit_report_id: string;
    task_type: string;
    description?: string;
    parts_used?: string[];
    issues_found?: string;
    created_at: string;
}

// ============================================================
// NexHaul Platform Admin Types
// ============================================================

export type NexHaulAdminRole = 'nexsuper' | 'nexadmin' | 'nexsupport';

export interface NexHaulAdmin {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
    role: NexHaulAdminRole;
    created_at: string;
    updated_at: string;
}
