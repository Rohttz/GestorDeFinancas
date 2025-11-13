import 'dotenv/config';
import { Client } from 'pg';
import configuration from '../config/configuration';

async function ensureDatabase() {
  const config = configuration();
  const {
    host,
    port,
    username,
    password,
    name,
    ssl,
  } = config.database;
  const maintenanceDb = process.env.DB_MAINTENANCE_DB || 'postgres';

  const client = new Client({
    host,
    port,
    user: username,
    password,
    database: maintenanceDb,
    ssl: ssl ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);

    if (result.rowCount === 0) {
      const safeName = name.replace(/"/g, '""');
      await client.query(`CREATE DATABASE "${safeName}"`);
      console.log(`Database "${name}" created successfully.`);
    } else {
      console.log(`Database "${name}" already exists.`);
    }
  } catch (error) {
    console.error('Failed to ensure database exists:', error);
    process.exitCode = 1;
  } finally {
    await client.end().catch((error) => console.error('Error closing database connection:', error));
  }
}

ensureDatabase().catch((error) => {
  console.error('Unexpected error while creating database:', error);
  process.exit(1);
});
