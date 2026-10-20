import express from "express";
import pool from "./db.js";
import { requireUser } from "./middleware/requireUser.js";

const router = express.Router();
const MAX_CART_ITEMS = 100;
const MAX_QUANTITY = 999;

function validateItems(items) {
  if (!Array.isArray(items) || items.length > MAX_CART_ITEMS) {
    return "Cart items must be an array with no more than 100 entries.";
  }

  for (const item of items) {
    if (
      !item ||
      !Number.isSafeInteger(Number(item.id)) ||
      Number(item.id) < 1 ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_QUANTITY
    ) {
      return "Each cart item must have a valid product ID and quantity.";
    }
  }

  return null;
}

async function getOrCreateCart(connection, userId) {
  const [result] = await connection.execute(
    `INSERT INTO carts (user_id) VALUES (?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [userId]
  );
  return result.insertId;
}

async function getCartItems(connection, cartId) {
  const [items] = await connection.execute(
    `SELECT p.id, p.title, p.category, p.price, p.specs, p.image, ci.quantity
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = ?
     ORDER BY ci.id`,
    [cartId]
  );
  return items;
}

async function replaceItems(connection, cartId, items) {
  await connection.execute("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);

  for (const item of items) {
    await connection.execute(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES (?, ?, ?)`,
      [cartId, Number(item.id), item.quantity]
    );
  }
}

router.use(requireUser);

router.get("/", async (req, res, next) => {
  try {
    const cartId = await getOrCreateCart(pool, req.user.id);
    const items = await getCartItems(pool, cartId);
    return res.json({ success: true, items });
  } catch (error) {
    return next(error);
  }
});

router.post("/merge", async (req, res, next) => {
  const items = req.body?.items;
  const validationError = validateItems(items);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const cartId = await getOrCreateCart(connection, req.user.id);
    const existingItems = await getCartItems(connection, cartId);
    const merged = new Map(
      existingItems.map((item) => [Number(item.id), Number(item.quantity)])
    );

    for (const item of items) {
      const productId = Number(item.id);
      merged.set(productId, Math.max(merged.get(productId) || 0, item.quantity));
    }

    await replaceItems(
      connection,
      cartId,
      [...merged].map(([id, quantity]) => ({ id, quantity }))
    );
    const cartItems = await getCartItems(connection, cartId);
    await connection.commit();
    return res.json({ success: true, items: cartItems });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        success: false,
        message: "One or more products in the cart no longer exist.",
      });
    }
    return next(error);
  } finally {
    connection.release();
  }
});

router.put("/", async (req, res, next) => {
  const items = req.body?.items;
  const validationError = validateItems(items);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const cartId = await getOrCreateCart(connection, req.user.id);
    await replaceItems(connection, cartId, items);
    const cartItems = await getCartItems(connection, cartId);
    await connection.commit();
    return res.json({ success: true, items: cartItems });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        success: false,
        message: "One or more products in the cart no longer exist.",
      });
    }
    return next(error);
  } finally {
    connection.release();
  }
});

export default router;
