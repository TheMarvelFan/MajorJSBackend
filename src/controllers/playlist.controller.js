import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.model.js";
import { isValidObjectId } from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    throw new ApiError(400, "Name and description are required!");
  }

  const owner = req.user?._id;

  const playlist = await Playlist.create({ name, description, owner });

  return res.status(201).json(
    new ApiResponse(201, { playlist }, "Playlist created successfully!")
  );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const owner = req.params.userId;

  const playlists = await Playlist.find({ owner });

  if (!playlists) {
    throw new ApiError(404, "User not found!");
  }

  return res.status(200).json(
    new ApiResponse(200, { playlists }, "User playlists retrieved successfully!")
  );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const playlistId = req.params.playlistId;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID!");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found!");
  }

  return res.status(200).json(
    new ApiResponse(200, { playlist }, "Playlist retrieved successfully!")
  );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const playlistId = req.params.playlistId;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID!");
  }

  if (!name && !description) {
    throw new ApiError(400, "Name or description is required!");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    { name, description },
    { new: true }
  );

  if (!playlist) {
    throw new ApiError(404, "Playlist not found!");
  }

  return res.status(200).json(
    new ApiResponse(200, { playlist }, "Playlist updated successfully!")
  );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const playlistId = req.params.playlistId;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID!");
  }

  const playlist = await Playlist.findByIdAndDelete(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found!");
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Playlist deleted successfully!")
  );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;

  if (!videoId || !playlistId) {
    throw new ApiError(400, "Video ID and Playlist ID are required!");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID!");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID!");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found!");
  }

  playlist.videos.push(videoId);

  await playlist.save();

  return res.status(200).json(
    new ApiResponse(200, { playlist }, "Video added to playlist successfully!")
  );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID!");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID!");
  }

  if (!videoId || !playlistId) {
    throw new ApiError(400, "Video ID and Playlist ID are required!");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found!");
  }

  const ogLen = playlist.videos.length;

  playlist.videos = playlist.videos.filter((id) => id.toString() !== videoId);

  if (playlist.videos.length === ogLen) {
    throw new ApiError(404, "Video not found in playlist!");
  }

  await playlist.save();

  return res.status(200).json(
    new ApiResponse(200, { playlist }, "Video removed from playlist successfully!")
  );
});

const getCurrentUserPlaylists = asyncHandler(async (req, res) => {
  const owner = req.user?._id;

  const playlists = await Playlist.find({ owner });

  return res.status(200).json(
    new ApiResponse(200, { playlists }, "User playlists retrieved successfully!")
  );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getCurrentUserPlaylists
};
