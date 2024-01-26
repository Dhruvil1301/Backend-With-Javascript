import mongoose,{Schema} from "mongoose";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema =new Schema(
    {
        videoFile:{
            type:String,//cloudnary url
            required:true
        },
        thumbNail:{
            type:String,//cloudnary url
            required:true
        },
        title:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        duration:{
            type:Number,
            required:true
        },
        views:{
            type:Number,
            required:true
        },
        isPublished:{
            type:true,
            required:true
        },
    },
    {
        timeStamps:true
    }
)
videoSchema.plugin(mongooseAggregatePaginate)

export const Video=mongoose.model("Video",videoSchema)