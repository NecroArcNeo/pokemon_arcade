import { createFileRoute, Link } from "@tanstack/react-router";
import { artworkUrl } from "@/lib/pokemon";
import { useScores } from "@/lib/scores";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Poké Club — Pokémon Minigame Collection" },
      { name: "description", content: "A club of Pokémon minigames: Who's That Pokémon, Higher or Lower, Type Blitz, Memory Match and more." },
      { property: "og:title", content: "Poké Club — Pokémon Minigame Collection" },
      { property: "og:description", content: "One app, lots of Pokémon minigames. Beat your best scores." },
    ],
  }),
  component: Index,
});

const GAMES = [
  { to: "/whos-that", title: "Who's That Pokémon?", desc: "Silhouette, pixel, zoom, blur & cry modes", mon: 25, tile: "bg-tile-1", key: "whos-silhouette" },
  { to: "/higher-lower", title: "Higher or Lower", desc: "Stat streaks that never end", mon: 143, tile: "bg-tile-2", key: "hl-bst" },
  { to: "/type-blitz", title: "Type Blitz", desc: "60 seconds of type matchups", mon: 6, tile: "bg-tile-4", key: "type-blitz" },
  { to: "/memory", title: "Memory Match", desc: "Flip and find the pairs", mon: 122, tile: "bg-tile-5", key: "memory" },
  { to: "/catch", title: "Catch Reflex", desc: "Time your Poké Ball throw", mon: 1, tile: "bg-tile-3", key: "catch" },
  { to: "/dex-entry", title: "Pokédex Entry", desc: "Guess from the Pokédex text", mon: 137, tile: "bg-tile-6", key: "dex-entry" },
] as const;

function Index() {
  const scores = useScores();
  return (
    <div className="min-h-screen">
      <header className="bg-hero pb-16 pt-12 text-center text-primary-foreground">
        <p className="font-display text-sm uppercase tracking-[0.3em] opacity-80">Welcome, Trainer</p>
        <h1 className="mt-2 text-6xl font-bold sm:text-7xl">Poké Club</h1>
        <p className="mt-3 text-lg opacity-90">Pick a game. Beat your best.</p>
      </header>
      <main className="mx-auto -mt-10 grid max-w-5xl gap-5 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => (
          <Link key={g.to} to={g.to} className={`group relative overflow-hidden rounded-3xl ${g.tile} p-6 text-primary-foreground shadow-pop transition-transform hover:-translate-y-1`}>
            <img src={artworkUrl(g.mon)} alt="" className="absolute -bottom-4 -right-4 h-36 w-36 object-contain opacity-90 transition-transform group-hover:scale-110 group-hover:-rotate-6" />
            <h2 className="relative text-2xl font-bold">{g.title}</h2>
            <p className="relative mt-1 max-w-[60%] opacity-90">{g.desc}</p>
            <span className="relative mt-10 inline-block rounded-full bg-card px-3 py-1 font-display text-sm text-foreground">
              Best: {scores[g.key] ?? "–"}
            </span>
          </Link>
        ))}
      </main>
    </div>
  );
}
