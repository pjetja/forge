import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { gravatarUrl } from "@/lib/gravatar";
import { GravatarAvatar } from "@/components/GravatarAvatar";
import { TrainerProfileForm } from "./_components/TrainerProfileForm";

export default async function TrainerProfilePage() {
  const t = await getTranslations("trainer");
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;

  const { data: trainer } = claims?.sub
    ? await supabase
        .from("trainers")
        .select("name, email, bio")
        .eq("auth_uid", claims.sub)
        .single()
    : { data: null };

  const name = trainer?.name ?? "";
  const email = trainer?.email ?? "";
  const bio = trainer?.bio ?? "";
  const isDemo = !!claims?.user_metadata?.is_demo;

  return (
    <div className="space-y-8">
      {/* Avatar + identity header */}
      <div className="flex items-center gap-4">
        <GravatarAvatar
          url={gravatarUrl(email)}
          name={name}
          size={80}
          className="ring-2 ring-accent shrink-0"
        />
        <div>
          <h1 className="text-[28px] font-bold text-text-primary">{name}</h1>
          <p className="text-sm text-text-primary opacity-50">{email}</p>
          <p className="text-sm text-text-primary opacity-50">
            {t("profile.setAvatarHint")}
          </p>
        </div>
      </div>

      {/* Profile section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-text-primary">
          {t("profile.profileSection")}
        </h2>
        <TrainerProfileForm
          initialName={name}
          initialBio={bio}
          isDemo={isDemo}
        />
      </div>
    </div>
  );
}
