import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { Request, Response, NextFunction } from "express";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const uniqueId = uuidv4();
        return {
            folder: "products",
            resource_type: file.mimetype.startsWith("video") ? "video" : "image",
            public_id: `${Date.now()}-${uniqueId}`,
        }
    },
});

export const uploadCloud = multer({ storage });

const storageFormData = multer.memoryStorage();
export const parseFormData = multer({storage: storageFormData})