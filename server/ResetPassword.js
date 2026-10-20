import express from "express";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import pool from "./db.js";

const router = express.Router();
const resetInstructions =
  "If an account with that email exists, a password reset link will be sent shortly.";
const emailCooldownSeconds = 60;
const tokenLifetimeMinutes = 30;

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function createTransporter() {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD.replace(/\s/g, ""),
    },
  });
}

function createResetUrl(token) {
  const configuredUrl = process.env.FRONTEND_URL;
  if (!configuredUrl) {
    throw new Error("FRONTEND_URL is not configured.");
  }

  const frontendUrl = new URL(configuredUrl);
  const isLocal =
    frontendUrl.hostname === "localhost" ||
    frontendUrl.hostname === "127.0.0.1";
  if (frontendUrl.protocol !== "https:" && !isLocal) {
    throw new Error("FRONTEND_URL must use HTTPS.");
  }

  const resetUrl = new URL("/reset-password", frontendUrl);
  resetUrl.searchParams.set("token", token);
  return resetUrl.toString();
}

router.post("/forgot-password", async (req, res) => {
  const email =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

  if (!email || email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid email address.",
    });
  }

  const transporter = createTransporter();
  if (!transporter || !process.env.FRONTEND_URL) {
    console.error(
      "Password reset is unavailable: configure GMAIL_USER, GMAIL_APP_PASSWORD, and FRONTEND_URL."
    );
    return res.status(503).json({
      success: false,
      message: "Password reset is temporarily unavailable. Please try again later.",
    });
  }

  try {
    const [users] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    const user = users[0];

    if (user) {
      const [recentTokens] = await pool.execute(
        `SELECT user_id
         FROM password_reset_tokens
         WHERE user_id = ?
           AND created_at > DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${emailCooldownSeconds} SECOND)
         LIMIT 1`,
        [user.id]
      );

      if (recentTokens.length === 0) {
        const token = randomBytes(32).toString("hex");
        const tokenHash = hashToken(token);

        await pool.execute(
          `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
           VALUES (?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ${tokenLifetimeMinutes} MINUTE))
           ON DUPLICATE KEY UPDATE
             token_hash = VALUES(token_hash),
             expires_at = VALUES(expires_at),
             created_at = CURRENT_TIMESTAMP`,
          [user.id, tokenHash]
        );

        try {
          const resetUrl = createResetUrl(token);
          await transporter.sendMail({
            from: `"Monochrome Atelier" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: "Reset your Monochrome Atelier password",
            text: `Use this link within ${tokenLifetimeMinutes} minutes to reset your password:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
            html: `<p>Use the link below to reset your password. It expires in ${tokenLifetimeMinutes} minutes.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`,
          });
        } catch (error) {
          await pool.execute(
            "DELETE FROM password_reset_tokens WHERE user_id = ? AND token_hash = ?",
            [user.id, tokenHash]
          );
          throw error;
        }
      }
    }

    return res.json({ success: true, message: resetInstructions });
  } catch (error) {
    console.error("Password reset email error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send a password reset email right now. Please try again.",
    });
  }
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body || {};
  if (
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/.test(token) ||
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      success: false,
      message: "The reset link or new password is invalid.",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [tokens] = await connection.execute(
      `SELECT user_id
       FROM password_reset_tokens
       WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP
       LIMIT 1
       FOR UPDATE`,
      [hashToken(token)]
    );

    if (tokens.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "This reset link is invalid or has expired. Request a new one.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await connection.execute(
      `UPDATE users
       SET password = ?,
           auth_provider = CASE WHEN google_id IS NULL THEN 'local' ELSE 'both' END
       WHERE id = ?`,
      [passwordHash, tokens[0].user_id]
    );
    await connection.execute(
      "DELETE FROM password_reset_tokens WHERE user_id = ?",
      [tokens[0].user_id]
    );

    await connection.commit();
    return res.json({
      success: true,
      message: "Your password has been reset. You can now sign in.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Password reset error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to reset the password. Please try again.",
    });
  } finally {
    connection.release();
  }
});

export default router;
