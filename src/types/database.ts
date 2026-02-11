export type UserRole = 'superadmin' | 'md' | 'accountant' | 'auditor' | 'admin' | 'driver' | 'site_engineer';
export type DriverType = 'internal' | 'external';
export type TripStatus = 'pending' | 'active' | 'dispensed' | 'reconciled' | 'completed';

export interface Company {
    id: string;
    name: string;
    created_at: string;
    metadata?: any;
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
    client_allocation_id: string;
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
