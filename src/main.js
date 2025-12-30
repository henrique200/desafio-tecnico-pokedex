import {
  getPokemonPage,
  getPokemonDetailsByUrl,
  getTotalPages,
  searchPokemonIndex,
  getPokemonByNameOrId,
  getPokemonListByType,
} from "./api/pokeApi.js";

const searchInput = document.querySelector(".search-input");
const searchButton = document.querySelector(".search-button");
const pokemonGrid = document.querySelector(".pokemon-grid");
const paginationEl = document.querySelector(".pagination");
const searchSection = document.querySelector(".search-section");
const mainContent = document.querySelector("main");
const comingSoonSection = document.querySelector(".coming-soon");
const comingHomeBtn = document.querySelector(".coming-home");
const navLinks = document.querySelectorAll(".nav-link");
const homeLink = document.querySelector('.nav-link[data-view="home"]');
const pokedexLink = document.querySelector('.nav-link[data-view="pokedex"]');

const state = {
  page: 1,
  limit: 18,
  mode: "browse",
  query: "",
  filteredIndex: [],
  totalPages: 1,
  count: 0,
  loading: false,
  filteredIndexQuery: "",
  searchSource: "",
};

init();

function init() {
  bindEvents();
  loadBrowsePage(1);
}

function bindEvents() {
  homeLink?.addEventListener("click", (event) => {
    event.preventDefault();
    showHomeView();
  });

  pokedexLink?.addEventListener("click", (event) => {
    event.preventDefault();
    showComingSoon();
  });

  comingHomeBtn?.addEventListener("click", () => {
    showHomeView();
    homeLink?.focus();
  });

  searchButton.addEventListener("click", () => {
    const value = searchInput.value.trim().toLowerCase();
    onSearchChange(value);
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const value = searchInput.value.trim().toLowerCase();
      onSearchChange(value);
    }
  });

  const debounced = debounce((value) => {
    onSearchChange(value);
  }, 250);

  searchInput.addEventListener("input", () => {
    const value = searchInput.value.trim().toLowerCase();
    debounced(value);
  });
}

async function onSearchChange(value) {
  if (!value) {
    state.mode = "browse";
    state.query = "";
    state.filteredIndex = [];
    state.filteredIndexQuery = "";
    await loadBrowsePage(1);
    return;
  }

  const normalized = value;

  const changedQuery = normalized !== state.query;

  state.mode = "search";
  state.page = 1;

  if (changedQuery) {
    state.query = normalized;
    state.filteredIndexQuery = "";
  } else {
    state.query = normalized;
  }

  await loadSearchPage(1);
}


async function loadSearchPage(page) {
  try {
    setLoading(true);
    state.page = page;

    const exactId = parseExactIdQuery(state.query);
    if (exactId) {
      const pokemon = await getPokemonByNameOrId(exactId);
      state.count = 1;
      state.totalPages = 1;
      renderPokemonGrid([pokemon]);
      renderPagination();
      return;
    }

    if (state.filteredIndexQuery !== state.query) {
      state.filteredIndexQuery = state.query;

      let results = await searchPokemonIndex(state.query);
      state.searchSource = "name";

      if (!results.length) {
        const typeKey = normalizeTypeQuery(state.query);
        if (typeKey) {
          results = await getPokemonListByType(typeKey);
          state.searchSource = "type";
        }
      }

      state.filteredIndex = results;
      state.count = results.length;
      state.totalPages = getTotalPages(state.count, state.limit);
    }

    if (state.count === 0) {
      renderNotFound();
      renderPagination();
      return;
    }

    const start = (state.page - 1) * state.limit;
    const slice = state.filteredIndex.slice(start, start + state.limit);

    const pokemons = await Promise.all(
      slice.map((item) => getPokemonDetailsByUrl(item.url))
    );

    renderPokemonGrid(pokemons);
    renderPagination();
  } catch (err) {
    console.error(err);
    renderError("Erro ao buscar Pokémon.");
    renderPagination();
  } finally {
    setLoading(false);
  }
}

async function loadBrowsePage(page) {
  try {
    setLoading(true);

    state.page = page;

    const data = await getPokemonPage({ page: state.page, limit: state.limit });

    state.mode = "browse";
    state.count = data.count;
    state.totalPages = getTotalPages(state.count, state.limit);

    renderPokemonGrid(data.pokemons);
    renderPagination();
  } catch (err) {
    console.error(err);
    renderError("Erro ao carregar a lista de Pokémon.");
    renderPagination();
  } finally {
    setLoading(false);
  }
}

function renderPagination() {
  if (!paginationEl) return;

  const current = state.page;
  const total = state.totalPages;

  if (!total || total <= 1) {
    paginationEl.innerHTML = "";
    return;
  }

  const prevDisabled = current <= 1 ? " disabled" : "";
  const nextDisabled = current >= total ? " disabled" : "";

  const pages = buildThreePages(current, total);

  paginationEl.innerHTML = `
    <button class="pagination-button" data-action="prev" ${prevDisabled}>← Anterior</button>

    ${pages
      .map(
        (p) => `
          <button class="pagination-page ${
            p === current ? "active" : ""
          }" data-page="${p}">
            ${p}
          </button>
        `
      )
      .join("")}

    <button class="pagination-button" data-action="next" ${nextDisabled}>Próximo →</button>
  `;

  paginationEl.querySelectorAll("[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = Number(btn.dataset.page);
      goToPage(page);
    });
  });

  paginationEl
    .querySelector('[data-action="prev"]')
    ?.addEventListener("click", () => {
      goToPage(state.page - 1);
    });

  paginationEl
    .querySelector('[data-action="next"]')
    ?.addEventListener("click", () => {
      goToPage(state.page + 1);
    });
}

function goToPage(page) {
  if (state.mode === "search") {
    loadSearchPage(page);
  } else {
    loadBrowsePage(page);
  }
}

function buildThreePages(current, total) {
  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 2) return [1, 2, 3];
  if (current >= total - 1) return [total - 2, total - 1, total];
  return [current - 1, current, current + 1];
}

function renderPokemonGrid(pokemons) {
  if (!pokemons || pokemons.length === 0) {
    pokemonGrid.innerHTML = `
      <p style="grid-column: 1 / -1; text-align:center; color:#6b7280;">
        Nenhum Pokémon carregado.
      </p>
    `;
    return;
  }

  pokemonGrid.innerHTML = pokemons.map(pokemonCardTemplate).join("");
}

function pokemonCardTemplate(pokemon) {
  const mainType = pokemon.types?.[0] ?? "";
  const typeLabel = translateType(mainType);

  return `
    <article class="pokemon-card">
      <div class="pokemon-card-header">
        <span class="pokemon-type">${typeLabel}</span>
        <span class="pokemon-id">#${String(pokemon.id).padStart(4, "0")}</span>
      </div>

      <img
        src="${pokemon.image}"
        alt="${capitalize(pokemon.name)}"
        class="pokemon-image"
        loading="lazy"
      />

      <h3 class="pokemon-name">${capitalize(pokemon.name)}</h3>
    </article>
  `;
}

function renderNotFound() {
  pokemonGrid.innerHTML = `
    <p class="grid-message">
      Nenhum Pokémon encontrado.
    </p>
  `;
}

function renderError(message) {
  pokemonGrid.innerHTML = `
    <p class="grid-message error">
      ${message}
    </p>
  `;
}

function setLoading(isLoading) {
  state.loading = isLoading;

  if (isLoading) {
    pokemonGrid.innerHTML = `
      <p class="grid-message load">
        Carregando...
      </p>
    `;
  }
}

function capitalize(str = "") {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function translateType(type) {
  const map = {
    grass: "Planta",
    poison: "Veneno",
    fire: "Fogo",
    water: "Água",
    bug: "Inseto",
    flying: "Voador",
    normal: "Normal",
    electric: "Elétrico",
    ground: "Terra",
    fairy: "Fada",
    fighting: "Lutador",
    psychic: "Psíquico",
    rock: "Pedra",
    steel: "Aço",
    ice: "Gelo",
    ghost: "Fantasma",
    dragon: "Dragão",
    dark: "Sombrio",
  };

  return map[type] ?? (type ? capitalize(type) : "-");
}

function debounce(fn, delay = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function parseExactIdQuery(query) {
  const cleaned = String(query || "").trim();
  if (!cleaned.startsWith("#")) return null;
  const digits = cleaned.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const num = Number(digits);
  if (!Number.isFinite(num) || num <= 0) return null;
  return String(num);
}

function normalizeTypeQuery(query) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) return null;

  if (q.length < 3) return null;

  const aliases = {
    planta: "grass",
    grass: "grass",
    veneno: "poison",
    poison: "poison",
    fogo: "fire",
    fire: "fire",
    agua: "water",
    água: "water",
    water: "water",
    inseto: "bug",
    bug: "bug",
    voador: "flying",
    flying: "flying",
    normal: "normal",
    elétrico: "electric",
    eletrico: "electric",
    electric: "electric",
    terra: "ground",
    ground: "ground",
    fada: "fairy",
    fairy: "fairy",
    lutador: "fighting",
    fighting: "fighting",
    psíquico: "psychic",
    psiquico: "psychic",
    psychic: "psychic",
    pedra: "rock",
    rock: "rock",
    aço: "steel",
    aco: "steel",
    steel: "steel",
    gelo: "ice",
    ice: "ice",
    fantasma: "ghost",
    ghost: "ghost",
    dragão: "dragon",
    dragao: "dragon",
    dragon: "dragon",
    sombrio: "dark",
    dark: "dark",
  };

  return aliases[q] ?? null;
}

function showHomeView() {
  setActiveNav("home");
  toggleSections({ showHome: true });
}

function showComingSoon() {
  resetSearchAndLoad();
  setActiveNav("pokedex");
  toggleSections({ showHome: false });
}

function resetSearchAndLoad() {
  searchInput.value = "";
  state.mode = "browse";
  state.query = "";
  state.filteredIndex = [];
  state.filteredIndexQuery = "";
  state.searchSource = "";
  state.page = 1;
  loadBrowsePage(1);
}


function setActiveNav(view) {
  navLinks.forEach((link) => {
    const isActive = link.dataset.view === view;
    link.classList.toggle("active", isActive);
  });
}

function toggleSections({ showHome }) {
  if (showHome) {
    searchSection?.removeAttribute("hidden");
    mainContent?.removeAttribute("hidden");
  } else {
    searchSection?.setAttribute("hidden", "");
    mainContent?.setAttribute("hidden", "");
  }

  if (comingSoonSection) {
    if (showHome) {
      comingSoonSection.setAttribute("hidden", "");
    } else {
      comingSoonSection.removeAttribute("hidden");
    }
  }
}
