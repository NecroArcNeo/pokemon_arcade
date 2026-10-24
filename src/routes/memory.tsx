import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameOver, GameShell } from "@/components/GameShell";
import { artworkUrl, shuffle, uniqueIds } from "@/lib/pokemon";
import { submitScore } from "@/lib/scores";

export const Route = createFileRoute("/memory")({
  head: () => ({
    meta: [
      { title: "Memory Match — Poké Club" },
      { name: "description", content: "Flip cards and match Pokémon pairs in as few moves as possible." },
      { property: "og:title", content: "Memory Match — Poké Club" },
      { property: "og:description", content: "Classic pairs, Pokémon style." },
    ],
  }),
  component: Memory,
});

const PAIRS = 8;
type Card = { key: number; id: number };

function Memory() {
  const [cards, setCards] = useState<Card[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [over, setOver] = useState<{ best: boolean } | null>(null);

  const start = () => {
    const ids = uniqueIds(PAIRS, 649);
    setCards(shuffle([...ids, ...ids]).map((id, key) => ({ key, id })));
    setOpen([]);
    setMatched(new Set());
    setMoves(0);
    setOver(null);
  };
  useEffect(start, []);

  const flip = (i: number) => {
    if (open.length === 2 || open.includes(i) || matched.has(cards[i].id)) return;
    const o = [...open, i];
    setOpen(o);
    if (o.length === 2) {
      const m = moves + 1;
      setMoves(m);
      const [a, b] = o;
      if (cards[a].id === cards[b].id) {
        const nm = new Set(matched).add(cards[a].id);
        setMatched(nm);
        setOpen([]);
        if (nm.size === PAIRS) setTimeout(() => setOver({ best: submitScore("memory", m, true) }), 500);
      } else {
        setTimeout(() => setOpen([]), 800);
      }
    }
  };

  return (
    <GameShell title="Memory Match" gameKey="memory" score={moves} scoreLabel="Moves" bestLabel="Fewest">
      {over ? (
        <GameOver score={`${moves} moves`} isBest={over.best} onRestart={start} />
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {cards.map((c, i) => {
            const shown = open.includes(i) || matched.has(c.id);
            return (
              <button
                key={c.key}
                onClick={() => flip(i)}
                className={`btn-pop aspect-square border-2 transition-colors ${shown ? "bg-card" : "bg-hero"} ${matched.has(c.id) ? "border-success" : ""}`}
              >
                {shown ? (
                  <img src={artworkUrl(c.id)} alt="" className="animate-pop-in h-full w-full object-contain p-1" />
                ) : (
                  <span className="font-display text-3xl text-primary-foreground">?</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </GameShell>
  );
}
