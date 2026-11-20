import { afterEach, describe, expect, it, vi } from "vitest";

// photo-upload imports the browser Supabase client; stub it so the module loads in Node.
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));

import { uuid } from "./photo-upload";
import { PHOTO_PATH } from "./items/schema";

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("uuid", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("makes v4 UUIDs that pass the photo path check", () => {
    const id = uuid();
    expect(id).toMatch(V4);
    expect(`items/${id}.webp`).toMatch(PHOTO_PATH);
  });

  it("still works where crypto.randomUUID is missing (plain http on a phone)", () => {
    const real = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: (a: Uint8Array) => real.getRandomValues(a) });
    const ids = new Set(Array.from({ length: 50 }, () => uuid()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(V4);
  });
});
