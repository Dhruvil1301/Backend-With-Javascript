import{asyncHandler} from"../utils/asyncaHandler.js";
import {ApiError} from "../utils/apiError.js"
import{User} from "../models/user.model.js"
import { uploadCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/apiResponse.js";

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

    const {fullName,email,username,password}=req.body
    console.log("email:",email)  //get user details from frontend


    if(
        [fullName,email,username,password].some((field)=>field?.trim()==="")  //validation -not empty
    ){
      throw new ApiError(400,"All fields are required")
    }


   const existedUser=User.findOne(
    {                                       
    $or:[{username},{email}]            //check if user already exist:username,email
})
if(existedUser){
    throw new ApiError(409,"User already exist")
}


const avatarLocalPath=req.files?.avatar[0]?.path;
const coverImageLocalPath=req.files?.coverImage[0]?.path;
if(!avatarLocalPath){                                         //check for image,check for avatar
    throw new ApiError(400,"Avatar image is required")
}


const avatar=await uploadCloudinary(avatarLocalPath)
const coverImage=await uploadCloudinary(coverImageLocalPath)
if(!avatar){                                                      //upload them to cloudinary,avatar 
    throw new ApiError(400,"Avatar image is required")
}

const user=await User.create({
    fullName,
    avatar:avatar.url,
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

return res.status(201).json()
  new ApiResponse(200,createdUser,"User Registered Successfully")  //return response
})

export{
    registerUser
}