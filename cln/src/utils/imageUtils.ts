import { savePersistedLogo } from './logoStorage';
import { uploadService } from '../services/uploadService';

/**
 * Compresses an image file client-side to max 128x128 WebP/PNG (~4-8KB)
 * Optimal for avatar/logo badges while minimizing storage size.
 */
export async function compressImage(file: File, maxSize: number = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first, fallback to png
        try {
          const webpData = canvas.toDataURL('image/webp', 0.85);
          if (webpData && webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {}

        resolve(canvas.toDataURL('image/png'));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a data URL to a Blob for Storage upload
 */
function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string } {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const ext = mime.includes('webp') ? 'webp' : mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png';
  return { blob: new Blob([u8arr], { type: mime }), ext };
}

/**
 * Uploads an image to Supabase Storage 'team-logos' bucket if available,
 * otherwise returns compressed base64 data URL.
 * Also persists the logo locally so it NEVER gets lost.
 */
export async function uploadTeamLogo(
  fileOrDataUrl: File | string,
  teamId: string,
  tournamentId: string = 'sci_cup_main'
): Promise<string> {
  let compressedDataUrl = '';

  if (typeof fileOrDataUrl === 'string') {
    if (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://')) {
      savePersistedLogo(teamId, fileOrDataUrl);
      return fileOrDataUrl;
    }
    compressedDataUrl = fileOrDataUrl;
  } else {
    try {
      compressedDataUrl = await compressImage(fileOrDataUrl, 128);
    } catch {
      // Fallback direct reader
      compressedDataUrl = await new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.readAsDataURL(fileOrDataUrl);
      });
    }
  }

  // Persist locally immediately for offline responsiveness
  savePersistedLogo(teamId, compressedDataUrl);

  // Upload through Centralized Backend API
  try {
    const uploadedUrl = await uploadService.uploadTeamLogo(tournamentId, teamId, compressedDataUrl);
    if (uploadedUrl && (uploadedUrl.startsWith('http://') || uploadedUrl.startsWith('https://'))) {
      savePersistedLogo(teamId, uploadedUrl);
      return uploadedUrl;
    }
  } catch (err) {
    console.warn('[uploadTeamLogo] Backend image upload failed, falling back to local base64:', err);
  }

  // Fallback to compressed base64 (which is tiny and safe)
  return compressedDataUrl;
}
