import { BUDGETS } from '../shared/budgets';

export type AnalysisJob = { recordId: string; revision: number; priority: 'high' | 'low' };

export class BoundedAnalysisQueue {
  private readonly jobs = new Map<string, AnalysisJob>();
  constructor(private readonly maxPending = BUDGETS.highPriorityJobs) {}
  enqueue(job: AnalysisJob): boolean {
    if (this.jobs.has(job.recordId)) { this.jobs.set(job.recordId, job); return true; }
    if (this.jobs.size >= this.maxPending) return false;
    this.jobs.set(job.recordId, job);
    return true;
  }
  take(): AnalysisJob | undefined {
    const job = [...this.jobs.values()].sort((a, b) => Number(b.priority === 'high') - Number(a.priority === 'high'))[0];
    if (job) this.jobs.delete(job.recordId);
    return job;
  }
  get size(): number { return this.jobs.size; }
}
