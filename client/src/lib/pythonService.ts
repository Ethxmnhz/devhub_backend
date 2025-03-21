export interface ExecutionResult {
  output: string;
  error: string | null;
  success: boolean;
}

/**
 * Executes Python code by sending it to the server API
 * @param code Python code to execute
 * @returns Execution result containing output, error, and success flag
 */
export async function executePythonCode(code: string): Promise<ExecutionResult> {
  try {
    const response = await fetch('/api/execute', {
      method: 'POST',
      body: JSON.stringify({ code }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result as ExecutionResult;
  } catch (error) {
    console.error('Error executing Python code:', error);
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false,
    };
  }
}