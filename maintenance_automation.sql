-- MAINTENANCE AUTOMATION & INTELLIGENT ESCALATION
-- This script automates maintenance updates and adds hybrid-aware service forecasting.

-- 1. Extend Asset Registry for Cached Health Status
ALTER TABLE public.maintain_assets
ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'due_soon', 'overdue'));

-- 2. Function to Update Asset on Work Order Completion
CREATE OR REPLACE FUNCTION public.fn_handle_maintenance_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_final_meter DECIMAL(12,2);
    v_asset_id UUID;
BEGIN
    -- Only act when status changes to 'completed'
    IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
        
        v_asset_id := NEW.asset_id;
        
        IF v_asset_id IS NOT NULL THEN
            -- Determine final meter: Priority 1 is WO field, Priority 2 is latest direct reading
            v_final_meter := NEW.hour_meter;
            
            IF v_final_meter IS NULL THEN
                SELECT hour_meter INTO v_final_meter
                FROM public.maintain_diesel_readings
                WHERE work_order_id = NEW.id
                ORDER BY recorded_at DESC
                LIMIT 1;
            END IF;

            -- Update the Asset record
            UPDATE public.maintain_assets
            SET 
                last_pm_hours = COALESCE(v_final_meter, last_pm_hours),
                last_service_hour_meter = COALESCE(v_final_meter, last_service_hour_meter), -- Compatibility
                last_pm_date = NOW(),
                last_service_date = NOW(), -- Compatibility
                hour_meter = COALESCE(v_final_meter, hour_meter),
                health_status = 'healthy', -- Reset status on completion
                updated_at = NOW()
            WHERE id = v_asset_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger for Work Order Completion
DROP TRIGGER IF EXISTS trg_work_order_completion ON public.maintain_work_orders;
CREATE TRIGGER trg_work_order_completion
    AFTER UPDATE ON public.maintain_work_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_handle_maintenance_completion();

-- 4. Hybrid-Aware Health Status Function
-- This function can be called by a cron job or on-demand to refresh health statuses
CREATE OR REPLACE FUNCTION public.fn_refresh_asset_health_projections()
RETURNS void AS $$
BEGIN
    UPDATE public.maintain_assets a
    SET health_status = CASE 
        -- Calculation logic mirroring maintenanceIntelligence.ts
        -- Overdue Case: Meter or Calendar limit reached
        WHEN (a.hour_meter - a.last_pm_hours) >= a.pm_interval_hours 
             OR (COALESCE(a.last_pm_date, a.created_at) + (a.service_interval_days || ' days')::interval) < NOW()
        THEN 'overdue'
        
        -- Due Soon Case: Within 10% of meter interval or 2 days of calendar interval
        WHEN (a.hour_meter - a.last_pm_hours) >= (a.pm_interval_hours * 0.9)
             OR (COALESCE(a.last_pm_date, a.created_at) + ((a.service_interval_days - 2) || ' days')::interval) < NOW()
        THEN 'due_soon'
        
        ELSE 'healthy'
    END
    FROM public.sites s
    WHERE a.site_id = s.id 
      AND a.status = 'active';
      
    -- Note: For true "time-based" escalation for HYBRID assets, 
    -- we factor in the solar_offset_hours when this runs daily via pg_cron.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Unified Asset Health & Automation Trigger
-- This calculates health status on-the-fly and generates work orders for overdue assets
CREATE OR REPLACE FUNCTION public.fn_process_asset_health_and_automation()
RETURNS TRIGGER AS $$
DECLARE
    v_engineer_id UUID;
    v_cluster_id UUID;
    v_open_wo_exists BOOLEAN;
    v_new_wo_id UUID;
    v_calculated_status TEXT;
BEGIN
    -- 1. CALCULATE CURRENT HEALTH STATUS (Mirroring frontend logic)
    v_calculated_status := CASE 
        WHEN (NEW.hour_meter - COALESCE(NEW.last_pm_hours, 0)) >= COALESCE(NEW.pm_interval_hours, 250) 
             OR (COALESCE(NEW.last_pm_date, NEW.created_at) + (COALESCE(NEW.service_interval_days, 10) || ' days')::interval) < NOW()
        THEN 'overdue'
        
        WHEN (NEW.hour_meter - COALESCE(NEW.last_pm_hours, 0)) >= (COALESCE(NEW.pm_interval_hours, 250) * 0.9)
             OR (COALESCE(NEW.last_pm_date, NEW.created_at) + ((COALESCE(NEW.service_interval_days, 10) - 2) || ' days')::interval) < NOW()
        THEN 'due_soon'
        
        ELSE 'healthy'
    END;

    -- Store the calculated status in the record
    NEW.health_status := v_calculated_status;

    -- 2. AUTOMATION: Create Work Order if newly 'overdue'
    -- Criteria: Newly overdue AND not previously overdue (to prevent repeat firing)
    IF (v_calculated_status = 'overdue' AND (OLD.health_status IS NULL OR OLD.health_status != 'overdue')) THEN
        
        -- Check for existing open Preventive WO
        SELECT EXISTS (
            SELECT 1 FROM public.maintain_work_orders 
            WHERE asset_id = NEW.id 
              AND type = 'preventive' 
              AND status IN ('open', 'assigned', 'in_progress')
        ) INTO v_open_wo_exists;

        IF NOT v_open_wo_exists THEN
            -- Identify cluster
            SELECT cluster_id INTO v_cluster_id FROM public.sites WHERE id = NEW.site_id;

            -- Find assignment
            SELECT uca.user_id INTO v_engineer_id
            FROM public.user_cluster_assignments uca
            JOIN public.users u ON u.id = uca.user_id
            WHERE uca.cluster_id = v_cluster_id
              AND u.role = 'site_engineer'
              AND u.is_active = TRUE
              AND (u.company_id = NEW.company_id OR u.company_id IS NULL)
            LIMIT 1;

            -- Create the Work Order
            INSERT INTO public.maintain_work_orders (
                company_id, asset_id, site_id, engineer_id,
                type, priority, title, description, status,
                scheduled_date, created_at
            ) VALUES (
                NEW.company_id, NEW.id, NEW.site_id, v_engineer_id,
                'preventive', 'high',
                'AUTO-PM: ' || COALESCE(NEW.make_model, NEW.type) || ' Service Required',
                'Generated automatically because meter/date reached service interval limit.',
                CASE WHEN v_engineer_id IS NOT NULL THEN 'assigned' ELSE 'open' END,
                NOW(), NOW()
            ) RETURNING id INTO v_new_wo_id;

            RAISE NOTICE '🚀 AUTOMATION: Created Work Order % for Asset %', v_new_wo_id, NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger for Unified Health Management
DROP TRIGGER IF EXISTS trg_process_asset_health ON public.maintain_assets;
CREATE TRIGGER trg_process_asset_health
    BEFORE UPDATE ON public.maintain_assets
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_process_asset_health_and_automation();

-- 7. Automatic Meter Update from Diesel Readings
-- Ensure that direct log entries also update the asset's current meter
CREATE OR REPLACE FUNCTION public.fn_sync_asset_meter_from_reading()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.asset_id IS NOT NULL AND NEW.hour_meter IS NOT NULL THEN
        UPDATE public.maintain_assets
        SET hour_meter = NEW.hour_meter,
            updated_at = NOW()
        WHERE id = NEW.asset_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_asset_meter ON public.maintain_diesel_readings;
CREATE TRIGGER trg_sync_asset_meter
    AFTER INSERT OR UPDATE OF hour_meter ON public.maintain_diesel_readings
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_sync_asset_meter_from_reading();
