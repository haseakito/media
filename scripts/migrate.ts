import { config } from "dotenv";
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db, conn } from '@/db';

// Load environment variables from .env file
config({ path: ".env.local" });

async function migration() {
    try {
        // Run migration on database
        await migrate(db, { migrationsFolder: './db/migrations' });
    } catch (error) {
        // Output the error
        console.error("Error during migration: ", error);
        // Terminate the process
        process.exit(1)
    } finally {
        // Close database connection
        await conn.end();
    }
}

migration().then(() => process.exit());