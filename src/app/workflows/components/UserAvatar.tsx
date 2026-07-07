import type { PublicUser } from "@/components/AuthProvider";

interface UserAvatarProps {
  user: PublicUser | null;
}

// Circular avatar showing the user's initial, with their email on hover.
export function UserAvatar({ user }: UserAvatarProps) {
  const initial = (user?.username?.[0] ?? "?").toUpperCase();
  return (
    <div
      title={user?.email}
      className="neu-raised-sm flex h-10 w-10 items-center justify-center !rounded-full font-bold text-primary"
    >
      {initial}
    </div>
  );
}
