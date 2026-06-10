const pool = require('./server/src/config/db');
async function test() {
  const { rows } = await pool.query('SELECT user_id, count(*) FROM emergency_statuses GROUP BY user_id');
  console.log(rows);
  process.exit(0);
}
test();
