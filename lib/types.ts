// Doppler API Types (based on OpenAPI schema)
export interface CreateTaskRequest {
  task: string;
  target_model: string;
  prompt: string;
  agent_type: "outbound" | "inbound";
  user_persona?: string;
  test_criteria?: string;
  transcript?: string;
  provided_variables?: Record<string, string>;
  tool_schema?: Array<Record<string, unknown>>;
}

export interface CreateTaskResponse {
  task_id: string;
}

export interface TaskStatus {
  status: "completed" | "running" | "pending" | "failed";
  result: TaskResult | null;
  error: string | null;
}

export interface TaskResult {
  task: Task;
  passed: boolean;
  final_prompt: string;
  task_summary: string;
  iterations: Iteration[];
}

export interface Task {
  task: string;
  og_prompt: string;
  agent_type: string;
  target_model: string;
  user_persona: string;
  test_criteria: string;
  provided_variables: Record<string, string>;
  tool_schema: Array<Record<string, unknown>>;
  transcript: string;
}

export interface Iteration {
  iteration_number: number;
  interpreted_task: string;
  prompt_suggestions: PromptChange[];
  solution_approach: string;
  prompt_change_summary: string;
  test: Test;
  test_result: TestResult;
  prompt_content: string;
  iteration_summary: string;
}

export interface PromptChange {
  instruction: string;
  line_range: LineRange;
}

export interface LineRange {
  start: number;
  end: number;
}

export interface Test {
  scenario: string;
  criteria: string;
  variables: Record<string, string>;
  transcript: string;
}

export interface TestResult {
  passed: boolean;
  reason: string;
  conversation: Array<Record<string, unknown>>;
}

// Application Types
export interface EvalRow {
  id: string;
  [key: string]: unknown; // Flexible to accommodate different customer schemas
}

export interface DopplerTask {
  id: string;
  task_id: string;
  status: "pending" | "running" | "completed" | "failed";
  created_at: Date;
  updated_at: Date;
  original_eval_ids: string[];
  result?: TaskResult | null;
  error?: string;
}

export interface EvalDataSource {
  getAllEvals(): Promise<EvalRow[]>;
  getEvalById(id: string): Promise<EvalRow | null>;
}

export interface DashboardMetrics {
  tasksNotRun: number;
  feedbacksToResolve: number;
  completedTasks: number;
  failedTasks: number;
  runningTasks: number;
  pendingTasks: number;
}

export interface FieldMapping {
  [dopplerField: string]: string; // Maps Doppler field to customer field
}

export interface DeploymentTarget {
  id: string;
  name: string;
  description: string;
  url?: string;
}

export interface DeploymentResult {
  success: boolean;
  deploymentId?: string;
  message: string;
  timestamp: Date;
} 