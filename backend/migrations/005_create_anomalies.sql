-- Migration 005: Create anomalies table

DROP TABLE IF EXISTS anomalies CASCADE;

CREATE TABLE anomalies (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    column_name VARCHAR(100) NOT NULL,
    anomaly_type VARCHAR(100) NOT NULL, -- e.g., 'outlier', 'missing_value', 'type_mismatch'
    anomaly_value TEXT,
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for faster lookup
CREATE INDEX IF NOT EXISTS idx_anomalies_dataset_id ON anomalies(dataset_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_user_id ON anomalies(user_id);
