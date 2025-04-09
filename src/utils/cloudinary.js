import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import { ApiError } from "./ApiError.js";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async(localFilePath)=>{
    try {
        if(!localFilePath)return null
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        console.log("File uploaded on cloudinary: ", response);
        fs.unlinkSync(localFilePath) 
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file as uploading fails
    }   
}
const deleteOnCloudinary = async(public_id)=>{
    try {
        if(!public_id)return null
        const response=await cloudinary.uploader.destroy(public_id)
        console.log("File deleted from cloudinary: ", response);
        return response;
    } catch (error) {
        throw new ApiError(500, "Can't delete file from cloudinary") //remove the locally saved temporary file as uploading fails
    }  
}

export {uploadOnCloudinary,deleteOnCloudinary}