import admin from '../lib/firestore/client';

/**
 * Generate a presigned PUT URL for direct browser-to-Storage upload.
 */
export async function generateUploadUrl(
  filename: string,
  contentType: string,
  folder: string
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const bucket = admin.storage().bucket();
  const ext = filename.split('.').pop() || 'bin';
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const file = bucket.file(key);

  const [uploadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 mins
    contentType,
  });

  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(key)}?alt=media`;

  return { uploadUrl, publicUrl, key };
}

/**
 * Delete an object from Storage by its key.
 */
export async function deleteFile(keyOrUrl: string): Promise<void> {
  const bucket = admin.storage().bucket();
  
  let key = keyOrUrl;
  if (keyOrUrl.startsWith('http')) {
    // Extract key from standard Firebase URL
    try {
      const url = new URL(keyOrUrl);
      const pathParts = url.pathname.split('/o/');
      if (pathParts.length > 1) {
        key = decodeURIComponent(pathParts[1].split('?')[0]);
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }

  await bucket.file(key).delete().catch(() => {});
}

/**
 * Build a resizing URL (not supported natively by standard Firebase Storage without extensions, so we just return the original).
 */
export function getImageUrl(
  key: string,
  variant: 'thumbnail' | 'product' | 'banner' | 'avatar' = 'product'
): string {
  const bucketName = admin.storage().bucket().name;
  return key.startsWith('http') 
    ? key 
    : `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(key)}?alt=media`;
}
