import mongoose,{isValidObjectId} from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async(req,res)=>{
    const {channelId}=req.params;
    const userId=req.user._id;

    if(!isValidObjectId(channelId)){
        throw new ApiError(404,"Can not find the channel")
    }    
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid user")
    }
    const doc= await Subscription.findOne({
        subscriber:userId,
        channel:channelId
    })

    if(doc){
        await Subscription.findByIdAndDelete(doc._id)
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Unsubscribed successfully"
                )
            )
    }
    else{
        await Subscription.create({
            subscriber:userId,
            channel:channelId
        }) 
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Subscribed successfully"
                )
            )
    }
})

const getUserChannelSubscribers = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
    const userId = req.user._id;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channel Id")
    }
    if(channelId!==userId){
        throw new ApiError(403,"You can not get channel subscriber list");
    }
    const subscriber = await Subscription.aggregate([
        {
            match:{
                channel:new mongoose.Types.ObjectId(String(channelId))
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriberDetails",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            email:1,
                            avatar:1,
                            fullName:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$subscriberDetails"
        }
        
    ]);
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscriber,
                "Subscriber details fetched successfully"
            )
        )
})
const getSubscribedChannels = asyncHandler(async(req,res)=>{
    const {subscriberId} = req.params;
    const userId = req.user._id;
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"Invalid subscriber Id")
    }
    if(subscriberId!==userId){
        throw new ApiError(400,"Can not access subscriber of other users");
    }
    const channel = await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(String(subscriberId))
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channelDetails",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            email:1,
                            avatar:1,
                            fullName:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$channelDetails"
        }
    ])
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel,
                "Channel details fetched successfully"
            )
        )
})
export {toggleSubscription,
        getUserChannelSubscribers,
        getSubscribedChannels
}