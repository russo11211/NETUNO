const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.migration') });

// PostgreSQL connection
console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Always use SSL for Supabase
});
console.log('🔗 Pool config:', pool.options);

// SQLite connection
const sqliteDb = new Database(path.join(__dirname, '..', 'positions.db'));

async function createTables() {
  console.log('Creating PostgreSQL tables...');
  
  const client = await pool.connect();
  try {
    // Create lp_snapshots table
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
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lp_snapshots_address ON lp_snapshots(address);
      CREATE INDEX IF NOT EXISTS idx_lp_snapshots_mint ON lp_snapshots(mint);
      CREATE INDEX IF NOT EXISTS idx_lp_snapshots_protocol ON lp_snapshots(protocol);
    `);
    
    console.log('PostgreSQL tables created successfully!');
  } finally {
    client.release();
  }
}

async function migrateData() {
  console.log('Starting data migration from SQLite to PostgreSQL...');
  
  try {
    // Check if SQLite table exists
    const tables = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='lp_snapshots'").get();
    
    if (!tables) {
      console.log('No SQLite data to migrate.');
      return;
    }
    
    // Get all data from SQLite
    const rows = sqliteDb.prepare('SELECT * FROM lp_snapshots').all();
    
    if (rows.length === 0) {
      console.log('No data found in SQLite database.');
      return;
    }
    
    console.log(`Found ${rows.length} records to migrate...`);
    
    const client = await pool.connect();
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      // Migrate each row
      for (const row of rows) {
        await client.query(`
          INSERT INTO lp_snapshots (
            address, mint, protocol, open_date, close_date, 
            initial_value, final_value, total_fees, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT DO NOTHING
        `, [
          row.address,
          row.mint,
          row.protocol,
          row.openDate || row.open_date,
          row.closeDate || row.close_date,
          row.initialValue || row.initial_value,
          row.finalValue || row.final_value,
          row.totalFees || row.total_fees,
          JSON.stringify(row.metadata || {})
        ]);
      }
      
      // Commit transaction
      await client.query('COMMIT');
      console.log(`Successfully migrated ${rows.length} records!`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function main() {
  try {
    await createTables();
    await migrateData();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    sqliteDb.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { createTables, migrateData };