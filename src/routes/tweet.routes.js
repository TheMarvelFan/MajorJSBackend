import { Router } from "express";
import {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
  getTweetById,
  getAllTweets,
  getCurrentUserTweets
} from "../controllers/tweet.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJwt);

router.route("/").get(getAllTweets).post(createTweet);
router.route("/current").get(getCurrentUserTweets);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").get(getTweetById).patch(updateTweet).delete(deleteTweet);

export default router;
