import { z } from "zod";

export const emailSchema = z.string().trim().email("Please enter a valid email address.");

export const requiredStringSchema = (field: string) =>
  z.string().trim().min(1, `${field} is required.`);

export const positiveNumberSchema = (field: string) =>
  z.coerce
    .number({ invalid_type_error: `${field} must be a valid number.` })
    .min(0, `${field} must be 0 or greater.`);

export const positivePriceSchema = (field: string) =>
  z.coerce
    .number({ invalid_type_error: `${field} must be a valid number.` })
    .nonnegative(`${field} must be 0 or greater.`);
