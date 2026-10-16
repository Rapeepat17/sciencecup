import { getSupabaseClient } from '../config/supabase.ts';
import { teamRepository } from '../repositories/team.repository.ts';
import { tournamentRepository } from '../repositories/tournament.repository.ts';
import { AppError } from '../middleware/errorHandler.ts';

export const BUCKET_NAME = 'team-logos';
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export type ImageCategory = 'teams' | 'tournaments' | 'general';

export interface DecodedImage {
  buffer: Buffer;
  contentType: string;
  extension: string;
  sizeBytes: number;
}

export interface UploadResult {
  url: string;
  path: string;
  teamId?: string;
  tournamentId: string;
  isFallback: boolean;
  sizeBytes: number;
}

export interface MigrationDetail {
  teamId: string;
  teamName: string;
  status: 'migrated' | 'failed' | 'skipped';
  reason?: string;
  oldSize?: number;
  newUrl?: string;
  storagePath?: string;
}

export interface MigrationReport {
  timestamp: string;
  totalScanned: number;
  migratedCount: number;
  failedCount: number;
  skippedCount: number;
  details: MigrationDetail[];
}

export class ImageService {
  /**
   * Validates MIME type and magic bytes of an image buffer
   */
  validateImageMagicBytes(buffer: Buffer, expectedContentType: string): boolean {
    if (!buffer || buffer.length < 4) return false;

    // PNG: 89 50 4E 47
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return expectedContentType.includes('png');
    }

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return expectedContentType.includes('jpeg') || expectedContentType.includes('jpg');
    }

    // WebP: RIFF (52 49 46 46) ... WEBP (57 45 42 50)
    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return expectedContentType.includes('webp');
    }

    // SVG: starts with XML or <svg
    const headerStr = buffer.subarray(0, 100).toString('utf8').trim().toLowerCase();
    if (headerStr.startsWith('<svg') || (headerStr.startsWith('<?xml') && headerStr.includes('<svg'))) {
      return expectedContentType.includes('svg');
    }

    return false;
  }

  /**
   * Decodes and strictly validates a Base64 data URL
   */
  decodeAndValidateBase64(dataUrl: string): DecodedImage {
    if (!dataUrl || typeof dataUrl !== 'string') {
      throw AppError.badRequest('Image data string is required');
    }

    const matches = dataUrl.match(/^data:([A-Za-z0-9\/\-+.]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw AppError.badRequest('Invalid base64 image data URL format. Must start with data:image/...;base64,');
    }

    const contentType = matches[1].toLowerCase();
    const base64Data = matches[2];

    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedMimeTypes.includes(contentType)) {
      throw AppError.badRequest(`Unsupported image type "${contentType}". Allowed: PNG, JPEG, WebP, SVG`);
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const sizeBytes = buffer.length;

    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      throw AppError.badRequest(`Image exceeds maximum allowed size of 5MB (size: ${(sizeBytes / 1024 / 1024).toFixed(2)}MB)`);
    }

    if (sizeBytes < 10) {
      throw AppError.badRequest('Image buffer is corrupt or empty');
    }

    // Verify magic bytes
    if (!this.validateImageMagicBytes(buffer, contentType)) {
      throw AppError.badRequest(`File content signature does not match claimed MIME type "${contentType}"`);
    }

    let extension = 'png';
    if (contentType.includes('webp')) extension = 'webp';
    else if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = 'jpg';
    else if (contentType.includes('svg')) extension = 'svg';

    return { buffer, contentType, extension, sizeBytes };
  }

  /**
   * Builds clean, isolated storage path: {tournamentId}/{category}/{safeEntityId}_{timestamp}.{ext}
   */
  buildStoragePath(
    tournamentId: string,
    category: ImageCategory,
    entityId: string,
    extension: string,
    customSuffix?: string
  ): string {
    const safeTourney = tournamentId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeCat = category.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeEntity = entityId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const suffix = customSuffix ?? String(Date.now());
    return `${safeTourney}/${safeCat}/${safeEntity}_${suffix}.${extension}`;
  }

  /**
   * Uploads decoded image to Supabase Storage with graceful fallback
   */
  async uploadToStorage(
    storagePath: string,
    buffer: Buffer,
    contentType: string,
    rawBase64Fallback: string
  ): Promise<{ url: string; path: string; isFallback: boolean }> {
    const supabase = getSupabaseClient();

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, buffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.warn(`[ImageService] Supabase storage upload warning (${uploadError.message}). Using fallback.`);
        return {
          url: rawBase64Fallback,
          path: '',
          isFallback: true,
        };
      }

      if (uploadData) {
        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
        return {
          url: urlData.publicUrl,
          path: storagePath,
          isFallback: false,
        };
      }

      return {
        url: rawBase64Fallback,
        path: '',
        isFallback: true,
      };
    } catch (err: any) {
      console.warn(`[ImageService] Unexpected error uploading to storage: ${err?.message}. Falling back.`);
      return {
        url: rawBase64Fallback,
        path: '',
        isFallback: true,
      };
    }
  }

  /**
   * Deletes a file from Supabase Storage safely
   */
  async deleteFromStorage(storagePath: string): Promise<boolean> {
    if (!storagePath) return false;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      if (error) {
        console.warn(`[ImageService] Could not remove storage file "${storagePath}": ${error.message}`);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn(`[ImageService] Exception removing storage file "${storagePath}": ${err?.message}`);
      return false;
    }
  }

  /**
   * Upload team logo and save to database with automatic rollback if DB save fails
   */
  async uploadAndSaveTeamLogo(
    tournamentId: string,
    teamId: string,
    imageBase64: string
  ): Promise<UploadResult> {
    // 1. Verify tournament exists
    const tournament = await tournamentRepository.findById(tournamentId);
    if (!tournament) {
      throw AppError.notFound(`Tournament "${tournamentId}" does not exist`);
    }

    // 2. Decode and validate image
    const { buffer, contentType, extension, sizeBytes } = this.decodeAndValidateBase64(imageBase64);
    const storagePath = this.buildStoragePath(tournamentId, 'teams', teamId, extension);

    // 3. Upload to Supabase Storage
    const { url, path, isFallback } = await this.uploadToStorage(
      storagePath,
      buffer,
      contentType,
      imageBase64
    );

    // 4. Update Database record with rollback protection
    try {
      const team = await teamRepository.findById(tournamentId, teamId);
      if (team) {
        // Try updating with logo and logo_path
        try {
          await teamRepository.update(tournamentId, teamId, {
            logo: url,
            ...((path ? { logo_path: path } : {}) as any),
          });
        } catch (dbErr: any) {
          // If logo_path column doesn't exist yet, retry with just logo
          if (dbErr?.code === '42703') {
            await teamRepository.update(tournamentId, teamId, { logo: url });
          } else {
            throw dbErr;
          }
        }
      }

      // Also update bracket_data.groups if present in tournament
      await this.syncLogoToTournamentBracket(tournamentId, teamId, url, path);

      return {
        url,
        path,
        teamId,
        tournamentId,
        isFallback,
        sizeBytes,
      };
    } catch (dbError) {
      // ROLLBACK: If upload succeeded in storage but DB update failed, delete orphaned file
      if (!isFallback && path) {
        console.error(`[ImageService] DB update failed. Rolling back uploaded file "${path}"...`);
        await this.deleteFromStorage(path);
      }
      throw dbError;
    }
  }

  /**
   * Safely deletes team logo: removes storage blob and clears DB record
   */
  async deleteTeamLogo(tournamentId: string, teamId: string): Promise<void> {
    const team = await teamRepository.findById(tournamentId, teamId);
    if (!team) {
      throw AppError.notFound(`Team "${teamId}" does not exist in tournament "${tournamentId}"`);
    }

    // Determine storage path if any
    let storagePath = (team as any).logo_path || '';
    if (!storagePath && team.logo && team.logo.includes(BUCKET_NAME)) {
      const parts = team.logo.split(`${BUCKET_NAME}/`);
      if (parts.length > 1) {
        storagePath = decodeURIComponent(parts[1]);
      }
    }

    // Clear DB record first or in conjunction
    try {
      await teamRepository.update(tournamentId, teamId, {
        logo: '',
        ...({ logo_path: null } as any),
      });
    } catch (dbErr: any) {
      if (dbErr?.code === '42703') {
        await teamRepository.update(tournamentId, teamId, { logo: '' });
      } else {
        throw dbErr;
      }
    }

    // Remove from bracket_data
    await this.syncLogoToTournamentBracket(tournamentId, teamId, '', '');

    // Safely delete from storage
    if (storagePath) {
      await this.deleteFromStorage(storagePath);
    }
  }

  /**
   * Helper to sync updated logo into tournament bracket_data
   */
  async syncLogoToTournamentBracket(
    tournamentId: string,
    teamId: string,
    logoUrl: string,
    logoPath: string
  ): Promise<void> {
    try {
      const tour = await tournamentRepository.findById(tournamentId);
      if (!tour || !tour.bracket_data) return;

      const bd = { ...tour.bracket_data };
      let changed = false;

      if (bd.groups && typeof bd.groups === 'object') {
        for (const [groupName, groupTeams] of Object.entries(bd.groups)) {
          if (Array.isArray(groupTeams)) {
            const updatedGroup = groupTeams.map((gt: any) => {
              if (gt.id === teamId) {
                changed = true;
                return { ...gt, logo: logoUrl, ...(logoPath ? { logo_path: logoPath } : {}) };
              }
              return gt;
            });
            bd.groups[groupName] = updatedGroup;
          }
        }
      }

      if (changed) {
        await tournamentRepository.update(tournamentId, { bracket_data: bd });
      }
    } catch (err: any) {
      console.warn(`[ImageService] Could not sync logo to bracket_data: ${err?.message}`);
    }
  }

  /**
   * Migration utility: Migrates legacy Base64 logos to Supabase Storage
   * RULE: "ห้ามลบไฟล์เดิมก่อนตรวจสอบไฟล์ใหม่" (Never overwrite original before verifying new storage file)
   */
  async migrateLegacyBase64Logos(tournamentId: string = 'sci_cup_main'): Promise<MigrationReport> {
    const report: MigrationReport = {
      timestamp: new Date().toISOString(),
      totalScanned: 0,
      migratedCount: 0,
      failedCount: 0,
      skippedCount: 0,
      details: [],
    };

    const supabase = getSupabaseClient();

    // 1. Fetch all teams
    let teams: any[] = [];
    try {
      const { data, error } = await supabase.from('teams').select('*');
      if (error) {
        throw new Error(`Failed to query teams: ${error.message}`);
      }
      teams = data || [];
    } catch (err: any) {
      throw new Error(`Migration abort: cannot load teams: ${err?.message}`);
    }

    report.totalScanned = teams.length;

    for (const team of teams) {
      const teamId = team.id;
      const teamName = team.name || teamId;
      const currentLogo = team.logo || '';

      // Skip if already an HTTP/HTTPS URL or empty
      if (!currentLogo || currentLogo.startsWith('http://') || currentLogo.startsWith('https://')) {
        report.skippedCount++;
        report.details.push({
          teamId,
          teamName,
          status: 'skipped',
          reason: !currentLogo ? 'No logo present' : 'Already using remote URL',
        });
        continue;
      }

      // Check if it is a valid Base64 string
      if (!currentLogo.startsWith('data:image/')) {
        report.skippedCount++;
        report.details.push({
          teamId,
          teamName,
          status: 'skipped',
          reason: 'Logo is not a base64 data URI',
        });
        continue;
      }

      // Attempt migration with strict verification
      try {
        const decoded = this.decodeAndValidateBase64(currentLogo);
        const storagePath = this.buildStoragePath(
          team.tournament_id || tournamentId,
          'teams',
          teamId,
          decoded.extension,
          `migrated_${Date.now()}`
        );

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, decoded.buffer, {
            contentType: decoded.contentType,
            upsert: true,
          });

        if (uploadError || !uploadData) {
          throw new Error(uploadError?.message || 'Storage upload returned empty result');
        }

        // VERIFY: Confirm URL and accessible path before updating original DB record
        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
        const publicUrl = urlData?.publicUrl;

        if (!publicUrl || !publicUrl.startsWith('http')) {
          throw new Error('Could not obtain valid public URL from storage verification');
        }

        // Verification successful -> Now update database record
        let updateSuccess = false;
        try {
          const { error: updateErr } = await supabase
            .from('teams')
            .update({
              logo: publicUrl,
              logo_path: storagePath,
            })
            .eq('id', teamId);

          if (updateErr) {
            if (updateErr.code === '42703') {
              // logo_path column doesn't exist yet, update only logo
              const fallbackUpdate = await supabase
                .from('teams')
                .update({ logo: publicUrl })
                .eq('id', teamId);
              if (!fallbackUpdate.error) updateSuccess = true;
              else throw fallbackUpdate.error;
            } else {
              throw updateErr;
            }
          } else {
            updateSuccess = true;
          }
        } catch (dbErr: any) {
          // If DB update fails, do NOT corrupt state; keep original base64
          throw new Error(`DB update failed after upload: ${dbErr?.message}`);
        }

        if (updateSuccess) {
          // Also sync to tournament bracket_data
          await this.syncLogoToTournamentBracket(
            team.tournament_id || tournamentId,
            teamId,
            publicUrl,
            storagePath
          );

          report.migratedCount++;
          report.details.push({
            teamId,
            teamName,
            status: 'migrated',
            oldSize: decoded.sizeBytes,
            newUrl: publicUrl,
            storagePath,
          });
        }
      } catch (err: any) {
        // Safe: original base64 was NOT deleted or overwritten
        report.failedCount++;
        report.details.push({
          teamId,
          teamName,
          status: 'failed',
          reason: err?.message || 'Unknown migration error',
        });
      }
    }

    return report;
  }
}

export const imageService = new ImageService();
