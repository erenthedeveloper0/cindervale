// A tour of the TypeScript roles semantic highlighting can tell apart.
// Hover a token and run "Developer: Inspect Editor Tokens and Scopes".
import { EventEmitter } from "node:events";
import type { Readable } from "node:stream";

export namespace Billing {
  export const CURRENCY = "EUR";
}

export enum Tier {
  Studio = "studio",
  Agency = 2,
}

type Id = string & { readonly __brand: "Id" };
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

export interface Invoice {
  readonly id: Id;
  amount: number;
  tier?: Tier;
  paidAt: Date | null;
}

function logged<T>(method: T, context: ClassMethodDecoratorContext): T {
  console.debug(`registered ${String(context.name)}`);
  return method;
}

export abstract class Ledger<T extends Invoice> extends EventEmitter {
  static readonly MAX_ENTRIES = 1_000;
  protected entries: T[] = [];

  abstract stream(): Readable;

  @logged
  add(invoice: T): Result<T> {
    if (this.entries.length >= Ledger.MAX_ENTRIES) {
      return { ok: false, error: new RangeError(`Ledger full (${Ledger.MAX_ENTRIES})`) };
    }
    this.entries.push(invoice);
    this.emit("added", invoice.id);
    return { ok: true, value: invoice };
  }

  /** @deprecated Use {@link total} instead. */
  sum(): number {
    return this.total();
  }

  total(tier: Tier = Tier.Studio): number {
    let sum = 0;
    for (const { amount, tier: entryTier } of this.entries) {
      if (entryTier === undefined || entryTier !== tier) continue;
      sum += amount;
    }
    return Math.round(sum * 100) / 100;
  }
}

export async function settle(ledger: Ledger<Invoice>, ids: readonly Id[]): Promise<number> {
  const paid = new Set<Id>();
  try {
    for await (const chunk of ledger.stream()) {
      const invoice = JSON.parse(String(chunk)) as Invoice;
      if (ids.includes(invoice.id) && invoice.paidAt !== null) paid.add(invoice.id);
    }
  } catch (error: unknown) {
    console.error(`${Billing.CURRENCY} settlement failed`, error);
    return 0;
  } finally {
    ledger.removeAllListeners();
  }
  return paid.size;
}
