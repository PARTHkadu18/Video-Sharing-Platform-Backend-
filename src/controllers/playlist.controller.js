import mongoose,{isValidObjectId} from "mongoose";
import { Playlist } from "../models/playlist.model";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async(req,res)=>{
    const {name, description} = req.body;
    const userId = req.user._id
    if(!name){
        throw new ApiError(400,"Name of playlist is required")
    }
    if(!description){
        throw new ApiError(400,"Description is required")
    }
    const playlist = await Playlist.create({
        name,
        description,
        owner:userId,
        videos:[]
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Playlist created  successfully"
            )
        )
})

const deletePlaylist = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params
    const userId = req.user._id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(401,"Invalid playlistId")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }
    if(!playlist.owner.equals(userId)){
        throw new ApiError(403,"You are not authorized to delete this playlist")
    }
    await Playlist.findByIdAndDelete(playlistId)
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Playlist deleted successfully"
            )
        )
})

const addVideoToPlaylist = asyncHandler(async(req,res)=>{
    const {playlistId, videoId} = req.params
    const userId = req.user._id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(403,"Invalid playlist Id")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(403,"Invalid video Id")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400,"Playlist not exist")
    }
    if(!playlist.owner.equals(userId)){
        throw new ApiError(403,"You are not authorized to modify playlist")
    }


    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet:{videos:videoId} // ensures uniqueness
        },
        {
            new:true
        }
    )
    if(!updatedPlaylist){
        throw new ApiError(404,"Playlist not found")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Video added successfully"
            )
        )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const userId = req.user._id
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist id")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"Playlist not exist")
    }
    if(!playlist.owner.equals(userId)){
        throw new ApiError(403,"You are not authorized to modify playlist")
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{videos:videoId} // removes video if exist
        },
        {
            new:true
        }
    )
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Video removed successfully"
            )
        )

})

const updatePlaylist = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params
    const {name, description} = req.body
    const userId = req.user._id

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"Playlist doesn't exists")
    }
    if(!playlist.owner.equals(userId)){
        throw new ApiError(403,"You are not authorized to modify playlist")
    }
    const updateFields={}
    if(name){
        updateFields.name=name
    }
    if(description){
        updateFields.description=description
    }
    if(Object.keys(updateFields).length===0){
        throw new ApiError(400,"No valid fields provided for update")
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:updateFields
        },
        {
            new:true
        }
    )
    if(!updatedPlaylist){
        throw new ApiError(404,"Playlist not found")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Playlist updated successfully"
            )
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist id")
    }
    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(String(playlistId))
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos",
                pipeline:[
                    {
                        $project:{
                            videoFile:1,
                            thumbnail:1,
                            title:1,
                            description:1,
                            duration:1,
                            views:1,
                            owner:1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"ownerDetails",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            email:1,
                            avatar:1,
                            coverImage:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$ownerDetails"
        }
    ])
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Playlist fetched successfully"
            )
        )
})

const getUserPlaylists = asyncHandler(async(req,res)=>{
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid user id")
    }
    const playlist = await Playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(String(userId))
            }
        }
    ])
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Playlists"
            )
        )
})

export {
    createPlaylist, getUserPlaylists,
    getPlaylistById, addVideoToPlaylist,
    removeVideoFromPlaylist, deletePlaylist,
    updatePlaylist
}