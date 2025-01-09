import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getAccountStats,
  getAccountVideos
} from "../controllers/dashboard.controller.js";

const router = Router();
router.use(verifyJwt);

router.route("/stats").get(getAccountStats);
router.route("/videos").get(getAccountVideos);

export default router;
