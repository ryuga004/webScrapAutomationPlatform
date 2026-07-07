import { Logo } from "../Logo";

// Brand bento cell for the auth screen: logo, wordmark, one-line pitch.
export function BrandTile() {
  return (
    <div className="neu-raised flex flex-col justify-between gap-6 p-6">
      <Logo size={44} className="neu-raised-sm rounded-lg" />
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-primary">
          WebBot
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Build website automation workflows from atomic nodes — no code required.
        </p>
      </div>
    </div>
  );
}
