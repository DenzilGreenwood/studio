// src/lib/auth-schemas.ts
import * as z from "zod";

export interface AuthFormProps {
  mode: "login" | "signup";
}

export const baseSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export const loginSchema = baseSchema.extend({
  passphrase: z.string().min(8, { message: "Passphrase must be at least 8 characters." }),
  recoveryKey: z.string()
    .min(64, { message: "Recovery key must be 64 characters long." })
    .max(64, { message: "Recovery key must be 64 characters long." })
    .regex(/^[a-f0-9]+$/i, { message: "Recovery key must contain only hexadecimal characters (0-9, a-f)." })
    .optional(),
});

export const signupSchema = baseSchema.extend({
  pseudonym: z.string().min(2, { message: "Pseudonym must be at least 2 characters." }).max(50, {message: "Pseudonym cannot exceed 50 characters."}).trim().optional().or(z.literal('')),
  passphrase: z.string().min(8, { message: "Passphrase must be at least 8 characters." }),
  confirmPassphrase: z.string(),
}).refine((data) => data.passphrase === data.confirmPassphrase, {
  message: "Passphrases don't match",
  path: ["confirmPassphrase"],
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
