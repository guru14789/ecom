import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';

const s3 = new S3Client({
  region: 'auto',
  endpoint: env.CF_R2_ENDPOINT,
  credentials: {
    accessKeyId: env.CF_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CF_R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = env.CF_R2_BUCKET_NAME;
const CDN_URL = env.CF_R2_PUBLIC_URL; // e.g. https://cdn.shopsyy.com

/**
 * Generate a presigned PUT URL for direct browser-to-R2 upload.
 * The frontend uploads directly to this URL, then stores the publicUrl.
 */
export async function generateUploadUrl(
  filename: string,
  contentType: string,
  folder: 'products' | 'vendors' | 'users' | 'banners' | 'categories'
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const ext = filename.split('.').pop() || 'bin';
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
  const publicUrl = `${CDN_URL}/${key}`;

  return { uploadUrl, publicUrl, key };
}

/**
 * Delete an object from R2 by its key (extracted from publicUrl).
 */
export async function deleteFile(keyOrUrl: string): Promise<void> {
  const key = keyOrUrl.startsWith(CDN_URL)
    ? keyOrUrl.replace(`${CDN_URL}/`, '')
    : keyOrUrl;

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * Build a Cloudflare Image Resizing URL for a stored object.
 * Requires Cloudflare Image Resizing enabled on the zone.
 */
export function getImageUrl(
  key: string,
  variant: 'thumbnail' | 'product' | 'banner' | 'avatar' = 'product'
): string {
  const variants: Record<string, string> = {
    thumbnail: 'w=200,h=200,fit=cover,format=webp',
    product: 'w=800,h=800,fit=contain,format=webp',
    banner: 'w=1200,h=400,fit=cover,format=webp',
    avatar: 'w=150,h=150,fit=cover,format=webp',
  };
  const base = key.startsWith('http') ? key : `${CDN_URL}/${key}`;
  return `${base}?${variants[variant]}`;
}
