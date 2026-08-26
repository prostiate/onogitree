import { createSignal, createMemo } from 'solid-js';
import { BatchProgressEvent } from '../types/git';
import { WailsBridge } from '../services/wailsBridge';
import { repoStore } from './repoStore';

const [isBatchRunning, setIsBatchRunning] = createSignal<boolean>(false);
const [batchAction, setBatchAction] = createSignal<'pull' | 'fetch' | 'push' | 'refresh' | null>(null);
const [progressEvents, setProgressEvents] = createSignal<Record<string, BatchProgressEvent>>({});
const [isPullModalOpen, setIsPullModalOpen] = createSignal<boolean>(false);
const [isPushModalOpen, setIsPushModalOpen] = createSignal<boolean>(false);

// Register event listener
if (typeof window !== 'undefined') {
  WailsBridge.onBatchProgress((event: BatchProgressEvent) => {
    setProgressEvents((prev) => ({
      ...prev,
      [event.repoId]: event,
    }));

    // Update repo status in repoStore if finished
    if (event.status === 'success') {
      void repoStore.refreshRepo(event.repoPath);
    }
  });
}

export const batchStore = {
  isBatchRunning,
  batchAction,
  progressEvents,
  isPullModalOpen,
  isPushModalOpen,

  setIsPullModalOpen,
  setIsPushModalOpen,

  conflictedRepos: createMemo(() => {
    return Object.values(progressEvents()).filter((e) => e.status === 'conflict');
  }),

  authRequiredRepos: createMemo(() => {
    return Object.values(progressEvents()).filter((e) => e.status === 'auth_required');
  }),

  activeJobCount: createMemo(() => {
    return Object.values(progressEvents()).filter((e) => e.status === 'running').length;
  }),

  async runPullAll(skipDirty: boolean = true) {
    setIsBatchRunning(true);
    setBatchAction('pull');
    setProgressEvents({});
    setIsPullModalOpen(false);

    try {
      await WailsBridge.runBatchPull(skipDirty);
    } catch (err) {
      console.error('Batch pull error:', err);
    } finally {
      setTimeout(() => {
        setIsBatchRunning(false);
      }, 1000);
    }
  },

  async runFetchAll() {
    setIsBatchRunning(true);
    setBatchAction('fetch');
    setProgressEvents({});

    try {
      await WailsBridge.runBatchFetch();
    } catch (err) {
      console.error('Batch fetch error:', err);
    } finally {
      setTimeout(() => {
        setIsBatchRunning(false);
      }, 1000);
    }
  },

  clearEvents() {
    setProgressEvents({});
    setBatchAction(null);
  },
};
