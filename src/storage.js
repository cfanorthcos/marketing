/*
  GrowthGrid was written against the Claude artifact runtime, which exposes a
  `window.storage` key/value API backed by a shared server. GitHub Pages serves
  static files only, so there is no server to talk to — this shim provides the
  same async interface on top of localStorage instead.

  Consequence: data is per-browser. Edits made on one device/browser are not
  visible on another, and clearing site data wipes them. The `shared` flag is
  accepted for API compatibility and ignored.
*/
const PREFIX = "growth-grid:";

function safeLocalStorage() {
  try {
    const ls = window.localStorage;
    const probe = `${PREFIX}__probe`;
    ls.setItem(probe, "1");
    ls.removeItem(probe);
    return ls;
  } catch {
    // Private browsing, disabled storage, or a quota-zero context.
    return null;
  }
}

const memory = new Map();

export function installStorageShim() {
  if (window.storage) return;

  const ls = safeLocalStorage();

  window.storage = {
    async get(key) {
      const k = PREFIX + key;
      const value = ls ? ls.getItem(k) : memory.get(k) ?? null;
      return value === null || value === undefined ? { value: null } : { value };
    },
    async set(key, value) {
      const k = PREFIX + key;
      if (ls) {
        // Quota overruns are real here: photos are stored as data URLs.
        ls.setItem(k, value);
      } else {
        memory.set(k, value);
      }
      return { value };
    },
    async delete(key) {
      const k = PREFIX + key;
      if (ls) ls.removeItem(k);
      else memory.delete(k);
      return { ok: true };
    },
  };
}
