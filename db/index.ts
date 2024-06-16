import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Create a new connection
export const conn = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  multipleStatements: true,
});

// Initialize drizzle client
export const db = drizzle(conn, { schema: schema, mode: "default", logger: true });
