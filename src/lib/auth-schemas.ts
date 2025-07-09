// src/lib/auth-schemas.ts
import * as z from "zod";

export interface AuthFormProps {
  mode: "login" | "signup";
}

export const baseSchema = z.object({
  email: z.string().min(1, { message: "Email is required." }).email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }).min(8, { message: "Password must be at least 8 characters." }),
});

export const loginSchema = baseSchema.extend({
  passphrase: z.string().min(1, { message: "Passphrase is required." }).min(8, { message: "Passphrase must be at least 8 characters." }),
  recoveryKey: z.string()
    .min(64, { message: "Recovery key must be 64 characters long." })
    .max(64, { message: "Recovery key must be 64 characters long." })
    .regex(/^[a-f0-9]+$/i, { message: "Recovery key must contain only hexadecimal characters (0-9, a-f)." })
    .optional(),
});

export const signupSchema = baseSchema.extend({
  pseudonym: z.string().min(2, { message: "Pseudonym must be at least 2 characters." }).max(50, {message: "Pseudonym cannot exceed 50 characters."}).trim().optional().or(z.literal('')),
  passphrase: z.string()
    .min(8, { message: "Must be at least 8 characters." })
    .regex(/[A-Z]/, { message: "Must contain an uppercase letter." })
    .regex(/[a-z]/, { message: "Must contain a lowercase letter." })
    .regex(/[0-9]/, { message: "Must contain a number." })
    .regex(/[^A-Za-z0-9]/, { message: "Must contain a special character." }),
  confirmPassphrase: z.string().min(1, "Please confirm your passphrase."),
}).refine((data) => data.passphrase === data.confirmPassphrase, {
  message: "Passphrases don't match",
  path: ["confirmPassphrase"],
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
