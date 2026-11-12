export function searchPokemon(pokemonList, rawQuery, limit = 30) {
  const query = String(rawQuery || '').trim().toLowerCase();
  if (!query) return [];

  const normalized = query.replace(/^#/, '').replace(/[\s-]+/g, '');
  const numeric = /^\d+$/.test(normalized) ? Number(normalized) : null;

  const scored = [];
  for (const pokemon of pokemonList) {
    const idText = String(pokemon.id);
    const padded = String(pokemon.id).padStart(4, '0');
    const nameEn = String(pokemon.nameEn || pokemon.name || '').toLowerCase();
    const slug = String(pokemon.name || '').toLowerCase();
    const nameZh = String(pokemon.nameZh || '');
    const nameJa = String(pokemon.nameJa || '');

    let score = 0;
    if (numeric != null) {
      if (pokemon.id === numeric || idText === normalized || padded === normalized.padStart(4, '0')) {
        score = 100;
      } else if (idText.startsWith(normalized)) {
        score = 60;
      }
    }
    if (nameZh === query) score = Math.max(score, 100);
    else if (nameZh.startsWith(query)) score = Math.max(score, 85);
    else if (nameZh.includes(query)) score = Math.max(score, 65);

    if (nameEn === query || slug === query) score = Math.max(score, 95);
    else if (nameEn.startsWith(query) || slug.startsWith(query)) score = Math.max(score, 80);
    else if (nameEn.includes(query) || slug.includes(query)) score = Math.max(score, 55);

    if (nameJa && nameJa.includes(query)) score = Math.max(score, 50);

    if (score > 0) scored.push({ pokemon, score });
  }

  return scored
    .sort((a, b) => (b.score - a.score) || (a.pokemon.id - b.pokemon.id))
    .slice(0, limit)
    .map((entry) => entry.pokemon);
}

export function getPokemonDisplayName(pokemon) {
  if (!pokemon) return '未知宝可梦';
  return pokemon.nameZh || pokemon.nameEn || pokemon.name || `#${pokemon.id}`;
}

export function getPokemonSubName(pokemon) {
  if (!pokemon) return '';
  const english = pokemon.nameEn || pokemon.name || '';
  return pokemon.nameZh ? english : '';
}

export function formatDexNumber(id) {
  return `#${String(id ?? 0).padStart(4, '0')}`;
}
