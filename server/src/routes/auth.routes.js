import express from "express";

import {
  register,
  login,
  getMe,
  logout
} from "../controllers/auth.controller.js";

import protect from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.middleware.js";

import {
  registerSchema,
  loginSchema
} from "../validation/validation.js";

const router = express.Router();

router.post(
  "/register",
  validate(registerSchema),
  register
);

router.post(
  "/login",
  validate(loginSchema),
  login
);

router.get(
  "/me",
  protect,
  getMe
);

router.post(
  "/logout",
  logout
);

export default router;