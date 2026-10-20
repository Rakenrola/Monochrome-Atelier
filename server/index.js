

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";
import authRoutes from "./auth.js";
import productRoutes from "./products.js";
import customerRoutes from "./customers.js";
import cartRoutes from "./cart.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/cart", cartRoutes);

app.get("/", (req, res) => {
  res.send("Sheesh server is running!");
});

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DATABASE() AS databaseName"
    );

    res.json({
      success: true,
      message: "MySQL connection successful!",
      database: rows[0].databaseName,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.use((error, req, res, next) => {
  console.error("Request error:", error);
  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    success: false,
    message: "The request could not be completed.",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Sheesh server running on port ${PORT}`);
});
