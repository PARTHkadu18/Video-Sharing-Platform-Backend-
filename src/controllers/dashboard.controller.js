import mongoose,{isValidObjectId} from "mongoose";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";

const getChannelStats = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    const stats = {}
    stats.totalVideos = await Video.countDocuments({owner:userId})
    stats.totalSubscribers = await Subscription.countDocuments({channel:userId})
    const getViews = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(String(userId))
            }
        },
        {
            $group:{
                _id:null,
                totalViews:{$sum:"$views"}
            }
        },
        {
            $project:{
                totalViews:1
            }
        }
    ])
    stats.totalViews = getViews.length>0?getViews[0].totalViews : 0
    const getTotalLikes = await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(String(userId))
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },
        {
            $project:{
                likesCount:{$size:"$likes"}
            }
        },
        {
            $group:{
                _id:null,
                totalLikes:{$sum: "$likesCount"}
            }
        },
        {
            $project:{
                _id:0,
                totalLikes:1
            }
        }
        
    ])
    stats.totalLikes = getTotalLikes.length>0?getTotalLikes[0].totalLikes : 0

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                stats, 
                "Channel stats fetched successfully")
      );
})

const getChannelVideos = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    const allVideos = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(String(userId))
            }
        },
        {
            $project:{
                videoFile:1,
                thumbnail:1,
                title:1,
                description:1,
                duration:1,
                views:1,
                isPublished:1
            }
        }
    ])
    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                allVideos, 
                "Videos fetched successfully")
    );
})

export {getChannelStats, getChannelVideos}