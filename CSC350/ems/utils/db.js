import mysql from "mysql2/promise";

let pool = null;

export function getPool() {
  // If no env config → no DB
  if (!process.env.DB_HOST) return null;

  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || "3307"),
      ssl:
        process.env.DB_SSL === "true"
          ? { rejectUnauthorized: false }
          : false,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }

  return pool;
}

// Helper function to run queries
export async function query(sql, params = []) {
  const db = getPool();

  if (!db) {
    throw new Error("Database is not configured");
  }

  const [rows] = await db.execute(sql, params);
  return rows;
}