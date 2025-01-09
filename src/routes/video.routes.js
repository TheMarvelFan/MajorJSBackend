import { Router } from "express";
import {
  getVideoById,
  getAllVideos,
  publishVideo,
  deleteVideo,
  updateVideo,
  toggleVideoPublishStatus,
  getCurrentUserVideos
} from "../controllers/video.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJwt);

router.route("/")
  .get(getAllVideos)
  .post(
  upload.fields(
    [
      {
        name: "videoFile",
        maxCount: 1
      },
      {
        name: "thumbnail",
        maxCount: 1
      }
    ]
  ),
  publishVideo
);

router.route("/current").get(getCurrentUserVideos);

router.route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(toggleVideoPublishStatus);

export default router;
