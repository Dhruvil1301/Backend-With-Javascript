import{asyncHandler} from"../utils/asyncaHandler.js";
import {ApiError} from "../utils/apiError.js"
import User from '../models/user.model.js'
import { uploadCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import Jwt  from "jsonwebtoken";
const registerUser=asyncHandler(async(req,res)=>{
    //get user details from frontend
    //validation -not empty
    //check if user already exist:username,email
    //check for image,check for avatar
    //upload them to cloudinary,avatar
    //create user object-create entry ihn db
    //remove password and refresh token field from response
    //check for user creation
    //return response

    const {fullname,email,username,password}=req.body
    console.log("email:",email) 
 //get user details from frontend


    if(
        [fullname,email,username,password].some((field)=>field?.trim()==="")  //validation -not empty
    ){
      throw new ApiError(400,"All fields are required")
    }


   const existedUser= await User.findOne(
    {                                       
    $or:[{username},{email}]            //check if user already exist:username,email
})
if(existedUser){
    throw new ApiError(409,"User already exist")
}


const coverImageLocalPath=req.files?.coverImage[0]?.path;


const coverImage=await uploadCloudinary(coverImageLocalPath)

const user=await User.create({
    fullname,
    coverImage:coverImage?.url ||"",         //create user object-create entry ihn db
    email,
    password,
    username:username.toLowerCase()
})


const createdUser=await User.findById(user._id).select(  //remove password and refresh token field from response
    "-password -refreshToken"
)


if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user")   //check for user creation
}

return res.status(201).json(new ApiResponse(200, createdUser, "User Registered Successfully"))
//return response
})
//Login
const generateAccessAndRefereshToken=async(userId)=>{
    try{
     const user=await User.findById(userId)
     const accessToken=user.generateAccessToken()
     const refreshToken=user.generateRefreshToken()
     user.refreshToken=refreshToken
    await user.save({validateBeforeSave:false})

    return {accessToken,refreshToken}
    }
    catch(error){
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}
const loginUser=asyncHandler(async(req,res)=>{
    //req body ->data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie
    const {email,username,password}=req.body
    if(!(username||email)){
        throw new ApiError(400,"usermane or email is required")
    }
    const user= await User.findOne({
        $or:[
            {username},{email}
        ]
    })
    if(!user){
        throw new ApiError(404,"User does not exist")
    }
    const isPasswordValid=await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid Password crendential")
    }
   const {accessToken,refreshToken}= await generateAccessAndRefereshToken(user._id)
   const loggedInUser = await User.findById(user._id).select("-password -refreshToken"); // Move select inside findById
   const options = {
       httpOnly: true,
       secure: true
   }
  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options).json(
    new ApiResponse(
       200,
       {
        user:loggedInUser,accessToken,refreshToken
       } ,
       "User logged In Successfully"
    )
  )
})
const logoutUser=asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate(
        req.user._id,{
            $set:{
                refreshToken:undefined
            }
        },
            {
                new:true
            }
    )

  const options={
    httpOnly:true,
    secure:true
  }
  return res.status(200).clearCookie("accessToken",options)
  .clearCookie("refreshToken",options).json(new ApiResponse(200,{},"User Logged Out"))
})
const refreshAccessToken=asyncHandler(async(req,res)=>{
   const incomingRefreshToken= req.cookies.refreshToken||req.body.refreshToken
   if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request")
   }
  try {
    const decodedToken= jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
     )
    const user= await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError(401,"Invaild refersh token")
    }
    if(incomingRefreshToken!==user?.refreshToken){
      throw new ApiError(401,"Refresh token is used or expired ")
    }
    const options={
      httpOnly:true,
      secure:true
    }
   const {accessToken,refreshToken}= await generateAccessAndRefereshToken(user._id)
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(
          200,
          {
              accessToken,refreshToken:newRefreshToken
          },
          "Access token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401,errro?.message||"Invalid refresh token")
  }
})
export{
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}