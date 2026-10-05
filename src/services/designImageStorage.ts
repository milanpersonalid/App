import { requireSupabase } from '../lib/supabase';

export const DESIGN_PHOTOS_BUCKET = 'design-photos';
export const DESIGN_PHOTO_URL_TTL_SECONDS = 7 * 24 * 60 * 60;

const signedPhotoUrlCache = new Map<string, { url: string; expiresAt: number }>();
const pendingSignedPhotoUrls = new Map<string, Promise<string>>();
const SIGNED_PHOTO_CACHE_MS = (DESIGN_PHOTO_URL_TTL_SECONDS - 24 * 60 * 60) * 1000;

export async function compressDesignImage(source: Blob): Promise<Blob> {
  // App-generated sample artwork is already a tiny SVG. Keep it as-is.
  if (source.type === 'image/svg+xml') return source;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source);
  } catch {
    throw new Error('Could not read this image. Please choose a valid image file.');
  }

  try {
    const maxDimension = 1280;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not prepare the image for upload.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (compressed) => compressed
          ? resolve(compressed)
          : reject(new Error('Could not compress this image. Please try another file.')),
        'image/webp',
        0.82
      );
    });
  } finally {
    bitmap.close();
  }
}

export async function uploadDesignPhoto(designId: string, image: Blob): Promise<string> {
  const extension = image.type === 'image/svg+xml' ? 'svg' : image.type === 'image/png' ? 'png' : 'webp';
  const path = `${designId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await requireSupabase()
    .storage
    .from(DESIGN_PHOTOS_BUCKET)
    .upload(path, image, {
      cacheControl: '31536000',
      contentType: image.type || 'image/webp',
      upsert: false,
    });

  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return path;
}

export async function deleteDesignPhoto(path: string): Promise<void> {
  const { error } = await requireSupabase()
    .storage
    .from(DESIGN_PHOTOS_BUCKET)
    .remove([path]);
  if (error) throw new Error(`Image cleanup failed: ${error.message}`);
  signedPhotoUrlCache.delete(path);
}

export async function getDesignPhotoUrl(path: string): Promise<string> {
  const cached = signedPhotoUrlCache.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const pending = pendingSignedPhotoUrls.get(path);
  if (pending) return pending;

  const request = (async () => {
    const { data, error } = await requireSupabase()
      .storage
      .from(DESIGN_PHOTOS_BUCKET)
      .createSignedUrl(path, DESIGN_PHOTO_URL_TTL_SECONDS);
    if (error) throw new Error(`Could not load design image: ${error.message}`);
    signedPhotoUrlCache.set(path, {
      url: data.signedUrl,
      expiresAt: Date.now() + SIGNED_PHOTO_CACHE_MS,
    });
    return data.signedUrl;
  })();

  pendingSignedPhotoUrls.set(path, request);
  try {
    return await request;
  } finally {
    pendingSignedPhotoUrls.delete(path);
  }
}

/** Fetch an existing private design image through Supabase for legacy photo matching. */
export async function downloadDesignPhoto(path: string): Promise<Blob> {
  const { data, error } = await requireSupabase()
    .storage
    .from(DESIGN_PHOTOS_BUCKET)
    .download(path);
  if (error) throw new Error(`Could not read design image for photo search: ${error.message}`);
  return data;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [metadata, encoded] = dataUrl.split(',', 2);
  if (!metadata || encoded === undefined) throw new Error('The sample design image is invalid.');
  const mimeType = metadata.match(/^data:([^;]+)/)?.[1] || 'application/octet-stream';
  const decoded = atob(encoded);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i += 1) bytes[i] = decoded.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}
