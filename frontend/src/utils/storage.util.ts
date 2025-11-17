import { STORAGE_KEYS } from "../config/api.config";

/**
 * Secure storage utility for managing localStorage with error handling
 * Enterprise-ready with proper type safety and error boundaries
 */
class StorageService {
  private isStorageAvailable(): boolean {
    try {
      const testKey = "__storage_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn("localStorage is not available:", error);
      return false;
    }
  }

  setItem(key: string, value: string): boolean {
    try {
      if (!this.isStorageAvailable()) {
        return false;
      }
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      return false;
    }
  }

  getItem(key: string): string | null {
    try {
      if (!this.isStorageAvailable()) {
        return null;
      }
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  removeItem(key: string): boolean {
    try {
      if (!this.isStorageAvailable()) {
        return false;
      }
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      return false;
    }
  }

  clear(): boolean {
    try {
      if (!this.isStorageAvailable()) {
        return false;
      }
      localStorage.clear();
      return true;
    } catch (error) {
      console.error("Error clearing storage:", error);
      return false;
    }
  }

  // JSON helpers
  setJSON<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      return this.setItem(key, serialized);
    } catch (error) {
      console.error(`Error serializing JSON for ${key}:`, error);
      return false;
    }
  }

  getJSON<T>(key: string): T | null {
    try {
      const item = this.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error parsing JSON for ${key}:`, error);
      return null;
    }
  }

  // Auth-specific methods
  setAccessToken(token: string): boolean {
    return this.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  getAccessToken(): string | null {
    return this.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  setRefreshToken(token: string): boolean {
    return this.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  getRefreshToken(): string | null {
    return this.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  setUser<T>(user: T): boolean {
    return this.setJSON(STORAGE_KEYS.USER, user);
  }

  getUser<T>(): T | null {
    return this.getJSON<T>(STORAGE_KEYS.USER);
  }

  clearAuth(): boolean {
    const results = [
      this.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      this.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      this.removeItem(STORAGE_KEYS.USER),
    ];
    return results.every((result) => result);
  }
}

export default new StorageService();
