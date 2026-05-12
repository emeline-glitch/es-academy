import { z } from "zod";

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Email invalide" })
  .max(254);

export const FrenchPhoneSchema = z
  .string()
  .trim()
  .regex(/^(?:\+33|0)[1-9](?:[\s.\-]?\d{2}){4}$/, {
    message: "Numero de telephone francais invalide",
  })
  .transform((v) => v.replace(/[\s.\-]/g, ""));

export const NameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[\p{L}\s'\-]+$/u, { message: "Caracteres non autorises" });

export const OptionalNameSchema = z
  .string()
  .trim()
  .max(100)
  .regex(/^[\p{L}\s'\-]*$/u, { message: "Caracteres non autorises" })
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined));

export const TextareaSchema = z.string().trim().min(1).max(5000);

export const UrlSchema = z.string().trim().url().max(2048);

export const UuidSchema = z.string().uuid();

export const SlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9\-_]+$/, { message: "Slug invalide" });
