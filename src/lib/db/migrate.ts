import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './client';

async function runMigrations(): Promise<void> {
  console.log('Running migrations...');

  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
