import { describe, expect, it } from "vitest";
import { formDataToInput, parseItemForm } from "./schema";

const CATEGORY = "3f1c2a9e-8b7d-4c6e-9a5f-1b2c3d4e5f60";
const PHOTO = "items/0b6f7c1e-2d3a-4b5c-8d9e-0f1a2b3c4d5e.webp";

/** A minimal valid form: what she'd send by filling only the visible fields. */
function form(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    title: "Levi's 501 jeans",
    categoryId: CATEGORY,
    sourceCost: "6.99",
    storageLocation: "Bin B",
    brand: "",
    size: "",
    color: "",
    condition: "",
    description: "",
    source: "",
    acquiredDate: "2026-11-16",
    status: "SOURCED",
    listedOn: "",
    listPrice: "",
    photoPath: "",
    ...overrides,
  };
}

describe("parseItemForm", () => {
  it("accepts the quick-add fields and fills sensible empties", () => {
    const result = parseItemForm(form());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.values).toMatchObject({
      title: "Levi's 501 jeans",
      categoryId: CATEGORY,
      sourceCost: 699,
      storageLocation: "Bin B",
      brand: null,
      condition: null,
      description: null,
      listedOn: null,
      listPrice: null,
      photoPath: null,
      status: "SOURCED",
    });
  });

  it("trims text and treats blank as empty", () => {
    const result = parseItemForm(form({ title: "  Tee  ", brand: "   ", storageLocation: " Rail 1 " }));
    expect(result.ok && result.values).toMatchObject({ title: "Tee", brand: null, storageLocation: "Rail 1" });
  });

  it("treats a blank cost as $0", () => {
    const result = parseItemForm(form({ sourceCost: "" }));
    expect(result.ok && result.values.sourceCost).toBe(0);
  });

  it("converts money to cents", () => {
    const result = parseItemForm(form({ sourceCost: "$12.50", listPrice: "45", listedOn: "DEPOP" }));
    expect(result.ok && result.values).toMatchObject({ sourceCost: 1250, listPrice: 4500 });
  });

  it("requires a title and category, with plain messages", () => {
    const result = parseItemForm(form({ title: "  ", categoryId: "" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.title).toMatch(/title/i);
    expect(result.errors.categoryId).toBe("Pick a category.");
  });

  it("rejects money it can't read", () => {
    const result = parseItemForm(form({ sourceCost: "about 5", listPrice: "-3" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.sourceCost).toMatch(/12\.50/);
    expect(result.errors.listPrice).toMatch(/12\.50/);
  });

  it("needs a platform when the status is Listed", () => {
    const result = parseItemForm(form({ status: "LISTED" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.listedOn).toBe("Pick where it's listed.");

    expect(parseItemForm(form({ status: "LISTED", listedOn: "BOTH" })).ok).toBe(true);
  });

  it("doesn't let the form set sold or shipped", () => {
    expect(parseItemForm(form({ status: "SOLD" })).ok).toBe(false);
    expect(parseItemForm(form({ status: "SHIPPED" })).ok).toBe(false);
  });

  it("only accepts known conditions and platforms", () => {
    expect(parseItemForm(form({ condition: "Good" })).ok).toBe(true);
    expect(parseItemForm(form({ condition: "Mint" })).ok).toBe(false);
    expect(parseItemForm(form({ listedOn: "EBAY" })).ok).toBe(false);
  });

  it("accepts real photo paths and blocks anything else", () => {
    expect(parseItemForm(form({ photoPath: PHOTO })).ok).toBe(true);
    expect(parseItemForm(form({ photoPath: PHOTO.replace(".webp", ".jpg") })).ok).toBe(true);
    for (const bad of ["../secret.webp", "items/abc.webp", "other/" + PHOTO.slice(6), PHOTO + ".exe"]) {
      expect(parseItemForm(form({ photoPath: bad })).ok).toBe(false);
    }
  });

  it("requires a valid date", () => {
    expect(parseItemForm(form({ acquiredDate: "" })).ok).toBe(false);
    expect(parseItemForm(form({ acquiredDate: "2026-13-40" })).ok).toBe(false);
  });
});

describe("formDataToInput", () => {
  it("reads every field and fills missing ones with empty strings", () => {
    const fd = new FormData();
    fd.set("title", "Scarf");
    fd.set("unexpected", "ignored");
    const input = formDataToInput(fd);
    expect(input.title).toBe("Scarf");
    expect(input.brand).toBe("");
    expect(input).not.toHaveProperty("unexpected");
  });
});
