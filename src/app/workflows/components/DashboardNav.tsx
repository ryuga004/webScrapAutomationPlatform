import type { PublicUser } from "@/components/AuthProvider";
import { SearchBar } from "./SearchBar";
import { DownloadExtensionButton } from "./DownloadExtensionButton";
import { UserAvatar } from "./UserAvatar";

interface DashboardNavProps {
  query: string;
  onQueryChange: (value: string) => void;
  downloading: boolean;
  onDownload: () => void;
  user: PublicUser | null;
}

// Frosted sticky top app bar: search on the left, extension + profile on the right.
export function DashboardNav({
  query,
  onQueryChange,
  downloading,
  onDownload,
  user,
}: DashboardNavProps) {
  return (
    <header className="glass-effect sticky top-0 z-40 flex h-20 items-center justify-between gap-6 px-6 md:px-10">
      <div className="max-w-xl flex-1">
        <SearchBar value={query} onChange={onQueryChange} placeholder="Search automations…" />
      </div>
      <div className="flex items-center gap-4">
        <DownloadExtensionButton downloading={downloading} onDownload={onDownload} />
        <UserAvatar user={user} />
      </div>
    </header>
  );
}
