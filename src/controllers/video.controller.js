import { asyncHandler } from "../utils/asyncHandler";
import {ApiError} from "../utils/ApiError.js"
import {Video} from "../models/video.model.js"
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const getAllVideos = asyncHandler(async(req,res)=>{
    
    // query- Used to filter results based on user input. query=JavaScript → Fetches videos with "JavaScript" in title or description.
    // sortBy- Sort result by. eg:- views, creation date
    // sortType- ascending or descending
    // userId- fetch video uploaded by userId
    try {
        const {page="1", limit="10", query, sortBy="createdAt", sortType="desc", userId} = req.query 
        
        const matchFilter={}
        if(userId){
            matchFilter.owner=userId
        }
        if(query){
            matchFilter.title={ $regex: query, $options: "i" }// regex allows partial matching and options make case insensitive;
        }
    
        const allVideos= await Video.aggregate([
            {
                $match:matchFilter
            },
            {
                $sort:{
                    [sortBy]:sortType==="desc"?-1:1
                }
            },
            {
                $skip:(Number(page)-1)*(Number(limit))
            },
            {
                $limit:Number(limit)
            }
        ])
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                allVideos,
                "All videos fetched successfully"
            )
        )
    
    } catch (error) {
        throw new ApiError(500, "Error fetching videos")
    }
})

const publishAVideo = asyncHandler(async(req,res)=>{
    const {title, description} = req.body;
    const owner = req.user?._id;

    if(!title){
        throw new ApiError(400,"Title is required")
    }
    if(!description){
        throw new ApiError(400,"description is required")
    }
    if(!owner){
        throw new ApiError(400,"Unauthorized: Owner ID is missing")
    }
    let videoLocalPath;
    let thumbnailLocalPath;

    if(req.files && Array.isArray(req.files.videoFile) &&req.files.videoFile.length>0){
        videoLocalPath=req.files.videoFile[0].path
    }
    if(req.files && Array.isArray(req.files.thumbnail) &&req.files.thumbnail.length>0){
        thumbnailLocalPath=req.files.thumbnail[0].path
    }
    if(!videoLocalPath){
        throw new ApiError(400,"Video file is required")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail file is required")
    }
    const videoCloud = await uploadOnCloudinary(videoLocalPath);
    const thumbnaiCloud = await uploadOnCloudinary(thumbnailLocalPath);

    if(!videoCloud){
        throw new ApiError(500,"Error while uploading a video")
    }
    if(!thumbnaiCloud){
        throw new ApiError(500,"Error while uploading a thumbnail")
    }

    const createVideoFile = await Video.create({
        title,
        description,
        videoFile:videoCloud.url,
        thumbnail:thumbnaiCloud.url,
        video_public_id:videoCloud.public_id,
        thumbnail_public_id:thumbnaiCloud.public_id,
        duration:videoCloud.duration,
    })
    if(!createVideoFile){
        throw new ApiError(500,"Something went wrong while uploading a video");
    }
    return res
        .status(200)
        .json(new ApiResponse(200,createVideoFile,"Video uploaded successfully"));
})

const getVideoById = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(400, "Invalid video id");
    }
    const video = await Video.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(String(videoId))
            }
        },
        {
            $set:{
                views:{
                        $add:["$views",1]
                    }
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },
        { $unwind: "$owner" } // Optional: Convert owner array into an object
    ])
    if(!video.length){
        throw new ApiError(404,"Video not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200,video[0],"Video fetched Successfully"));
})

const updateVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const {title,description} = req.body
    const videoF = await Video.findById(videoId)
    if(!videoF){
        throw new ApiError(501,"Video not found")
    }

    if(!title){
        throw new ApiError(402, "Title is Required")
    }
    if(!description){
        throw new ApiError(402, "Description is Required")
    }
    let updatedData={title, description}
    let thumbnailLocalPath;
    if(req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length>0){
        thumbnailLocalPath=req.files.thumbnail[0].path
        await deleteOnCloudinary(videoF.thumbnail_public_id)
        const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if(!newThumbnail){
            throw new ApiError(504,"Error while uploading thumbnail")
        }
        updatedData.thumbnail= newThumbnail.url
        updatedData.thumbnail_public_id= newThumbnail.public_id

    }
    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:updatedData
        },
        {
            new:true
        }
    )
    return res
        .status(200)
        .json(
            new ApiResponse(200,video,"Video updated successfully")
        )
})

const deleteVideo = asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    if(!videoId){
        throw new ApiError(400,"Invalid video id")
    }
    const video = Video.findById(videoId)
    if(!video){
        throw new ApiError(505,"Video not found")
    }
    await deleteOnCloudinary(video.video_public_id);
    await deleteOnCloudinary(video.thumbnail_public_id);
    await Video.findByIdAndDelete(videoId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Video deleted successfully"
            )
        )
    })

const togglePublishStatus = asyncHandler(async(req,res)=>{
    const { videoId } = req.params
    const video=Video.findById(videoId)
    const updateVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished:!video.isPublished
            }
        },
        {
            new: true
        }
    )
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updateVideo,
                "Toggle publish status successfully"
            )
        )
})

export {getAllVideos, publishAVideo,
        getVideoById, updateVideo,
        deleteVideo,togglePublishStatus
    }