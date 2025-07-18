import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getMySQLPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10"),
      queueLimit: 0,
    });
  }
  return pool;
}

export async function closeMySQLPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// For individual connection management
export async function withConnection<T>(
  fn: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const pool = getMySQLPool();
  const connection = await pool.getConnection();
  try {
    return await fn(connection);
  } finally {
    connection.release();
  }
}
