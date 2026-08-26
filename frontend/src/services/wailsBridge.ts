import { RepoStatus, BranchInfo, DiscoveredRepo, WorkspaceRecord, ResourceStats, BatchProgressEvent } from '../types/git';

// Wails Window API Declaration
interface WailsGoApp {
  GetActiveWorkspace(): Promise<WorkspaceRecord>;
  ScanWorkspaceDirectory(path: string, maxDepth: number): Promise<DiscoveredRepo[]>;
  AddRepositoryToWorkspace(path: string): Promise<RepoStatus>;
  RemoveRepository(repoId: string): Promise<void>;
  TogglePinRepository(repoId: string, isPinned: boolean): Promise<void>;
  ToggleAutoFetchRepository(repoId: string, enabled: boolean): Promise<void>;
  GetRepoStatus(repoPath: string): Promise<RepoStatus>;
  RefreshAllRepositories(): Promise<RepoStatus[]>;
  ListBranches(repoPath: string): Promise<BranchInfo[]>;
  CheckoutBranch(repoPath: string, branchName: string): Promise<void>;
  CreateBranch(repoPath: string, branchName: string, startPoint: string, checkout: boolean): Promise<void>;
  StageFiles(repoPath: string, files: string[]): Promise<void>;
  UnstageFiles(repoPath: string, files: string[]): Promise<void>;
  Commit(repoPath: string, message: string, amend: boolean): Promise<void>;
  RunBatchPull(skipDirty: boolean): Promise<void>;
  RunBatchFetch(): Promise<void>;
  GetResourceStats(): Promise<ResourceStats>;
  CheckCLIAuth(): Promise<Record<string, boolean>>;
}

interface WailsRuntime {
  EventsOn(eventName: string, callback: (data: BatchProgressEvent) => void): () => void;
  EventsEmit(eventName: string, ...args: unknown[]): void;
}

interface WailsWindow extends Window {
  go?: {
    main?: {
      App?: WailsGoApp;
    };
  };
  runtime?: WailsRuntime;
}

const wailsWin = (typeof window !== 'undefined' ? window : {}) as WailsWindow;

export const WailsBridge = {
  isAvailable(): boolean {
    return !!wailsWin.go?.main?.App;
  },

  async getActiveWorkspace(): Promise<WorkspaceRecord> {
    if (!wailsWin.go?.main?.App) {
      return { id: 'default', name: 'Default Workspace', isActive: true, repos: [] };
    }
    return wailsWin.go.main.App.GetActiveWorkspace();
  },

  async scanDirectory(path: string, maxDepth: number = 3): Promise<DiscoveredRepo[]> {
    if (!wailsWin.go?.main?.App) return [];
    return wailsWin.go.main.App.ScanWorkspaceDirectory(path, maxDepth);
  },

  async addRepository(path: string): Promise<RepoStatus> {
    if (!wailsWin.go?.main?.App) {
      return {
        id: path,
        name: path.split('/').pop() || 'repo',
        path,
        currentBranch: 'main',
        aheadCount: 0,
        behindCount: 0,
        lastFetchedAt: 'Just now',
        isDirty: false,
        changedFilesCount: 0,
        hasConflicts: false,
        isPinned: false,
        autoFetchEnabled: true,
      };
    }
    return wailsWin.go.main.App.AddRepositoryToWorkspace(path);
  },

  async removeRepository(repoId: string): Promise<void> {
    if (!wailsWin.go?.main?.App) return;
    return wailsWin.go.main.App.RemoveRepository(repoId);
  },

  async togglePin(repoId: string, isPinned: boolean): Promise<void> {
    if (!wailsWin.go?.main?.App) return;
    return wailsWin.go.main.App.TogglePinRepository(repoId, isPinned);
  },

  async toggleAutoFetch(repoId: string, enabled: boolean): Promise<void> {
    if (!wailsWin.go?.main?.App) return;
    return wailsWin.go.main.App.ToggleAutoFetchRepository(repoId, enabled);
  },

  async getRepoStatus(repoPath: string): Promise<RepoStatus> {
    if (!wailsWin.go?.main?.App) {
      return {
        id: repoPath,
        name: repoPath.split('/').pop() || 'repo',
        path: repoPath,
        currentBranch: 'main',
        aheadCount: 0,
        behindCount: 0,
        lastFetchedAt: 'Just now',
        isDirty: false,
        changedFilesCount: 0,
        hasConflicts: false,
        isPinned: false,
        autoFetchEnabled: true,
      };
    }
    return wailsWin.go.main.App.GetRepoStatus(repoPath);
  },

  async refreshAll(): Promise<RepoStatus[]> {
    if (!wailsWin.go?.main?.App) return [];
    return wailsWin.go.main.App.RefreshAllRepositories();
  },

  async listBranches(repoPath: string): Promise<BranchInfo[]> {
    if (!wailsWin.go?.main?.App) return [];
    return wailsWin.go.main.App.ListBranches(repoPath);
  },

  async checkoutBranch(repoPath: string, branchName: string): Promise<void> {
    if (!wailsWin.go?.main?.App) return;
    return wailsWin.go.main.App.CheckoutBranch(repoPath, branchName);
  },

  async createBranch(repoPath: string, branchName: string, startPoint: string = '', checkout: boolean = true): Promise<void> {
    if (!wailsWin.go?.main?.App) return;
    return wailsWin.go.main.App.CreateBranch(repoPath, branchName, startPoint, checkout);
  },

  async stageFiles(repoPath: string, files: string[]): Promise<void> {
    if (!wailsWin.go?.main?.App) return;
    return wailsWin.go.main.App.StageFiles(repoPath, files);
  },

  async unstageFiles(repoPath: string, files: string[]): Promise<void> {
    if (!wailsWin.go?.main?.App) return;
    return wailsWin.go.main.App.UnstageFiles(repoPath, files);
  },

  async commit(repoPath: string, message: string, amend: boolean = false): Promise<void> {
    if (!wailsWin.go?.main?.App) return;
    return wailsWin.go.main.App.Commit(repoPath, message, amend);
  },

  async runBatchPull(skipDirty: boolean): Promise<void> {
    if (!wailsWin.go?.main?.App) return;
    return wailsWin.go.main.App.RunBatchPull(skipDirty);
  },

  async runBatchFetch(): Promise<void> {
    if (!wailsWin.go?.main?.App) return;
    return wailsWin.go.main.App.RunBatchFetch();
  },

  async getResourceStats(): Promise<ResourceStats> {
    if (!wailsWin.go?.main?.App) {
      return {
        allocRamMb: 42.5,
        totalAllocMb: 110.2,
        sysRamMb: 58.4,
        numGoroutine: 6,
        numCpu: 8,
        timestamp: Date.now(),
      };
    }
    return wailsWin.go.main.App.GetResourceStats();
  },

  async checkCLIAuth(): Promise<Record<string, boolean>> {
    if (!wailsWin.go?.main?.App) {
      return { gh: true, glab: true };
    }
    return wailsWin.go.main.App.CheckCLIAuth();
  },

  onBatchProgress(callback: (event: BatchProgressEvent) => void): () => void {
    if (!wailsWin.runtime?.EventsOn) return () => {};
    return wailsWin.runtime.EventsOn('batch:progress', callback);
  },
};
