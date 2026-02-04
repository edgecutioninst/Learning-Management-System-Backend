import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

dotenv.config({})

//check and load env vars

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


//upload media to cloudinary
export const uploadMedia = async (file) => {
    try {
        const uploadResponse = await cloudinary.uploader.upload(file, {
            resource_type: 'auto'
        })

        return uploadResponse
    } catch (error) {
        console.error("cloudinary error uploading media... ", error)
    }
}

export const deleteMediaFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId)
    } catch (error) {
        console.error("cloudinary error deleting MEDIA from cloudinary... ", error)
    }
}

export const deleteVideoFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: 'video'
        })
    } catch (error) {
        console.error("cloudinary error deleting MEDIA from cloudinary... ", error)
    }
}

