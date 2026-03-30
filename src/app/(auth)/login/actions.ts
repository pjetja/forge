"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function signIn(prevState: unknown, formData: FormData) {
  const result = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { email, password } = result.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Invalid email or password" }; // Generic message — don't leak which is wrong
  }

  // Read role from claims to redirect appropriately
  const claimsResult = await supabase.auth.getClaims();
  const role = claimsResult.data?.claims?.app_metadata?.role as
    | "trainer"
    | "trainee"
    | undefined;

  if (role === "trainer") {
    redirect("/trainer");
  } else if (role === "trainee") {
    redirect("/trainee");
  } else {
    redirect("/"); // fallback
  }
}

export async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
