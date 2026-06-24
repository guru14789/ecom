import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(
  filePath: string,
  options?: { folder?: string; public_id?: string; transformation?: object }
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: options?.folder || 'shopsyy',
    public_id: options?.public_id,
    transformation: options?.transformation,
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export async function getImageUrl(publicId: string, options?: { width?: number; height?: number; crop?: string }): Promise<string> {
  return cloudinary.url(publicId, {
    secure: true,
    width: options?.width,
    height: options?.height,
    crop: options?.crop || 'fill',
  });
}

export default cloudinary;
