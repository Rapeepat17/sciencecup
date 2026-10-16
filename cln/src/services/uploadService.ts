import { apiClient } from './apiClient';
import { compressImage } from '../utils/imageUtils';

export interface UploadLogoResult {
  url: string;
  path?: string;
  teamId?: string;
  isFallback?: boolean;
}

export const uploadService = {
  async uploadTeamLogo(tournamentId: string, teamId: string, fileOrDataUrl: File | string): Promise<string> {
    let base64String = '';

    if (typeof fileOrDataUrl === 'string') {
      if (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://')) {
        return fileOrDataUrl;
      }
      base64String = fileOrDataUrl;
    } else {
      try {
        base64String = await compressImage(fileOrDataUrl, 128);
      } catch {
        base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileOrDataUrl);
        });
      }
    }

    try {
      const res = await apiClient.post<{ url: string; path: string; isFallback: boolean }>(
        `/api/v1/tournaments/${tournamentId}/images/upload`,
        {
          imageBase64: base64String,
          teamId,
        }
      );
      return res.url || base64String;
    } catch (err) {
      console.warn('[uploadService] Backend upload failed, using compressed base64 fallback:', err);
      return base64String;
    }
  },

  async deleteTeamLogo(tournamentId: string, teamId: string): Promise<void> {
    await apiClient.delete(`/api/v1/tournaments/${tournamentId}/images?teamId=${encodeURIComponent(teamId)}`);
  },

  async migrateLogos(tournamentId: string): Promise<any> {
    return apiClient.post(`/api/v1/tournaments/${tournamentId}/images/migrate`, {});
  },
};
