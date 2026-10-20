import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { readFileSync } from "node:fs";

dotenv.config();

const ssl =
  process.env.DB_SSL === "true"
    ? {
        ca: readFileSync(new URL("./isrgrootx1.pem", import.meta.url)),
        rejectUnauthorized: true,
      }
    : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ...(ssl ? { ssl } : {}),
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;