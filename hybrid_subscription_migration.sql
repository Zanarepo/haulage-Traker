-- Hybrid Subscription Model Migration
-- Adds per-module plan columns to subscriptions table
-- Enterprise overrides both; Small Business is per-module

-- Add per-module plan columns (default to the current plan value)
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS infra_supply_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS maintain_plan TEXT DEFAULT 'free';

-- Migrate existing data: sync module plans from the current unified plan
-- If current plan is 'small_business', set both modules to 'small_business'
-- If current plan is 'enterprise' or 'trial', set both to that plan
UPDATE subscriptions
SET
    infra_supply_plan = CASE
        WHEN plan IN ('trial', 'enterprise', 'small_business') THEN plan
        ELSE 'free'
    END,
    maintain_plan = CASE
        WHEN plan IN ('trial', 'enterprise', 'small_business') THEN plan
        ELSE 'free'
    END
WHERE infra_supply_plan = 'free' AND maintain_plan = 'free' AND plan != 'free';

-- The 'plan' column now represents the "overall" plan tier:
--   'enterprise' = both modules unlocked at enterprise level
--   'trial'      = both modules at enterprise (during trial)
--   'small_business' = at least one module is SB (kept for backward compat)
--   'free'       = no paid subscription
