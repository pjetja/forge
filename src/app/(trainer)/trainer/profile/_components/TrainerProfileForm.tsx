"use client";
import { useTransition, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { updateTrainerProfile, changePassword } from "../actions";

export function TrainerProfileForm({
  initialName,
  initialBio,
  isDemo,
}: {
  initialName: string;
  initialBio: string;
  isDemo: boolean;
}) {
  const t = useTranslations("trainer");
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [cpPending, startCpTransition] = useTransition();
  const [cpError, setCpError] = useState("");

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateTrainerProfile(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCpError("");
    const formData = new FormData(e.currentTarget);
    startCpTransition(async () => {
      const result = await changePassword(undefined, formData);
      if (result && "error" in result) setCpError(result.error);
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="profile-name"
            className="text-sm text-text-primary mb-1 block"
          >
            {t("profile.nameLabel")}
          </label>
          <input
            id="profile-name"
            type="text"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full"
          />
        </div>

        <div>
          <label
            htmlFor="profile-bio"
            className="text-sm text-text-primary mb-1 block"
          >
            {t("profile.bioLabel")}
          </label>
          <textarea
            id="profile-bio"
            name="bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={!name.trim() || isPending}
            className="bg-accent hover:bg-accent-hover text-white font-medium px-6 py-2 rounded-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed w-full md:w-auto"
          >
            {isPending ? t("profile.saving") : t("profile.saveChanges")}
          </button>

          {success && (
            <p className="text-accent text-sm mt-2">
              {t("profile.changesSaved")}
            </p>
          )}
          {error && <p className="text-error text-sm mt-2">{error}</p>}
        </div>
      </form>

      {!isDemo && (
        <div className="space-y-4 pt-6 border-t border-border">
          <h2 className="text-xl font-bold text-text-primary">
            {t("profile.changePasswordHeading")}
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label
                htmlFor="cp-password"
                className="text-sm text-text-primary mb-1 block"
              >
                {t("profile.changePasswordNewLabel")}
              </label>
              <input
                id="cp-password"
                type="password"
                name="password"
                required
                minLength={8}
                className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full"
              />
            </div>
            <div>
              <label
                htmlFor="cp-confirm"
                className="text-sm text-text-primary mb-1 block"
              >
                {t("profile.changePasswordConfirmLabel")}
              </label>
              <input
                id="cp-confirm"
                type="password"
                name="confirm"
                required
                minLength={8}
                className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full"
              />
            </div>
            <button
              type="submit"
              disabled={cpPending}
              className="bg-accent hover:bg-accent-hover text-white font-medium px-6 py-2 rounded-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed w-full md:w-auto"
            >
              {cpPending
                ? t("profile.changePasswordSaving")
                : t("profile.changePasswordSubmit")}
            </button>
            {cpError && <p className="text-error text-sm">{cpError}</p>}
          </form>
        </div>
      )}
    </>
  );
}
