
import express from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import pool from "./db.js";

const router = express.Router();
const googleClient = new OAuth2Client();

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured in .env");
  }

  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

function createGoogleUsername(email) {
  const emailName = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);

  return `customer_${emailName || "user"}_${randomBytes(5).toString("hex")}`;
}

function getPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required.",
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length > 50 || cleanEmail.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Username or email is too long.",
      });
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and no more than 72 bytes.",
      });
    }

    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
      [cleanUsername, cleanEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username or email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password, auth_provider)
       VALUES (?, ?, ?, 'local')`,
      [cleanUsername, cleanEmail, hashedPassword]
    );

    const user = {
      id: result.insertId,
      username: cleanUsername,
      email: cleanEmail,
      role: "customer",
    };

    return res.status(201).json({
      success: true,
      message: "Registration successful!",
      token: createToken(user),
      user,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Username or email is already registered.",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
});

router.post("/google", async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({
      success: false,
      message: "Google sign-in is not configured on the server.",
    });
  }

  const { credential } = req.body || {};
  if (typeof credential !== "string" || !credential) {
    return res.status(400).json({
      success: false,
      message: "A Google credential is required.",
    });
  }

  try {
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({
        success: false,
        message: "The Google credential is invalid or expired.",
      });
    }

    if (
      !payload ||
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        success: false,
        message: "A verified Google email is required.",
      });
    }

    const email = payload.email.trim().toLowerCase();
    if (!email || email.length > 100) {
      return res.status(401).json({
        success: false,
        message: "The Google account email is invalid.",
      });
    }

    const connection = await pool.getConnection();
    let user;

    try {
      await connection.beginTransaction();

      const [googleUsers] = await connection.execute(
        `SELECT id, username, email, password, google_id, auth_provider, role
         FROM users
         WHERE google_id = ?
         LIMIT 1
         FOR UPDATE`,
        [payload.sub]
      );

      user = googleUsers[0];

      if (!user) {
        const [emailUsers] = await connection.execute(
          `SELECT id, username, email, password, google_id, auth_provider, role
           FROM users
           WHERE email = ?
           LIMIT 1
           FOR UPDATE`,
          [email]
        );
        user = emailUsers[0];
      }

      if (user) {
        if (user.role === "admin" && !user.google_id) {
          await connection.rollback();
          return res.status(403).json({
            success: false,
            message: "Google sign-in cannot be linked to an administrator account.",
          });
        }

        if (user.google_id && user.google_id !== payload.sub) {
          await connection.rollback();
          return res.status(409).json({
            success: false,
            message: "This email is already linked to a different Google account.",
          });
        }

        if (!user.google_id) {
          const authProvider = user.password === null ? "google" : "both";
          await connection.execute(
            `UPDATE users
             SET google_id = ?, auth_provider = ?
             WHERE id = ?`,
            [payload.sub, authProvider, user.id]
          );
          user.google_id = payload.sub;
          user.auth_provider = authProvider;
        }
      } else {
        for (let attempt = 0; attempt < 3 && !user; attempt += 1) {
          const username = createGoogleUsername(email);
          try {
            const [result] = await connection.execute(
              `INSERT INTO users (username, email, password, google_id, auth_provider, role)
               VALUES (?, ?, NULL, ?, 'google', 'customer')`,
              [username, email, payload.sub]
            );
            user = {
              id: result.insertId,
              username,
              email,
              password: null,
              google_id: payload.sub,
              auth_provider: "google",
              role: "customer",
            };
          } catch (error) {
            if (error.code !== "ER_DUP_ENTRY") {
              throw error;
            }

            const [matchingUsers] = await connection.execute(
              `SELECT id, username, email, password, google_id, auth_provider, role
               FROM users
               WHERE google_id = ? OR email = ?
               LIMIT 1
               FOR UPDATE`,
              [payload.sub, email]
            );
            user = matchingUsers[0];

            if (!user && attempt === 2) {
              throw error;
            }
          }
        }
      }

      if (!user) {
        throw new Error("Google customer account could not be created.");
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const publicUser = getPublicUser(user);
    return res.json({
      success: true,
      message: "Google sign-in successful.",
      token: createToken(publicUser),
      user: publicUser,
    });
  } catch (error) {
    console.error("Google sign-in error:", error);
    return res.status(500).json({
      success: false,
      message: "Google sign-in failed. Please try again.",
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (
      typeof identifier !== "string" ||
      !identifier.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Username/email and password are required.",
      });
    }

    const loginValue = identifier.trim();

    const [users] = await pool.execute(
      `SELECT id, username, email, password, role
       FROM users
       WHERE username = ? OR email = ?
       LIMIT 1`,
      [loginValue, loginValue.toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username/email or password.",
      });
    }

    const user = users[0];
    const matches =
      typeof user.password === "string" &&
      (await bcrypt.compare(password, user.password));

    if (!matches) {
      return res.status(401).json({
        success: false,
        message: "Invalid username/email or password.",
      });
    }

    const publicUser = getPublicUser(user);

    return res.json({
      success: true,
      message: "Login successful!",
      token: createToken(publicUser),
      user: publicUser,
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
});

export default router;
