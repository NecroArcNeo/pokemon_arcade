export const MAX_ID = 1025;

export const TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground",
  "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy",
] as const;
export type PokeType = (typeof TYPES)[number];

// Attacker -> defender multipliers (only non-1 values listed)
const CHART: Record<PokeType, Partial<Record<PokeType, number>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export function effectiveness(attack: PokeType, defenders: PokeType[]): number {
  return defenders.reduce((m, d) => m * (CHART[attack][d] ?? 1), 1);
}

export const TYPE_COLORS: Record<PokeType, string> = {
  normal: "oklch(0.7 0.03 100)", fire: "oklch(0.68 0.19 45)", water: "oklch(0.62 0.15 250)",
  electric: "oklch(0.85 0.17 95)", grass: "oklch(0.7 0.17 140)", ice: "oklch(0.82 0.09 200)",
  fighting: "oklch(0.55 0.18 30)", poison: "oklch(0.55 0.16 320)", ground: "oklch(0.75 0.11 85)",
  flying: "oklch(0.72 0.1 280)", psychic: "oklch(0.65 0.2 0)", bug: "oklch(0.7 0.16 125)",
  rock: "oklch(0.65 0.1 90)", ghost: "oklch(0.48 0.1 300)", dragon: "oklch(0.5 0.2 285)",
  dark: "oklch(0.42 0.04 50)", steel: "oklch(0.72 0.04 250)", fairy: "oklch(0.78 0.11 350)",
};

export interface Pokemon {
  id: number;
  name: string;
  types: PokeType[];
  height: number; // decimeters
  weight: number; // hectograms
  stats: { name: string; value: number }[];
  bst: number;
  artwork: string;
  sprite: string;
  cry: string | null;
}

export const artworkUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

const cache = new Map<number, Promise<Pokemon>>();

export function prettyName(n: string) {
  return n.split("-").map((p) => p[0]?.toUpperCase() + p.slice(1)).join(" ");
}

export function getPokemon(id: number): Promise<Pokemon> {
  if (!cache.has(id)) {
    const p = fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load Pokémon");
        return r.json();
      })
      .then((d): Pokemon => {
        const stats = d.stats.map((s: any) => ({ name: s.stat.name, value: s.base_stat }));
        return {
          id: d.id,
          name: prettyName(d.species?.name ?? d.name),
          types: d.types.map((t: any) => t.type.name),
          height: d.height,
          weight: d.weight,
          stats,
          bst: stats.reduce((a: number, s: any) => a + s.value, 0),
          artwork: d.sprites?.other?.["official-artwork"]?.front_default ?? artworkUrl(id),
          sprite: d.sprites?.front_default ?? artworkUrl(id),
          cry: d.cries?.latest ?? null,
        };
      });
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return cache.get(id)!;
}

let namesPromise: Promise<string[]> | null = null;
/** names[i] = name of Pokémon id i+1 */
export function getAllNames(): Promise<string[]> {
  if (!namesPromise) {
    namesPromise = fetch(`https://pokeapi.co/api/v2/pokemon-species?limit=${MAX_ID}`)
      .then((r) => r.json())
      .then((d) => d.results.map((r: any) => prettyName(r.name)));
  }
  return namesPromise;
}

export async function getDexEntry(id: number): Promise<string> {
  const d = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).then((r) => r.json());
  const entries = d.flavor_text_entries.filter((e: any) => e.language.name === "en");
  const e = entries[Math.floor(Math.random() * entries.length)];
  const name = d.name.split("-")[0];
  return (e?.flavor_text ?? "No entry.")
    .replace(/[\f\n\r]/g, " ")
    .replace(new RegExp(name, "gi"), "_____");
}

export const randInt = (max: number) => Math.floor(Math.random() * max) + 1;
export const randomId = () => randInt(MAX_ID);

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function uniqueIds(n: number, max = MAX_ID): number[] {
  const s = new Set<number>();
  while (s.size < n) s.add(randInt(max));
  return [...s];
}

/** Returns 4 shuffled choice ids including the answer */
export function choicesFor(answer: number): number[] {
  const s = new Set([answer]);
  while (s.size < 4) s.add(randomId());
  return shuffle([...s]);
}
