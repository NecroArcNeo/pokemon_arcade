import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameOver, GameShell, Panel } from "@/components/GameShell";
import { artworkUrl, choicesFor, getAllNames, getDexEntry, randomId } from "@/lib/pokemon";
import { submitScore } from "@/lib/scores";

export const Route = createFileRoute("/dex-entry")({
  head: () => ({
    meta: [
      { title: "Pokédex Entry Guess — Poké Club" },
      { name: "description", content: "Read a Pokédex entry with the name blanked out and guess the Pokémon." },
      { property: "og:title", content: "Pokédex Entry Guess — Poké Club" },
      { property: "og:description", content: "How well do you know the Pokédex?" },
    ],
  }),
  component: DexEntry,
});

function DexEntry() {
  const [names, setNames] = useState<string[]>([]);
  const [answer, setAnswer] = useState<number | null>(null);
  const [entry, setEntry] = useState("");
  const [choices, setChoices] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [over, setOver] = useState<{ best: boolean } | null>(null);

  const next = async () => {
    setPicked(null);
    setAnswer(null);
    const id = randomId();
    const text = await getDexEntry(id);
    setEntry(text);
    setChoices(choicesFor(id));
    setAnswer(id);
  };

  const start = () => {
    setScore(0);
    setLives(3);
    setOver(null);
    next();
  };

  useEffect(() => {
    getAllNames().then(setNames);
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (id: number) => {
    if (picked !== null || answer === null) return;
    setPicked(id);
    const ok = id === answer;
    const ns = score + (ok ? 1 : 0);
    const nl = ok ? lives : lives - 1;
    setScore(ns);
    setLives(nl);
    setTimeout(() => (nl <= 0 ? setOver({ best: submitScore("dex-entry", ns) }) : next()), 1600);
  };

  return (
    <GameShell title="Pokédex Entry Guess" gameKey="dex-entry" score={score}>
      {over ? (
        <GameOver score={score} isBest={over.best} onRestart={start} />
      ) : (
        <div className="space-y-6">
          <p className="font-display text-lg">{"❤️".repeat(lives)}{"🤍".repeat(3 - lives)}</p>
          <Panel className="bg-secondary text-secondary-foreground">
            {answer === null ? (
              <p className="font-display">Opening the Pokédex…</p>
            ) : (
              <div className="flex items-center gap-4">
                {picked !== null && <img src={artworkUrl(answer)} alt="" className="animate-pop-in h-24 w-24 shrink-0 rounded-2xl bg-card object-contain" />}
                <p className="text-xl leading-relaxed">“{entry}”</p>
              </div>
            )}
          </Panel>
          <div className="grid grid-cols-2 gap-3">
            {choices.map((id) => {
              const state = picked === null ? "bg-card" : id === answer ? "bg-success text-success-foreground" : id === picked ? "bg-destructive text-destructive-foreground" : "bg-muted";
              return (
                <button key={id} disabled={answer === null || picked !== null} onClick={() => pick(id)} className={`btn-pop border-2 px-4 py-4 text-lg ${state}`}>
                  {names[id - 1] ?? "…"}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </GameShell>
  );
}
