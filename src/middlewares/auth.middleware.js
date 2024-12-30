import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJwt = asyncHandler(async (req, _, next) => {
  try {
    const accToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!accToken) {
      throw new ApiError(401, "Access token not found!");
    }

    const decodedToken = jwt.verify(accToken, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?.id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid access token!");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token!");
  }
});
