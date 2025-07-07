/**
 * @jest-environment jsdom
 */

import { ApiClient } from '../services/apiClient';

// Mock fetch for testing
global.fetch = jest.fn();

describe('ApiClient', () => {
  let apiClient: ApiClient;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    apiClient = new ApiClient('https://api.example.com');
    mockFetch.mockClear();
  });

  describe('_postRequest error handling', () => {
    it('should handle successful JSON response', async () => {
      const mockData = [{ id: '1', test: 'data' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockData),
      } as any);

      const result = await apiClient.post('/test', { data: 'test' });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle HTTP error with JSON error response', async () => {
      const errorResponse = { message: 'Validation failed' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce(errorResponse),
      } as any);

      await expect(apiClient.post('/test', { data: 'test' })).rejects.toThrow('Validation failed');
    });

    it('should handle HTTP error with non-JSON error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValueOnce(new Error('Not JSON')),
      } as any);

      await expect(apiClient.post('/test', { data: 'test' })).rejects.toThrow(
        'HTTP error! status: 500'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.post('/test', { data: 'test' })).rejects.toThrow('Network error');
    });

    it('should validate that response is an array', async () => {
      const invalidData = { not: 'an array' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(invalidData),
      } as any);

      await expect(apiClient.post('/test', { data: 'test' })).rejects.toThrow(
        'Expected array response from API'
      );
    });
  });

  describe('Authorization methods', () => {
    it('should set auth token in headers', async () => {
      apiClient.setAuthToken('test-token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([]),
      } as any);

      await apiClient.post('/test', { data: 'test' });

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      });
    });

    it('should clear auth token from headers', async () => {
      apiClient.setAuthToken('test-token');
      apiClient.clearAuthToken();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([]),
      } as any);

      await apiClient.post('/test', { data: 'test' });

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('Specialized methods', () => {
    it('should call analyzeDiffs with correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([]),
      } as any);

      const diffs = [{ id: '1' }];
      await apiClient.analyzeDiffs(diffs);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ diffs }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should call analyzeReviewerAlignment with correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([]),
      } as any);

      const diffs = [{ id: '1' }];
      const revisionRequests = 'Please improve methodology';
      await apiClient.analyzeReviewerAlignment(diffs, revisionRequests);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/analyze-reviewer-alignment',
        {
          method: 'POST',
          body: JSON.stringify({ diffs, revisionRequests }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });
  });
});
