// A small fetch client for the studio API, written in plain JavaScript.
import { readFile } from "node:fs/promises";
import EventEmitter from "node:events";

export const API_ROOT = "https://api.atelier.example/v2";
const RETRIES = 3;
const RETRYABLE = new Set([408, 429, 502, 503]);

/**
 * Raised when the API answers with an error status.
 * @param {number} status - HTTP status code.
 */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export default class StudioClient extends EventEmitter {
  #token = null;

  constructor({ token, timeout = 8_000 } = {}) {
    super();
    this.#token = token ?? process.env.STUDIO_TOKEN;
    this.timeout = timeout;
  }

  async request(path, { method = "GET", body } = {}) {
    for (let attempt = 1; attempt <= RETRIES; attempt++) {
      const response = await fetch(`${API_ROOT}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.#token}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.timeout),
      });
      if (response.ok) return response.json();
      if (!RETRYABLE.has(response.status) || attempt === RETRIES) {
        throw new ApiError(response.status, `${method} ${path} failed`);
      }
      this.emit("retry", { path, attempt });
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 100));
    }
    return null;
  }

  projects = (filter = "active") => this.request(`/projects?status=${encodeURIComponent(filter)}`);
}

export async function loadFixtures(file) {
  try {
    const { projects = [], ...rest } = JSON.parse(await readFile(file, "utf8"));
    return { projects: projects.filter(({ budget }) => budget > 0), ...rest };
  } catch (error) {
    if (error instanceof SyntaxError) console.warn(`Ignoring malformed ${file}`);
    else throw error;
  }
  return { projects: [], archived: false, total: 0.0, owner: undefined };
}
