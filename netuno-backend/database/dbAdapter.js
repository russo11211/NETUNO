const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');

class DatabaseAdapter {
  constructor() {
    this.pool = null;
    this.sqliteDb = null;
    this.isPostgres = !!process.env.DATABASE_URL;
    
    this.init();
  }
  
  init() {
    if (this.isPostgres) {
      console.log('🐘 Initializing PostgreSQL connection...');
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
    } else {
      console.log('🗄️  Initializing SQLite connection...');
      this.sqliteDb = new Database(path.join(__dirname, '..', 'positions.db'));
      this.createSqliteTables();
    }
  }
  
  createSqliteTables() {
    this.sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS lp_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        mint TEXT NOT NULL,
        protocol TEXT NOT NULL,
        openDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        closeDate DATETIME,
        initialValue REAL,
        finalValue REAL,
        totalFees REAL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_lp_snapshots_address ON lp_snapshots(address);
      CREATE INDEX IF NOT EXISTS idx_lp_snapshots_mint ON lp_snapshots(mint);
      CREATE INDEX IF NOT EXISTS idx_lp_snapshots_protocol ON lp_snapshots(protocol);
    `);
  }
  
  async query(text, params = []) {
    if (this.isPostgres) {
      const client = await this.pool.connect();
      try {
        const result = await client.query(text, params);
        return result.rows;
      } finally {
        client.release();
      }
    } else {
      // Convert PostgreSQL query to SQLite format
      const sqliteQuery = this.convertToSqlite(text, params);
      const stmt = this.sqliteDb.prepare(sqliteQuery.text);
      
      if (text.trim().toUpperCase().startsWith('SELECT')) {
        return stmt.all(...sqliteQuery.params);
      } else {
        const result = stmt.run(...sqliteQuery.params);
        return [{ id: result.lastInsertRowid, changes: result.changes }];
      }
    }
  }
  
  convertToSqlite(text, params) {
    // Convert PostgreSQL $1, $2, etc. to SQLite ? placeholders
    let sqliteText = text;
    const sqliteParams = [];
    
    // Replace PostgreSQL-style parameters
    for (let i = 1; i <= params.length; i++) {
      sqliteText = sqliteText.replace(new RegExp(`\\$${i}`, 'g'), '?');
      sqliteParams.push(params[i - 1]);
    }
    
    // Convert PostgreSQL syntax to SQLite
    sqliteText = sqliteText
      .replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
      .replace(/TIMESTAMP/g, 'DATETIME')
      .replace(/DECIMAL\(\d+,\d+\)/g, 'REAL')
      .replace(/VARCHAR\(\d+\)/g, 'TEXT')
      .replace(/JSONB/g, 'TEXT')
      .replace(/CURRENT_TIMESTAMP/g, 'CURRENT_TIMESTAMP')
      .replace(/ON CONFLICT DO NOTHING/g, 'ON CONFLICT DO NOTHING');
    
    return { text: sqliteText, params: sqliteParams };
  }
  
  async close() {
    if (this.isPostgres && this.pool) {
      await this.pool.end();
    } else if (this.sqliteDb) {
      this.sqliteDb.close();
    }
  }
}

module.exports = new DatabaseAdapter();