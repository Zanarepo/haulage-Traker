-- ============================================================
-- Update handle_new_user trigger to support multi-module signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_company_id UUID;
    meta_company_name TEXT;
    meta_full_name TEXT;
    meta_phone TEXT;
    meta_modules TEXT[]; -- New: support module selection
BEGIN
    -- Extract metadata passed during signUp()
    meta_company_name := NEW.raw_user_meta_data->>'company_name';
    meta_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'User');
    meta_phone := NEW.raw_user_meta_data->>'phone';
    
    -- Extract modules array from metadata, default to ['infra_supply'] if not provided
    SELECT ARRAY_AGG(m) INTO meta_modules 
    FROM jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'modules', '["infra_supply"]'::jsonb)) AS m;

    -- If company_name was provided, this is a new company registration
    IF meta_company_name IS NOT NULL AND meta_company_name != '' THEN
        -- Create the company with selected modules
        INSERT INTO public.companies (name, active_modules)
        VALUES (meta_company_name, meta_modules)
        RETURNING id INTO new_company_id;

        -- Create the user profile as superadmin
        INSERT INTO public.users (id, company_id, full_name, email, phone_number, role, needs_password_reset, is_active)
        VALUES (
            NEW.id,
            new_company_id,
            meta_full_name,
            NEW.email,
            meta_phone,
            'superadmin',
            FALSE,
            TRUE
        );

        -- AUTO-CREATE 21-day Enterprise trial subscription
        INSERT INTO public.subscriptions (company_id, plan, status, trial_start, trial_end)
        VALUES (
            new_company_id,
            'trial',
            'active',
            NOW(),
            NOW() + INTERVAL '21 days'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
