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
  const duplicateUser = User.findOne({
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
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

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

export { registerUser };
