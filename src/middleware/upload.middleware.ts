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

export const uploadFeedback = async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as Express.Multer.File[] || [];

    if (files.length == 0) {
        return next();
    }

    try {
        const mediaMap: Record<string, { type: number; url: string; publicId: string }[]> = {};
        const uploadToCloudinary = (fileBuffer: Buffer, folder: string, publicId: string, type: "video" | "image") => {
            return new Promise<any>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {folder: folder, public_id: publicId, resource_type: type},
                    (error, result) => {
                        if (error) {
                            reject(error)
                        } else {
                            resolve(result)
                        }
                    }
                );
                stream.end(fileBuffer);
            });
        };
        await Promise.all(
            files.map(async (file) => {
                const fileBuffer = (file as any).buffer;
                const folder = "FeedbackTmp";
                const uniqueId = uuidv4();
                const newName = `${Date.now()}-${uniqueId}`
                const result = await uploadToCloudinary(fileBuffer as Buffer, folder, newName, file.mimetype.startsWith("video") ? "video" : "image");

                const type = file.mimetype.startsWith("video") ? 2 : 1;

                if (!mediaMap[file.fieldname]) {
                    mediaMap[file.fieldname] = [];
                }

                mediaMap[file.fieldname].push({
                    type,
                    url: result.secure_url,
                    publicId: result.public_id
                });
            })
        );
        req.body.mediaMap = mediaMap;
        next();
    } catch (e) {
        console.error(e);
        return res.status(500).json({error: "Upload thất bại"});
    }
};

const storageFormData = multer.memoryStorage();
export const parseFormData = multer({storage: storageFormData})