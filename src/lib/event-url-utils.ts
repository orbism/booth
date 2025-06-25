import { RESERVED_KEYWORDS } from '@/types/event-url';
import { z } from 'zod';

// Event URL validation schema
export const eventUrlSchema = z.object({
  urlPath: z
    .string()
    .min(3, "URL must be at least 3 characters")
    .max(30, "URL cannot exceed 30 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens are allowed"),
  eventName: z.string().min(2, "Event name is required"),
  eventStartDate: z.string().optional().nullable(),
  eventEndDate: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

/**
 * Validates an event URL path
 * @throws Error if validation fails
 */
export function validateEventUrl(urlPath: string): void {
  // Check if URL is a reserved keyword
  if (RESERVED_KEYWORDS.includes(urlPath.toLowerCase())) {
    throw new Error('This URL is reserved and cannot be used');
  }

  // Validate URL format
  const result = eventUrlSchema.shape.urlPath.safeParse(urlPath);
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }
}

/**
 * Validates event URL data
 * @throws Error if validation fails
 */
export function validateEventUrlData(data: unknown): void {
  const result = eventUrlSchema.safeParse(data);
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }
}

/**
 * Sanitizes an event URL path
 */
export function sanitizeEventUrlPath(urlPath: string): string {
  return urlPath.toLowerCase().trim();
} 