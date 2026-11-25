import { createHash } from 'node:crypto';

const TTL_SECONDS = 60 * 60;

/**
 * Signed Bunny Stream embed (4.5_Video): SHA-256(token key + video id + expires), 1 h (30.10.2026, was 4 h). Needs
 * BUNNY_STREAM_LIBRARY_ID + BUNNY_STREAM_TOKEN_KEY and a video id; otherwise null → the lesson
 * page shows the placeholder player. The key never reaches the browser.
 */
export function signedEmbedUrl(videoId: string | null): string | null {
  const library = process.env.BUNNY_STREAM_LIBRARY_ID;
  const key = process.env.BUNNY_STREAM_TOKEN_KEY;
  if (!videoId || !library || !key) return null;
  const expires = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const token = createHash('sha256')
    .update(`${key}${videoId}${expires}`)
    .digest('hex');
  return `https://iframe.mediadelivery.net/embed/${library}/${encodeURIComponent(videoId)}?token=${token}&expires=${expires}&responsive=true`;
}
