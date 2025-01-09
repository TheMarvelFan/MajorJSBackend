import { Router } from "express";
import {
  getVideoComments,
  addComment,
  deleteComment,
  updateComment,
  getCommentById
} from "../controllers/comment.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJwt);

router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").get(getCommentById).delete(deleteComment).patch(updateComment);

export default router;
