import db from "../dist/db/models/index.js";

export const validateUserAndPass = (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  next();
};

export const validateToken = async (req, res, next) => {
  if (!req.headers.token) {
    return res.status(401).json({ message: "No Token" });
  }
  const session = await db.Session.findOne({
    where: {
      token: req.headers.token,
    },
  });
  if (!session) {
    return res.status(401).json({
      message: "Wrong Token",
    });
  }
  if (new Date(session.expiration) < new Date()) {
    return res.status(401).json({
      message: "Expired Token",
    });
  }
  next();
};
