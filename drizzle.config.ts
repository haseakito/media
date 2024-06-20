import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables from .env file
config({ path: ".env.local" });

export default defineConfig({
    // for migration
    schema: "./db/schema.ts",
    dialect: "mysql",
    out: "./db/migrations",
    // for drizzle studio 
    dbCredentials: {
        host: process.env.DATABASE_HOST!,
        user: process.env.DATABASE_USER!,
        database: process.env.DATABASE_NAME!,
        password: process.env.DATABASE_PASSWORD!,
        port: 3306
    }
});
