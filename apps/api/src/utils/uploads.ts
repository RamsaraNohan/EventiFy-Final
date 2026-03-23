import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { env } from '../config/env';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

/**
 * Returns a configured multer instance for a specific Cloudinary folder.
 * @param folder The folder name in Cloudinary (e.g., 'avatars', 'portfolios', 'tasks')
 */
export const getCloudinaryUpload = (folder: string) => {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `eventify/${folder}`,
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'pdf'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    } as any,
  });

  return multer({
    storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit for cloud uploads
    },
  });
};

// Default upload for backward compatibility (maps to 'general')
export const upload = getCloudinaryUpload('general');
