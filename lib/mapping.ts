import { FieldMapping, EvalRow, CreateTaskRequest } from './types';

/**
 * Default field mapping configuration
 * Customers should modify this to match their eval data schema
 */
export const DEFAULT_EVAL_FIELD_MAPPING: FieldMapping = {
  // Doppler field -> Customer field
  task: 'task_description',
  prompt: 'prompt_content', 
  target_model: 'model_name',
  agent_type: 'agent_type',
  user_persona: 'user_persona',
  test_criteria: 'success_criteria',
  transcript: 'conversation_log',
  // provided_variables will be extracted from variable fields
  // tool_schema will be extracted from tools field
};

/**
 * Extract variables from eval row based on naming convention
 * Looks for fields starting with 'var_' or 'variable_'
 */
export function extractVariables(evalRow: EvalRow): Record<string, string> {
  const variables: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(evalRow)) {
    if (key.startsWith('var_') || key.startsWith('variable_')) {
      const variableName = key.replace(/^(var_|variable_)/, '');
      variables[variableName] = String(value);
    }
  }
  
  return variables;
}

/**
 * Extract tool schema from eval row
 * Expects tools to be stored as JSON string or object
 */
export function extractToolSchema(evalRow: EvalRow): Array<Record<string, unknown>> {
  const toolsField = evalRow.tools || evalRow.tool_schema || evalRow.available_tools;
  
  if (!toolsField) {
    return [];
  }
  
  if (typeof toolsField === 'string') {
    try {
      return JSON.parse(toolsField);
    } catch {
      console.warn('Failed to parse tools field as JSON:', toolsField);
      return [];
    }
  }
  
  if (Array.isArray(toolsField)) {
    return toolsField;
  }
  
  return [];
}

/**
 * Map a customer eval row to Doppler API request format
 */
export function mapEvalToCreateTaskRequest(
  evalRow: EvalRow,
  fieldMapping: FieldMapping = DEFAULT_EVAL_FIELD_MAPPING
): CreateTaskRequest {
  const mapped: Partial<CreateTaskRequest> = {};
  
  // Map basic fields
  for (const [dopplerField, customerField] of Object.entries(fieldMapping)) {
    const value = evalRow[customerField];
    if (value !== undefined && value !== null && value !== '') {
      (mapped as Record<string, unknown>)[dopplerField] = value;
    }
  }
  
  // Extract variables and tools
  mapped.provided_variables = extractVariables(evalRow);
  mapped.tool_schema = extractToolSchema(evalRow);
  
  // Set defaults for required fields if not provided
  if (!mapped.task) {
    mapped.task = `Optimize prompt for eval ${evalRow.id}`;
  }
  
  if (!mapped.target_model) {
    mapped.target_model = 'gpt-4.1';
  }
  
  if (!mapped.prompt) {
    throw new Error(`Missing required prompt field. Check field mapping for 'prompt' -> '${fieldMapping.prompt}'`);
  }
  
  if (!mapped.agent_type) {
    mapped.agent_type = 'outbound'; // Default to outbound
  }
  
  // Validate agent_type
  if (mapped.agent_type !== 'outbound' && mapped.agent_type !== 'inbound') {
    console.warn(`Invalid agent_type: ${mapped.agent_type}. Defaulting to 'outbound'`);
    mapped.agent_type = 'outbound';
  }
  
  return mapped as CreateTaskRequest;
}

/**
 * Batch map multiple eval rows to create task requests
 */
export function mapEvalsToCreateTaskRequests(
  evalRows: EvalRow[],
  fieldMapping: FieldMapping = DEFAULT_EVAL_FIELD_MAPPING
): CreateTaskRequest[] {
  return evalRows.map(evalRow => mapEvalToCreateTaskRequest(evalRow, fieldMapping));
} 