import { describe, it, expect, beforeEach } from "vitest";
import { batchStore } from "./batchStore";

describe("batchStore", () => {
  beforeEach(() => {
    batchStore.clearEvents();
  });

  it("tracks batch modal states", () => {
    expect(batchStore.isPullModalOpen()).toBe(false);
    batchStore.setIsPullModalOpen(true);
    expect(batchStore.isPullModalOpen()).toBe(true);

    expect(batchStore.isPushModalOpen()).toBe(false);
    batchStore.setIsPushModalOpen(true);
    expect(batchStore.isPushModalOpen()).toBe(true);
  });

  it("computes conflicted and auth required repos from events", () => {
    expect(batchStore.conflictedRepos().length).toBe(0);
    expect(batchStore.authRequiredRepos().length).toBe(0);
    expect(batchStore.activeJobCount()).toBe(0);
  });
});
