-- Create lp_snapshots table
CREATE TABLE IF NOT EXISTS lp_snapshots (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    mint VARCHAR(255) NOT NULL,
    protocol VARCHAR(50) NOT NULL,
    open_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    close_date TIMESTAMP,
    initial_value DECIMAL(20,8),
    final_value DECIMAL(20,8),
    total_fees DECIMAL(20,8),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lp_snapshots_address ON lp_snapshots(address);
CREATE INDEX IF NOT EXISTS idx_lp_snapshots_mint ON lp_snapshots(mint);
CREATE INDEX IF NOT EXISTS idx_lp_snapshots_protocol ON lp_snapshots(protocol);
CREATE INDEX IF NOT EXISTS idx_lp_snapshots_open_date ON lp_snapshots(open_date);
CREATE INDEX IF NOT EXISTS idx_lp_snapshots_close_date ON lp_snapshots(close_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_lp_snapshots_updated_at
    BEFORE UPDATE ON lp_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();