import crypto from "crypto";

interface SignedUrlParams {
  videoId: string;
  libraryId?: string;
  tokenKey?: string;
  expiresInHours?: number;
}

export function generateSignedVideoUrl({
  videoId,
  libraryId = process.env.BUNNY_STREAM_LIBRARY_ID || "",
  tokenKey = process.env.BUNNY_TOKEN_AUTH_KEY || "",
  expiresInHours = 6,
}: SignedUrlParams): string {
  if (!tokenKey || !libraryId) {
    // Fallback to unsigned URL if not configured
    return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
  }

  const expires = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const hashableBase = `${tokenKey}${videoId}${expires}`;
  const token = crypto
    .createHash("sha256")
    .update(hashableBase)
    .digest("hex");

  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}`;
}
