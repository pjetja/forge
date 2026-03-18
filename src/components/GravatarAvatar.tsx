interface GravatarAvatarProps {
  url: string;
  name: string;
  size?: number;
  className?: string;
}

export function GravatarAvatar({ url, name, size = 40, className }: GravatarAvatarProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`${name}'s avatar`}
      width={size}
      height={size}
      className={`rounded-full object-cover bg-accent/20 ${className ?? ''}`}
    />
  );
}
