"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TraineeProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  goals: z.string().max(2000).optional(),
  heightCm: z.coerce.number().int().min(50).max(300).optional(),
  weightKg: z.coerce.number().min(20).max(500).optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
});

export async function updateTraineeProfile(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: "Not authenticated" };

  const raw = {
    name: formData.get("name"),
    goals: formData.get("goals") || undefined,
    heightCm: formData.get("heightCm") || undefined,
    weightKg: formData.get("weightKg") || undefined,
    dateOfBirth: formData.get("dateOfBirth") || undefined,
  };

  const parsed = TraineeProfileSchema.safeParse(raw);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { error } = await supabase
    .from("users")
    .update({
      name: parsed.data.name,
      goals: parsed.data.goals ?? null,
      height_cm: parsed.data.heightCm ?? null,
      weight_kg: parsed.data.weightKg ?? null,
      date_of_birth: parsed.data.dateOfBirth ?? null,
    })
    .eq("auth_uid", claims.sub);

  if (error) return { error: "Failed to update profile. Please try again." };
  revalidatePath("/trainee/profile");
  return { success: true };
}

const ChangePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export async function changePassword(
  prevState: unknown,
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: "Not authenticated" };

  if (claims.user_metadata?.is_demo === true) {
    return { error: "Demo accounts cannot change their password." };
  }

  const result = ChangePasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!result.success)
    return { error: result.error.issues[0]?.message ?? "Invalid input" };

  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });
  if (error) return { error: "Failed to update password. Please try again." };

  await supabase.auth.signOut();
  redirect("/login");
}
