import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { EMAIL_REGEX } from "../constants.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { getChannelDetails } from "../constants.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save(
      {
        validateBeforeSave: false
      }
    );

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate tokens!");
  }
}

const registerUser = asyncHandler( async (req, res) => {
  // get user details from request from frontend
  const { fullName, email, username, password } = req.body;

  // validate user details
  if (
    [ fullName, email, username, password ].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Please fill in all fields!");
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(400, "Please provide a valid email address!");
  }

  // check if user already exists using both username and email
  const duplicateUser = await User.findOne({
    $or: [
      {
        username
      },
      {
        email
      }
    ]
  });

  if (duplicateUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  // check for images and avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;

  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Please provide an avatar image!");
  }

  // upload to cloudinary
  const avatar = await uploadToCloudinary(avatarLocalPath);
  let coverImage;

  if (coverImageLocalPath) {
    coverImage = await uploadToCloudinary(coverImageLocalPath);
    if (!coverImage) {
      throw new ApiError(500, "Failed to upload cover image!");
    }
  }

  if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar image!");
  }

  // create user object and save it to db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  });

  // remove password and refresh token field from response
  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check if user was saved successfully by verifying received response
  if (!userCreated) {
    throw new ApiError(500, "Failed to save user to database!");
  }

  // send response to frontend
  return res.status(201).json(
    new ApiResponse(
      200,
      userCreated,
      "User registered successfully!"
    )
  );
});

const loginUser = asyncHandler(async (req, res) => {
  // get user data from request
  const { email, username, password } = req.body;

  // username or email
  if (!email && !username) {
    throw new ApiError(400, "Please provide either your email or username!");
  }

  // find user in db
  const foundUser = await User.findOne({
    $or: [
      {
        username
      },
      {
        email
      }
    ]
  });

  if (!foundUser) {
    throw new ApiError(404, "User not found!");
  }

  // compare password
  const isValid = await foundUser.isPasswordCorrect(password);
  if (!isValid) {
    throw new ApiError(401, "Password incorrect!");
  }

  // generate access token and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    foundUser._id
  );

  // send response cookie with tokens
  const loggedInUser = await User.findById(foundUser._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          refreshToken,
          accessToken
        },
        "User logged in successfully!"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1
      }
    },
    {
      new: true
    }
  );

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(
        200,
        {},
        "User logged out successfully!"
      )
    );
});

const refreshAccessToken = asyncHandler( async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request!");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken?.id);

    if (!user) {
      throw new ApiError(404, "Invalid refresh token!");
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used!");
    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken
          },
          "Access token refreshed successfully!"
        )
      );
  } catch (err) {
    throw new ApiError(401, err?.message || "Unauthorized request!");
  }
});

const changeCurrentPassword = asyncHandler( async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password!");
  }

  user.password = newPassword;
  await user.save({
    validateBeforeSave: false
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password changed successfully!"
      )
    )
});

const getCurrentUser = asyncHandler( async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(
      200,
      req.user,
      "User fetched successfully!"
    ));
});

const updateAccountDetails = asyncHandler( async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName && !email) {
    throw new ApiError(400, "Please provide either your full name or email!");
  }

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email
      }
    },
    {
      new: true
    }
  ).select("-password");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "User account details updated successfully!"
      )
    )
});

const updateUserAvatar = asyncHandler( async (req, res) => {
  const localAvatarPath = req.file?.path;

  if (!localAvatarPath) {
    throw new ApiError(400, "Please provide an avatar image!");
  }

  const avatar = await uploadToCloudinary(localAvatarPath);

  if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar image!");
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {
      new: true
    }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "Avatar updated successfully"
      )
    );
});

const updateUserCoverImage = asyncHandler( async (req, res) => {
  const localCoverImagePath = req.file?.path;

  if (!localCoverImagePath) {
    throw new ApiError(400, "Please provide a cover image!");
  }

  const coverImage = await uploadToCloudinary(localCoverImagePath);

  if (!coverImage) {
    throw new ApiError(500, "Failed to upload cover image!");
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {
      new: true
    }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "Cover Image updated successfully"
      )
    );
});

const getUserChannelProfile = asyncHandler( async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Please provide a username!");
  }

  const channel = await getChannelDetails(username, req);
  if (!channel?.length) {
    throw new ApiError(404, "Channel not found!");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channel[0],
        "Channel profile fetched successfully!"
      )
    );
});

const getWatchHistory = asyncHandler( async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0]?.watchHistory || [],
        "Watch history fetched successfully!"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
