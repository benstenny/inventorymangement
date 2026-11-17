import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ message: "Enter the email you log in with." }),
  password: z.string().min(1, { message: "Enter your password." }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export type LoginState = { error?: string; email?: string };
