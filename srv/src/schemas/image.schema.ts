import { z } from 'zod';

export const uploadImageSchema = z.object({
  imageBase64: z
    .string()
    .min(1, 'imageBase64 is required')
    .regex(/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,/, 'Must be a valid base64 image data URL (PNG, JPEG, WebP, SVG)'),
  teamId: z.string().min(1, 'teamId is required'),
});

export const deleteImageSchema = z.object({
  teamId: z.string().min(1, 'teamId is required'),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;
export type DeleteImageInput = z.infer<typeof deleteImageSchema>;
