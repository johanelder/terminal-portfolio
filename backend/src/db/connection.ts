import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool(
  process.env.DB_SOCKET_PATH
    ? {
        socketPath: process.env.DB_SOCKET_PATH,
        user:       process.env.DB_USER,
        password:   process.env.DB_PASSWORD,
        database:   process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
      }
    : {
        host:     process.env.DB_HOST || '127.0.0.1',
        port:     3306,
        user:     process.env.DB_USER     || 'test',
        password: process.env.DB_PASSWORD || 'test',
        database: process.env.DB_NAME     || 'portfolio_test',
        waitForConnections: true,
        connectionLimit: 10,
      }
);

export default pool;
