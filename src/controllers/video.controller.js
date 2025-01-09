import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { isValidObjectId } from "mongoose";
import { getVideoDurationInSeconds } from "get-video-duration";
import { User } from "../models/user.model.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId
  } = req.query;

  const options = {
    page: parseInt(`${page}`, 10),
    limit: parseInt(`${limit}`, 10),
    sort: {
      [sortBy]: sortType === "desc" ? -1 : 1
    }
  };

  const filter = {};

  if (query) {
    filter.title = {
      $regex: query,
      $options: "i"
    };
  }

  if (userId) {
    filter.owner = userId;
  }

  const videos = await Video.aggregatePaginate(Video.aggregate([
    {
      $match: filter
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
  ]), options);

  if (!videos) {
    throw new ApiError(404, "This user does not exist!");
  }

  videos.docs.forEach(video => {
    if (video.owner.toString() !== req.user._id.toString()) {
      delete video.updatedAt;
    }
  });

  return res
    .status(200)
    .json(
    new ApiResponse(200, videos, "Videos fetched successfully!")
  );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required!");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID!");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "This video does not exist!");
  }

  const isOwner = video.owner.toString() !== req.user._id.toString();

  if (!isOwner) {
    video.views += 1;
    await Video.findByIdAndUpdate(
      videoId,
      {
        $inc:
          {
            views: 1
          }
      }
    );

    delete video.updatedAt;
  }

  await User.findByIdAndUpdate(req.user?._id, { $push: { watchHistory: videoId } });

  console.log(req.user?.watchHistory);

  return res
    .status(200)
    .json(
    new ApiResponse(200, video, "Video fetched successfully!")
  );
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoFile = req.files?.videoFile[0].path;
  const thumbnail = req.files?.thumbnail[0].path;
  const owner = req.user._id;

  const uploadedVideo = await uploadToCloudinary(videoFile);
  const uploadedThumbnail = await uploadToCloudinary(thumbnail);

  const duration = await getVideoDurationInSeconds(uploadedVideo.url);

  const video = await Video.create({
    title,
    description,
    videoFile: uploadedVideo.url || "",
    thumbnail: uploadedThumbnail.url || "",
    duration,
    owner
  });

  return res
    .status(201)
    .json(
    new ApiResponse(201, video, "Video published successfully!")
  );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required!");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID!");
  }

  const video = await Video.findByIdAndDelete(videoId);

  if (!video) {
    throw new ApiError(404, "This video does not exist!");
  }

  return res
    .status(200)
    .json(
    new ApiResponse(200, null, "Video deleted successfully!")
  );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnail = req.file?.path;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required!");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID!");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "This video does not exist!");
  }

  if (!title && !description && !thumbnail) {
    throw new ApiError(400, "At least one field is required to update!");
  }

  video.title = title || video.title;
  video.description = description || video.description;

  if (thumbnail) {
    const uploadedThumbnail = await uploadToCloudinary(thumbnail);
    video.thumbnail = uploadedThumbnail.url || video.thumbnail;
  }

  await video.save();

  return res
    .status(200)
    .json(
    new ApiResponse(200, video, "Video updated successfully!")
  );
});

const toggleVideoPublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required!");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID!");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "This video does not exist!");
  }

  video.isPublished = !video.isPublished;

  await video.save();

  return res
    .status(200)
    .json(
    new ApiResponse(200, video, "Video publish status updated successfully!")
  );
});

const getCurrentUserVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find({ owner: req.user?._id });

  return res
    .status(200)
    .json(
    new ApiResponse(200, videos, "Videos fetched successfully!")
  );
});

export {
  getAllVideos,
  getVideoById,
  publishVideo,
  deleteVideo,
  updateVideo,
  toggleVideoPublishStatus,
  getCurrentUserVideos
};
