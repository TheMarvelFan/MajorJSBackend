import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";
import { isValidObjectId } from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user._id
  });

  return res.status(201).json(
    new ApiResponse(201, tweet, "Tweeted successfully!")
  );
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const tweets = await Tweet.find({ owner: userId });

  if (!tweets) {
    throw new ApiError(404, "This user does not exist!");
  }

  return res.status(200).json(
    new ApiResponse(200, tweets, "User tweets retrieved successfully!")
  );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { content },
    { new: true }
  );

  if (!tweet) {
    throw new ApiError(404, "Tweet not found!");
  }

  return res.status(200).json(
    new ApiResponse(200, tweet, "Tweet updated successfully!")
  );
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const tweet = await Tweet.findByIdAndDelete(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found!");
  }

  return res.status(200).json(
    new ApiResponse(200, tweet, "Tweet deleted successfully!")
  );
});

const getAllTweets = asyncHandler(async (req, res) => {
  const userTweets = await Tweet.find({ owner: req.user._id });
  const otherTweets = await Tweet.find({ owner: { $ne: req.user._id } }, "-updatedAt");

  const allTweets = [...userTweets, ...otherTweets];

  return res.status(200).json(
    new ApiResponse(200, allTweets, "All tweets retrieved successfully!")
  );
});

const getTweetById = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found!");
  }

  const isOwner = tweet.owner.toString() === req.user._id.toString();

  const responseTweet = isOwner
    ?
    {
      ...tweet.toObject(),
      updatedAt: tweet.updatedAt
    }
    : (({ updatedAt, ...rest }) => rest)(tweet.toObject())
  ;

  return res.status(200).json(
    new ApiResponse(200, responseTweet, "Tweet retrieved successfully!")
  );
});

const getCurrentUserTweets = asyncHandler(async (req, res) => {
  const tweets = await Tweet.find({ owner: req.user?._id });

  return res.status(200).json(
    new ApiResponse(200, tweets, "User tweets retrieved successfully!")
  );
});

export {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
  getAllTweets,
  getTweetById,
  getCurrentUserTweets
};
