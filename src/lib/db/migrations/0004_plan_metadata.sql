-- Phase 3 UAT: Add plan metadata columns
-- Apply in Supabase SQL Editor after 0003_plans.sql

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes TEXT;
