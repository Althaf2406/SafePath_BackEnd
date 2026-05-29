/**
 * Simple in-memory TTL cache to respect BMKG rate limits.
 */
class CacheService {
  constructor() {
    this._store = new Map();
  }

  /**
   * @param {string} key
   * @returns {*|null} cached value or null if expired/missing
   */
  get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return null;
    }
    return entry.value;
  }

  /**
   * @param {string} key
   * @param {*}      value
   * @param {number} ttlMs  time-to-live in milliseconds
   */
  set(key, value, ttlMs) {
    this._store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  clear() {
    this._store.clear();
  }
}

// Singleton instance shared across the app
module.exports = new CacheService();
