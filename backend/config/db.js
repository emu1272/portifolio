/**
 * Database Configuration (Aiven MySQL)
 * 
 * This module configures a connection pool using `mysql2/promise`.
 * 
 * Safety features:
 * - Reads all sensitive information exclusively from environment variables (.env).
 * - SSL is enabled by default to satisfy Aiven's security requirement.
 * - Does NOT initiate any network connection until credentials are provided and tested.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

/**
 * Checks whether valid database credentials have been configured in .env
 * @returns {boolean}
 */
function isConfigured() {
  const host = process.env.DB_HOST;
  const password = process.env.DB_PASSWORD;

  // Verify that variables exist and are not still the default placeholder values
  if (!host || !password) return false;
  if (host.includes('your-mysql-service') || password.includes('your_aiven_password')) {
    return false;
  }
  return true;
}

/**
 * Gets or initializes the MySQL connection pool.
 * Returns null if database credentials are not yet configured.
 */
function getPool() {
  if (!isConfigured()) {
    return null;
  }

  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        // Aiven requires SSL connections.
        // In local development, setting rejectUnauthorized to false accepts Aiven's TLS certificate.
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
      },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  return pool;
}

/**
 * Tests the database connection and returns a diagnostic result.
 * Does not throw unhandled errors; safe to call anytime.
 */
async function testConnection() {
  if (!isConfigured()) {
    return {
      connected: false,
      status: 'awaiting_credentials',
      message: 'Database connection paused: Waiting for valid credentials in backend/.env'
    };
  }

  try {
    const activePool = getPool();
    const connection = await activePool.getConnection();
    await connection.ping();
    connection.release();

    return {
      connected: true,
      status: 'connected',
      message: 'Successfully connected to Aiven MySQL database with SSL!'
    };
  } catch (error) {
    return {
      connected: false,
      status: 'error',
      message: `Failed to connect to Aiven MySQL: ${error.message}`
    };
  }
}

module.exports = {
  getPool,
  isConfigured,
  testConnection
};
