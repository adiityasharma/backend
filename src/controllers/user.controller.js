import {asyncHandler} from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiErrors.js";
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {apiResponse} from "../utils/apiResponse.js"

const registerUser = asyncHandler(async (req, res)=>{
  //get user data from frontend
  const {fullName,username, email, password} = req.body;
  console.log(username, email, password)
  
  if([fullName, username, email, password].some(field => field?.trim() === "")) throw new apiError(400, "Fields can't be empty");
  
  const existedUser = User.findOne({
    $or : [{username}, {email}]
  })

  if(existedUser) throw new apiError(409, "User with email or username already exists");

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if(!avatarLocalPath) throw new apiError(400, "Avatar file is required");

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar) throw new apiError(400, "Avatar file is required");

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password
  })

  const createdUser = await User.findById(user._id).select("-password -refreshToken")

  if(!createdUser) throw new apiError(500, "Something went wrong while registering the user");

  return res.status(201).json(
    new apiResponse(200, createdUser, "User registered successfully")
  )

})

export {registerUser}