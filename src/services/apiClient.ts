import type { AnalysisItem } from '@/types';

/**
 * Generic API client with robust error handling for both JSON and non-JSON responses
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
  }

  /**
   * Private helper method for POST requests with robust error handling
   * Handles both JSON and non-JSON error responses gracefully
   */
  private async _postRequest(
    endpoint: string,
    payload: object,
    logMessage: string,
    errorMessage: string
  ): Promise<AnalysisItem[]> {
    try {
      console.log(logMessage);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { ...this.defaultHeaders },
      });

      if (!response.ok) {
        // Handles both JSON and non-JSON error responses gracefully
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Validate that the response is an array as expected for AnalysisItem[]
      if (!Array.isArray(data)) {
        throw new Error('Expected array response from API');
      }

      return data;
    } catch (error) {
      console.error(errorMessage, error);
      throw error; // Optionally, log or handle timeout/AbortError differently
    }
  }

  /**
   * Example usage: analyze diffs via an external API endpoint
   */
  async analyzeDiffs(diffs: object[], endpoint: string = '/api/analyze'): Promise<AnalysisItem[]> {
    return this._postRequest(
      `${this.baseUrl}${endpoint}`,
      { diffs },
      'Sending diffs for analysis...',
      'Failed to analyze diffs:'
    );
  }

  /**
   * Example usage: analyze reviewer alignment via an external API endpoint
   */
  async analyzeReviewerAlignment(
    diffs: object[],
    revisionRequests: string,
    endpoint: string = '/api/analyze-reviewer-alignment'
  ): Promise<AnalysisItem[]> {
    return this._postRequest(
      `${this.baseUrl}${endpoint}`,
      { diffs, revisionRequests },
      'Sending reviewer alignment analysis request...',
      'Failed to analyze reviewer alignment:'
    );
  }

  /**
   * Generic POST request method using the helper
   */
  async post(endpoint: string, payload: object): Promise<AnalysisItem[]> {
    return this._postRequest(
      `${this.baseUrl}${endpoint}`,
      payload,
      `Making POST request to ${endpoint}...`,
      `POST request to ${endpoint} failed:`
    );
  }

  /**
   * Set authorization header for authenticated requests
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authorization header
   */
  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }
}

// Default export for convenience
export default ApiClient;
