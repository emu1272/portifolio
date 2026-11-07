const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/auth",
  maxAge: 60 * 60 * 1000,
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }

  return secret;
}

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password ||
      password.length > 128
    ) {
      return res.status(400).json({
        message: "Please enter a valid email and password.",
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminEmail || !passwordHash) {
      return res.status(503).json({
        message: "Admin login is not configured on the server.",
      });
    }

    const emailMatches =
      email.trim().toLowerCase() === adminEmail.trim().toLowerCase();

    const passwordMatches = await bcrypt.compare(
      password,
      passwordHash
    );

    if (!emailMatches || !passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { role: "admin", email: adminEmail },
      getJwtSecret(),
      { expiresIn: "1h", issuer: "emebet-portfolio" }
    );

    res.cookie("adminToken", token, cookieOptions);

    return res.json({
      message: "Login successful.",
      user: { email: adminEmail, role: "admin" },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get("/me", (req, res) => {
  try {
    const token = req.cookies?.adminToken;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    const payload = jwt.verify(token, getJwtSecret(), {
      issuer: "emebet-portfolio",
    });

    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    return res.json({
      user: { email: payload.email, role: payload.role },
    });
  } catch {
    return res.status(401).json({ message: "Session expired or invalid." });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("adminToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
  });

  return res.json({ message: "Logged out successfully." });
});

module.exports = router;