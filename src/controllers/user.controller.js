import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { upload } from "../middleware/multer.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { response } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";


const generateAccessAndRefreshTokens = async (userId) => { 
    try{ 
       const user =  await User.findById(userId)
       const accessToken =   user.generateAccessToken(); 
       const refreshToken =  user.generateRefreshToken(); 

       user.refreshToken = refreshToken ; 
       await user.save({validateBeforeSave: false})
       return{accessToken,refreshToken} ; 

    }catch(error){ 
        throw new ApiError(500 , "Something Went Wrong While Generating Refresh And Access Tokens")
    }


}
const registerUser = asyncHandler(async (req, res) => {
  //get user data from frontend
  //validation
  // check if user already exist
  //check for images, check for avatar
  // upload them to cloudinary
  // create user object - create entry in db
  // remove password and refresh token from response
  // check for user creatioon
  // return response

  const { username, fullName, email, password } = req.body;
  console.log("This is req.body object ", req.body);
  console.log("This is req.files object ", req.files);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(404, "All Fields Are Required");
  }
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser)
    throw new ApiError(409, "User with same username or email already exist");

  const avatarLocalPath = req.files?.avatar[0].path;
  //    const coverImageLocalPath =  req.files?.coverImage[0].path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File Is Required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) throw new ApiError(400, "Avatar File Failed To Upload");

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something Went Wrong While Registering The User");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req.body --> data
  //username or email and password
  // check if fields are empty
  //check if username  exist --> Check password
  // if exist give a access token and refresh token
  // send cookie

  const { username, email, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if(!user) throw new ApiError(404 , "User doesn't exist")
  console.log(user) ; 

  const isPasswordValid = await user.isPasswordCorrect(password)
  
  if(!isPasswordValid)  throw new ApiError(401 , "Password Incorrect")

   const {accessToken,refreshToken}=  await generateAccessAndRefreshTokens(user._id)

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
   const options = { 
    httpOnly :true , 
    secure : true
   }
   return res
   .status(200)
   .cookie("accessToken" ,accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
    new ApiResponse(200,{
user  : loggedInUser,accessToken,refreshToken
    },"User Logged In Successfully")  
   )
});


const logoutUser = asyncHandler(async (req, res)=> { 
await User.findByIdAndUpdate(req.user._id , {
  $set: { 
    refreshToken: undefined
  }
},{ 
    new : true
  })
 const options = { 
    httpOnly :true , 
    secure : true
   }
   return res
   .status(200)
   .clearCookie("accessToken")
   .clearCookie("refreshToken")
   .json( new ApiResponse(200 , {}  , "user logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res)=> { 
try {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  
  if(!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request")
  }
  const decodedToken = verifyJWT(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  const user = User.findById(decodedToken?._id)
  
  if(!user) {
    throw new ApiError(401, "Invalid refresh token")
  }
  if(incomingRefreshToken !== user?.refreshToken ){
    throw new ApiError(401 , "Refresh Token Is Expired Or Used ")
  }
  const options = { 
    secure : true , 
    httpOnly : true 
  }
  const {accessToken, newRefreshToken}  = await generateAccessAndRefreshTokens(user._id)
  return res
    .status(200) 
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(200 , { accessToken, refreshToken : newRefreshToken}, "Access Token Refreshed")
    )
} catch (error) {
  throw new ApiError(401 , error?.message || "Invalid Refresh Token")
}
})


export  {registerUser,loginUser,logoutUser,refreshAccessToken};
