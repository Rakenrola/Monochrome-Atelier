
import pool from "./db.js";

try {
  const [rows] = await pool.query(
    "SELECT DATABASE() AS databaseName, NOW() AS serverTime"
  );

  console.log("MySQL connection successful!");
  console.log("Database:", rows[0].databaseName);
  console.log("MySQL server time:", rows[0].serverTime);
} catch (error) {
  console.error("MySQL connection failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
