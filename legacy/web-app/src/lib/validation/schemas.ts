import { z } from 'zod';

const documentTypeSchema = z.enum([
  'property_survey',
  'listing_591',
  'sales_dm',
  'social_posts',
  'disclosure_document',
]);

export const listingCreateSchema = z.object({
  propertyType: z.string().min(1),
});

export const listingUpdateSchema = z.object({
  market_summary: z.string().max(500).nullable().optional(),
}).strict();

export const fieldVisitSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  isComplete: z.boolean(),
});

export const supplementarySchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

export const generateSchema = z.object({
  documentType: documentTypeSchema.optional(),
}).strict();

export const regenerateSchema = z.object({
  documentType: documentTypeSchema,
}).strict();

export const adminUserCreateSchema = z.object({
  email: z.string().email(),
  display_name: z.string().min(1),
  password: z.string().min(6),
  username: z.string().min(1).optional(),
}).strict();

export const transferCaseSchema = z.object({
  from_user_id: z.number().int().positive(),
  to_user_id: z.number().int().positive(),
}).strict();

export function validationError(error: z.ZodError) {
  return {
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: error.issues,
  };
}
