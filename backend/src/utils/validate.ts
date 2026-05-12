import { z, ZodError } from 'zod'
import { ValidationError } from '../middlewares/errorHandler'

export function formatZodError(error: ZodError): string {
  return error.issues
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join(', ')
}

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ValidationError(formatZodError(result.error))
  }
  return result.data
}

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => validate(schema, data)
}
