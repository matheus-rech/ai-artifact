import type { AgentResult, AgentConfig, AgentStatus } from '@/types';

/**
 * Abstract base class for all manuscript analysis agents
 */
export abstract class BaseAgent<TInput, TOutput> {
  protected config: AgentConfig;
  protected status: AgentStatus;

  constructor(config: AgentConfig) {
    this.config = config;
    this.status = {
      agent: config.name,
      status: 'idle'
    };
  }

  /**
   * Execute the agent's main analysis function
   */
  async execute(input: TInput): Promise<AgentResult<TOutput>> {
    const startTime = Date.now();
    this.updateStatus('running', 0, 'Starting analysis...');

    try {
      // Validate input
      await this.validateInput(input);
      this.updateStatus('running', 25, 'Input validated, processing...');

      // Execute main analysis
      const result = await this.analyze(input);
      this.updateStatus('running', 75, 'Analysis complete, validating output...');

      // Validate output
      await this.validateOutput(result);
      this.updateStatus('completed', 100, 'Analysis completed successfully');

      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: result,
        executionTime,
        usedFallback: false,
        confidence: this.calculateConfidence(result)
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`Agent ${this.config.name} failed:`, error);
      this.updateStatus('error', 0, errorMessage);

      // Try fallback if enabled
      if (this.config.fallbackEnabled) {
        try {
          this.updateStatus('running', 50, 'Using fallback analysis...');
          const fallbackResult = await this.fallbackAnalyze(input);
          this.updateStatus('completed', 100, 'Fallback analysis completed');

          return {
            success: true,
            data: fallbackResult,
            executionTime: Date.now() - startTime,
            usedFallback: true,
            confidence: this.calculateConfidence(fallbackResult) * 0.7 // Reduced confidence for fallback
          };
        } catch (fallbackError) {
          this.updateStatus('error', 0, 'Fallback analysis also failed');
          console.error(`Fallback for ${this.config.name} also failed:`, fallbackError);
        }
      }

      return {
        success: false,
        data: this.getEmptyResult(),
        error: errorMessage,
        executionTime,
        usedFallback: false,
        confidence: 0
      };
    }
  }

  /**
   * Get current agent status
   */
  getStatus(): AgentStatus {
    return { ...this.status };
  }

  /**
   * Update agent status
   */
  protected updateStatus(
    status: AgentStatus['status'], 
    progress?: number, 
    message?: string
  ): void {
    this.status = {
      agent: this.config.name,
      status,
      progress,
      message
    };
  }

  /**
   * Abstract methods to be implemented by concrete agents
   */
  protected abstract analyze(input: TInput): Promise<TOutput>;
  protected abstract fallbackAnalyze(input: TInput): Promise<TOutput>;
  protected abstract validateInput(input: TInput): Promise<void>;
  protected abstract validateOutput(output: TOutput): Promise<void>;
  protected abstract calculateConfidence(result: TOutput): number;
  protected abstract getEmptyResult(): TOutput;

  /**
   * Configure agent settings
   */
  updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Reset agent to initial state
   */
  reset(): void {
    this.status = {
      agent: this.config.name,
      status: 'idle'
    };
  }

  /**
   * Check if agent is available for execution
   */
  isAvailable(): boolean {
    return this.config.enabled && this.status.status !== 'running';
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }
}