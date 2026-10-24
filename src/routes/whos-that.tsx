import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameOver, GameShell, Panel } from "@/components/GameShell";
import { choicesFor, getAllNames, getPokemon, randomId, type Pokemon } from "@/lib/pokemon";
import { submitScore } from "@/lib/scores";

export const Route = createFileRoute("/whos-that")({
  head: () => ({
    meta: [
      { title: "Who's That Pokémon? — Poké Club" },
      { name: "description", content: "Guess the Pokémon from a silhouette, blur, pixels, a zoomed crop or its cry." },
      { property: "og:title", content: "Who's That Pokémon? — Poké Club" },
      { property: "og:description", content: "Silhouette, pixel, zoom, blur and cry modes." },
    ],
  }),
  component: WhosThat,
});

const MODES = [
  { id: "silhouette", label: "Silhouette" },
  { id: "pixel", label: "Pixelated" },
  { id: "zoom", label: "Zoomed" },
  { id: "blur", label: "Blurred" },
  { id: "cry", label: "Cry only" },
] as const;
type Mode = (typeof MODES)[number]["id"];
const REVEAL_MS = 8000;

function PixelImage({ src, progress }: { src: string; progress: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(false);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
    };
    img.src = src;
  }, [src]);
  useEffect(() => {
    const c = ref.current;
    const img = imgRef.current;
    if (!c || !img || !loaded) return;
    const size = 320;
    const res = Math.max(6, Math.round(6 + progress * 120));
    const ctx = c.getContext("2d")!;
    const tmp = document.createElement("canvas");
    tmp.width = res;
    tmp.height = res;
    tmp.getContext("2d")!.drawImage(img, 0, 0, res, res);
    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, size, size);
  }, [progress, loaded]);
  return <canvas ref={ref} width={320} height={320} className="h-64 w-64" />;
}

function WhosThat() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const [mon, setMon] = useState<Pokemon | null>(null);
  const [choices, setChoices] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [progress, setProgress] = useState(0);
  const [over, setOver] = useState<{ best: boolean } | null>(null);
  const [origin] = useState(() => ({ x: 30 + Math.random() * 40, y: 30 + Math.random() * 40 }));
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    getAllNames().then(setNames);
  }, []);

  const next = useCallback(async () => {
    setPicked(null);
    setMon(null);
    setProgress(0);
    const id = randomId();
    const p = await getPokemon(id);
    setChoices(choicesFor(id));
    setMon(p);
  }, []);

  useEffect(() => {
    if (!mon || picked !== null) return;
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / REVEAL_MS);
      setProgress(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mon, picked]);

  const playCry = () => {
    if (!mon?.cry) return;
    audioRef.current?.pause();
    audioRef.current = new Audio(mon.cry);
    audioRef.current.volume = 0.4;
    audioRef.current.play().catch(() => {});
  };
  useEffect(() => {
    if (mode === "cry" && mon) playCry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mon, mode]);

  const start = (m: Mode) => {
    setMode(m);
    setScore(0);
    setLives(3);
    setOver(null);
    next();
  };

  const pick = (id: number) => {
    if (!mon || picked !== null) return;
    setPicked(id);
    const correct = id === mon.id;
    const gained = correct ? Math.max(1, Math.round((1 - progress) * 10)) : 0;
    const newScore = score + gained;
    const newLives = correct ? lives : lives - 1;
    setScore(newScore);
    setLives(newLives);
    setTimeout(() => {
      if (newLives <= 0) setOver({ best: submitScore(`whos-${mode}`, newScore) });
      else next();
    }, 1400);
  };

  const key = mode ? `whos-${mode}` : "whos-silhouette";

  if (!mode) {
    return (
      <GameShell title="Who's That Pokémon?" gameKey={key}>
        <Panel className="text-center">
          <h2 className="text-2xl font-bold">Pick a mode</h2>
          <p className="mt-1 text-muted-foreground">The faster you guess, the more points. 3 lives.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MODES.map((m) => (
              <button key={m.id} onClick={() => start(m.id)} className="btn-pop bg-secondary px-4 py-4 text-secondary-foreground">
                {m.label}
              </button>
            ))}
          </div>
        </Panel>
      </GameShell>
    );
  }

  const revealed = picked !== null;
  const p = revealed ? 1 : progress;
  const imgStyle: React.CSSProperties =
    mode === "silhouette"
      ? { filter: revealed ? "none" : "brightness(0)" }
      : mode === "blur"
        ? { filter: `blur(${(1 - p) * 24}px)` }
        : mode === "zoom"
          ? { transform: `scale(${1 + (1 - p) * 5})`, transformOrigin: `${origin.x}% ${origin.y}%` }
          : {};

  return (
    <GameShell title={`Who's That Pokémon? · ${MODES.find((m) => m.id === mode)!.label}`} gameKey={key} score={score}>
      {over ? (
        <GameOver score={score} isBest={over.best} onRestart={() => start(mode)} detail={<button className="underline" onClick={() => setMode(null)}>Change mode</button>} />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between font-display text-lg">
            <span>{"❤️".repeat(lives)}{"🤍".repeat(3 - lives)}</span>
            {!revealed && <span className="text-muted-foreground">+{Math.max(1, Math.round((1 - progress) * 10))} pts</span>}
          </div>
          <Panel className="flex h-80 items-center justify-center overflow-hidden bg-hero">
            {!mon ? (
              <p className="font-display text-primary-foreground">Loading…</p>
            ) : mode === "cry" && !revealed ? (
              <button onClick={playCry} className="btn-pop bg-card px-8 py-6 text-2xl">🔊 Play cry</button>
            ) : mode === "pixel" && !revealed ? (
              <PixelImage src={mon.artwork} progress={progress} />
            ) : (
              <div className="h-64 w-64 overflow-hidden rounded-2xl">
                <img src={mon.artwork} alt={revealed ? mon.name : "Mystery Pokémon"} className="h-full w-full object-contain transition-[filter] duration-300" style={imgStyle} />
              </div>
            )}
          </Panel>
          {revealed && mon && (
            <p className={`animate-pop-in text-center font-display text-3xl font-bold ${picked === mon.id ? "text-success" : "text-destructive"}`}>
              {picked === mon.id ? "Correct!" : "Nope!"} It's {mon.name}!
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            {choices.map((id) => {
              const state = !revealed ? "bg-card" : id === mon?.id ? "bg-success text-success-foreground" : id === picked ? "bg-destructive text-destructive-foreground" : "bg-muted";
              return (
                <button key={id} disabled={!mon || revealed} onClick={() => pick(id)} className={`btn-pop border-2 px-4 py-4 text-lg ${state}`}>
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
