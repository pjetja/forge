"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ResetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export async function updatePassword(prevState: unknown, formData: FormData) {
  const result = ResetSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();

  // Defence-in-depth: block demo users from resetting password via this flow too
  const claimsResult = await supabase.auth.getClaims();
  if (claimsResult.data?.claims?.user_metadata?.is_demo === true) {
    return { error: "Demo accounts cannot change their password." };
  }

  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) return { error: error.message };

  // Sign out and send to login so they log in fresh with the new password
  await supabase.auth.signOut();
  redirect("/login");
}
