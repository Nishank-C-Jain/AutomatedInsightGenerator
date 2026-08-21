-- Migration 004: Create insights table

DROP TABLE IF EXISTS insights CASCADE;

CREATE TABLE insights (
    id SERIAL PRIMARY KEY,
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    content JSONB NOT NULL,
    insight_type VARCHAR(50), -- e.g., 'trend', 'correlation', 'anomaly_summary', 'distribution'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_insights_dataset_id ON insights(dataset_id);
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
