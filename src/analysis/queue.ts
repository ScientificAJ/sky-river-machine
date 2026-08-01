import { BUDGETS } from '../shared/budgets';

export type AnalysisJob = { recordId: string; revision: number; priority: 'high' | 'low' };

export class BoundedAnalysisQueue {
  private readonly jobs = new Map<string, AnalysisJob>();
  constructor(private readonly maxHigh: number = BUDGETS.highPriorityJobs, private readonly maxLow: number = BUDGETS.lowPriorityJobs) {}
  enqueue(job: AnalysisJob): boolean {
    if (this.jobs.has(job.recordId)) { this.jobs.set(job.recordId, job); return true; }
    const pending = [...this.jobs.values()].filter((item) => item.priority === job.priority).length;
    if (pending >= (job.priority === 'high' ? this.maxHigh : this.maxLow)) return false;
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
