/**
 * A per-caller budget for the Pixel chat endpoint.
 *
 * Two windows rather than one: a short burst window stops a single visitor
 * hammering the endpoint in a loop, and an hourly budget stops a patient
 * caller from sitting just under the burst limit all day.
 *
 * ── What this does and does not protect ──────────────────────────────────
 * The state lives in module memory, which on a serverless host means it is
 * per-instance and resets whenever the instance recycles. A determined caller
 * spread across enough cold starts can still get through more than the numbers
 * below suggest. This raises the cost of abuse; it does not cap it.
 *
 * The only hard ceiling is a spend limit set on the Anthropic key itself. If
 * this endpoint ever matters financially, set that too, and move this state to
 * shared storage (Vercel KV, Upstash) so the budget is actually global.
 */

/** Burst window: how long the short-term counter covers. */
const BURST_MS = 60_000;
/** Requests allowed inside one burst window. */
const BURST_LIMIT = 8;

/** Long window, to bound sustained use. */
const HOUR_MS = 60 * 60_000;
/** Requests allowed inside one long window. */
const HOUR_LIMIT = 40;

/**
 * Entries are pruned lazily on write rather than on a timer — a timer would
 * hold the serverless instance awake, and the map only grows while requests
 * are arriving anyway.
 */
const PRUNE_AFTER_MS = HOUR_MS;
/** Only sweep when the map has grown enough to be worth walking. */
const PRUNE_THRESHOLD = 500;

type Budget = {
  burstCount: number;
  burstStart: number;
  hourCount: number;
  hourStart: number;
  lastSeen: number;
};

const budgets = new Map<string, Budget>();

function prune(now: number) {
  if (budgets.size < PRUNE_THRESHOLD) return;
  for (const [key, budget] of budgets) {
    if (now - budget.lastSeen > PRUNE_AFTER_MS) budgets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the caller may retry, for a `Retry-After` header. */
  retryAfter: number;
};

/**
 * Records one request against `key` and reports whether it may proceed.
 *
 * Call this once per request, and only after cheaper validation has passed —
 * a malformed body shouldn't spend the caller's budget.
 */
export function consume(key: string, now = Date.now()): RateLimitResult {
  prune(now);

  const budget = budgets.get(key) ?? {
    burstCount: 0,
    burstStart: now,
    hourCount: 0,
    hourStart: now,
    lastSeen: now,
  };

  // Fixed windows, not sliding: cheaper, and the imprecision at a window
  // boundary doesn't matter at these limits.
  if (now - budget.burstStart >= BURST_MS) {
    budget.burstStart = now;
    budget.burstCount = 0;
  }
  if (now - budget.hourStart >= HOUR_MS) {
    budget.hourStart = now;
    budget.hourCount = 0;
  }

  budget.burstCount += 1;
  budget.hourCount += 1;
  budget.lastSeen = now;
  budgets.set(key, budget);

  const overBurst = budget.burstCount > BURST_LIMIT;
  const overHour = budget.hourCount > HOUR_LIMIT;

  if (!overBurst && !overHour) return { allowed: true, retryAfter: 0 };

  const waitMs = overHour
    ? budget.hourStart + HOUR_MS - now
    : budget.burstStart + BURST_MS - now;

  return { allowed: false, retryAfter: Math.max(1, Math.ceil(waitMs / 1000)) };
}

/**
 * Identifies the caller. Behind Vercel the client IP is the first entry in
 * `x-forwarded-for`; everything after it is the proxy chain and is not the
 * caller. Falls back to a single shared bucket when there's no usable header,
 * which is the safe direction to fail — a shared bucket throttles, it doesn't
 * open the door.
 */
export function callerKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
