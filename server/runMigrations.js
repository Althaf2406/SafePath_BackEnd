const fs = require('fs');
const path = require('path');
const pool = require('./src/config/db');

async function run() {
  try {
    const migration = fs.readFileSync(path.join(__dirname, 'src/db/migrations/001_create_shelters.sql'), 'utf8');
    const seed = fs.readFileSync(path.join(__dirname, 'src/db/seeds/shelters.seed.sql'), 'utf8');
    
    console.log("Dropping existing table...");
    await pool.query('DROP TABLE IF EXISTS shelters CASCADE');
    
    console.log("Running migration...");
    await pool.query(migration);
    
    console.log("Running seed...");
    await pool.query(seed);
    
    console.log("Success!");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
