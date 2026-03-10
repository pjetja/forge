interface ForgeLogoProps {
  variant?: 'horizontal' | 'icon';
  className?: string;
}

const anvilPaths = (
  <>
    {/* Horn — tapered triangle pointing left */}
    <path d="M2 13 L10 10 L10 14 Z" fill="#10b981" />
    {/* Main anvil body — flat top */}
    <path d="M9 8 L27 8 L27 16 L9 16 Z" fill="#10b981" />
    {/* Waist — narrow trapezoid */}
    <path d="M13 16 L21 16 L22 19 L12 19 Z" fill="#10b981" />
    {/* Base — wide stable rectangle */}
    <path d="M10 19 L24 19 L24 23 L10 23 Z" fill="#10b981" />
  </>
);

export function ForgeLogo({ variant = 'horizontal', className = 'h-7' }: ForgeLogoProps) {
  if (variant === 'icon') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className={className}
        aria-label="Forge"
        role="img"
      >
        {anvilPaths}
      </svg>
    );
  }

  // Horizontal: flexbox with items-center guarantees reliable cross-browser vertical alignment
  // SVG text + dominantBaseline has inconsistent browser support
  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      role="img"
      aria-label="Forge"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="h-full w-auto flex-shrink-0"
        aria-hidden="true"
      >
        {anvilPaths}
      </svg>
      <span className="font-bold leading-none text-xl" style={{ color: '#e2e8f0' }}>
        Forge
      </span>
    </span>
  );
}
