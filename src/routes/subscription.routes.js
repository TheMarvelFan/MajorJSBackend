import { Router } from "express";
import {
  getUserChannelSubscribers,
  getSubscribedChannels,
  toggleSubscription
} from "../controllers/subscription.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJwt);

router.route("/c/:channelId").get(getUserChannelSubscribers).post(toggleSubscription);

router.route("/u/:subscriberId").get(getSubscribedChannels);

export default router;
