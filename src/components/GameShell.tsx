import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useScores } from "@/lib/scores";

export function GameShell({
  title,
  gameKey,
  score,
  scoreLabel = "Score",
  bestLabel,
  children,
}: {
  title: string;
  gameKey: string;
  score?: number | string;
  scoreLabel?: string;
  bestLabel?: string;
  children: ReactNode;
}) {
  const scores = useScores();
  const best = scores[gameKey];
  return (
    <div className="min-h-screen">
      <header className="bg-hero text-primary-foreground shadow-soft">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Link to="/" className="btn-pop bg-card px-4 py-2 text-sm text-foreground">
            ← Club
          </Link>
          <h1 className="flex-1 truncate text-xl font-bold sm:text-2xl">{title}</h1>
          <div className="flex gap-2 text-sm font-display">
            {score !== undefined && (
              <span className="rounded-full bg-card px-3 py-1 text-foreground">
                {scoreLabel}: <b>{score}</b>
              </span>
            )}
            <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
              {bestLabel ?? "Best"}: <b>{best ?? "–"}</b>
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border-2 bg-card p-6 shadow-soft ${className}`}>{children}</div>;
}

export function GameOver({
  score,
  isBest,
  onRestart,
  detail,
}: {
  score: number | string;
  isBest: boolean;
  onRestart: () => void;
  detail?: ReactNode;
}) {
  return (
    <Panel className="animate-pop-in text-center">
      <p className="font-display text-lg text-muted-foreground">Game over</p>
      <p className="font-display text-6xl font-bold text-primary">{score}</p>
      {isBest && <p className="mt-2 font-display text-lg text-success">★ New best!</p>}
      {detail && <div className="mt-3 text-muted-foreground">{detail}</div>}
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={onRestart} className="btn-pop bg-primary px-6 py-3 text-primary-foreground">
          Play again
        </button>
        <Link to="/" className="btn-pop bg-muted px-6 py-3">
          Back to club
        </Link>
      </div>
    </Panel>
  );
}

export function TypeBadge({ type, color }: { type: string; color: string }) {
  return (
    <span
      className="rounded-full px-3 py-1 font-display text-sm font-semibold uppercase tracking-wide text-primary-foreground"
      style={{ background: color }}
    >
      {type}
    </span>
  );
}
