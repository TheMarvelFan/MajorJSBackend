import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Playlist } from "../models/playlist.model.js";
import { Tweet } from "../models/tweet.model.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { getChannelDetails } from "../constants.js";

const getAccountStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const videos = await Video.find({
    owner: new mongoose.Types.ObjectId(userId)
  });

  const totalVideosWatched = req.user?.watchHistory?.length;

  const videoCount = videos?.length;

  const videoViews = videos?.reduce((acc, video) => acc + video.views, 0);

  const videoLikesCount = await Like.countDocuments({
    video: {
      $in: videos?.map(video => video._id)
    }
  });

  const videoCommentsCount = await Comment.countDocuments({
    video: {
      $in: videos?.map(video => video._id)
    }
  });

  const comments = await Comment.find({
    owner: userId
  });

  const commentCount = comments?.length;

  const commentLikes = await Like.countDocuments({
    comment: {
      $in: comments?.map(comment => comment._id)
    }
  });

  const videoLikeCount = await Like.countDocuments({
    likedBy: userId,
    video: {
      $ne: null
    }
  });

  const tweetLikeCount = await Like.countDocuments({
    likedBy: userId,
    tweet: {
      $ne: null
    }
  });

  const commentLikeCount = await Like.countDocuments({
    likedBy: userId,
    comment: {
      $ne: null
    }
  });

  const likeCount = videoLikeCount + tweetLikeCount + commentLikeCount;

  const username = req.user?.username;

  const userDetails = await getChannelDetails(username, req);

  const subscribersCount = userDetails[0]?.subscribersCount;
  const subscribedToCount = userDetails[0]?.channelsSubscribedToCount;

  const tweets = await Tweet.find({
    owner: userId
  });

  const tweetCount = tweets?.length;

  const tweetLikes = await Like.countDocuments({
    tweet: {
      $in: tweets?.map(tweet => tweet._id)
    }
  });

  let playlists = await Playlist.find({
    owner: userId
  });

  const playlistCount = playlists?.length;

  playlists = await Promise.all(
    playlists?.map(async (playlist) => {
      const likesCount = await Like.countDocuments({
        video: {
          $in: playlist.videos?.map((video) => video._id)
        }
      });

      const commentsCount = await Comment.countDocuments({
        video: {
          $in: playlist.videos?.map((video) => video._id)
        }
      });

      return {
        name: playlist.name,
        videoCount: playlist.videos.length,
        likesCount,
        commentsCount
      };
    })
  );

  return res.status(200).json(
    new ApiResponse(200, {
      videoCount,
      videoViews,
      videoLikesCount,
      videoCommentsCount,
      commentCount,
      commentLikes,
      videoLikeCount,
      tweetLikeCount,
      commentLikeCount,
      likeCount,
      subscribersCount,
      subscribedToCount,
      tweetCount,
      tweetLikes,
      playlistCount,
      playlists,
      totalVideosWatched
    }, "Account stats retrieved successfully")
  );
});

const getAccountVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const videos = await Video.find({
    owner: new mongoose.Types.ObjectId(userId)
  });

  return res
    .status(200)
    .json(
    new ApiResponse(200, videos, "Videos retrieved successfully")
  );
});

export {
  getAccountStats,
  getAccountVideos
};
