-- ── Requirements Kanban Stage ───────────────────────────────────────────────
-- Adds kanban_stage column to customer_requirements table.
-- Used by RequirementsManagePage for drag-and-drop kanban workflow.
--
-- Stages: new → quoted → negotiating → won | rejected
--
-- Run in Supabase SQL editor.

ALTER TABLE public.customer_requirements
  ADD COLUMN IF NOT EXISTS kanban_stage text NOT NULL DEFAULT 'new'
    CHECK (kanban_stage IN ('new','quoted','negotiating','won','rejected'));

-- Index for fast business-scoped kanban queries
CREATE INDEX IF NOT EXISTS idx_req_kanban_stage
  ON public.customer_requirements (business_id, kanban_stage);

-- Backfill: map existing status values to kanban stages
UPDATE public.customer_requirements
SET kanban_stage =
  CASE
    WHEN status = 'open'        THEN 'new'
    WHEN status = 'in_progress' THEN 'negotiating'
    WHEN status = 'closed'      THEN 'won'
    ELSE 'new'
  END
WHERE kanban_stage = 'new';  -- only set if still at default
