import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameOver, GameShell, Panel, TypeBadge } from "@/components/GameShell";
import { effectiveness, shuffle, TYPE_COLORS, TYPES, type PokeType } from "@/lib/pokemon";
import { submitScore } from "@/lib/scores";

export const Route = createFileRoute("/type-blitz")({
  head: () => ({
    meta: [
      { title: "Type Matchup Blitz — Poké Club" },
      { name: "description", content: "Rapid-fire type effectiveness questions. 60 seconds, as many as you can." },
      { property: "og:title", content: "Type Matchup Blitz — Poké Club" },
      { property: "og:description", content: "Learn the type chart at speed." },
    ],
  }),
  component: TypeBlitz,
});

const ANSWERS = [0, 0.25, 0.5, 1, 2, 4];
const label = (m: number) => (m === 0 ? "No effect" : m === 0.25 ? "¼×" : m === 0.5 ? "½×" : `${m}×`);
const DURATION = 60;

function makeQ() {
  const atk: PokeType = TYPES[Math.floor(Math.random() * TYPES.length)]!;
  const defs = shuffle<PokeType>([...TYPES]).slice(0, Math.random() < 0.5 ? 1 : 2);
  return { atk, defs, answer: effectiveness(atk, defs) };
}

function TypeBlitz() {
  const [q, setQ] = useState<ReturnType<typeof makeQ> | null>(null);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(DURATION);
  const [running, setRunning] = useState(false);
  const [flash, setFlash] = useState<null | { ok: boolean; answer: number }>(null);
  const [over, setOver] = useState<{ best: boolean } | null>(null);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTime((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (running && time <= 0) {
      setRunning(false);
      setOver({ best: submitScore("type-blitz", score) });
    }
  }, [time, running, score]);

  const start = () => {
    setScore(0);
    setTime(DURATION);
    setOver(null);
    setQ(makeQ());
    setRunning(true);
  };

  const answer = (m: number) => {
    if (!q || flash) return;
    const ok = m === q.answer;
    setScore((s) => Math.max(0, s + (ok ? 1 : -1)));
    setFlash({ ok, answer: q.answer });
    setTimeout(() => {
      setFlash(null);
      setQ(makeQ());
    }, ok ? 300 : 900);
  };

  return (
    <GameShell title="Type Matchup Blitz" gameKey="type-blitz" score={score}>
      {over ? (
        <GameOver score={score} isBest={over.best} onRestart={start} />
      ) : !running || !q ? (
        <Panel className="text-center">
          <h2 className="text-2xl font-bold">60 seconds. How effective is it?</h2>
          <p className="mt-2 text-muted-foreground">+1 for right, −1 for wrong.</p>
          <button onClick={start} className="btn-pop mt-6 bg-primary px-8 py-4 text-xl text-primary-foreground">Start</button>
        </Panel>
      ) : (
        <div className="space-y-6">
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-secondary transition-all duration-1000 ease-linear" style={{ width: `${(time / DURATION) * 100}%` }} />
          </div>
          <Panel className={`text-center ${flash ? (flash.ok ? "border-success" : "border-destructive") : ""}`}>
            <div className="flex flex-wrap items-center justify-center gap-3 text-lg">
              <TypeBadge type={q.atk} color={TYPE_COLORS[q.atk]} />
              <span className="font-display">attacks</span>
              {q.defs.map((d) => <TypeBadge key={d} type={d} color={TYPE_COLORS[d]} />)}
            </div>
            <p className="mt-4 h-8 font-display text-xl">
              {flash && (flash.ok ? <span className="text-success">Correct!</span> : <span className="text-destructive">It was {label(flash.answer)}</span>)}
            </p>
          </Panel>
          <div className="grid grid-cols-3 gap-3">
            {ANSWERS.map((m) => (
              <button key={m} onClick={() => answer(m)} className="btn-pop border-2 bg-card px-3 py-4 text-xl">{label(m)}</button>
            ))}
          </div>
          <p className="text-center font-display text-muted-foreground">{time}s left</p>
        </div>
      )}
    </GameShell>
  );
}
