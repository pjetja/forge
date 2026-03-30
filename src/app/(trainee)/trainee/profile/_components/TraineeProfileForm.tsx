"use client";
import { useTransition, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { updateTraineeProfile, changePassword } from "../actions";

export function TraineeProfileForm({
  initialName,
  initialGoals,
  initialHeightCm,
  initialWeightKg,
  initialDateOfBirth,
  isDemo,
}: {
  initialName: string;
  initialGoals: string;
  initialHeightCm: number | null;
  initialWeightKg: number | null;
  initialDateOfBirth: string | null; // 'YYYY-MM-DD' or null
  isDemo: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("trainee");

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
      const result = await updateTraineeProfile(formData);
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
            {t("profile.nameLabelField")}
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
            htmlFor="profile-goals"
            className="text-sm text-text-primary mb-1 block"
          >
            {t("profile.goalsLabelField")}
          </label>
          <textarea
            id="profile-goals"
            name="goals"
            rows={4}
            defaultValue={initialGoals}
            placeholder={t("profile.goalsPlaceholder")}
            className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="profile-height"
              className="text-sm text-text-primary mb-1 block"
            >
              {t("profile.heightLabel")}
            </label>
            <input
              id="profile-height"
              type="number"
              name="heightCm"
              min="50"
              max="300"
              step="1"
              defaultValue={initialHeightCm ?? undefined}
              className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full"
            />
          </div>

          <div>
            <label
              htmlFor="profile-weight"
              className="text-sm text-text-primary mb-1 block"
            >
              {t("profile.weightLabel")}
            </label>
            <input
              id="profile-weight"
              type="number"
              name="weightKg"
              min="20"
              max="500"
              step="0.1"
              defaultValue={initialWeightKg ?? undefined}
              className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full"
            />
          </div>

          <div>
            <label
              htmlFor="profile-dob"
              className="text-sm text-text-primary mb-1 block"
            >
              {t("profile.dobLabel")}
            </label>
            <input
              id="profile-dob"
              type="date"
              name="dateOfBirth"
              defaultValue={initialDateOfBirth ?? undefined}
              className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full"
            />
          </div>
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
