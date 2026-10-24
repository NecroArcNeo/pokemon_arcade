import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GameOver, GameShell, Panel } from "@/components/GameShell";
import { getPokemon, randomId, type Pokemon } from "@/lib/pokemon";
import { submitScore } from "@/lib/scores";

export const Route = createFileRoute("/higher-lower")({
  head: () => ({
    meta: [
      { title: "Higher or Lower — Poké Club" },
      { name: "description", content: "Is the next Pokémon's stat total, weight, height or speed higher or lower? Build an endless streak." },
      { property: "og:title", content: "Higher or Lower — Poké Club" },
      { property: "og:description", content: "Endless Pokémon stat streaks." },
    ],
  }),
  component: HigherLower,
});

const STATS = {
  bst: { label: "Base Stat Total", get: (p: Pokemon) => p.bst, fmt: (v: number) => `${v}` },
  weight: { label: "Weight", get: (p: Pokemon) => p.weight, fmt: (v: number) => `${(v / 10).toFixed(1)} kg` },
  height: { label: "Height", get: (p: Pokemon) => p.height, fmt: (v: number) => `${(v / 10).toFixed(1)} m` },
  speed: { label: "Speed", get: (p: Pokemon) => p.stats.find((s) => s.name === "speed")!.value, fmt: (v: number) => `${v}` },
} as const;
type StatKey = keyof typeof STATS;

function HigherLower() {
  const [stat, setStat] = useState<StatKey | null>(null);
  const [cur, setCur] = useState<Pokemon | null>(null);
  const [nxt, setNxt] = useState<Pokemon | null>(null);
  const [revealed, setRevealed] = useState<null | boolean>(null);
  const [streak, setStreak] = useState(0);
  const [over, setOver] = useState<{ best: boolean } | null>(null);

  const fetchNext = async (avoid: number) => {
    let id = randomId();
    while (id === avoid) id = randomId();
    return getPokemon(id);
  };

  const start = async (s: StatKey) => {
    setStat(s);
    setStreak(0);
    setOver(null);
    setRevealed(null);
    setCur(null);
    setNxt(null);
    const a = await getPokemon(randomId());
    const b = await fetchNext(a.id);
    setCur(a);
    setNxt(b);
  };

  const guess = (higher: boolean) => {
    if (!stat || !cur || !nxt || revealed !== null) return;
    const a = STATS[stat].get(cur);
    const b = STATS[stat].get(nxt);
    const correct = b === a || (higher ? b > a : b < a);
    setRevealed(correct);
    setTimeout(async () => {
      if (!correct) {
        setOver({ best: submitScore(`hl-${stat}`, streak) });
        return;
      }
      setStreak((s) => s + 1);
      const n = await fetchNext(nxt.id);
      setCur(nxt);
      setNxt(n);
      setRevealed(null);
    }, 1300);
  };

  if (!stat) {
    return (
      <GameShell title="Higher or Lower" gameKey="hl-bst">
        <Panel className="text-center">
          <h2 className="text-2xl font-bold">Compare by…</h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {(Object.keys(STATS) as StatKey[]).map((k) => (
              <button key={k} onClick={() => start(k)} className="btn-pop bg-secondary px-4 py-4 text-secondary-foreground">
                {STATS[k].label}
              </button>
            ))}
          </div>
        </Panel>
      </GameShell>
    );
  }

  const S = STATS[stat];
  return (
    <GameShell title={`Higher or Lower · ${S.label}`} gameKey={`hl-${stat}`} score={streak} scoreLabel="Streak">
      {over ? (
        <GameOver score={streak} isBest={over.best} onRestart={() => start(stat)} detail={<button className="underline" onClick={() => setStat(null)}>Change stat</button>} />
      ) : !cur || !nxt ? (
        <p className="text-center font-display">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card mon={cur} value={S.fmt(S.get(cur))} />
          <Card
            mon={nxt}
            value={revealed !== null ? S.fmt(S.get(nxt)) : "?"}
            tone={revealed === null ? undefined : revealed ? "good" : "bad"}
          >
            {revealed === null && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button onClick={() => guess(true)} className="btn-pop bg-success px-4 py-3 text-success-foreground">▲ Higher</button>
                <button onClick={() => guess(false)} className="btn-pop bg-primary px-4 py-3 text-primary-foreground">▼ Lower</button>
              </div>
            )}
          </Card>
        </div>
      )}
    </GameShell>
  );
}

function Card({ mon, value, tone, children }: { mon: Pokemon; value: string; tone?: "good" | "bad"; children?: React.ReactNode }) {
  const ring = tone === "good" ? "border-success" : tone === "bad" ? "border-destructive" : "";
  return (
    <Panel className={`animate-pop-in text-center ${ring}`}>
      <img src={mon.artwork} alt={mon.name} className="mx-auto h-44 w-44 object-contain" />
      <h3 className="mt-2 text-2xl font-bold">{mon.name}</h3>
      <p className="font-display text-4xl font-bold text-secondary">{value}</p>
      {children}
    </Panel>
  );
}
