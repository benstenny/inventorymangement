"use server";

import { redirect } from "next/navigation";
import { loginSchema, type LoginState } from "@/lib/auth";
import { readPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function logIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const parsed = loginSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message, email };
  }

  if (!readPublicEnv()) {
    return { error: "The app isn't connected to Supabase yet.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "That email and password don't match. Try again.", email };
  }

  redirect("/");
}

export async function logOut() {
  if (readPublicEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
