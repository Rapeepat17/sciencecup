import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username must contain only letters, numbers, hyphens, and underscores'),
  fullName: z.string().max(100).optional(),
  // Security: role field is strictly omitted here to prevent self-privilege escalation
});

export const updateProfileSchema = z.object({
  fullName: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  // Security: users cannot change their own role or tournament permissions via this schema
});
