import express from "express";
import { signup, login, validateToken } from "../controllers/authController.js";

const router = express.Router();

router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.post("/auth/validate", validateToken);

export default router;
