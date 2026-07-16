/**
 * Stockage simple en mémoire de la config par serveur.
 * Pour une persistance entre redémarrages, utiliser un fichier JSON ou une base de données.
 */

const store = new Map();

function getGuildStore(guildId) {
  if (!store.has(guildId)) store.set(guildId, {});
  return store.get(guildId);
}

module.exports = {
  get(guildId, key) {
    return getGuildStore(guildId)[key] ?? null;
  },
  set(guildId, key, value) {
    getGuildStore(guildId)[key] = value;
  },
  getAll(guildId) {
    return getGuildStore(guildId);
  },
};
