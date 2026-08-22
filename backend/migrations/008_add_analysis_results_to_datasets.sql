-- Migration 008: Add analysis_results to datasets table

ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS analysis_results JSONB;
