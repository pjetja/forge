"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const DEMO_TRAINER_EMAIL = "demo-trainer@trainerforge.app";
const DEMO_TRAINER_PASSWORD = "DemoTrainer2026!";
const DEMO_TRAINEE_EMAIL = "demo-trainee@trainerforge.app";
const DEMO_TRAINEE_PASSWORD = "DemoTrainee2026!";

export async function loginAsDemoTrainer() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_TRAINER_EMAIL,
    password: DEMO_TRAINER_PASSWORD,
  });
  if (error) redirect("/login");
  redirect("/trainer");
}

export async function loginAsDemoTrainee() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_TRAINEE_EMAIL,
    password: DEMO_TRAINEE_PASSWORD,
  });
  if (error) redirect("/login");
  redirect("/trainee");
}
