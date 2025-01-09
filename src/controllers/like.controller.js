import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";
import { isValidObjectId } from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required!");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID!");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const user = req.user;

  const isVideoLiked = await Like.findOne({ video: videoId, likedBy: user._id });

  if (isVideoLiked) {
    await Like.findOneAndDelete({ video: videoId, likedBy: user._id });
    return res.status(200).json(
      new ApiResponse(200, {}, "Video unliked!")
    );
  }

  const like = await Like.create({
    video: videoId,
    likedBy: user._id
  });

  return res.status(200).json(
    new ApiResponse(200, like, "Video liked!")
  );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "Comment ID is required!");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID!");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found!");
  }

  const user = req.user;

  const isCommentLiked = await Like.findOne({ comment: commentId, likedBy: user._id });

  if (isCommentLiked) {
    await Like.findOneAndDelete({ comment: commentId, likedBy: user._id });
    return res.status(200).json(
      new ApiResponse(200, {}, "Comment unliked!")
    );
  }

  const like = await Like.create({
    comment: commentId,
    likedBy: user._id
  });

  return res.status(200).json(
    new ApiResponse(200, like, "Comment liked!")
  );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required!");
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID!");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const user = req.user;

  const isTweetLiked = await Like.findOne({ tweet: tweetId, likedBy: user._id });

  if (isTweetLiked) {
    await Like.findOneAndDelete({ tweet: tweet, likedBy: user._id });
    return res.status(200).json(
      new ApiResponse(200, {}, "Tweet unliked!")
    );
  }

  const like = await Like.create({
    tweet: tweetId,
    likedBy: user._id
  });

  return res.status(200).json(
    new ApiResponse(200, like, "Tweet liked!")
  );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const user = req.user;

  const likedVideos = await Like.find({
    likedBy: user._id,
    video: {
      $ne: null
    }
  }).populate("video");

  return res.status(200).json(
    new ApiResponse(200, likedVideos, "Liked videos retrieved!")
  );
});

export {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getLikedVideos
};
