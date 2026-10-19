import express from "express";
import bcrypt from "bcryptjs";
import pool from "./db.js";
import { requireAdmin } from "./middleware/requireAdmin.js";

const router = express.Router();

function getCustomerId(value) {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function validateUsername(username) {
  if (typeof username !== "string" || !username.trim()) {
    return "username must be a non-empty string.";
  }

  if (username.trim().length > 50) {
    return "username must be 50 characters or fewer.";
  }

  return null;
}

function validateEmail(email) {
  if (typeof email !== "string" || !email.trim()) {
    return "email must be a non-empty string.";
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return "email must be valid and 100 characters or fewer.";
  }

  return null;
}

function validatePassword(password) {
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return "password must be at least 8 characters and no more than 72 bytes.";
  }

  return null;
}

router.use(requireAdmin);

router.get("/", async (req, res, next) => {
  try {
    const [customers] = await pool.execute(
      `SELECT id, username, email, role, created_at
       FROM users
       WHERE role = 'customer'
       ORDER BY id`
    );

    return res.json({ success: true, customers });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  const id = getCustomerId(req.params.id);
  if (id === null) {
    return res.status(400).json({
      success: false,
      message: "Customer ID must be a positive integer.",
    });
  }

  try {
    const [customers] = await pool.execute(
      `SELECT id, username, email, role, created_at
       FROM users
       WHERE id = ? AND role = 'customer'`,
      [id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    return res.json({ success: true, customer: customers[0] });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  const { username, email, password } = req.body || {};
  const validationError =
    validateUsername(username) || validateEmail(email) || validatePassword(password);

  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password, role)
       VALUES (?, ?, ?, 'customer')`,
      [normalizedUsername, normalizedEmail, hashedPassword]
    );
    const [customers] = await pool.execute(
      `SELECT id, username, email, role, created_at
       FROM users
       WHERE id = ? AND role = 'customer'`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, customer: customers[0] });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Username or email is already registered.",
      });
    }

    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  const id = getCustomerId(req.params.id);
  if (id === null) {
    return res.status(400).json({
      success: false,
      message: "Customer ID must be a positive integer.",
    });
  }

  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ success: false, message: "A customer object is required." });
  }

  const allowedFields = ["username", "email", "password"];
  const unknownFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));
  if (unknownFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Unsupported customer field: ${unknownFields.join(", ")}.`,
    });
  }

  const fields = allowedFields.filter((field) =>
    Object.prototype.hasOwnProperty.call(req.body, field)
  );

  if (fields.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Provide username, email, or password to update.",
    });
  }

  for (const field of fields) {
    const validationError =
      field === "username"
        ? validateUsername(req.body.username)
        : field === "email"
          ? validateEmail(req.body.email)
          : validatePassword(req.body.password);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }
  }

  try {
    const assignments = [];
    const parameters = [];

    for (const field of fields) {
      const value =
        field === "password"
          ? await bcrypt.hash(req.body.password, 12)
          : field === "email"
            ? req.body.email.trim().toLowerCase()
            : req.body.username.trim();
      assignments.push(`${field} = ?`);
      parameters.push(value);
    }

    const [result] = await pool.execute(
      `UPDATE users
       SET ${assignments.join(", ")}
       WHERE id = ? AND role = 'customer'`,
      [...parameters, id]
    );

    if (result.affectedRows === 0) {
      const [customers] = await pool.execute(
        "SELECT id FROM users WHERE id = ? AND role = 'customer'",
        [id]
      );
      if (customers.length === 0) {
        return res.status(404).json({ success: false, message: "Customer not found." });
      }
    }

    const [customers] = await pool.execute(
      `SELECT id, username, email, role, created_at
       FROM users
       WHERE id = ? AND role = 'customer'`,
      [id]
    );
    return res.json({ success: true, customer: customers[0] });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Username or email is already registered.",
      });
    }

    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const id = getCustomerId(req.params.id);
  if (id === null) {
    return res.status(400).json({
      success: false,
      message: "Customer ID must be a positive integer.",
    });
  }

  try {
    const [result] = await pool.execute(
      "DELETE FROM users WHERE id = ? AND role = 'customer'",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
