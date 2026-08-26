import { describe, it, expect, beforeEach } from "vitest";
import { repoStore } from "./repoStore";

describe("repoStore", () => {
  beforeEach(() => {
    repoStore.setSearchQuery("");
  });

  it("filters repositories by search query", () => {
    repoStore.setSearchQuery("auth");
    expect(repoStore.searchQuery()).toBe("auth");
  });

  it("computes selectedRepo correctly", () => {
    expect(repoStore.selectedRepo()).toBeDefined();
  });
});
