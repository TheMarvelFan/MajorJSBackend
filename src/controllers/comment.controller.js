import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required!");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID!");
  }

  const { page = 1, limit = 10 } = req.query;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const comments = await Comment.aggregatePaginate(
    Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId)
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner"
        }
      },
      {
        $unwind: "$owner"
      },
      {
        $project: {
          "owner.password": 0
        }
      }
    ]),
    options
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, comments, "Comments fetched successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required!");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID!");
  }

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Comment cannot be empty!");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: userId
  });

  const returnedComment = await Comment.findById(comment._id).select("-createdAt -updatedAt");

  return res
    .status(201)
    .json(
      new ApiResponse(201, returnedComment, "Comment added successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "Comment ID is required!");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID!");
  }

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Comment deleted successfully")
    );
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "Comment ID is required!");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID!");
  }

  if (req.body.video || req.body.owner) {
    throw new ApiError(400, "You cannot update video or owner of the comment!");
  }

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Comment cannot be empty!");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      content
    },
    {
      new: true
    });

  return res.status(200).json(
    new ApiResponse(200, updatedComment, "Comment updated successfully")
  );
});

const getCommentById = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "Comment ID is required!");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID!");
  }

  const comment = await Comment.findById(commentId);

  if (req.user?._id.toString() !== comment.owner.toString()) {
    delete comment.updatedAt;
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, comment, "Comment fetched successfully")
    );
});

export {
  getVideoComments,
  addComment,
  deleteComment,
  updateComment,
  getCommentById
};
