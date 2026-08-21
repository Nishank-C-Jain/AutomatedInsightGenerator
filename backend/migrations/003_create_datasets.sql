-- Migration 003: Create datasets table

DROP TABLE IF EXISTS datasets CASCADE;

CREATE TABLE datasets (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    row_count INTEGER,
    column_count INTEGER,
    schema_definition JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on user_id for list/filter queries
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);

-- Trigger to update updated_at on dataset metadata modification
DROP TRIGGER IF EXISTS update_datasets_updated_at ON datasets;
CREATE TRIGGER update_datasets_updated_at
    BEFORE UPDATE ON datasets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
