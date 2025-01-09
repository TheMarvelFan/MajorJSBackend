import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber ID!");
  }

  const subscriptions = await Subscription.find({
    subscriber: subscriberId
  }).populate("channel");

  if (!subscriptions) {
    throw new ApiError(404, "This user does not exist!");
  }

  return res.status(200).json(
    new ApiResponse(200, { subscriptions }, "Subscriptions fetched successfully!")
  );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID!")
  }

  const subscribers = await Subscription.find({
    channel: channelId
  }).populate("subscriber");

  if (!subscribers) {
    throw new ApiError(404, "This channel does not exist!")
  }

  return res.status(200).json(
    new ApiResponse(200, { subscribers }, "Subscribers fetched successfully!")
  );
});

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscriberId = req.user?._id;

  if (subscriberId.toString() === channelId.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel!");
  }

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber ID!");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID!");
  }

  const subscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId
  });

  if (subscription) {
    await Subscription.findByIdAndDelete(subscription._id);

    return res.status(200).json(
      new ApiResponse(200, null, "Channel unsubscribed successfully!")
    );
  }

  await Subscription.create({
    subscriber: subscriberId,
    channel: channelId
  });

  return res.status(201).json(
    new ApiResponse(201, null, "Channel subscribed successfully!")
  );
});

export {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription
};
