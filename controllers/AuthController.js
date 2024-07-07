import { Router } from "express";
import { login, logout } from "../services/AuthService.js";
import { createUser } from "../services/UserService.js";
import {
  validateUserAndPass,
  validateToken,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", validateUserAndPass, async (req, res) => {
  const response = await login(req.body.email, req.body.password);
  res.status(response.code).json(response.message);
});

router.post("/register", async (req, res) => {
  const response = await createUser(req);
  res.status(response.code).json(response.message);
});

router.post("/logout", validateToken, async (req, res) => {
  const response = await logout(req.headers.token);
  res.status(response.code).json(response.message);
});

export default router;
