interface ForgeLogoProps {
  variant?: 'horizontal' | 'icon';
  className?: string;
}

export function ForgeLogo({ variant = 'horizontal', className = 'h-7 w-auto' }: ForgeLogoProps) {
  if (variant === 'icon') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className={className}
        aria-label="Forge"
        role="img"
      >
        {/* Anvil-inspired mark: horn on left, flat top body, base */}
        {/* Horn — tapered triangle pointing left */}
        <path d="M2 13 L10 10 L10 14 Z" fill="#10b981" />
        {/* Main anvil body — flat top rectangle with angled sides */}
        <path d="M9 8 L27 8 L27 16 L9 16 Z" fill="#10b981" />
        {/* Waist — narrow trapezoid connector */}
        <path d="M13 16 L21 16 L22 19 L12 19 Z" fill="#10b981" />
        {/* Base — wide stable rectangle */}
        <path d="M10 19 L24 19 L24 23 L10 23 Z" fill="#10b981" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 140 32"
      className={className}
      aria-label="Forge"
      role="img"
    >
      {/* Icon mark — same anvil paths as icon variant, shifted to left zone */}
      {/* Horn */}
      <path d="M2 13 L10 10 L10 14 Z" fill="#10b981" />
      {/* Main anvil body */}
      <path d="M9 8 L27 8 L27 16 L9 16 Z" fill="#10b981" />
      {/* Waist */}
      <path d="M13 16 L21 16 L22 19 L12 19 Z" fill="#10b981" />
      {/* Base */}
      <path d="M10 19 L24 19 L24 23 L10 23 Z" fill="#10b981" />

      {/* Wordmark "Forge" — dominantBaseline="central" centers text on y=16 (mid of 32px viewBox) */}
      <text
        x="33"
        y="16"
        fontFamily="system-ui, sans-serif"
        fontWeight="700"
        fontSize="18"
        fill="#e2e8f0"
        dominantBaseline="central"
      >
        Forge
      </text>
    </svg>
  );
}
