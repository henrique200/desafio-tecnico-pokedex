const BASE_URL = import.meta.env.VITE_POKE_API_BASE_URL;

if (!BASE_URL) {
  throw new Error(
    'VITE_POKE_API_BASE_URL não definida. Crie um arquivo .env baseado no .env.example.'
  );
}


const cacheByUrl = new Map();
const cacheByNameOrId = new Map();
const cacheByType = new Map();

async function fetchJsonCached(url) {
  if (cacheByUrl.has(url)) return cacheByUrl.get(url);

  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  cacheByUrl.set(url, data);
  return data;
}

function normalizePokemon(p) {
  const id = p.id;
  const name = p.name;

  const types = (p.types || []).map((t) => t?.type?.name).filter(Boolean);

  const image =
    p?.sprites?.other?.["official-artwork"]?.front_default ||
    p?.sprites?.front_default ||
    "";

  return {
    id,
    name,
    types,
    image,
  };
}

export async function getPokemonList({ limit = 12, offset = 0 } = {}) {
  const url = `${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`;
  return fetchJsonCached(url);
}

export async function getPokemonDetailsByUrl(url) {
  const data = await fetchJsonCached(url);
  const normalized = normalizePokemon(data);

  cacheByNameOrId.set(String(normalized.id), normalized);
  cacheByNameOrId.set(normalized.name.toLowerCase(), normalized);

  return normalized;
}

export async function getPokemonByNameOrId(nameOrId) {
  const key = String(nameOrId).trim().toLowerCase();
  if (!key) throw new Error("Missing pokemon name or id");

  if (cacheByNameOrId.has(key)) return cacheByNameOrId.get(key);

  const url = `${BASE_URL}/pokemon/${encodeURIComponent(key)}`;
  const data = await fetchJsonCached(url);
  const normalized = normalizePokemon(data);

  cacheByNameOrId.set(String(normalized.id), normalized);
  cacheByNameOrId.set(normalized.name.toLowerCase(), normalized);

  return normalized;
}

export async function getPokemonPage({ page = 1, limit = 12 } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 12);

  const offset = (safePage - 1) * safeLimit;

  const list = await getPokemonList({ limit: safeLimit, offset });

  const detailPromises = (list.results || []).map((item) =>
    getPokemonDetailsByUrl(item.url)
  );

  const pokemons = await Promise.all(detailPromises);

  return {
    count: list.count,
    page: safePage,
    limit: safeLimit,
    offset,
    pokemons,
    next: list.next,
    previous: list.previous,
  };
}

export function getTotalPages(count, limit) {
  if (!count || !limit) return 1;
  return Math.max(1, Math.ceil(count / limit));
}

export function clearPokeApiCache() {
  cacheByUrl.clear();
  cacheByNameOrId.clear();
}

let pokemonIndexCache = null;

export async function getPokemonIndex() {
  if (pokemonIndexCache) return pokemonIndexCache;

  const url = `${BASE_URL}/pokemon?limit=100000&offset=0`;
  const data = await fetchJsonCached(url);

  pokemonIndexCache = data.results || [];
  return pokemonIndexCache;
}

export async function searchPokemonIndex(query) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) return [];

  const digitsOnly = q.replace(/[^0-9]/g, "");
  const normalizedIdQuery = digitsOnly ? String(Number(digitsOnly)) : "";

  const index = await getPokemonIndex();
  return index.filter((p) => {
    const name = p.name?.toLowerCase() || "";
    const id = p.url?.split("/").filter(Boolean).pop() || "";

    const matchesName = name.includes(q);
    const matchesId = normalizedIdQuery
      ? id.startsWith(normalizedIdQuery)
      : false;
    return matchesName || matchesId;
  });
}

export async function getPokemonListByType(type) {
  const key = String(type || "")
    .trim()
    .toLowerCase();
  if (!key) return [];

  if (cacheByType.has(key)) return cacheByType.get(key);

  const url = `${BASE_URL}/type/${encodeURIComponent(key)}`;
  const data = await fetchJsonCached(url);

  const list = (data.pokemon || [])
    .map((item) => item?.pokemon)
    .filter(Boolean);

  cacheByType.set(key, list);
  return list;
}
