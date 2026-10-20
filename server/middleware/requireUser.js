import jwt from "jsonwebtoken";

export function requireUser(req, res, next) {
  const authorization = req.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "A bearer token is required.",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured.");
    return res.status(500).json({
      success: false,
      message: "Authentication is not configured.",
    });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof user !== "object" || !user.id) {
      return res.status(401).json({
        success: false,
        message: "The bearer token is invalid or expired.",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "The bearer token is invalid or expired.",
      });
    }

    return next(error);
  }
}
