import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiErrors.js";
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async (userId) => {
  // console.log(userId)
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }

  } catch (error) {
    throw new apiError(500, error)
  }

}


const registerUser = asyncHandler(async (req, res) => {
  //get user data from frontend
  const { fullName, username, email, password } = req.body;

  if ([fullName, username, email, password].some(field => field?.trim() === "")) throw new apiError(400, "Fields can't be empty");

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (existedUser) throw new apiError(409, "User with email or username already exists");

  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;

  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
  }

  if (!avatarLocalPath) throw new apiError(400, "Avatar path file is required");

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) throw new apiError(400, "Avatar file is required");

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password
  })

  const createdUser = await User.findById(user._id).select("-password -refreshToken")

  if (!createdUser) throw new apiError(500, "Something went wrong while registering the user");

  return res.status(201).json(
    new apiResponse(200, createdUser, "User registered successfully")
  )

})


const loginUser = asyncHandler(async (req, res) => {

  const { username, email, password } = req.body;

  if (!(username || email)) throw new apiError(400, "username or email is required");

  const user = await User.findOne({
    $or: [{ username }, { email }]
  })
  // console.log(user)

  if (!user) throw new apiError(404, "user dose not exist");

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) throw new apiError(404, "Invalid user credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "user logged in successfully"
      )
    )

})


const logoutUser = asyncHandler(async (req, res) => {

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new apiResponse(200, {}, "user logged out")
    )

})

const refreshAccessToken = asyncHandler(async (req, res) => {

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new apiError(401, "Unauthorized");

  try {
    const decodedToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if (!user) throw new apiError(401, "Invalid refresh token");

    if (incomingRefreshToken !== user?.refreshToken) throw new apiError(401, "Refresh token is expired or used");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const options = {
      httpOnly: true,
      secure: true
    }

    return res.status(200)
      .cookie("accessToken", accessToken)
      .cookie("refreshToken", refreshToken)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token refreshed"
        )
      )
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid refresh token")
  }


})


export { registerUser, loginUser, logoutUser, refreshAccessToken }