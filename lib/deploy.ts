/**
 * Deployment interface for customers to implement
 * This allows customers to define how optimized prompts get deployed to their production systems
 */

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

/**
 * Abstract base class for prompt deployment
 * Customers should extend this class and implement the deploy method
 */
export abstract class PromptDeployer {
  abstract deploy(
    promptId: string,
    optimizedPrompt: string,
    target: DeploymentTarget,
    metadata?: Record<string, unknown>
  ): Promise<DeploymentResult>;

  abstract getAvailableTargets(): Promise<DeploymentTarget[]>;
}

/**
 * Mock deployment implementation for testing
 */
export class MockPromptDeployer extends PromptDeployer {
  private deployments: Map<string, DeploymentResult> = new Map();

  async deploy(
    promptId: string,
    optimizedPrompt: string,
    target: DeploymentTarget,
    _metadata?: Record<string, unknown>
  ): Promise<DeploymentResult> {
    // Simulate deployment delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result: DeploymentResult = {
      success: true,
      deploymentId,
      message: `Successfully deployed prompt ${promptId} to ${target.name}`,
      timestamp: new Date(),
    };

    this.deployments.set(deploymentId, result);
    
    console.log(`Mock deployment: ${result.message}`);
    console.log(`Prompt content: ${optimizedPrompt.substring(0, 100)}...`);
    
    return result;
  }

  async getAvailableTargets(): Promise<DeploymentTarget[]> {
    return [
      {
        id: 'production',
        name: 'Production',
        description: 'Main production environment',
        url: 'https://api.example.com/prompts',
      },
      {
        id: 'staging',
        name: 'Staging',
        description: 'Staging environment for testing',
        url: 'https://staging-api.example.com/prompts',
      },
      {
        id: 'development',
        name: 'Development',
        description: 'Development environment',
        url: 'https://dev-api.example.com/prompts',
      },
    ];
  }

  getDeploymentHistory(): DeploymentResult[] {
    return Array.from(this.deployments.values());
  }
}

/**
 * API-based deployment implementation
 * Customers can use this as a template for deploying to their own APIs
 */
export class ApiPromptDeployer extends PromptDeployer {
  constructor(
    private apiBaseUrl: string,
    private apiKey?: string
  ) {
    super();
  }

  async deploy(
    promptId: string,
    optimizedPrompt: string,
    target: DeploymentTarget,
    metadata?: Record<string, unknown>
  ): Promise<DeploymentResult> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const payload = {
      promptId,
      prompt: optimizedPrompt,
      target: target.id,
      metadata,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${this.apiBaseUrl}/deploy`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Deployment failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        deploymentId: result.deploymentId,
        message: result.message || `Deployed to ${target.name}`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
    }
  }

  async getAvailableTargets(): Promise<DeploymentTarget[]> {
    const headers: Record<string, string> = {};
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/targets`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch targets: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to fetch deployment targets:', error);
      return [];
    }
  }
}

/**
 * File-based deployment implementation
 * For customers who want to save prompts to files or version control
 */
export class FilePromptDeployer extends PromptDeployer {
  constructor(private basePath: string) {
    super();
  }

  async deploy(
    promptId: string,
    optimizedPrompt: string,
    target: DeploymentTarget,
    metadata?: Record<string, unknown>
  ): Promise<DeploymentResult> {
    // Note: This is a client-side implementation example
    // In a real implementation, this would need to be handled server-side
    
    try {
      const timestamp = new Date().toISOString();
      const filename = `${promptId}_${target.id}_${timestamp}.txt`;
      
      const content = [
        `# Optimized Prompt Deployment`,
        `Prompt ID: ${promptId}`,
        `Target: ${target.name}`,
        `Deployed: ${timestamp}`,
        ``,
        `## Metadata`,
        JSON.stringify(metadata, null, 2),
        ``,
        `## Prompt Content`,
        optimizedPrompt,
      ].join('\n');

      // In a real implementation, you would save this to a file system or send to a server
      console.log(`Would save to: ${this.basePath}/${filename}`);
      console.log('Content:', content);

      return {
        success: true,
        deploymentId: filename,
        message: `Prompt saved to ${filename}`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: `File deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
    }
  }

  async getAvailableTargets(): Promise<DeploymentTarget[]> {
    return [
      {
        id: 'prompts',
        name: 'Prompts Directory',
        description: 'Save to prompts directory',
      },
      {
        id: 'archive',
        name: 'Archive',
        description: 'Save to archive directory',
      },
    ];
  }
}

// Default export for easy importing
export const defaultDeployer = new MockPromptDeployer();

// Utility function to deploy a prompt
export async function deployPrompt(
  promptId: string,
  optimizedPrompt: string,
  targetId: string,
  deployer: PromptDeployer = defaultDeployer,
  metadata?: Record<string, unknown>
): Promise<DeploymentResult> {
  const targets = await deployer.getAvailableTargets();
  const target = targets.find(t => t.id === targetId);
  
  if (!target) {
    return {
      success: false,
      message: `Deployment target '${targetId}' not found`,
      timestamp: new Date(),
    };
  }

  return deployer.deploy(promptId, optimizedPrompt, target, metadata);
} 