interface PhysicalStatsRowProps {
  heightCm: number | null;
  weightKg: number | null;
  dateOfBirth: string | null;
}

function ageFromDob(dob: string): number {
  const birth = new Date(dob + 'T00:00:00');
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function PhysicalStatsRow({ heightCm, weightKg, dateOfBirth }: PhysicalStatsRowProps) {
  const chips: string[] = [];

  if (heightCm != null) chips.push(`${heightCm} cm`);
  if (weightKg != null) chips.push(`${weightKg} kg`);
  if (dateOfBirth) chips.push(`Age ${ageFromDob(dateOfBirth)}`);

  if (chips.length === 0) return null;

  return (
    <p className="text-sm text-text-primary opacity-70">{chips.join(' \u00B7 ')}</p>
  );
}
