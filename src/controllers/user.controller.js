import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { EMAIL_REGEX } from "../constants.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  if (isValid) {
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
      $set: {
        refreshToken: undefined
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

export { registerUser, loginUser, logoutUser };
