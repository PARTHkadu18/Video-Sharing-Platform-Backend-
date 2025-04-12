import mongoose,{isValidObjectId} from "mongoose";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Tweet} from "../models/tweet.model.js"

const createTweet = asyncHandler(async(req,res)=>{
    const {content} = req.body
    const userId = req.user._id
    if(!content || !content.trim()){
        throw new ApiError(400,"Write something")
    }
    const addTweet = await Tweet.create(
        {
            content,
            owner:userId
        }
    )
    if(!addTweet){
        throw new ApiError(400,"Cannot create tweet")
    }
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                addTweet,
                "Tweet created successfully"
            )
        )
})

const updateTweet = asyncHandler(async(req,res)=>{
    const {content} = req.body
    const {tweetId} = req.params
    const userId = req.user._id

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(400,"Cannot find tweet")
    }
    if(!tweet.owner.equals(userId)){
        throw new ApiError(403,"You are not authorized to update tweet")
    }
    if(!content || !content.trim()){
        throw new ApiError(400,"Write something")
    }
    
    const newTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content
        },
        {
            new:true
        }
    )

    if(!newTweet){
        throw new ApiError(400,"Cannot update tweet")
    }
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                newTweet,
                "Tweet updated successfully"
            )
        )
})

const deleteTweet = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
    const userId = req.user._id

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(400,"Cannot find tweet")
    }
    if(!tweet.owner.equals(userId)){
        throw new ApiError(403,"You are not authorized to delete tweet")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)
    if(!deletedTweet){
        throw new ApiError(400,"Cannot delete tweet")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Tweet deleted successfully"
            )
        )
})

const getUserTweets = asyncHandler(async(req,res)=>{
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid user id")
    }
    const tweets = await Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(String(userId))
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$owner"
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweets,
                "Tweet fetched successfully"
            )
        )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}