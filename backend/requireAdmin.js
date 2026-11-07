const jwt = require("jsonwebtoken");

function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.adminToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please log in as an administrator.",
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
      return res.status(500).json({
        success: false,
        message: "Admin authentication is not configured.",
      });
    }

    const payload = jwt.verify(token, secret, {
      issuer: "emebet-portfolio",
    });

    if (payload.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator access required.",
      });
    }

    req.admin = {
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Your session has expired. Please log in again.",
    });
  }
}

module.exports = requireAdmin;
