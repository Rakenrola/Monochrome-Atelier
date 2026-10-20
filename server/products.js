import express from "express";
import pool from "./db.js";
import { requireAdmin } from "./middleware/requireAdmin.js";

const router = express.Router();
const productFields = ["title", "category", "price", "specs", "image"];
const productResponseFields = ["id", ...productFields, "created_at", "updated_at"];

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

function validateProduct(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "A product object is required.";
  }

  for (const field of ["title", "category", "specs", "image"]) {
    if (typeof body[field] !== "string" || !body[field].trim()) {
      return `${field} must be a non-empty string.`;
    }
  }

  if (
    body.title.trim().length > 160 ||
    body.category.trim().length > 60 ||
    body.specs.trim().length > 500 ||
    body.image.trim().length > 2048
  ) {
    return "One or more product fields exceed the allowed length.";
  }

  if (
    typeof body.price !== "number" ||
    !Number.isFinite(body.price) ||
    body.price < 0 ||
    body.price > 99999999.99
  ) {
    return "price must be a number between 0 and 99999999.99.";
  }

  return null;
}

function getProductId(value) {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

router.get("/", async (req, res, next) => {
  try {
    const [products] = await pool.execute(
      `SELECT ${productResponseFields.join(", ")} FROM products ORDER BY id`
    );
    return res.json({ success: true, products });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  const id = getProductId(req.params.id);
  if (id === null) {
    return res.status(400).json({ success: false, message: "Product ID must be a positive integer." });
  }

  try {
    const [products] = await pool.execute(
      `SELECT ${productResponseFields.join(", ")} FROM products WHERE id = ?`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    return res.json({ success: true, product: products[0] });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  const validationError = validateProduct(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const values = productFields.map((field) =>
      field === "price" ? req.body[field] : req.body[field].trim()
    );
    const [result] = await pool.execute(
      `INSERT INTO products (${productFields.join(", ")}) VALUES (?, ?, ?, ?, ?)`,
      values
    );
    const [products] = await pool.execute(
      `SELECT ${productResponseFields.join(", ")} FROM products WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, product: products[0] });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  const id = getProductId(req.params.id);
  if (id === null) {
    return res.status(400).json({ success: false, message: "Product ID must be a positive integer." });
  }

  const validationError = validateProduct(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const values = productFields.map((field) =>
      field === "price" ? req.body[field] : req.body[field].trim()
    );
    const [result] = await pool.execute(
      `UPDATE products SET ${productFields.map((field) => `${field} = ?`).join(", ")} WHERE id = ?`,
      [...values, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const [products] = await pool.execute(
      `SELECT ${productResponseFields.join(", ")} FROM products WHERE id = ?`,
      [id]
    );
    return res.json({ success: true, product: products[0] });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  const id = getProductId(req.params.id);
  if (id === null) {
    return res.status(400).json({ success: false, message: "Product ID must be a positive integer." });
  }

  try {
    const [result] = await pool.execute("DELETE FROM products WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
