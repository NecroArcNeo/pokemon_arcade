import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { GameOver, GameShell, Panel } from "@/components/GameShell";
import { getPokemon, randomId, type Pokemon } from "@/lib/pokemon";
import { submitScore } from "@/lib/scores";

export const Route = createFileRoute("/catch")({
  head: () => ({
    meta: [
      { title: "Catch Reflex — Poké Club" },
      { name: "description", content: "Throw your Poké Ball when the ring hits the sweet spot. 10 throws." },
      { property: "og:title", content: "Catch Reflex — Poké Club" },
      { property: "og:description", content: "Timing is everything." },
    ],
  }),
  component: Catch,
});

const THROWS = 10;

function Catch() {
  const [mon, setMon] = useState<Pokemon | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState(0);
  const [result, setResult] = useState<null | { text: string; pts: number }>(null);
  const [over, setOver] = useState<{ best: boolean } | null>(null);
  const [started, setStarted] = useState(false);
  const speed = useRef(1);

  const load = async () => {
    setResult(null);
    setMon(null);
    speed.current = 0.8 + Math.random() * 1.4;
    setMon(await getPokemon(randomId()));
  };

  useEffect(() => {
    if (!mon || result) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      setPhase(((performance.now() - t0) / 1000) * speed.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mon, result]);

  // ring size oscillates 0..1; sweet spot near 0.15
  const ring = (Math.cos(phase * Math.PI * 2) + 1) / 2;

  const start = () => {
    setStarted(true);
    setRound(0);
    setScore(0);
    setOver(null);
    load();
  };

  const throwBall = () => {
    if (!mon || result) return;
    const dist = Math.abs(ring - 0.15);
    const [text, pts] = dist < 0.05 ? ["Excellent!", 3] : dist < 0.12 ? ["Great!", 2] : dist < 0.22 ? ["Nice!", 1] : ["It broke free!", 0];
    setResult({ text: `${text} ${pts ? `Caught ${mon.name}!` : ""}`, pts: pts as number });
    const ns = score + (pts as number);
    const nr = round + 1;
    setScore(ns);
    setRound(nr);
    setTimeout(() => {
      if (nr >= THROWS) setOver({ best: submitScore("catch", ns) });
      else load();
    }, 1200);
  };

  const ringSize = 40 + ring * 200;

  return (
    <GameShell title="Catch Reflex" gameKey="catch" score={score}>
      {over ? (
        <GameOver score={score} isBest={over.best} onRestart={start} detail={`out of ${THROWS * 3}`} />
      ) : !started ? (
        <Panel className="text-center">
          <h2 className="text-2xl font-bold">Throw when the ring is smallest!</h2>
          <p className="mt-2 text-muted-foreground">Excellent = 3, Great = 2, Nice = 1. {THROWS} throws.</p>
          <button onClick={start} className="btn-pop mt-6 bg-primary px-8 py-4 text-xl text-primary-foreground">Start</button>
        </Panel>
      ) : (
        <div className="space-y-6 text-center">
          <p className="font-display text-muted-foreground">Throw {Math.min(round + 1, THROWS)} / {THROWS}</p>
          <Panel className="relative flex h-80 items-center justify-center overflow-hidden">
            {mon ? (
              <>
                <img src={mon.artwork} alt={mon.name} className={`h-48 w-48 object-contain ${result?.pts ? "scale-0 transition-transform duration-500" : ""}`} />
                {!result && (
                  <>
                    <div className="pointer-events-none absolute rounded-full border-4 border-success opacity-40" style={{ width: 70, height: 70 }} />
                    <div className="pointer-events-none absolute rounded-full border-[6px] border-primary" style={{ width: ringSize, height: ringSize }} />
                  </>
                )}
              </>
            ) : (
              <p className="font-display">A wild Pokémon is approaching…</p>
            )}
          </Panel>
          <p className="h-8 font-display text-2xl">{result?.text}</p>
          <button onClick={throwBall} disabled={!mon || !!result} className="btn-pop bg-primary px-10 py-5 text-2xl text-primary-foreground">
            Throw Poké Ball!
          </button>
        </div>
      )}
    </GameShell>
  );
}
