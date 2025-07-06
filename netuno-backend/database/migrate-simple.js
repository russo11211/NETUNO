const { Pool } = require('pg');

// Simple connection - IPv4 only
const pool = new Pool({
  host: 'db.kokcioafmnsnrnqbvggw.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'xMw3wfDPM4sep&n',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
});

async function createTables() {
  console.log('🔧 Creating PostgreSQL tables...');
  
  const client = await pool.connect();
  try {
    await client.query(`
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
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lp_snapshots_address ON lp_snapshots(address);
      CREATE INDEX IF NOT EXISTS idx_lp_snapshots_mint ON lp_snapshots(mint);
      CREATE INDEX IF NOT EXISTS idx_lp_snapshots_protocol ON lp_snapshots(protocol);
    `);
    
    console.log('✅ Tables created successfully!');
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🚀 Starting database setup...');
    await createTables();
    console.log('🎉 Database setup completed!');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    await pool.end();
  }
}

main();