import mongoose,{isValidObjectId} from "mongoose";
import { Comment } from "../models/comment.model";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const {page=1, limit=10} = req.query
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id");
    }

    const comments = await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(String(videoId))
            }
        },
        {
            $skip:(Number(page)-1)*(Number(limit))
        },
        {
            $limit:Number(limit)
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
                comments,
                "Comments fetched successfully"
            )
        )
})

const addComment = asyncHandler(async(req,res)=>{
    const {content} = req.body
    const {videoId} = req.params
    const owner = req.user._id
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
    if(!content.trim()){
        throw new ApiError(400, "Comment is empty")
    }
    const comment = await Comment.create(
        {
            content:content.trim(),
            video:new mongoose.Types.ObjectId(String(videoId)),
            owner:new mongoose.Types.ObjectId(String(owner))
        }
    )
    if(!comment){
        throw new ApiError(400,"Cannot add comment")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                comment,
                "Comment added successfully"
            )
        )
})

const updateComment = asyncHandler(async (req, res) => {
    const {content} = req.body
    const {commentId} = req.params
    const owner = req.user._id
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid video id")
    }
    if(!content.trim()){
        throw new ApiError(400, "Comment is empty")
    }

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(400,"Cannot find comment")
    }
    if(!comment?.owner.equals(owner)){ 
        throw new ApiError(400,"Cannot update comment")
    }
    const newComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content:content.trim()
        },
        {
            new:true
        }
    )
    if(!newComment){
        throw new ApiError(400,"Cannot update comment")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newComment,
                "Comment updated successfully"
            )
        )
})

const deleteComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    const owner = req.user._id
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id")
    }
    const comment = await Comment.findById(commentId)
    if(!comment.owner.equals(owner)){
        throw new ApiError(400,"Cannot delete comment")
    }
    const deletedComment = await Comment.findByIdAndDelete(commentId)
    if(!deletedComment){
        throw new ApiError(400,"Falied to delete comment")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Comment deleted successfully"
            )
        )
})

export {
    getVideoComments, addComment, 
    updateComment, deleteComment
    }