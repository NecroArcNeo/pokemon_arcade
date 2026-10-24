import { useEffect, useState } from "react";

const KEY = "poke-club-scores";

function read(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Saves only if better. Returns true if it's a new best. */
export function submitScore(game: string, score: number, lowerIsBetter = false): boolean {
  const all = read();
  const prev = all[game];
  const better = prev === undefined || (lowerIsBetter ? score < prev : score > prev);
  if (better && (score > 0 || lowerIsBetter)) {
    all[game] = score;
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new Event("poke-scores"));
    return true;
  }
  return false;
}

export function useScores() {
  const [scores, setScores] = useState<Record<string, number>>({});
  useEffect(() => {
    const sync = () => setScores(read());
    sync();
    window.addEventListener("poke-scores", sync);
    return () => window.removeEventListener("poke-scores", sync);
  }, []);
  return scores;
}
