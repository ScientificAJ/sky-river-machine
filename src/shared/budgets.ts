export const BUDGETS = {
  activeModelTasks: 1,
  highPriorityJobs: 64,
  lowPriorityJobs: 128,
  analysisBatchSize: 12,
  maxModelRecords: 128,
  modelTimeBudgetMs: 1_500,
  maxRecordCache: 256,
  maxVisibleContextCharacters: 500,
  searchPageSize: 50,
  operationBatchSize: 20,
  retryLimit: 2,
} as const;
