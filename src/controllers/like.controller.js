import mongoose,{isValidObjectId} from "mongoose";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Like } from "../models/like.model.js";

const toggleVideoLike = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const userId = req.user._id
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }
    const existingLike = await Like.findOne(
        {
            video:videoId,
            likedBy:userId
        }
    )
    if(!existingLike){
        const newLike = await Like.create(
            {
                video:videoId,
                likedBy:userId,
            }
        )
        if(!newLike){
            throw new ApiError(400,"Cannot like a video")
        }
        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    newLike,
                    "Video liked"
                )
            )
    }
    else{
        const deleteLike = await Like.findByIdAndDelete(existingLike._id)
        if(!deleteLike){
            throw new ApiError(400,"Cannot dislike a video")
        }
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    null,
                    "Video disliked"
                )
            )
    }
})

const toggleCommentLike = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    const userId = req.user._id
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid comment id")
    }
    const existingLike = await Like.findOne(
        {
            comment:commentId,
            likedBy:userId
        }
    )
    if(!existingLike){
        const newLike = await Like.create(
            {
                comment:commentId,
                likedBy:userId
            }
        )
        if(!newLike){
            throw new ApiError(400,"Cannot like a comment")
        }
        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    newLike,
                    "Comment liked"
                )
            )
    }
    else{
        const deleteLike = await Like.findByIdAndDelete(existingLike._id)
        if(!deleteLike){
            throw new ApiError(400,"Cannot dislike a comment")
        }
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    null,
                    "Comment disliked"
                )
            )
    }
})

const toggleTweetLike = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
    const userId = req.user._id
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweet id")
    }
    const existingLike = await Like.findOne(
        {
            tweet:tweetId,
            likedBy:userId
        }
    )
    if(!existingLike){
        const newLike = await Like.create(
            {
                tweet:tweetId,
                likedBy:userId
            }
        )
        if(!newLike){
            throw new ApiError(400,"Cannot like a tweet")
        }
        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    newLike,
                    "Tweet liked"
                )
            )
    }
    else{
        const deleteLike = await Like.findByIdAndDelete(existingLike._id)
        if(!deleteLike){
            throw new ApiError(400,"Cannot dislike a tweet")
        }
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    null,
                    "Tweet disliked"
                )
            )
    }
})

const getLikedVideos = asyncHandler(async(req,res)=>{
    const userId = req.user._id
    const likedVideos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(String(userId)),
                video:{
                    $ne:null
                }
            },
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videoDetails",
            }
        },
        {
            $unwind:"$videoDetails"
        },
        {
            $replaceRoot:{
                newRoot:"$videoDetails"
            }
        }
    ])
    return res
        .status(200)
        .json(
        new ApiResponse(
            200,
            likedVideos, 
            "Liked videos fetched successfully")
    );
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}