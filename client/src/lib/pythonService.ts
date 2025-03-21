import { apiRequest } from "./queryClient";

export interface ExecutionResult {
  output: string;
  error: string | null;
  success: boolean;
}

export async function executePythonCode(code: string): Promise<ExecutionResult> {
  try {
    const response = await apiRequest('POST', '/api/execute', { code });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error executing Python code:', error);
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Failed to execute code. Please try again.',
      success: false
    };
  }
}
