import { Router } from 'express';
import { env } from '../../config/env';

const router = Router();

router.get('/cloudflare-url', async (req, res) => {
  try {
    const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_IMAGES_API_TOKEN, CLOUDFLARE_IMAGE_HASH } = env;

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_IMAGES_API_TOKEN) {
      return res.status(500).json({ error: 'Cloudflare Images not configured' });
    }

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_IMAGES_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudflare Direct Upload Error:', errorText);
      return res.status(500).json({ error: 'Failed to generate Cloudflare upload URL' });
    }

    const data: any = await response.json();
    
    return res.json({
      uploadUrl: data.result.uploadURL,
      imageId: data.result.id,
      hash: CLOUDFLARE_IMAGE_HASH
    });
  } catch (error) {
    console.error('Cloudflare Upload URL Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
