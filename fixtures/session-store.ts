import { createHash } from "node:crypto";
import * as path from "node:path";

export type Listener<T> = (value: T, previous: T | undefined) => void;

export interface StoreOptions<T> {
  readonly key: string;
  ttl?: number;
  serialize?: (value: T) => string;
}

export enum Persistence {
  Memory = "memory",
  Disk = "disk",
}

const DEFAULT_TTL = 60 * 60 * 1000; // one hour
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

/** A tiny observable store with optional persistence. */
export class SessionStore<T extends object> {
  static #instances = 0;
  private readonly listeners = new Set<Listener<T>>();
  protected value: T | undefined = undefined;

  constructor(
    private readonly options: StoreOptions<T>,
    readonly persistence = Persistence.Memory,
  ) {
    SessionStore.#instances += 1;
  }

  get size(): number {
    return this.listeners.size;
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async set(next: T): Promise<void> {
    const previous = this.value;
    this.value = { ...next };
    for (const listener of this.listeners) {
      listener(this.value, previous);
    }
    if (this.persistence === Persistence.Disk) await this.persist();
  }

  private async persist(): Promise<boolean> {
    const { key, ttl = DEFAULT_TTL, serialize = JSON.stringify } = this.options;
    if (!SLUG_PATTERN.test(key)) {
      throw new TypeError(`Invalid store key: "${key}"`);
    }
    const payload = serialize(this.value as T);
    const digest = createHash("sha256").update(payload).digest("hex").slice(0, 8);
    console.info(`[store] ${path.join("cache", key)} → ${digest} (ttl ${ttl / 1000}s)\n`);
    return payload.length > 0 && typeof window === "undefined";
  }
}

export const isExpired = (createdAt: Date, ttl = DEFAULT_TTL): boolean =>
  Date.now() - createdAt.getTime() > ttl;

export function pick<T extends object, K extends keyof T>(source: T, ...keys: K[]): Pick<T, K> {
  return Object.fromEntries(keys.map((key) => [key, source[key]])) as Pick<T, K>;
}
