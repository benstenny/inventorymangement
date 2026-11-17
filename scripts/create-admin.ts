/**
 * Creates the one admin login for the app.
 *
 *   npm run create-admin
 *
 * Asks for an email and password (the password isn't shown as you type),
 * then creates a confirmed user in Supabase Auth. This works even with
 * sign-ups turned off, because it uses SUPABASE_SECRET_KEY from .env.local.
 *
 * If a login already exists it stops, since this app has a single admin.
 * Use --force to add another anyway, or --reset to change an existing
 * user's password.
 */
import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";
import { z } from "zod";

const emailSchema = z.email();
const MIN_PASSWORD = 10;

async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

/** Reads a line without echoing it to the screen. */
function askHidden(question: string): Promise<string> {
  const stdin = process.stdin;
  if (!stdin.isTTY) return ask(question); // piped input: nothing to hide

  return new Promise((resolve, reject) => {
    process.stdout.write(question);
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          cleanup();
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u0003") {
          // Ctrl+C
          cleanup();
          process.stdout.write("\n");
          reject(new Error("Cancelled."));
          return;
        }
        if (char === "\u007f" || char === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        value += char;
        process.stdout.write("*");
      }
    };

    function cleanup() {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    }

    stdin.on("data", onData);
  });
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error(
      "Fill in NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first (see README, step 2).",
    );
  }

  const force = process.argv.includes("--force");
  const reset = process.argv.includes("--reset");
  const supabase = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 50 });
  if (listError) throw new Error(`Couldn't reach Supabase Auth: ${listError.message}`);
  const existing = list.users;

  if (existing.length > 0 && !force && !reset) {
    console.log(`A login already exists: ${existing.map((u) => u.email).join(", ")}`);
    console.log('To change its password, run: npm run create-admin -- --reset');
    return;
  }

  const email = (await ask("Email: ")).toLowerCase();
  if (!emailSchema.safeParse(email).success) throw new Error("That doesn't look like an email address.");

  const password = await askHidden(`Password (at least ${MIN_PASSWORD} characters): `);
  if (password.length < MIN_PASSWORD) throw new Error(`Password must be at least ${MIN_PASSWORD} characters.`);
  const confirm = await askHidden("Type it again: ");
  if (confirm !== password) throw new Error("The passwords don't match. Nothing was changed.");

  if (reset) {
    const user = existing.find((u) => u.email?.toLowerCase() === email);
    if (!user) throw new Error(`No login found for ${email}.`);
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
    if (error) throw new Error(`Couldn't change the password: ${error.message}`);
    console.log(`Password changed for ${email}. Log in with the new one.`);
    return;
  }

  const { error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`Couldn't create the login: ${error.message}`);
  console.log(`Login created for ${email}. Start the app with "npm run dev" and log in.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
