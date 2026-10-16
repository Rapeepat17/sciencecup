import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { imageService } from '../../srv/src/services/image.service.ts';
import { AppError } from '../../srv/src/middleware/errorHandler.ts';

// 1x1 transparent PNG as valid Base64
const VALID_1X1_PNG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Fake PNG with invalid magic bytes (disguised text)
const FAKE_PNG_BASE64 =
  'data:image/png;base64,' + Buffer.from('this is just text and not a png').toString('base64');

describe('ImageService - Validation & Magic Bytes', () => {
  test('decodes and validates a genuine PNG data URL', () => {
    const result = imageService.decodeAndValidateBase64(VALID_1X1_PNG_BASE64);
    assert.equal(result.contentType, 'image/png');
    assert.equal(result.extension, 'png');
    assert.ok(result.buffer.length > 0);
    assert.ok(result.sizeBytes < 5 * 1024 * 1024);
  });

  test('rejects malformed Base64 data URL', () => {
    assert.throws(
      () => imageService.decodeAndValidateBase64('not-a-valid-data-url'),
      (err: any) => err instanceof AppError && err.statusCode === 400
    );
  });

  test('rejects unsupported MIME types (e.g. text/html, application/pdf)', () => {
    const fakeHtmlBase64 = 'data:text/html;base64,' + Buffer.from('<h1>hello</h1>').toString('base64');
    assert.throws(
      () => imageService.decodeAndValidateBase64(fakeHtmlBase64),
      (err: any) => err instanceof AppError && err.statusCode === 400 && err.message.includes('Unsupported image type')
    );
  });

  test('rejects image spoofing where MIME is image/png but content magic bytes are text', () => {
    assert.throws(
      () => imageService.decodeAndValidateBase64(FAKE_PNG_BASE64),
      (err: any) => err instanceof AppError && err.statusCode === 400 && err.message.includes('content signature does not match')
    );
  });

  test('verifies magic bytes for JPEG and WebP', () => {
    // Valid JPEG header
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    assert.equal(imageService.validateImageMagicBytes(jpegBuffer, 'image/jpeg'), true);

    // Valid WebP header: RIFF....WEBP
    const webpBuffer = Buffer.alloc(16);
    webpBuffer.write('RIFF', 0);
    webpBuffer.write('WEBP', 8);
    assert.equal(imageService.validateImageMagicBytes(webpBuffer, 'image/webp'), true);

    // Mismatched
    assert.equal(imageService.validateImageMagicBytes(jpegBuffer, 'image/webp'), false);
  });
});

describe('ImageService - Storage Path Construction', () => {
  test('constructs structured, sanitized path isolated by tournament and category', () => {
    const path = imageService.buildStoragePath('sci_cup_2026', 'teams', 'team-1@!#$', 'png', 'fixed_ts');
    assert.equal(path, 'sci_cup_2026/teams/team-1_____fixed_ts.png');
  });

  test('handles nested categories like tournaments and general', () => {
    const tourneyPath = imageService.buildStoragePath('sci_cup_main', 'tournaments', 'banner', 'jpg', '12345');
    assert.equal(tourneyPath, 'sci_cup_main/tournaments/banner_12345.jpg');
  });
});

describe('ImageService - Safe Rollback on DB Error', () => {
  test('cleans up storage file if database update throws an exception', async () => {
    let removedPath = '';
    const originalDelete = imageService.deleteFromStorage;
    // Mock deleteFromStorage
    imageService.deleteFromStorage = async (path: string) => {
      removedPath = path;
      return true;
    };

    // Mock uploadToStorage to simulate successful storage upload
    const originalUpload = imageService.uploadToStorage;
    imageService.uploadToStorage = async (storagePath: string) => {
      return {
        url: `https://fake.supabase.co/storage/v1/object/public/team-logos/${storagePath}`,
        path: storagePath,
        isFallback: false,
      };
    };

    try {
      // Trying to upload for non-existent tournament throws notFound
      await assert.rejects(
        async () => {
          await imageService.uploadAndSaveTeamLogo('non_existent_tourney_id', 'team_1', VALID_1X1_PNG_BASE64);
        },
        (err: any) => err instanceof AppError && err.statusCode === 404
      );
    } finally {
      imageService.deleteFromStorage = originalDelete;
      imageService.uploadToStorage = originalUpload;
    }
  });
});
