import * as App from '../../wailsjs/go/main/App';
import * as Runtime from '../../wailsjs/runtime/runtime';
import { RepoStatus, BranchInfo, DiscoveredRepo, WorkspaceRecord, ResourceStats, BatchProgressEvent, CommitSummary, CommitDetail } from '../types/git';



export const WailsBridge = {
  isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof (window as any).go !== 'undefined';
  },

  async getActiveWorkspace(): Promise<WorkspaceRecord> {
    try {
      const ws = await App.GetActiveWorkspace();
      return ws as unknown as WorkspaceRecord;
    } catch {
      return { id: 'default', name: 'Default Workspace', isActive: true, repos: [] };
    }
  },

  async scanDirectory(path: string, maxDepth: number = 3): Promise<DiscoveredRepo[]> {
    try {
      const repos = await App.ScanWorkspaceDirectory(path, maxDepth);
      return repos as unknown as DiscoveredRepo[];
    } catch (err) {
      console.error('ScanDirectory error:', err);
      return [];
    }
  },

  async addRepository(path: string): Promise<RepoStatus> {
    try {
      const status = await App.AddRepositoryToWorkspace(path);
      return status as unknown as RepoStatus;
    } catch (err) {
      console.error('AddRepository error:', err);
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
  },

  async removeRepository(repoId: string): Promise<void> {
    try {
      await App.RemoveRepository(repoId);
    } catch (err) {
      console.error('RemoveRepository error:', err);
    }
  },

  async togglePin(repoId: string, isPinned: boolean): Promise<void> {
    try {
      await App.TogglePinRepository(repoId, isPinned);
    } catch (err) {
      console.error('TogglePin error:', err);
    }
  },

  async toggleAutoFetch(repoId: string, enabled: boolean): Promise<void> {
    try {
      await App.ToggleAutoFetchRepository(repoId, enabled);
    } catch (err) {
      console.error('ToggleAutoFetch error:', err);
    }
  },

  async getRepoStatus(repoPath: string): Promise<RepoStatus> {
    try {
      const status = await App.GetRepoStatus(repoPath);
      return status as unknown as RepoStatus;
    } catch (err) {
      console.error('GetRepoStatus error:', err);
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
  },

  async refreshAll(): Promise<RepoStatus[]> {
    try {
      const list = await App.RefreshAllRepositories();
      return list as unknown as RepoStatus[];
    } catch (err) {
      console.error('RefreshAll error:', err);
      return [];
    }
  },

  async listBranches(repoPath: string): Promise<BranchInfo[]> {
    try {
      const branches = await App.ListBranches(repoPath);
      return branches as unknown as BranchInfo[];
    } catch (err) {
      console.error('ListBranches error:', err);
      return [];
    }
  },

  async checkoutBranch(repoPath: string, branchName: string): Promise<void> {
    try {
      await App.CheckoutBranch(repoPath, branchName);
    } catch (err) {
      console.error('CheckoutBranch error:', err);
      throw err;
    }
  },

  async createBranch(repoPath: string, branchName: string, startPoint: string = '', checkout: boolean = true): Promise<void> {
    try {
      await App.CreateBranch(repoPath, branchName, startPoint, checkout);
    } catch (err) {
      console.error('CreateBranch error:', err);
      throw err;
    }
  },

  async stageFiles(repoPath: string, files: string[]): Promise<void> {
    try {
      await App.StageFiles(repoPath, files);
    } catch (err) {
      console.error('StageFiles error:', err);
    }
  },

  async unstageFiles(repoPath: string, files: string[]): Promise<void> {
    try {
      await App.UnstageFiles(repoPath, files);
    } catch (err) {
      console.error('UnstageFiles error:', err);
    }
  },

  async commit(repoPath: string, message: string, amend: boolean = false): Promise<void> {
    try {
      await App.Commit(repoPath, message, amend);
    } catch (err) {
      console.error('Commit error:', err);
      throw err;
    }
  },

  async runBatchPull(skipDirty: boolean): Promise<void> {
    try {
      await App.RunBatchPull(skipDirty);
    } catch (err) {
      console.error('RunBatchPull error:', err);
    }
  },

  async runBatchFetch(): Promise<void> {
    try {
      await App.RunBatchFetch();
    } catch (err) {
      console.error('RunBatchFetch error:', err);
    }
  },

  async getResourceStats(): Promise<ResourceStats> {
    try {
      const stats = await App.GetResourceStats();
      return stats as unknown as ResourceStats;
    } catch {
      return {
        allocRamMb: 42.5,
        totalAllocMb: 110.2,
        sysRamMb: 58.4,
        numGoroutine: 6,
        numCpu: 8,
        timestamp: Date.now(),
      };
    }
  },

  async checkCLIAuth(): Promise<Record<string, boolean>> {
    try {
      return await App.CheckCLIAuth();
    } catch {
      return { gh: true, glab: true };
    }
  },

  async selectDirectory(title: string = 'Select Repository Directory'): Promise<string> {
    try {
      return await App.SelectDirectory(title);
    } catch (err) {
      console.error('SelectDirectory error:', err);
    }
    return '';
  },

  async discardFiles(repoPath: string, files: string[]): Promise<void> {
    try {
      await App.DiscardFiles(repoPath, files);
    } catch (err) {
      console.error('DiscardFiles error:', err);
      throw err;
    }
  },

  async openPathInSystem(targetPath: string): Promise<void> {
    try {
      await App.OpenPathInSystem(targetPath);
    } catch (err) {
      console.error('OpenPathInSystem error:', err);
    }
  },

  async addToGitignore(repoPath: string, pattern: string): Promise<void> {
    try {
      await App.AddToGitignore(repoPath, pattern);
    } catch (err) {
      console.error('AddToGitignore error:', err);
      throw err;
    }
  },

  async getFileDiff(repoPath: string, filePath: string, staged: boolean): Promise<string> {
    try {
      return await App.GetFileDiff(repoPath, filePath, staged);
    } catch (err) {
      console.error('GetFileDiff error:', err);
      return '';
    }
  },

  async getRecentCommits(repoPath: string, limit: number = 10): Promise<CommitSummary[]> {
    try {
      const commits = await App.GetRecentCommits(repoPath, limit);
      return commits as CommitSummary[];
    } catch (err) {
      console.error('GetRecentCommits error:', err);
      return [];
    }
  },

  async pushRepository(repoPath: string): Promise<void> {
    try {
      await App.PushRepository(repoPath);
    } catch (err) {
      console.error('PushRepository error:', err);
      throw err;
    }
  },

  async getCommitDetails(repoPath: string, commitHash: string): Promise<CommitDetail | null> {
    try {
      const detail = await App.GetCommitDetails(repoPath, commitHash);
      return detail as unknown as CommitDetail;
    } catch (err) {
      console.error('GetCommitDetails error:', err);
      return null;
    }
  },

  async getCommitFileDiff(repoPath: string, commitHash: string, filePath: string): Promise<string> {
    try {
      return await App.GetCommitFileDiff(repoPath, commitHash, filePath);
    } catch (err) {
      console.error('GetCommitFileDiff error:', err);
      return '';
    }
  },






  onBatchProgress(callback: (event: BatchProgressEvent) => void): () => void {
    try {
      if (typeof window !== 'undefined' && (window as any).runtime && typeof (Runtime as any).EventsOn === 'function') {
        Runtime.EventsOn('batch:progress', (data: any) => {
          callback(data as BatchProgressEvent);
        });
        return () => {
          if (typeof (Runtime as any).EventsOff === 'function') {
            Runtime.EventsOff('batch:progress');
          }
        };
      }
    } catch {
      // Safe fallback in test/mock environments
    }
    return () => {};
  },

};
