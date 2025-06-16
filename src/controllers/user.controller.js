import {asyncHandler} from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiErrors.js";
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {apiResponse} from "../utils/apiResponse.js"


const registerUser = asyncHandler(async (req, res)=>{
  //get user data from frontend
  const {fullName,username, email, password} = req.body;
  
  if([fullName, username, email, password].some(field => field?.trim() === "")) throw new apiError(400, "Fields can't be empty");
  
  const existedUser = await User.findOne({
    $or : [{username}, {email}]
  })

  if(existedUser) throw new apiError(409, "User with email or username already exists");

  console.log(req.files)

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;

  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage > 0){
    coverImageLocalPath = req.files.coverImage[0].path
  }

  if(!avatarLocalPath) throw new apiError(400, "Avatar path file is required");

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  // console.log(avatar)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  
  // if(!coverImage) throw new apiError(400, "coverImage file is required");
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